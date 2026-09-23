-- ==============================================================================
-- VECTOR — Vehicle & Emergency Connectivity for Transport Operations & Routing
-- North Eastern Region Logistics & Emergency Command Portal
-- Complete Production Relational Database Schema, RLS & Seed Data
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. STATES (8 North Eastern States)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS states (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. DISTRICTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(state_id, name)
);

-- ------------------------------------------------------------------------------
-- 3. DEPARTMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
    contact TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. RESCUE TEAMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rescue_teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
    specialization TEXT NOT NULL,
    lead_officer_id TEXT,
    lead_officer_name TEXT,
    lead_officer_contact TEXT,
    contact_radio TEXT,
    member_ids JSONB DEFAULT '[]'::jsonb,
    member_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'standby' CHECK (status IN ('standby', 'deployed', 'en-route', 'resting')),
    current_incident_id TEXT,
    equipment JSONB DEFAULT '[]'::jsonb,
    base_location TEXT,
    last_status_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. PROFILES (Users and Role-Based Access Control)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'state_admin', 'district_admin', 'field_officer', 'rescue_team_member')),
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
    department TEXT,
    designation TEXT,
    badge_id TEXT UNIQUE,
    assigned_team_id TEXT REFERENCES rescue_teams(id) ON DELETE SET NULL,
    assigned_team_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on-duty', 'standby', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. ROUTES / HIGHWAY CORRIDORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    route_name TEXT NOT NULL,
    highway_number TEXT NOT NULL,
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
    start_location TEXT NOT NULL,
    end_location TEXT NOT NULL,
    length_km NUMERIC NOT NULL DEFAULT 0,
    accessibility_status TEXT NOT NULL DEFAULT 'open' CHECK (accessibility_status IN ('open', 'restricted', 'blocked', 'warning', 'clear')),
    risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    road_condition TEXT,
    condition_details TEXT,
    detour_route TEXT,
    affected_convoys INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. ROUTE SEGMENTS (Detailed GIS map geometry and status)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_segments (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    segment_name TEXT NOT NULL,
    geometry JSONB NOT NULL, -- Array of coordinates [x, y] or [lng, lat]
    accessibility_status TEXT NOT NULL CHECK (accessibility_status IN ('open', 'restricted', 'blocked', 'warning', 'clear')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    reason TEXT,
    blocked_location JSONB, -- [lng, lat]
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- ------------------------------------------------------------------------------
-- 8. INCIDENTS (Central Operational Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL UNIQUE, -- e.g. 'INC-NE-341'
    title TEXT NOT NULL,
    description TEXT,
    incident_type TEXT NOT NULL CHECK (incident_type IN ('landslide', 'flood', 'structural', 'breakdown', 'weather', 'road_damage', 'bridge_restriction', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'warning', 'info')),
    status TEXT NOT NULL CHECK (status IN ('Reported', 'Pending Verification', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'active', 'in-progress', 'clearing', 'resolved')),
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    road_name TEXT NOT NULL,
    highway_number TEXT,
    reported_by TEXT,
    verified_by TEXT,
    assigned_field_officer TEXT,
    assigned_field_officer_role TEXT,
    assigned_rescue_team TEXT,
    estimated_impact TEXT,
    estimated_clearance TEXT,
    photo_url TEXT,
    photo_caption TEXT,
    recommended_action TEXT,
    dispatched_teams JSONB DEFAULT '[]'::jsonb,
    affected_vehicles INTEGER DEFAULT 0,
    coordinates JSONB DEFAULT '[0, 0]'::jsonb, -- Scaled GIS coordinates [x, y]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 9. INCIDENT UPDATES / SITREPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_updates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT,
    update_type TEXT DEFAULT 'status_change',
    previous_status TEXT,
    new_status TEXT,
    note TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. FIELD REPORTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS field_reports (
    id TEXT PRIMARY KEY,
    incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
    submitted_by TEXT NOT NULL,
    submitted_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_agency TEXT,
    report_type TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    gps_coordinates TEXT,
    location_name TEXT,
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
    road_condition TEXT,
    accessibility_status TEXT,
    severity TEXT DEFAULT 'Medium',
    image_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'rejected', 'flagged', 'Verified', 'Pending', 'Actionable')),
    verified_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. VEHICLES (Fleet tracking & GPS telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL UNIQUE, -- e.g. 'NER-1023'
    vehicle_number TEXT,
    callsign TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'Heavy Convoy Truck',
    driver_name TEXT NOT NULL,
    driver_phone TEXT,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    current_location_name TEXT,
    current_route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
    assigned_highway TEXT,
    status TEXT NOT NULL CHECK (status IN ('moving', 'delayed', 'at-risk', 'rerouting', 'halted', 'Moving', 'Delayed', 'At Risk', 'Delivered', 'Offline')),
    cargo_type TEXT NOT NULL,
    cargo_weight TEXT,
    cargo_details TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    eta TEXT,
    speed_kmh INTEGER DEFAULT 0,
    delay_minutes INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'Low',
    risk_details TEXT,
    coordinates JSONB DEFAULT '[0, 0]'::jsonb, -- GIS projection coords
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    telemetry JSONB DEFAULT '{"fuelLevel": 85, "batteryTemp": "38°C", "satcomLink": "SECURE"}'::jsonb,
    last_gps_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. SHIPMENTS / ESSENTIAL COMMODITIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL UNIQUE, -- e.g. 'SHP-NER-4011'
    commodity TEXT NOT NULL,
    quantity TEXT NOT NULL,
    unit TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    origin_state TEXT,
    origin_district TEXT,
    destination_state TEXT,
    destination_district TEXT,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_label TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('emergency', 'high', 'standard', 'low', 'Emergency', 'High', 'Standard', 'Low', 'Critical')),
    status TEXT NOT NULL CHECK (status IN ('dispatched', 'in_transit', 'delayed', 'delivered', 'cancelled', 'Dispatched', 'In Transit', 'Delayed', 'Delivered', 'Cancelled')),
    dispatch_time TIMESTAMPTZ,
    eta TEXT,
    delay TEXT,
    risk TEXT DEFAULT 'Low',
    current_location TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. ALERTS / EMERGENCY NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    code TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'warning', 'info')),
    incident_id TEXT REFERENCES incidents(id) ON DELETE CASCADE,
    route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
    location TEXT,
    impacted_asset TEXT,
    action_required TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 14. RESCUE TASKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rescue_tasks (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    assigned_team TEXT,
    assigned_team_id TEXT REFERENCES rescue_teams(id) ON DELETE SET NULL,
    assigned_member TEXT,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    instructions TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. RISK ASSESSMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    route_id TEXT REFERENCES routes(id) ON DELETE CASCADE,
    incident_id TEXT REFERENCES incidents(id) ON DELETE SET NULL,
    state_id TEXT REFERENCES states(id) ON DELETE SET NULL,
    corridor_name TEXT,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_score NUMERIC NOT NULL, -- 0 to 100
    disruption_probability INTEGER NOT NULL, -- 0 to 100
    expected_timeframe TEXT,
    primary_hazard TEXT,
    confidence_score INTEGER DEFAULT 90,
    factors JSONB DEFAULT '{}'::jsonb,
    factor_details JSONB DEFAULT '{}'::jsonb,
    timeline JSONB DEFAULT '{}'::jsonb,
    sensor_inputs JSONB DEFAULT '[]'::jsonb,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST REALTIME QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_state ON incidents(state_id);
CREATE INDEX IF NOT EXISTS idx_incidents_district ON incidents(district_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_route ON vehicles(current_route_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_field_reports_incident ON field_reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(accessibility_status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running script to avoid duplicate errors
DROP POLICY IF EXISTS "Public read states" ON states;
DROP POLICY IF EXISTS "Public read districts" ON districts;
DROP POLICY IF EXISTS "Public read departments" ON departments;
DROP POLICY IF EXISTS "Super admin full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Read profiles within jurisdiction" ON profiles;
DROP POLICY IF EXISTS "Read incidents" ON incidents;
DROP POLICY IF EXISTS "Insert incidents" ON incidents;
DROP POLICY IF EXISTS "Update incidents" ON incidents;
DROP POLICY IF EXISTS "Read incident updates" ON incident_updates;
DROP POLICY IF EXISTS "Insert incident updates" ON incident_updates;
DROP POLICY IF EXISTS "Read routes" ON routes;
DROP POLICY IF EXISTS "Update routes" ON routes;
DROP POLICY IF EXISTS "Read route segments" ON route_segments;
DROP POLICY IF EXISTS "Update route segments" ON route_segments;
DROP POLICY IF EXISTS "Read field reports" ON field_reports;
DROP POLICY IF EXISTS "Insert field reports" ON field_reports;
DROP POLICY IF EXISTS "Update field reports" ON field_reports;
DROP POLICY IF EXISTS "Read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Read shipments" ON shipments;
DROP POLICY IF EXISTS "Update shipments" ON shipments;
DROP POLICY IF EXISTS "Read alerts" ON alerts;
DROP POLICY IF EXISTS "Update alerts" ON alerts;
DROP POLICY IF EXISTS "Read rescue teams" ON rescue_teams;
DROP POLICY IF EXISTS "Update rescue teams" ON rescue_teams;
DROP POLICY IF EXISTS "Read rescue tasks" ON rescue_tasks;
DROP POLICY IF EXISTS "Update rescue tasks" ON rescue_tasks;
DROP POLICY IF EXISTS "Read risk assessments" ON risk_assessments;
DROP POLICY IF EXISTS "Update risk assessments" ON risk_assessments;
DROP POLICY IF EXISTS "Read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Insert audit logs" ON audit_logs;

-- Reference Data: Anyone authenticated or anonymous can read
CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);

-- Profiles:
CREATE POLICY "Super admin full access on profiles" ON profiles
    FOR ALL
    USING (
        auth.uid() IS NULL -- Allow initial setup / service role
        OR EXISTS (
            SELECT 1 FROM profiles WHERE (auth_user_id = auth.uid() OR email = auth.jwt() ->> 'email') AND role = 'super_admin'
        )
    );

CREATE POLICY "Read profiles within jurisdiction" ON profiles
    FOR SELECT
    USING (
        auth.uid() IS NULL
        OR auth_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles self
            WHERE (self.auth_user_id = auth.uid() OR self.email = auth.jwt() ->> 'email')
            AND (
                self.role = 'super_admin'
                OR (self.role = 'state_admin' AND self.state_id = profiles.state_id)
                OR (self.role = 'district_admin' AND self.state_id = profiles.state_id AND self.district_id = profiles.district_id)
            )
        )
    );

-- Incidents:
CREATE POLICY "Read incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Insert incidents" ON incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Update incidents" ON incidents FOR UPDATE USING (true);

-- Incident Updates:
CREATE POLICY "Read incident updates" ON incident_updates FOR SELECT USING (true);
CREATE POLICY "Insert incident updates" ON incident_updates FOR INSERT WITH CHECK (true);

-- Routes & Route Segments:
CREATE POLICY "Read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Update routes" ON routes FOR ALL USING (true);
CREATE POLICY "Read route segments" ON route_segments FOR SELECT USING (true);
CREATE POLICY "Update route segments" ON route_segments FOR ALL USING (true);

-- Field Reports:
CREATE POLICY "Read field reports" ON field_reports FOR SELECT USING (true);
CREATE POLICY "Insert field reports" ON field_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Update field reports" ON field_reports FOR UPDATE USING (true);

-- Vehicles & Shipments:
CREATE POLICY "Read vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Update vehicles" ON vehicles FOR ALL USING (true);
CREATE POLICY "Read shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Update shipments" ON shipments FOR ALL USING (true);

-- Alerts, Rescue Teams, Tasks, Assessments & Logs:
CREATE POLICY "Read alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Update alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Read rescue teams" ON rescue_teams FOR SELECT USING (true);
CREATE POLICY "Update rescue teams" ON rescue_teams FOR ALL USING (true);
CREATE POLICY "Read rescue tasks" ON rescue_tasks FOR SELECT USING (true);
CREATE POLICY "Update rescue tasks" ON rescue_tasks FOR ALL USING (true);
CREATE POLICY "Read risk assessments" ON risk_assessments FOR SELECT USING (true);
CREATE POLICY "Update risk assessments" ON risk_assessments FOR ALL USING (true);
CREATE POLICY "Read audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated ON incidents;
DROP TRIGGER IF EXISTS trg_routes_updated ON routes;
DROP TRIGGER IF EXISTS trg_vehicles_updated ON vehicles;
DROP TRIGGER IF EXISTS trg_shipments_updated ON shipments;
DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;

CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_routes_updated BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ==============================================================================
-- AUTOMATIC INCIDENT ALERT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION on_incident_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.severity IN ('critical', 'high')) THEN
            INSERT INTO alerts (
                id, code, title, message, alert_type, severity, incident_id,
                state_id, district_id, location, impacted_asset, action_required, acknowledged
            ) VALUES (
                'alt-' || NEW.id,
                'ALT-' || NEW.incident_id,
                NEW.title,
                NEW.description,
                NEW.incident_type,
                NEW.severity,
                NEW.id,
                NEW.state_id,
                NEW.district_id,
                NEW.location_name,
                NEW.road_name,
                NEW.recommended_action,
                false
            ) ON CONFLICT (id) DO NOTHING;
        END IF;

        INSERT INTO audit_logs (action, entity_type, entity_id, new_data)
        VALUES ('Created Incident', 'incident', NEW.id, row_to_json(NEW)::jsonb);
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status <> NEW.status) THEN
            INSERT INTO audit_logs (action, entity_type, entity_id, old_data, new_data)
            VALUES ('Updated Incident Status to ' || NEW.status, 'incident', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incident_audit ON incidents;
CREATE TRIGGER trg_incident_audit AFTER INSERT OR UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION on_incident_change();

-- ==============================================================================
-- REALTIME PUBLICATION SETUP
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE incidents, routes, vehicles, shipments, alerts, field_reports, rescue_teams;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- ==============================================================================
-- SEED DATA: 8 NORTH EASTERN STATES
-- ==============================================================================
INSERT INTO states (id, name, code) VALUES
('Assam', 'Assam', 'AS'),
('Meghalaya', 'Meghalaya', 'ML'),
('Nagaland', 'Nagaland', 'NL'),
('Manipur', 'Manipur', 'MN'),
('Mizoram', 'Mizoram', 'MZ'),
('Tripura', 'Tripura', 'TR'),
('Arunachal Pradesh', 'Arunachal Pradesh', 'AR'),
('Sikkim', 'Sikkim', 'SK')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: KEY DISTRICTS
-- ------------------------------------------------------------------------------
INSERT INTO districts (id, state_id, name, code) VALUES
('dist-kamrup', 'Assam', 'Kamrup', 'KMP'),
('dist-kamrup-metro', 'Assam', 'Kamrup Metro (Guwahati)', 'GHY'),
('dist-cachar', 'Assam', 'Cachar (Silchar)', 'SIL'),
('dist-dibrugarh', 'Assam', 'Dibrugarh', 'DIB'),
('dist-nagaon', 'Assam', 'Nagaon', 'NAG'),
('dist-ekh', 'Meghalaya', 'East Khasi Hills (Shillong)', 'EKH'),
('dist-wgh', 'Meghalaya', 'West Garo Hills (Tura)', 'WGH'),
('dist-ri-bhoi', 'Meghalaya', 'Ri-Bhoi (Nongpoh)', 'RBH'),
('dist-kohima', 'Nagaland', 'Kohima', 'KOH'),
('dist-dimapur', 'Nagaland', 'Dimapur', 'DMP'),
('dist-imphal-west', 'Manipur', 'Imphal West', 'IW'),
('dist-churachandpur', 'Manipur', 'Churachandpur', 'CCP'),
('dist-aizawl', 'Mizoram', 'Aizawl', 'AJL'),
('dist-west-tripura', 'Tripura', 'West Tripura (Agartala)', 'WTR'),
('dist-papum-pare', 'Arunachal Pradesh', 'Papum Pare (Itanagar)', 'PP'),
('dist-east-sikkim', 'Sikkim', 'East Sikkim (Gangtok)', 'ESK')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: DEPARTMENTS
-- ------------------------------------------------------------------------------
INSERT INTO departments (id, name, type, state_id, contact) VALUES
('dept-hq-ner', 'HQ Integrated Defense & Disaster Logistics (NER)', 'Defense/Logistics', 'Assam', '+91 361-2234000'),
('dept-asdma', 'Assam State Disaster Management Authority (ASDMA)', 'Disaster Management', 'Assam', '+91 361-2237011'),
('dept-mseoc', 'Meghalaya State Emergency Operations Centre (SEOC)', 'Emergency Ops', 'Meghalaya', '+91 364-2502098'),
('dept-nsdma', 'Nagaland State Disaster Management Authority', 'Disaster Management', 'Nagaland', '+91 370-2291122'),
('dept-sdrf-assam', 'Assam State Disaster Response Force (SDRF)', 'Search & Rescue', 'Assam', '+91 361-2451000'),
('dept-ndrf-1bn', '1st Battalion National Disaster Response Force (NDRF)', 'Search & Rescue', 'Assam', '+91 361-2849005')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: RESCUE TEAMS
-- ------------------------------------------------------------------------------
INSERT INTO rescue_teams (id, name, state_id, district_id, specialization, lead_officer_name, lead_officer_contact, contact_radio, member_count, status, base_location) VALUES
('team-kamrup-sdrf-1', 'SDRF Quick Response Alpha — Kamrup', 'Assam', 'dist-kamrup', 'Flash Flood Rescue & Swift Water Extrication', 'Hav. Jadu Das', '+91 98649-11234', 'VHF 156.800 MHz (Ch 16)', 12, 'deployed', 'SDRF Water Wing Depot, Jalukbari, Guwahati'),
('team-kamrup-ndrf-1', 'NDRF Urban Search & Heavy Rescue Team', 'Assam', 'dist-kamrup', 'Landslide, Structural Collapse & Heavy Shoring', 'Insp. S. K. Yadav', '+91 94355-66778', 'HF 7.345 MHz Secure TAC-2', 18, 'en-route', '1st Bn NDRF Regional Response Centre, Patgaon'),
('team-ekh-sdrf-1', 'Meghalaya Mountain Rescue Unit — Shillong', 'Meghalaya', 'dist-ekh', 'Landslide & Mountain SAR', 'Insp. B. Marbaniang', '+91 98561-88231', 'VHF 161.225 MHz (SEOC Shillong Ch 8)', 7, 'standby', 'Civil Defence Training Complex, Shillong'),
('team-cachar-sdrf-1', 'Barak Valley Flood Taskforce', 'Assam', 'dist-cachar', 'Riverine Inundation & Embankment Breaches', 'Sub-Insp. A. Barbhuiya', '+91 94350-77621', 'VHF 157.100 MHz (Silchar Port)', 10, 'standby', 'Silchar Civil Defense Station')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: PROFILES (DEMO ACCOUNTS & ROLES)
-- ------------------------------------------------------------------------------
INSERT INTO profiles (id, full_name, email, phone, role, state_id, district_id, department, designation, badge_id, assigned_team_id, assigned_team_name, status) VALUES
('a0000001-0000-0000-0000-000000000001', 'Col. R. Bhattacharya', 'superadmin@vector.gov.in', '+91 94350-11201', 'super_admin', 'Assam', 'dist-kamrup-metro', 'HQ Integrated Defense & Disaster Logistics (NER)', 'Director Operations • North Eastern Command', 'SA-NER-001', NULL, NULL, 'active'),
('a0000001-0000-0000-0000-000000000002', 'Smt. Ananya Saikia, IAS', 'assam.admin@vector.gov.in', '+91 94350-88412', 'state_admin', 'Assam', 'dist-kamrup-metro', 'Assam State Disaster Management Authority (ASDMA)', 'State Relief Commissioner & Special Secretary', 'STA-ASM-101', NULL, NULL, 'active'),
('a0000001-0000-0000-0000-000000000003', 'Dr. B. K. Sarma, ACS', 'kamrup.admin@vector.gov.in', '+91 94351-22904', 'district_admin', 'Assam', 'dist-kamrup', 'District Disaster Management Authority (DDMA Kamrup)', 'Additional Deputy Commissioner (Disaster Relief)', 'DTA-KMP-201', NULL, NULL, 'active'),
('a0000001-0000-0000-0000-000000000004', 'Insp. Tarun Kalita', 'field.officer@vector.gov.in', '+91 98640-55123', 'field_officer', 'Assam', 'dist-kamrup', 'Assam Highway Patrol / Traffic Branch', 'Sub-Divisional Enforcement Officer (Highway Sector 3)', 'FO-KMP-301', NULL, NULL, 'on-duty'),
('a0000001-0000-0000-0000-000000000005', 'Hav. Jadu Das', 'rescue.team@vector.gov.in', '+91 98649-11234', 'rescue_team_member', 'Assam', 'dist-kamrup', 'State Disaster Response Force (SDRF Assam)', 'Senior Diver & Motorized Zodiac Pilot', 'RTM-SDRF-KMP-401', 'team-kamrup-sdrf-1', 'SDRF Quick Response Alpha — Kamrup', 'on-duty')
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: HIGHWAY CORRIDORS (ROUTES)
-- ------------------------------------------------------------------------------
INSERT INTO routes (id, route_name, highway_number, state_id, district_id, start_location, end_location, length_km, accessibility_status, risk_level, latitude, longitude, road_condition) VALUES
('route-nh27-jalukbari', 'East-West Corridor Axis (Jalukbari - Nalbari)', 'NH-27', 'Assam', 'dist-kamrup', 'Jalukbari, Guwahati', 'Nalbari Bypass', 64.5, 'open', 'low', 26.155, 91.662, 'Four-lane expressway open. Clear visibility.'),
('route-nh106-shillong', 'Guwahati - Shillong Scenic Highway', 'NH-106', 'Meghalaya', 'dist-ekh', 'Jorabat Junction', 'Mawlai, Shillong', 98.2, 'restricted', 'medium', 25.820, 91.880, 'Single-lane movement active near Umiam due to rockfall.'),
('route-nh06-silchar', 'Shillong - Jowai - Silchar Lifeline', 'NH-06', 'Assam', 'dist-cachar', 'Jowai Bypass', 'Silchar Depot', 186.0, 'blocked', 'critical', 25.180, 92.360, 'Major debris flow over Sonapur Tunnel approach.'),
('route-nh29-dimapur', 'Dimapur - Kohima Hill Highway', 'NH-29', 'Nagaland', 'dist-kohima', 'Dimapur Rly Station', 'Kohima Garrison', 74.0, 'warning', 'high', 25.750, 93.850, 'Cracks detected near Paglapahar cutting. Heavy convoys diverted.'),
('route-nh102-moreh', 'Imphal - Moreh Border Highway', 'NH-102', 'Manipur', 'dist-imphal-west', 'Imphal Central Gate', 'Moreh ICP Border', 109.0, 'open', 'low', 24.620, 94.180, 'All checkpoints normal. Border logistics moving.')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: SAMPLE INCIDENTS
-- ------------------------------------------------------------------------------
INSERT INTO incidents (
    id, incident_id, title, description, incident_type, severity, status,
    state_id, district_id, location_name, latitude, longitude, road_name,
    highway_number, reported_by, verified_by, assigned_rescue_team,
    estimated_impact, estimated_clearance, recommended_action
) VALUES
(
    'inc-001', 'INC-NE-341', 'Major Landslide & Rockfall Blockage',
    'Massive debris flow estimated at 2,400 metric tons spanning across both lanes following 48 hours of torrential rains.',
    'landslide', 'critical', 'active',
    'Assam', 'dist-cachar', 'Sonapur Tunnel Approach, NH-06',
    25.180, 92.360, 'Shillong-Silchar Lifeline', 'NH-06',
    'Assam Highway Patrol Unit 4', 'Smt. Ananya Saikia (ASDMA)', 'SDRF Quick Response Alpha — Kamrup',
    '18 Essential Supply Convoys halted in corridor', '6 to 8 hours for single-lane passage',
    'Divert light transport through Badarpur-Hailakandi alternate route. Mobilize 3 heavy excavators.'
),
(
    'inc-002', 'INC-NE-342', 'Flash Flood Road Submergence (1.2m)',
    'Water overflow from Brahmaputra tributary submerging 400m stretch. Strong current making movement hazardous.',
    'flood', 'high', 'in-progress',
    'Assam', 'dist-kamrup', 'Hajo Road Milepost 18',
    26.240, 91.520, 'Hajo-Barpeta Highway', 'SH-04',
    'Insp. Tarun Kalita', 'Dr. B. K. Sarma (Kamrup DDMA)', 'SDRF Quick Response Alpha — Kamrup',
    'Inter-district essential supplies halted', 'Dependent on river level drop (~4 hours)',
    'Deploy inflatable zodiac boats for emergency rations transfer.'
),
(
    'inc-003', 'INC-NE-343', 'Overturned Fuel Tanker Hazmat Incident',
    'Diesel transport trailer skidded on hairpin bend. Minor leak detected. Foam fire tender deployed as precaution.',
    'breakdown', 'medium', 'clearing',
    'Meghalaya', 'dist-ekh', 'Umiam Lake Hairpin Curve',
    25.660, 91.890, 'Guwahati-Shillong Highway', 'NH-106',
    'Meghalaya Traffic Police', 'Shri P. T. Sangma (SEOC)', 'Meghalaya Mountain Rescue Unit — Shillong',
    'Single-lane queue moving slowly', '1.5 hours remaining',
    'Apply sand spill absorbents. Crane in position to right tanker.'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: SAMPLE FLEET VEHICLES
-- ------------------------------------------------------------------------------
INSERT INTO vehicles (
    id, vehicle_id, vehicle_number, callsign, vehicle_type, driver_name,
    driver_phone, current_latitude, current_longitude, current_location_name,
    status, cargo_type, cargo_weight, origin, destination, eta, speed_kmh, delay_minutes
) VALUES
('veh-101', 'NER-1021', 'AS-01-GC-4412', 'VIPER-01', 'Heavy Multi-Axle Convoy', 'Pradip Deka', '+91 98640-11223', 26.155, 91.662, 'Jalukbari Bypass Corridor', 'Moving', 'Medical Oxygen Cylinders', '12.4 MT', 'Guwahati Central Depot', 'Silchar Medical College', '4h 15m', 52, 0),
('veh-102', 'NER-1022', 'ML-05-D-8891', 'FALCON-03', 'Refrigerated Pharma Van', 'Meban Shanpru', '+91 98560-44556', 25.180, 92.360, 'Sonapur Holding Staging Bay', 'Delayed', 'Pediatric Vaccines & IV Ringer', '4.2 MT', 'Shillong Base Depot', 'Agartala Civil Hospital', 'Delayed +4h', 0, 185),
('veh-103', 'NER-1023', 'AS-01-EE-9902', 'RHINO-09', 'Heavy Logistics Carrier', 'Biren Das', '+91 98642-77889', 25.750, 93.850, 'Dimapur Cargo Holding Bay', 'Moving', 'FCI High-Grade Parboiled Rice', '24.0 MT', 'Guwahati Buffer Godown', 'Kohima Food Distribution Hub', '2h 45m', 48, 15)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- SEED DATA: SAMPLE SHIPMENTS
-- ------------------------------------------------------------------------------
INSERT INTO shipments (
    id, shipment_id, commodity, quantity, unit, origin, destination,
    origin_state, destination_state, vehicle_label, priority, status, eta, delay, risk, current_location
) VALUES
('shp-401', 'SHP-NER-4011', 'Medical Oxygen & Critical ICU Gas', '180 Cylinders', 'Cylinders', 'Guwahati Medical Depot', 'Silchar Medical College', 'Assam', 'Assam', 'AS-01-GC-4412', 'Critical', 'In Transit', '4 hours', 'No Delay', 'Low', 'NH-27 Highway Mile 42'),
('shp-402', 'SHP-NER-4012', 'WHO Essential Emergency Trauma Kits', '650 Kits', 'Kits', 'Shillong SEOC Depot', 'Aizawl District Hospital', 'Meghalaya', 'Mizoram', 'ML-05-D-8891', 'Emergency', 'Delayed', '+5 hours', '+2h 45m', 'High', 'Sonapur Landslide Staging Yard'),
('shp-403', 'SHP-NER-4013', 'FCI Food Grain (Fortified Rice)', '32 Metric Tons', 'MT', 'Guwahati Buffer Hub', 'Imphal Central Ration Depot', 'Assam', 'Manipur', 'AS-01-EE-9902', 'Standard', 'In Transit', '6.5 hours', 'No Delay', 'Low', 'NH-29 Nagaland Border')
ON CONFLICT (id) DO NOTHING;
