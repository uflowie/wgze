import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import type { Bindings, FoodWithLastMeal } from '../types';
import { AISuggestionsPage } from '../components/AISuggestionsPage';

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

// GET /ai-suggestions - AI suggestions page
app.get('/', async (c) => {
  return c.html(AISuggestionsPage());
})

  // POST /ai-suggestions - Generate AI food suggestions
  .post('/', async (c) => {
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
          ⚠️ Sie haben noch keine Speisen hinzugefügt. Gehen Sie zur <a href="/dishes" class="underline hover:text-yellow-800">Speisen-Seite</a>, um Speisen hinzuzufügen.
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
</dishes>

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