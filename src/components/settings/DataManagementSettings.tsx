
"use client";

import { useSettings } from '@/context/SettingsContext';
import { useFoods } from '@/context/FoodContext';
import { useMeals } from '@/context/MealContext';
import { useFavorites } from '@/context/FavoriteContext';
import { useDailyLogs } from '@/context/DailyLogContext';
import { useShoppingLists } from '@/context/ShoppingListContext';
import { useAchievements } from '@/context/AchievementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import CsvImporter from '@/components/settings/CsvImporter';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLocale } from '@/context/LocaleContext';
import { Download, Upload, Info, Loader2 } from 'lucide-react';
import { useRef, useCallback, useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) {
        throw new Error('Failed to fetch base food data');
    }
    return res.text()
});

export default function DataManagementSettings() {
    const { settings } = useSettings();
    const { foods, setFoods, exportFoodsToCsv, importFoods: importFoodsFromContext } = useFoods();
    const { setMeals } = useMeals();
    const { setFavoriteFoodIds } = useFavorites();
    const { setDailyLogs } = useDailyLogs();
    const { setShoppingLists } = useShoppingLists();
    const { setAchievements } = useAchievements();
    const { toast } = useToast();
    const { t, setLocale, locale } = useLocale();
    const backupFileRef = useRef<HTMLInputElement>(null);
    const [loadBaseFoods, setLoadBaseFoods] = useState(false);
    const { data: baseFoodsData, error: baseFoodsError, isLoading: isLoadingBaseFoods } = useSWR(loadBaseFoods ? '/base-food-data.csv' : null, fetcher);

    const clearAllData = () => {
        setFoods([]);
        setMeals([]);
        setFavoriteFoodIds([]);
        setDailyLogs({});
        setShoppingLists([]);
        setAchievements([]);
        toast({ title: t('Data Cleared'), description: t('All your entries have been deleted.') });
    };

    const exportData = () => {
        const data = {
            foods,
            meals: useMeals.getState().meals,
            favoriteFoodIds: useFavorites.getState().favoriteFoodIds,
            settings,
            dailyLogs: useDailyLogs.getState().dailyLogs,
            shoppingLists: useShoppingLists.getState().shoppingLists,
            userAchievements: useAchievements.getState().userAchievements,
            locale
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `nutrition-wise-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        link.remove();
        toast({
        title: t('Data Exported'),
        description: t('Your data has been downloaded as a JSON file.'),
        });
    };

    const importData = (data: any) => {
        if (data.foods) setFoods(data.foods);
        if (data.meals) setMeals(data.meals);
        if (data.favoriteFoodIds) setFavoriteFoodIds(data.favoriteFoodIds);
        if (data.settings) useSettings.getState().setSettings(data.settings);
        if (data.dailyLogs) setDailyLogs(data.dailyLogs);
        if (data.shoppingLists) setShoppingLists(data.shoppingLists);
        if (data.userAchievements) setAchievements(data.userAchievements);
        if (data.locale) setLocale(data.locale);
        toast({ title: t('Import Successful'), description: t('Your data has been restored from the backup.') });
    };

    const handleBackupFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const data = JSON.parse(text);
            importData(data);
        } catch (error) {
            toast({
            variant: 'destructive',
            title: t('Import Failed'),
            description: t('The selected file is not a valid JSON backup.'),
            });
        } finally {
            if(backupFileRef.current) {
            backupFileRef.current.value = '';
            }
        }
        };
        reader.readAsText(file);
    }, [importData, toast, t]);

    const handleCsvExport = () => {
        const csvString = exportFoodsToCsv();
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `nutrition-wise-foods-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
        title: t('CSV Exported'),
        description: t('Your food data has been downloaded as a CSV file.'),
        });
    }

    useEffect(() => {
        if (baseFoodsData) {
            try {
                const rows = baseFoodsData.split('\n').filter(row => row.trim() !== '');
                const header = rows.shift()?.trim().split(',').map(h => h.trim()) || [];
                
                if (!header.includes('id') || !header.includes('name_category')) {
                throw new Error(t("CSV must contain 'id' and 'name_category' columns."));
                }

                const parsedFoods: { [key: string]: string }[] = rows.map(row => {
                    const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
                    const foodObject: { [key: string]: string } = {};
                    
                    header.forEach((h, i) => {
                        let value = values[i]?.trim() || '';
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        foodObject[h] = value;
                    });
                    return foodObject;
                });

                const newFoodsCount = importFoodsFromContext(parsedFoods);

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
                setLoadBaseFoods(false);
            }
        }
        if (baseFoodsError) {
            toast({
                variant: 'destructive',
                title: t('Import Failed'),
                description: baseFoodsError.message || t('An unexpected error occurred during import.'),
            });
            setLoadBaseFoods(false);
        }
    }, [baseFoodsData, baseFoodsError, importFoodsFromContext, t, toast]);

    return (
        <AccordionItem value="data-management">
            <AccordionTrigger>
                <div className="text-left">
                    <h3 className="text-lg font-semibold">{t('Data Management')}</h3>
                    <p className="text-sm text-muted-foreground">
                    {t('Import your food data or reset the application.')}
                    </p>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">{t('Base Food Data')}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            {t('Load a default list of food items into the app.')}
                        </p>
                        <Button onClick={() => setLoadBaseFoods(true)} disabled={isLoadingBaseFoods}>
                            {isLoadingBaseFoods ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            {t('Load')}
                        </Button>
                    </div>
                    <Separator />
                    <div>
                    <h3 className="font-semibold mb-2">{t('CSV Food Data')}</h3>
                    <div className='flex items-center gap-2'>
                        <p className="text-sm text-muted-foreground">
                        {t('Upload a CSV file with your food data.')}
                        </p>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                                <Info className="h-4 w-4" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 text-sm">
                            {t("The CSV should have an `id` column, a `name_category` column, and nutrient values.")}
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <CsvImporter />
                        <Button onClick={handleCsvExport} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            {t('Download Foods (CSV)')}
                        </Button>
                    </div>

                    </div>
                    <Separator />
                    <div>
                    <h3 className="font-semibold mb-2">{t('Backup & Restore')}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        {t('Download all your data to a file, or restore it from a backup.')}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportData}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('Download Data')}
                        </Button>
                        <Button variant="outline" onClick={() => backupFileRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('Load from Backup')}
                        </Button>
                        <Input
                        type="file"
                        ref={backupFileRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleBackupFileChange}
                        />
                    </div>
                    </div>
                    <Separator />
                    <div>
                    <h3 className="font-semibold mb-2 text-destructive">{t('Danger Zone')}</h3>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive">{t('Clear All Data')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
                            <AlertDialogDescription>
                            {t('This action cannot be undone. This will permanently delete all your saved meals and favorites, and reset all settings to default.')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={clearAllData} className="bg-destructive hover:bg-destructive/90">
                            {t('Yes, delete everything')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <p className="text-sm text-muted-foreground mt-2">
                        {t('Reset the app to its initial state.')}
                    </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
