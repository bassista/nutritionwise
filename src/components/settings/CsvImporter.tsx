"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import type { Food } from '@/lib/types';
import { Upload } from 'lucide-react';

export default function CsvImporter() {
  const { importFoods, foods } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          throw new Error('CSV must contain id, name, calories, protein, carbohydrates, and fat columns.');
        }

        const parsedFoods: Food[] = rows.map(row => {
          const values = row.split(',');
          const foodObject: any = {};
          header.forEach((h, i) => {
            const key = h as keyof Food;
            const value = values[i];
            if (['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar', 'sodium', 'serving_size_g'].includes(key as string)) {
              foodObject[key] = parseFloat(value) || 0;
            } else {
              foodObject[key] = value;
            }
          });
          return foodObject as Food;
        });

        importFoods(parsedFoods);
        
        const existingIds = new Set(foods.map(f => f.id));
        const uniqueNewFoodsCount = parsedFoods.filter(f => !existingIds.has(f.id)).length;

        toast({
          title: 'Import Successful',
          description: `${uniqueNewFoodsCount} new food(s) imported.`,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error.message || 'An unexpected error occurred during import.',
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
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
    }
    reader.readAsText(file);
  };

  return (
    <div>
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        Import from CSV
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
