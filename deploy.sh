#!/usr/bin/env bash
set -e

# Ensure correct PHP version (8.2+) is picked up on shared hosting (StackCP / cPanel)
export PATH="$HOME/.bin:$PATH"
if ! php -v 2>&1 | grep -q "PHP 8.[2345]"; then
    if command -v php83 >/dev/null 2>&1; then
        shopt -s expand_aliases
        alias php='/usr/bin/php83'
    elif command -v php82 >/dev/null 2>&1; then
        shopt -s expand_aliases
        alias php='/usr/bin/php82'
    fi
fi

echo "🚀 Deploying G.K. WhizWheel on Serverbyt / cPanel..."

# 1. Fetch latest release
git pull origin main

# 2. Production composer dependencies
composer install --no-dev --optimize-autoloader --no-interaction

# 3. Database migrations (force in production)
php artisan migrate --force

# 4. Storage symlink
php artisan storage:link || true

# 5. Flush and warm optimized application caches
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 6. Restart queue workers (if supervisor/daemon is running)
php artisan queue:restart || true

echo "✅ G.K. WhizWheel Deployment Complete!"

