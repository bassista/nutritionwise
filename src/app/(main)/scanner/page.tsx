
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { FoodForm } from '@/components/food/FoodForm';
import { getFoodName } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function ScannerPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const { foods } = useAppContext();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);

  const existingFood = scannedBarcode ? foods.find(f => f.id === scannedBarcode) : undefined;

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        toast({
          variant: 'destructive',
          title: t('Camera not supported'),
          description: t('Your browser does not support camera access.'),
        });
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
        toast({
          variant: 'destructive',
          title: t('Camera Access Denied'),
          description: t('Please enable camera permissions in your browser settings to use this app.'),
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [t, toast]);
  
  useEffect(() => {
    let detector: BarcodeDetector | undefined;
    let animationFrameId: number;

    if (!('BarcodeDetector' in window)) {
      toast({
        variant: 'destructive',
        title: 'Scanner Not Supported',
        description: t('The Barcode Detector API is not supported in this browser.'),
      });
      setIsScanning(false);
      return;
    }

    try {
      detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    } catch (e) {
       toast({
        variant: 'destructive',
        title: 'Scanner Not Supported',
        description: t('The Barcode Detector API is not supported in this browser.'),
      });
      setIsScanning(false);
      return;
    }

    const scan = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && detector && isScanning) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const detectedBarcode = barcodes[0].rawValue;
            setScannedBarcode(detectedBarcode);
            setIsScanning(false);
            toast({
              title: t('Barcode detected!'),
              description: `${t('Scanned barcode: {barcode}', { barcode: detectedBarcode })}`,
            });
            // Stop camera after successful scan
             if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
             }
          }
        } catch (e) {
          console.error('Barcode detection failed:', e);
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    if (isScanning && hasCameraPermission) {
      scan();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, hasCameraPermission, t, toast]);

  const handleScanAgain = () => {
    setScannedBarcode(null);
    setIsScanning(true);
    // Restart camera
    const getCameraPermission = async () => {
       try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) { console.error('Error restarting camera:', error); }
    }
    getCameraPermission();
  };

  const handleFormSubmitted = () => {
    router.push('/foods');
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('Barcode Scanner')} />
      <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
        <div className="max-w-md mx-auto">
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>{t('Camera Access Required')}</AlertTitle>
              <AlertDescription>
                {t('Please allow camera access to use this feature.')}
              </AlertDescription>
            </Alert>
          )}

          {hasCameraPermission && (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              {isScanning && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-1/2 border-4 border-dashed border-primary rounded-lg" />
                </div>
              )}
               {!isScanning && scannedBarcode && (
                 <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                   <p className="text-white text-lg font-bold">{t('Scan complete')}</p>
                 </div>
               )}
            </div>
          )}

          <div className="mt-4">
            {isScanning && !scannedBarcode && (
                <p className="text-center text-muted-foreground">{t('Align a barcode within the frame to scan it.')}</p>
            )}

            {scannedBarcode && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('Scan Result')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {existingFood ? (
                    <div>
                      <Alert>
                        <AlertTitle>{t('Food with this barcode already exists')}</AlertTitle>
                        <AlertDescription>
                         {t('A food with barcode {barcode} is already in your list: {foodName}.', { barcode: scannedBarcode, foodName: getFoodName(existingFood, locale) })}
                        </AlertDescription>
                      </Alert>
                       <div className="flex gap-2 mt-4">
                        <Button onClick={() => router.push('/foods')} className="flex-1">{t('View Food')}</Button>
                        <Button onClick={handleScanAgain} variant="outline" className="flex-1">{t('Scan Again')}</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p>{t('Scanned barcode: {barcode}', { barcode: scannedBarcode })}</p>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={() => setFormOpen(true)} className="flex-1">{t('Add New Food')}</Button>
                         <Button onClick={handleScanAgain} variant="outline" className="flex-1">{t('Scan Again')}</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <FoodForm
        open={isFormOpen}
        onOpenChange={setFormOpen}
        barcode={scannedBarcode || ''}
        onSubmitted={handleFormSubmitted}
      />
    </div>
  );
}
