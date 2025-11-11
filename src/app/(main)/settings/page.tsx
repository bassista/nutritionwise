
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
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
import { Download, Upload, Info } from 'lucide-react';
import { useRef, useCallback, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NutritionalGoals } from '@/lib/types';


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

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData, exportData, importData, updateNutritionalGoals } = useAppContext();
  const { toast } = useToast();
  const { t, setLocale, locale } = useLocale();
  const backupFileRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    goalsForm.reset(settings.nutritionalGoals);
  }, [settings.nutritionalGoals, goalsForm]);

  function onDisplaySubmit(values: z.infer<typeof settingsSchema>) {
    updateSettings(values);
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

  const handleExport = () => {
    const data = exportData();
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

  const handleBackupFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        importData(data);
        toast({
          title: t('Import Successful'),
          description: t('Your data has been restored from the backup.'),
        });
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
    <div className="flex flex-col h-full">
      <PageHeader title={t('Settings')} />
      <div className="container mx-auto px-4 flex-grow overflow-auto pb-24 md:pb-4">
        <div className="py-4 max-w-2xl mx-auto">
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
                      <h3 className="font-semibold mb-2">{t('Import Data')}</h3>
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

                      <CsvImporter />
                    </div>
                    <Separator />
                     <div>
                      <h3 className="font-semibold mb-2">{t('Backup & Restore')}</h3>
                       <p className="text-sm text-muted-foreground mb-3">
                        {t('Download all your data to a file, or restore it from a backup.')}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
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
    </div>
  );
}

    
