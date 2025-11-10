"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Food } from '@/lib/types';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface FoodDetailsDialogProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const nutrientOrder: (keyof Food)[] = [
    'calories',
    'protein',
    'carbohydrates',
    'fat',
    'fiber',
    'sugar',
    'sodium',
];

const nutrientLabels: Record<string, string> = {
    calories: 'Calories (kcal)',
    protein: 'Protein (g)',
    carbohydrates: 'Carbs (g)',
    fat: 'Fat (g)',
    fiber: 'Fiber (g)',
    sugar: 'Sugar (g)',
    sodium: 'Sodium (mg)',
};

export default function FoodDetailsDialog({
  food,
  open,
  onOpenChange,
}: FoodDetailsDialogProps) {
  const placeholder = PlaceHolderImages.find((p) => p.id === food.id) || PlaceHolderImages[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
            <Image
              src={placeholder.imageUrl}
              alt={food.name}
              fill
              className="object-cover"
              data-ai-hint={placeholder.imageHint}
            />
          </div>
          <DialogTitle className="text-2xl font-headline">{food.name}</DialogTitle>
          <DialogDescription>
            Nutritional values per {food.serving_size_g || 100}g serving.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nutrient</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nutrientOrder.map((key) => {
                const value = food[key];
                if (value !== undefined && value !== null) {
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{nutrientLabels[key] || key}</TableCell>
                      <TableCell className="text-right">{value}</TableCell>
                    </TableRow>
                  );
                }
                return null;
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
