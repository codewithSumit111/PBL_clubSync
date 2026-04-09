import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, ScanLine } from 'lucide-react';

interface QRCodeScannerProps {
    active: boolean;
    onScan: (value: string) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ active, onScan }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanLockRef = useRef(false);
    const [status, setStatus] = useState('Waiting for camera access');
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        if (!active) {
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            return;
        }

        let intervalId: number | undefined;
        let cancelled = false;

        const stopStream = () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        };

        const startScanner = async () => {
            try {
                setCameraError(null);
                setStatus('Requesting camera access');

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                const BarcodeDetectorCtor = (window as any).BarcodeDetector;
                if (!BarcodeDetectorCtor) {
                    setStatus('BarcodeDetector is not supported in this browser');
                    return;
                }

                const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
                setStatus('Point the camera at the QR code');

                intervalId = window.setInterval(async () => {
                    if (scanLockRef.current || !videoRef.current) {
                        return;
                    }

                    try {
                        const codes = await detector.detect(videoRef.current);
                        const rawValue = codes?.[0]?.rawValue;
                        if (rawValue) {
                            scanLockRef.current = true;
                            setStatus('QR detected');
                            onScan(rawValue);
                        }
                    } catch {
                        // Ignore frame-level scan errors and keep scanning.
                    }
                }, 900);
            } catch {
                setCameraError('Camera access failed. Use the manual token field below.');
                setStatus('Camera unavailable');
                stopStream();
            }
        };

        startScanner();

        return () => {
            cancelled = true;
            if (intervalId) {
                window.clearInterval(intervalId);
            }
            stopStream();
            scanLockRef.current = false;
        };
    }, [active, onScan]);

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-black shadow-2xl shadow-teal-100">
                <video ref={videoRef} className="h-80 w-full object-cover" muted playsInline />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <ScanLine size={16} className="text-teal-600" />
                <span>{status}</span>
            </div>
            {cameraError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                    <Camera size={16} />
                    {cameraError}
                </div>
            )}
            <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
                <RefreshCw size={14} /> Restart Scanner
            </button>
        </div>
    );
};