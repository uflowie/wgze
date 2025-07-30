-- WGZE Database Schema for D1

-- Foods table - stores all foods the user knows how to prepare
CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    notes TEXT
);

-- Meals table - stores meal entries with proper foreign key to foods
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- ISO date format YYYY-MM-DD
    notes TEXT,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_food_id ON meals(food_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);