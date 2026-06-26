docker-build:
	docker compose build

docker-up:
	docker compose up

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-migrate:
	docker compose exec backend python manage.py migrate

docker-superuser:
	docker compose exec backend python manage.py createsuperuser

docker-shell:
	docker compose exec backend python manage.py shell

ngrok:
	ngrok http 80
