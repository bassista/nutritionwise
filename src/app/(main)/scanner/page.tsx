
import { Suspense } from 'react';
import ScannerClientPage from './ScannerClientPage';
import Spinner from '@/components/ui/spinner';

export default function ScannerPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Spinner /></div>}>
      <ScannerClientPage />
    </Suspense>
  );
}
