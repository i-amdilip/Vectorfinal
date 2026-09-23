-- ==============================================================================
-- VECTOR — Seed Data for Supabase
-- 8 North Eastern States, Districts, Departments, Routes, Incidents,
-- Vehicles, Shipments, Alerts, Rescue Teams and Initial Users
-- ==============================================================================

-- 1. SEED STATES (8 North Eastern States)
INSERT INTO states (id, name, code) VALUES
('Assam', 'Assam', 'AS'),
('Arunachal Pradesh', 'Arunachal Pradesh', 'AR'),
('Manipur', 'Manipur', 'MN'),
('Meghalaya', 'Meghalaya', 'ML'),
('Mizoram', 'Mizoram', 'MZ'),
('Nagaland', 'Nagaland', 'NL'),
('Sikkim', 'Sikkim', 'SK'),
('Tripura', 'Tripura', 'TR')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED KEY DISTRICTS
INSERT INTO districts (id, state_id, name, code) VALUES
('dist-kamrup', 'Assam', 'Kamrup', 'KMP'),
('dist-dhemaji', 'Assam', 'Dhemaji', 'DHJ'),
('dist-cachar', 'Assam', 'Cachar', 'CCH'),
('dist-sonitpur', 'Assam', 'Sonitpur', 'SON'),
('dist-dibrugarh', 'Assam', 'Dibrugarh', 'DIB'),
('dist-ekh', 'Meghalaya', 'East Khasi Hills', 'EKH'),
('dist-ribhoi', 'Meghalaya', 'Ri-Bhoi', 'RIB'),
('dist-kohima', 'Nagaland', 'Kohima', 'KOH'),
('dist-dimapur', 'Nagaland', 'Dimapur', 'DMR'),
('dist-imphal-west', 'Manipur', 'Imphal West', 'IW'),
('dist-noney', 'Manipur', 'Noney', 'NNY'),
('dist-pakyong', 'Sikkim', 'Pakyong', 'PKY'),
('dist-gangtok', 'Sikkim', 'Gangtok', 'GTK'),
('dist-mangan', 'Sikkim', 'Mangan', 'MGN'),
('dist-papumpare', 'Arunachal Pradesh', 'Papum Pare', 'PPP'),
('dist-tawang', 'Arunachal Pradesh', 'Tawang', 'TWN'),
('dist-aizawl', 'Mizoram', 'Aizawl', 'AZL'),
('dist-west-tripura', 'Tripura', 'West Tripura', 'WTR')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED DEPARTMENTS
INSERT INTO departments (id, name, type, state_id, district_id, contact) VALUES
('dept-ndrf', 'National Disaster Response Force (1st Bn NDRF)', 'Rescue', 'Assam', 'dist-kamrup', '+91 361-2840284'),
('dept-asdma', 'Assam State Disaster Management Authority', 'Disaster Management', 'Assam', 'dist-kamrup', '1070 / 1079'),
('dept-sdrf-assam', 'State Disaster Response Force (SDRF Assam)', 'Rescue', 'Assam', 'dist-kamrup', '+91 361-2550101'),
('dept-pwd-assam', 'PWD Highway Division (Kamrup Rural)', 'Transport', 'Assam', 'dist-kamrup', '+91 361-2260512'),
('dept-megh-seoc', 'Meghalaya State Emergency Operations Centre', 'Disaster Management', 'Meghalaya', 'dist-ekh', '1070'),
('dept-bro-swastik', 'Project Swastik (Border Roads Organisation)', 'Logistics', 'Sikkim', 'dist-gangtok', '+91 3592-202203'),
('dept-nsdma', 'Nagaland State Disaster Management Authority', 'Disaster Management', 'Nagaland', 'dist-kohima', '1070')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED RESCUE TEAMS
INSERT INTO rescue_teams (id, name, state_id, district_id, specialization, lead_officer_name, lead_officer_contact, contact_radio, member_count, status, base_location) VALUES
('team-kamrup-sdrf-1', 'SDRF Quick Response Alpha — Kamrup', 'Assam', 'dist-kamrup', 'Flood & Water Rescue', 'Insp. Tarun Kalita', '+91 98642-19830', 'VHF 156.800 MHz (DEOC Kamrup Ch 12)', 8, 'deployed', 'SDRF Staging Base, Jalukbari, Guwahati'),
('team-kamrup-ndrf-1', 'NDRF Heavy Rescue Detachment — Kamrup', 'Assam', 'dist-kamrup', 'Urban Search & Heavy Extrication', 'Insp. S. K. Yadav', '+91 94355-66778', 'HF 7340 kHz / Satellite Iridium 442', 12, 'standby', 'NDRF 1st Bn Base Camp, Patgaon, Rani, Kamrup'),
('team-ekh-civil-defence', 'Civil Defence Mountain SAR Unit — East Khasi Hills', 'Meghalaya', 'dist-ekh', 'High-Angle Rope & Mountain Rescue', 'Cpl. Damein Shylla', '+91 98562-44119', 'VHF 142.225 MHz', 6, 'standby', 'Civil Defence Complex, Mawdiangdiang, Shillong'),
('team-sikkim-sdrf', 'SSDRF Hill Rescue Team Pakyong', 'Sikkim', 'dist-pakyong', 'Landslide Excavation & Mud Clearance', 'Maj. P. K. Gurung', '+91 98320-44912', 'VHF 161.450 MHz', 10, 'deployed', 'BRO Sector Staging Camp, Singtam')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED PROFILES (Users matching all 5 roles)
INSERT INTO profiles (id, full_name, email, phone, role, state_id, district_id, department, designation, badge_id, status) VALUES
('00000000-0000-0000-0000-000000000001', 'Col. R. Bhattacharya', 'superadmin@vector.gov.in', '+91 94350-11201', 'super_admin', 'Assam', 'dist-kamrup', 'HQ Integrated Defense & Disaster Logistics (NER)', 'Director Operations • North Eastern Command', 'SA-NER-001', 'active'),
('00000000-0000-0000-0000-000000000002', 'Smt. Ananya Saikia, IAS', 'assam.admin@vector.gov.in', '+91 94350-88412', 'state_admin', 'Assam', 'dist-kamrup', 'Assam State Disaster Management Authority (ASDMA)', 'State Relief Commissioner & Special Secretary', 'STA-ASM-101', 'active'),
('00000000-0000-0000-0000-000000000003', 'Shri P. T. Sangma, MCS', 'meghalaya.admin@vector.gov.in', '+91 94361-02394', 'state_admin', 'Meghalaya', 'dist-ekh', 'Meghalaya State Emergency Operations Centre (SEOC)', 'Joint Secretary & State Operations Chief', 'STA-MEG-102', 'active'),
('00000000-0000-0000-0000-000000000004', 'Dr. B. K. Sarma, ACS', 'kamrup.admin@vector.gov.in', '+91 98640-22190', 'district_admin', 'Assam', 'dist-kamrup', 'District Emergency Operations Centre (DEOC) Kamrup', 'Additional Deputy Commissioner (ADC Disaster Mgmt)', 'DA-ASM-KMP-201', 'active'),
('00000000-0000-0000-0000-000000000005', 'Insp. Tarun Kalita', 'field.officer@vector.gov.in', '+91 98642-19830', 'field_officer', 'Assam', 'dist-kamrup', 'Assam Police Highway Patrol Command', 'Sector Incident Commander (Kamrup)', 'FO-ASM-KMP-301', 'active'),
('00000000-0000-0000-0000-000000000006', 'Hav. Jadu Das', 'rescue.team@vector.gov.in', '+91 98649-11234', 'rescue_team_member', 'Assam', 'dist-kamrup', 'State Disaster Response Force (SDRF Assam)', 'Senior Diver & Motorized Zodiac Pilot', 'RTM-SDRF-KMP-401', 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED ROUTES
INSERT INTO routes (id, route_name, highway_number, state_id, district_id, start_location, end_location, length_km, accessibility_status, risk_level, latitude, longitude, road_condition, condition_details, detour_route, affected_convoys) VALUES
('road-nh-10-sikkim', 'NH-10: Singtam–20th Mile Active Obstruction', 'NH-10', 'Sikkim', 'dist-pakyong', 'Melli / Rangpo Gateway', 'Singtam / Dikchu', 35, 'blocked', 'critical', 27.233, 88.516, 'Severe Flash Mudflow', 'ROAD BLOCKED: 3,200 cu.m mudflow from slope failure at Km 18.4.', 'Lava–Algarah–Reshi Route', 31),
('road-nh-29-blocked', 'NH-29: Paglapahar Landslide Zone (Km 42)', 'NH-29', 'Nagaland', 'dist-dimapur', 'Chumoukedima', 'Medziphema Bypass', 23, 'blocked', 'high', 25.730, 93.850, 'Major Hill Collapse', 'ROAD BLOCKED: 4,000 cu.m rock & mud debris at Paglapahar Km 42.', 'Old Medziphema Hill Cart Road', 28),
('road-nh-6-shillong', 'NH-6: Umiam–Shillong Plateau Section', 'NH-6', 'Meghalaya', 'dist-ribhoi', 'Nongpoh', 'Shillong', 48, 'restricted', 'medium', 25.650, 91.900, 'Dense Monsoon Fog / Vibration Alert', 'WARNING / RESTRICTED: Speed cap 30 km/h due to dense fog & sensor alert at Umiam bridge.', 'Mawdiangdiang Township Bypass', 44),
('road-nh-27-guwahati', 'NH-27: Guwahati–Nagaon 4-Lane Expressway', 'NH-27', 'Assam', 'dist-kamrup', 'Guwahati', 'Nagaon Bypass', 125, 'open', 'low', 26.150, 91.800, 'Clear & Dry', 'CLEAR & SAFE: 4-lane East-West Corridor operating with full transit capacity.', NULL, 0),
('road-nh-37-kaziranga', 'NH-37: Kaliabor–Bokakhat Wildlife Corridor', 'NH-37', 'Assam', 'dist-sonitpur', 'Tezpur / Kaliabor', 'Bokakhat', 75, 'restricted', 'medium', 26.580, 93.170, 'High River Basin Humidity', 'WARNING: High water table along Brahmaputra basin. Mandatory 40 km/h limit.', NULL, 112),
('road-nh-15-west', 'NH-15: Baihata Chariali–Mangaldai–Tezpur', 'NH-15', 'Assam', 'dist-kamrup', 'Baihata Chariali', 'Tezpur', 145, 'open', 'low', 26.350, 91.750, 'Partly Cloudy', 'CLEAR & SAFE: Vital northern bank artery serving logistics.', NULL, 0),
('road-nh-102-restricted', 'NH-102: Thoubal–Tengnoupal–Moreh Border', 'NH-102', 'Manipur', 'dist-noney', 'Thoubal', 'Moreh Border', 72, 'restricted', 'medium', 24.300, 94.100, 'Heavy Mountain Mist / Rain', 'RESTRICTED: Escorted convoy movement only due to ongoing culvert repairs.', 'Old Cachar Road', 19)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED INCIDENTS
INSERT INTO incidents (id, incident_id, title, description, incident_type, severity, status, state_id, district_id, location_name, latitude, longitude, road_name, highway_number, reported_by, verified_by, assigned_field_officer, assigned_rescue_team, recommended_action, dispatched_teams, affected_vehicles, estimated_clearance, coordinates) VALUES
('inc-sikkim-01', 'INC-NE-341', 'Landslide — NH-10 — Sikkim', 'Continuous torrential rains triggered a 3,200 cu.m rock and mud debris flow over NH-10 at Km 18.4, severing access between Siliguri and Gangtok.', 'landslide', 'critical', 'in-progress', 'Sikkim', 'dist-pakyong', 'NH-10 Km 18 (Sevoke–Singtam Corridor)', 27.233, 88.516, 'NH-10 Km 18', 'NH-10', 'Project Swastik (BRO)', 'Col. R. Bhattacharya', 'Col. R. Bhattacharya', 'SSDRF Hill Rescue Team Pakyong', 'Deploy twin tracked heavy excavators to clear boulder breach at Km 18.2; re-route light vehicles via Melli.', '["BRO Task Force 33", "Sikkim SDRF"]'::jsonb, 34, '15:00 IST (~4.5 hrs)', '[95, 195]'::jsonb),
('inc-kamrup-01', 'INC-ASM-KMP-101', 'Saraighat Bridge Expansion Joint Heave', 'Piezo-seismic bridge sensors recorded excessive expansion joint heave during heavy convoy transit. Northbound traffic throttled to 1 alternating lane.', 'structural', 'critical', 'in-progress', 'Assam', 'dist-kamrup', 'Saraighat Bridge (NH-27 / Brahmaputra Crossing)', 26.183, 91.683, 'NH-27 Km 12 (Saraighat Crossing)', 'NH-27', 'Kamrup DEOC Control Room', 'Dr. B. K. Sarma', 'Insp. Tarun Kalita', 'SDRF Quick Response Alpha — Kamrup', 'District Admin to order heavy freight holding at Jalukbari Rotary; deploy SDRF Zodiacs on standby.', '["SDRF Quick Response Alpha — Kamrup", "Kamrup Highway Police Patrol"]'::jsonb, 52, '14:00 IST (~3.5 hrs)', '[331, 221]'::jsonb),
('inc-dhemaji-02', 'INC-NE-352', 'Flooding — Dhemaji — Assam', 'Jiadhal river flash surge overtopped embankment culvert #7, causing 0.85m water logging across 240m of highway carriageway.', 'flood', 'high', 'active', 'Assam', 'dist-dhemaji', 'NH-515 Km 34 (Dhemaji Bypass)', 27.483, 94.583, 'NH-515 Km 34', 'NH-515', 'Dhemaji DDMA', 'Smti. Runu Borah', 'Sub-Insp. Manab Gogoi', 'SDRF Dhemaji Rescue Unit', 'Position emergency sandbag revetment; suspend civilian movement and restrict transit strictly to emergency convoys.', '["SDRF Dhemaji Unit 3", "Assam Police"]'::jsonb, 21, 'Pending water subsidence (~3 hrs)', '[560, 150]'::jsonb),
('inc-manipur-03', 'INC-NE-365', 'Road Damage — Manipur', 'Heavy freight axle stress caused 45m asphalt pavement subsidence and culvert fissure along steep valley curve.', 'road_damage', 'medium', 'active', 'Manipur', 'dist-noney', 'NH-37 Km 78 (Imphal–Jiribam Lifeline)', 24.810, 93.650, 'NH-37 Km 78', 'NH-37', 'Manipur PWD National Highway Wing', 'Er. Tomba Singh', 'Insp. L. Tombing', 'Manipur Police Traffic Unit', 'Speed cap 20 km/h; steel road plating to be laid over fissure zone by PWD rapid repair team.', '["PWD Rapid Repair Gang 04", "Manipur Police"]'::jsonb, 17, '18:00 IST (~8 hrs)', '[510, 360]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 8. SEED VEHICLES
INSERT INTO vehicles (id, vehicle_id, vehicle_number, callsign, vehicle_type, driver_name, driver_phone, current_latitude, current_longitude, current_location_name, current_route_id, status, cargo_type, cargo_weight, cargo_details, origin, destination, eta, speed_kmh, delay_minutes, coordinates, state_id) VALUES
('NER-1023', 'NER-1023', 'AS-01-GC-4412', 'MED-SUPPLY-01', 'Refrigerated Medical Truck', 'Hav. K. Thapa', '+91 94350-29182', 24.810, 93.650, 'NH-37 Sector 4, Noney', 'road-nh-102-restricted', 'moving', 'Medicines', '4.2 Tonnes', 'Pediatric ICU kits, Insulin vials & Anti-venom', 'Guwahati Central Depot', 'Imphal Central Hospital', 'ETA 4h 20m', 52, 0, '[520, 360]'::jsonb, 'Manipur'),
('NER-2045', 'NER-2045', 'WB-73-E-8821', 'FCI-GRAIN-08', 'Heavy Multi-Axle Carrier', 'R. K. Chettri', '+91 98320-11492', 27.233, 88.516, 'NH-10 Km 18, Singtam', 'road-nh-10-sikkim', 'delayed', 'Food', '18 Metric Tonnes', 'Fortified Rice & Essential Pulses', 'Guwahati Central Silo', 'Gangtok Food Reserve', 'ETA 6h 10m', 0, 105, '[95, 195]'::jsonb, 'Sikkim'),
('NER-3180', 'NER-3180', 'ML-05-D-2109', 'AGRI-EXP-12', 'Insulated Container Truck', 'T. Nongrum', '+91 97740-58201', 25.650, 91.900, 'Umiam Bypass, Ri-Bhoi', 'road-nh-6-shillong', 'moving', 'Agricultural Produce', '8.5 Tonnes', 'Organic High-Value Produce & Greens', 'Tezpur Agro Hub', 'Shillong Wholesale Market', 'ETA 2h 50m', 44, 0, '[250, 310]'::jsonb, 'Meghalaya'),
('NER-1108', 'NER-1108', 'AS-11-BC-6701', 'PWD-REBAR-04', 'Heavy Flatbed Hauler', 'B. Hojai', '+91 94012-77319', 25.100, 93.000, 'Lumding-Silchar Hill Cut Km 52', 'road-nh-27-guwahati', 'at-risk', 'Construction Materials', '24 Tonnes', 'High-Tensile TMT Steel Rebars', 'Silchar Supply Yard', 'Haflong Bridge Site', 'ETA 3h 15m', 14, 130, '[425, 335]'::jsonb, 'Assam')
ON CONFLICT (id) DO NOTHING;

-- 9. SEED SHIPMENTS
INSERT INTO shipments (id, shipment_id, commodity, quantity, unit, origin, destination, origin_state, origin_district, destination_state, destination_district, vehicle_id, vehicle_label, priority, status, eta) VALUES
('SHP-NER-4011', 'SHP-NER-4011', 'Medicines', '1,200 Units', 'Cold-Chain Kits', 'Guwahati Central Depot', 'Imphal Central Hospital', 'Assam', 'Kamrup', 'Manipur', 'Imphal West', 'NER-1023', 'NER-1023 (MED-SUPPLY-01)', 'emergency', 'in_transit', '4h 20m'),
('SHP-NER-4012', 'SHP-NER-4012', 'Food', '18 Tonnes', 'Bags', 'Guwahati Central Silo', 'Gangtok Food Reserve', 'Assam', 'Kamrup', 'Sikkim', 'Pakyong', 'NER-2045', 'NER-2045 (FCI-GRAIN-08)', 'high', 'delayed', '6h 10m'),
('SHP-NER-4013', 'SHP-NER-4013', 'Agricultural Produce', '8.5 Tonnes', 'Crates', 'Tezpur Agro Hub', 'Shillong Wholesale', 'Assam', 'Sonitpur', 'Meghalaya', 'East Khasi Hills', 'NER-3180', 'NER-3180 (AGRI-EXP-12)', 'standard', 'in_transit', '2h 50m'),
('SHP-NER-4014', 'SHP-NER-4014', 'Construction Materials', '24 Tonnes', 'Metric Tonnes', 'Silchar Supply Yard', 'Haflong Bridge Site', 'Assam', 'Cachar', 'Assam', 'Dima Hasao', 'NER-1108', 'NER-1108 (PWD-REBAR-04)', 'high', 'delayed', '3h 15m')
ON CONFLICT (id) DO NOTHING;

-- 10. SEED ALERTS
INSERT INTO alerts (id, code, title, message, alert_type, severity, incident_id, route_id, state_id, district_id, location, impacted_asset, action_required, is_read, acknowledged) VALUES
('alt-01', 'ALT-NE-881', 'Major Landslide Blockage — NH-10 Singtam 20th Mile', '3,200 cu.m rock & mud debris flow severed NH-10 carriageway. Convoys stranded.', 'landslide', 'critical', 'inc-sikkim-01', 'road-nh-10-sikkim', 'Sikkim', 'dist-pakyong', 'NH-10 Km 18, Singtam (Sikkim)', 'NH-10 Highway Corridor', 'Divert freight through Lava–Reshi route; mobilize BRO loaders.', false, false),
('alt-02', 'ALT-NE-882', 'Saraighat Bridge Heave Warning — NH-27', 'Structural piezo sensors recorded anomalous vibration & heave at pier 3.', 'structural', 'critical', 'inc-kamrup-01', 'road-nh-27-guwahati', 'Assam', 'dist-kamrup', 'Saraighat Bridge, Kamrup (Assam)', 'Saraighat Brahmaputra Bridge', 'Order heavy vehicle holding at Jalukbari; inspect expansion joint.', false, false),
('alt-03', 'ALT-NE-883', 'Flash Inundation — NH-515 Dhemaji', 'Jiadhal river surge overtopped embankment with 0.85m water across highway.', 'flood', 'high', 'inc-dhemaji-02', NULL, 'Assam', 'dist-dhemaji', 'NH-515 Km 34, Dhemaji (Assam)', 'NH-515 Freight Artery', 'Halt light vehicular traffic; guide emergency medical convoys with pilots.', false, false)
ON CONFLICT (id) DO NOTHING;

-- 11. SEED FIELD REPORTS
INSERT INTO field_reports (id, incident_id, submitted_by, reporter_agency, report_type, description, latitude, longitude, gps_coordinates, location_name, state_id, district_id, road_condition, accessibility_status, verification_status) VALUES
('rep-fld-01', 'inc-sikkim-01', 'Insp. Sonam Lepcha', 'Sikkim Highway Police (Pakyong Unit)', 'Landslide', 'Ground recon confirms 65-meter longitudinal hillside slip covering both carriageways. 2 heavy trucks partially trapped.', 27.233, 88.516, '27°14''N, 88°31''E', 'NH-10 Km 18.4 Singtam', 'Sikkim', 'dist-pakyong', 'Debris Covered', 'Blocked', 'verified'),
('rep-fld-02', 'inc-kamrup-01', 'Insp. Tarun Kalita', 'Assam Highway Patrol Command', 'Structural', 'Inspected pier 3 expansion joint with PWD structural team. Visual gap deformation observed. Recommended immediate freight holding.', 26.183, 91.683, '26°11''N, 91°41''E', 'Saraighat Bridge Pier 3', 'Assam', 'dist-kamrup', 'Restricted 1-Lane', 'Restricted', 'verified')
ON CONFLICT (id) DO NOTHING;
