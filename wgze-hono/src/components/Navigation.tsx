/** @jsx jsx */
import { jsx } from 'hono/jsx';

// Navigation component - converted from Go template nav.html

export const Navigation = () => {
  return (
    <nav class="bg-blue-600 text-white p-4 mb-8">
      <div class="max-w-4xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">🍽️ WGZE</h1>
        <div class="flex gap-4">
          <a href="/" class="hover:bg-blue-700 px-3 py-2 rounded transition-colors">Home</a>
          <a href="/speisen" class="hover:bg-blue-700 px-3 py-2 rounded transition-colors">Speisen</a>
          <a href="/mahlzeiten" class="hover:bg-blue-700 px-3 py-2 rounded transition-colors">Mahlzeiten</a>
        </div>
      </div>
    </nav>
  );
};