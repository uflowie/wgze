import { Layout } from './Layout';
import { MealList } from './MealList';
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
          
          <div id="meal-list">
            <MealList meals={meals} />
          </div>
        </div>
      </div>
    </Layout>
  );
};