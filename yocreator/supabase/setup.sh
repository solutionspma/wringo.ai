#!/bin/bash
# YOcreator Supabase Setup Script

echo "🔧 YOcreator Supabase Setup"
echo "============================"
echo ""

SUPABASE_URL="https://uksjnwnvarhldlxyymef.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZ3pzanFta3ZobXNoY3ZueXlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQ5NDU1MiwiZXhwIjoyMDc5MDcwNTUyfQ.eMgVW2hoNLA1l4rjQEbEFa2aXIG-Ih6eLguAUIWyirw"

echo "📊 Setting up database schema..."
echo ""
echo "Please manually run the SQL in supabase/setup.sql in your Supabase SQL Editor:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/uksjnwnvarhldlxyymef/sql"
echo "2. Copy contents of supabase/setup.sql"
echo "3. Paste and run in SQL Editor"
echo ""
echo "Or copy the file path:"
echo "$(pwd)/supabase/setup.sql"
echo ""

read -p "Press Enter after you've run the SQL setup..."

echo ""
echo "✅ Testing connection..."

# Test API connection
response=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/render_jobs?select=count" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if [ "$response" = "200" ]; then
  echo "✅ Supabase connection successful!"
  echo ""
  echo "🎉 Setup complete! Your YOcreator database is ready."
  echo ""
  echo "Next steps:"
  echo "  1. Start backend: cd server/node && pnpm install && node src/index.js"
  echo "  2. Start web app: cd apps/web && pnpm install && pnpm dev"
else
  echo "❌ Connection failed (HTTP $response)"
  echo "Please verify your Supabase credentials and try again."
  exit 1
fi
