[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/uflowie/wgze)

WGZE (Was gibt's zum Essen) is a German food tracking web application that helps users manage their cooking repertoire and track meal consumption. Built with Hono (TypeScript), JSX templates, and Cloudflare D1 database.

## Features

- **Food Management**: Add, edit, and delete foods in your cooking repertoire
- **Meal Tracking**: Log meals with dates and optional notes
- **Days Since Tracking**: See how many days ago you last had each food
- **AI Suggestions**: Get smart meal suggestions based on your eating history and preferences using Google Gemini
- **German Interface**: Fully localized German language interface
- **Responsive Design**: Mobile-friendly design with food-themed styling

## Tech Stack

- **Runtime**: Cloudflare Workers with Hono framework
- **Language**: TypeScript with JSX for server-side templates
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Frontend**: Server-side rendered JSX with HTMX for interactivity
- **Styling**: Tailwind CSS via CDN
- **AI Integration**: Google Gemini API for meal suggestions

## Local Development Setup

### Prerequisites

- Node.js and npm installed
- Cloudflare account (for deployment)

### Steps

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd wgze
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.dev.vars` file in the root directory:
   ```
   # Authentication
   JWT_SECRET=your-jwt-secret-here
   AUTH_PASSWORD=your-auth-password-here

   # AI Integration
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. **Initialize local database**
   
   Create the local D1 database with the schema:
   ```bash
   npx wrangler d1 execute wgze-db --local --file=schema.sql
   ```

   Verify the database was created:
   ```bash
   npx wrangler d1 execute wgze-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8787`

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate TypeScript types for Cloudflare bindings

## Authentication

The application uses JWT-based authentication with a simple password login. Set your password in the `AUTH_PASSWORD` environment variable.

## Deployment

To deploy to Cloudflare Workers:

1. Create a D1 database in your Cloudflare dashboard
2. Update `wrangler.jsonc` with your database ID
3. Set production environment variables in Cloudflare dashboard
4. Run `npm run deploy`
