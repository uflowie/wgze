import { Layout } from './Layout';

export const AISuggestionsPage = () => {
  return (
    <Layout title="WGZE - AI Vorschläge">
      <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">🤖 AI Speise-Vorschläge</h2>
          <p class="text-gray-600 mb-6">
            Lassen Sie sich von der KI vorschlagen, was Sie kochen könnten! 
            Die KI berücksichtigt, welche Speisen Sie schon länger nicht mehr gegessen haben.
          </p>
          
          <div class="space-y-6">
            <form hx-post="/ai-suggestions" hx-target="#suggestions-result" hx-target-500="#suggestions-result" hx-swap="innerHTML" hx-indicator="#loading-indicator" class="space-y-4">
              <div>
                <label for="preferences" class="block text-sm font-medium text-gray-700 mb-2">
                  Ihre Wünsche (optional):
                </label>
                <input 
                  type="text"
                  id="preferences"
                  name="preferences" 
                  placeholder="z.B. etwas Vegetarisches, etwas Schnelles, etwas mit Pasta..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              <button 
                type="submit" 
                class="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium text-lg flex items-center justify-center gap-2"
              >
                <span>🤖</span>
                Vorschläge generieren
                <span>✨</span>
              </button>
              
              <div id="loading-indicator" class="htmx-indicator w-full">
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 flex items-center justify-center gap-3">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span class="text-purple-700 font-medium">KI generiert Vorschläge...</span>
                </div>
              </div>
            </form>
            
            <div id="suggestions-result" class="mt-6">
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};