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
