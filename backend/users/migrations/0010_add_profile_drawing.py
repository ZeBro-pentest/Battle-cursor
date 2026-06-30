from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0009_remove_cursor_image_orig"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="profile_drawing",
            field=models.URLField(blank=True, null=True),
        ),
    ]
