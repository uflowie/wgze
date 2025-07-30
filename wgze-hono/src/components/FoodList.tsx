import type { FoodWithLastMeal } from '../types';

interface FoodListProps {
  foods: FoodWithLastMeal[];
}

export const FoodList = ({ foods }: FoodListProps) => {
  if (foods.length === 0) {
    return (
      <div class="text-center py-12 text-gray-500">
        <div class="text-lg mb-2">Noch keine Speisen hinzugefügt</div>
        <div class="text-sm">Fügen Sie Ihre erste Speise oben hinzu!</div>
      </div>
    );
  }

  return (
    <>
      {foods.map(food => (
        <div 
          key={food.id}
          class="p-4 bg-white border border-gray-200 rounded-lg mb-3 shadow-sm hover:shadow-md transition-shadow" 
          id={`food-${food.id}`}
        >
          <div class="food-display">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="text-lg font-semibold text-gray-800 mb-1">{food.name}</div>
                {food.notes && (
                  <div class="text-sm text-gray-600 mb-1 whitespace-pre-wrap">{food.notes}</div>
                )}
                <div class="text-sm">
                  {food.days_ago === -1 ? (
                    <span class="text-red-500 font-medium">Noch nie gegessen</span>
                  ) : food.days_ago === 0 ? (
                    <span class="text-green-500 font-medium">Heute gegessen</span>
                  ) : food.days_ago === 1 ? (
                    <span class="text-green-500 font-medium">Gestern gegessen</span>
                  ) : food.days_ago <= 7 ? (
                    <span class="text-green-500 font-medium">Vor {food.days_ago} Tagen gegessen</span>
                  ) : food.days_ago <= 30 ? (
                    <span class="text-yellow-500 font-medium">Vor {food.days_ago} Tagen gegessen</span>
                  ) : (
                    <span class="text-red-500 font-medium">Vor {food.days_ago} Tagen gegessen</span>
                  )}
                </div>
              </div>
              <div class="flex gap-2 ml-4">
                <button 
                  class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium" 
                  onclick={`toggleEdit(${food.id})`}
                >
                  Bearbeiten
                </button>
                <button 
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium" 
                  hx-delete={`/foods/${food.id}`}
                  hx-target="#food-list" 
                  hx-swap="innerHTML"
                  hx-confirm="Sind Sie sicher, dass Sie diese Speise löschen möchten? Alle zugehörigen Mahlzeiten werden ebenfalls gelöscht!"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
          
          <div class="food-edit hidden">
            <form hx-put={`/foods/${food.id}`} hx-target="#food-list" hx-swap="innerHTML" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Name der Speise:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={food.name}
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Anmerkungen / Rezept:</label>
                <textarea 
                  name="notes" 
                  rows="6"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
                >{food.notes || ''}</textarea>
              </div>
              
              <div class="flex gap-2">
                <button 
                  type="submit" 
                  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Speichern
                </button>
                <button 
                  type="button" 
                  onclick={`toggleEdit(${food.id})`}
                  class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      ))}

      <script>{`
        function toggleEdit(id) {
          const foodItem = document.getElementById('food-' + id);
          const displayDiv = foodItem.querySelector('.food-display');
          const editDiv = foodItem.querySelector('.food-edit');
          
          displayDiv.classList.toggle('hidden');
          editDiv.classList.toggle('hidden');
        }
      `}</script>
    </>
  );
};