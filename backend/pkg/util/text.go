package util

import "github.com/jackc/pgx/v5/pgtype"

func ToString(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String
}

func ToInterface(t pgtype.Text) interface{} {
	if !t.Valid || t.String == "" {
		return nil
	}
	return t.String
}
