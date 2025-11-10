"use client";

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import type { Food } from '@/lib/types';
import FoodCard from './FoodCard';
import PaginationControls from './PaginationControls';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search } from 'lucide-react';

export default function FoodList({ foods }: { foods: Food[] }) {
  const { settings } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = settings.foodsPerPage > 0 ? settings.foodsPerPage : 8;

  const totalPages = Math.ceil(foods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFoods = foods.slice(startIndex, startIndex + itemsPerPage);

  if (foods.length === 0) {
    return (
      <div className="mt-8">
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            No foods match your search. Try a different term.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedFoods.map(food => (
          <FoodCard key={food.id} food={food} />
        ))}
      </div>
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
