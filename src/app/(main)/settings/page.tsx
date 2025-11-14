
"use client";

import { PageHeader } from '@/components/PageHeader';
import { useLocale } from '@/context/LocaleContext';
import {
  Accordion,
} from "@/components/ui/accordion";
import LanguageSettings from '@/components/settings/LanguageSettings';
import NutritionalGoalsSettings from '@/components/settings/NutritionalGoalsSettings';
import HydrationSettings from '@/components/settings/HydrationSettings';
import DisplaySettings from '@/components/settings/DisplaySettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';

export default function SettingsPage() {
  const { t } = useLocale();

  return (
    <>
      <PageHeader title={t('Settings')} />
      <div className="container mx-auto px-4 flex-grow overflow-auto py-4">
        <div className="max-w-2xl mx-auto space-y-4">
           <Accordion type="single" collapsible className="w-full" defaultValue="language">
              <LanguageSettings />
              <NutritionalGoalsSettings />
              <HydrationSettings />
              <DisplaySettings />
              <DataManagementSettings />
          </Accordion>
        </div>
      </div>
    </>
  );
}
