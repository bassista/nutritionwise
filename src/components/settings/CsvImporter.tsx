"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import type { Food } from '@/lib/types';
import { Upload } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export default function CsvImporter() {
  const { importFoods } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useLocale();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const header = rows.shift()?.trim().split(',').map(h => h.trim()) || [];
        
        const requiredHeaders = ['id', 'name', 'calories', 'protein', 'carbohydrates', 'fat'];
        if (!requiredHeaders.every(h => header.includes(h))) {
          throw new Error(t('CSV must contain id, name, calories, protein, carbohydrates, and fat columns.'));
        }

        const parsedFoods: Partial<Food>[] = rows.map(row => {
          const values = row.split(',');
          const foodObject: any = {};
          header.forEach((h, i) => {
            const key = h as keyof Food;
            const value = values[i]?.trim();
            if (['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium', 'serving_size_g'].includes(key as string)) {
              foodObject[key] = parseFloat(value) || 0;
            } else {
              foodObject[key] = value;
            }
          });
          return foodObject as Partial<Food>;
        });

        const newFoodsCount = importFoods(parsedFoods, locale);

        toast({
          title: t('Import Successful'),
          description: t('{count} new food(s) imported.', { count: newFoodsCount }),
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: t('Import Failed'),
          description: error.message || t('An unexpected error occurred during import.'),
        });
      } finally {
        // Reset file input
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: t('File Read Error'),
            description: t('Could not read the selected file.'),
        });
    }
    reader.readAsText(file);
  };

  return (
    <div>
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        {t('Import from CSV')}
      </Button>
      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleFileChange}
      />
    </div>
  );
}
