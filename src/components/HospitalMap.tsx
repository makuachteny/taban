'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { HospitalDoc } from '@/lib/db-types';
import { getMetricColorInterpolated, getPerformanceColor, type PerformanceMetricKey } from '@/lib/performance-colors';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path issue with Next.js/webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// South Sudan approximate boundary for the GeoJSON overlay
const SOUTH_SUDAN_BOUNDS: L.LatLngBoundsExpression = [
  [3.4, 24.0],  // SW
  [12.5, 36.0], // NE
];

const MAP_CENTER: L.LatLngExpression = [7.0, 30.0];
const MAP_ZOOM = 6;

// Facility type → marker size
const TYPE_SIZES: Record<string, number> = {
  national_referral: 22,
  state_hospital: 16,
  county_hospital: 12,
  phcc: 10,
  phcu: 8,
};

// Coverage radius by facility type (meters)
const COVERAGE_RADIUS: Record<string, number> = {
  national_referral: 15000,
  state_hospital: 12000,
  county_hospital: 10000,
  phcc: 7000,
  phcu: 5000,
};

function getMetricValue(hospital: HospitalDoc, metric: PerformanceMetricKey | null): number {
  if (!metric || !hospital.performance) return 50;
  const val = hospital.performance[metric as keyof typeof hospital.performance];
  if (metric === 'stockOutDays') return Math.max(0, 100 - (val as number) * 3.3);
  if (metric === 'opdVisitsPerMonth') return Math.min(100, (val as number) / 60);
  return val as number;
}

// Create custom marker icons colored by metric
function createMetricIcon(
  facilityType: string,
  metricValue: number,
  isSelected: boolean,
  operationalStatus?: string,
): L.DivIcon {
  const baseSize = TYPE_SIZES[facilityType] || 10;
  const selectedScale = isSelected ? 1.35 : 1;
  const scaledSize = Math.round(baseSize * selectedScale);
  const ringWidth = isSelected ? 3 : 2;
  const total = scaledSize + ringWidth * 2;

  const fillColor = getMetricColorInterpolated(metricValue);
  const ringColor = isSelected ? '#2563EB' : 'rgba(255,255,255,0.9)';
  const opacity = operationalStatus === 'non_functional' || operationalStatus === 'closed' ? 0.45 : 1;

  return L.divIcon({
    className: 'facility-marker',
    iconSize: [total, total],
    iconAnchor: [total / 2, total / 2],
    popupAnchor: [0, -(scaledSize / 2 + ringWidth)],
    html: `
      <div style="
        width: ${total}px;
        height: ${total}px;
        border-radius: 50%;
        background: ${fillColor};
        border: ${ringWidth}px solid ${ringColor};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3)${isSelected ? ', 0 0 0 4px rgba(37,99,235,0.25)' : ''};
        cursor: pointer;
        opacity: ${opacity};
        transition: transform 0.15s ease;
        ${isSelected ? 'z-index: 1000 !important;' : ''}
      "></div>
    `,
  });
}

// South Sudan state boundaries (simplified GeoJSON)
const SOUTH_SUDAN_STATES_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Central Equatoria' }, geometry: { type: 'Polygon', coordinates: [[[30.5, 3.5], [31.0, 3.5], [32.0, 3.8], [32.5, 4.2], [32.2, 4.8], [31.8, 5.2], [31.2, 5.5], [30.5, 5.3], [30.0, 5.0], [29.8, 4.5], [30.0, 3.8], [30.5, 3.5]]] } },
    { type: 'Feature', properties: { name: 'Eastern Equatoria' }, geometry: { type: 'Polygon', coordinates: [[[32.0, 3.8], [33.0, 3.5], [34.0, 3.8], [35.0, 4.2], [35.2, 4.8], [34.5, 5.5], [33.5, 5.5], [32.5, 5.2], [32.2, 4.8], [32.0, 3.8]]] } },
    { type: 'Feature', properties: { name: 'Western Equatoria' }, geometry: { type: 'Polygon', coordinates: [[[27.5, 4.0], [28.5, 3.5], [29.5, 3.5], [30.0, 3.8], [29.8, 4.5], [30.0, 5.0], [29.5, 5.5], [28.8, 5.8], [28.0, 5.5], [27.2, 5.0], [27.0, 4.5], [27.5, 4.0]]] } },
    { type: 'Feature', properties: { name: 'Lakes' }, geometry: { type: 'Polygon', coordinates: [[[29.0, 5.8], [29.5, 5.5], [30.5, 5.3], [31.2, 5.5], [31.8, 5.2], [31.8, 6.0], [31.5, 6.5], [31.0, 7.0], [30.5, 7.2], [29.8, 7.0], [29.2, 6.8], [29.0, 6.2], [29.0, 5.8]]] } },
    { type: 'Feature', properties: { name: 'Jonglei' }, geometry: { type: 'Polygon', coordinates: [[[31.0, 5.0], [32.5, 5.2], [34.0, 5.5], [34.5, 6.0], [34.5, 7.0], [34.0, 7.8], [33.5, 8.2], [33.0, 8.5], [32.5, 8.5], [32.0, 8.2], [31.5, 7.5], [31.0, 7.0], [31.5, 6.5], [31.8, 6.0], [31.8, 5.2], [31.0, 5.0]]] } },
    { type: 'Feature', properties: { name: 'Warrap' }, geometry: { type: 'Polygon', coordinates: [[[28.0, 7.0], [28.8, 6.8], [29.2, 6.8], [29.8, 7.0], [29.5, 7.5], [29.2, 8.0], [29.0, 8.5], [28.5, 8.8], [28.0, 8.5], [27.5, 8.2], [27.2, 7.8], [27.5, 7.3], [28.0, 7.0]]] } },
    { type: 'Feature', properties: { name: 'Unity' }, geometry: { type: 'Polygon', coordinates: [[[29.0, 7.8], [29.5, 7.5], [29.8, 7.0], [30.5, 7.2], [31.0, 7.0], [31.5, 7.5], [32.0, 8.2], [31.5, 8.8], [31.0, 9.2], [30.5, 9.5], [30.0, 9.5], [29.5, 9.2], [29.2, 8.8], [29.0, 8.5], [29.0, 7.8]]] } },
    { type: 'Feature', properties: { name: 'Upper Nile' }, geometry: { type: 'Polygon', coordinates: [[[31.0, 8.5], [31.5, 8.8], [32.0, 8.2], [32.5, 8.5], [33.0, 8.5], [33.5, 9.0], [34.0, 9.5], [34.5, 10.0], [34.0, 10.5], [33.5, 10.8], [33.0, 11.0], [32.5, 11.2], [32.0, 11.0], [31.5, 10.5], [31.0, 10.0], [30.5, 9.5], [31.0, 9.2], [31.0, 8.5]]] } },
    { type: 'Feature', properties: { name: 'Northern Bahr el Ghazal' }, geometry: { type: 'Polygon', coordinates: [[[27.0, 8.0], [27.5, 8.2], [28.0, 8.5], [28.5, 8.8], [29.0, 8.5], [29.2, 8.8], [29.5, 9.2], [29.5, 9.8], [29.0, 10.2], [28.5, 10.5], [28.0, 10.5], [27.5, 10.2], [27.0, 9.8], [26.5, 9.5], [26.2, 9.0], [26.5, 8.5], [27.0, 8.0]]] } },
    { type: 'Feature', properties: { name: 'Western Bahr el Ghazal' }, geometry: { type: 'Polygon', coordinates: [[[25.0, 7.0], [25.5, 6.5], [26.0, 6.0], [26.5, 5.5], [27.0, 5.0], [27.2, 5.0], [27.5, 5.3], [28.0, 5.5], [28.8, 5.8], [29.0, 5.8], [29.0, 6.2], [28.8, 6.8], [28.0, 7.0], [27.5, 7.3], [27.2, 7.8], [27.0, 8.0], [26.5, 8.5], [26.0, 8.5], [25.5, 8.0], [25.0, 7.5], [25.0, 7.0]]] } },
  ],
};

export interface MapViewProps {
  hospitals: HospitalDoc[];
  selectedId: string | null;
  onSelect: (hospital: HospitalDoc) => void;
  colorMetric?: PerformanceMetricKey | null;
  showCoverageCircles?: boolean;
  choroplethMetric?: PerformanceMetricKey | null;
  choroplethData?: Record<string, number>;
}

// Component to fly to selected marker
function FlyToSelected({ hospital }: { hospital: HospitalDoc | null }) {
  const map = useMap();

  useEffect(() => {
    if (hospital && hospital.lat && hospital.lng) {
      map.flyTo([hospital.lat, hospital.lng], 8, { duration: 0.8 });
    }
  }, [hospital, map]);

  return null;
}

// Component to fit bounds on load
function FitBoundsOnLoad() {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!fitted.current) {
      map.fitBounds(SOUTH_SUDAN_BOUNDS, { padding: [20, 20] });
      fitted.current = true;
    }
  }, [map]);

  return null;
}

const TYPE_LABELS: Record<string, string> = {
  national_referral: 'National Referral',
  state_hospital: 'State Hospital',
  county_hospital: 'County Hospital',
  phcc: 'PHCC',
  phcu: 'PHCU',
};

const STATUS_COLORS: Record<string, string> = {
  functional: '#3ECF8E',
  partially_functional: '#F59E0B',
  non_functional: '#EF4444',
  closed: '#94A3B8',
};

export default function MapView({
  hospitals,
  selectedId,
  onSelect,
  colorMetric = null,
  showCoverageCircles = false,
  choroplethMetric = null,
  choroplethData,
}: MapViewProps) {
  const selectedHospital = useMemo(
    () => hospitals.find(h => h._id === selectedId) || null,
    [hospitals, selectedId]
  );

  const defaultStateStyle = {
    fillColor: 'rgba(13,148,136,0.08)',
    fillOpacity: 1,
    color: 'rgba(13,148,136,0.3)',
    weight: 1.5,
    dashArray: '4 2',
  };

  const choroplethStyle = (feature: GeoJSON.Feature | undefined) => {
    if (!choroplethMetric || !choroplethData || !feature?.properties?.name) {
      return defaultStateStyle;
    }
    const stateName = feature.properties.name as string;
    const value = choroplethData[stateName];
    if (value === undefined) return defaultStateStyle;

    return {
      fillColor: getMetricColorInterpolated(value),
      fillOpacity: 0.35,
      color: getPerformanceColor(value),
      weight: 2,
      dashArray: '',
    };
  };

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      className="h-full w-full"
      style={{ background: 'var(--bg-primary)' }}
      zoomControl={true}
      minZoom={5}
      maxZoom={13}
      maxBounds={[
        [1.0, 22.0],
        [14.0, 38.0],
      ]}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* State boundaries - choropleth when metric enabled */}
      <GeoJSON
        key={choroplethMetric || 'default'}
        data={SOUTH_SUDAN_STATES_GEOJSON}
        style={choroplethStyle}
        onEachFeature={(feature, layer) => {
          if (feature.properties?.name) {
            const stateName = feature.properties.name;
            const value = choroplethData?.[stateName];
            const label = choroplethMetric && value !== undefined
              ? `${stateName}: ${Math.round(value)}%`
              : stateName;
            layer.bindTooltip(label, {
              permanent: false,
              direction: 'center',
              className: 'state-label-tooltip',
            });
          }
        }}
      />

      {/* Coverage circles */}
      {showCoverageCircles && hospitals.map(hospital => {
        if (!hospital.lat || !hospital.lng) return null;
        const radius = COVERAGE_RADIUS[hospital.facilityType] || 5000;
        const metricVal = getMetricValue(hospital, colorMetric);
        return (
          <Circle
            key={`cov-${hospital._id}`}
            center={[hospital.lat, hospital.lng]}
            radius={radius}
            pathOptions={{
              color: getMetricColorInterpolated(metricVal),
              fillColor: getMetricColorInterpolated(metricVal),
              fillOpacity: 0.08,
              weight: 1,
              dashArray: '4 3',
            }}
          />
        );
      })}

      {/* Hospital markers */}
      {hospitals.map(hospital => {
        if (!hospital.lat || !hospital.lng) return null;
        const isSelected = hospital._id === selectedId;
        const metricVal = getMetricValue(hospital, colorMetric);
        const icon = createMetricIcon(hospital.facilityType, metricVal, isSelected, hospital.operationalStatus);

        return (
          <Marker
            key={hospital._id}
            position={[hospital.lat, hospital.lng]}
            icon={icon}
            zIndexOffset={isSelected ? 1000 : hospital.facilityType === 'national_referral' ? 100 : 0}
            eventHandlers={{
              click: () => onSelect(hospital),
            }}
          >
            <Popup closeButton={false} className="facility-popup">
              <div style={{ minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: 'var(--accent-light)',
                    color: '#3B82F6',
                  }}>
                    {TYPE_LABELS[hospital.facilityType] || hospital.facilityType}
                  </span>
                  {hospital.operationalStatus && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: STATUS_COLORS[hospital.operationalStatus] || '#94A3B8',
                    }} />
                  )}
                </div>
                <p style={{ fontWeight: 600, fontSize: '12px', margin: '0 0 2px 0' }}>{hospital.name}</p>
                <p style={{ fontSize: '10px', color: '#64748B', margin: '0 0 4px 0' }}>
                  {hospital.town}, {hospital.state}
                </p>
                {hospital.performance && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.04)',
                    fontSize: '10px',
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getMetricColorInterpolated(metricVal),
                    }} />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Score: {Math.round(metricVal)}%
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <span>{hospital.totalBeds} beds</span>
                  <span>{hospital.doctors} doctors</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <FitBoundsOnLoad />
      <FlyToSelected hospital={selectedHospital} />
    </MapContainer>
  );
}
