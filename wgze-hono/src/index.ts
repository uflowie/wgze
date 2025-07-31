import { Hono } from 'hono';
import { html } from 'hono/html';
import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';

import type { Bindings } from './types';
import { Database } from './database';
import { HomePage } from './components/HomePage';
import { SpeisenPage } from './components/SpeisenPage';
import { MahlzeitenPage } from './components/MahlzeitenPage';
import { FoodList } from './components/FoodList';
import { MealList } from './components/MealList';
import { LoginPage } from './components/LoginPage';

const app = new Hono<{ Bindings: Bindings }>();


// Helper function to get today's date in YYYY-MM-DD format
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
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
  
  // Set HTTP-only cookie with signed JWT (no expiration)
  setCookie(c, 'auth', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict'
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
  const db = new Database(c.env.DB);
  const foodNames = await db.getFoodNames();
  const today = getTodayString();
  
  return c.html(HomePage({ foodNames, today }));
});

// Speisen page route
app.get('/speisen', async (c) => {
  const db = new Database(c.env.DB);
  const foods = await db.getFoodsWithLastMeal();
  
  return c.html(SpeisenPage({ foods }));
});

// Mahlzeiten page route
app.get('/mahlzeiten', async (c) => {
  const db = new Database(c.env.DB);
  const meals = await db.getMeals();
  
  return c.html(MahlzeitenPage({ meals }));
});

// POST /meals - Create a new meal
app.post('/meals', async (c) => {
  const db = new Database(c.env.DB);
  
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
    const exists = await db.foodExists(foodName);
    if (!exists) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ Diese Speise existiert nicht! Bitte fügen Sie sie zuerst auf der <a href="/speisen" class="underline hover:text-red-800">Speisen-Seite</a> hinzu.
        </div>`,
        400
      );
    }
    
    await db.addMeal(foodName, date, notes);
    
    return c.html(
      `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        ✅ Mahlzeit erfolgreich hinzugefügt!
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
  const db = new Database(c.env.DB);
  
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
    const exists = await db.foodExists(name);
    if (exists) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ Eine Speise mit diesem Namen existiert bereits!
        </div>`,
        400
      );
    }
    
    await db.addFood(name, notes);
    const foods = await db.getFoodsWithLastMeal();
    
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
  const db = new Database(c.env.DB);
  
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
    const existingFood = await db.db.prepare(
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
    
    await db.editFood(id, name, notes);
    const foods = await db.getFoodsWithLastMeal();
    
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
  const db = new Database(c.env.DB);
  
  try {
    const id = parseInt(c.req.param('id'));
    
    await db.deleteFood(id);
    const foods = await db.getFoodsWithLastMeal();
    
    return c.html(FoodList({ foods }));
  } catch (error) {
    console.error('Error deleting food:', error);
    return c.text('Failed to delete food', 500);
  }
});

// DELETE /meals/:id - Delete a meal
app.delete('/meals/:id', async (c) => {
  const db = new Database(c.env.DB);
  
  try {
    const id = parseInt(c.req.param('id'));
    
    await db.deleteMeal(id);
    const meals = await db.getMeals();
    
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

export default app;
