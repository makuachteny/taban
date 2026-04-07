'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import SendMessageModal from '@/components/SendMessageModal';
import { useMessages } from '@/lib/hooks/useMessages';
import { usePatients } from '@/lib/hooks/usePatients';
import {
  MessageSquare, Search, Plus, Smartphone, Radio,
  CheckCircle2, Clock, XCircle, Filter
} from 'lucide-react';

export default function MessagesPage() {
  const { messages, loading } = useMessages();
  const { patients } = usePatients();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'app' | 'sms' | 'both'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ _id: string; firstName: string; middleName?: string; surname: string; phone: string } | null>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const filtered = messages.filter(m => {
    if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
    if (searchQuery && !m.patientName.toLowerCase().includes(searchQuery.toLowerCase()) && !m.body.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#0077D7' }} />;
      case 'sent': return <Clock className="w-3.5 h-3.5" style={{ color: '#FCD34D' }} />;
      case 'failed': return <XCircle className="w-3.5 h-3.5" style={{ color: '#E52E42' }} />;
      default: return null;
    }
  };

  const channelLabel = (ch: string) => {
    switch (ch) {
      case 'app': return <span className="flex items-center gap-1 text-xs"><Smartphone className="w-3 h-3" /> App</span>;
      case 'sms': return <span className="flex items-center gap-1 text-xs"><MessageSquare className="w-3 h-3" /> SMS</span>;
      case 'both': return <span className="flex items-center gap-1 text-xs"><Radio className="w-3 h-3" /> Both</span>;
      default: return ch;
    }
  };

  const handleNewMessage = () => {
    setShowPatientPicker(true);
  };

  const handleSelectPatient = (p: typeof patients[0]) => {
    setSelectedPatient({ _id: p._id, firstName: p.firstName, middleName: p.middleName, surname: p.surname, phone: p.phone });
    setShowPatientPicker(false);
    setPatientSearch('');
    setShowModal(true);
  };

  const filteredPatients = patients.filter(p =>
    !patientSearch || `${p.firstName} ${p.middleName} ${p.surname}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.hospitalNumber.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 8);

  return (
    <>
      <TopBar title="Messages" />
      <main className="page-container page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="page-header">
            <div className="page-header__top">
              <div className="page-header__icon"><MessageSquare size={18} /></div>
              <h1 className="page-header__title">Messages</h1>
            </div>
            <p className="page-header__subtitle">Send messages to patients via app or SMS</p>
          </div>
          <button onClick={handleNewMessage} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
            <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by patient name or message..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 mr-1" style={{ color: 'var(--text-muted)' }} />
            {(['all', 'app', 'sms', 'both'] as const).map(ch => (
              <button key={ch} onClick={() => setChannelFilter(ch)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: channelFilter === ch ? 'rgba(43,111,224,0.15)' : 'transparent',
                  color: channelFilter === ch ? 'var(--taban-blue)' : 'var(--text-muted)',
                }}>
                {ch === 'all' ? 'All' : ch.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Table */}
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading messages...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Message</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>From</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(msg => (
                  <tr key={msg._id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => { if (msg.patientId) router.push(`/patients/${msg.patientId}`); }}>
                    <td>
                      <div>
                        <p className="font-medium text-sm">{msg.patientName}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{msg.patientPhone}</p>
                      </div>
                    </td>
                    <td>
                      <div className="max-w-xs">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{msg.subject}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{msg.body}</p>
                      </div>
                    </td>
                    <td>{channelLabel(msg.channel)}</td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs font-medium capitalize">
                        {statusIcon(msg.status)} {msg.status}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{msg.fromDoctorName}</td>
                    <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(msg.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Patient Picker Modal */}
      {showPatientPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <h3 className="font-semibold text-sm">Select Patient</h3>
              <button onClick={() => { setShowPatientPicker(false); setPatientSearch(''); }} className="text-xs" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2" style={{ background: 'var(--overlay-subtle)', border: '1px solid var(--border-light)' }}>
                <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredPatients.map(p => (
                  <button key={p._id} onClick={() => handleSelectPatient(p)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-white/[0.05] transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: p.gender === 'Male' ? 'var(--taban-blue)' : 'var(--taban-sky)' }}>
                      {(p.firstName || '?')[0]}{(p.surname || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.firstName} {p.middleName} {p.surname}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.phone} · {p.hospitalNumber}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <SendMessageModal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedPatient(null); }} patient={selectedPatient} />
    </>
  );
}
