-- ============================================================
-- Path Wounded — Seed Data for Supabase
-- Default password for all users: Admin@123
-- ============================================================

-- USERS (5)
INSERT INTO users (id, email, password_hash, full_name, company_name, role, email_verified)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@pathwounded.com', '$2b$12$h5w4apZJchiz1auSYK.H0ezUPCeSCzF10sToHo5/4KBjW/hQKLI9i', 'James Admin', 'Path Wounded Inc.', 'admin', true),
  ('a0000000-0000-0000-0000-000000000002', 'sarah@freightco.com', '$2b$12$h5w4apZJchiz1auSYK.H0ezUPCeSCzF10sToHo5/4KBjW/hQKLI9i', 'Sarah Mitchell', 'FreightCo Logistics', 'broker', true),
  ('a0000000-0000-0000-0000-000000000003', 'mike@shipfast.com', '$2b$12$h5w4apZJchiz1auSYK.H0ezUPCeSCzF10sToHo5/4KBjW/hQKLI9i', 'Mike Chen', 'ShipFast Express', 'broker', true),
  ('a0000000-0000-0000-0000-000000000004', 'lisa@dispatch.io', '$2b$12$h5w4apZJchiz1auSYK.H0ezUPCeSCzF10sToHo5/4KBjW/hQKLI9i', 'Lisa Park', 'Dispatch IO', 'dispatcher', true),
  ('a0000000-0000-0000-0000-000000000005', 'viewer@pathwounded.com', '$2b$12$h5w4apZJchiz1auSYK.H0ezUPCeSCzF10sToHo5/4KBjW/hQKLI9i', 'Tom Viewer', NULL, 'viewer', true)
ON CONFLICT (id) DO NOTHING;

-- CARRIERS (10)
INSERT INTO carriers (id, name, location, rating, vehicle_count, partner_count, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Swift haul Logistics', 'Dallas, TX', 4.8, 3, 2, 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'Atlas Freight Co.', 'Chicago, IL', 4.6, 3, 1, 'active'),
  ('b0000000-0000-0000-0000-000000000003', 'Pacific Route Carriers', 'Los Angeles, CA', 4.5, 2, 3, 'active'),
  ('b0000000-0000-0000-0000-000000000004', 'East Coast Express', 'Newark, NJ', 4.3, 2, 1, 'active'),
  ('b0000000-0000-0000-0000-000000000005', 'Mountain View Transport', 'Denver, CO', 4.7, 3, 2, 'active'),
  ('b0000000-0000-0000-0000-000000000006', 'Southern Star Freight', 'Atlanta, GA', 4.2, 1, 1, 'active'),
  ('b0000000-0000-0000-0000-000000000007', 'Northern Lights Haulage', 'Seattle, WA', 4.4, 3, 2, 'active'),
  ('b0000000-0000-0000-0000-000000000008', 'Sun Belt Carriers', 'Phoenix, AZ', 4.1, 2, 1, 'active'),
  ('b0000000-0000-0000-0000-000000000009', 'Great Plains Logistics', 'Kansas City, MO', 3.9, 2, 3, 'active'),
  ('b0000000-0000-0000-0000-000000000010', 'Coastal Cargo Inc.', 'Miami, FL', 4.0, 3, 2, 'active')
ON CONFLICT (id) DO NOTHING;

-- VEHICLES (24)
INSERT INTO vehicles (id, carrier_id, type, identifier, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'truck', 'SWI-001', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'truck', 'SWI-002', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'cargo_van', 'SWI-003', 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'truck', 'ATL-001', 'active'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'trailer', 'ATL-002', 'active'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'truck', 'ATL-003', 'active'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'truck', 'PAC-001', 'active'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'cargo_plane', 'PAC-002', 'active'),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004', 'truck', 'EAS-001', 'active'),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000004', 'cargo_van', 'EAS-002', 'active'),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000005', 'truck', 'MOU-001', 'active'),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000005', 'trailer', 'MOU-002', 'active'),
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000005', 'truck', 'MOU-003', 'active'),
  ('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000006', 'truck', 'SOU-001', 'active'),
  ('c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000007', 'truck', 'NOR-001', 'active'),
  ('c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000007', 'trailer', 'NOR-002', 'active'),
  ('c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000007', 'cargo_van', 'NOR-003', 'active'),
  ('c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000008', 'truck', 'SUN-001', 'active'),
  ('c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000008', 'truck', 'SUN-002', 'active'),
  ('c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000009', 'truck', 'GRT-001', 'active'),
  ('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000009', 'trailer', 'GRT-002', 'active'),
  ('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000010', 'truck', 'COS-001', 'active'),
  ('c0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000010', 'cargo_van', 'COS-002', 'active'),
  ('c0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000010', 'truck', 'COS-003', 'active')
ON CONFLICT (id) DO NOTHING;

-- ORDERS (50) — uses generate_series in FROM which is correct
INSERT INTO orders (id, order_number, broker_id, carrier_id, status, origin_address, destination_address, amount_paid, hours_on_road, created_at, delivered_at)
SELECT
  'd' || lpad(s::text, 3, '0') || '0000-0000-0000-0000-000000000000',
  'PW-' || lpad(s::text, 4, '0'),
  CASE WHEN s % 2 = 0 THEN 'a0000000-0000-0000-0000-000000000002' ELSE 'a0000000-0000-0000-0000-000000000003' END,
  (ARRAY['b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000010'])[1 + (s % 10)],
  (ARRAY['pending','pending','assigned','assigned','in_transit','in_transit','in_transit','delivered','delivered','delivered','delivered','delivered','cancelled'])[1 + (s % 13)]::order_status,
  (ARRAY['123 Main St, Houston, TX 77001','789 Industrial Blvd, Phoenix, AZ 85001','555 Harbor Way, Long Beach, CA 90802','100 Port Authority, Newark, NJ 07102','300 Airport Rd, Atlanta, GA 30320','600 Warehouse Ln, Nashville, TN 37201','900 Tech Campus, Austin, TX 78701','222 Distribution Center, Portland, OR 97201'])[1 + (s % 8)],
  (ARRAY['456 Oak Ave, Memphis, TN 38103','321 Commerce Dr, Las Vegas, NV 89101','888 Mountain Rd, Salt Lake City, UT 84101','200 Financial Pl, Boston, MA 02101','400 Market St, Charlotte, NC 28202','700 Broad St, Birmingham, AL 35203','111 Innovation Way, San Antonio, TX 78205','333 Supply Chain Blvd, Boise, ID 83701'])[1 + (s % 8)],
  round((random() * 15000 + 500)::numeric, 2),
  CASE WHEN (ARRAY['pending','pending','assigned','assigned','in_transit','in_transit','in_transit','delivered','delivered','delivered','delivered','delivered','cancelled'])[1 + (s % 13)] = 'delivered'
    THEN (random() * 48 + 2)::double precision ELSE NULL END,
  now() - (random() * 60 || ' days')::interval,
  CASE WHEN (ARRAY['pending','pending','assigned','assigned','in_transit','in_transit','in_transit','delivered','delivered','delivered','delivered','delivered','cancelled'])[1 + (s % 13)] = 'delivered'
    THEN now() - (random() * 60 || ' days')::interval ELSE NULL END
FROM generate_series(1, 50) AS s
ON CONFLICT (id) DO NOTHING;

-- PARTNERS (15) — uses generate_series in FROM which is correct
INSERT INTO partners (id, carrier_id, name, type)
SELECT
  'e' || lpad(s::text, 3, '0') || '0000-0000-0000-0000-000000000000',
  (ARRAY['b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000010'])[1 + (s % 10)],
  'Partner ' || s,
  (ARRAY['supplier','distributor','warehouse','customs','other'])[1 + (s % 5)]::partner_type
FROM generate_series(1, 15) AS s
ON CONFLICT (id) DO NOTHING;

-- INVOICES (for delivered orders) — fixed: uses CTE with row_number instead of bare generate_series
WITH delivered_orders AS (
  SELECT o.id, o.carrier_id, o.amount_paid, o.created_at,
         row_number() OVER (ORDER BY o.created_at) AS rn
  FROM orders o
  WHERE o.status = 'delivered' AND o.carrier_id IS NOT NULL
  LIMIT 25
)
INSERT INTO invoices (id, order_id, carrier_id, amount, status, due_date, paid_at, created_at)
SELECT
  'f' || lpad(d.rn::text, 3, '0') || '0000-0000-0000-0000-000000000000',
  d.id,
  d.carrier_id,
  d.amount_paid,
  (ARRAY['paid','paid','paid','unpaid','overdue'])[1 + (d.rn % 5)]::invoice_status,
  d.created_at + interval '30 days',
  CASE WHEN (ARRAY['paid','paid','paid','unpaid','overdue'])[1 + (d.rn % 5)] = 'paid'
    THEN d.created_at + (random() * 20 || ' days')::interval ELSE NULL END,
  d.created_at + interval '3 days'
FROM delivered_orders d
ON CONFLICT (id) DO NOTHING;

-- REVIEWS (25) — uses generate_series in FROM which is correct
INSERT INTO reviews (id, carrier_id, author_id, rating, comment)
SELECT
  'g' || lpad(s::text, 3, '0') || '0000-0000-0000-000000000000',
  (ARRAY['b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000010'])[1 + (s % 10)],
  (ARRAY['a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004'])[1 + (s % 4)],
  4 + (s % 2),
  (ARRAY['Excellent service, very professional team.','Delivered on time, great communication throughout.','Smooth process from start to finish.','Had a minor delay but overall good experience.','Highly recommend for long-haul freight.','Reliable and efficient carrier.','Good pricing and transparent billing.','Will definitely use again for future shipments.'])[1 + (s % 8)]
FROM generate_series(1, 25) AS s
ON CONFLICT DO NOTHING;

-- Update carrier ratings from reviews
UPDATE carriers c SET rating = COALESCE(
  (SELECT round(avg(r.rating)::numeric, 1) FROM reviews r WHERE r.carrier_id = c.id),
  0
);

-- NOTIFICATIONS (15) — uses generate_series in FROM which is correct
INSERT INTO notifications (id, user_id, type, payload, read_at)
SELECT
  'h' || lpad(s::text, 3, '0') || '0000-0000-0000-0000-000000000000',
  (ARRAY['a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003'])[1 + (s % 3)],
  (ARRAY['order_update','invoice_created','system_alert'])[1 + (s % 3)],
  jsonb_build_object('message', 'Sample notification ' || s),
  CASE WHEN s > 2 THEN now() ELSE NULL END
FROM generate_series(1, 15) AS s
ON CONFLICT (id) DO NOTHING;
