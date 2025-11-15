
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
  const streamRef = useRef<MediaStream | null>(null);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startScan = useCallback(() => {
    async function getCameraPermission() {
      if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: t('Scanner Not Supported'), description: t('This device does not support camera access.') });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsScanning(true);
      } catch (error) {
        console.error('Error starting camera:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: t('Camera Access Denied'), description: t('Please enable camera permissions in your browser settings to use this app.') });
      }
    }
    getCameraPermission();
  }, [t, toast]);

  useEffect(() => {
    startScan();
    return () => {
      stopScan();
    };
  }, [startScan, stopScan]);

  useEffect(() => {
    let detector: BarcodeDetector | undefined;
    let animationFrameId: number;

    if (typeof window.BarcodeDetector === 'undefined') {
      if (isScanning && hasCameraPermission) {
        toast({ variant: 'destructive', title: t('Scanner Not Supported'), description: t('The Barcode Detector API is not supported in this browser.') });
        setIsScanning(false);
      }
      return;
    }

    try {
      detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    } catch (e) {
      if (isScanning && hasCameraPermission) {
        toast({ variant: 'destructive', title: t('Scanner Init Failed'), description: t('Could not initialize the barcode scanner.') });
        setIsScanning(false);
      }
      return;
    }

    const scanLoop = async () => {
      if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) {
        if(isScanning) animationFrameId = requestAnimationFrame(scanLoop);
        return;
      }
      
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const detectedBarcode = barcodes[0].rawValue;
          onScanSuccess(detectedBarcode);
          stopScan(); 
          return;
        }
      } catch (e) {
        console.error('Barcode detection failed:', e);
      }
      
      if(isScanning) animationFrameId = requestAnimationFrame(scanLoop);
    };

    if (isScanning && hasCameraPermission) {
      scanLoop();
    }

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
