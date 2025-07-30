import type { Child } from 'hono/jsx';

interface SimpleLayoutProps {
  title: string;
  children: Child;
}

export const SimpleLayout = ({ title, children }: SimpleLayoutProps) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/htmx-ext-response-targets@2.0.2"></script>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 min-h-screen" hx-ext="response-targets">
        {children}
      </body>
    </html>
  );
};