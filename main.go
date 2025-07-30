package main

import (
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	_ "modernc.org/sqlite"
)

type Food struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Notes string `json:"notes"`
}

type Meal struct {
	ID       int    `json:"id"`
	FoodID   int    `json:"food_id"`
	FoodName string `json:"food_name"` // For display purposes
	Date     string `json:"date"`
	Notes    string `json:"notes"`
}

type FoodWithLastMeal struct {
	Food
	LastHad string `json:"last_had"`
	DaysAgo int    `json:"days_ago"`
}

var db *sql.DB
var templates *template.Template

func initDB() {
	var err error
	db, err = sql.Open("sqlite", "./food_tracker.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	// Enable foreign key constraints
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		log.Fatal("Failed to enable foreign keys:", err)
	}

	createFoodsTable := `
	CREATE TABLE IF NOT EXISTS foods (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		notes TEXT
	);`

	createMealsTable := `
	CREATE TABLE IF NOT EXISTS meals_new (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		food_id INTEGER NOT NULL,
		date DATE NOT NULL,
		notes TEXT,
		FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
	);`

	_, err = db.Exec(createFoodsTable)
	if err != nil {
		log.Fatal("Failed to create foods table:", err)
	}

	_, err = db.Exec(createMealsTable)
	if err != nil {
		log.Fatal("Failed to create new meals table:", err)
	}

	// Migration: Add notes column to existing foods table if it doesn't exist
	_, err = db.Exec("ALTER TABLE foods ADD COLUMN notes TEXT")
	if err != nil {
		// Column might already exist, which is fine
		// SQLite doesn't have IF NOT EXISTS for ALTER TABLE ADD COLUMN
	}

	// Migration: Migrate data from old meals table to new meals table
	migrateMealsTable()
	
	// Drop old meals table and rename new one
	_, err = db.Exec("DROP TABLE IF EXISTS meals")
	if err != nil {
		log.Fatal("Failed to drop old meals table:", err)
	}
	
	_, err = db.Exec("ALTER TABLE meals_new RENAME TO meals")
	if err != nil {
		log.Fatal("Failed to rename meals table:", err)
	}
}

func migrateMealsTable() {
	// Check if old meals table exists
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='meals'").Scan(&count)
	if err != nil || count == 0 {
		// Old table doesn't exist, nothing to migrate
		return
	}

	// Migrate data from old meals table to new meals table
	migrateQuery := `
	INSERT INTO meals_new (food_id, date, notes)
	SELECT f.id, m.date, m.notes
	FROM meals m
	JOIN foods f ON f.name = m.food_name
	WHERE f.id IS NOT NULL`
	
	_, err = db.Exec(migrateQuery)
	if err != nil {
		log.Printf("Warning: Failed to migrate meals data: %v", err)
		// Continue anyway, we'll start with empty meals table
	}
}

func initTemplates() {
	templates = template.Must(template.ParseGlob("templates/*.html"))
}

func calculateDaysAgo(lastHad string) int {
	if lastHad == "" {
		return -1
	}
	
	lastHadTime, err := time.Parse("2006-01-02", lastHad)
	if err != nil {
		return -1
	}
	
	return int(time.Since(lastHadTime).Hours() / 24)
}

func getFoods() ([]Food, error) {
	rows, err := db.Query("SELECT id, name, COALESCE(notes, '') FROM foods ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var foods []Food
	for rows.Next() {
		var food Food
		err := rows.Scan(&food.ID, &food.Name, &food.Notes)
		if err != nil {
			return nil, err
		}
		foods = append(foods, food)
	}
	return foods, nil
}

func getFoodsWithLastMeal() ([]FoodWithLastMeal, error) {
	query := `
	SELECT f.id, f.name, COALESCE(f.notes, '') as notes, 
	       COALESCE(MAX(m.date), '') as last_had
	FROM foods f
	LEFT JOIN meals m ON f.id = m.food_id
	GROUP BY f.id, f.name, f.notes
	ORDER BY last_had ASC, f.name`
	
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var foods []FoodWithLastMeal
	for rows.Next() {
		var food FoodWithLastMeal
		err := rows.Scan(&food.ID, &food.Name, &food.Notes, &food.LastHad)
		if err != nil {
			return nil, err
		}
		food.DaysAgo = calculateDaysAgo(food.LastHad)
		foods = append(foods, food)
	}
	return foods, nil
}

func getFoodNames() ([]string, error) {
	rows, err := db.Query("SELECT name FROM foods ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		err := rows.Scan(&name)
		if err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, nil
}

func getMeals() ([]Meal, error) {
	query := `
	SELECT m.id, m.food_id, f.name, m.date, COALESCE(m.notes, '')
	FROM meals m
	JOIN foods f ON m.food_id = f.id
	ORDER BY m.date DESC`
	
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var meals []Meal
	for rows.Next() {
		var meal Meal
		err := rows.Scan(&meal.ID, &meal.FoodID, &meal.FoodName, &meal.Date, &meal.Notes)
		if err != nil {
			return nil, err
		}
		meals = append(meals, meal)
	}
	return meals, nil
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	foodNames, err := getFoodNames()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	today := time.Now().Format("2006-01-02")
	
	data := struct {
		FoodNames []string
		Today     string
	}{
		FoodNames: foodNames,
		Today:     today,
	}

	templates.ExecuteTemplate(w, "home.html", data)
}

func speisenHandler(w http.ResponseWriter, r *http.Request) {
	foods, err := getFoodsWithLastMeal()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := struct {
		Foods []FoodWithLastMeal
	}{
		Foods: foods,
	}

	templates.ExecuteTemplate(w, "speisen.html", data)
}

func mahlzeitenHandler(w http.ResponseWriter, r *http.Request) {
	meals, err := getMeals()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := struct {
		Meals []Meal
	}{
		Meals: meals,
	}

	templates.ExecuteTemplate(w, "mahlzeiten.html", data)
}

func addMealHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		foodName := r.FormValue("food_name")
		date := r.FormValue("date")
		notes := r.FormValue("notes")
		
		if foodName == "" || date == "" {
			http.Error(w, "Food name and date are required", http.StatusBadRequest)
			return
		}

		// Get the food_id from the food name
		var foodID int
		err := db.QueryRow("SELECT id FROM foods WHERE name = ?", foodName).Scan(&foodID)
		if err != nil {
			http.Error(w, "Food not found", http.StatusBadRequest)
			return
		}

		_, err = db.Exec("INSERT INTO meals (food_id, date, notes) VALUES (?, ?, ?)", foodID, date, notes)
		if err != nil {
			http.Error(w, "Failed to add meal", http.StatusInternalServerError)
			return
		}

		w.Header().Set("HX-Trigger", "meal-added")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
			✅ Mahlzeit erfolgreich hinzugefügt!
		</div>`))
	}
}

func addFoodHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		name := r.FormValue("name")
		notes := r.FormValue("notes")
		
		if name == "" {
			http.Error(w, "Food name is required", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("INSERT INTO foods (name, notes) VALUES (?, ?)", name, notes)
		if err != nil {
			http.Error(w, "Failed to add food", http.StatusInternalServerError)
			return
		}

		foods, err := getFoodsWithLastMeal()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		data := struct {
			Foods []FoodWithLastMeal
		}{
			Foods: foods,
		}

		templates.ExecuteTemplate(w, "food-list.html", data)
	}
}

func editFoodHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		idStr := mux.Vars(r)["id"]
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid food ID", http.StatusBadRequest)
			return
		}

		name := r.FormValue("name")
		notes := r.FormValue("notes")
		
		if name == "" {
			http.Error(w, "Food name is required", http.StatusBadRequest)
			return
		}

		// Update the food (meals will automatically reference the correct food via ID)
		_, err = db.Exec("UPDATE foods SET name = ?, notes = ? WHERE id = ?", name, notes, id)
		if err != nil {
			http.Error(w, "Failed to update food", http.StatusInternalServerError)
			return
		}

		foods, err := getFoodsWithLastMeal()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		data := struct {
			Foods []FoodWithLastMeal
		}{
			Foods: foods,
		}

		templates.ExecuteTemplate(w, "food-list.html", data)
	}
}

func deleteFoodHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "DELETE" {
		idStr := mux.Vars(r)["id"]
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid food ID", http.StatusBadRequest)
			return
		}

		// Delete the food (associated meals will be cascade deleted automatically)
		_, err = db.Exec("DELETE FROM foods WHERE id = ?", id)
		if err != nil {
			http.Error(w, "Failed to delete food", http.StatusInternalServerError)
			return
		}

		foods, err := getFoodsWithLastMeal()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		data := struct {
			Foods []FoodWithLastMeal
		}{
			Foods: foods,
		}

		templates.ExecuteTemplate(w, "food-list.html", data)
	}
}

func main() {
	initDB()
	defer db.Close()

	initTemplates()

	r := mux.NewRouter()
	r.HandleFunc("/", homeHandler).Methods("GET")
	r.HandleFunc("/speisen", speisenHandler).Methods("GET")
	r.HandleFunc("/mahlzeiten", mahlzeitenHandler).Methods("GET")
	r.HandleFunc("/add-meal", addMealHandler).Methods("POST")
	r.HandleFunc("/add-food", addFoodHandler).Methods("POST")
	r.HandleFunc("/edit-food/{id}", editFoodHandler).Methods("POST")
	r.HandleFunc("/delete-food/{id}", deleteFoodHandler).Methods("DELETE")

	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static/"))))

	fmt.Println("Server starting on http://localhost:8082")
	log.Fatal(http.ListenAndServe("127.0.0.1:8082", r))
}