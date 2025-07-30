# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WGZE is a German food tracking web application that helps users manage their cooking repertoire and track meal consumption. The name stands for "Was gab es zuletzt essen" (What did we eat lately).

**Current Status**: The project has been migrated from Go to **Hono (TypeScript)** with **JSX templates** and **Cloudflare D1** database.

## Development Commands

### Running the Application
```bash
# Development server with hot reloading
cd wgze-hono
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Generate TypeScript types for Cloudflare bindings
npm run cf-typegen
```

### Database Management
```bash
# Initialize local D1 database (first time setup)
wrangler d1 execute wgze-db --local --file=schema.sql

# Query local database
wrangler d1 execute wgze-db --local --command="SELECT * FROM foods"
```

## Architecture

### Tech Stack
- **Runtime**: Cloudflare Workers with Hono framework
- **Language**: TypeScript with JSX for templates  
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Frontend**: Server-side rendered JSX with HTMX for interactivity
- **Styling**: Tailwind CSS via CDN with custom food-themed design

### Project Structure
```
wgze-hono/
├── src/
│   ├── index.ts              # Main Hono app with routes
│   ├── types.ts              # TypeScript interfaces
│   ├── database.ts           # D1 database operations
│   └── components/           # JSX components
│       ├── Layout.tsx        # Base layout with nav
│       ├── Navigation.tsx    # Nav bar component
│       ├── HomePage.tsx      # Home page form
│       ├── SpeisenPage.tsx   # Food management page
│       ├── MahlzeitenPage.tsx # Meal history page
│       └── FoodList.tsx      # Food list partial
├── schema.sql               # D1 database schema
├── wrangler.jsonc          # Cloudflare configuration
└── package.json            # Dependencies
```

### Core Data Model
```typescript
interface Food {
  id: number;
  name: string;
  notes: string | null;
}

interface Meal {
  id: number;
  food_id: number;      // Foreign key to foods.id
  date: string;         // ISO date string YYYY-MM-DD
  notes: string | null;
}
```

**Critical**: Meals reference foods by ID, not name. This allows food name changes without breaking referential integrity.

### Database Layer (D1)

**Connection**: Cloudflare D1 database bound as `DB` in `wrangler.jsonc`

**Schema Features**:
- Foreign key constraints enabled
- CASCADE DELETE on food deletion
- Indexes for performance on common queries
- SQLite-compatible syntax

**Database Class** (`src/database.ts`):
- Encapsulates all D1 operations
- Handles date calculations for "days ago" logic
- Provides typed methods for CRUD operations

### JSX Components Architecture

**Layout System**:
- `Layout.tsx` - Base HTML structure with Tailwind CSS and HTMX
- `Navigation.tsx` - Shared navigation component
- Page-specific components render complete pages

**Component Props**:
- All components use TypeScript interfaces for props
- Database results passed directly to components
- Server-side rendering with no client-side hydration

**Styling**:
- Tailwind CSS classes embedded in JSX
- Custom CSS animations defined in Layout component
- Food-themed emoji and gradient color scheme
- Responsive design with mobile-friendly navigation

### HTMX Integration

**Form Handling**:
- `hx-post` for form submissions
- `hx-target` and `hx-swap` for partial page updates
- Error responses return HTML fragments for inline display

**Dynamic Features**:
- Inline editing on speisen page with JavaScript toggle
- Real-time validation on home page food input
- Partial template updates without page reloads

### Route Handlers

**Page Routes**:
- `GET /` - Home page with meal entry form
- `GET /speisen` - Food management page  
- `GET /mahlzeiten` - Meal history table

**API Routes**:
- `POST /add-meal` - Add new meal entry
- `POST /add-food` - Add new food to database
- `POST /edit-food/:id` - Update existing food
- `DELETE /delete-food/:id` - Remove food (cascade deletes meals)

**Error Handling**:
- Form validation on server-side
- HTML error fragments for HTMX responses
- Proper HTTP status codes for different error types

## Development Notes

### Adding New Features
- Create TypeScript interfaces in `types.ts`
- Add database methods to `Database` class
- Create JSX components in `components/` directory
- Add routes to `src/index.ts` with proper error handling

### Database Changes
- Update `schema.sql` for new tables/columns
- Modify TypeScript interfaces accordingly
- Add database methods to `Database` class
- Test with local D1 instance first

### Deployment Considerations
- Database binding configured in `wrangler.jsonc`
- Environment variables for production vs local
- D1 database must be created in Cloudflare dashboard for production
- Foreign key constraints work in D1 (unlike some SQLite implementations)

### UI/UX Consistency
- Use TypeScript for type safety
- Maintain German language throughout interface
- Include food emojis in JSX components
- Follow established Tailwind color scheme (orange/pink gradients)
- Preserve HTMX patterns for form interactions

## Migration Notes

This project was migrated from Go to Hono, preserving:
- All original functionality and UI design
- Database schema (adapted for D1)
- HTMX interactions and validation logic
- German language interface
- Food-themed styling and emojis

The migration improves:
- Type safety with TypeScript
- Serverless deployment capability
- Component-based architecture with JSX
- Better development experience with hot reloading