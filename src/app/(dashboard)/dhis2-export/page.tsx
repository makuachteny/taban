'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { Database, Download, FileJson, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';

export default function DHIS2ExportPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ format: string; rows: number; date: string } | null>(null);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const { generateDHIS2Export, exportToJSON, exportToCSV } = await import('@/lib/services/dhis2-export-service');
      const dataset = await generateDHIS2Export(period);
      const content = format === 'json' ? exportToJSON(dataset) : exportToCSV(dataset);
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhis2-export-${period}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportResult({ format: format.toUpperCase(), rows: dataset.dataValues?.length ?? 0, date: new Date().toLocaleString() });
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <TopBar title="DHIS2 Export" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Database className="w-6 h-6" style={{ color: '#2B6FE0' }} />
            <h1 className="text-xl font-semibold">DHIS2 Data Export</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Export aggregated health data in DHIS2-compatible format for national reporting</p>
        </div>

        <div className="max-w-2xl">
          {/* Export Configuration */}
          <div className="card-elevated p-6 mb-6">
            <h3 className="font-semibold text-sm mb-4">Export Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Reporting Period</label>
                <input
                  type="month"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="w-full p-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>Data Elements Included</label>
                <div className="space-y-1.5">
                  {[
                    'Population health indicators (hospitals, patients, beds, staff)',
                    'CRVS — births registered, deaths registered, ICD-11 coded',
                    'Maternal, neonatal, and under-5 mortality',
                    'Death notification and registration rates',
                    'Disease surveillance alerts and referrals',
                    'Data quality (completeness, timeliness, accuracy)',
                    'DHIS2 adoption and HIS workforce',
                    'Per-facility births and deaths',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#2B6FE0' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="card-elevated p-6 mb-6">
            <h3 className="font-semibold text-sm mb-4">Export Format</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="p-4 rounded-lg border text-left transition-all"
                style={{ borderColor: 'var(--border-light)', background: 'var(--overlay-subtle)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileJson className="w-5 h-5" style={{ color: '#2B6FE0' }} />
                  <span className="font-semibold text-sm">JSON Format</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>DHIS2-compatible JSON data value set for API import</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium" style={{ color: '#2B6FE0' }}>
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download .json
                </div>
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="p-4 rounded-lg border text-left transition-all"
                style={{ borderColor: 'var(--border-light)', background: 'var(--overlay-subtle)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileSpreadsheet className="w-5 h-5" style={{ color: '#2B6FE0' }} />
                  <span className="font-semibold text-sm">CSV Format</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Flat CSV for Excel, Google Sheets, or DHIS2 bulk import</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium" style={{ color: '#2B6FE0' }}>
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download .csv
                </div>
              </button>
            </div>
          </div>

          {/* Last Export Result */}
          {exportResult && (
            <div className="card-elevated p-4" style={{ background: 'rgba(43,111,224,0.06)', border: '1px solid rgba(43,111,224,0.15)' }}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4" style={{ color: '#2B6FE0' }} />
                <span className="font-semibold text-sm" style={{ color: '#2B6FE0' }}>Export Successful</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Exported {exportResult.rows} data values in {exportResult.format} format · Period: {period} · {exportResult.date}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
