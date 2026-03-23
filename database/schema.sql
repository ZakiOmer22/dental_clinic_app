-- ============================================================
-- DENTAL CLINIC MANAGEMENT SYSTEM — FULL SQL SCHEMA
-- Database: PostgreSQL (Neon / Supabase compatible)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CLINICS (multi-branch support)
-- ============================================================
CREATE TABLE clinics (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  phone           VARCHAR(30),
  email           VARCHAR(120),
  address         TEXT,
  city            VARCHAR(80),
  country         VARCHAR(80)   DEFAULT 'Somalia',
  logo_url        TEXT,
  currency        VARCHAR(10)   DEFAULT 'USD',
  timezone        VARCHAR(60)   DEFAULT 'Africa/Nairobi',
  is_active       BOOLEAN       DEFAULT TRUE,
  created_at      TIMESTAMP     DEFAULT NOW(),
  updated_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 2. USERS (staff — doctors, receptionists, admins, assistants)
-- ============================================================
CREATE TABLE users (
  id                  SERIAL PRIMARY KEY,
  clinic_id           INT           NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  full_name           VARCHAR(150)  NOT NULL,
  email               VARCHAR(120)  NOT NULL UNIQUE,
  password_hash       TEXT          NOT NULL,
  role                VARCHAR(40)   NOT NULL CHECK (role IN ('admin','dentist','receptionist','assistant','accountant','nurse')),
  phone               VARCHAR(30),
  gender              VARCHAR(10),
  date_of_birth       DATE,
  national_id         VARCHAR(60),
  address             TEXT,
  specialization      VARCHAR(100), -- e.g. Orthodontics, Endodontics
  license_number      VARCHAR(80),
  hire_date           DATE,
  avatar_url          TEXT,
  is_active           BOOLEAN       DEFAULT TRUE,
  last_login_at       TIMESTAMP,
  created_at          TIMESTAMP     DEFAULT NOW(),
  updated_at          TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_users_clinic   ON users(clinic_id);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);

-- ============================================================
-- 3. PATIENTS
-- ============================================================
CREATE TABLE patients (
  id                  SERIAL PRIMARY KEY,
  clinic_id           INT           NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_number      VARCHAR(30)   UNIQUE, -- e.g. PT-0001
  full_name           VARCHAR(150)  NOT NULL,
  phone               VARCHAR(30)   NOT NULL,
  secondary_phone     VARCHAR(30),
  email               VARCHAR(120),
  gender              VARCHAR(10)   CHECK (gender IN ('Male','Female','Other')),
  date_of_birth       DATE,
  blood_type          VARCHAR(5),
  national_id         VARCHAR(60),
  address             TEXT,
  city                VARCHAR(80),
  occupation          VARCHAR(100),
  marital_status      VARCHAR(20),
  referred_by         VARCHAR(100), -- referring doctor or source
  notes               TEXT,
  is_active           BOOLEAN       DEFAULT TRUE,
  created_by          INT           REFERENCES users(id),
  created_at          TIMESTAMP     DEFAULT NOW(),
  updated_at          TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_patients_clinic  ON patients(clinic_id);
CREATE INDEX idx_patients_phone   ON patients(phone);
CREATE INDEX idx_patients_name    ON patients(full_name);

-- Auto-generate patient number
CREATE SEQUENCE patient_number_seq START 1;
CREATE OR REPLACE FUNCTION set_patient_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_number IS NULL THEN
    NEW.patient_number := 'PT-' || LPAD(nextval('patient_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patient_number
  BEFORE INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION set_patient_number();

-- ============================================================
-- 4. ALLERGIES
-- ============================================================
CREATE TABLE allergies (
  id          SERIAL PRIMARY KEY,
  patient_id  INT           NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen    VARCHAR(120)  NOT NULL, -- e.g. Penicillin, Latex, Aspirin
  reaction    TEXT,                   -- e.g. rash, anaphylaxis
  severity    VARCHAR(20)   CHECK (severity IN ('mild','moderate','severe')),
  created_at  TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_allergies_patient ON allergies(patient_id);

-- ============================================================
-- 5. MEDICAL CONDITIONS (systemic)
-- ============================================================
CREATE TABLE medical_conditions (
  id              SERIAL PRIMARY KEY,
  patient_id      INT           NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  condition_name  VARCHAR(150)  NOT NULL, -- e.g. Diabetes, Hypertension, HIV
  icd_code        VARCHAR(20),            -- ICD-10 code if available
  status          VARCHAR(20)   DEFAULT 'active' CHECK (status IN ('active','resolved','chronic')),
  notes           TEXT,
  diagnosed_at    DATE,
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_conditions_patient ON medical_conditions(patient_id);

-- ============================================================
-- 6. EMERGENCY CONTACTS
-- ============================================================
CREATE TABLE emergency_contacts (
  id              SERIAL PRIMARY KEY,
  patient_id      INT           NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  full_name       VARCHAR(150)  NOT NULL,
  relationship    VARCHAR(60),           -- e.g. Spouse, Parent, Sibling
  phone           VARCHAR(30)   NOT NULL,
  secondary_phone VARCHAR(30),
  is_primary      BOOLEAN       DEFAULT FALSE
);

CREATE INDEX idx_emergency_patient ON emergency_contacts(patient_id);

-- ============================================================
-- 7. INSURANCE POLICIES
-- ============================================================
CREATE TABLE insurance_policies (
  id                SERIAL PRIMARY KEY,
  patient_id        INT             NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_name     VARCHAR(150)    NOT NULL,
  policy_number     VARCHAR(80)     NOT NULL,
  group_number      VARCHAR(80),
  member_id         VARCHAR(80),
  coverage_type     VARCHAR(80),            -- e.g. Full, Partial, Dental Only
  coverage_percent  DECIMAL(5,2)    DEFAULT 0.00,
  annual_limit      DECIMAL(12,2),
  used_amount       DECIMAL(12,2)   DEFAULT 0.00,
  start_date        DATE,
  expiry_date       DATE,
  is_active         BOOLEAN         DEFAULT TRUE,
  notes             TEXT,
  created_at        TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX idx_insurance_patient ON insurance_policies(patient_id);

-- ============================================================
-- 8. ROOMS / CHAIRS
-- ============================================================
CREATE TABLE rooms (
  id          SERIAL PRIMARY KEY,
  clinic_id   INT           NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        VARCHAR(80)   NOT NULL, -- e.g. Chair 1, X-Ray Room, Surgery Suite
  type        VARCHAR(60)   CHECK (type IN ('dental_chair','xray','surgery','consultation','lab','sterilization','waiting')),
  floor       VARCHAR(20),
  is_available BOOLEAN      DEFAULT TRUE,
  notes       TEXT
);

CREATE INDEX idx_rooms_clinic ON rooms(clinic_id);

-- ============================================================
-- 9. PROCEDURES CATALOG (services & their prices)
-- ============================================================
CREATE TABLE procedures (
  id                SERIAL PRIMARY KEY,
  clinic_id         INT           NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name              VARCHAR(150)  NOT NULL,  -- e.g. Root Canal, Scaling, Extraction
  category          VARCHAR(80),             -- e.g. Restorative, Orthodontics, Surgical, Preventive, Cosmetic
  cdt_code          VARCHAR(20),             -- ADA CDT procedure code (D0100, D2140...)
  base_price        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  duration_minutes  INT           DEFAULT 30,
  description       TEXT,
  requires_lab      BOOLEAN       DEFAULT FALSE, -- lab work needed?
  is_active         BOOLEAN       DEFAULT TRUE,
  created_at        TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_procedures_clinic    ON procedures(clinic_id);
CREATE INDEX idx_procedures_category  ON procedures(category);

-- ============================================================
-- 10. APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id                  SERIAL PRIMARY KEY,
  clinic_id           INT           NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id          INT           NOT NULL REFERENCES patients(id),
  doctor_id           INT           NOT NULL REFERENCES users(id),
  room_id             INT           REFERENCES rooms(id),
  scheduled_at        TIMESTAMP     NOT NULL,
  end_at              TIMESTAMP,            -- computed: scheduled_at + duration
  duration_minutes    INT           DEFAULT 30,
  type                VARCHAR(60)   DEFAULT 'checkup' CHECK (type IN ('checkup','follow_up','emergency','procedure','consultation','xray','cleaning','surgery')),
  status              VARCHAR(30)   DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show','rescheduled')),
  chief_complaint     TEXT,                 -- what the patient says hurts
  notes               TEXT,
  cancellation_reason TEXT,
  reminder_sent       BOOLEAN       DEFAULT FALSE,
  created_by          INT           REFERENCES users(id),
  created_at          TIMESTAMP     DEFAULT NOW(),
  updated_at          TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient   ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor    ON appointments(doctor_id);
CREATE INDEX idx_appointments_clinic    ON appointments(clinic_id);
CREATE INDEX idx_appointments_date      ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status    ON appointments(status);

-- ============================================================
-- 11. DENTAL CHART / ODONTOGRAM
-- ============================================================
CREATE TABLE dental_chart (
  id              SERIAL PRIMARY KEY,
  patient_id      INT           NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number    VARCHAR(10)   NOT NULL, -- ISO 3950: 11-48, or Universal: 1-32
  notation_system VARCHAR(20)   DEFAULT 'ISO' CHECK (notation_system IN ('ISO','Universal','Palmer')),
  surface         VARCHAR(20),            -- M(esial), D(istal), O(cclusal), B(uccal), L(ingual), combined
  condition       VARCHAR(80),            -- Caries, Fracture, Missing, Crown, Implant, RCT, etc.
  severity        VARCHAR(20)   CHECK (severity IN ('watch','mild','moderate','severe')),
  notes           TEXT,
  recorded_by     INT           REFERENCES users(id),
  recorded_at     TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_chart_patient ON dental_chart(patient_id);
CREATE INDEX idx_chart_tooth   ON dental_chart(patient_id, tooth_number);

-- ============================================================
-- 12. TREATMENTS (clinical notes per appointment)
-- ============================================================
CREATE TABLE treatments (
  id                SERIAL PRIMARY KEY,
  appointment_id    INT           REFERENCES appointments(id),
  patient_id        INT           NOT NULL REFERENCES patients(id),
  doctor_id         INT           NOT NULL REFERENCES users(id),
  chief_complaint   TEXT,
  diagnosis         TEXT,
  clinical_notes    TEXT,         -- SOAP notes or free text
  treatment_notes   TEXT,
  follow_up_notes   TEXT,
  follow_up_date    DATE,
  is_completed      BOOLEAN       DEFAULT FALSE,
  created_at        TIMESTAMP     DEFAULT NOW(),
  updated_at        TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_treatments_patient     ON treatments(patient_id);
CREATE INDEX idx_treatments_doctor      ON treatments(doctor_id);
CREATE INDEX idx_treatments_appointment ON treatments(appointment_id);

-- ============================================================
-- 13. TREATMENT PROCEDURES (line items per treatment)
-- ============================================================
CREATE TABLE treatment_procedures (
  id              SERIAL PRIMARY KEY,
  treatment_id    INT           NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  procedure_id    INT           NOT NULL REFERENCES procedures(id),
  tooth_number    VARCHAR(10),           -- which tooth was treated
  surface         VARCHAR(20),           -- MDOBL surfaces
  status          VARCHAR(30)   DEFAULT 'completed' CHECK (status IN ('planned','in_progress','completed','cancelled','referred')),
  price_charged   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes           TEXT,
  performed_at    TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_tx_procedures_treatment ON treatment_procedures(treatment_id);

-- ============================================================
-- 14. PRESCRIPTIONS
-- ============================================================
CREATE TABLE prescriptions (
  id                SERIAL PRIMARY KEY,
  treatment_id      INT           REFERENCES treatments(id),
  patient_id        INT           NOT NULL REFERENCES patients(id),
  doctor_id         INT           NOT NULL REFERENCES users(id),
  medication_name   VARCHAR(150)  NOT NULL,
  generic_name      VARCHAR(150),
  dosage            VARCHAR(80)   NOT NULL, -- e.g. 500mg
  route             VARCHAR(40),            -- oral, topical, injection
  frequency         VARCHAR(80)   NOT NULL, -- e.g. twice daily
  duration          VARCHAR(80),            -- e.g. 7 days
  quantity          INT,
  refills_allowed   INT           DEFAULT 0,
  instructions      TEXT,                   -- take with food, etc.
  is_dispensed      BOOLEAN       DEFAULT FALSE,
  dispensed_at      TIMESTAMP,
  prescribed_at     TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient   ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_treatment ON prescriptions(treatment_id);

-- ============================================================
-- 15. LAB ORDERS (e.g. crowns, dentures sent to lab)
-- ============================================================
CREATE TABLE lab_orders (
  id                SERIAL PRIMARY KEY,
  treatment_id      INT           NOT NULL REFERENCES treatments(id),
  patient_id        INT           NOT NULL REFERENCES patients(id),
  doctor_id         INT           NOT NULL REFERENCES users(id),
  lab_name          VARCHAR(150),
  order_type        VARCHAR(100), -- Crown, Denture, Bridge, Aligner, Retainer
  shade             VARCHAR(30),  -- tooth color shade e.g. A2, B3
  instructions      TEXT,
  sent_date         DATE,
  expected_date     DATE,
  received_date     DATE,
  status            VARCHAR(30)   DEFAULT 'pending' CHECK (status IN ('pending','sent','in_progress','received','rejected')),
  cost              DECIMAL(12,2) DEFAULT 0.00,
  notes             TEXT,
  created_at        TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_lab_orders_patient    ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_treatment  ON lab_orders(treatment_id);

-- ============================================================
-- 16. INVOICES
-- ============================================================
CREATE TABLE invoices (
  id                  SERIAL PRIMARY KEY,
  clinic_id           INT           NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id          INT           NOT NULL REFERENCES patients(id),
  treatment_id        INT           REFERENCES treatments(id),
  invoice_number      VARCHAR(40)   UNIQUE NOT NULL, -- INV-00001
  subtotal            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_percent         DECIMAL(5,2)  DEFAULT 0.00,
  tax_amount          DECIMAL(12,2) DEFAULT 0.00,
  discount_type       VARCHAR(20)   CHECK (discount_type IN ('percent','fixed','none')),
  discount_value      DECIMAL(12,2) DEFAULT 0.00,
  discount_amount     DECIMAL(12,2) DEFAULT 0.00,
  insurance_covered   DECIMAL(12,2) DEFAULT 0.00,
  total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  paid_amount         DECIMAL(12,2) DEFAULT 0.00,
  status              VARCHAR(20)   DEFAULT 'unpaid' CHECK (status IN ('draft','unpaid','partial','paid','void','refunded')),
  due_date            DATE,
  notes               TEXT,
  created_by          INT           REFERENCES users(id),
  created_at          TIMESTAMP     DEFAULT NOW(),
  updated_at          TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_clinic  ON invoices(clinic_id);
CREATE INDEX idx_invoices_status  ON invoices(status);

-- Auto invoice number
CREATE SEQUENCE invoice_number_seq START 1;
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

-- ============================================================
-- 17. INVOICE ITEMS
-- ============================================================
CREATE TABLE invoice_items (
  id              SERIAL PRIMARY KEY,
  invoice_id      INT           NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  procedure_id    INT           REFERENCES procedures(id),
  description     VARCHAR(200)  NOT NULL,
  tooth_number    VARCHAR(10),
  quantity        INT           NOT NULL DEFAULT 1,
  unit_price      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  total_price     DECIMAL(12,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================================
-- 18. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                SERIAL PRIMARY KEY,
  invoice_id        INT           NOT NULL REFERENCES invoices(id),
  received_by       INT           NOT NULL REFERENCES users(id),
  amount            DECIMAL(12,2) NOT NULL,
  method            VARCHAR(30)   NOT NULL CHECK (method IN ('cash','card','mobile_money','bank_transfer','insurance','cheque','other')),
  reference_number  VARCHAR(100),          -- card txn ID, mobile money ref, etc.
  change_given      DECIMAL(12,2) DEFAULT 0.00,
  notes             TEXT,
  paid_at           TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- ============================================================
-- 19. INVENTORY
-- ============================================================
CREATE TABLE inventory_items (
  id                    SERIAL PRIMARY KEY,
  clinic_id             INT           NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name                  VARCHAR(150)  NOT NULL,
  sku                   VARCHAR(80)   UNIQUE,
  category              VARCHAR(80),          -- Consumable, Equipment, Drug, PPE, Dental Material
  unit                  VARCHAR(30),          -- pcs, box, ml, mg, pair
  unit_cost             DECIMAL(12,2) DEFAULT 0.00,
  quantity_in_stock     INT           NOT NULL DEFAULT 0,
  minimum_stock_level   INT           DEFAULT 5,
  maximum_stock_level   INT,
  reorder_quantity      INT,
  supplier_name         VARCHAR(150),
  supplier_contact      VARCHAR(80),
  barcode               VARCHAR(80),
  expiry_date           DATE,
  storage_location      VARCHAR(100), -- shelf, cabinet, fridge
  is_active             BOOLEAN       DEFAULT TRUE,
  notes                 TEXT,
  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_inventory_clinic    ON inventory_items(clinic_id);
CREATE INDEX idx_inventory_category  ON inventory_items(category);
CREATE INDEX idx_inventory_low_stock ON inventory_items(quantity_in_stock, minimum_stock_level);

-- ============================================================
-- 20. INVENTORY TRANSACTIONS (stock movements)
-- ============================================================
CREATE TABLE inventory_transactions (
  id                SERIAL PRIMARY KEY,
  item_id           INT           NOT NULL REFERENCES inventory_items(id),
  user_id           INT           NOT NULL REFERENCES users(id),
  transaction_type  VARCHAR(20)   NOT NULL CHECK (transaction_type IN ('received','used','wasted','returned','adjusted','expired')),
  quantity          INT           NOT NULL,   -- positive = in, negative = out
  quantity_before   INT,
  quantity_after    INT,
  unit_cost         DECIMAL(12,2),
  reference_id      INT,                      -- treatment_id if used during treatment
  reason            TEXT,
  created_at        TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_inv_tx_item   ON inventory_transactions(item_id);
CREATE INDEX idx_inv_tx_user   ON inventory_transactions(user_id);
CREATE INDEX idx_inv_tx_date   ON inventory_transactions(created_at);

-- ============================================================
-- 21. PATIENT FILES (X-rays, photos, documents)
-- ============================================================
CREATE TABLE patient_files (
  id              SERIAL PRIMARY KEY,
  patient_id      INT           NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id    INT           REFERENCES treatments(id),
  uploaded_by     INT           NOT NULL REFERENCES users(id),
  file_name       VARCHAR(255)  NOT NULL,
  file_url        TEXT          NOT NULL,
  file_type       VARCHAR(20),              -- image/jpeg, application/pdf, etc.
  file_size_kb    INT,
  category        VARCHAR(60)   CHECK (category IN ('xray','photo','document','lab_result','consent_form','referral','other')),
  tooth_number    VARCHAR(10),
  description     TEXT,
  is_archived     BOOLEAN       DEFAULT FALSE,
  uploaded_at     TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_files_patient   ON patient_files(patient_id);
CREATE INDEX idx_files_treatment ON patient_files(treatment_id);

-- ============================================================
-- 22. REFERRALS (sending patients to specialists)
-- ============================================================
CREATE TABLE referrals (
  id                  SERIAL PRIMARY KEY,
  patient_id          INT           NOT NULL REFERENCES patients(id),
  referred_by         INT           NOT NULL REFERENCES users(id),
  referral_to         VARCHAR(150), -- specialist name or clinic
  specialty           VARCHAR(100), -- e.g. Oral Surgery, Orthodontics
  reason              TEXT,
  urgency             VARCHAR(20)   CHECK (urgency IN ('routine','urgent','emergency')),
  status              VARCHAR(30)   DEFAULT 'pending' CHECK (status IN ('pending','sent','accepted','completed','rejected')),
  referred_at         DATE          DEFAULT CURRENT_DATE,
  feedback_notes      TEXT,
  completed_at        DATE
);

CREATE INDEX idx_referrals_patient ON referrals(patient_id);

-- ============================================================
-- 23. CONSENT FORMS
-- ============================================================
CREATE TABLE consent_forms (
  id              SERIAL PRIMARY KEY,
  patient_id      INT           NOT NULL REFERENCES patients(id),
  treatment_id    INT           REFERENCES treatments(id),
  form_type       VARCHAR(80)   NOT NULL, -- General, Surgical, Anesthesia, Photography
  signed_at       TIMESTAMP,
  signed_by       VARCHAR(150),           -- patient or guardian name
  witness         VARCHAR(150),
  is_signed       BOOLEAN       DEFAULT FALSE,
  file_url        TEXT,                   -- scanned copy URL
  notes           TEXT,
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_consent_patient ON consent_forms(patient_id);

-- ============================================================
-- 24. NOTIFICATIONS / REMINDERS
-- ============================================================
CREATE TABLE notifications (
  id              SERIAL PRIMARY KEY,
  clinic_id       INT           REFERENCES clinics(id),
  user_id         INT           REFERENCES users(id),   -- NULL = patient notification
  patient_id      INT           REFERENCES patients(id),
  type            VARCHAR(40)   CHECK (type IN ('appointment_reminder','follow_up','payment_due','birthday','recare','low_stock','system')),
  title           VARCHAR(200),
  message         TEXT,
  channel         VARCHAR(20)   CHECK (channel IN ('sms','email','whatsapp','in_app','push')),
  is_sent         BOOLEAN       DEFAULT FALSE,
  is_read         BOOLEAN       DEFAULT FALSE,
  scheduled_at    TIMESTAMP,
  sent_at         TIMESTAMP,
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_notif_patient ON notifications(patient_id);
CREATE INDEX idx_notif_user    ON notifications(user_id);
CREATE INDEX idx_notif_sent    ON notifications(is_sent, scheduled_at);

-- ============================================================
-- 25. AUDIT LOGS (every important action is logged)
-- ============================================================
CREATE TABLE audit_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INT           REFERENCES users(id),
  clinic_id     INT           REFERENCES clinics(id),
  table_name    VARCHAR(80)   NOT NULL,
  action        VARCHAR(20)   NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','VIEW')),
  record_id     INT,
  old_values    JSONB,
  new_values    JSONB,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_audit_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_table  ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_date   ON audit_logs(created_at);

-- ============================================================
-- 26. RECALL / RECARE SCHEDULE (6-month cleanings etc.)
-- ============================================================
CREATE TABLE recall_schedule (
  id                SERIAL PRIMARY KEY,
  patient_id        INT           NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recall_type       VARCHAR(80)   DEFAULT 'cleaning', -- cleaning, checkup, ortho_check
  interval_months   INT           DEFAULT 6,
  last_visit_date   DATE,
  next_due_date     DATE,
  status            VARCHAR(20)   DEFAULT 'pending' CHECK (status IN ('pending','notified','scheduled','completed','skipped')),
  notes             TEXT,
  created_at        TIMESTAMP     DEFAULT NOW(),
  updated_at        TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_recall_patient  ON recall_schedule(patient_id);
CREATE INDEX idx_recall_due      ON recall_schedule(next_due_date, status);

-- ============================================================
-- 27. EXPENSES (clinic operational costs)
-- ============================================================
CREATE TABLE expenses (
  id              SERIAL PRIMARY KEY,
  clinic_id       INT           NOT NULL REFERENCES clinics(id),
  recorded_by     INT           NOT NULL REFERENCES users(id),
  category        VARCHAR(80),  -- Rent, Utilities, Salaries, Supplies, Equipment, Marketing
  description     TEXT          NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  payment_method  VARCHAR(30),
  reference       VARCHAR(100),
  expense_date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  notes           TEXT,
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX idx_expenses_clinic ON expenses(clinic_id);
CREATE INDEX idx_expenses_date   ON expenses(expense_date);
CREATE INDEX idx_expenses_cat    ON expenses(category);

-- ============================================================
-- VIEWS — for reports & dashboards (no heavy JOINs in code)
-- ============================================================

-- Daily appointment summary
CREATE VIEW vw_daily_appointments AS
SELECT
  a.id,
  a.clinic_id,
  a.scheduled_at,
  a.status,
  a.type,
  a.duration_minutes,
  p.full_name        AS patient_name,
  p.phone            AS patient_phone,
  u.full_name        AS doctor_name,
  r.name             AS room_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users    u ON a.doctor_id  = u.id
LEFT JOIN rooms r ON a.room_id  = r.id;

-- Patient financial summary
CREATE VIEW vw_patient_balance AS
SELECT
  p.id          AS patient_id,
  p.full_name   AS patient_name,
  p.phone,
  COALESCE(SUM(i.total_amount), 0)  AS total_billed,
  COALESCE(SUM(i.paid_amount),  0)  AS total_paid,
  COALESCE(SUM(i.total_amount - i.paid_amount), 0) AS balance_due,
  COUNT(i.id)   AS invoice_count
FROM patients p
LEFT JOIN invoices i ON p.id = i.patient_id
GROUP BY p.id, p.full_name, p.phone;

-- Revenue by period
CREATE VIEW vw_revenue_summary AS
SELECT
  DATE_TRUNC('month', paid_at) AS month,
  SUM(amount)                  AS total_collected,
  COUNT(*)                     AS payment_count,
  method
FROM payments
GROUP BY DATE_TRUNC('month', paid_at), method
ORDER BY month DESC;

-- Low stock alert
CREATE VIEW vw_low_stock AS
SELECT
  id, clinic_id, name, category,
  quantity_in_stock,
  minimum_stock_level,
  (minimum_stock_level - quantity_in_stock) AS units_needed,
  expiry_date,
  supplier_name
FROM inventory_items
WHERE quantity_in_stock <= minimum_stock_level
  AND is_active = TRUE;

-- Today's schedule (quick dashboard widget)
CREATE VIEW vw_todays_schedule AS
SELECT
  a.id,
  a.scheduled_at,
  a.end_at,
  a.status,
  a.type,
  a.chief_complaint,
  p.full_name   AS patient_name,
  p.phone       AS patient_phone,
  u.full_name   AS doctor_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users    u ON a.doctor_id  = u.id
WHERE DATE(a.scheduled_at) = CURRENT_DATE
ORDER BY a.scheduled_at;

-- ============================================================
-- SEED DATA — default clinic + admin user
-- ============================================================

INSERT INTO clinics (name, phone, email, address, city)
VALUES ('Smile Dental Clinic', '+252610000000', 'admin@smileclinic.so', 'Hargeisa, Somaliland', 'Hargeisa');

-- Password: Admin@1234 (bcrypt hash — change this immediately)
INSERT INTO users (clinic_id, full_name, email, password_hash, role)
VALUES (
  1,
  'System Admin',
  'admin@smileclinic.so',
  '$2b$12$PlaceholderHashReplaceWithRealBcryptHash',
  'admin'
);

-- Seed procedures catalog
INSERT INTO procedures (clinic_id, name, category, cdt_code, base_price, duration_minutes) VALUES
  (1, 'Comprehensive Oral Exam',    'Diagnostic',     'D0150', 30.00,  30),
  (1, 'Periapical X-Ray',           'Diagnostic',     'D0220', 15.00,  10),
  (1, 'Bitewing X-Rays (4)',        'Diagnostic',     'D0274', 40.00,  15),
  (1, 'Panoramic X-Ray',            'Diagnostic',     'D0330', 60.00,  15),
  (1, 'Prophylaxis (Adult)',        'Preventive',     'D1110', 70.00,  45),
  (1, 'Prophylaxis (Child)',        'Preventive',     'D1120', 50.00,  30),
  (1, 'Fluoride Treatment',         'Preventive',     'D1208', 25.00,  15),
  (1, 'Sealant (per tooth)',        'Preventive',     'D1351', 30.00,  20),
  (1, 'Composite Filling (1 surf)', 'Restorative',    'D2140', 80.00,  45),
  (1, 'Composite Filling (2 surf)', 'Restorative',    'D2150', 110.00, 60),
  (1, 'Composite Filling (3 surf)', 'Restorative',    'D2160', 140.00, 75),
  (1, 'Crown (Porcelain)',          'Restorative',    'D2740', 500.00, 90),
  (1, 'Crown (Metal)',              'Restorative',    'D2710', 350.00, 90),
  (1, 'Root Canal (Anterior)',      'Endodontics',    'D3310', 400.00, 90),
  (1, 'Root Canal (Molar)',         'Endodontics',    'D3330', 600.00, 120),
  (1, 'Simple Extraction',          'Surgical',       'D7110', 80.00,  30),
  (1, 'Surgical Extraction',        'Surgical',       'D7210', 150.00, 60),
  (1, 'Complete Denture (Full)',    'Prosthodontics', 'D5110', 900.00, 120),
  (1, 'Partial Denture',           'Prosthodontics', 'D5213', 600.00, 90),
  (1, 'Dental Implant',            'Implants',       'D6010', 1500.00,120),
  (1, 'Teeth Whitening (Office)',   'Cosmetic',       'D9975', 200.00, 60),
  (1, 'Scaling & Root Planing',    'Periodontics',   'D4341', 150.00, 60),
  (1, 'Emergency Exam & TX',       'Emergency',      'D9999', 50.00,  30);

