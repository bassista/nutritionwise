
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import useAppStore from '@/context/AppStore';
import { FoodForm } from '@/components/food/FoodForm';
import { getFoodName } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Food } from '@/lib/types';
import Spinner from '@/components/ui/spinner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useOpenFoodFacts } from '@/hooks/useOpenFoodFacts';


export default function ScannerClientPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { foods, favoriteFoodIds, toggleFavorite } = useAppStore();
  
  const [foodToCreate, setFoodToCreate] = useState<Partial<Food> | undefined>(undefined);
  const [foodToEdit, setFoodToEdit] = useState<Food | undefined>(undefined);
  const [isFormOpen, setFormOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const fromFavorites = useMemo(() => searchParams.get('from') === 'favorites', [searchParams]);
  const existingFood = scannedBarcode ? foods.find(f => f.id === scannedBarcode) : undefined;
  
  const { foodData, isFetching, error } = useOpenFoodFacts(existingFood ? null : scannedBarcode);

  const handleScanSuccess = useCallback((barcode: string) => {
    toast({
      title: t('Barcode detected!'),
      description: `${t('Scanned barcode: {barcode}', { barcode: barcode })}`,
    });
    setScannedBarcode(barcode);
  }, [t, toast]);

  const {
    videoRef,
    hasCameraPermission,
    isScanning,
    startScan,
  } = useBarcodeScanner({ onScanSuccess: handleScanSuccess, toast });

  useEffect(() => {
    if (scannedBarcode && !existingFood) {
      if (!isFetching && (foodData || error)) {
        const newFoodData = foodData || { id: scannedBarcode };
        setFoodToCreate(newFoodData);
        setFormOpen(true);
      }
    } else if (scannedBarcode && existingFood && fromFavorites) {
        const isAlreadyFavorite = favoriteFoodIds.includes(existingFood.id);
        if (!isAlreadyFavorite) {
            toggleFavorite(existingFood.id);
            router.push('/favorites');
        }
    }
  }, [scannedBarcode, existingFood, foodData, isFetching, error, fromFavorites, favoriteFoodIds, toggleFavorite, router]);

  const handleScanAgain = () => {
    setScannedBarcode(null);
    setFoodToCreate(undefined);
    setFoodToEdit(undefined);
    startScan();
  };

  const handleFormSubmitted = () => {
    const destination = fromFavorites ? '/favorites' : '/foods';
    router.push(destination);
  };
  
  const handleOpenForm = () => {
    setFoodToCreate({ id: scannedBarcode || '' });
    setFormOpen(true);
  }

  const handleViewFood = () => {
    if (existingFood) {
        setFoodToEdit(existingFood);
        setFormOpen(true);
    }
  }
  
  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setFoodToEdit(undefined);
      setFoodToCreate(undefined);
    }
  }

  const showScanResult = scannedBarcode && !isScanning;

  return (
    <>
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
               {showScanResult && (
                 <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                    {isFetching ? <Spinner className="h-8 w-8" /> : <p className="text-lg font-bold">{t('scan complete')}</p>}
                 </div>
               )}
            </div>
          )}

          <div className="mt-4">
            {!scannedBarcode && isScanning && (
                <p className="text-center text-muted-foreground">{t('Align a barcode within the frame to scan it.')}</p>
            )}

            {showScanResult && !isFetching && (
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
                        <Button onClick={handleViewFood} className="flex-1">{t('View Food')}</Button>
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
        onOpenChange={handleFormOpenChange}
        foodToCreate={foodToCreate}
        foodToEdit={foodToEdit}
        onSubmitted={handleFormSubmitted}
        autoFavorite={fromFavorites}
      />
    </>
  );
}
