# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WGZE is a German food tracking web application that helps users manage their cooking repertoire and track meal consumption. The name stands for "Was gab es zuletzt essen" (What did we eat lately).

## Development Commands

### Running the Application
```bash
# Development (rebuilds on each run)
go run main.go

# Production (build once, run executable)
go build -o wgze.exe main.go
.\wgze.exe
```

The server runs on `http://localhost:8082` by default and binds to `127.0.0.1` for security.

### Database Management
- SQLite database file: `food_tracker.db` (auto-created on first run)
- No separate migration commands - migrations run automatically on startup
- Foreign key constraints are enabled via `PRAGMA foreign_keys = ON`

## Architecture

### Tech Stack
- **Backend**: Go with Gorilla Mux router
- **Database**: SQLite with modernc.org/sqlite (pure Go implementation)
- **Frontend**: Server-side rendered HTML templates with HTMX for interactivity
- **Styling**: Tailwind CSS via CDN with custom food-themed design

### Core Data Model
```go
type Food struct {
    ID    int    // Primary key
    Name  string // Unique food name
    Notes string // Recipe/cooking notes
}

type Meal struct {
    ID       int    // Primary key
    FoodID   int    // Foreign key to foods.id (with CASCADE DELETE)
    Date     string // Date in YYYY-MM-DD format
    Notes    string // Meal-specific notes
}
```

**Critical**: Meals reference foods by ID, not name. This allows food name changes without breaking referential integrity.

### Application Structure

**Three Main Pages**:
1. **Home** (`/`) - "Was gab's am..." meal entry form with date picker and food autocomplete
2. **Speisen** (`/speisen`) - Food management with inline editing and CRUD operations
3. **Mahlzeiten** (`/mahlzeiten`) - Tabular meal history view

**Template System**:
- `nav.html` - Shared navigation component
- `home.html` - Meal entry page with client-side validation
- `speisen.html` - Food management page
- `food-list.html` - Partial template for food list with edit/delete functionality
- `mahlzeiten.html` - Meal history table

### Database Schema & Constraints

**Referential Integrity**:
- Foreign key constraints are strictly enforced
- Meals can only reference existing foods (validated client-side and server-side)
- CASCADE DELETE: deleting a food removes all associated meals
- Food name changes don't affect existing meals (they reference by ID)

**Migrations**:
- Automatic schema migrations run on startup via `migrateMealsTable()`
- Handles transition from old schema (food_name FK) to new schema (food_id FK)

### Frontend Architecture

**HTMX Integration**:
- Dynamic form submissions without page reloads
- Inline editing on speisen page using `toggleEdit()` JavaScript
- Real-time validation on home page food input
- Partial template swapping for smooth UX

**Client-side Validation**:
- Food name validation against existing foods list
- Visual feedback (border colors, error messages)
- Form submission prevention for invalid data

**Styling Philosophy**:
- Food-themed design with warm orange/pink gradient color scheme
- Extensive use of food emojis for personality
- Hover animations and visual feedback
- Mobile-responsive design

### Key Implementation Details

**Database Connection**:
- Uses pure Go SQLite driver (modernc.org/sqlite) to avoid CGO dependencies
- Connection string: `"sqlite", "./food_tracker.db"`
- Foreign keys must be explicitly enabled per connection

**Template Rendering**:
- Global template variable parsed from `templates/*.html`
- German language interface throughout
- Templates receive structured data (foods list, meal history, etc.)

**Error Handling**:
- Server errors return HTTP status codes
- User-friendly error messages for constraint violations
- Client-side validation prevents most invalid submissions

## Development Notes

### Adding New Features
- Follow the established pattern: handler function → template → HTMX integration
- Use proper foreign key relationships for data integrity
- Include appropriate emojis and German text for consistency
- Test both client-side validation and server-side constraints

### Database Changes
- Add migration logic to `migrateMealsTable()` or create new migration function
- Always test with existing data
- Maintain foreign key constraints

### UI/UX Consistency
- Use Tailwind utility classes with the established color scheme
- Include relevant food emojis in labels and buttons
- Maintain German language throughout
- Follow the inline editing pattern established in speisen page