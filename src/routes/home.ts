import { Hono } from 'hono';
import type { Bindings, Meal } from '../types';
import { HomePage } from '../components/HomePage';
import getTodayString from '../util';

const app = new Hono<{ Bindings: Bindings }>()

// GET / - Home page with meal entry form
app.get('/', async (c) => {
  // Get food names for autocomplete
  const result = await c.env.DB.prepare(
    'SELECT name FROM foods ORDER BY name COLLATE NOCASE'
  ).all();

  const foodNames = result.results.map((row: any) => row.name);
  const today = getTodayString();

  return c.html(HomePage({ foodNames, today }));
})


export default app;