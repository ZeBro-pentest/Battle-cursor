from celery import shared_task


@shared_task
def flush_expired_tokens():
    from django.core.management import call_command

    call_command("flushexpiredtokens")
