.PHONY: up down build logs health demo test clean

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

health:
	curl -s http://localhost:8080/health

demo:
	@echo "Starting demo login..."
	@curl -s -X POST http://localhost:8080/api/auth/demo | python3 -c "import sys,json; print('Token:', json.load(sys.stdin)['token'])"

test:
	@echo "Running validation checks..."
	@curl -s http://localhost:8080/health
	@echo ""
	@TOKEN=$$(curl -s -X POST http://localhost:8080/api/auth/demo | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"); \
	echo "Token: $$TOKEN"; \
	EVAL=$$(curl -s -X POST http://localhost:8080/api/evaluations \
		-H "Authorization: Bearer $$TOKEN" \
		-H "Content-Type: application/json" \
		-d '{"title":"Test Eval","requirements_text":"Need 99.9% uptime, 24x7 support, under 20L"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])"); \
	echo "Evaluation: $$EVAL"; \
	curl -s -X POST http://localhost:8080/api/evaluations/$$EVAL/upload-vendor \
		-H "Authorization: Bearer $$TOKEN" \
		-H "Content-Type: application/json" \
		-d '{"vendor_name":"CloudForce","content":"Uptime 99.9%, Cost 18L, 24x7 support included"}'; \
	echo ""

clean:
	docker compose down -v
	rm -rf submission/
