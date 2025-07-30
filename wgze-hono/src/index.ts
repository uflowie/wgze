import { Hono } from 'hono';
import { html } from 'hono/html';

import type { Bindings } from './types';
import { Database } from './database';
import { HomePage } from './components/HomePage';
import { SpeisenPage } from './components/SpeisenPage';
import { MahlzeitenPage } from './components/MahlzeitenPage';
import { FoodList } from './components/FoodList';

const app = new Hono<{ Bindings: Bindings }>();

// Helper function to get today's date in YYYY-MM-DD format
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

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

// Add meal handler
app.post('/add-meal', async (c) => {
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

// Add food handler
app.post('/add-food', async (c) => {
  const db = new Database(c.env.DB);
  
  try {
    const body = await c.req.formData();
    const name = body.get('name')?.toString();
    const notes = body.get('notes')?.toString();
    
    if (!name) {
      return c.text('Food name is required', 400);
    }
    
    await db.addFood(name, notes);
    const foods = await db.getFoodsWithLastMeal();
    
    return c.html(FoodList({ foods }));
  } catch (error) {
    console.error('Error adding food:', error);
    return c.text('Failed to add food', 500);
  }
});

// Edit food handler
app.post('/edit-food/:id', async (c) => {
  const db = new Database(c.env.DB);
  
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.formData();
    const name = body.get('name')?.toString();
    const notes = body.get('notes')?.toString();
    
    if (!name) {
      return c.text('Food name is required', 400);
    }
    
    await db.editFood(id, name, notes);
    const foods = await db.getFoodsWithLastMeal();
    
    return c.html(FoodList({ foods }));
  } catch (error) {
    console.error('Error editing food:', error);
    return c.text('Failed to edit food', 500);
  }
});

// Delete food handler
app.delete('/delete-food/:id', async (c) => {
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

export default app;
