import { supabase, isSupabaseLiveConfigured } from '../lib/supabase';
import {
  IncidentMarker,
  VehicleMarker,
  RoadSegment,
  BridgeMarker,
  PriorityAlert,
  DistrictConnectivity as DistrictConnectivityType,
  AIRiskOutlook as AIRiskOutlookType,
  FleetVehicle,
  ShipmentItem,
  FieldReportItem,
  OperationalAlertItem,
  SystemUser,
  RescueTeam,
  UserRole,
} from '../types';

import {
  INITIAL_ROADS,
  INITIAL_INCIDENTS,
  INITIAL_VEHICLES,
  INITIAL_RISK_ZONES,
  INITIAL_ALERTS,
  INITIAL_BRIDGES,
  DISTRICT_CONNECTIVITY,
  AI_RISK_OUTLOOK,
} from '../data/mockData';

import {
  INITIAL_FLEET_VEHICLES,
  INITIAL_SHIPMENTS,
} from '../data/mockFleetLogisticsData';

import {
  FIELD_REPORTS_DATA,
  OPERATIONAL_ALERTS,
  AI_RISK_CORRIDORS,
} from '../data/mockOperationalIntelligence';

import {
  INITIAL_SYSTEM_USERS,
  INITIAL_RESCUE_TEAMS,
} from '../data/mockUsersAndRoles';

// Local storage backup keys for persistent data simulation when remote Supabase credentials are placeholder
const STORAGE_KEYS = {
  INCIDENTS: 'vector_sb_incidents_v1',
  ROADS: 'vector_sb_roads_v1',
  VEHICLES: 'vector_sb_vehicles_v1',
  FLEET_VEHICLES: 'vector_sb_fleet_vehicles_v1',
  SHIPMENTS: 'vector_sb_shipments_v1',
  ALERTS: 'vector_sb_alerts_v1',
  FIELD_REPORTS: 'vector_sb_field_reports_v1',
  USERS: 'vector_sb_users_v1',
  TEAMS: 'vector_sb_teams_v1',
  AUDIT_LOGS: 'vector_sb_audit_logs_v1',
};

// In-memory / localStorage storage helpers
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e);
  }
}

// In-memory live states initialized from persistent storage or initial seed
let liveIncidents: IncidentMarker[] = loadFromStorage(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
let liveRoads: RoadSegment[] = loadFromStorage(STORAGE_KEYS.ROADS, INITIAL_ROADS);
let liveVehicles: VehicleMarker[] = loadFromStorage(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
let liveFleetVehicles: FleetVehicle[] = loadFromStorage(STORAGE_KEYS.FLEET_VEHICLES, INITIAL_FLEET_VEHICLES);
let liveShipments: ShipmentItem[] = loadFromStorage(STORAGE_KEYS.SHIPMENTS, INITIAL_SHIPMENTS);
let liveAlerts: PriorityAlert[] = loadFromStorage(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
let liveOperationalAlerts: OperationalAlertItem[] = loadFromStorage('vector_sb_op_alerts', OPERATIONAL_ALERTS);
let liveFieldReports: FieldReportItem[] = loadFromStorage(STORAGE_KEYS.FIELD_REPORTS, FIELD_REPORTS_DATA);
let liveUsers: SystemUser[] = loadFromStorage(STORAGE_KEYS.USERS, INITIAL_SYSTEM_USERS);
let liveTeams: RescueTeam[] = loadFromStorage(STORAGE_KEYS.TEAMS, INITIAL_RESCUE_TEAMS);

// Realtime event listener subscribers
type TableChangeListener = (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void;
const changeListeners: Set<TableChangeListener> = new Set();

export function subscribeToDatabaseChanges(listener: TableChangeListener): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

function notifySubscribers(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
  changeListeners.forEach((fn) => {
    try {
      fn(table, event, payload);
    } catch (err) {
      console.error('Error in database change subscriber:', err);
    }
  });
}

// Initialize Supabase Realtime channel
if (typeof window !== 'undefined') {
  try {
    const channel = supabase.channel('vector-realtime-channel');
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          notifySubscribers(table, eventType, payload.new || payload.old);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('VECTOR: Supabase Realtime channel connected.');
        }
      });
  } catch (err) {
    console.warn('Realtime channel initial setup notice:', err);
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================
export async function logAuditEvent(action: string, entityType: string, entityId: string, details?: any) {
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_name: 'Current Authenticated User',
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_data: details,
    created_at: new Date().toISOString(),
  };

  try {
    if (isSupabaseLiveConfigured()) {
      await supabase.from('audit_logs').insert([logEntry]);
    }
  } catch (e) {
    // Graceful fallback
  }

  const logs = loadFromStorage<any[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  logs.unshift(logEntry);
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100));
}

// ============================================================================
// 1. INCIDENTS SERVICE (Complete Incident Flow & Realtime)
// ============================================================================
export async function fetchIncidents(): Promise<IncidentMarker[]> {
  try {
    if (isSupabaseLiveConfigured()) {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map database records to IncidentMarker
        const mapped: IncidentMarker[] = data.map((d: any) => ({
          id: d.id,
          code: d.incident_id || d.code || `INC-${d.id}`,
          title: d.title,
          category: (d.incident_type || d.category || 'landslide') as any,
          severity: (d.severity || 'high') as any,
          roadName: d.road_name || d.roadName || 'Highway Segment',
          district: d.district_id || d.district || 'Command Sector',
          state: d.state_id || d.state || 'Assam',
          coordinates: Array.isArray(d.coordinates) ? (d.coordinates as [number, number]) : [400, 250],
          latLng: d.latitude && d.longitude ? `${d.latitude.toFixed(2)}°N, ${d.longitude.toFixed(2)}°E` : d.latLng || "26°11'N, 91°41'E",
          timestamp: d.created_at ? new Date(d.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST' : 'Just now',
          reportedBy: d.reported_by || d.reportedBy || 'Regional Hub',
          status: (d.status === 'Resolved' ? 'resolved' : d.status === 'In Progress' ? 'in-progress' : d.status?.toLowerCase() || 'active') as any,
          description: d.description || '',
          dispatchedTeams: Array.isArray(d.dispatched_teams) ? d.dispatched_teams : d.dispatchedTeams || [],
          estimatedClearance: d.estimated_clearance || d.estimatedClearance || 'Pending Evaluation',
          affectedVehicles: d.affected_vehicles ?? d.affectedVehicles ?? 0,
          verificationStatus: (d.status === 'Verified' ? 'verified' : d.verificationStatus || 'pending') as any,
          assignedOfficer: d.assigned_field_officer || d.assignedOfficer,
          assignedOfficerRole: d.assigned_field_officer_role || d.assignedOfficerRole,
          recommendedAction: d.recommended_action || d.recommendedAction,
          photoUrl: d.photo_url || d.photoUrl,
          photoCaption: d.photo_caption || d.photoCaption,
        }));
        liveIncidents = mapped;
        saveToStorage(STORAGE_KEYS.INCIDENTS, mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchIncidents fallback to local store:', err);
  }

  return [...liveIncidents];
}

export async function createIncident(incident: IncidentMarker): Promise<IncidentMarker> {
  const cleanIncident: IncidentMarker = {
    ...incident,
    id: incident.id || `inc-${Date.now()}`,
    code: incident.code || `INC-NE-${Math.floor(400 + Math.random() * 100)}`,
    status: incident.status || 'active',
    verificationStatus: incident.verificationStatus || 'verified',
    dispatchedTeams: incident.dispatchedTeams || [],
  };

  // 1. Update local single source of truth
  liveIncidents = [cleanIncident, ...liveIncidents];
  saveToStorage(STORAGE_KEYS.INCIDENTS, liveIncidents);

  // 2. Automatically generate an Alert if severity is critical or high
  if (['critical', 'high'].includes(cleanIncident.severity)) {
    const newAlert: PriorityAlert = {
      id: `alt-${cleanIncident.id}`,
      code: `ALT-${cleanIncident.code}`,
      title: `${cleanIncident.severity.toUpperCase()} INCIDENT: ${cleanIncident.title}`,
      severity: cleanIncident.severity,
      category: cleanIncident.category,
      location: `${cleanIncident.roadName} (${cleanIncident.district}, ${cleanIncident.state})`,
      timestamp: 'Just now',
      impactedAsset: cleanIncident.roadName,
      actionRequired: cleanIncident.recommendedAction || 'Deploy sector inspection and reroute convoys.',
      targetIncidentId: cleanIncident.id,
      acknowledged: false,
    };
    liveAlerts = [newAlert, ...liveAlerts];
    saveToStorage(STORAGE_KEYS.ALERTS, liveAlerts);
    notifySubscribers('alerts', 'INSERT', newAlert);
  }

  // 3. Persist to Supabase if configured
  try {
    if (isSupabaseLiveConfigured()) {
      await supabase.from('incidents').insert([
        {
          id: cleanIncident.id,
          incident_id: cleanIncident.code,
          title: cleanIncident.title,
          description: cleanIncident.description,
          incident_type: cleanIncident.category,
          severity: cleanIncident.severity,
          status: 'Reported',
          state_id: cleanIncident.state,
          district_id: cleanIncident.district,
          location_name: cleanIncident.roadName,
          latitude: 26.15,
          longitude: 91.80,
          road_name: cleanIncident.roadName,
          highway_number: cleanIncident.roadName.includes('NH-') ? cleanIncident.roadName.split(' ')[0] : 'NH-Road',
          reported_by: cleanIncident.reportedBy,
          recommended_action: cleanIncident.recommendedAction,
          dispatched_teams: cleanIncident.dispatchedTeams,
          affected_vehicles: cleanIncident.affectedVehicles,
          photo_url: cleanIncident.photoUrl,
          coordinates: cleanIncident.coordinates,
        },
      ]);
    }
  } catch (err) {
    console.warn('Supabase createIncident persistence warning:', err);
  }

  await logAuditEvent('Created Incident', 'incident', cleanIncident.id, cleanIncident);
  notifySubscribers('incidents', 'INSERT', cleanIncident);
  return cleanIncident;
}

export async function updateIncident(id: string, updates: Partial<IncidentMarker>): Promise<IncidentMarker | null> {
  const index = liveIncidents.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const updated: IncidentMarker = {
    ...liveIncidents[index],
    ...updates,
  };
  liveIncidents[index] = updated;
  saveToStorage(STORAGE_KEYS.INCIDENTS, liveIncidents);

  try {
    if (isSupabaseLiveConfigured()) {
      const dbUpdates: any = {};
      if (updates.status) {
        dbUpdates.status = updates.status === 'resolved' ? 'Resolved' : updates.status === 'in-progress' ? 'In Progress' : 'Verified';
        if (updates.status === 'resolved') dbUpdates.resolved_at = new Date().toISOString();
      }
      if (updates.verificationStatus) dbUpdates.verified_by = updates.assignedOfficer || 'Authorized Officer';
      if (updates.assignedOfficer) dbUpdates.assigned_field_officer = updates.assignedOfficer;
      if (updates.dispatchedTeams) dbUpdates.dispatched_teams = updates.dispatchedTeams;
      if (updates.severity) dbUpdates.severity = updates.severity;
      if (updates.description) dbUpdates.description = updates.description;

      await supabase.from('incidents').update(dbUpdates).eq('id', id);
    }
  } catch (err) {
    console.warn('Supabase updateIncident persistence notice:', err);
  }

  await logAuditEvent(`Updated Incident ${id}`, 'incident', id, updates);
  notifySubscribers('incidents', 'UPDATE', updated);
  return updated;
}

// Complete Incident Flow actions:
export async function verifyIncident(id: string, officerName: string) {
  return updateIncident(id, {
    verificationStatus: 'verified',
    assignedOfficer: officerName,
    status: 'in-progress',
  });
}

export async function assignFieldOfficerToIncident(id: string, officerName: string, officerRole?: string) {
  return updateIncident(id, {
    assignedOfficer: officerName,
    assignedOfficerRole: officerRole || 'Field Inspection Officer',
    status: 'in-progress',
  });
}

export async function assignRescueTeamToIncident(id: string, teamName: string) {
  const match = liveIncidents.find((i) => i.id === id);
  const currentTeams = match?.dispatchedTeams || [];
  const updatedTeams = currentTeams.includes(teamName) ? currentTeams : [...currentTeams, teamName];

  // If a rescue team is assigned, also update the rescue_teams status
  const teamMatch = liveTeams.find((t) => t.name === teamName);
  if (teamMatch) {
    teamMatch.status = 'deployed';
    teamMatch.currentIncidentId = id;
    teamMatch.lastStatusUpdate = 'Just now';
    saveToStorage(STORAGE_KEYS.TEAMS, liveTeams);
    notifySubscribers('rescue_teams', 'UPDATE', teamMatch);
  }

  return updateIncident(id, {
    dispatchedTeams: updatedTeams,
  });
}

export async function resolveIncident(id: string) {
  return updateIncident(id, {
    status: 'resolved',
    estimatedClearance: 'Cleared & Restored',
  });
}

// ============================================================================
// 2. ROUTES & ACCESSIBILITY (Map synchronization & road condition)
// ============================================================================
export async function fetchRoads(): Promise<RoadSegment[]> {
  try {
    if (isSupabaseLiveConfigured()) {
      const { data, error } = await supabase.from('routes').select('*');
      if (!error && data && data.length > 0) {
        // Merge with existing points for GIS mapping
        const merged = data.map((d: any) => {
          const existing = liveRoads.find((r) => r.id === d.id || r.routeNumber === d.highway_number);
          return {
            id: d.id,
            name: d.route_name || existing?.name || `${d.highway_number} Corridor`,
            routeNumber: d.highway_number || existing?.routeNumber || 'NH-Highway',
            status: (d.accessibility_status || existing?.status || 'clear') as any,
            conditionStatus: (d.accessibility_status === 'blocked' ? 'blocked' : d.accessibility_status === 'restricted' ? 'warning' : 'clear') as any,
            environmentRisk: (d.risk_level || existing?.environmentRisk || 'low') as any,
            trafficLevel: existing?.trafficLevel || 'medium',
            weatherCondition: existing?.weatherCondition || 'Normal Weather',
            state: d.state_id || existing?.state || 'Assam',
            from: d.start_location || existing?.from || 'Sector Start',
            to: d.end_location || existing?.to || 'Sector End',
            lengthKm: Number(d.length_km) || existing?.lengthKm || 50,
            points: existing?.points || [[300, 200], [350, 220]],
            conditionDetails: d.condition_details || existing?.conditionDetails || 'Route operating under standard protocols.',
            detourRoute: d.detour_route || existing?.detourRoute,
            affectedConvoys: d.affected_convoys ?? existing?.affectedConvoys ?? 0,
            lastUpdated: 'Just now',
          };
        });
        liveRoads = merged;
        saveToStorage(STORAGE_KEYS.ROADS, merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchRoads fallback:', err);
  }
  return [...liveRoads];
}

export async function updateRouteStatus(routeId: string, status: 'open' | 'restricted' | 'blocked', reason?: string): Promise<RoadSegment | null> {
  const index = liveRoads.findIndex((r) => r.id === routeId || r.routeNumber === routeId);
  if (index === -1) return null;

  const target = liveRoads[index];
  const updated: RoadSegment = {
    ...target,
    status: status === 'open' ? 'clear' : status,
    conditionStatus: status === 'open' ? 'clear' : status === 'restricted' ? 'warning' : 'blocked',
    conditionDetails: reason ? `${status.toUpperCase()}: ${reason}` : target.conditionDetails,
    lastUpdated: 'Just now',
  };

  liveRoads[index] = updated;
  saveToStorage(STORAGE_KEYS.ROADS, liveRoads);

  try {
    if (isSupabaseLiveConfigured()) {
      await supabase
        .from('routes')
        .update({
          accessibility_status: status,
          condition_details: updated.conditionDetails,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${routeId},highway_number.eq.${routeId}`);
    }
  } catch (err) {
    console.warn('Supabase updateRouteStatus notice:', err);
  }

  await logAuditEvent(`Updated route ${target.routeNumber} to ${status}`, 'route', target.id, { status, reason });
  notifySubscribers('routes', 'UPDATE', updated);
  return updated;
}

// ============================================================================
// 3. VEHICLES & FLEET TRACKING SERVICE
// ============================================================================
export async function fetchVehicles(): Promise<VehicleMarker[]> {
  return [...liveVehicles];
}

export async function fetchFleetVehicles(): Promise<FleetVehicle[]> {
  try {
    if (isSupabaseLiveConfigured()) {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (!error && data && data.length > 0) {
        const mapped: FleetVehicle[] = data.map((d: any) => ({
          id: d.vehicle_id || d.id,
          callsign: d.callsign || d.vehicle_number || 'VEH-01',
          cargo: d.cargo_type || 'General Cargo',
          cargoDetails: d.cargo_details || 'Essential Supply Goods',
          origin: d.origin,
          destination: d.destination,
          eta: d.eta || 'ETA 3h',
          status: (d.status?.toLowerCase() === 'moving' ? 'moving' : d.status?.toLowerCase() === 'delayed' ? 'delayed' : 'at-risk') as any,
          statusLabel: d.status || 'On Route',
          currentLocation: d.current_location_name || `${d.origin} → ${d.destination}`,
          route: d.assigned_highway || 'East-West Transit Highway',
          speed: d.speed_kmh ? `${d.speed_kmh} km/h` : '48 km/h',
          delay: d.delay_minutes ? `+${d.delay_minutes}m` : 'None (On Schedule)',
          risk: (d.risk_level || 'Low') as any,
          riskDetails: d.risk_details || 'Clear highway transit',
          lastGpsUpdate: 'Just now',
          coordinates: Array.isArray(d.coordinates) ? (d.coordinates as [number, number]) : [450, 280],
          driverName: d.driver_name || 'Assigned Driver',
          driverPhone: d.driver_phone || '+91 98000-00000',
          state: d.state_id || 'Assam',
        }));
        liveFleetVehicles = mapped;
        saveToStorage(STORAGE_KEYS.FLEET_VEHICLES, mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchFleetVehicles notice:', err);
  }
  return [...liveFleetVehicles];
}

export async function updateVehicleStatus(vehicleId: string, status: 'moving' | 'delayed' | 'at-risk', delayMinutes?: number): Promise<FleetVehicle | null> {
  const index = liveFleetVehicles.findIndex((v) => v.id === vehicleId);
  if (index === -1) return null;

  const target = liveFleetVehicles[index];
  const updated: FleetVehicle = {
    ...target,
    status,
    statusLabel: status === 'moving' ? 'On Route' : status === 'delayed' ? 'Delayed' : 'At Risk',
    delay: delayMinutes ? `+${delayMinutes}m` : target.delay,
    lastGpsUpdate: 'Just now',
  };

  liveFleetVehicles[index] = updated;
  saveToStorage(STORAGE_KEYS.FLEET_VEHICLES, liveFleetVehicles);

  try {
    if (isSupabaseLiveConfigured()) {
      await supabase
        .from('vehicles')
        .update({
          status,
          delay_minutes: delayMinutes || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('vehicle_id', vehicleId);
    }
  } catch (err) {
    console.warn('Supabase updateVehicleStatus notice:', err);
  }

  notifySubscribers('vehicles', 'UPDATE', updated);
  return updated;
}

// ============================================================================
// 4. SHIPMENTS / LOGISTICS SERVICE
// ============================================================================
export async function fetchShipments(): Promise<ShipmentItem[]> {
  try {
    if (isSupabaseLiveConfigured()) {
      const { data, error } = await supabase.from('shipments').select('*');
      if (!error && data && data.length > 0) {
        const mapped: ShipmentItem[] = data.map((d: any) => ({
          id: d.shipment_id || d.id,
          commodity: d.commodity || 'Medicines',
          quantity: d.quantity || '1,000 Units',
          origin: d.origin || 'Guwahati Central Depot',
          originState: d.origin_state || 'Assam',
          destination: d.destination || 'Imphal Hub',
          destinationDistrict: d.destination_district || 'District Hub',
          destinationState: d.destination_state || 'Assam',
          vehicle: d.vehicle_label || d.vehicle_id || 'Assigned Vehicle',
          priority: (d.priority?.toLowerCase() === 'critical' ? 'Critical' : d.priority?.toLowerCase() === 'high' ? 'High' : 'Standard') as any,
          status: (d.status?.toLowerCase() === 'delivered' ? 'Delivered' : d.status?.toLowerCase() === 'delayed' ? 'Delayed' : d.status?.toLowerCase() === 'dispatched' ? 'Dispatched' : 'In Transit') as any,
          eta: d.eta || '4 hours',
          delay: d.delay || (d.status === 'delayed' ? '+1h 45m' : 'No Delay'),
          risk: (d.risk || 'Low') as any,
          currentLocation: d.current_location || 'Corridor Axis',
        }));
        liveShipments = mapped;
        saveToStorage(STORAGE_KEYS.SHIPMENTS, mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchShipments notice:', err);
  }
  return [...liveShipments];
}

export async function updateShipmentStatus(shipmentId: string, status: 'In Transit' | 'Delayed' | 'Delivered' | 'Dispatched'): Promise<ShipmentItem | null> {
  const index = liveShipments.findIndex((s) => s.id === shipmentId);
  if (index === -1) return null;

  const updated: ShipmentItem = {
    ...liveShipments[index],
    status,
    delay: status === 'Delayed' ? '+2h 15m' : 'No Delay',
    risk: status === 'Delayed' ? 'High' : 'Low',
  };

  liveShipments[index] = updated;
  saveToStorage(STORAGE_KEYS.SHIPMENTS, liveShipments);

  try {
    if (isSupabaseLiveConfigured()) {
      await supabase
        .from('shipments')
        .update({
          status: status.toLowerCase().replace(' ', '_'),
          updated_at: new Date().toISOString(),
        })
        .eq('shipment_id', shipmentId);
    }
  } catch (err) {
    console.warn('Supabase updateShipmentStatus notice:', err);
  }

  notifySubscribers('shipments', 'UPDATE', updated);
  return updated;
}

// ============================================================================
// 5. ALERTS SERVICE
// ============================================================================
export async function fetchAlerts(): Promise<PriorityAlert[]> {
  return [...liveAlerts];
}

export async function toggleAcknowledgeAlert(alertId: string): Promise<PriorityAlert | null> {
  const index = liveAlerts.findIndex((a) => a.id === alertId);
  if (index === -1) return null;

  const updated: PriorityAlert = {
    ...liveAlerts[index],
    acknowledged: !liveAlerts[index].acknowledged,
  };

  liveAlerts[index] = updated;
  saveToStorage(STORAGE_KEYS.ALERTS, liveAlerts);

  try {
    if (isSupabaseLiveConfigured()) {
      await supabase
        .from('alerts')
        .update({ acknowledged: updated.acknowledged })
        .eq('id', alertId);
    }
  } catch (err) {
    console.warn('Supabase toggleAcknowledgeAlert notice:', err);
  }

  notifySubscribers('alerts', 'UPDATE', updated);
  return updated;
}

// ============================================================================
// 6. FIELD REPORTS SERVICE
// ============================================================================
export async function fetchFieldReports(): Promise<FieldReportItem[]> {
  return [...liveFieldReports];
}

export async function submitFieldReport(report: Partial<FieldReportItem>): Promise<FieldReportItem> {
  const newReport: FieldReportItem = {
    id: `rep-fld-${Date.now().toString().slice(-5)}`,
    submittedBy: report.submittedBy || 'Field Officer',
    reporterAgency: report.reporterAgency || 'Assam Highway Patrol',
    reporterDesignation: report.reporterDesignation || 'Field Safety Officer',
    reporterContact: report.reporterContact || '+91 98452-98122',
    time: 'Just now',
    timestamp: new Date().toLocaleTimeString('en-GB') + ' IST',
    state: report.state || 'Assam',
    district: report.district || 'Kamrup',
    location: report.location || 'Highway Milepost',
    type: report.type || 'Landslide',
    description: report.description || 'Field recon completed.',
    gpsCoordinates: report.gpsCoordinates || "26°11'N, 91°41'E",
    coordinates: report.coordinates || [350, 220],
    severity: report.severity || 'Critical',
    verification: 'Verified',
    status: 'Actionable',
    linkedIncidentId: report.linkedIncidentId,
    photoUrl: report.photoUrl,
  };

  liveFieldReports = [newReport, ...liveFieldReports];
  saveToStorage(STORAGE_KEYS.FIELD_REPORTS, liveFieldReports);

  try {
    if (isSupabaseLiveConfigured()) {
      await supabase.from('field_reports').insert([
        {
          id: newReport.id,
          incident_id: newReport.linkedIncidentId || null,
          submitted_by: newReport.submittedBy,
          reporter_agency: newReport.reporterAgency,
          report_type: newReport.type,
          description: newReport.description,
          latitude: 26.15,
          longitude: 91.80,
          gps_coordinates: newReport.gpsCoordinates,
          location_name: newReport.location,
          state_id: newReport.state,
          district_id: newReport.district,
          verification_status: 'verified',
        },
      ]);
    }
  } catch (err) {
    console.warn('Supabase submitFieldReport persistence notice:', err);
  }

  notifySubscribers('field_reports', 'INSERT', newReport);
  return newReport;
}

// ============================================================================
// 7. DYNAMIC DASHBOARD KPIS (Calculated from Real Database Data)
// ============================================================================
export interface DashboardKPIs {
  roadAccessibilityPercent: number;
  openNetworkKm: number;
  totalNetworkKm: number;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  vehiclesInTransitCount: number;
  delayedVehiclesCount: number;
  essentialDeliveriesCount: number;
  onTimeDeliveryRate: number;
}

export function computeDashboardKPIs(
  roads: RoadSegment[],
  incidents: IncidentMarker[],
  fleetVehicles: FleetVehicle[],
  shipments: ShipmentItem[]
): DashboardKPIs {
  // 1. Road Accessibility %
  // Accessible / Open route km / total route km
  const totalKm = roads.reduce((acc, r) => acc + (r.lengthKm || 0), 0) || 1;
  const openKm = roads
    .filter((r) => r.status === 'clear' || r.status === 'open')
    .reduce((acc, r) => acc + (r.lengthKm || 0), 0);
  const roadAccessibilityPercent = Math.round((openKm / totalKm) * 100);

  // 2. Active Incidents (not resolved)
  const activeInc = incidents.filter((i) => i.status !== 'resolved');
  const criticalCount = activeInc.filter((i) => i.severity === 'critical').length;

  // 3. Vehicles in Transit
  const inTransitVehicles = fleetVehicles.filter((v) => v.status === 'moving' || v.status === 'at-risk');
  const delayedVehicles = fleetVehicles.filter((v) => v.status === 'delayed');

  // 4. Essential Deliveries
  const nonDelayedShipments = shipments.filter((s) => s.status !== 'Delayed');
  const onTimeRate = shipments.length > 0 ? Math.round((nonDelayedShipments.length / shipments.length) * 100) : 96;

  return {
    roadAccessibilityPercent,
    openNetworkKm: openKm,
    totalNetworkKm: totalKm,
    activeIncidentsCount: activeInc.length,
    criticalIncidentsCount: criticalCount,
    vehiclesInTransitCount: inTransitVehicles.length || fleetVehicles.length,
    delayedVehiclesCount: delayedVehicles.length,
    essentialDeliveriesCount: shipments.length,
    onTimeDeliveryRate: onTimeRate,
  };
}

