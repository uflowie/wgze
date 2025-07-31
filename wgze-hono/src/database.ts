// Database functions for WGZE - D1 version

import type { Food, Meal, FoodWithLastMeal } from './types';

export class Database {
  constructor(private db: D1Database) {}

  // Calculate days ago from date string
  private calculateDaysAgo(dateString: string | null): number {
    if (!dateString) return -1;
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Get all foods
  async getFoods(): Promise<Food[]> {
    const result = await this.db.prepare(
      'SELECT id, name, COALESCE(notes, "") as notes FROM foods ORDER BY name'
    ).all();
    
    return result.results as Food[];
  }

  // Get foods with last meal information
  async getFoodsWithLastMeal(): Promise<FoodWithLastMeal[]> {
    const result = await this.db.prepare(`
      SELECT f.id, f.name, COALESCE(f.notes, '') as notes,
             COALESCE(MAX(m.date), '') as last_had
      FROM foods f
      LEFT JOIN meals m ON f.id = m.food_id
      GROUP BY f.id, f.name, f.notes
      ORDER BY last_had ASC, f.name
    `).all();

    return (result.results as any[]).map(row => ({
      ...row,
      days_ago: this.calculateDaysAgo(row.last_had || null)
    }));
  }

  // Get food names for autocomplete
  async getFoodNames(): Promise<string[]> {
    const result = await this.db.prepare(
      'SELECT name FROM foods ORDER BY name'
    ).all();
    
    return result.results.map((row: any) => row.name);
  }

  // Get meals with food names
  async getMeals(): Promise<Meal[]> {
    const result = await this.db.prepare(`
      SELECT m.id, m.food_id, f.name as food_name, m.date, COALESCE(m.notes, '') as notes
      FROM meals m
      JOIN foods f ON m.food_id = f.id
      ORDER BY m.date DESC
    `).all();
    
    return result.results as Meal[];
  }

  // Add a new food
  async addFood(name: string, notes?: string): Promise<void> {
    await this.db.prepare(
      'INSERT INTO foods (name, notes) VALUES (?, ?)'
    ).bind(name, notes || null).run();
  }

  // Add a new meal
  async addMeal(foodName: string, date: string, notes?: string): Promise<void> {
    // First get the food ID
    const foodResult = await this.db.prepare(
      'SELECT id FROM foods WHERE name = ?'
    ).bind(foodName).first();
    
    if (!foodResult) {
      throw new Error('Food not found');
    }
    
    await this.db.prepare(
      'INSERT INTO meals (food_id, date, notes) VALUES (?, ?, ?)'
    ).bind(foodResult.id, date, notes || null).run();
  }

  // Edit a food
  async editFood(id: number, name: string, notes?: string): Promise<void> {
    await this.db.prepare(
      'UPDATE foods SET name = ?, notes = ? WHERE id = ?'
    ).bind(name, notes || null, id).run();
  }

  // Delete a food (cascade deletes meals automatically via foreign key)
  async deleteFood(id: number): Promise<void> {
    await this.db.prepare(
      'DELETE FROM foods WHERE id = ?'
    ).bind(id).run();
  }

  // Delete a meal
  async deleteMeal(id: number): Promise<void> {
    await this.db.prepare(
      'DELETE FROM meals WHERE id = ?'
    ).bind(id).run();
  }

  // Check if food exists by name
  async foodExists(name: string): Promise<boolean> {
    const result = await this.db.prepare(
      'SELECT 1 FROM foods WHERE name = ? LIMIT 1'
    ).bind(name).first();
    
    return result !== null;
  }
}