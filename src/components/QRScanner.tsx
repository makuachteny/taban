'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, ScanLine } from '@/components/icons/lucide';

interface QRScannerProps {
  onScan: (data: { id: string; hospitalNumber?: string }) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const hasProcessed = useRef(false);

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'Taban_PATIENT' && data.id) {
        onScan({ id: data.id, hospitalNumber: data.hn });
      } else {
        setError('Invalid QR code. Please scan a Taban patient QR code.');
        hasProcessed.current = false;
      }
    } catch {
      // Not JSON — try treating the raw text as a patient ID
      if (decodedText.startsWith('patient_')) {
        onScan({ id: decodedText });
      } else {
        setError('Unrecognized QR code format.');
        hasProcessed.current = false;
      }
    }
  }, [onScan]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!scannerRef.current) return;

        scanner = new Html5Qrcode('qr-reader');
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          handleScanSuccess,
          () => {} // ignore scan failures (no QR in frame)
        );
        setScanning(true);
      } catch (err) {
        console.error('QR scanner error:', err);
        const msg = err instanceof Error ? err.message : '';
        setError(
          msg.includes('NotAllowedError') || msg.includes('Permission')
            ? 'Camera permission denied. Please allow camera access and try again.'
            : 'Unable to start camera. Please ensure your device has a camera.'
        );
      }
    }

    startScanner();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear();
      }
    };
  }, [handleScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" style={{ color: 'var(--taban-blue)' }} />
            <h3 className="text-sm font-semibold">Scan Patient QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner viewport */}
        <div className="relative" style={{ minHeight: 320 }}>
          <div id="qr-reader" ref={scannerRef} className="w-full" />

          {!scanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Camera className="w-10 h-10 animate-pulse" style={{ color: 'var(--taban-blue)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Starting camera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(229,46,66,0.1)' }}>
                <X className="w-6 h-6" style={{ color: 'var(--color-danger)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
              <button
                onClick={onClose}
                className="btn btn-secondary text-xs mt-2"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 text-center border-t" style={{ borderColor: 'var(--border-light)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Point the camera at a patient&apos;s QR code to retrieve their records
          </p>
        </div>
      </div>
    </div>
  );
}
