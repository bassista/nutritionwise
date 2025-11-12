
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettings } from '@/context/SettingsContext';
import { useFoods } from '@/context/FoodContext';
import { useMeals } from '@/context/MealContext';
import { useFavorites } from '@/context/FavoriteContext';
import { useDailyLogs } from '@/context/DailyLogContext';
import { useShoppingLists } from '@/context/ShoppingListContext';
import { useAchievements } from '@/context/AchievementContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import CsvImporter from '@/components/settings/CsvImporter';
import {
  Accordion,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLocale } from '@/context/LocaleContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Upload, Info, Loader2 } from 'lucide-react';
import { useRef, useCallback, useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NutritionalGoals, HydrationSettings } from '@/lib/types';
import { Switch } from '@/components/ui/switch';


const settingsSchema = z.object({
  foodsPerPage: z.coerce
    .number()
    .int()
    .min(1, 'Must be at least 1')
    .max(50, 'Must be 50 or less'),
});

const nutritionalGoalsSchema = z.object({
    calories: z.coerce.number().min(0, "Cannot be negative"),
    protein: z.coerce.number().min(0, "Cannot be negative"),
    carbohydrates: z.coerce.number().min(0, "Cannot be negative"),
    fat: z.coerce.number().min(0, "Cannot be negative"),
    fiber: z.coerce.number().min(0, "Cannot be negative"),
    sugar: z.coerce.number().min(0, "Cannot be negative"),
    sodium: z.coerce.number().min(0, "Cannot be negative"),
});

const hydrationSettingsSchema = z.object({
    goalLiters: z.coerce.number().min(0.1, "Must be at least 0.1"),
    glassSizeMl: z.coerce.number().int().min(1, "Must be at least 1"),
    remindersEnabled: z.boolean(),
    reminderIntervalMinutes: z.coerce.number().int().min(1, "Must be at least 1"),
    reminderStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    reminderEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
});

export default function SettingsPage() {
  const { settings, updateSettings, updateNutritionalGoals, updateHydrationSettings } = useSettings();
  const { foods, setFoods, exportFoodsToCsv, importFoods: importFoodsFromContext } = useFoods();
  const { setMeals } = useMeals();
  const { setFavoriteFoodIds } = useFavorites();
  const { setDailyLogs } = useDailyLogs();
  const { setShoppingLists } = useShoppingLists();
  const { setAchievements } = useAchievements();
  
  const { toast } = useToast();
  const { t, setLocale, locale } = useLocale();
  const backupFileRef = useRef<HTMLInputElement>(null);
  const [isLoadingBaseFoods, setIsLoadingBaseFoods] = useState(false);

  const displayForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      foodsPerPage: settings.foodsPerPage,
    },
  });

  const goalsForm = useForm<z.infer<typeof nutritionalGoalsSchema>>({
    resolver: zodResolver(nutritionalGoalsSchema),
    defaultValues: settings.nutritionalGoals,
  });
  
  const hydrationForm = useForm<z.infer<typeof hydrationSettingsSchema>>({
    resolver: zodResolver(hydrationSettingsSchema),
    defaultValues: settings.hydrationSettings,
  });

  useEffect(() => {
    displayForm.reset({ foodsPerPage: settings.foodsPerPage });
    goalsForm.reset(settings.nutritionalGoals);
    hydrationForm.reset(settings.hydrationSettings);
  }, [settings, displayForm, goalsForm, hydrationForm]);

  function onDisplaySubmit(values: z.infer<typeof settingsSchema>) {
    updateSettings({foodsPerPage: values.foodsPerPage});
    toast({
      title: t('Settings Saved'),
      description: t('Your preferences have been updated.'),
    });
  }

  function onGoalsSubmit(values: z.infer<typeof nutritionalGoalsSchema>) {
    updateNutritionalGoals(values);
    toast({
        title: t('Goals Saved'),
        description: t('Your nutritional goals have been updated.'),
    });
  }

  function onHydrationSubmit(values: z.infer<typeof hydrationSettingsSchema>) {
    updateHydrationSettings(values);
    toast({
        title: t('Hydration Settings Saved'),
        description: t('Your hydration settings have been updated.'),
    });
  }
  
    const clearAllData = () => {
        setFoods([]);
        setMeals([]);
        setFavoriteFoodIds([]);
        setDailyLogs({});
        setShoppingLists([]);
        setAchievements([]);
        // Note: We don't clear settings here to preserve user preferences
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
  }, []);

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

  const handleLoadBaseFoods = async () => {
    setIsLoadingBaseFoods(true);
    try {
        const response = await fetch('https://pastebin.com/raw/XwRp3Vhd');
        if (!response.ok) {
            throw new Error('Failed to fetch base food data');
        }
        const text = await response.text();
        
        const rows = text.split('\n').filter(row => row.trim() !== '');
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
        setIsLoadingBaseFoods(false);
    }
  };


  const goalsFields: {name: keyof NutritionalGoals, label: string}[] = [
      { name: 'calories', label: t('Calories (kcal)')},
      { name: 'protein', label: t('Protein (g)')},
      { name: 'carbohydrates', label: t('Carbs (g)')},
      { name: 'fat', label: t('Fat (g)')},
      { name: 'fiber', label: t('Fiber (g)')},
      { name: 'sugar', label: t('Sugar (g)')},
      { name: 'sodium', label: t('Sodium (mg)')},
  ];

  return (
    <>
      <PageHeader title={t('Settings')} />
      <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
        <div className="max-w-2xl mx-auto">
           <Accordion type="single" collapsible className="w-full" defaultValue="language">
            <AccordionItem value="language">
              <AccordionTrigger>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">{t('Language')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('Choose your preferred language.')}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Select onValueChange={(value) => setLocale(value as 'en' | 'it')} value={locale}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('Language')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="goals">
               <AccordionTrigger>
                 <div className="text-left">
                  <h3 className="text-lg font-semibold">{t('Nutritional Goals')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('Set your daily nutritional targets.')}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Form {...goalsForm}>
                  <form onSubmit={goalsForm.handleSubmit(onGoalsSubmit)} className="space-y-8">
                     <div className="grid grid-cols-2 gap-4">
                        {goalsFields.map(goal => (
                             <FormField
                              key={goal.name}
                              control={goalsForm.control}
                              name={goal.name}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{goal.label}</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        ))}
                    </div>
                    <Button type="submit">{t('Save Goals')}</Button>
                  </form>
                </Form>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="hydration">
               <AccordionTrigger>
                 <div className="text-left">
                  <h3 className="text-lg font-semibold">{t('Hydration')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('Manage your water intake goals and reminders.')}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Form {...hydrationForm}>
                  <form onSubmit={hydrationForm.handleSubmit(onHydrationSubmit)} className="space-y-8">
                     <div className="grid grid-cols-2 gap-4">
                         <FormField
                          control={hydrationForm.control}
                          name="goalLiters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Daily Goal (Liters)')}</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={hydrationForm.control}
                          name="glassSizeMl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('Glass Size (ml)')}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    
                    <FormField
                        control={hydrationForm.control}
                        name="remindersEnabled"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                            <FormLabel className="text-base">
                                {t('Enable Reminders')}
                            </FormLabel>
                            <FormDescription>
                                {t('Receive notifications to drink water.')}
                            </FormDescription>
                            </div>
                            <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    
                    {hydrationForm.watch('remindersEnabled') && (
                        <div className="space-y-4">
                             <FormField
                              control={hydrationForm.control}
                              name="reminderIntervalMinutes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('Reminder Interval (minutes)')}</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                               <FormField
                                  control={hydrationForm.control}
                                  name="reminderStartTime"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('Reminders Start Time')}</FormLabel>
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                 <FormField
                                  control={hydrationForm.control}
                                  name="reminderEndTime"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('Reminders End Time')}</FormLabel>
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </div>
                        </div>
                    )}


                    <Button type="submit">{t('Save Hydration Settings')}</Button>
                  </form>
                </Form>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="display">
               <AccordionTrigger>
                 <div className="text-left">
                  <h3 className="text-lg font-semibold">{t('Display')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('Customize how the app displays information.')}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Form {...displayForm}>
                  <form onSubmit={displayForm.handleSubmit(onDisplaySubmit)} className="space-y-8">
                    <FormField
                      control={displayForm.control}
                      name="foodsPerPage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Foods Per Page')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            {t('Set the number of food items to show on each page (1-50).')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">{t('Save Preferences')}</Button>
                  </form>
                </Form>
              </AccordionContent>
            </AccordionItem>

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
                        <Button onClick={handleLoadBaseFoods} disabled={isLoadingBaseFoods}>
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
                          {t('Upload or download a CSV file with your food data.')}
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
          </Accordion>
        </div>
      </div>
    </>
  );
}

    