build:
	cd ../frontend && npm run build && cd ../backend && python manage.py collectstatic --noinput

run:
	DJANGO_SETTINGS_MODULE=config.settings daphne -p 8000 config.asgi:application

migrate:
	python manage.py makemigrations && python manage.py migrate

shell:
	python manage.py shell

celery:
	celery -A config worker -l info

celery-beat:
	celery -A config beat -l info

flower:
	celery -A config flower

superuser:
	python manage.py createsuperuser

flush-tokens:
	python manage.py flushexpiredtokens

ngrok:
	ngrok http 8000

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
