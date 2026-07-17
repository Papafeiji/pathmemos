.PHONY: build dev migrate-up migrate-down sqlc-generate check-sqlc-sync lint lint-go lint-frontend test clean

build-linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/pathmemos ./backend/cmd/server

build-local:
	go build -o bin/pathmemos ./backend/cmd/server

build: build-linux

dev:
	go run ./backend/cmd/server

MIGRATE_VERSION := v4.17.0

migrate-up:
	go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@$(MIGRATE_VERSION) -path ./backend/migrations -database "$(DATABASE_URL)" up

migrate-down:
	go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@$(MIGRATE_VERSION) -path ./backend/migrations -database "$(DATABASE_URL)" down 1

sqlc-generate:
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1 generate

check-sqlc-sync:
	@python3 scripts/check_sqlc_sync.py

test:
	@echo "==> Go 单元测试..."
	go test ./backend/internal/... -count=1 -timeout 30s

lint: lint-go
	@if [ -f frontend/miniapp/package.json ] && command -v npm >/dev/null 2>&1; then $(MAKE) lint-frontend; fi

lint-go:
	@golangci-lint run ./backend/... || (echo "提示：安装 golangci-lint: https://golangci-lint.run/usage/install/" && exit 1)

lint-frontend:
	@cd frontend/miniapp && npm run lint

audit-patterns:
	@bash scripts/audit-patterns.sh

clean:
	rm -rf bin/
