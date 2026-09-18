#!/bin/sh
set -e

composer install --no-interaction --prefer-dist --no-progress

php artisan migrate --force --no-interaction

exec php artisan serve --host=0.0.0.0 --port=8000
