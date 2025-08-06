export interface Food {
  id: number;
  name: string;
  notes: string | null;
}

export interface Meal {
  id: number;
  food_id: number;
  food_name?: string; // For display purposes when joining with foods
  date: string; // ISO date string YYYY-MM-DD
  notes: string | null;
}

export interface FoodWithLastMeal extends Food {
  last_had: string | null;
  days_ago: number;
}

// Cloudflare bindings
export interface Bindings {
  DB: D1Database;
  AUTH_PASSWORD: string;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
}
