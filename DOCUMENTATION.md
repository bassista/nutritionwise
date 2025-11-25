# NutritionWise Application Documentation

## 1. Overview

NutritionWise is a comprehensive nutrition tracking application designed to help users monitor their dietary intake, manage meals, plan their week, and analyze their nutritional habits. It features a robust set of tools for logging food, creating custom meals, tracking health metrics, and achieving personal health goals through a gamified experience. The application is built with a focus on usability, customization, and data-driven insights.

## 2. Core Entities

### 2.1. Foods
The most basic data entity. Each food item contains:
- **ID**: A unique identifier (can be a barcode).
- **Name**: Localized for English and Italian.
- **Category**: Localized, for organization.
- **Nutritional Information**: Calories, protein, carbohydrates, fat, fiber, sugar, and sodium per serving.
- **Serving Size**: The default serving size in grams.

### 2.2. Meals
A composite entity created by the user. Each meal consists of:
- **ID**: A unique identifier.
- **Name**: A custom name for the meal.
- **Foods**: A list of ingredients, each with a reference to a `Food` entity and a specific quantity in grams.

## 3. Main Features

### 3.1. Food Management
- **Create, Edit, Delete**: A full CRUD (Create, Read, Update, Delete) interface for managing a personal food database.
- **Barcode Scanning**: Users can scan EAN barcodes to automatically fetch product information from the OpenFoodFacts API and create a new food item.
- **Favorites**: Any food can be marked as a "favorite" for quick access. The favorites list is a dedicated, reorderable view.
- **Search & Filter**: Foods can be searched by name and filtered by category. The lists are paginated for performance.
- **Drag-and-Drop Reordering**: Both the "Favorites" list and categorized lists in "All Foods" can be manually reordered via drag-and-drop.

### 3.2. Meal Management
- **Meal Builder**: A slide-out panel allows users to create or edit custom meals by selecting foods from their database and specifying quantities.
- **Meal List**: A dedicated page displays all created meals, with a summary of their nutritional content and ingredients.
- **Meal Scoring**: Each meal is assigned a score (A+, B, C, etc.) based on its macronutrient balance and nutritional quality, providing immediate feedback.
- **Search and View**: Meals can be searched by name, and the view can be toggled between a detailed grid and a compact list.

### 3.3. Food Diary
- **Daily Logging**: Users can log foods and entire meals to their diary for any selected date.
- **Unified Meal Section**: All logged items (breakfast, lunch, dinner, snacks) are displayed in a single, unified list for simplicity.
- **Quick Add**: Foods can be quickly added to the diary from the "All Foods" and "Favorites" pages.
- **Diary Management**:
    - **Copy from Past**: Users can copy all entries from a previous day (yesterday, 7 days ago, or a custom number of days).
    - **Copy from Meal Plan**: If a meal is scheduled for the day, a prompt allows for quick logging. A manual "Copy from Meals" action lets the user select any meal to log.
    - **Clear Day**: All food entries for a selected day can be cleared with a single action.
- **Daily Summary**: A real-time dashboard shows total calories and macronutrients consumed against daily goals, visualized with progress bars. It also displays a "Daily Score."

### 3.4. Health Tracking
A dedicated "Health" page allows users to log key health metrics for any selected date:
- **Water Intake**: Track water consumption in relation to a daily goal. Users can quickly add a predefined "glass" size.
- **Body Weight**: Log daily weight in kilograms.
- **Blood Glucose**: Log blood glucose levels in mg/dL.
- **Insulin Intake**: Log insulin doses in units.

### 3.5. Meal Planning
- **Weekly Planner**: A visual 7-day calendar where users can drag and drop their custom meals to plan their week.
- **Date Navigation**: Users can navigate to previous/next weeks or jump to the current week.
- **Manual Scheduling**: Clicking on a day opens a dialog to manually select and schedule a meal.

### 3.6. Shopping Lists
- **Multiple Lists**: Users can create and manage multiple shopping lists. A default, non-deletable list is provided for items generated from meal plans.
- **Add Items**: Items can be added by either searching the food database or typing custom text.
- **Generate from Meal Plan**: A "Generate Weekly List" button automatically populates a dedicated list with all the unique ingredients required for the scheduled weekly meals. This list is updated (cleared and refilled) rather than recreated.
- **Add from Meal**: Users can add all ingredients from a single meal to the shopping list.
- **Interactive Checklist**: Items can be checked off as they are purchased.

### 3.7. Analytics
The Analytics page provides data visualizations of the user's nutritional history over various periods (7 days, 30 days, all time):
- **Nutrient Trend**: Line chart showing intake of calories and macronutrients.
- **Macro Distribution**: Pie chart of the average macronutrient calorie distribution.
- **Hydration Trend**: Area chart showing water intake versus the daily goal.
- **Weight & Calorie Correlation**: A composed chart showing the 7-day average calorie intake versus weight trends.
- **Weekly Consistency**: Bar chart showing the average "Daily Score" for each day of the week.
- **Top 10 Foods**: A table of the most consumed foods, sortable by frequency, calories, or macros.
- **Consumption by Category**: Pie chart showing the calorie distribution from different food categories.
- **Glucose & Insulin Trends**: Area charts tracking glucose and insulin levels over time.

### 3.8. Gamification
- **Achievements**: The app includes a system of badges that users can unlock by completing specific milestones (e.g., "7-Day Streak," "Meal Creator"). The list of achievements is available on the "Achievements" page.
- **Scoring System**:
    - **Meal Score**: Grades individual meals based on macro balance and quality.
    - **Daily Score**: Grades the entire day's consumption against nutritional goals.
    - **Hydration Score**: Grades water intake against the daily goal.

#### 3.8.1. List of Achievements

**Easy Tier**
- **First Meal Logged**: Log any food or meal in the diary for the first time.
- **Meal Creator**: Create one custom meal.
- **First Favorite**: Mark one food as a favorite.
- **Scanner Pro**: Add a new food by scanning its barcode.
- **List Specialist**: Create one custom shopping list.

**Medium Tier**
- **7-Day Streak**: Log at least one food or meal for 7 consecutive days.
- **Hydration Marathoner**: Meet the daily water intake goal for 7 consecutive days.
- **Pro Planner**: Create a total of 10 custom meals.
- **Favorite Collector**: Save 25 different foods to the favorites list.
- **30-Day Streak**: Log at least one food or meal for 30 consecutive days.

**Hard Tier**
- **Hydration Monarch**: Meet the daily water intake goal for 30 consecutive days.
- **Supreme Chef**: Create a total of 50 custom meals.
- **Guru of Favorites**: Save 100 different foods in the favorites list.
- **Legend of Perseverance**: Log at least one food or meal for 100 consecutive days.

### 3.9. Settings & Customization
- **Language**: The app supports English and Italian, selectable by the user.
- **Nutritional Goals**: Users can set their daily targets for calories and all major nutrients.
- **Hydration Goals**: Customize the daily water goal (in liters) and the standard "glass" size (in ml).
- **Display**: Set the number of items to display per page in food lists.
- **Categories**: Users can create, rename, and delete their custom food categories.
- **Data Management**:
    - **CSV Import/Export**: Import a food list from a CSV file or export the current food database to CSV.
    - **JSON Backup/Restore**: Export and import the entire application state (foods, logs, settings, etc.) as a single JSON file.
    - **Load Base Data**: Populate the app with a default set of common food items.
    - **Reset**: A "Danger Zone" option to wipe all user data and restore the app to its initial state.

## 4. Technical Specifications

### 4.1. Frontend & UI
- **Framework**: Next.js with React (App Router).
- **UI Components**: Built using ShadCN UI, which provides a set of accessible and reusable components.
- **Styling**: Tailwind CSS for utility-first styling. The theme (colors, radius, etc.) is defined in `src/app/globals.css` using CSS variables.
- **Responsiveness**: The UI is fully responsive and optimized for both desktop and mobile devices, featuring a dedicated bottom navigation bar for mobile.
- **Internationalization (i18n)**: A custom `LocaleContext` provides translations from JSON files (`src/locales/en.json`, `src/locales/it.json`).

### 4.2. State Management
- **Client-Side State**: Zustand is used for global client-side state management. The entire application state (`AppData`) is centralized in a single store (`src/context/AppStore.tsx`).
- **Data Persistence**: A data adapter pattern (`IDataAdapter`) is used for saving and loading state. The current implementation uses a `LocalStorageAdapter`, which saves the entire app state to the browser's LocalStorage. This architecture makes it easy to switch to a database-backed adapter in the future.
- **State Updates**: State modifications are debounced to prevent excessive writes to LocalStorage during rapid UI interactions.

### 4.3. Key Libraries & Hooks
- **Drag and Drop**: `@dnd-kit` is used for all drag-and-drop functionalities (reordering lists, planning meals).
- **Forms**: `react-hook-form` with `zod` for schema validation is used for all forms (food creation, settings).
- **Data Fetching/Caching**: `swr` is used for fetching external data, such as product information from the OpenFoodFacts API.
- **Charts**: `recharts` is used for all data visualization charts on the Analytics page.
- **Date Manipulation**: `date-fns` is used for all date-related operations.
