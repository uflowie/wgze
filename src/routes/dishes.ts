import { Hono } from 'hono';
import type { Bindings, Food, FoodWithLastMeal } from '../types';
import { SpeisenPage } from '../components/DishesPage';
import { FoodList } from '../components/DishList';

const app = new Hono<{ Bindings: Bindings }>()

// Helper function to calculate days ago from date string
function calculateDaysAgo(dateString: string | null): number {
  if (!dateString) return -1;

  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// Helper function to get all foods with last meal information
async function getFoodsWithLastMeal(db: D1Database): Promise<FoodWithLastMeal[]> {
  const result = await db.prepare(`
    SELECT f.id, f.name, COALESCE(f.notes, '') as notes,
           COALESCE(MAX(m.date), '') as last_had
    FROM foods f
    LEFT JOIN meals m ON f.id = m.food_id
    GROUP BY f.id, f.name, f.notes
    ORDER BY f.name COLLATE NOCASE
  `).all<Food & { last_had: string }>();

  return result.results.map(row => ({
    ...row,
    days_ago: calculateDaysAgo(row.last_had || null)
  })) as FoodWithLastMeal[];
}

// GET /dishes - Foods management page
app.get('/', async (c) => {
  const foods = await getFoodsWithLastMeal(c.env.DB);
  return c.html(SpeisenPage({ foods }));
})

  // POST /dishes - Create a new food
  .post('/', async (c) => {
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
      const foods = await getFoodsWithLastMeal(c.env.DB);
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
  })

  // PUT /dishes/:id - Update an existing food
  .put('/:id', async (c) => {
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
      const foods = await getFoodsWithLastMeal(c.env.DB);
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
  })

  // DELETE /dishes/:id - Delete a food
  .delete('/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));

      // Delete the food (cascade deletes meals automatically via foreign key)
      await c.env.DB.prepare(
        'DELETE FROM foods WHERE id = ?'
      ).bind(id).run();

      // Get updated foods list
      const foods = await getFoodsWithLastMeal(c.env.DB);
      return c.html(FoodList({ foods }));
    } catch (error) {
      console.error('Error deleting food:', error);
      return c.text('Failed to delete food', 500);
    }
  });

export default app;