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

const settingsSchema = z.object({
  foodsPerPage: z.coerce
    .number()
    .int()
    .min(1, 'Must be at least 1')
    .max(50, 'Must be 50 or less'),
});

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData } = useAppContext();
  const { toast } = useToast();
  const { t, setLocale, locale } = useLocale();

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
