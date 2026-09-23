/**
 * VECTOR - Vehicle & Emergency Connectivity for Transport Operations & Routing
 * Command Dashboard Types
 */

export type SeverityLevel = 'critical' | 'high' | 'warning' | 'medium' | 'info';

export type RoadStatus = 'major' | 'blocked' | 'restricted' | 'open' | 'clear' | 'warning';

export type RoadConditionStatus = 'clear' | 'warning' | 'blocked';
export type EnvironmentRiskLevel = 'low' | 'medium' | 'high';
export type TrafficLevel = 'low' | 'medium' | 'high';

export type IncidentCategory =
  | 'landslide'
  | 'flood'
  | 'structural'
  | 'breakdown'
  | 'weather'
  | 'road_damage'
  | 'bridge_restriction';

export type CargoCategory = 'medical' | 'food' | 'fuel' | 'rescue' | 'relief';

export interface RoadSegment {
  id: string;
  name: string;
  routeNumber: string; // e.g., 'NH-29'
  status: RoadStatus;
  // Environment-based status model
  conditionStatus?: RoadConditionStatus;
  environmentRisk?: EnvironmentRiskLevel;
  trafficLevel?: TrafficLevel;
  weatherCondition?: string;
  state?: string;
  from: string;
  to: string;
  lengthKm: number;
  points: [number, number][]; // Scaled map coordinates [x, y]
  conditionDetails: string;
  detourRoute?: string;
  affectedConvoys: number;
  lastUpdated: string;
  blockedLocation?: [number, number]; // [lng, lat] geographic location of closure
  blockedReason?: string;
}

export interface IncidentMarker {
  id: string;
  code: string; // e.g. 'INC-NE-294'
  title: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  roadName: string;
  district: string;
  state: string;
  coordinates: [number, number]; // [x, y] on GIS map
  latLng: string;
  timestamp: string;
  reportedBy: string;
  status: 'active' | 'in-progress' | 'clearing' | 'resolved';
  description: string;
  dispatchedTeams: string[];
  estimatedClearance: string;
  affectedVehicles: number;
  // Detail Drawer & Incident Management attributes
  verificationStatus?: 'verified' | 'pending' | 'flagged';
  assignedOfficer?: string;
  assignedOfficerRole?: string;
  recommendedAction?: string;
  photoUrl?: string;
  photoCaption?: string;
}

export interface VehicleMarker {
  id: string;
  callsign: string; // e.g. 'MED-CONVOY-09'
  cargo: CargoCategory;
  cargoDescription: string;
  priority: 'emergency' | 'high' | 'standard';
  driver: string;
  origin: string;
  destination: string;
  status: 'moving' | 'delayed' | 'rerouting' | 'halted';
  currentSpeedKmH: number;
  eta: string;
  coordinates: [number, number];
  assignedHighway: string;
  delayMinutes?: number;
  telemetry: {
    batteryTemp: string;
    fuelLevel: number;
    satcomLink: 'SECURE' | 'DEGRADED' | 'STANDBY';
  };
}

export interface RiskZone {
  id: string;
  name: string;
  type: 'landslide' | 'flood' | 'seismic' | 'monsoon';
  riskScore: number; // 0 - 100
  level: 'extreme' | 'high' | 'moderate';
  polygon: [number, number][];
  affectedDistricts: string[];
  advisoryText: string;
  sensorTrigger: string;
}

export interface PriorityAlert {
  id: string;
  code: string;
  title: string;
  severity: SeverityLevel;
  category: string;
  location: string;
  timestamp: string;
  impactedAsset: string;
  actionRequired: string;
  targetIncidentId?: string;
  acknowledged: boolean;
}

export interface DistrictConnectivity {
  id: string;
  district: string;
  state: string;
  percentage: number;
  status: 'optimal' | 'moderate' | 'restricted' | 'critical';
  openRoutes: number;
  totalRoutes: number;
  activeDetours: number;
  weatherCondition: string;
}

export interface AIRiskOutlook {
  id: string;
  code: string;
  title: string;
  probability: number; // e.g. 89%
  timeHorizon: string; // e.g. 'Within 4 hours'
  riskFactor: string;
  impactAssessment: string;
  preemptiveMitigation: string;
  severity: 'critical' | 'high' | 'warning';
  dataSource: string;
}

export interface BridgeMarker {
  id: string;
  name: string;
  river: string;
  state: string;
  district: string;
  routeNumber: string;
  status: 'open' | 'restricted' | 'critical' | 'blocked';
  coordinates: [number, number];
  lengthMeters: number;
  lengthM?: number;
  riverCrossing?: string;
  details?: string;
  conditionDetails: string;
  structuralHealthScore: number; // 0-100
}

export interface LiveEventItem {
  id: string;
  location: string;
  district: string;
  state: string;
  eventType: string; // e.g., 'Road Blockage', 'Flash Flood', 'Bridge Vibration', 'Convoy Transit'
  severity: SeverityLevel;
  time: string; // e.g. '8 min ago'
  incidentId?: string;
  riskScore?: number;
  status?: string;
  lastUpdate?: string;
  details?: string;
}

export interface MapLayerState {
  roads: boolean;
  bridges: boolean;
  districtBoundaries: boolean;
  vehicles: boolean;
  incidents: boolean;
  landslideZones: boolean;
  floodZones: boolean;
  weatherRisk: boolean;
  // Backward compatibility
  majorRoads?: boolean;
  blockedRoads?: boolean;
  restrictedRoads?: boolean;
  riskZones?: boolean;
}

export type FleetVehicleStatus = 'moving' | 'delayed' | 'at-risk';

export interface FleetVehicle {
  id: string; // e.g., 'NER-1023'
  callsign?: string;
  cargo: string; // e.g., 'Medicines', 'Food', 'Agricultural Produce', 'Construction Materials'
  cargoDetails?: string;
  origin: string; // e.g., 'Guwahati'
  destination: string; // e.g., 'Imphal'
  eta: string; // e.g., 'ETA 4h 20m'
  status: FleetVehicleStatus; // moving (Green), delayed (Amber), at-risk (Red)
  statusLabel: 'On Route' | 'Delayed' | 'At Risk';
  currentLocation: string; // e.g., 'NH-37 Sector 4, Noney'
  route: string; // e.g., 'Guwahati → Nagaon → Dimapur → Imphal'
  speed: string; // e.g., '52 km/h'
  delay: string; // e.g., 'None (On Schedule)' or '+1h 45m'
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  riskDetails?: string;
  lastGpsUpdate: string; // e.g., '25s ago'
  coordinates: [number, number]; // [x, y] coordinates in 800x500 map space
  driverName?: string;
  driverPhone?: string;
  state?: string;
}

export type ShipmentStatus = 'Dispatched' | 'In Transit' | 'Delayed' | 'Delivered';
export type ShipmentPriority = 'Critical' | 'High' | 'Standard';

export interface ShipmentItem {
  id: string; // e.g., 'SHP-NER-4011'
  commodity: 'Medicines' | 'Food' | 'Agricultural Produce' | 'Construction Materials' | 'Fuel & POL';
  quantity: string; // e.g., '1,200 Cold-Chain Units', '36 Metric Tonnes'
  origin: string; // e.g., 'Guwahati Central Depot'
  originState: string;
  destination: string; // e.g., 'Imphal Central Hospital'
  destinationDistrict: string;
  destinationState: string;
  vehicle: string; // e.g., 'NER-1023'
  eta: string; // e.g., 'Today, 15:40 IST (4h 20m)'
  delay: string; // e.g., 'No Delay' or '+1h 45m'
  risk: 'Low' | 'Medium' | 'High';
  riskNote?: string;
  priority: ShipmentPriority;
  status: ShipmentStatus;
  currentLocation: string;
  dispatchDate?: string;
  consignee?: string;
}

// ----------------------------------------------------------------------
// AI Risk Intelligence Types
// ----------------------------------------------------------------------

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface AIRiskCorridor {
  id: string;
  corridorCode: string; // e.g. 'NH-10'
  corridorName: string;
  state: string;
  disruptionProbability: number; // e.g. 91, 63, 18
  expectedTimeframe: string; // e.g. 'Expected within 3 hours', 'Expected within 6 hours'
  primaryHazard: string; // e.g. 'Heavy rainfall + slope instability', 'Flood probability increasing'
  riskLevel: RiskLevel;
  confidenceScore: number; // e.g. 94%
  riskFactors: {
    rainfall: number; // 0-100 score/weight
    terrain: number;
    historical: number;
    roadCondition: number;
    traffic: number;
    floodProbability: number;
  };
  riskFactorDetails: {
    rainfallDetail: string;
    terrainDetail: string;
    historicalDetail: string;
    roadDetail: string;
    trafficDetail: string;
    floodDetail: string;
  };
  timeline: {
    now: number; // Disruption % at NOW
    plus3h: number; // at +3h
    plus6h: number; // at +6h
    plus12h: number; // at +12h
    plus24h: number; // at +24h
  };
  affectedConvoys: number;
  sensorInputs: string[];
  recommendedAction: string;
}

// ----------------------------------------------------------------------
// District Monitoring Types
// ----------------------------------------------------------------------

export interface DistrictMonitoringItem {
  id: string;
  district: string;
  state: string;
  connectivityScore: number; // 0 - 100
  connectivityStatus: 'optimal' | 'moderate' | 'restricted' | 'critical';
  openRoads: number;
  totalRoads: number;
  blockedRoadsCount: number;
  blockedRoads: string[];
  openRoadsList: string[];
  activeIncidentsCount: number;
  incidentDetails: Array<{
    id: string;
    title: string;
    severity: SeverityLevel;
    road: string;
    status: string;
  }>;
  supplyStatus: 'Stable' | 'Constrained' | 'Critical Shortage' | 'Replenishing';
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  activeVehiclesCount: number;
  vehiclesList: Array<{
    callsign: string;
    cargo: string;
    status: string;
    driver: string;
    eta: string;
  }>;
  supplyDeliveries: {
    medicines: string;
    foodGrains: string;
    fuelPOL: string;
    reliefSupplies: string;
  };
  weather: {
    condition: string;
    temp: string;
    rainfall24h: string;
    wind: string;
    warningAlert?: string;
  };
  riskForecast: string;
  mapCoordinates: [number, number];
}

// ----------------------------------------------------------------------
// Operational Alerts Types
// ----------------------------------------------------------------------

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'resolved';
export type AlertStatus = 'active' | 'acknowledged' | 'assigned' | 'resolved';

export interface OperationalAlertItem {
  id: string;
  code: string;
  severity: AlertSeverity;
  title: string;
  location: string;
  district?: string;
  state: string;
  description: string;
  time: string; // e.g. '8 minutes ago'
  timestamp: string; // e.g. '07 Sep 2026, 10:42 IST'
  status: AlertStatus;
  assignedTo?: string;
  assignedTeam?: string;
  targetRoad?: string;
  targetIncidentId?: string;
  coordinates?: [number, number];
  actionAdvised?: string;
}

// ----------------------------------------------------------------------
// Field Reports Types
// ----------------------------------------------------------------------

export type FieldReportType =
  | 'Landslide'
  | 'Flood'
  | 'Road Damage'
  | 'Bridge Damage'
  | 'Traffic'
  | 'Weather Condition';

export type FieldVerificationStatus = 'Pending' | 'Verified' | 'Rejected' | 'Pending Verification';
export type FieldReportLifecycle = 'Actionable' | 'Monitoring' | 'Closed' | 'Converted to Incident' | 'Under Review' | 'Dismissed';

export interface FieldReportItem {
  id: string; // e.g. 'FR-2026-089'
  location: string; // e.g. 'NH-10 Km 38, East Sikkim'
  district: string;
  state: string;
  type: FieldReportType;
  submittedBy: string; // e.g. 'Insp. T. Jamir'
  reporterDesignation: string; // e.g. 'Assistant Engineer'
  reporterAgency: string; // e.g. 'BRO Task Force 74'
  reporterContact: string; // e.g. '+91 98452-98122'
  time: string; // e.g. '8 minutes ago'
  timestamp: string; // e.g. '07 Sep 2026, 10:38 IST'
  verification: FieldVerificationStatus;
  status: FieldReportLifecycle;
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  gpsCoordinates: string; // e.g. '27.3389° N, 88.6065° E, Elev. 1,420m'
  coordinates: [number, number]; // map coordinate [x, y]
  description: string;
  photoUrl?: string;
  photoCaption?: string;
  linkedIncidentId?: string;
  resolutionNotes?: string;
}

// ----------------------------------------------------------------------
// Analytics Types
// ----------------------------------------------------------------------

export interface AnalyticsDisruptionData {
  date: string;
  disruptions: number;
  cleared: number;
  blockedKm: number;
}

export interface AnalyticsDelayData {
  corridor: string;
  avgDelayHours: number;
  normHours: number;
}

export interface AnalyticsDistrictScore {
  district: string;
  state: string;
  connectivity: number;
  blockedRoutes: number;
}

export interface AnalyticsCategoryData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface VulnerableCorridorItem {
  id: string;
  corridor: string;
  state: string;
  disruptions: number;
  averageDelay: string;
  risk: 'Critical' | 'High' | 'Moderate' | 'Low';
  trend: 'increasing' | 'stable' | 'decreasing';
  primaryCause: string;
  activeBlockages: number;
}

// ----------------------------------------------------------------------
// Settings Types
// ----------------------------------------------------------------------

export interface OfficerProfile {
  officerName: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  badgeId: string;
  commandJurisdiction: string;
}

export interface NotificationSettings {
  criticalIncidents: boolean;
  routeDisruptions: boolean;
  vehicleDelays: boolean;
  weatherAlerts: boolean;
  soundAlerts: boolean;
  satelliteDispatch: boolean;
}

export interface MapPreferenceSettings {
  defaultMapView: 'tactical' | 'satellite' | 'topographic' | 'minimal';
  defaultLayers: {
    roads: boolean;
    incidents: boolean;
    vehicles: boolean;
    bridges: boolean;
    weatherRadar: boolean;
    riskPolygons: boolean;
  };
}

export interface SystemStatusData {
  dataSynchronization: string;
  apiStatus: {
    nicGateway: 'operational' | 'degraded' | 'offline';
    imdWeatherFeed: 'operational' | 'degraded' | 'offline';
    morthVahan: 'operational' | 'degraded' | 'offline';
    isroBhuvan: 'operational' | 'degraded' | 'offline';
  };
  lastSystemUpdate: string;
  buildVersion: string;
  activeSessions: {
    id: string;
    device: string;
    ip: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }[];
}

export type AppTheme = 'white' | 'dark' | 'bone' | 'powder' | 'frost';

// ----------------------------------------------------------------------
// Role Hierarchy & RBAC Types
// ----------------------------------------------------------------------

export type UserRole =
  | 'super_admin'
  | 'state_admin'
  | 'district_admin'
  | 'field_officer'
  | 'rescue_team_member';

export const ROLE_HIERARCHY_LEVEL: Record<UserRole, number> = {
  super_admin: 5,
  state_admin: 4,
  district_admin: 3,
  field_officer: 2,
  rescue_team_member: 1,
};

export interface RoleDefinition {
  id: UserRole;
  label: string;
  rank: number;
  accessScope: string;
  manageableScope: string;
  description: string;
  badgeClass: string;
  accentColor: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin',
    rank: 5,
    accessScope: 'Entire system / all states & districts',
    manageableScope: 'All roles (State Admins, District Admins, Field Officers, Rescue Teams)',
    description: 'Full unconstrained system authority across all North Eastern states. Manages national policy, state administrators, and cross-border resource corridors.',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    accentColor: '#9333ea',
  },
  state_admin: {
    id: 'state_admin',
    label: 'State Admin',
    rank: 4,
    accessScope: 'Assigned state only',
    manageableScope: 'District Admins + lower-level roles within assigned state',
    description: 'Statewide command. Creates and governs District Admins, oversees state logistics, and manages district jurisdictions within their state.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    accentColor: '#2563eb',
  },
  district_admin: {
    id: 'district_admin',
    label: 'District Admin',
    rank: 3,
    accessScope: 'Assigned district only',
    manageableScope: 'Field Officers + Rescue Teams & Members within assigned district',
    description: 'Field operations commander. Creates Field Officers, establishes Rescue Teams, adds/removes team members, assigns units to incidents, and governs district routes.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentColor: '#059669',
  },
  field_officer: {
    id: 'field_officer',
    label: 'Field Officer',
    rank: 2,
    accessScope: 'Assigned district & tactical sectors',
    manageableScope: 'Cannot create administrative roles; handles incident execution & field reports',
    description: 'Ground recon and incident lead. Coordinates on-scene traffic diversion, verifies field hazards, logs status reports, and liaises with rescue teams.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    accentColor: '#d97706',
  },
  rescue_team_member: {
    id: 'rescue_team_member',
    label: 'Rescue Team Member',
    rank: 1,
    accessScope: 'Assigned rescue team & deployed incidents',
    manageableScope: 'Cannot create or manage roles; handles rescue tasks & equipment readiness',
    description: 'Operational responder. Executes search & rescue, patient evacuation, structural extrication, and updates live operational status on scene.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    accentColor: '#e11d48',
  },
};

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  state: string; // e.g., 'Assam', or 'ALL' for Super Admin
  district: string; // e.g., 'Kamrup', or 'ALL' for Super/State Admin
  department: string;
  designation: string;
  badgeId: string;
  status: 'active' | 'on-duty' | 'off-duty' | 'suspended';
  assignedTeamId?: string;
  assignedTeamName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  state: string;
  district: string;
  specialization:
    | 'Flood & Water Rescue'
    | 'Landslide & Mountain SAR'
    | 'Urban Search & Heavy Extrication'
    | 'Medical Trauma & Evacuation'
    | 'Road Clearance & Hazardous Debris';
  leadOfficerId?: string;
  leadOfficerName?: string;
  leadOfficerContact?: string;
  contactRadio: string;
  memberIds: string[];
  memberCount: number;
  status: 'deployed' | 'standby' | 'transit' | 'rest';
  currentIncidentId?: string;
  currentIncidentCode?: string;
  equipment: string[];
  baseLocation: string;
  lastStatusUpdate: string;
}

/**
 * Core Rule: A user can only create, edit, assign, or delete users/roles strictly
 * below their own hierarchy level. They cannot manage anyone above or equal to their level.
 */
export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY_LEVEL[actorRole] > ROLE_HIERARCHY_LEVEL[targetRole];
}

/**
 * Validates whether an actor can manage a target user based on both role hierarchy
 * AND geographic jurisdiction.
 */
export function canManageUser(actor: SystemUser, target: SystemUser): boolean {
  // Cannot manage self through management actions
  if (actor.id === target.id) return false;

  // Strict role hierarchy check: must be strictly lower in the hierarchy
  if (!canManageRole(actor.role, target.role)) return false;

  // Geographic restrictions
  if (actor.role === 'super_admin') {
    return true; // No geographic restriction
  }

  if (actor.role === 'state_admin') {
    // Can only manage users within their assigned state
    return target.state.toLowerCase() === actor.state.toLowerCase();
  }

  if (actor.role === 'district_admin') {
    // Can only manage users within their assigned state AND district
    return (
      target.state.toLowerCase() === actor.state.toLowerCase() &&
      target.district.toLowerCase() === actor.district.toLowerCase()
    );
  }

  // Field Officer and Rescue Team Member cannot manage users
  return false;
}

/**
 * Validates whether an actor has geographic access to view or operate in a state.
 */
export function canAccessState(actor: SystemUser, state: string): boolean {
  if (actor.role === 'super_admin') return true;
  if (!state || state === 'all' || state === 'ALL') return false;
  return actor.state.toLowerCase() === state.toLowerCase();
}

/**
 * Validates whether an actor has geographic access to view or operate in a district.
 */
export function canAccessDistrict(actor: SystemUser, state: string, district?: string): boolean {
  if (actor.role === 'super_admin') return true;
  if (actor.role === 'state_admin') {
    return actor.state.toLowerCase() === state.toLowerCase();
  }
  if (!district || district === 'all' || district === 'ALL') {
    return false;
  }
  return (
    actor.state.toLowerCase() === state.toLowerCase() &&
    actor.district.toLowerCase() === district.toLowerCase()
  );
}

/**
 * Returns the list of roles that an actor is authorized to create.
 */
export function getCreatableRoles(actorRole: UserRole): UserRole[] {
  const actorLevel = ROLE_HIERARCHY_LEVEL[actorRole];
  const allRoles: UserRole[] = [
    'super_admin',
    'state_admin',
    'district_admin',
    'field_officer',
    'rescue_team_member',
  ];
  return allRoles.filter((role) => ROLE_HIERARCHY_LEVEL[role] < actorLevel);
}


