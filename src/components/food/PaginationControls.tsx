"use client";

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-center space-x-2 py-4 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{t('Previous')}</span>
      </Button>
      <span className="text-sm font-medium">
        {t('Page')} {currentPage} {t('of')} {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span>{t('Next')}</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
