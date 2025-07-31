// Navigation component - converted from Go template nav.html

export const Navigation = () => {
  return (
    <nav class="bg-blue-600 text-white p-4 mb-8">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-bold">🍽️ WGZE</h1>
          <button 
            class="md:hidden flex flex-col gap-1 p-2" 
            onclick="document.getElementById('mobile-menu').classList.toggle('hidden')"
            aria-label="Toggle menu"
          >
            <span class="w-6 h-0.5 bg-white"></span>
            <span class="w-6 h-0.5 bg-white"></span>
            <span class="w-6 h-0.5 bg-white"></span>
          </button>
          <div class="hidden md:flex gap-4">
            <a href="/" class="hover:bg-blue-700 px-3 py-2 rounded transition-colors">Home</a>
            <a href="/speisen" class="hover:bg-blue-700 px-3 py-2 rounded transition-colors">Speisen</a>
            <a href="/mahlzeiten" class="hover:bg-blue-700 px-3 py-2 rounded transition-colors">Mahlzeiten</a>
            <a href="/ai-suggestions" class="hover:bg-blue-700 px-3 py-2 rounded transition-colors">🤖 AI</a>
          </div>
        </div>
        <div id="mobile-menu" class="hidden md:hidden mt-4 space-y-2">
          <a href="/" class="block hover:bg-blue-700 px-3 py-2 rounded transition-colors">Home</a>
          <a href="/speisen" class="block hover:bg-blue-700 px-3 py-2 rounded transition-colors">Speisen</a>
          <a href="/mahlzeiten" class="block hover:bg-blue-700 px-3 py-2 rounded transition-colors">Mahlzeiten</a>
          <a href="/ai-suggestions" class="block hover:bg-blue-700 px-3 py-2 rounded transition-colors">🤖 AI</a>
        </div>
      </div>
    </nav>
  );
};