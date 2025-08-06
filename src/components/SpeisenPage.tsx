import { Layout } from './Layout';
import { FoodList } from './FoodList';
import type { FoodWithLastMeal } from '../types';

interface SpeisenPageProps {
  foods: FoodWithLastMeal[];
}

export const SpeisenPage = ({ foods }: SpeisenPageProps) => {
  return (
    <Layout title="WGZE - Speisen">
      <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Speisen verwalten</h2>

          <div class="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 class="text-lg font-semibold mb-4">Neue Speise hinzufügen</h3>
            <div id="add-food-message" class="mb-4"></div>
            <form hx-post="/dishes" hx-target="#food-list" hx-target-400="#add-food-message" hx-target-500="#add-food-message" hx-swap="innerHTML" hx-on--after-request="if(event.detail.successful) this.reset()" class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name der Speise:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="z.B. Spaghetti Bolognese"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">Anmerkungen / Rezept:</label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="z.B. Rezept, Zubereitungshinweise, oder andere Notizen..."
                  rows="6"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
                ></textarea>
              </div>

              <button
                type="submit"
                class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Speise hinzufügen
              </button>
            </form>
          </div>

          <div id="food-list">
            <FoodList foods={foods} />
          </div>
        </div>
      </div>
    </Layout>
  );
};