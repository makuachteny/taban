'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { useFacilityAssessments } from '@/lib/hooks/useFacilityAssessments';
import { Building2, ClipboardCheck, Wifi, Droplets, Users, Activity, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

export default function FacilityAssessmentsPage() {
  const { assessments, summary, loading } = useFacilityAssessments();
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);

  if (loading) return <><TopBar title="Facility Assessments" /><main className="page-container flex items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p></main></>;

  const scoreColor = (score: number) => score >= 70 ? '#0077D7' : score >= 50 ? '#FCD34D' : '#E52E42';
  const scoreBg = (score: number) => score >= 70 ? 'rgba(43,111,224,0.12)' : score >= 50 ? 'rgba(252,211,77,0.12)' : 'rgba(229,46,66,0.12)';

  return (
    <>
      <TopBar title="Facility Assessments" />
      <main className="page-container page-enter">
        <div className="page-header mb-6">
          <div className="page-header__top">
            <div className="page-header__icon"><ClipboardCheck size={18} /></div>
            <h1 className="page-header__title">Health Facility Assessments</h1>
          </div>
          <p className="page-header__subtitle">Service readiness, infrastructure, and data management evaluation</p>
        </div>

        {summary && (
          <>
            {/* Summary cards */}
            <div className="kpi-grid mb-6">
              {[
                { label: 'Facilities Assessed', value: summary.facilitiesAssessed, icon: Building2, color: 'var(--accent-primary)', bg: 'rgba(43,111,224,0.12)' },
                { label: 'Avg Overall Score', value: `${summary.avgOverallScore}%`, icon: ClipboardCheck, color: scoreColor(summary.avgOverallScore), bg: scoreBg(summary.avgOverallScore) },
                { label: 'DHIS2 Adoption', value: `${summary.withDHIS2}/${summary.facilitiesAssessed}`, icon: Wifi, color: scoreColor(summary.facilitiesAssessed ? (summary.withDHIS2 / summary.facilitiesAssessed * 100) : 0), bg: scoreBg(summary.facilitiesAssessed ? (summary.withDHIS2 / summary.facilitiesAssessed * 100) : 0) },
                { label: 'Avg Reporting Completeness', value: `${summary.avgReportingCompleteness}%`, icon: Activity, color: scoreColor(summary.avgReportingCompleteness), bg: scoreBg(summary.avgReportingCompleteness) },
              ].map(stat => (
                <div key={stat.label} className="kpi">
                  <div className="kpi__icon" style={{ background: stat.bg }}>
                    <stat.icon style={{ color: stat.color }} />
                  </div>
                  <div className="kpi__body">
                    <div className="kpi__value">{stat.value}</div>
                    <div className="kpi__label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* National averages */}
            <div className="card-elevated p-4 mb-6">
              <h3 className="font-semibold text-sm mb-4">National Average Scores by Domain</h3>
              <div className="space-y-3">
                {[
                  { label: 'General Equipment', score: summary.avgEquipmentScore, icon: ClipboardCheck },
                  { label: 'Diagnostic Capacity', score: summary.avgDiagnosticScore, icon: Activity },
                  { label: 'Essential Medicines', score: summary.avgMedicinesScore, icon: TrendingUp },
                  { label: 'Staffing Adequacy', score: summary.avgStaffingScore, icon: Users },
                  { label: 'Data Quality', score: summary.avgDataQuality, icon: Wifi },
                  { label: 'Reporting Completeness', score: summary.avgReportingCompleteness, icon: Building2 },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs w-44" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <div className="flex-1 h-3 rounded-full" style={{ background: 'var(--overlay-light)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${item.score}%`, background: scoreColor(item.score) }} />
                    </div>
                    <span className="text-sm font-bold w-12 text-right" style={{ color: scoreColor(item.score) }}>{item.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Facility detail table */}
        <div className="card-elevated overflow-hidden">
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <h3 className="font-semibold text-sm">Individual Facility Assessments</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>State</th>
                <th>Overall</th>
                <th>Equipment</th>
                <th>Diagnostics</th>
                <th>Medicines</th>
                <th>Staffing</th>
                <th>Reporting</th>
                <th>Data Quality</th>
                <th>DHIS2</th>
                <th>HIS Staff</th>
                <th>Water</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(assessments || []).map(a => (
                <tr key={a._id} className="cursor-pointer hover:bg-[var(--table-row-hover)]" onClick={() => setExpandedAssessment(expandedAssessment === a._id ? null : a._id)}>
                  <td className="font-medium text-sm" style={{ color: 'var(--accent-primary)' }}>{a.facilityName.replace(' Hospital', '').replace(' Teaching', '')}</td>
                  <td className="text-xs">{a.state}</td>
                  <td><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: scoreBg(a.overallScore), color: scoreColor(a.overallScore) }}>{a.overallScore}%</span></td>
                  <td className="text-xs" style={{ color: scoreColor(a.generalEquipmentScore) }}>{a.generalEquipmentScore}%</td>
                  <td className="text-xs" style={{ color: scoreColor(a.diagnosticCapacityScore) }}>{a.diagnosticCapacityScore}%</td>
                  <td className="text-xs" style={{ color: scoreColor(a.essentialMedicinesScore) }}>{a.essentialMedicinesScore}%</td>
                  <td className="text-xs" style={{ color: scoreColor(a.staffingScore) }}>{a.staffingScore}%</td>
                  <td className="text-xs" style={{ color: scoreColor(a.reportingCompleteness) }}>{a.reportingCompleteness}%</td>
                  <td className="text-xs" style={{ color: scoreColor(a.dataQualityScore) }}>{a.dataQualityScore}%</td>
                  <td>{a.hasDHIS2Reporting ? <span className="badge badge-normal text-[10px]">Yes</span> : <span className="badge badge-warning text-[10px]">No</span>}</td>
                  <td className="text-sm text-center">{a.hisStaffCount} ({a.hisStaffTrained})</td>
                  <td>{a.hasCleanWater ? <Droplets className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} /> : <span className="text-xs" style={{ color: '#E52E42' }}>No</span>}</td>
                  <td className="text-xs font-mono">
                    <div className="flex items-center gap-1">
                      {a.assessmentDate}
                      {expandedAssessment === a._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </td>
                </tr>
              ))}
              {expandedAssessment && (() => {
                const a = (assessments || []).find(x => x._id === expandedAssessment);
                if (!a) return null;
                return (
                  <tr>
                    <td colSpan={13} style={{ background: 'var(--overlay-subtle)', padding: 0 }}>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Facility</span>{a.facilityName}</div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Assessed By</span>{a.assessedBy}</div>
                          <div><span className="font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>Assessment Date</span>{a.assessmentDate}</div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Clean Water', value: a.hasCleanWater },
                            { label: 'Sanitation', value: a.hasSanitation },
                            { label: 'Waste Management', value: a.hasWasteManagement },
                            { label: 'Emergency Transport', value: a.hasEmergencyTransport },
                            { label: 'Communication', value: a.hasCommunication },
                            { label: 'Patient Registers', value: a.hasPatientRegisters },
                            { label: 'DHIS2 Reporting', value: a.hasDHIS2Reporting },
                          ].map(item => (
                            <div key={item.label} className="flex items-center gap-2 text-xs">
                              <span className="w-2 h-2 rounded-full" style={{ background: item.value ? '#0077D7' : '#E52E42' }} />
                              <span>{item.label}: {item.value ? 'Yes' : 'No'}</span>
                            </div>
                          ))}
                        </div>
                        {a.recommendations && (
                          <div className="p-3 rounded-lg" style={{ background: 'rgba(43,111,224,0.06)', border: '1px solid var(--accent-border)' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Recommendations</p>
                            <p className="text-xs">{a.recommendations}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
