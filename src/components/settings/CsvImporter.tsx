
"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import useAppStore from '@/context/AppStore';
import { Upload } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export default function CsvImporter() {
  const { importFoods } = useAppStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const header = rows.shift()?.trim().split(',').map(h => h.trim()) || [];
        
        if (!header.includes('id') || !header.includes('name_category')) {
          throw new Error(t("CSV must contain 'id' and 'name_category' columns."));
        }

        const parsedFoods: { [key: string]: string }[] = rows.map(row => {
            // This regex handles quoted fields that may contain commas
            const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const foodObject: { [key: string]: string } = {};
            
            header.forEach((h, i) => {
                let value = values[i]?.trim() || '';
                // Remove quotes from start and end if they exist
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                foodObject[h] = value;
            });
            return foodObject;
        });

        const newFoodsCount = importFoods(parsedFoods);

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
