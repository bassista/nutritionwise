
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from '@/context/LocaleContext';

// Polyfill for BarcodeDetector if it's not available
interface BarcodeDetector {
  new (options?: { formats: string[] }): BarcodeDetector;
  detect(image: ImageBitmapSource): Promise<any[]>;
  getSupportedFormats(): Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector: BarcodeDetector;
  }
}

interface UseBarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  toast: (options: {
    variant?: 'default' | 'destructive';
    title: string;
    description?: string;
  }) => void;
}

export function useBarcodeScanner({ onScanSuccess, toast }: UseBarcodeScannerProps) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  }, []);

  const startScan = useCallback(async () => {
    setIsScanning(true);
    if (hasCameraPermission) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error restarting camera:', error);
      }
    }
  }, [hasCameraPermission]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        toast({ variant: 'destructive', title: t('Camera not supported'), description: t('Your browser does not support camera access.') });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: t('Camera Access Denied'), description: t('Please enable camera permissions in your browser settings to use this app.') });
      }
    };

    getCameraPermission();

    return () => {
      stopScan();
    };
  }, [t, toast, stopScan]);

  useEffect(() => {
    let detector: BarcodeDetector | undefined;
    let animationFrameId: number;

    if (!isScanning || !hasCameraPermission) {
      return;
    }

    if (typeof window.BarcodeDetector === 'undefined') {
      toast({ variant: 'destructive', title: t('Scanner Not Supported'), description: t('The Barcode Detector API is not supported in this browser.') });
      setIsScanning(false);
      return;
    }

    try {
      detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    } catch (e) {
      toast({ variant: 'destructive', title: t('Scanner Init Failed'), description: t('Could not initialize the barcode scanner.') });
      setIsScanning(false);
      return;
    }

    const scanLoop = async () => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.videoWidth > 0 && videoRef.current.readyState >= 3 && detector && isScanning) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const detectedBarcode = barcodes[0].rawValue;
            stopScan();
            onScanSuccess(detectedBarcode);
          }
        } catch (e) {
          console.error('Barcode detection failed:', e);
        }
      }
      if (isScanning) {
        animationFrameId = requestAnimationFrame(scanLoop);
      }
    };

    scanLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, hasCameraPermission, t, toast, onScanSuccess, stopScan]);

  return {
    videoRef,
    hasCameraPermission,
    isScanning,
    startScan,
    stopScan,
  };
}
