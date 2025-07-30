import { Layout } from './Layout';

interface HomePageProps {
  foodNames: string[];
  today: string;
}

export const HomePage = ({ foodNames, today }: HomePageProps) => {
  return (
    <Layout title="WGZE - Home">
      <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Was gab's am...</h2>

          <div class="max-w-md mx-auto">
            <form 
              hx-post="/meals" 
              hx-target="#message" 
              hx-target-400="#message"
              hx-target-500="#message"
              hx-swap="innerHTML" 
              hx-on="htmx:afterRequest: if(event.detail.successful) this.reset()" 
              class="space-y-4"
            >
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700 mb-2">Datum:</label>
                <input 
                  type="date" 
                  id="date"
                  name="date" 
                  value={today}
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label for="food_name" class="block text-sm font-medium text-gray-700 mb-2">Speise:</label>
                {foodNames.length > 0 ? (
                  <div class="relative">
                    <input 
                      type="text" 
                      id="food_name"
                      name="food_name" 
                      placeholder="Name der Speise eingeben..."
                      required
                      list="food-suggestions"
                      autocomplete="off"
                      oninput="validateFoodName()"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <datalist id="food-suggestions">
                      {foodNames.map(name => (
                        <option value={name} key={name} />
                      ))}
                    </datalist>
                    <div id="food-validation-message" class="mt-1 text-sm hidden"></div>
                  </div>
                ) : (
                  <div class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Keine Speisen verfügbar. <a href="/speisen" class="text-blue-500 hover:text-blue-600 underline">Fügen Sie zuerst Speisen hinzu</a>.
                  </div>
                )}
              </div>

              <div>
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">Anmerkungen (optional):</label>
                <textarea 
                  id="notes"
                  name="notes" 
                  placeholder="Zusätzliche Notizen..."
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              {foodNames.length > 0 ? (
                <button 
                  type="submit" 
                  id="submit-btn"
                  class="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
                >
                  Mahlzeit hinzufügen
                </button>
              ) : (
                <button 
                  type="button" 
                  disabled
                  class="w-full px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium text-lg"
                >
                  Erst Speisen hinzufügen
                </button>
              )}
            </form>

            <div id="message" class="mt-4 text-center"></div>
          </div>
        </div>
      </div>

      <script>{`
        const validFoods = ${JSON.stringify(foodNames)};
        
        function validateFoodName() {
          const input = document.getElementById('food_name');
          const message = document.getElementById('food-validation-message');
          const submitBtn = document.getElementById('submit-btn');
          const value = input.value.trim();
          
          if (value === '') {
            // Empty input - reset state
            input.classList.remove('border-red-500', 'border-green-500');
            input.classList.add('border-gray-300');
            message.classList.add('hidden');
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          
          const isValid = validFoods.includes(value);
          
          if (isValid) {
            // Valid food name
            input.classList.remove('border-red-500', 'border-gray-300');
            input.classList.add('border-green-500');
            message.classList.add('hidden');
            if (submitBtn) submitBtn.disabled = false;
          } else {
            // Invalid food name
            input.classList.remove('border-green-500', 'border-gray-300');
            input.classList.add('border-red-500');
            message.textContent = 'Diese Speise existiert nicht. Wählen Sie aus der Liste oder fügen Sie sie auf der Speisen-Seite hinzu.';
            message.classList.remove('hidden');
            message.classList.add('text-red-600');
            if (submitBtn) submitBtn.disabled = true;
          }
        }
        
        document.querySelector('form').addEventListener('submit', function(e) {
          const input = document.getElementById('food_name');
          const value = input.value.trim();
          
          if (value !== '' && !validFoods.includes(value)) {
            e.preventDefault();
            validateFoodName();
            return false;
          }
        });
      `}</script>
    </Layout>
  );
};