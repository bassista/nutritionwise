
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
import type { Food } from '@/lib/types';
import Spinner from '@/components/ui/spinner';


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

async function fetchFoodData(barcode: string): Promise<Partial<Food> | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    const nutriments = product.nutriments;

    const food: Partial<Food> = {
      id: barcode,
      name: { en: product.product_name_en || product.product_name || '' },
      category: { en: product.categories?.split(',')[0]?.trim() || '' },
      serving_size_g: product.serving_size ? parseInt(product.serving_size, 10) : 100,
      calories: nutriments['energy-kcal_100g'] || 0,
      protein: nutriments.proteins_100g || 0,
      carbohydrates: nutriments.carbohydrates_100g || 0,
      fat: nutriments.fat_100g || 0,
      fiber: nutriments.fiber_100g || 0,
      sugar: nutriments.sugars_100g || 0,
      sodium: nutriments.sodium_100g ? nutriments.sodium_100g * 1000 : 0, // convert g to mg
    };
    
    if (product.product_name_it) {
        food.name!.it = product.product_name_it;
    }

    return food;
  } catch (error) {
    console.error("Failed to fetch food data:", error);
    return null;
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
  const [foodToCreate, setFoodToCreate] = useState<Partial<Food> | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(false);

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

    if (typeof window.BarcodeDetector === 'undefined') {
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
        title: 'Scanner Init Failed',
        description: t('Could not initialize the barcode scanner.'),
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
            setIsScanning(false);
             if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
             }
            toast({
              title: t('Barcode detected!'),
              description: `${t('Scanned barcode: {barcode}', { barcode: detectedBarcode })}`,
            });
            
            // Check if food exists locally first
            const localFood = foods.find(f => f.id === detectedBarcode);
            if (localFood) {
              setScannedBarcode(detectedBarcode);
            } else {
              // If not, fetch from API
              setIsFetching(true);
              setScannedBarcode(detectedBarcode);
              const fetchedData = await fetchFoodData(detectedBarcode);
              setIsFetching(false);
              if (fetchedData) {
                setFoodToCreate(fetchedData);
                setFormOpen(true);
              } else {
                 setFoodToCreate({ id: detectedBarcode });
                 setFormOpen(true);
              }
            }
          }
        } catch (e) {
          console.error('Barcode detection failed:', e);
        }
      }
      if (isScanning) {
        animationFrameId = requestAnimationFrame(scan);
      }
    };

    if (isScanning && hasCameraPermission) {
      scan();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, hasCameraPermission, t, toast, foods]);

  const handleScanAgain = () => {
    setScannedBarcode(null);
    setFoodToCreate(undefined);
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
  
  const handleOpenForm = () => {
    setFoodToCreate({ id: scannedBarcode || '' });
    setFormOpen(true);
  }

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
                 <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                    {isFetching ? <Spinner className="h-8 w-8" /> : <p className="text-lg font-bold">{t('scan complete')}</p>}
                 </div>
               )}
            </div>
          )}

          <div className="mt-4">
            {!scannedBarcode && (
                <p className="text-center text-muted-foreground">{t('Align a barcode within the frame to scan it.')}</p>
            )}

            {scannedBarcode && !isFetching &&(
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
                      <p className="text-sm text-muted-foreground">{t("This food isn't in your list yet.")}</p>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleOpenForm} className="flex-1">{t('Add')}</Button>
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
        foodToCreate={foodToCreate}
        onSubmitted={handleFormSubmitted}
      />
    </div>
  );
}
