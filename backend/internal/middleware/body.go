package middleware

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const DefaultMaxBodySize int64 = 4096

func ReadJSONBody(w http.ResponseWriter, r *http.Request, dst interface{}, maxBytes int64) error {
	return readJSONBody(w, r, dst, maxBytes, false)
}

func ReadJSONBodyAllowEmpty(w http.ResponseWriter, r *http.Request, dst interface{}, maxBytes int64) error {
	return readJSONBody(w, r, dst, maxBytes, true)
}

func readJSONBody(w http.ResponseWriter, r *http.Request, dst interface{}, maxBytes int64, allowEmpty bool) error {
	_ = w // signature keeps ResponseWriter for future use; actual reading does not write through it
	if dst == nil {
		return fmt.Errorf("destination is nil")
	}
	if maxBytes <= 0 {
		maxBytes = DefaultMaxBodySize
	}
	// Use LimitReader instead of MaxBytesReader with a nil writer to avoid panic when limit is exceeded.
	// Callers can check for *http.MaxBytesError to write their own JSON error response.
	body, err := io.ReadAll(io.LimitReader(r.Body, maxBytes+1))
	if err != nil {
		return err
	}
	if int64(len(body)) > maxBytes {
		return &http.MaxBytesError{Limit: maxBytes}
	}
	if len(body) == 0 && allowEmpty {
		return nil
	}
	return json.Unmarshal(body, dst)
}
