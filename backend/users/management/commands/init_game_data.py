import json
import os

import cloudinary.uploader
from django.conf import settings
from django.core.management.base import BaseCommand
from users.models import Canvas, Cursor


class Command(BaseCommand):
    help = "Инициализирует игровые данные: загружает картинки в Cloudinary и создает объекты в БД"

    def handle(self, *args, **options):
        base_path = os.path.join(settings.BASE_DIR, "assets", "images")
        metadata_path = os.path.join(base_path, "metadata.json")

        if not os.path.exists(metadata_path):
            self.stdout.write(self.style.ERROR(f"Файл метаданных не найден: {metadata_path}"))
            return

        with open(metadata_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Обработка курсоров
        for item in data.get("cursors", []):
            img_path = os.path.join(base_path, "cursors", item["image"])
            if os.path.exists(img_path):
                self.stdout.write(f"Загрузка курсора: {item['name']}...")
                # Загружаем в Cloudinary
                upload_result = cloudinary.uploader.upload(
                    img_path,
                    folder="cursors",
                    public_id=os.path.splitext(item["image"])[0]
                )
                # Создаем или обновляем в БД
                cursor, created = Cursor.objects.update_or_create(
                    name=item["name"],
                    defaults={
                        "image": upload_result["public_id"],
                        "price": item["price"],
                        "rarity": item["rarity"],
                        "debuffs": item.get("debuffs", [])
                    }
                )
                status = "Создан" if created else "Обновлен"
                self.stdout.write(self.style.SUCCESS(f"Курсор '{item['name']}' {status}"))
            else:
                self.stdout.write(self.style.WARNING(f"Файл не найден: {img_path}"))

        # Обработка холстов
        for item in data.get("canvases", []):
            img_path = os.path.join(base_path, "canvas", item["image"])
            if os.path.exists(img_path):
                self.stdout.write(f"Загрузка холста: {item['name']}...")
                upload_result = cloudinary.uploader.upload(
                    img_path,
                    folder="canvases",
                    public_id=os.path.splitext(item["image"])[0]
                )
                canvas, created = Canvas.objects.update_or_create(
                    name=item["name"],
                    defaults={
                        "image": upload_result["public_id"],
                        "price": item["price"],
                        "rarity": item["rarity"],
                        "protections": item.get("protections", [])
                    }
                )
                status = "Создан" if created else "Обновлен"
                self.stdout.write(self.style.SUCCESS(f"Холст '{item['name']}' {status}"))
            else:
                self.stdout.write(self.style.WARNING(f"Файл не найден: {img_path}"))
