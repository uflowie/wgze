import type { Meal } from '../types';

interface MealListProps {
  meals: Meal[];
}

export const MealList = ({ meals }: MealListProps) => {
  if (meals.length === 0) {
    return (
      <div class="text-center py-12 text-gray-500">
        <div class="text-6xl mb-4">🍽️</div>
        <div class="text-lg mb-2">Noch keine Mahlzeiten erfasst</div>
        <div class="text-sm mb-4">
          Gehen Sie zur <a href="/" class="text-blue-500 hover:text-blue-600 underline">Startseite</a> um Ihre erste Mahlzeit hinzuzufügen.
        </div>
      </div>
    );
  }

  return (
    <div class="overflow-x-auto">
      <table class="w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Datum</th>
            <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Speise</th>
            <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Anmerkungen</th>
            <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {meals.map(meal => (
            <tr key={meal.id} class="hover:bg-gray-50 transition-colors">
              <td class="border border-gray-300 px-4 py-3 text-gray-800 font-medium">
                {meal.date}
              </td>
              <td class="border border-gray-300 px-4 py-3 text-gray-800">
                {meal.food_name}
              </td>
              <td class="border border-gray-300 px-4 py-3 text-gray-600 max-w-md">
                {meal.notes ? (
                  <div class="whitespace-pre-wrap break-words">{meal.notes}</div>
                ) : (
                  <span class="text-gray-400 italic">Keine Anmerkungen</span>
                )}
              </td>
              <td class="border border-gray-300 px-4 py-3">
                <button 
                  class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium" 
                  hx-delete={`/meals/${meal.id}`}
                  hx-target="#meal-list" 
                  hx-target-500="#meal-list"
                  hx-swap="innerHTML"
                  hx-confirm="Sind Sie sicher, dass Sie diese Mahlzeit löschen möchten?"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};