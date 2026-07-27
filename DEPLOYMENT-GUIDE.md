# Path Wounded — Deployment Guide

## Project Details
- **GitHub:** https://github.com/kabanda-jordan/Path-Wounded
- **Frontend (Vercel):** https://path-wounded.vercel.app
- **Backend (Supabase Edge Functions):** https://gdwftwidhvtlowwqzlxf.supabase.co/functions/v1
- **Supabase Dashboard:** https://supabase.com/dashboard/project/gdwftwidhvtlowwqzlxf
- **Supabase Org:** Arcade (NOT kabanda-jordan's Org)
- **Supabase Project Ref:** `gdwftwidhvtlowwqzlxf`
- **Supabase Project Name:** path-wounded

## Test Credentials
- **Admin:** admin@pathwounded.com / Admin@123
- **Broker:** sarah@freightco.com / Admin@123
- **Broker:** mike@shipfast.com / Admin@123
- **Dispatcher:** lisa@dispatch.io / Admin@123
- **Viewer:** viewer@pathwounded.com / Admin@123

## Environment Variables

### Vercel (Frontend)
- `VITE_API_BASE_URL` = `https://gdwftwidhvtlowwqzlxf.supabase.co/functions/v1`

### Supabase Edge Functions (Secrets)
Set via CLI: `supabase secrets set KEY=VALUE`
- `JWT_ACCESS_SECRET` = (generated random hex)
- `JWT_REFRESH_SECRET` = (generated random hex)
- `CORS_ORIGIN` = `https://path-wounded.vercel.app`
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = `kabandajordan784@gmail.com`
- `SMTP_PASS` = (Gmail app password)
- `EMAIL_FROM` = `kabandajordan784@gmail.com`

## What Was Deployed

### 12 Edge Functions
All deployed with `--no-verify-jwt` (auth handled manually):
1. auth
2. orders
3. carriers
4. vehicles
5. invoices
6. partners
7. messages
8. automations
9. notifications
10. analytics
11. reporting
12. users

### Database (SQL applied via Supabase SQL Editor or CLI)
1. `supabase/schema.sql` — 13 tables, 10 enums, indexes, triggers
2. `supabase/verify_password.sql` — bcrypt password verification (fixed version below)
3. `supabase/seed.sql` — test data (5 users, 10 carriers, 24 vehicles, 50 orders, etc.)
4. `supabase/migrations/20250101000000_add_otp_codes.sql` — OTP table for 2FA

## Two-Factor Authentication (2FA)

### How It Works
1. User enters email + password on login page
2. Backend validates credentials
3. Backend generates 8-digit OTP code and sends it via Gmail SMTP
4. Frontend shows OTP input screen (8 individual digit inputs)
5. User enters the 8-digit code (auto-submits when complete)
6. Backend validates OTP (5 minute expiry, max 5 attempts)
7. On success, user receives access token and is logged in

### Flow Details
- **OTP Length:** 8 digits
- **OTP Expiry:** 5 minutes
- **Max Attempts:** 5 (then must request new code)
- **Resend:** Available after 60 second cooldown
- **Email:** Sent via Gmail SMTP (kabandajordan784@gmail.com)
- **Scope:** All users (admin, broker, carrier, dispatcher, viewer)

### New Endpoints
- `POST /auth/login` — Now returns `{ pendingToken, requiresOtp: true }` instead of access token
- `POST /auth/verify-otp` — Accepts `{ pendingToken, code }`, returns access token
- `POST /auth/resend-otp` — Accepts `{ pendingToken }`, sends new OTP

### Database: otp_codes Table
```sql
CREATE TABLE otp_codes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  purpose    TEXT DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  verified   BOOLEAN DEFAULT false,
  attempts   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Issues We Fixed

### 1. Wrong Supabase Project
The CLI was linked to the wrong paused project in `kabanda-jordan's Org`. Fixed by linking to the correct project ref `gdwftwidhvtlowwqzlxf` in the `Arcade` org.
```
supabase link --project-ref gdwftwidhvtlowwqzlxf
```

### 2. verify_password Function Not Found
Supabase stores pgcrypto in the `extensions` schema, not `public`. The function needs:
```sql
DROP FUNCTION IF EXISTS verify_password(text,text);
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN extensions.crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = extensions, public;
```

### 3. Password Hash Had Angle Brackets
When updating password hashes via SQL, the `<` and `>` brackets were accidentally included, making the hash invalid. Fix:
```sql
UPDATE users SET password_hash = '$2a$12$jEy7x9/ggGAF9qNoP3FyJuuvsvysIIckTIcXfayjMz3LjFtKlvFXK';
```

### 4. JWT Signing Crashed (importKeySync)
`crypto.subtle.importKeySync` doesn't work in Supabase Edge Runtime. Fixed by making `signAccessToken`, `signRefreshToken`, and `createJwt` async using `await crypto.subtle.importKey()` and `await crypto.subtle.sign()`.

### 5. Cookie SameSite for Cross-Domain
Backend cookies must use `SameSite=None; Secure` for cross-domain auth (Vercel -> Supabase).

## How to Redeploy

### Redeploy Edge Functions
```bash
cd /home/kabanda/Documents/Fintech
supabase link --project-ref gdwftwidhvtlowwqzlxf

# Deploy all functions
for func in auth orders carriers vehicles invoices partners messages automations notifications analytics reporting users; do
  supabase functions deploy $func --no-verify-jwt
done
```

### Redeploy Frontend
```bash
cd /home/kabanda/Documents/Fintech
vercel --prod
```

### Set/Update Secrets
```bash
supabase secrets set JWT_ACCESS_SECRET=$(openssl rand -hex 32) JWT_REFRESH_SECRET=$(openssl rand -hex 32) CORS_ORIGIN="https://path-wounded.vercel.app" SMTP_HOST="smtp.gmail.com" SMTP_PORT="587" SMTP_USER="kabandajordan784@gmail.com" SMTP_PASS="your-app-password" EMAIL_FROM="kabandajordan784@gmail.com"
```

### Apply Database Migrations
```bash
supabase db query --linked --file supabase/migrations/20250101000000_add_otp_codes.sql --yes
```

## Architecture
- **Frontend:** React + Vite on Vercel
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Database:** Supabase-hosted PostgreSQL
- **Auth:** Custom JWT tokens with 2FA (not Supabase Auth)
  - Access tokens: 15 min expiry, signed with JWT_ACCESS_SECRET
  - Refresh tokens: 30 days, stored as SHA-256 hashes in refresh_tokens table, sent via httpOnly cookies
  - 2FA: 8-digit OTP codes sent via Gmail SMTP, 5 min expiry, max 5 attempts
  - New signups use PBKDF2-SHA256 hashes
  - Legacy seed data uses bcrypt ($2a$) verified via pgcrypto extension
- **Email:** Gmail SMTP (kabandajordan784@gmail.com) via raw TCP/TLS sockets in Deno
- **CORS:** Configured for https://path-wounded.vercel.app
