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

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      foodsPerPage: settings.foodsPerPage,
    },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    updateSettings(values);
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated.',
    });
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" />
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 space-y-8 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Display</CardTitle>
              <CardDescription>
                Customize how the app displays information.
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
                        <FormLabel>Foods Per Page</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Set the number of food items to show on each page (1-50).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Save Preferences</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Import your food data or reset the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Import Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a CSV file with your food data. The file should have columns: `id`, `name`, `calories`, `protein`, `carbohydrates`, `fat`.
                </p>
                <CsvImporter />
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Clear All Data</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your saved meals and favorites, and reset all settings to default.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllData} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground mt-2">
                  Reset the app to its initial state.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
