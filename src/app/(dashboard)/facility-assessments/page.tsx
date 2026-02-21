'use client';

import TopBar from '@/components/TopBar';
import { useFacilityAssessments } from '@/lib/hooks/useFacilityAssessments';
import { Building2, ClipboardCheck, Wifi, Droplets, Users, Activity, TrendingUp } from 'lucide-react';

export default function FacilityAssessmentsPage() {
  const { assessments, summary, loading } = useFacilityAssessments();

  if (loading) return <><TopBar title="Facility Assessments" /><main className="flex-1 p-6 flex items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p></main></>;

  const scoreColor = (score: number) => score >= 70 ? '#2B6FE0' : score >= 50 ? '#FCD34D' : '#E52E42';
  const scoreBg = (score: number) => score >= 70 ? 'rgba(43,111,224,0.12)' : score >= 50 ? 'rgba(252,211,77,0.12)' : 'rgba(229,46,66,0.12)';

  return (
    <>
      <TopBar title="Facility Assessments" />
      <main className="flex-1 p-4 sm:p-5 overflow-auto page-enter">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Health Facility Assessments</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Service readiness, infrastructure, and data management evaluation</p>
        </div>

        {summary && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Facilities Assessed</p><p className="text-2xl font-bold" style={{ color: '#2B6FE0' }}>{summary.facilitiesAssessed}</p></div>
              <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Avg Overall Score</p><p className="text-2xl font-bold" style={{ color: scoreColor(summary.avgOverallScore) }}>{summary.avgOverallScore}%</p></div>
              <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>DHIS2 Adoption</p><p className="text-2xl font-bold" style={{ color: scoreColor(summary.facilitiesAssessed ? (summary.withDHIS2 / summary.facilitiesAssessed * 100) : 0) }}>{summary.withDHIS2}/{summary.facilitiesAssessed}</p></div>
              <div className="card-elevated p-4"><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Avg Reporting Completeness</p><p className="text-2xl font-bold" style={{ color: scoreColor(summary.avgReportingCompleteness) }}>{summary.avgReportingCompleteness}%</p></div>
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
                <tr key={a._id}>
                  <td className="font-medium text-sm">{a.facilityName.replace(' Hospital', '').replace(' Teaching', '')}</td>
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
                  <td>{a.hasCleanWater ? <Droplets className="w-3.5 h-3.5" style={{ color: '#2B6FE0' }} /> : <span className="text-xs" style={{ color: '#E52E42' }}>No</span>}</td>
                  <td className="text-xs font-mono">{a.assessmentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
