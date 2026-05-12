.PHONY: help start stop deploy test frontend status clean check-motoko dev

NETWORK ?= local

help:
	@echo "BidtoList — Available commands:"
	@echo "  make start               Start local ICP network"
	@echo "  make stop                Stop local ICP network"
	@echo "  make deploy              Deploy all canisters (local)"
	@echo "  make test                Run frontend unit tests"
	@echo "  make frontend            Start frontend dev server"
	@echo "  make status              Show canister status"
	@echo "  make clean               Clean local ICP state"
	@echo "  make check-motoko        Compile-check all Motoko canisters (no network needed)"
	@echo "  make dev                 Start network, deploy canisters, and run frontend"

dev:
	icp network start -d && bash scripts/deploy.sh && cd frontend && npm run dev

start:
	icp network start -d

stop:
	icp network stop

deploy:
	bash scripts/deploy.sh $(NETWORK)

test:
	cd frontend && npm run test:unit

frontend:
	cd frontend && npm run dev

status:
	@for c in listing agent fee; do \
	  echo "=== $$c ==="; icp canister status $$c -e $(NETWORK) 2>&1 | head -5; \
	done

clean:
	icp network stop 2>/dev/null || true
	rm -rf .dfx .icp

check-motoko:
	@grep "^  - name:" icp.yaml | awk '{print $$3}' | grep -v "^frontend$$" | \
	  while read -r c; do echo "=== $$c ==="; icp build "$$c" || exit 1; done
