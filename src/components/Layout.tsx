import type { Child } from 'hono/jsx';
import { Navigation } from './Navigation';

interface LayoutProps {
  title: string;
  children: Child;
}

export const Layout = ({ title, children }: LayoutProps) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>" />
        <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/htmx-ext-response-targets@2.0.2"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          .htmx-indicator { display: none; }
          .htmx-request.htmx-indicator { display: block; }
        `}</style>
      </head>
      <body class="bg-gray-100 min-h-screen" hx-ext="response-targets">
        <Navigation />
        {children}
      </body>
    </html>
  );
};