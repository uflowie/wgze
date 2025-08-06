import { Hono } from 'hono';
import type { Bindings, Meal } from '../types';
import { HomePage } from '../components/HomePage';
import { MahlzeitenPage } from '../components/MealsPage';
import { MealList } from '../components/MealList';
import getTodayString from '../util';

const app = new Hono<{ Bindings: Bindings }>()

  // GET /mahlzeiten - Meals history page
  .get('/', async (c) => {
    // Get meals with food names
    const result = await c.env.DB.prepare(`
    SELECT m.id, m.food_id, f.name as food_name, m.date, COALESCE(m.notes, '') as notes
    FROM meals m
    JOIN foods f ON m.food_id = f.id
    ORDER BY m.date DESC
  `).all();

    const meals = result.results as Meal[];

    return c.html(MahlzeitenPage({ meals }));
  })
  // POST /meals - Create a new meal
  .post('/', async (c) => {
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
  })

  // DELETE /meals/:id - Delete a meal
  .delete('/:id', async (c) => {
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

export default app;