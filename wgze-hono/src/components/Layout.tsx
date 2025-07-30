/** @jsx jsx */
import { jsx } from 'hono/jsx';
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
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 min-h-screen">
        <Navigation />
        {children}
      </body>
    </html>
  );
};