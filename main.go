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
	ID       int    `json:"id"`
	Name     string `json:"name"`
	LastHad  string `json:"last_had"`
	DaysAgo  int    `json:"days_ago"`
}

var db *sql.DB
var templates *template.Template

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./food_tracker.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	createTable := `
	CREATE TABLE IF NOT EXISTS foods (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		last_had DATE
	);`

	_, err = db.Exec(createTable)
	if err != nil {
		log.Fatal("Failed to create table:", err)
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
	rows, err := db.Query("SELECT id, name, COALESCE(last_had, '') FROM foods ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var foods []Food
	for rows.Next() {
		var food Food
		err := rows.Scan(&food.ID, &food.Name, &food.LastHad)
		if err != nil {
			return nil, err
		}
		food.DaysAgo = calculateDaysAgo(food.LastHad)
		foods = append(foods, food)
	}
	return foods, nil
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	foods, err := getFoods()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := struct {
		Foods []Food
	}{
		Foods: foods,
	}

	templates.ExecuteTemplate(w, "index.html", data)
}

func addFoodHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		name := r.FormValue("name")
		if name == "" {
			http.Error(w, "Food name is required", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("INSERT INTO foods (name) VALUES (?)", name)
		if err != nil {
			http.Error(w, "Failed to add food", http.StatusInternalServerError)
			return
		}

		foods, err := getFoods()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		data := struct {
			Foods []Food
		}{
			Foods: foods,
		}

		templates.ExecuteTemplate(w, "food-list.html", data)
	}
}

func updateLastHadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		idStr := mux.Vars(r)["id"]
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid food ID", http.StatusBadRequest)
			return
		}

		today := time.Now().Format("2006-01-02")
		_, err = db.Exec("UPDATE foods SET last_had = ? WHERE id = ?", today, id)
		if err != nil {
			http.Error(w, "Failed to update food", http.StatusInternalServerError)
			return
		}

		foods, err := getFoods()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		data := struct {
			Foods []Food
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

		_, err = db.Exec("DELETE FROM foods WHERE id = ?", id)
		if err != nil {
			http.Error(w, "Failed to delete food", http.StatusInternalServerError)
			return
		}

		foods, err := getFoods()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		data := struct {
			Foods []Food
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
	r.HandleFunc("/add-food", addFoodHandler).Methods("POST")
	r.HandleFunc("/update-last-had/{id}", updateLastHadHandler).Methods("POST")
	r.HandleFunc("/delete-food/{id}", deleteFoodHandler).Methods("DELETE")

	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static/"))))

	fmt.Println("Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}