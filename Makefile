.PHONY: help start stop deploy deploy-one test test-canister frontend status upgrade clean check-motoko dev logs

NETWORK ?= local

help:
	@echo "BidtoList — Available commands:"
	@echo "  make start                       Start local ICP network"
	@echo "  make stop                        Stop local ICP network"
	@echo "  make deploy                      Deploy all canisters (local)"
	@echo "  make deploy-one CANISTER=<name>  Deploy a single canister"
	@echo "  make test                        Run frontend unit tests"
	@echo "  make test-canister               Run backend smoke tests (requires running replica)"
	@echo "  make frontend                    Start frontend dev server"
	@echo "  make status                      Show canister status"
	@echo "  make upgrade                     Upgrade all canisters (preserves state)"
	@echo "  make clean                       Clean local ICP state"
	@echo "  make check-motoko                Compile-check all Motoko canisters (no network needed)"
	@echo "  make dev                         Start network, deploy canisters, and run frontend"
	@echo "  make logs                        Tail recent logs for all canisters"

dev:
	icp network start -d && bash scripts/deploy.sh && cd frontend && npm run dev

start:
	icp network start -d

stop:
	icp network stop

deploy:
	bash scripts/deploy.sh $(NETWORK)

deploy-one:
	@test -n "$(CANISTER)" || (echo "Usage: make deploy-one CANISTER=<name>  e.g. make deploy-one CANISTER=listing" && exit 1)
	icp deploy $(CANISTER) -e $(NETWORK)

test:
	cd frontend && npm run test:unit

test-canister:
	bash scripts/test-backend.sh

frontend:
	cd frontend && npm run dev

status:
	bash scripts/status.sh

upgrade:
	@for c in listing agent fee; do \
	  echo "=== upgrading $$c ==="; icp deploy "$$c" -e $(NETWORK) || true; \
	done

clean:
	icp network stop 2>/dev/null || true
	rm -rf .dfx .icp

check-motoko:
	@awk '/^canisters:/{p=1;next} /^[a-z]/{p=0} p && /^  - name:/{print $$3}' icp.yaml \
	  | grep -v "^frontend$$" | grep -v "^internet_identity$$" \
	  | while read -r c; do echo "=== $$c ==="; icp build "$$c" || exit 1; done

logs:
	@for c in listing agent fee; do \
	  echo "=== $$c ==="; icp canister logs $$c -e $(NETWORK) 2>&1 | tail -30; \
	done
