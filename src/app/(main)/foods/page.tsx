"use client";

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import FoodList from '@/components/food/FoodList';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export default function FoodsPage() {
  const { foods } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="All Foods" />
      <div className="container mx-auto px-4 flex-grow">
        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for a food..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search for a food"
            />
          </div>
          {foods.length === 0 ? (
             <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>No Foods Found</AlertTitle>
                <AlertDescription>
                  You can import your own food list from a CSV file in the Settings page.
                </AlertDescription>
              </Alert>
          ) : (
            <FoodList foods={filteredFoods} />
          )}
        </div>
      </div>
    </div>
  );
}
