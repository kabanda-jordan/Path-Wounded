-- ============================================================
-- Path Wounded — Full Database Schema for Supabase
-- Generated from Prisma schema.prisma
-- ============================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'broker', 'carrier', 'dispatcher', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('truck', 'cargo_van', 'trailer', 'cargo_plane', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('unpaid', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE carrier_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE partner_type AS ENUM ('supplier', 'distributor', 'warehouse', 'customs', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trigger_type AS ENUM ('order_delivered', 'order_created', 'order_cancelled', 'invoice_overdue', 'payment_received');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE action_type AS ENUM ('send_email', 'send_notification', 'create_invoice', 'update_status', 'send_message');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  company_name  TEXT,
  role          user_role NOT NULL DEFAULT 'broker',
  avatar_url    TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  status        user_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

CREATE TABLE IF NOT EXISTS carriers (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT NOT NULL,
  logo_url      TEXT,
  location      TEXT,
  rating        DOUBLE PRECISION NOT NULL DEFAULT 0,
  vehicle_count INTEGER NOT NULL DEFAULT 0,
  partner_count INTEGER NOT NULL DEFAULT 0,
  status        carrier_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carriers_status ON carriers(status);
CREATE INDEX IF NOT EXISTS idx_carriers_rating ON carriers(rating DESC);

CREATE TABLE IF NOT EXISTS vehicles (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  carrier_id TEXT NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  type       vehicle_type NOT NULL,
  identifier TEXT NOT NULL,
  status     vehicle_status NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_vehicles_carrier_id ON vehicles(carrier_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_number        TEXT UNIQUE NOT NULL,
  broker_id           TEXT NOT NULL REFERENCES users(id),
  carrier_id          TEXT REFERENCES carriers(id),
  status              order_status NOT NULL DEFAULT 'pending',
  origin_address      TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  amount_paid         NUMERIC(12,2) NOT NULL DEFAULT 0,
  hours_on_road       DOUBLE PRECISION,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_broker_id ON orders(broker_id);
CREATE INDEX IF NOT EXISTS idx_orders_carrier_id ON orders(carrier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS partners (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  carrier_id TEXT NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       partner_type NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partners_carrier_id ON partners(carrier_id);

CREATE TABLE IF NOT EXISTS invoices (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id   TEXT NOT NULL REFERENCES orders(id),
  carrier_id TEXT NOT NULL REFERENCES carriers(id),
  amount     NUMERIC(12,2) NOT NULL,
  status     invoice_status NOT NULL DEFAULT 'unpaid',
  due_date   TIMESTAMPTZ NOT NULL,
  paid_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_carrier_id ON invoices(carrier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  carrier_id TEXT NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES users(id),
  order_id   TEXT,
  rating     INTEGER NOT NULL,
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(author_id, carrier_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_carrier_id ON reviews(carrier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id);

CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id    TEXT NOT NULL REFERENCES users(id),
  recipient_id TEXT NOT NULL REFERENCES users(id),
  thread_id    TEXT NOT NULL,
  body         TEXT NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE TABLE IF NOT EXISTS automations (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  trigger_type  trigger_type NOT NULL,
  action_type   action_type NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  payload    JSONB NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read_at ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  metadata   JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER carriers_updated_at
  BEFORE UPDATE ON carriers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER automations_updated_at
  BEFORE UPDATE ON automations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
