package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

type User struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Company  string `json:"company"`
	Role     string `json:"role"`
	Password string `json:"-"`
}

type Evaluation struct {
	ID               string     `json:"id"`
	UserID           int        `json:"user_id"`
	Title            string     `json:"title"`
	Status           string     `json:"status"`
	RequirementsText string     `json:"requirements_text"`
	VendorCount      int        `json:"vendor_count"`
	WinnerVendorID   *string    `json:"winner_vendor_id"`
	CreatedAt        time.Time  `json:"created_at"`
	CompletedAt      *time.Time `json:"completed_at"`
}

type Vendor struct {
	ID            string    `json:"id"`
	EvaluationID  string    `json:"evaluation_id"`
	Name          string    `json:"name"`
	FileName      string    `json:"file_name"`
	ProposalText  string    `json:"-"`
	TotalCost     float64   `json:"total_cost"`
	Currency      string    `json:"currency"`
	TimelineWeeks int       `json:"timeline_weeks"`
	PaymentTerms  string    `json:"payment_terms"`
	SLAUptime     string    `json:"sla_uptime"`
	SLAResponse   string    `json:"sla_response_time"`
	OverallScore  float64   `json:"overall_score"`
	CostScore     float64   `json:"cost_score"`
	TimelineScore float64   `json:"timeline_score"`
	QualityScore  float64   `json:"quality_score"`
	RiskScore     float64   `json:"risk_score"`
	SLAScore      float64   `json:"sla_score"`
	Summary       string    `json:"summary"`
	Strengths     []string  `json:"strengths"`
	Weaknesses    []string  `json:"weaknesses"`
	RedFlags      []RedFlag `json:"red_flags"`
	HiddenCosts   []string  `json:"hidden_costs"`
}

type RedFlag struct {
	Severity    string `json:"severity"`
	Category    string `json:"category"`
	Description string `json:"description"`
	ClauseText  string `json:"clause_text"`
}

type Recommendation struct {
	EvaluationID      string   `json:"evaluation_id"`
	RecommendedVendor *Vendor  `json:"recommended_vendor"`
	Reasoning         string   `json:"reasoning"`
	ConfidenceScore   float64  `json:"confidence_score"`
	NegotiationTips   []string `json:"negotiation_tips"`
	Risks             []string `json:"risks"`
}

type UploadRequest struct {
	Title            string `json:"title"`
	RequirementsText string `json:"requirements_text"`
}

type ChatRequest struct {
	EvaluationID string `json:"evaluation_id"`
	Message      string `json:"message"`
}

type ExtractionResult struct {
	VendorName     string    `json:"vendor_name"`
	TotalCost      float64   `json:"total_cost"`
	Currency       string    `json:"currency"`
	TimelineWeeks  int       `json:"timeline_weeks"`
	PaymentTerms   string    `json:"payment_terms"`
	SLAUptime      string    `json:"sla_uptime"`
	SLAResponse    string    `json:"sla_response_time"`
	WarrantyMonths int       `json:"warranty_months"`
	SupportType    string    `json:"support_type"`
	Strengths      []string  `json:"strengths"`
	Weaknesses     []string  `json:"weaknesses"`
	HiddenCosts    []string  `json:"hidden_costs"`
	RedFlags       []RedFlag `json:"red_flags"`
	Summary        string    `json:"summary"`
}

type ScoringResult struct {
	OverallScore  float64 `json:"overall_score"`
	CostScore     float64 `json:"cost_score"`
	TimelineScore float64 `json:"timeline_score"`
	QualityScore  float64 `json:"quality_score"`
	RiskScore     float64 `json:"risk_score"`
	SLAScore      float64 `json:"sla_score"`
}

type ChatMessage struct {
	ID           int       `json:"id"`
	EvaluationID string    `json:"evaluation_id"`
	Role         string    `json:"role"`
	Content      string    `json:"content"`
	CreatedAt    time.Time `json:"created_at"`
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

var (
	db        *sql.DB
	jwtSecret []byte
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func envOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func jsonOK(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

type contextKey string

const userIDKey contextKey = "user_id"

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

func createToken(userID int) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(72 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func jwtMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			jsonError(w, "missing authorization header", http.StatusUnauthorized)
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			jsonError(w, "invalid authorization header", http.StatusUnauthorized)
			return
		}
		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			jsonError(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			jsonError(w, "invalid token claims", http.StatusUnauthorized)
			return
		}
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			jsonError(w, "invalid user_id in token", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, int(userIDFloat))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getUserID(r *http.Request) int {
	return r.Context().Value(userIDKey).(int)
}

// ---------------------------------------------------------------------------
// Database init
// ---------------------------------------------------------------------------

func initDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is required")
	}
	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("connected to database")

	createTables()
	seedDemoUser()
}

func createTables() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT UNIQUE NOT NULL,
			company TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT 'user',
			password TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS evaluations (
			id TEXT PRIMARY KEY,
			user_id INT REFERENCES users(id),
			title TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'draft',
			requirements_text TEXT NOT NULL DEFAULT '',
			vendor_count INT NOT NULL DEFAULT 0,
			winner_vendor_id TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			completed_at TIMESTAMPTZ
		)`,
		`CREATE TABLE IF NOT EXISTS vendors (
			id TEXT PRIMARY KEY,
			evaluation_id TEXT REFERENCES evaluations(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			file_name TEXT NOT NULL DEFAULT '',
			raw_text TEXT NOT NULL DEFAULT '',
			total_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
			currency TEXT NOT NULL DEFAULT 'USD',
			timeline_weeks INT NOT NULL DEFAULT 0,
			payment_terms TEXT NOT NULL DEFAULT '',
			sla_uptime TEXT NOT NULL DEFAULT '',
			sla_response TEXT NOT NULL DEFAULT '',
			overall_score DOUBLE PRECISION NOT NULL DEFAULT 0,
			cost_score DOUBLE PRECISION NOT NULL DEFAULT 0,
			timeline_score DOUBLE PRECISION NOT NULL DEFAULT 0,
			quality_score DOUBLE PRECISION NOT NULL DEFAULT 0,
			risk_score DOUBLE PRECISION NOT NULL DEFAULT 0,
			sla_score DOUBLE PRECISION NOT NULL DEFAULT 0,
			summary TEXT NOT NULL DEFAULT '',
			strengths JSONB NOT NULL DEFAULT '[]',
			weaknesses JSONB NOT NULL DEFAULT '[]',
			red_flags JSONB NOT NULL DEFAULT '[]',
			hidden_costs JSONB NOT NULL DEFAULT '[]',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS recommendations (
			evaluation_id TEXT PRIMARY KEY REFERENCES evaluations(id) ON DELETE CASCADE,
			recommended_vendor_id TEXT,
			reasoning TEXT NOT NULL DEFAULT '',
			confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0,
			negotiation_tips JSONB NOT NULL DEFAULT '[]',
			risks JSONB NOT NULL DEFAULT '[]',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS chat_messages (
			id SERIAL PRIMARY KEY,
			evaluation_id TEXT REFERENCES evaluations(id) ON DELETE CASCADE,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
	}
	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			log.Fatalf("failed to create table: %v\nQuery: %s", err, q)
		}
	}
	log.Println("database tables ready")
}

func seedDemoUser() {
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", "demo@vendoreval.ai").Scan(&exists)
	if err != nil {
		log.Fatalf("failed to check demo user: %v", err)
	}
	if exists {
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte("demo1234"), bcrypt.DefaultCost)
	_, err = db.Exec(
		"INSERT INTO users (name, email, company, role, password) VALUES ($1,$2,$3,$4,$5)",
		"Demo Procurement Manager", "demo@vendoreval.ai", "Acme Corp", "demo", string(hash),
	)
	if err != nil {
		log.Fatalf("failed to seed demo user: %v", err)
	}
	log.Println("seeded demo user")
}

// ---------------------------------------------------------------------------
// Auth handlers
// ---------------------------------------------------------------------------

func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Company  string `json:"company"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.Email == "" || req.Password == "" {
		jsonError(w, "name, email, and password are required", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		jsonError(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	var user User
	err = db.QueryRow(
		`INSERT INTO users (name, email, company, role, password)
		 VALUES ($1,$2,$3,'user',$4) RETURNING id, name, email, company, role`,
		req.Name, req.Email, req.Company, string(hash),
	).Scan(&user.ID, &user.Name, &user.Email, &user.Company, &user.Role)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
			jsonError(w, "email already registered", http.StatusConflict)
			return
		}
		jsonError(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	token, err := createToken(user.ID)
	if err != nil {
		jsonError(w, "failed to create token", http.StatusInternalServerError)
		return
	}

	jsonOK(w, map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var user User
	var hashedPw string
	err := db.QueryRow(
		"SELECT id, name, email, company, role, password FROM users WHERE email = $1",
		req.Email,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Company, &user.Role, &hashedPw)
	if err != nil {
		jsonError(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPw), []byte(req.Password)); err != nil {
		jsonError(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	token, err := createToken(user.ID)
	if err != nil {
		jsonError(w, "failed to create token", http.StatusInternalServerError)
		return
	}

	jsonOK(w, map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

func handleDemoLogin(w http.ResponseWriter, r *http.Request) {
	var user User
	err := db.QueryRow(
		"SELECT id, name, email, company, role FROM users WHERE email = $1",
		"demo@vendoreval.ai",
	).Scan(&user.ID, &user.Name, &user.Email, &user.Company, &user.Role)
	if err != nil {
		jsonError(w, "demo user not found", http.StatusInternalServerError)
		return
	}

	token, err := createToken(user.ID)
	if err != nil {
		jsonError(w, "failed to create token", http.StatusInternalServerError)
		return
	}

	jsonOK(w, map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

// ---------------------------------------------------------------------------
// Evaluation handlers
// ---------------------------------------------------------------------------

func handleCreateEvaluation(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var req UploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.Title == "" {
		jsonError(w, "title is required", http.StatusBadRequest)
		return
	}

	eval := Evaluation{
		ID:               uuid.New().String(),
		UserID:           userID,
		Title:            req.Title,
		Status:           "draft",
		RequirementsText: req.RequirementsText,
		VendorCount:      0,
		CreatedAt:        time.Now(),
	}

	_, err := db.Exec(
		`INSERT INTO evaluations (id, user_id, title, status, requirements_text, vendor_count, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		eval.ID, eval.UserID, eval.Title, eval.Status, eval.RequirementsText, eval.VendorCount, eval.CreatedAt,
	)
	if err != nil {
		jsonError(w, "failed to create evaluation", http.StatusInternalServerError)
		return
	}

	jsonOK(w, eval)
}

func handleListEvaluations(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	rows, err := db.Query(
		`SELECT id, user_id, title, status, requirements_text, vendor_count,
		        winner_vendor_id, created_at, completed_at
		 FROM evaluations WHERE user_id = $1 ORDER BY created_at DESC`, userID,
	)
	if err != nil {
		jsonError(w, "failed to list evaluations", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	evals := []Evaluation{}
	for rows.Next() {
		var e Evaluation
		if err := rows.Scan(&e.ID, &e.UserID, &e.Title, &e.Status, &e.RequirementsText,
			&e.VendorCount, &e.WinnerVendorID, &e.CreatedAt, &e.CompletedAt); err != nil {
			jsonError(w, "failed to scan evaluation", http.StatusInternalServerError)
			return
		}
		evals = append(evals, e)
	}

	jsonOK(w, evals)
}

func handleGetEvaluation(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	var e Evaluation
	err := db.QueryRow(
		`SELECT id, user_id, title, status, requirements_text, vendor_count,
		        winner_vendor_id, created_at, completed_at
		 FROM evaluations WHERE id = $1 AND user_id = $2`, evalID, userID,
	).Scan(&e.ID, &e.UserID, &e.Title, &e.Status, &e.RequirementsText,
		&e.VendorCount, &e.WinnerVendorID, &e.CreatedAt, &e.CompletedAt)
	if err != nil {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}

	vendors, err := getVendorsForEvaluation(evalID)
	if err != nil {
		jsonError(w, "failed to load vendors", http.StatusInternalServerError)
		return
	}

	jsonOK(w, map[string]interface{}{
		"evaluation": e,
		"vendors":    vendors,
	})
}

func handleListVendors(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	// Verify ownership
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM evaluations WHERE id=$1 AND user_id=$2)", evalID, userID).Scan(&exists)
	if err != nil || !exists {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}

	vendors, err := getVendorsForEvaluation(evalID)
	if err != nil {
		jsonError(w, "failed to load vendors", http.StatusInternalServerError)
		return
	}

	jsonOK(w, vendors)
}

func getVendorsForEvaluation(evalID string) ([]Vendor, error) {
	rows, err := db.Query(
		`SELECT id, evaluation_id, name, file_name, total_cost, currency,
		        timeline_weeks, payment_terms, sla_uptime, sla_response,
		        overall_score, cost_score, timeline_score, quality_score,
		        risk_score, sla_score, summary, strengths, weaknesses,
		        red_flags, hidden_costs
		 FROM vendors WHERE evaluation_id = $1 ORDER BY overall_score DESC`, evalID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	vendors := []Vendor{}
	for rows.Next() {
		var v Vendor
		var strengthsBytes, weaknessesBytes, redFlagsBytes, hiddenCostsBytes []byte
		if err := rows.Scan(
			&v.ID, &v.EvaluationID, &v.Name, &v.FileName,
			&v.TotalCost, &v.Currency, &v.TimelineWeeks, &v.PaymentTerms,
			&v.SLAUptime, &v.SLAResponse,
			&v.OverallScore, &v.CostScore, &v.TimelineScore, &v.QualityScore,
			&v.RiskScore, &v.SLAScore, &v.Summary,
			&strengthsBytes, &weaknessesBytes, &redFlagsBytes, &hiddenCostsBytes,
		); err != nil {
			return nil, err
		}
		json.Unmarshal(strengthsBytes, &v.Strengths)
		json.Unmarshal(weaknessesBytes, &v.Weaknesses)
		json.Unmarshal(redFlagsBytes, &v.RedFlags)
		json.Unmarshal(hiddenCostsBytes, &v.HiddenCosts)

		if v.Strengths == nil {
			v.Strengths = []string{}
		}
		if v.Weaknesses == nil {
			v.Weaknesses = []string{}
		}
		if v.RedFlags == nil {
			v.RedFlags = []RedFlag{}
		}
		if v.HiddenCosts == nil {
			v.HiddenCosts = []string{}
		}
		vendors = append(vendors, v)
	}
	return vendors, nil
}

// ---------------------------------------------------------------------------
// Vendor upload handler
// ---------------------------------------------------------------------------

func handleUploadVendor(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	// Verify ownership
	var evalUserID int
	var vendorCount int
	err := db.QueryRow("SELECT user_id, vendor_count FROM evaluations WHERE id=$1", evalID).Scan(&evalUserID, &vendorCount)
	if err != nil {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}
	if evalUserID != userID {
		jsonError(w, "unauthorized", http.StatusForbidden)
		return
	}
	if vendorCount >= 8 {
		jsonError(w, "maximum 8 vendors per evaluation", http.StatusBadRequest)
		return
	}

	var req struct {
		VendorName string `json:"vendor_name"`
		Content    string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.VendorName == "" || req.Content == "" {
		jsonError(w, "vendor_name and content are required", http.StatusBadRequest)
		return
	}

	vendorID := uuid.New().String()
	_, err = db.Exec(
		`INSERT INTO vendors (id, evaluation_id, name, file_name, raw_text)
		 VALUES ($1,$2,$3,$4,$5)`,
		vendorID, evalID, req.VendorName, req.VendorName+".txt", req.Content,
	)
	if err != nil {
		jsonError(w, "failed to store vendor proposal", http.StatusInternalServerError)
		return
	}

	_, err = db.Exec(
		"UPDATE evaluations SET vendor_count = vendor_count + 1 WHERE id = $1", evalID,
	)
	if err != nil {
		log.Printf("failed to update vendor_count: %v", err)
	}

	jsonOK(w, map[string]interface{}{
		"vendor_id":   vendorID,
		"vendor_name": req.VendorName,
		"message":     "vendor proposal uploaded successfully",
	})
}

// ---------------------------------------------------------------------------
// AI Analysis
// ---------------------------------------------------------------------------

func handleAnalyze(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	// Load evaluation
	var e Evaluation
	err := db.QueryRow(
		`SELECT id, user_id, title, status, requirements_text, vendor_count
		 FROM evaluations WHERE id = $1 AND user_id = $2`, evalID, userID,
	).Scan(&e.ID, &e.UserID, &e.Title, &e.Status, &e.RequirementsText, &e.VendorCount)
	if err != nil {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}
	if e.VendorCount == 0 {
		jsonError(w, "no vendors uploaded yet", http.StatusBadRequest)
		return
	}

	// Update status to analyzing
	db.Exec("UPDATE evaluations SET status = 'analyzing' WHERE id = $1", evalID)

	// Load vendor proposals
	rows, err := db.Query(
		"SELECT id, name, raw_text FROM vendors WHERE evaluation_id = $1", evalID,
	)
	if err != nil {
		jsonError(w, "failed to load vendors", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type vendorInput struct {
		ID           string
		Name         string
		ProposalText string
	}
	var inputs []vendorInput
	for rows.Next() {
		var vi vendorInput
		rows.Scan(&vi.ID, &vi.Name, &vi.ProposalText)
		inputs = append(inputs, vi)
	}

	// Analyze each vendor
	var analyzedVendors []Vendor
	for _, vi := range inputs {
		// Extract vendor data
		extraction, err := extractVendorData(vi.ProposalText, e.RequirementsText)
		if err != nil {
			log.Printf("extraction failed for vendor %s: %v", vi.Name, err)
			db.Exec("UPDATE evaluations SET status = 'error' WHERE id = $1", evalID)
			jsonError(w, fmt.Sprintf("AI extraction failed for vendor %s: %v", vi.Name, err), http.StatusInternalServerError)
			return
		}

		// Score vendor
		scoring, err := scoreVendor(*extraction, e.RequirementsText)
		if err != nil {
			log.Printf("scoring failed for vendor %s: %v", vi.Name, err)
			db.Exec("UPDATE evaluations SET status = 'error' WHERE id = $1", evalID)
			jsonError(w, fmt.Sprintf("AI scoring failed for vendor %s: %v", vi.Name, err), http.StatusInternalServerError)
			return
		}

		// Marshal JSONB fields
		strengthsJSON, _ := json.Marshal(extraction.Strengths)
		weaknessesJSON, _ := json.Marshal(extraction.Weaknesses)
		redFlagsJSON, _ := json.Marshal(extraction.RedFlags)
		hiddenCostsJSON, _ := json.Marshal(extraction.HiddenCosts)

		// Update vendor in DB
		_, err = db.Exec(
			`UPDATE vendors SET
				total_cost=$1, currency=$2, timeline_weeks=$3, payment_terms=$4,
				sla_uptime=$5, sla_response=$6,
				overall_score=$7, cost_score=$8, timeline_score=$9, quality_score=$10,
				risk_score=$11, sla_score=$12, summary=$13,
				strengths=$14, weaknesses=$15, red_flags=$16, hidden_costs=$17
			 WHERE id=$18`,
			extraction.TotalCost, extraction.Currency, extraction.TimelineWeeks, extraction.PaymentTerms,
			extraction.SLAUptime, extraction.SLAResponse,
			scoring.OverallScore, scoring.CostScore, scoring.TimelineScore, scoring.QualityScore,
			scoring.RiskScore, scoring.SLAScore, extraction.Summary,
			string(strengthsJSON), string(weaknessesJSON), string(redFlagsJSON), string(hiddenCostsJSON),
			vi.ID,
		)
		if err != nil {
			log.Printf("failed to update vendor %s: %v", vi.Name, err)
		}

		vendor := Vendor{
			ID:            vi.ID,
			EvaluationID:  evalID,
			Name:          vi.Name,
			FileName:      vi.Name + ".txt",
			TotalCost:     extraction.TotalCost,
			Currency:      extraction.Currency,
			TimelineWeeks: extraction.TimelineWeeks,
			PaymentTerms:  extraction.PaymentTerms,
			SLAUptime:     extraction.SLAUptime,
			SLAResponse:   extraction.SLAResponse,
			OverallScore:  scoring.OverallScore,
			CostScore:     scoring.CostScore,
			TimelineScore: scoring.TimelineScore,
			QualityScore:  scoring.QualityScore,
			RiskScore:     scoring.RiskScore,
			SLAScore:      scoring.SLAScore,
			Summary:       extraction.Summary,
			Strengths:     extraction.Strengths,
			Weaknesses:    extraction.Weaknesses,
			RedFlags:      extraction.RedFlags,
			HiddenCosts:   extraction.HiddenCosts,
		}
		analyzedVendors = append(analyzedVendors, vendor)
	}

	// Generate recommendation
	rec, err := generateRecommendation(analyzedVendors, e.RequirementsText)
	if err != nil {
		log.Printf("recommendation generation failed: %v", err)
		db.Exec("UPDATE evaluations SET status = 'error' WHERE id = $1", evalID)
		jsonError(w, fmt.Sprintf("AI recommendation failed: %v", err), http.StatusInternalServerError)
		return
	}
	rec.EvaluationID = evalID

	// Store recommendation
	tipsJSON, _ := json.Marshal(rec.NegotiationTips)
	risksJSON, _ := json.Marshal(rec.Risks)
	var recVendorID *string
	if rec.RecommendedVendor != nil {
		recVendorID = &rec.RecommendedVendor.ID
	}
	db.Exec(
		`INSERT INTO recommendations (evaluation_id, recommended_vendor_id, reasoning, confidence_score, negotiation_tips, risks)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 ON CONFLICT (evaluation_id) DO UPDATE SET
		   recommended_vendor_id=$2, reasoning=$3, confidence_score=$4, negotiation_tips=$5, risks=$6`,
		evalID, recVendorID, rec.Reasoning, rec.ConfidenceScore, string(tipsJSON), string(risksJSON),
	)

	// Mark evaluation completed
	now := time.Now()
	db.Exec(
		"UPDATE evaluations SET status = 'completed', winner_vendor_id = $1, completed_at = $2 WHERE id = $3",
		recVendorID, now, evalID,
	)

	jsonOK(w, map[string]interface{}{
		"evaluation_id":  evalID,
		"status":         "completed",
		"vendors":        analyzedVendors,
		"recommendation": rec,
	})
}

// ---------------------------------------------------------------------------
// Built-in Analysis Engine (no external API required)
// ---------------------------------------------------------------------------

var (
	reINRAmount   = regexp.MustCompile(`(?i)(?:inr|₹|rs\.?)\s*([\d,]+(?:\.\d+)?)`)
	reLakhAmount  = regexp.MustCompile(`(?i)([\d,.]+)\s*(?:lakh|lac|L)\b`)
	rePercent     = regexp.MustCompile(`([\d.]+)\s*%`)
	reWeeks       = regexp.MustCompile(`(?i)(\d+)\s*weeks?`)
	reMonths      = regexp.MustCompile(`(?i)(\d+)\s*months?`)
	reHours       = regexp.MustCompile(`(?i)(\d+)\s*(?:hr|hour)s?`)
	reYear1Total  = regexp.MustCompile(`(?i)(?:year\s*1|first\s*year|total)[^\n]*?(?:inr|₹|rs\.?)\s*([\d,]+(?:\.\d+)?)`)
)

func parseINR(s string) float64 {
	s = strings.ReplaceAll(s, ",", "")
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

func extractTotalCost(text string) float64 {
	// Try Year 1 / total cost first
	if m := reYear1Total.FindStringSubmatch(text); len(m) > 1 {
		return parseINR(m[1])
	}
	// Try lakh amounts (pick largest)
	var maxLakh float64
	for _, m := range reLakhAmount.FindAllStringSubmatch(text, -1) {
		v := parseINR(m[1])
		if v > maxLakh {
			maxLakh = v
		}
	}
	if maxLakh > 0 {
		return maxLakh * 100000
	}
	// Try INR amounts (pick largest)
	var maxINR float64
	for _, m := range reINRAmount.FindAllStringSubmatch(text, -1) {
		v := parseINR(m[1])
		if v > maxINR {
			maxINR = v
		}
	}
	return maxINR
}

func extractTimeline(text string) int {
	if m := reWeeks.FindStringSubmatch(text); len(m) > 1 {
		v, _ := strconv.Atoi(m[1])
		return v
	}
	if m := reMonths.FindStringSubmatch(text); len(m) > 1 {
		v, _ := strconv.Atoi(m[1])
		return v * 4
	}
	return 0
}

func extractUptime(text string) string {
	lower := strings.ToLower(text)
	// Find uptime percentages (99.X%)
	idx := strings.Index(lower, "uptime")
	if idx == -1 {
		idx = strings.Index(lower, "availability")
	}
	if idx == -1 {
		idx = strings.Index(lower, "sla")
	}
	if idx >= 0 {
		// Search FORWARD from the keyword only to avoid picking up unrelated percentages
		end := idx + 200
		if end > len(text) {
			end = len(text)
		}
		snippet := text[idx:end]
		if m := rePercent.FindStringSubmatch(snippet); len(m) > 1 {
			return m[1] + "%"
		}
	}
	// Fallback: find any 99.X%
	for _, m := range rePercent.FindAllStringSubmatch(text, -1) {
		v, _ := strconv.ParseFloat(m[1], 64)
		if v >= 99.0 && v <= 100.0 {
			return m[1] + "%"
		}
	}
	return "Unknown"
}

func extractResponseTime(text string) string {
	lower := strings.ToLower(text)
	keywords := []string{"response time", "p1", "critical", "priority 1", "sla response"}
	for _, kw := range keywords {
		idx := strings.Index(lower, kw)
		if idx >= 0 {
			end := idx + 150
			if end > len(text) {
				end = len(text)
			}
			snippet := text[idx:end]
			if m := reHours.FindStringSubmatch(snippet); len(m) > 1 {
				return m[1] + " hours"
			}
			if strings.Contains(strings.ToLower(snippet), "30 min") || strings.Contains(strings.ToLower(snippet), "30-min") {
				return "30 minutes"
			}
		}
	}
	if m := reHours.FindStringSubmatch(text); len(m) > 1 {
		return m[1] + " hours"
	}
	return "Unknown"
}

func extractPaymentTerms(text string) string {
	lower := strings.ToLower(text)
	if strings.Contains(lower, "monthly") {
		return "Monthly"
	}
	if strings.Contains(lower, "quarterly") {
		return "Quarterly"
	}
	if strings.Contains(lower, "milestone") {
		return "Milestone-based"
	}
	if strings.Contains(lower, "annual") || strings.Contains(lower, "yearly") {
		return "Annual"
	}
	return "Not specified"
}

func extractSupportType(text string) string {
	lower := strings.ToLower(text)
	if strings.Contains(lower, "24/7") || strings.Contains(lower, "24x7") || strings.Contains(lower, "24 x 7") {
		return "24/7 Support"
	}
	if strings.Contains(lower, "business hours") || strings.Contains(lower, "9-5") || strings.Contains(lower, "9am") {
		return "Business Hours"
	}
	if strings.Contains(lower, "dedicated") {
		return "Dedicated Support"
	}
	return "Standard Support"
}

type redFlagPattern struct {
	Keywords    []string
	Severity    string
	Category    string
	Description string
}

var redFlagPatterns = []redFlagPattern{
	{[]string{"auto-renewal", "auto renewal", "automatically renew"}, "critical", "Contract Terms", "Auto-renewal clause detected — contract renews automatically unless cancelled within a specific window"},
	{[]string{"escalation clause", "price escalation", "annual increase", "% increase", "% escalation", "15% escalation"}, "critical", "Pricing", "Price escalation clause — costs may increase significantly over time"},
	{[]string{"limited liability", "liability cap", "not liable", "no liability"}, "high", "Legal", "Limited liability clause — vendor limits responsibility for failures or data loss"},
	{[]string{"termination fee", "early termination", "exit fee", "cancellation fee"}, "high", "Contract Terms", "Early termination penalties — switching vendors could be costly"},
	{[]string{"additional charge", "extra charge", "surcharge", "additional cost", "not included"}, "medium", "Pricing", "Additional charges beyond base pricing detected"},
	{[]string{"weekend support", "weekend charge", "after-hours charge", "overtime"}, "medium", "Support", "Extra charges for weekend or after-hours support"},
	{[]string{"shared resource", "shared team", "part-time", "shared devops"}, "medium", "Resources", "Shared resources — team members may be split across other projects"},
	{[]string{"data lock", "proprietary format", "vendor lock"}, "high", "Technology", "Potential vendor lock-in — data portability may be limited"},
}

func extractRedFlags(text string) []RedFlag {
	lower := strings.ToLower(text)
	var flags []RedFlag
	for _, pattern := range redFlagPatterns {
		for _, kw := range pattern.Keywords {
			idx := strings.Index(lower, kw)
			if idx >= 0 {
				// Check for negation before the keyword (e.g., "no auto-renewal")
				negated := false
				prefixStart := idx - 20
				if prefixStart < 0 {
					prefixStart = 0
				}
				prefix := strings.ToLower(strings.TrimSpace(text[prefixStart:idx]))
				negationWords := []string{"no ", "not ", "without ", "don't ", "doesn't ", "zero ", "none ", "never "}
				for _, neg := range negationWords {
					if strings.HasSuffix(prefix+" ", neg) || strings.HasSuffix(prefix+"\n", neg) {
						negated = true
						break
					}
				}
				if negated {
					break // skip this pattern — it's negated
				}

				// Extract surrounding clause text
				start := idx - 50
				if start < 0 {
					start = 0
				}
				end := idx + len(kw) + 100
				if end > len(text) {
					end = len(text)
				}
				clause := strings.TrimSpace(text[start:end])
				clause = strings.ReplaceAll(clause, "\n", " ")

				flags = append(flags, RedFlag{
					Severity:    pattern.Severity,
					Category:    pattern.Category,
					Description: pattern.Description,
					ClauseText:  clause,
				})
				break // one flag per pattern
			}
		}
	}
	return flags
}

func extractHiddenCosts(text string) []string {
	lower := strings.ToLower(text)
	var costs []string
	hiddenPatterns := map[string]string{
		"additional charge":  "Additional charges may apply beyond the quoted price",
		"not included":       "Some services are explicitly excluded from the base price",
		"extra cost":         "Extra costs identified outside the main pricing",
		"surcharge":          "Surcharges apply for certain services",
		"setup fee":          "One-time setup or onboarding fee",
		"migration cost":     "Data migration costs may be additional",
		"training fee":       "Training costs not included in base price",
		"license fee":        "Separate license fees may apply",
		"weekend":            "Weekend/after-hours support may incur extra charges",
		"overtime":           "Overtime charges for work outside standard hours",
		"escalation":         "Price escalation clause may increase costs annually",
	}
	for pattern, description := range hiddenPatterns {
		if strings.Contains(lower, pattern) {
			costs = append(costs, description)
		}
	}
	return costs
}

func extractStrengths(text string) []string {
	lower := strings.ToLower(text)
	var strengths []string
	strengthPatterns := map[string]string{
		"24/7":               "24/7 support availability",
		"24x7":               "24/7 support availability",
		"dedicated":          "Dedicated team resources",
		"99.9%":              "High SLA commitment (99.9%+ uptime)",
		"99.95%":             "Very high SLA commitment (99.95%+ uptime)",
		"fixed price":        "Fixed pricing with no escalation",
		"no escalation":      "No price escalation clause",
		"data migration":     "Data migration support included",
		"security":           "Security specialist or security measures included",
		"penalty":            "Timeline penalty clause protects the client",
		"no termination fee": "No early termination fee",
		"certified":          "Team includes certified professionals",
		"warranty":           "Warranty period included",
	}
	for pattern, desc := range strengthPatterns {
		if strings.Contains(lower, pattern) {
			strengths = append(strengths, desc)
		}
	}
	if len(strengths) == 0 {
		strengths = []string{"Proposal submitted for evaluation"}
	}
	return strengths
}

func extractWeaknesses(text string) []string {
	lower := strings.ToLower(text)
	var weaknesses []string
	weaknessPatterns := map[string]string{
		"auto-renewal":       "Auto-renewal clause may trap client in long-term contract",
		"auto renewal":       "Auto-renewal clause may trap client in long-term contract",
		"escalation":         "Price escalation clause increases costs over time",
		"limited liability":  "Limited liability reduces vendor accountability",
		"shared":             "Shared resources may lead to divided attention",
		"not included":       "Some expected services are not included",
		"additional charge":  "Hidden additional charges beyond base price",
		"business hours only": "Support limited to business hours",
	}
	for pattern, desc := range weaknessPatterns {
		if strings.Contains(lower, pattern) {
			weaknesses = append(weaknesses, desc)
		}
	}
	if len(weaknesses) == 0 {
		weaknesses = []string{"No significant weaknesses identified in initial analysis"}
	}
	return weaknesses
}

func extractVendorData(vendorText, requirementsText string) (*ExtractionResult, error) {
	lines := strings.Split(strings.TrimSpace(vendorText), "\n")
	vendorName := "Unknown Vendor"
	if len(lines) > 0 {
		// Use first non-empty line as vendor name hint
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" && len(line) < 100 {
				vendorName = line
				break
			}
		}
	}

	currency := "INR"
	if strings.Contains(strings.ToLower(vendorText), "usd") || strings.Contains(vendorText, "$") {
		currency = "USD"
	}

	result := &ExtractionResult{
		VendorName:    vendorName,
		TotalCost:     extractTotalCost(vendorText),
		Currency:      currency,
		TimelineWeeks: extractTimeline(vendorText),
		PaymentTerms:  extractPaymentTerms(vendorText),
		SLAUptime:     extractUptime(vendorText),
		SLAResponse:   extractResponseTime(vendorText),
		SupportType:   extractSupportType(vendorText),
		Strengths:     extractStrengths(vendorText),
		Weaknesses:    extractWeaknesses(vendorText),
		HiddenCosts:   extractHiddenCosts(vendorText),
		RedFlags:      extractRedFlags(vendorText),
	}

	// Generate summary
	result.Summary = fmt.Sprintf("%s proposes a solution at %s %.0f with a %d-week timeline. SLA: %s uptime, %s response time. %d red flag(s) identified.",
		result.VendorName, result.Currency, result.TotalCost, result.TimelineWeeks,
		result.SLAUptime, result.SLAResponse, len(result.RedFlags))

	return result, nil
}

func scoreVendor(vendor ExtractionResult, requirements string) (*ScoringResult, error) {
	// Parse budget from requirements
	budgetCap := 2000000.0 // default 20 lakh
	if m := reYear1Total.FindStringSubmatch(requirements); len(m) > 1 {
		budgetCap = parseINR(m[1])
	} else if m := reLakhAmount.FindStringSubmatch(requirements); len(m) > 1 {
		budgetCap = parseINR(m[1]) * 100000
	} else if m := reINRAmount.FindStringSubmatch(requirements); len(m) > 1 {
		budgetCap = parseINR(m[1])
	}

	// Cost score: 100 if well under budget, lower as it approaches/exceeds budget
	costScore := 100.0
	if budgetCap > 0 && vendor.TotalCost > 0 {
		ratio := vendor.TotalCost / budgetCap
		if ratio <= 0.7 {
			costScore = 95
		} else if ratio <= 0.85 {
			costScore = 85
		} else if ratio <= 1.0 {
			costScore = 70
		} else if ratio <= 1.2 {
			costScore = 45
		} else {
			costScore = 25
		}
	}

	// Timeline score
	timelineScore := 75.0
	if vendor.TimelineWeeks > 0 {
		if vendor.TimelineWeeks <= 8 {
			timelineScore = 90
		} else if vendor.TimelineWeeks <= 12 {
			timelineScore = 75
		} else if vendor.TimelineWeeks <= 16 {
			timelineScore = 60
		} else {
			timelineScore = 40
		}
	}

	// SLA score
	slaScore := 50.0
	uptimeVal := 0.0
	if m := rePercent.FindStringSubmatch(vendor.SLAUptime); len(m) > 1 {
		uptimeVal, _ = strconv.ParseFloat(m[1], 64)
	}
	if uptimeVal >= 99.99 {
		slaScore = 98
	} else if uptimeVal >= 99.9 {
		slaScore = 90
	} else if uptimeVal >= 99.5 {
		slaScore = 70
	} else if uptimeVal >= 99.0 {
		slaScore = 55
	} else if uptimeVal > 0 {
		slaScore = 35
	}
	// Boost for fast response time
	if strings.Contains(vendor.SLAResponse, "1 hour") || strings.Contains(vendor.SLAResponse, "1 hours") {
		slaScore = math.Min(slaScore+10, 100)
	}

	// Risk score: higher is safer
	riskScore := 95.0
	criticalFlags := 0
	highFlags := 0
	for _, rf := range vendor.RedFlags {
		switch rf.Severity {
		case "critical":
			criticalFlags++
		case "high":
			highFlags++
		default:
			riskScore -= 3
		}
	}
	riskScore -= float64(criticalFlags) * 20
	riskScore -= float64(highFlags) * 12
	riskScore -= float64(len(vendor.HiddenCosts)) * 5
	if riskScore < 10 {
		riskScore = 10
	}

	// Quality score
	qualityScore := 60.0
	qualityScore += float64(len(vendor.Strengths)) * 5
	qualityScore -= float64(len(vendor.Weaknesses)) * 5
	if vendor.SupportType == "24/7 Support" {
		qualityScore += 10
	}
	if qualityScore > 100 {
		qualityScore = 100
	}
	if qualityScore < 10 {
		qualityScore = 10
	}

	// Overall: weighted average
	overall := costScore*0.25 + timelineScore*0.15 + qualityScore*0.30 + riskScore*0.15 + slaScore*0.15

	return &ScoringResult{
		OverallScore:  math.Round(overall*10) / 10,
		CostScore:     math.Round(costScore*10) / 10,
		TimelineScore: math.Round(timelineScore*10) / 10,
		QualityScore:  math.Round(qualityScore*10) / 10,
		RiskScore:     math.Round(riskScore*10) / 10,
		SLAScore:      math.Round(slaScore*10) / 10,
	}, nil
}

func generateRecommendation(vendors []Vendor, requirements string) (*Recommendation, error) {
	if len(vendors) == 0 {
		return nil, fmt.Errorf("no vendors to evaluate")
	}

	// Sort by overall score descending
	sorted := make([]Vendor, len(vendors))
	copy(sorted, vendors)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].OverallScore > sorted[j].OverallScore
	})

	winner := sorted[0]
	rec := &Recommendation{
		ConfidenceScore: 75,
	}

	// Build reasoning
	var reasoning strings.Builder
	reasoning.WriteString(fmt.Sprintf("%s is the recommended vendor with an overall score of %.1f. ", winner.Name, winner.OverallScore))

	if len(sorted) > 1 {
		runnerUp := sorted[1]
		scoreDiff := winner.OverallScore - runnerUp.OverallScore
		rec.ConfidenceScore = math.Min(50+scoreDiff*3, 95)

		reasoning.WriteString(fmt.Sprintf("Compared to the runner-up %s (score: %.1f), ", runnerUp.Name, runnerUp.OverallScore))

		var advantages []string
		if winner.CostScore > runnerUp.CostScore {
			advantages = append(advantages, "more competitive pricing")
		}
		if winner.RiskScore > runnerUp.RiskScore {
			advantages = append(advantages, "lower risk profile")
		}
		if winner.SLAScore > runnerUp.SLAScore {
			advantages = append(advantages, "stronger SLA commitments")
		}
		if winner.QualityScore > runnerUp.QualityScore {
			advantages = append(advantages, "higher quality proposal")
		}
		if len(advantages) > 0 {
			reasoning.WriteString(fmt.Sprintf("%s offers %s. ", winner.Name, strings.Join(advantages, ", ")))
		}
	}

	if winner.TotalCost > 0 {
		reasoning.WriteString(fmt.Sprintf("Total Year 1 cost: %s %.0f. ", winner.Currency, winner.TotalCost))
	}
	if len(winner.RedFlags) == 0 {
		reasoning.WriteString("No red flags were identified in this proposal.")
	} else {
		reasoning.WriteString(fmt.Sprintf("%d red flag(s) identified — review recommended before final decision.", len(winner.RedFlags)))
	}

	rec.Reasoning = reasoning.String()
	v := winner
	rec.RecommendedVendor = &v

	// Generate negotiation tips
	tips := []string{}
	if winner.TotalCost > 0 {
		tips = append(tips, fmt.Sprintf("Negotiate for a 10-15%% discount on the total cost of %s %.0f", winner.Currency, winner.TotalCost))
	}
	if winner.TimelineWeeks > 0 {
		tips = append(tips, fmt.Sprintf("Request timeline guarantees with penalty clauses for delays beyond %d weeks", winner.TimelineWeeks))
	}
	tips = append(tips, "Request a detailed breakdown of all costs to prevent hidden charges")
	tips = append(tips, "Negotiate for a 30-day trial or pilot phase before full commitment")
	if len(sorted) > 1 {
		tips = append(tips, fmt.Sprintf("Use %s's proposal as leverage in price negotiations", sorted[1].Name))
	}
	rec.NegotiationTips = tips

	// Generate risks
	risks := []string{}
	for _, v := range vendors {
		for _, rf := range v.RedFlags {
			if rf.Severity == "critical" || rf.Severity == "high" {
				risks = append(risks, fmt.Sprintf("%s: %s", v.Name, rf.Description))
			}
		}
	}
	if len(risks) == 0 {
		risks = append(risks, "No critical risks identified across vendor proposals")
	}
	risks = append(risks, "Always verify vendor claims through reference checks before final decision")
	rec.Risks = risks

	return rec, nil
}

// ---------------------------------------------------------------------------
// Comparison handler
// ---------------------------------------------------------------------------

func handleComparison(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	// Verify ownership
	var exists bool
	db.QueryRow("SELECT EXISTS(SELECT 1 FROM evaluations WHERE id=$1 AND user_id=$2)", evalID, userID).Scan(&exists)
	if !exists {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}

	vendors, err := getVendorsForEvaluation(evalID)
	if err != nil {
		jsonError(w, "failed to load vendors", http.StatusInternalServerError)
		return
	}

	// Build comparison matrix
	type ComparisonRow struct {
		Metric string             `json:"metric"`
		Values map[string]interface{} `json:"values"`
	}

	metrics := []string{"Total Cost", "Timeline (weeks)", "Overall Score", "Cost Score",
		"Timeline Score", "Quality Score", "Risk Score", "SLA Score",
		"SLA Uptime", "SLA Response Time", "Payment Terms"}

	var matrix []ComparisonRow
	for _, metric := range metrics {
		row := ComparisonRow{Metric: metric, Values: make(map[string]interface{})}
		for _, v := range vendors {
			switch metric {
			case "Total Cost":
				row.Values[v.Name] = fmt.Sprintf("%s %.2f", v.Currency, v.TotalCost)
			case "Timeline (weeks)":
				row.Values[v.Name] = v.TimelineWeeks
			case "Overall Score":
				row.Values[v.Name] = v.OverallScore
			case "Cost Score":
				row.Values[v.Name] = v.CostScore
			case "Timeline Score":
				row.Values[v.Name] = v.TimelineScore
			case "Quality Score":
				row.Values[v.Name] = v.QualityScore
			case "Risk Score":
				row.Values[v.Name] = v.RiskScore
			case "SLA Score":
				row.Values[v.Name] = v.SLAScore
			case "SLA Uptime":
				row.Values[v.Name] = v.SLAUptime
			case "SLA Response Time":
				row.Values[v.Name] = v.SLAResponse
			case "Payment Terms":
				row.Values[v.Name] = v.PaymentTerms
			}
		}
		matrix = append(matrix, row)
	}

	jsonOK(w, map[string]interface{}{
		"evaluation_id": evalID,
		"vendors":       vendors,
		"matrix":        matrix,
	})
}

// ---------------------------------------------------------------------------
// Recommendation handler
// ---------------------------------------------------------------------------

func handleRecommendation(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	// Verify ownership
	var exists bool
	db.QueryRow("SELECT EXISTS(SELECT 1 FROM evaluations WHERE id=$1 AND user_id=$2)", evalID, userID).Scan(&exists)
	if !exists {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}

	var recVendorID *string
	var reasoning string
	var confidence float64
	var tipsBytes, risksBytes []byte

	err := db.QueryRow(
		`SELECT recommended_vendor_id, reasoning, confidence_score, negotiation_tips, risks
		 FROM recommendations WHERE evaluation_id = $1`, evalID,
	).Scan(&recVendorID, &reasoning, &confidence, &tipsBytes, &risksBytes)
	if err != nil {
		jsonError(w, "recommendation not found - run analysis first", http.StatusNotFound)
		return
	}

	rec := Recommendation{
		EvaluationID:    evalID,
		Reasoning:       reasoning,
		ConfidenceScore: confidence,
	}
	json.Unmarshal(tipsBytes, &rec.NegotiationTips)
	json.Unmarshal(risksBytes, &rec.Risks)

	if rec.NegotiationTips == nil {
		rec.NegotiationTips = []string{}
	}
	if rec.Risks == nil {
		rec.Risks = []string{}
	}

	// Load recommended vendor
	if recVendorID != nil {
		vendors, _ := getVendorsForEvaluation(evalID)
		for _, v := range vendors {
			if v.ID == *recVendorID {
				vCopy := v
				rec.RecommendedVendor = &vCopy
				break
			}
		}
	}

	jsonOK(w, rec)
}

// ---------------------------------------------------------------------------
// Report handler
// ---------------------------------------------------------------------------

func handleReport(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	var e Evaluation
	err := db.QueryRow(
		`SELECT id, user_id, title, status, requirements_text, vendor_count,
		        winner_vendor_id, created_at, completed_at
		 FROM evaluations WHERE id = $1 AND user_id = $2`, evalID, userID,
	).Scan(&e.ID, &e.UserID, &e.Title, &e.Status, &e.RequirementsText,
		&e.VendorCount, &e.WinnerVendorID, &e.CreatedAt, &e.CompletedAt)
	if err != nil {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}

	vendors, _ := getVendorsForEvaluation(evalID)

	// Load recommendation
	var recVendorID *string
	var reasoning string
	var confidence float64
	var tipsBytes, risksBytes []byte
	var hasRec bool

	err = db.QueryRow(
		`SELECT recommended_vendor_id, reasoning, confidence_score, negotiation_tips, risks
		 FROM recommendations WHERE evaluation_id = $1`, evalID,
	).Scan(&recVendorID, &reasoning, &confidence, &tipsBytes, &risksBytes)
	hasRec = err == nil

	var tips, risks []string
	if hasRec {
		json.Unmarshal(tipsBytes, &tips)
		json.Unmarshal(risksBytes, &risks)
	}

	// Find recommended vendor name
	recVendorName := "N/A"
	if recVendorID != nil {
		for _, v := range vendors {
			if v.ID == *recVendorID {
				recVendorName = v.Name
				break
			}
		}
	}

	// Build HTML
	html := buildReportHTML(e, vendors, recVendorName, reasoning, confidence, tips, risks, hasRec)

	jsonOK(w, map[string]string{"html": html})
}

func buildReportHTML(e Evaluation, vendors []Vendor, recVendorName, reasoning string, confidence float64, tips, risks []string, hasRec bool) string {
	var sb strings.Builder

	sb.WriteString(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vendor Evaluation Report</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; color: #333; }
  .container { max-width: 1000px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #1e40af; margin: 0; font-size: 28px; }
  .header .subtitle { color: #6b7280; margin-top: 8px; }
  .section { margin-bottom: 30px; }
  .section h2 { color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .rec-box { background: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
  .rec-box h3 { color: #1e40af; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th, td { padding: 10px 12px; text-align: left; border: 1px solid #e5e7eb; }
  th { background: #f8fafc; color: #374151; font-weight: 600; }
  .score { font-weight: bold; }
  .score-high { color: #059669; }
  .score-mid { color: #d97706; }
  .score-low { color: #dc2626; }
  .red-flag { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px 15px; margin: 8px 0; border-radius: 0 4px 4px 0; }
  .red-flag.high { border-left-color: #f97316; background: #fff7ed; }
  .red-flag.medium { border-left-color: #eab308; background: #fefce8; }
  .red-flag.low { border-left-color: #6b7280; background: #f9fafb; }
  .tip { background: #f0fdf4; border-left: 4px solid #059669; padding: 10px 15px; margin: 8px 0; border-radius: 0 4px 4px 0; }
  .footer { text-align: center; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>
<div class="container">
`)

	// Header
	sb.WriteString(fmt.Sprintf(`<div class="header">
  <h1>%s</h1>
  <div class="subtitle">Vendor Evaluation Report &middot; Generated on %s</div>
</div>
`, e.Title, e.CreatedAt.Format("January 2, 2006")))

	// Executive Summary
	sb.WriteString(`<div class="section">
  <h2>Executive Summary</h2>
`)
	sb.WriteString(fmt.Sprintf(`  <p>This report evaluates <strong>%d vendor(s)</strong> against the specified requirements. `, len(vendors)))
	if hasRec {
		sb.WriteString(fmt.Sprintf(`The recommended vendor is <strong>%s</strong> with a confidence score of <strong>%.0f%%</strong>.</p>`, recVendorName, confidence))
	} else {
		sb.WriteString(`Analysis is pending.</p>`)
	}
	sb.WriteString("\n</div>\n")

	// Recommendation Box
	if hasRec {
		sb.WriteString(`<div class="rec-box">
  <h3>Recommendation</h3>
`)
		sb.WriteString(fmt.Sprintf(`  <p><strong>Recommended Vendor:</strong> %s</p>
  <p><strong>Confidence:</strong> %.0f%%</p>
  <p>%s</p>
</div>
`, recVendorName, confidence, reasoning))
	}

	// Comparison Table
	sb.WriteString(`<div class="section">
  <h2>Vendor Comparison</h2>
  <table>
    <tr><th>Metric</th>`)
	for _, v := range vendors {
		sb.WriteString(fmt.Sprintf(`<th>%s</th>`, v.Name))
	}
	sb.WriteString("</tr>\n")

	// Score rows
	type metricRow struct {
		label string
		fn    func(Vendor) string
	}
	metricRows := []metricRow{
		{"Total Cost", func(v Vendor) string { return fmt.Sprintf("%s %.2f", v.Currency, v.TotalCost) }},
		{"Timeline", func(v Vendor) string { return fmt.Sprintf("%d weeks", v.TimelineWeeks) }},
		{"Overall Score", func(v Vendor) string { return scoreCell(v.OverallScore) }},
		{"Cost Score", func(v Vendor) string { return scoreCell(v.CostScore) }},
		{"Timeline Score", func(v Vendor) string { return scoreCell(v.TimelineScore) }},
		{"Quality Score", func(v Vendor) string { return scoreCell(v.QualityScore) }},
		{"Risk Score", func(v Vendor) string { return scoreCell(v.RiskScore) }},
		{"SLA Score", func(v Vendor) string { return scoreCell(v.SLAScore) }},
		{"SLA Uptime", func(v Vendor) string { return v.SLAUptime }},
		{"SLA Response", func(v Vendor) string { return v.SLAResponse }},
		{"Payment Terms", func(v Vendor) string { return v.PaymentTerms }},
	}

	for _, mr := range metricRows {
		sb.WriteString(fmt.Sprintf(`    <tr><td><strong>%s</strong></td>`, mr.label))
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf(`<td>%s</td>`, mr.fn(v)))
		}
		sb.WriteString("</tr>\n")
	}
	sb.WriteString("  </table>\n</div>\n")

	// Red Flags per Vendor
	sb.WriteString(`<div class="section">
  <h2>Red Flags</h2>
`)
	for _, v := range vendors {
		sb.WriteString(fmt.Sprintf(`  <h3>%s</h3>`, v.Name))
		if len(v.RedFlags) == 0 {
			sb.WriteString("  <p>No red flags identified.</p>\n")
		} else {
			for _, rf := range v.RedFlags {
				cssClass := "red-flag"
				if rf.Severity == "high" || rf.Severity == "medium" || rf.Severity == "low" {
					cssClass += " " + rf.Severity
				}
				sb.WriteString(fmt.Sprintf(`  <div class="%s">
    <strong>[%s] %s:</strong> %s
    <br><em>Clause: "%s"</em>
  </div>
`, cssClass, strings.ToUpper(rf.Severity), rf.Category, rf.Description, rf.ClauseText))
			}
		}
	}
	sb.WriteString("</div>\n")

	// Scores Breakdown per Vendor
	sb.WriteString(`<div class="section">
  <h2>Detailed Scores Breakdown</h2>
`)
	for _, v := range vendors {
		sb.WriteString(fmt.Sprintf(`  <h3>%s (Overall: %s)</h3>
  <p><strong>Summary:</strong> %s</p>
  <p><strong>Strengths:</strong></p>
  <ul>
`, v.Name, scoreCell(v.OverallScore), v.Summary))
		for _, s := range v.Strengths {
			sb.WriteString(fmt.Sprintf("    <li>%s</li>\n", s))
		}
		sb.WriteString("  </ul>\n  <p><strong>Weaknesses:</strong></p>\n  <ul>\n")
		for _, w := range v.Weaknesses {
			sb.WriteString(fmt.Sprintf("    <li>%s</li>\n", w))
		}
		sb.WriteString("  </ul>\n")
		if len(v.HiddenCosts) > 0 {
			sb.WriteString("  <p><strong>Hidden Costs:</strong></p>\n  <ul>\n")
			for _, hc := range v.HiddenCosts {
				sb.WriteString(fmt.Sprintf("    <li>%s</li>\n", hc))
			}
			sb.WriteString("  </ul>\n")
		}
	}
	sb.WriteString("</div>\n")

	// Negotiation Tips
	if len(tips) > 0 {
		sb.WriteString(`<div class="section">
  <h2>Negotiation Tips</h2>
`)
		for _, t := range tips {
			sb.WriteString(fmt.Sprintf(`  <div class="tip">%s</div>
`, t))
		}
		sb.WriteString("</div>\n")
	}

	// Risks
	if len(risks) > 0 {
		sb.WriteString(`<div class="section">
  <h2>Key Risks</h2>
  <ul>
`)
		for _, rsk := range risks {
			sb.WriteString(fmt.Sprintf("    <li>%s</li>\n", rsk))
		}
		sb.WriteString("  </ul>\n</div>\n")
	}

	// Footer
	sb.WriteString(`<div class="footer">
  Generated by VendorEval AI
</div>
</div>
</body>
</html>`)

	return sb.String()
}

func scoreCell(score float64) string {
	class := "score-high"
	if score < 50 {
		class = "score-low"
	} else if score < 75 {
		class = "score-mid"
	}
	return fmt.Sprintf(`<span class="score %s">%.1f</span>`, class, score)
}

// ---------------------------------------------------------------------------
// Chat handler
// ---------------------------------------------------------------------------

func handleChat(w http.ResponseWriter, r *http.Request) {
	evalID := chi.URLParam(r, "id")
	userID := getUserID(r)

	// Verify ownership
	var e Evaluation
	err := db.QueryRow(
		`SELECT id, user_id, title, status, requirements_text
		 FROM evaluations WHERE id = $1 AND user_id = $2`, evalID, userID,
	).Scan(&e.ID, &e.UserID, &e.Title, &e.Status, &e.RequirementsText)
	if err != nil {
		jsonError(w, "evaluation not found", http.StatusNotFound)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.Message == "" {
		jsonError(w, "message is required", http.StatusBadRequest)
		return
	}

	// Load evaluation data for context
	vendors, _ := getVendorsForEvaluation(evalID)

	// Load recommendation
	var recVendorID *string
	var reasoning string
	var confidence float64
	db.QueryRow(
		`SELECT recommended_vendor_id, reasoning, confidence_score
		 FROM recommendations WHERE evaluation_id = $1`, evalID,
	).Scan(&recVendorID, &reasoning, &confidence)

	recVendorName := ""
	if recVendorID != nil {
		for _, v := range vendors {
			if v.ID == *recVendorID {
				recVendorName = v.Name
				break
			}
		}
	}

	// Built-in smart chat: generate response based on keywords
	assistantMsg := generateChatResponse(req.Message, vendors, recVendorName, reasoning, confidence, e)

	// Store messages
	db.Exec(
		"INSERT INTO chat_messages (evaluation_id, role, content) VALUES ($1, $2, $3)",
		evalID, "user", req.Message,
	)
	db.Exec(
		"INSERT INTO chat_messages (evaluation_id, role, content) VALUES ($1, $2, $3)",
		evalID, "assistant", assistantMsg,
	)

	jsonOK(w, map[string]interface{}{
		"role":    "assistant",
		"content": assistantMsg,
	})
}

// ---------------------------------------------------------------------------
// Built-in Chat Response Generator
// ---------------------------------------------------------------------------

func generateChatResponse(message string, vendors []Vendor, recVendorName, reasoning string, confidence float64, eval Evaluation) string {
	lower := strings.ToLower(message)

	// Compare vendors
	if strings.Contains(lower, "compare") || strings.Contains(lower, "difference") || strings.Contains(lower, "versus") || strings.Contains(lower, "vs") {
		if len(vendors) < 2 {
			return "There is only one vendor in this evaluation. Upload additional vendors to enable comparison."
		}
		var sb strings.Builder
		sb.WriteString("Here's a comparison of the vendors:\n\n")
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf("**%s**\n", v.Name))
			sb.WriteString(fmt.Sprintf("- Overall Score: %.1f/100\n", v.OverallScore))
			sb.WriteString(fmt.Sprintf("- Cost: %s %.0f | Cost Score: %.1f\n", v.Currency, v.TotalCost, v.CostScore))
			sb.WriteString(fmt.Sprintf("- Timeline: %d weeks | SLA: %s uptime\n", v.TimelineWeeks, v.SLAUptime))
			sb.WriteString(fmt.Sprintf("- Risk Score: %.1f | Red Flags: %d\n\n", v.RiskScore, len(v.RedFlags)))
		}
		if recVendorName != "" {
			sb.WriteString(fmt.Sprintf("**Recommendation:** %s with %.0f%% confidence.", recVendorName, confidence))
		}
		return sb.String()
	}

	// Red flags
	if strings.Contains(lower, "red flag") || strings.Contains(lower, "risk") || strings.Contains(lower, "concern") || strings.Contains(lower, "warning") {
		var sb strings.Builder
		sb.WriteString("Here are the red flags identified across vendors:\n\n")
		totalFlags := 0
		for _, v := range vendors {
			if len(v.RedFlags) > 0 {
				sb.WriteString(fmt.Sprintf("**%s** (%d red flags):\n", v.Name, len(v.RedFlags)))
				for _, rf := range v.RedFlags {
					sb.WriteString(fmt.Sprintf("- [%s] %s: %s\n", strings.ToUpper(rf.Severity), rf.Category, rf.Description))
					totalFlags++
				}
				sb.WriteString("\n")
			}
		}
		if totalFlags == 0 {
			return "No red flags were identified in any of the vendor proposals. This is a positive sign, but always verify vendor claims through reference checks."
		}
		return sb.String()
	}

	// Cost / pricing
	if strings.Contains(lower, "cost") || strings.Contains(lower, "price") || strings.Contains(lower, "budget") || strings.Contains(lower, "cheap") || strings.Contains(lower, "expensive") {
		var sb strings.Builder
		sb.WriteString("Here's the cost breakdown:\n\n")
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf("- **%s**: %s %.0f (Cost Score: %.1f/100)\n", v.Name, v.Currency, v.TotalCost, v.CostScore))
		}
		if len(vendors) > 1 {
			cheapest := vendors[0]
			for _, v := range vendors[1:] {
				if v.TotalCost < cheapest.TotalCost && v.TotalCost > 0 {
					cheapest = v
				}
			}
			sb.WriteString(fmt.Sprintf("\n**Most cost-effective:** %s at %s %.0f", cheapest.Name, cheapest.Currency, cheapest.TotalCost))
		}
		return sb.String()
	}

	// SLA / uptime questions
	if strings.Contains(lower, "sla") || strings.Contains(lower, "uptime") || strings.Contains(lower, "response time") || strings.Contains(lower, "availability") {
		var sb strings.Builder
		sb.WriteString("Here's the SLA comparison across vendors:\n\n")
		bestSLA := ""
		bestScore := 0.0
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf("- **%s**: %s uptime, %s response time (SLA Score: %.1f/100)\n", v.Name, v.SLAUptime, v.SLAResponse, v.SLAScore))
			if v.SLAScore > bestScore {
				bestScore = v.SLAScore
				bestSLA = v.Name
			}
		}
		if bestSLA != "" {
			sb.WriteString(fmt.Sprintf("\n**Best SLA:** %s with a score of %.1f/100", bestSLA, bestScore))
		}
		return sb.String()
	}

	// Recommendation
	if strings.Contains(lower, "recommend") || strings.Contains(lower, "winner") || strings.Contains(lower, "best") || strings.Contains(lower, "which vendor") || strings.Contains(lower, "who should") {
		if recVendorName == "" {
			return "No recommendation has been generated yet. Please run the analysis first."
		}
		return fmt.Sprintf("**Recommended Vendor: %s** (Confidence: %.0f%%)\n\n%s", recVendorName, confidence, reasoning)
	}

	// Negotiation
	if strings.Contains(lower, "negotiat") || strings.Contains(lower, "deal") || strings.Contains(lower, "bargain") || strings.Contains(lower, "discount") {
		var sb strings.Builder
		sb.WriteString("Here are negotiation tips for this evaluation:\n\n")
		sb.WriteString("1. **Leverage competition** — Let vendors know you are evaluating multiple proposals\n")
		sb.WriteString("2. **Request volume discounts** — Negotiate better rates for longer commitments\n")
		sb.WriteString("3. **Demand SLA penalties** — Ensure financial penalties for SLA breaches\n")
		sb.WriteString("4. **Remove auto-renewal** — Insist on manual renewal with advance notice\n")
		sb.WriteString("5. **Cap price escalation** — Negotiate a maximum annual increase (e.g., CPI-linked)\n")
		if len(vendors) > 1 {
			sb.WriteString(fmt.Sprintf("6. **Use competing bids** — Reference other vendors' pricing to negotiate better terms\n"))
		}
		return sb.String()
	}

	// Score explanation
	if strings.Contains(lower, "score") || strings.Contains(lower, "rating") || strings.Contains(lower, "how did") {
		var sb strings.Builder
		sb.WriteString("Scoring methodology (each 0-100):\n\n")
		sb.WriteString("- **Cost Score** (25%): Based on how competitive the pricing is vs budget\n")
		sb.WriteString("- **Quality Score** (30%): Based on proposal strengths, support type, and completeness\n")
		sb.WriteString("- **Timeline Score** (15%): Based on delivery timeline reasonableness\n")
		sb.WriteString("- **Risk Score** (15%): Based on red flags, hidden costs, and contract terms\n")
		sb.WriteString("- **SLA Score** (15%): Based on uptime commitment and response times\n\n")
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf("**%s**: Overall %.1f (Cost: %.1f, Quality: %.1f, Timeline: %.1f, Risk: %.1f, SLA: %.1f)\n",
				v.Name, v.OverallScore, v.CostScore, v.QualityScore, v.TimelineScore, v.RiskScore, v.SLAScore))
		}
		return sb.String()
	}

	// Strengths
	if strings.Contains(lower, "strength") || strings.Contains(lower, "advantage") || strings.Contains(lower, "pro") {
		var sb strings.Builder
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf("**%s — Strengths:**\n", v.Name))
			for _, s := range v.Strengths {
				sb.WriteString(fmt.Sprintf("- %s\n", s))
			}
			sb.WriteString("\n")
		}
		return sb.String()
	}

	// Weaknesses
	if strings.Contains(lower, "weakness") || strings.Contains(lower, "disadvantage") || strings.Contains(lower, "con") {
		var sb strings.Builder
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf("**%s — Weaknesses:**\n", v.Name))
			for _, w := range v.Weaknesses {
				sb.WriteString(fmt.Sprintf("- %s\n", w))
			}
			sb.WriteString("\n")
		}
		return sb.String()
	}

	// Summary / overview
	if strings.Contains(lower, "summary") || strings.Contains(lower, "overview") || strings.Contains(lower, "tell me about") {
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("**Evaluation: %s**\n", eval.Title))
		sb.WriteString(fmt.Sprintf("Status: %s | Vendors: %d\n\n", eval.Status, len(vendors)))
		for _, v := range vendors {
			sb.WriteString(fmt.Sprintf("**%s** — Score: %.1f/100, Cost: %s %.0f, Timeline: %d weeks\n", v.Name, v.OverallScore, v.Currency, v.TotalCost, v.TimelineWeeks))
			sb.WriteString(fmt.Sprintf("  %s\n\n", v.Summary))
		}
		if recVendorName != "" {
			sb.WriteString(fmt.Sprintf("**Winner: %s** (%.0f%% confidence)", recVendorName, confidence))
		}
		return sb.String()
	}

	// Default helpful response
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("I have data on %d vendor(s) for the evaluation \"%s\". Here's what I can help with:\n\n", len(vendors), eval.Title))
	sb.WriteString("- **\"Compare vendors\"** — Side-by-side comparison\n")
	sb.WriteString("- **\"What are the red flags?\"** — Risk analysis\n")
	sb.WriteString("- **\"Cost breakdown\"** — Pricing comparison\n")
	sb.WriteString("- **\"Who do you recommend?\"** — Recommendation details\n")
	sb.WriteString("- **\"Explain the scores\"** — Scoring methodology\n")
	sb.WriteString("- **\"Negotiation tips\"** — How to negotiate better terms\n")
	sb.WriteString("- **\"Strengths\"** or **\"Weaknesses\"** — Vendor pros/cons\n")
	sb.WriteString("- **\"Summary\"** — Full evaluation overview\n")
	return sb.String()
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

func handleHealth(w http.ResponseWriter, r *http.Request) {
	status := "ok"
	if err := db.Ping(); err != nil {
		status = "database_error"
	}
	jsonOK(w, map[string]string{
		"status":  status,
		"service": "vendoreval-backend",
	})
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

func main() {
	// JWT secret
	jwtSecret = []byte(envOrDefault("JWT_SECRET", "vendoreval-dev-secret-change-in-prod"))

	log.Println("Using built-in analysis engine (no external API required)")

	// Database
	initDB()
	defer db.Close()

	// Router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RealIP)
	r.Use(chimw.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes
	r.Post("/api/auth/register", handleRegister)
	r.Post("/api/auth/login", handleLogin)
	r.Post("/api/auth/demo", handleDemoLogin)
	r.Get("/health", handleHealth)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(jwtMiddleware)

		r.Post("/api/evaluations", handleCreateEvaluation)
		r.Get("/api/evaluations", handleListEvaluations)
		r.Get("/api/evaluations/{id}", handleGetEvaluation)
		r.Post("/api/evaluations/{id}/upload-vendor", handleUploadVendor)
		r.Post("/api/evaluations/{id}/analyze", handleAnalyze)
		r.Get("/api/evaluations/{id}/comparison", handleComparison)
		r.Get("/api/evaluations/{id}/recommendation", handleRecommendation)
		r.Get("/api/evaluations/{id}/report", handleReport)
		r.Post("/api/evaluations/{id}/chat", handleChat)
		r.Get("/api/evaluations/{id}/vendors", handleListVendors)
	})

	port := envOrDefault("PORT", "8080")
	portInt, _ := strconv.Atoi(port)
	addr := fmt.Sprintf(":%d", portInt)

	log.Printf("VendorEval backend starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
