import { AppData } from '@/lib/types';

export interface IDataAdapter {
  loadData(): Promise<AppData>;
  saveData(data: AppData): Promise<void>;
}
