package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestWorkerAuthNoSecret(t *testing.T) {
	r := chi.NewRouter()
	r.Use(WorkerAuth(""))
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 when secret not configured, got %d", rec.Code)
	}
}

func TestWorkerAuthMissingSecret(t *testing.T) {
	r := chi.NewRouter()
	r.Use(WorkerAuth("correct-secret"))
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("X-Forwarded-Host", "api.pathmemos.com")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 when secret missing, got %d", rec.Code)
	}
}

func TestWorkerAuthWrongSecret(t *testing.T) {
	r := chi.NewRouter()
	r.Use(WorkerAuth("correct-secret"))
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("X-Forwarded-Host", "api.pathmemos.com")
	req.Header.Set("X-Worker-Secret", "wrong-secret")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 when secret wrong, got %d", rec.Code)
	}
}

func TestWorkerAuthCorrectSecret(t *testing.T) {
	r := chi.NewRouter()
	r.Use(WorkerAuth("correct-secret"))
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("X-Forwarded-Host", "api.pathmemos.com")
	req.Header.Set("X-Worker-Secret", "correct-secret")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 when secret correct, got %d", rec.Code)
	}
}

func TestWorkerAuthDirectAccessAllowed(t *testing.T) {
	r := chi.NewRouter()
	r.Use(WorkerAuth("correct-secret"))
	r.Get("/diary/info", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/diary/info", nil)
	// 直接访问源站不带 X-Forwarded-Host，应放行
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for direct source access, got %d", rec.Code)
	}
}

func TestWorkerAuthSkipPrefixes(t *testing.T) {
	r := chi.NewRouter()
	r.Use(WorkerAuth("correct-secret", "/wx/callback", "/api/prod/payment/virtualPayNotify"))
	r.Get("/wx/callback", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	r.Get("/api/prod/payment/virtualPayNotify", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	r.Get("/diary/info", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	cases := []struct {
		path       string
		viaWorker  bool
		setSecret  bool
		wantStatus int
	}{
		{"/wx/callback", false, false, http.StatusOK},
		{"/api/prod/payment/virtualPayNotify", false, false, http.StatusOK},
		// skip 前缀即使经 Worker 转发也应跳过 WorkerAuth
		{"/wx/callback", true, false, http.StatusOK},
		{"/api/prod/payment/virtualPayNotify", true, false, http.StatusOK},
		{"/diary/info", true, false, http.StatusForbidden},
		{"/diary/info", true, true, http.StatusOK},
	}

	for _, tc := range cases {
		req := httptest.NewRequest(http.MethodGet, tc.path, nil)
		if tc.viaWorker {
			req.Header.Set("X-Forwarded-Host", "api.pathmemos.com")
		}
		if tc.setSecret {
			req.Header.Set("X-Worker-Secret", "correct-secret")
		}
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)

		if rec.Code != tc.wantStatus {
			t.Fatalf("%s: expected %d, got %d", tc.path, tc.wantStatus, rec.Code)
		}
	}
}
