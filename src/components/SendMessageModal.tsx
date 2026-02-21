'use client';

import { useState } from 'react';
import { X, Send, MessageSquare, Smartphone, Radio } from 'lucide-react';
import { useMessages } from '@/lib/hooks/useMessages';
import { useApp } from '@/lib/context';

interface PatientInfo {
  _id: string;
  firstName: string;
  middleName?: string;
  surname: string;
  phone: string;
}

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientInfo | null;
}

const quickMessages = [
  'Your lab results are ready',
  'Your medicine is ready at pharmacy',
  'Please come for follow-up',
];

export default function SendMessageModal({ isOpen, onClose, patient }: SendMessageModalProps) {
  const [channel, setChannel] = useState<'app' | 'sms' | 'both'>('app');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { send } = useMessages();
  const { currentUser } = useApp();

  if (!isOpen || !patient) return null;

  const patientName = `${patient.firstName} ${patient.middleName || ''} ${patient.surname}`.replace(/\s+/g, ' ').trim();
  const isSMS = channel === 'sms' || channel === 'both';
  const charCount = body.length;

  const handleSend = async () => {
    if (!body.trim() || !currentUser) return;
    setSending(true);
    try {
      await send({
        patientId: patient._id,
        patientName,
        patientPhone: patient.phone,
        fromDoctorId: currentUser._id || `user-${currentUser.username}`,
        fromDoctorName: currentUser.name,
        fromHospitalName: currentUser.hospitalName || currentUser.hospital?.name || '',
        subject: subject || 'Message from Doctor',
        body: body.trim(),
        channel,
        sentAt: new Date().toISOString(),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setBody('');
        setSubject('');
        setChannel('app');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleQuickMessage = (msg: string) => {
    setBody(msg);
    if (!subject) setSubject(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" style={{ color: 'var(--taban-blue)' }} />
            <h2 className="font-semibold text-base">Send Message</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Recipient */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Recipient</label>
            <div className="p-3 rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{patientName}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{patient.phone}</p>
            </div>
          </div>

          {/* Channel */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>Channel</label>
            <div className="flex gap-2">
              {([
                { value: 'app' as const, label: 'App', icon: Smartphone },
                { value: 'sms' as const, label: 'SMS', icon: MessageSquare },
                { value: 'both' as const, label: 'Both', icon: Radio },
              ]).map(opt => (
                <button key={opt.value} onClick={() => setChannel(opt.value)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: channel === opt.value ? 'rgba(43,111,224,0.15)' : 'var(--overlay-subtle)',
                    color: channel === opt.value ? 'var(--taban-blue)' : 'var(--text-secondary)',
                    border: channel === opt.value ? '1px solid rgba(43,111,224,0.3)' : '1px solid transparent',
                  }}>
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Message subject..."
              className="w-full p-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
            />
          </div>

          {/* Quick Messages */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>Quick Messages</label>
            <div className="flex flex-wrap gap-2">
              {quickMessages.map(msg => (
                <button key={msg} onClick={() => handleQuickMessage(msg)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{ background: 'var(--overlay-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Message</label>
              {isSMS && (
                <span className="text-xs" style={{ color: charCount > 160 ? 'var(--taban-red)' : 'var(--text-muted)' }}>
                  {charCount}/160
                </span>
              )}
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full p-3 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--overlay-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
            />
            {isSMS && charCount > 160 && (
              <p className="text-xs mt-1" style={{ color: 'var(--taban-red)' }}>
                SMS messages are limited to 160 characters. Message will be split into {Math.ceil(charCount / 160)} parts.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="btn btn-primary btn-sm flex items-center gap-2"
            style={{ opacity: !body.trim() || sending ? 0.5 : 1 }}
          >
            {sent ? (
              <>Sent!</>
            ) : sending ? (
              <>Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send Message</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
