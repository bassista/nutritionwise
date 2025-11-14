
"use client";

import { useLocale } from '@/context/LocaleContext';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSettings() {
    const { t, setLocale, locale } = useLocale();

    return (
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
    )
}
