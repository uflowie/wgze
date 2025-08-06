[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/uflowie/wgze)

WGZE (Was gibt's zum Essen) is a German food tracking web application that helps users manage their cooking repertoire and track meal consumption. Built with Hono (TypeScript), JSX templates, and Cloudflare D1 database.

## Features

- **Dish Management**: Add, edit, and delete dishes in your cooking repertoire
- **Meal Tracking**: Log meals with dates and optional notes
- **AI Suggestions**: Get smart meal suggestions based on your eating history and preferences using Google Gemini

## Local Development Setup

### Prerequisites

- Node.js and npm installed
- Cloudflare account (for deployment)

### Steps

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/uflowie/wgze.git
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

4. **Start development server**
   ```bash
   npm run dev
   ```

## Authentication

The application uses JWT-based authentication with a simple password login. Set your password in the `AUTH_PASSWORD` environment variable.
