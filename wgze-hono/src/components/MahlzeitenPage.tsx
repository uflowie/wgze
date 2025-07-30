import { Layout } from './Layout';
import type { Meal } from '../types';

interface MahlzeitenPageProps {
  meals: Meal[];
}

export const MahlzeitenPage = ({ meals }: MahlzeitenPageProps) => {
  return (
    <Layout title="WGZE - Mahlzeiten">
      <div class="max-w-6xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Mahlzeiten Historie</h2>
          
          {meals.length > 0 ? (
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Datum</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Speise</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Anmerkungen</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div class="text-center py-12 text-gray-500">
              <div class="text-6xl mb-4">🍽️</div>
              <div class="text-lg mb-2">Noch keine Mahlzeiten erfasst</div>
              <div class="text-sm mb-4">
                Gehen Sie zur <a href="/" class="text-blue-500 hover:text-blue-600 underline">Startseite</a> um Ihre erste Mahlzeit hinzuzufügen.
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};