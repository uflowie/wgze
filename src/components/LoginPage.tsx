import { SimpleLayout } from './SimpleLayout';

export const LoginPage = () => {
  return (
    <SimpleLayout title="WGZE - Login">
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">🍽️ WGZE Login</h2>

          <form hx-post="/login" hx-target="#message" hx-target-401="#message" hx-swap="innerHTML" class="space-y-4">
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              class="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
            >
              Login
            </button>
          </form>

          <div id="message" class="mt-4 text-center"></div>
        </div>
      </div>
    </SimpleLayout>
  );
};