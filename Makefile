.PHONY: build dev migrate-up migrate-down sqlc-generate check-sqlc-sync lint lint-go lint-frontend lint-worker test clean

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
	go test ./backend/... -count=1 -timeout 120s

lint: lint-go
	@if [ -f frontend/miniapp/package.json ] && command -v npm >/dev/null 2>&1; then $(MAKE) lint-frontend; fi
	@if [ -f api-worker/package.json ] && command -v npm >/dev/null 2>&1; then $(MAKE) lint-worker; fi

# lint-go 使用一次性全新缓存目录：golangci-lint 默认缓存对已删除 worktree 的旧结果会产生误报。
lint-go:
	@LINT_CACHE_DIR=$$(mktemp -d); trap 'rm -rf "$$LINT_CACHE_DIR"' EXIT; \
	GOLANGCI_LINT_CACHE="$$LINT_CACHE_DIR" golangci-lint run ./backend/... || (echo "提示：安装 golangci-lint: https://golangci-lint.run/usage/install/" && exit 1)

lint-frontend:
	@cd frontend/miniapp && npm run lint

lint-worker:
	@cd api-worker && npm run typecheck
	@cd mcp-worker && npm run typecheck

audit-patterns:
	@bash scripts/audit-patterns.sh

clean:
	rm -rf bin/
