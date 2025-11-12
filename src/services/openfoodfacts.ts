
import type { Food } from '@/lib/types';

export async function fetchFoodDataFromOpenFoodFacts(barcode: string): Promise<Partial<Food> | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (!response.ok) {
        console.error(`OpenFoodFacts API request failed for barcode ${barcode} with status: ${response.status}`);
        return null;
    }

    const data = await response.json();
    if (data.status !== 1 || !data.product) {
        console.log(`No product found on OpenFoodFacts for barcode ${barcode}`);
        return null;
    }

    const product = data.product;
    const nutriments = product.nutriments;

    const food: Partial<Food> = {
      id: barcode,
      name: { en: product.product_name_en || product.product_name || '' },
      category: { en: product.categories?.split(',')[0]?.trim() || '' },
      serving_size_g: product.serving_size ? parseInt(product.serving_size, 10) : 100,
      calories: nutriments['energy-kcal_100g'] || 0,
      protein: nutriments.proteins_100g || 0,
      carbohydrates: nutriments.carbohydrates_100g || 0,
      fat: nutriments.fat_100g || 0,
      fiber: nutriments.fiber_100g || 0,
      sugar: nutriments.sugars_100g || 0,
      sodium: nutriments.sodium_100g ? nutriments.sodium_100g * 1000 : 0, // convert g to mg
    };
    
    // Add Italian names if available
    if (product.product_name_it) {
        food.name!.it = product.product_name_it;
    }
     if (product.categories_tags && Array.isArray(product.categories_tags)) {
        const itCategory = product.categories_tags
            .find((tag: string) => tag.startsWith('it:'))
            ?.replace('it:', '')
            .replace(/-/g, ' ');
        if (itCategory) {
            food.category!.it = itCategory.charAt(0).toUpperCase() + itCategory.slice(1);
        }
    }


    return food;
  } catch (error) {
    console.error("Failed to fetch or process food data from OpenFoodFacts:", error);
    return null;
  }
}
