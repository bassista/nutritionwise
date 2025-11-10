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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';

const settingsSchema = z.object({
  foodsPerPage: z.coerce
    .number()
    .int()
    .min(1, 'Must be at least 1')
    .max(50, 'Must be 50 or less'),
});

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData, exportData, importData } = useAppContext();
  const { toast } = useToast();
  const { t, setLocale, locale } = useLocale();
  const backupFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      foodsPerPage: settings.foodsPerPage,
    },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    updateSettings(values);
    toast({
      title: t('Settings Saved'),
      description: t('Your preferences have been updated.'),
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

  const handleBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('Settings')} />
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 space-y-8 max-w-2xl mx-auto">
           <Card>
             <CardHeader>
              <CardTitle>{t('Language')}</CardTitle>
              <CardDescription>
                {t('Choose your preferred language.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => setLocale(value as 'en' | 'it')} value={locale}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('Language')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Display')}</CardTitle>
              <CardDescription>
                {t('Customize how the app displays information.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Data Management')}</CardTitle>
              <CardDescription>
                {t('Import your food data or reset the application.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('Import Data')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('Upload a CSV file with your food data. The file should have columns: `id`, `name`, `calories`, `protein`, `carbohydrates`, `fat`.')}
                </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
