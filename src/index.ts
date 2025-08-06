import { Hono } from 'hono';
import { html } from 'hono/html';
import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';
import { GoogleGenAI } from '@google/genai';

import type { Bindings, Food, Meal, FoodWithLastMeal } from './types';
import { HomePage } from './components/HomePage';
import { SpeisenPage } from './components/SpeisenPage';
import { MahlzeitenPage } from './components/MahlzeitenPage';
import { FoodList } from './components/FoodList';
import { MealList } from './components/MealList';
import { LoginPage } from './components/LoginPage';
import { AISuggestionsPage } from './components/AISuggestionsPage';

const app = new Hono<{ Bindings: Bindings }>();


// Helper function to get today's date in YYYY-MM-DD format
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Calculate days ago from date string
function calculateDaysAgo(dateString: string | null): number {
  if (!dateString) return -1;
  
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Authentication middleware
const authMiddleware = createMiddleware(async (c, next) => {
  // Skip auth for login routes
  if (c.req.path.startsWith('/login') || c.req.path.startsWith('/auth/')) {
    await next();
    return;
  }
  
  const authToken = getCookie(c, 'auth');
  
  if (!authToken) {
    return c.redirect('/login');
  }
  
  try {
    // Verify the JWT token
    const payload = await verify(authToken, c.env.JWT_SECRET);
    if (!payload || !payload.authenticated) {
      return c.redirect('/login');
    }
  } catch (error) {
    // Invalid token
    return c.redirect('/login');
  }
  
  await next();
});

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Public routes (no auth required)
app.get('/login', (c) => {
  return c.html(LoginPage());
});

app.post('/auth/login', async (c) => {
  const body = await c.req.formData();
  const password = body.get('password')?.toString();
  
  if (password !== c.env.AUTH_PASSWORD) {
    return c.html(
      `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        ❌ Invalid password
      </div>`,
      401
    );
  }
  
  // Create JWT token (no expiration)
  const payload = {
    authenticated: true
  };
  const token = await sign(payload, c.env.JWT_SECRET);
  
  // Set HTTP-only cookie with signed JWT (maximum expiration)
  setCookie(c, 'auth', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 34560000 // Maximum possible value (~68 years)
  });
  
  // Redirect to home page
  c.header('HX-Redirect', '/');
  return c.html(
    `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      ✅ Login successful! Redirecting...
    </div>`
  );
});


// Home page route
app.get('/', async (c) => {
  // Get food names for autocomplete
  const result = await c.env.DB.prepare(
    'SELECT name FROM foods ORDER BY name COLLATE NOCASE'
  ).all();
  
  const foodNames = result.results.map((row: any) => row.name);
  const today = getTodayString();
  
  return c.html(HomePage({ foodNames, today }));
});

// Speisen page route
app.get('/speisen', async (c) => {
  // Get foods with last meal information
  const result = await c.env.DB.prepare(`
    SELECT f.id, f.name, COALESCE(f.notes, '') as notes,
           COALESCE(MAX(m.date), '') as last_had
    FROM foods f
    LEFT JOIN meals m ON f.id = m.food_id
    GROUP BY f.id, f.name, f.notes
    ORDER BY f.name COLLATE NOCASE
  `).all();

  const foods = (result.results as any[]).map(row => ({
    ...row,
    days_ago: calculateDaysAgo(row.last_had || null)
  })) as FoodWithLastMeal[];
  
  return c.html(SpeisenPage({ foods }));
});

// Mahlzeiten page route
app.get('/mahlzeiten', async (c) => {
  // Get meals with food names
  const result = await c.env.DB.prepare(`
    SELECT m.id, m.food_id, f.name as food_name, m.date, COALESCE(m.notes, '') as notes
    FROM meals m
    JOIN foods f ON m.food_id = f.id
    ORDER BY m.date DESC
  `).all();
  
  const meals = result.results as Meal[];
  
  return c.html(MahlzeitenPage({ meals }));
});

// AI Suggestions page route
app.get('/ai-suggestions', async (c) => {
  return c.html(AISuggestionsPage());
});

// POST /meals - Create a new meal
app.post('/meals', async (c) => {
  try {
    const body = await c.req.formData();
    const foodName = body.get('food_name')?.toString();
    const date = body.get('date')?.toString();
    const notes = body.get('notes')?.toString();
    
    if (!foodName || !date) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ Food name and date are required
        </div>`,
        400
      );
    }
    
    // Check if food exists
    const existingFood = await c.env.DB.prepare(
      'SELECT 1 FROM foods WHERE name = ? LIMIT 1'
    ).bind(foodName).first();
    
    const exists = existingFood !== null;
    let message = '✅ Mahlzeit erfolgreich hinzugefügt!';
    
    if (!exists) {
      // Add food with no description
      await c.env.DB.prepare(
        'INSERT INTO foods (name, notes) VALUES (?, ?)'
      ).bind(foodName, null).run();
      message = `✅ Mahlzeit hinzugefügt! Die neue Speise "${foodName}" wurde automatisch erstellt.`;
    }
    
    // Get the food ID
    const foodResult = await c.env.DB.prepare(
      'SELECT id FROM foods WHERE name = ?'
    ).bind(foodName).first();
    
    if (!foodResult) {
      throw new Error('Food not found');
    }
    
    // Add the meal
    await c.env.DB.prepare(
      'INSERT INTO meals (food_id, date, notes) VALUES (?, ?, ?)'
    ).bind(foodResult.id, date, notes || null).run();
    
    return c.html(
      `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        ${message}
      </div>`
    );
  } catch (error) {
    console.error('Error adding meal:', error);
    return c.html(
      `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        ❌ Fehler beim Hinzufügen der Mahlzeit
      </div>`,
      500
    );
  }
});

// POST /foods - Create a new food
app.post('/foods', async (c) => {
  try {
    const body = await c.req.formData();
    const name = body.get('name')?.toString();
    const notes = body.get('notes')?.toString();
    
    if (!name) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ Food name is required
        </div>`,
        400
      );
    }
    
    // Check if food already exists
    const existingFood = await c.env.DB.prepare(
      'SELECT 1 FROM foods WHERE name = ? LIMIT 1'
    ).bind(name).first();
    
    if (existingFood !== null) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ Eine Speise mit diesem Namen existiert bereits!
        </div>`,
        400
      );
    }
    
    // Add the food
    await c.env.DB.prepare(
      'INSERT INTO foods (name, notes) VALUES (?, ?)'
    ).bind(name, notes || null).run();
    
    // Get updated foods list
    const result = await c.env.DB.prepare(`
      SELECT f.id, f.name, COALESCE(f.notes, '') as notes,
             COALESCE(MAX(m.date), '') as last_had
      FROM foods f
      LEFT JOIN meals m ON f.id = m.food_id
      GROUP BY f.id, f.name, f.notes
      ORDER BY f.name COLLATE NOCASE
    `).all();

    const foods = (result.results as any[]).map(row => ({
      ...row,
      days_ago: calculateDaysAgo(row.last_had || null)
    })) as FoodWithLastMeal[];
    
    return c.html(FoodList({ foods }));
  } catch (error) {
    console.error('Error adding food:', error);
    return c.html(
      `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        ❌ Fehler beim Hinzufügen der Speise
      </div>`,
      500
    );
  }
});

// PUT /foods/:id - Update an existing food
app.put('/foods/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.formData();
    const name = body.get('name')?.toString();
    const notes = body.get('notes')?.toString();
    
    if (!name) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ Food name is required
        </div>`,
        400
      );
    }
    
    // Check if another food with this name already exists (excluding current food)
    const existingFood = await c.env.DB.prepare(
      'SELECT id FROM foods WHERE name = ? AND id != ?'
    ).bind(name, id).first();
    
    if (existingFood) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ Eine andere Speise mit diesem Namen existiert bereits!
        </div>`,
        400
      );
    }
    
    // Update the food
    await c.env.DB.prepare(
      'UPDATE foods SET name = ?, notes = ? WHERE id = ?'
    ).bind(name, notes || null, id).run();
    
    // Get updated foods list
    const result = await c.env.DB.prepare(`
      SELECT f.id, f.name, COALESCE(f.notes, '') as notes,
             COALESCE(MAX(m.date), '') as last_had
      FROM foods f
      LEFT JOIN meals m ON f.id = m.food_id
      GROUP BY f.id, f.name, f.notes
      ORDER BY f.name COLLATE NOCASE
    `).all();

    const foods = (result.results as any[]).map(row => ({
      ...row,
      days_ago: calculateDaysAgo(row.last_had || null)
    })) as FoodWithLastMeal[];
    
    return c.html(FoodList({ foods }));
  } catch (error) {
    console.error('Error editing food:', error);
    return c.html(
      `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        ❌ Fehler beim Bearbeiten der Speise
      </div>`,
      500
    );
  }
});

// DELETE /foods/:id - Delete a food
app.delete('/foods/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // Delete the food (cascade deletes meals automatically via foreign key)
    await c.env.DB.prepare(
      'DELETE FROM foods WHERE id = ?'
    ).bind(id).run();
    
    // Get updated foods list
    const result = await c.env.DB.prepare(`
      SELECT f.id, f.name, COALESCE(f.notes, '') as notes,
             COALESCE(MAX(m.date), '') as last_had
      FROM foods f
      LEFT JOIN meals m ON f.id = m.food_id
      GROUP BY f.id, f.name, f.notes
      ORDER BY f.name COLLATE NOCASE
    `).all();

    const foods = (result.results as any[]).map(row => ({
      ...row,
      days_ago: calculateDaysAgo(row.last_had || null)
    })) as FoodWithLastMeal[];
    
    return c.html(FoodList({ foods }));
  } catch (error) {
    console.error('Error deleting food:', error);
    return c.text('Failed to delete food', 500);
  }
});

// DELETE /meals/:id - Delete a meal
app.delete('/meals/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // Delete the meal
    await c.env.DB.prepare(
      'DELETE FROM meals WHERE id = ?'
    ).bind(id).run();
    
    // Get updated meals list
    const result = await c.env.DB.prepare(`
      SELECT m.id, m.food_id, f.name as food_name, m.date, COALESCE(m.notes, '') as notes
      FROM meals m
      JOIN foods f ON m.food_id = f.id
      ORDER BY m.date DESC
    `).all();
    
    const meals = result.results as Meal[];
    
    return c.html(MealList({ meals }));
  } catch (error) {
    console.error('Error deleting meal:', error);
    return c.html(
      `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        ❌ Fehler beim Löschen der Mahlzeit
      </div>`,
      500
    );
  }
});

// POST /ai-suggestions - Generate AI food suggestions
app.post('/ai-suggestions', async (c) => {
  try {
    const body = await c.req.formData();
    const preferences = body.get('preferences')?.toString() || '';
    
    // Get all foods with their last eaten dates
    const result = await c.env.DB.prepare(`
      SELECT f.id, f.name, COALESCE(f.notes, '') as notes,
             COALESCE(MAX(m.date), '') as last_had
      FROM foods f
      LEFT JOIN meals m ON f.id = m.food_id
      GROUP BY f.id, f.name, f.notes
      ORDER BY f.name COLLATE NOCASE
    `).all();

    const foods = (result.results as any[]).map(row => ({
      ...row,
      days_ago: calculateDaysAgo(row.last_had || null)
    })) as FoodWithLastMeal[];
    
    // Shuffle the foods array to prevent AI bias toward first items
    const shuffledFoods = [...foods].sort(() => Math.random() - 0.5);
    
    if (foods.length === 0) {
      return c.html(
        `<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          ⚠️ Sie haben noch keine Speisen hinzugefügt. Gehen Sie zur <a href="/speisen" class="underline hover:text-yellow-800">Speisen-Seite</a>, um Speisen hinzuzufügen.
        </div>`
      );
    }
    
    // Initialize Gemini

    const genAI = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    // Prepare the prompt
    const foodsInfo = shuffledFoods.map(food => {
      const lastEaten = food.days_ago === -1 ? 'never eaten' : `${food.days_ago} days ago`;
      const notes = food.notes ? ` (Notes: ${food.notes})` : '';
      return `- ${food.name}: last eaten ${lastEaten}${notes}`;
    }).join('\n');
    
    const todayDate = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'Frühling' : 
                         currentMonth >= 6 && currentMonth <= 8 ? 'Sommer' : 
                         currentMonth >= 9 && currentMonth <= 11 ? 'Herbst' : 'Winter';

    const prompt = `
<task>
Your goal is to suggest 3 foods to the user. In order to arrive at these 3 foods you will execute the following 4 steps in order:
1. FILTER: NEVER suggest foods that have been eaten within the last 14 days.
2. FILTER: Consider the user's preferences, if any. All foods that do NOT fit those preferences can NOT be picked for the suggestions.
3. FILTER: Consider the current season and date. All foods that EXPLICITLY mention being seasonal can NOT be picked for the suggestions if their seasonality is not currently given.
4. SELECT: Among the remaining foods, pick 3. The longer a food has not been eaten, the more likely it is to be picked but do NOT just pick the oldest three every time.
</task>

<seasonal-filter>
Today's date: ${todayDate}
Current season: ${currentSeason}
</seasonal-filter>

<user-preferences-filter>
${preferences || 'No specific preferences'}
</user-preferences-filter>

<foods>
${foodsInfo}
</foods>

<strictness>
If foods are tied in terms of how long ago they have been eaten, take the one that appears earlier in the list.
</strictness>

<output>
Please respond in German and format your response as a simple list with brief explanations. End the suggestions with a poem about the foods that you picked.
</output>
`;
    
    // Generate content using Gemini
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    const suggestion = response.text || 'Keine Vorschläge verfügbar.';
    
    return c.html(
      `<div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <span>🤖</span> AI Vorschläge:
        </h3>
        <div class="text-gray-700 whitespace-pre-wrap">${suggestion}</div>
      </div>`
    );
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return c.html(
      `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        ❌ Fehler beim Generieren der Vorschläge. Bitte versuchen Sie es später erneut.
      </div>`,
      500
    );
  }
});

export default app;
