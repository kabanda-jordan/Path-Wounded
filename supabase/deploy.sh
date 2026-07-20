#!/bin/bash
# ============================================================
# Path Wounded — Supabase Edge Functions Deployment Script
# ============================================================
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Path Wounded — Supabase Deployment ===${NC}"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null && ! npx supabase --version &> /dev/null; then
  echo -e "${RED}Error: Supabase CLI not found. Install it with: npm i -g supabase${NC}"
  exit 1
fi

SUPABASE_CMD="npx supabase"

# Check if linked
echo -e "${YELLOW}Step 1: Linking to Supabase project...${NC}"
$SUPABASE_CMD link --project-ref path-wounded 2>/dev/null || echo "(already linked)"

# Set secrets
echo ""
echo -e "${YELLOW}Step 2: Setting environment secrets...${NC}"

# Generate secrets if not provided
if [ -z "$JWT_ACCESS_SECRET" ]; then
  JWT_ACCESS_SECRET=$(openssl rand -hex 32)
  echo "  Generated JWT_ACCESS_SECRET"
fi
if [ -z "$JWT_REFRESH_SECRET" ]; then
  JWT_REFRESH_SECRET=$(openssl rand -hex 32)
  echo "  Generated JWT_REFRESH_SECRET"
fi

# You MUST set CORS_ORIGIN to your Vercel URL
CORS_ORIGIN="${CORS_ORIGIN:-https://path-wounded.vercel.app}"

$SUPABASE_CMD secrets set \
  JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
  JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  CORS_ORIGIN="$CORS_ORIGIN"

echo -e "${GREEN}  Secrets set successfully!${NC}"
echo ""
echo -e "${YELLOW}  IMPORTANT: Save these secrets for your records:${NC}"
echo "  JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET"
echo "  JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "  CORS_ORIGIN=$CORS_ORIGIN"

# Deploy each function
echo ""
echo -e "${YELLOW}Step 3: Deploying Edge Functions...${NC}"

FUNCTIONS=(
  "auth"
  "orders"
  "carriers"
  "vehicles"
  "invoices"
  "partners"
  "messages"
  "automations"
  "notifications"
  "analytics"
  "reporting"
  "users"
)

for func in "${FUNCTIONS[@]}"; do
  echo "  Deploying $func..."
  $SUPABASE_CMD functions deploy "$func" --no-verify-jwt
done

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo -e "${GREEN}Your Edge Functions are live at:${NC}"
echo "  https://path-wounded.supabase.co/functions/v1/auth"
echo "  https://path-wounded.supabase.co/functions/v1/orders"
echo "  etc."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run the SQL files in Supabase SQL Editor (if not done yet)"
echo "2. Set VITE_API_BASE_URL in Vercel to:"
echo "   https://path-wounded.supabase.co/functions/v1"
echo "3. Redeploy the frontend on Vercel"
