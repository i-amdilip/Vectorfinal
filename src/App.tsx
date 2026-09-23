/**
 * VECTOR — Government Logistics & Emergency Operations Portal
 * Command Dashboard & Live Operations Page
 * Vehicle & Emergency Connectivity for Transport Operations & Routing
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiRow } from './components/KpiRow';
import { RegionalOperationsMap } from './components/RegionalOperationsMap';
import { PriorityAlerts } from './components/PriorityAlerts';
import { DistrictConnectivity } from './components/DistrictConnectivity';
import { AIRiskOutlook } from './components/AIRiskOutlook';
import { LiveOperationsView } from './components/LiveOperationsView';
import { IncidentManagementView } from './components/IncidentManagementView';
import { FleetTrackingView } from './components/FleetTrackingView';
import { LogisticsView } from './components/LogisticsView';
import { AIRiskIntelligenceView } from './components/AIRiskIntelligenceView';
import { DistrictMonitoringView } from './components/DistrictMonitoringView';
import { AlertsView } from './components/AlertsView';
import { FieldReportsView } from './components/FieldReportsView';
import { RouteIntelligenceView } from './components/RouteIntelligenceView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { UserManagementView } from './components/UserManagementView';
import { SitrepModal } from './components/SitrepModal';
import { BroadcastModal } from './components/BroadcastModal';
import { DetailDrawer } from './components/DetailDrawer';
import { LoginView } from './components/LoginView';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import {
  fetchIncidents,
  fetchRoads,
  fetchVehicles,
  fetchFleetVehicles,
  fetchShipments,
  fetchAlerts,
  createIncident as sbCreateIncident,
  updateIncident as sbUpdateIncident,
  assignRescueTeamToIncident as sbAssignRescueTeam,
  toggleAcknowledgeAlert as sbToggleAlert,
  computeDashboardKPIs,
  subscribeToDatabaseChanges,
} from './services/supabaseService';
import { INITIAL_FLEET_VEHICLES, INITIAL_SHIPMENTS } from './data/mockFleetLogisticsData';
import { FleetVehicle, ShipmentItem } from './types';

import {
  INITIAL_ROADS,
  INITIAL_INCIDENTS,
  INITIAL_VEHICLES,
  INITIAL_RISK_ZONES,
  INITIAL_ALERTS,
  INITIAL_BRIDGES,
  DISTRICT_CONNECTIVITY,
  AI_RISK_OUTLOOK,
} from './data/mockData';

import {
  RoadSegment,
  IncidentMarker,
  VehicleMarker,
  PriorityAlert,
  DistrictConnectivity as DistrictConnectivityType,
  AIRiskOutlook as AIRiskOutlookType,
  BridgeMarker,
} from './types';

export default function App() {
  const { theme } = useTheme();
  const { currentUser, isSuperAdmin, isAuthenticated, loading } = useAuth();

  // Navigation & State Management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('command');
  const [selectedState, setSelectedState] = useState('all');

  // Synchronize state selection with user's assigned jurisdiction if not super admin
  React.useEffect(() => {
    if (!isSuperAdmin && currentUser.state !== 'ALL') {
      setSelectedState(currentUser.state);
    }
  }, [currentUser, isSuperAdmin]);

  // Operational Data States
  const [roads, setRoads] = useState<RoadSegment[]>(INITIAL_ROADS);
  const [incidents, setIncidents] = useState<IncidentMarker[]>(INITIAL_INCIDENTS);
  const [vehicles, setVehicles] = useState<VehicleMarker[]>(INITIAL_VEHICLES);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>(INITIAL_FLEET_VEHICLES);
  const [shipments, setShipments] = useState<ShipmentItem[]>(INITIAL_SHIPMENTS);
  const [riskZones] = useState(INITIAL_RISK_ZONES);
  const [bridges] = useState<BridgeMarker[]>(INITIAL_BRIDGES);
  const [alerts, setAlerts] = useState<PriorityAlert[]>(INITIAL_ALERTS);
  const [districts] = useState<DistrictConnectivityType[]>(DISTRICT_CONNECTIVITY);
  const [outlooks] = useState<AIRiskOutlookType[]>(AI_RISK_OUTLOOK);

  // Inspector & Map Selection
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMarker | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<BridgeMarker | null>(null);
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  // Sync & Telemetry
  const [lastSyncTime, setLastSyncTime] = useState('09:32:45 IST');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [isSitrepOpen, setIsSitrepOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastNotification, setBroadcastNotification] = useState<string | null>(null);

  // Initial Load & Realtime Sync with Supabase
  React.useEffect(() => {
    let active = true;

    async function loadDataFromSupabase() {
      try {
        const [loadedIncidents, loadedRoads, loadedVehicles, loadedFleet, loadedShipments, loadedAlerts] =
          await Promise.all([
            fetchIncidents(),
            fetchRoads(),
            fetchVehicles(),
            fetchFleetVehicles(),
            fetchShipments(),
            fetchAlerts(),
          ]);

        if (active) {
          if (loadedIncidents?.length) setIncidents(loadedIncidents);
          if (loadedRoads?.length) setRoads(loadedRoads);
          if (loadedVehicles?.length) setVehicles(loadedVehicles);
          if (loadedFleet?.length) setFleetVehicles(loadedFleet);
          if (loadedShipments?.length) setShipments(loadedShipments);
          if (loadedAlerts?.length) setAlerts(loadedAlerts);
        }
      } catch (err) {
        console.warn('Initial Supabase load error:', err);
      }
    }

    loadDataFromSupabase();

    // Subscribe to realtime database table changes
    const unsubscribe = subscribeToDatabaseChanges((table, event, payload) => {
      if (table === 'incidents') {
        if (event === 'INSERT') {
          setIncidents((prev) => [payload, ...prev.filter((i) => i.id !== payload.id)]);
        } else if (event === 'UPDATE') {
          setIncidents((prev) => prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i)));
        } else if (event === 'DELETE') {
          setIncidents((prev) => prev.filter((i) => i.id !== payload.id));
        }
      } else if (table === 'routes') {
        fetchRoads().then((r) => setRoads(r));
      } else if (table === 'alerts') {
        if (event === 'INSERT') {
          setAlerts((prev) => [payload, ...prev.filter((a) => a.id !== payload.id)]);
        } else if (event === 'UPDATE') {
          setAlerts((prev) => prev.map((a) => (a.id === payload.id ? { ...a, ...payload } : a)));
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Compute live dashboard KPIs dynamically from Supabase database state
  const dashboardKpis = React.useMemo(() => {
    return computeDashboardKPIs(roads, incidents, fleetVehicles, shipments);
  }, [roads, incidents, fleetVehicles, shipments]);

  // Toggle alert acknowledgment
  const handleToggleAcknowledge = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, acknowledged: !a.acknowledged } : a
      )
    );
    await sbToggleAlert(alertId);
  };

  // Inspect alert on GIS map
  const handleSelectAlertOnMap = (alert: PriorityAlert) => {
    if (alert.targetIncidentId) {
      const match = incidents.find((i) => i.id === alert.targetIncidentId);
      if (match) {
        setSelectedIncident(match);
        setSelectedVehicle(null);
        setSelectedRoad(null);
        setSelectedBridge(null);
        return;
      }
    }
    // Fallback: match road or title
    if (alert.title.includes('NH-29')) {
      const roadMatch = roads.find((r) => r.routeNumber === 'NH-29');
      if (roadMatch) setSelectedRoad(roadMatch);
      const incMatch = incidents.find((i) => i.roadName.includes('NH-29'));
      if (incMatch) setSelectedIncident(incMatch);
    } else if (alert.title.includes('medicine') || alert.title.includes('MED-09')) {
      const vehMatch = vehicles.find((v) => v.callsign === 'MED-CONVOY-09');
      if (vehMatch) setSelectedVehicle(vehMatch);
    }
  };

  // Trigger manual satellite telemetry sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const [newInc, newRoads, newFleet, newShipments, newAlerts] = await Promise.all([
        fetchIncidents(),
        fetchRoads(),
        fetchFleetVehicles(),
        fetchShipments(),
        fetchAlerts(),
      ]);
      setIncidents(newInc);
      setRoads(newRoads);
      setFleetVehicles(newFleet);
      setShipments(newShipments);
      setAlerts(newAlerts);
    } catch (e) {
      console.warn('Sync error:', e);
    } finally {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    }
  };

  // Emergency broadcast handler
  const handleSendBroadcast = (msg: string, channel: string) => {
    setBroadcastNotification(
      `Emergency broadcast transmitted to [${channel}]: "${msg.slice(0, 60)}..."`
    );
    setTimeout(() => setBroadcastNotification(null), 6000);
  };

  // Dispatch rescue team to incident (District Admin / Super Admin capability)
  const handleDispatchTeamToIncident = async (incidentId: string, teamName: string) => {
    await sbAssignRescueTeam(incidentId, teamName);
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const currentTeams = inc.dispatchedTeams || [];
        if (currentTeams.includes(teamName)) return inc;
        return {
          ...inc,
          dispatchedTeams: [...currentTeams, teamName],
        };
      })
    );
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              dispatchedTeams: [...(prev.dispatchedTeams || []), teamName],
            }
          : null
      );
    }
  };

  // Handle KPI card click
  const handleSelectKpi = (filterId: string) => {
    setKpiFilter((prev) => (prev === filterId ? null : filterId));
    if (filterId === 'incidents') {
      const crit = incidents.find((i) => i.severity === 'critical');
      if (crit) setSelectedIncident(crit);
    } else if (filterId === 'accessibility') {
      const blocked = roads.find((r) => r.status === 'blocked');
      if (blocked) setSelectedRoad(blocked);
    } else if (filterId === 'vehicles') {
      const delayed = vehicles.find((v) => v.status === 'delayed');
      if (delayed) setSelectedVehicle(delayed);
    }
  };

  // If Auth is initializing
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white select-none">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-9 w-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
            Initializing VECTOR Terminal...
          </span>
        </div>
      </div>
    );
  }

  // Minimal Login Page if not authenticated
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div
      data-theme={theme}
      className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-slate-900 font-sans antialiased select-none"
    >
      {/* VECTOR Global Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeNav={activeNav}
        onSelectNav={(navId) => {
          setActiveNav(navId);
          // If selecting a specific entity type from sidebar, set state or navigate
          if (['roads', 'bridges'].includes(navId)) {
            setActiveNav('live');
          }
        }}
        criticalIncidentCount={incidents.filter((i) => i.severity === 'critical').length}
        activeVehicleCount={vehicles.length}
      />

      {/* Main Command Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Page Header (Shown for Command Dashboard; dedicated views have their own headers) */}
        {activeNav !== 'live' &&
          activeNav !== 'incidents' &&
          activeNav !== 'fleet' &&
          activeNav !== 'logistics' &&
          activeNav !== 'routes' &&
          activeNav !== 'ai-risk' &&
          activeNav !== 'districts' &&
          activeNav !== 'alerts' &&
          activeNav !== 'field-reports' &&
          activeNav !== 'analytics' &&
          activeNav !== 'settings' &&
          activeNav !== 'roles' && (
            <Header
              selectedState={selectedState}
              onSelectState={setSelectedState}
              onOpenSitrep={() => setIsSitrepOpen(true)}
              onOpenBroadcast={() => setIsBroadcastOpen(true)}
              lastSyncTime={lastSyncTime}
              isSyncing={isSyncing}
              onTriggerSync={handleTriggerSync}
              onNavigateToRoles={() => setActiveNav('roles')}
            />
          )}

        {/* Operational Broadcast Banner if active */}
        {broadcastNotification && (
          <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-4 py-1.5 text-xs text-rose-800">
            <span className="font-mono font-semibold">
              ● ACTIVE DISPATCH: {broadcastNotification}
            </span>
            <button
              onClick={() => setBroadcastNotification(null)}
              className="text-rose-600 hover:text-rose-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Main Views */}
        {activeNav === 'live' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <LiveOperationsView
              onSelectIncidentDetail={(inc) => {
                setSelectedIncident(inc);
                setSelectedVehicle(null);
                setSelectedRoad(null);
                setSelectedBridge(null);
              }}
              onSelectVehicleDetail={(veh) => {
                setSelectedVehicle(veh);
                setSelectedIncident(null);
                setSelectedRoad(null);
                setSelectedBridge(null);
              }}
              onSelectRoadDetail={(road) => {
                setSelectedRoad(road);
                setSelectedIncident(null);
                setSelectedVehicle(null);
                setSelectedBridge(null);
              }}
              onSelectBridgeDetail={(bridge) => {
                setSelectedBridge(bridge);
                setSelectedIncident(null);
                setSelectedVehicle(null);
                setSelectedRoad(null);
              }}
            />
          </div>
        ) : activeNav === 'incidents' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <IncidentManagementView
              incidents={incidents}
              onUpdateIncident={async (updated) => {
                setIncidents((prev) =>
                  prev.map((i) => (i.id === updated.id ? updated : i))
                );
                await sbUpdateIncident(updated.id, updated);
              }}
              onCreateIncident={async (newInc) => {
                const saved = await sbCreateIncident(newInc);
                setIncidents((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
              }}
              onDispatchTeam={handleDispatchTeamToIncident}
              onViewOnMap={(inc) => {
                setSelectedIncident(inc);
                setSelectedVehicle(null);
                setSelectedRoad(null);
                setSelectedBridge(null);
                setActiveNav('command');
              }}
            />
          </div>
        ) : activeNav === 'fleet' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <FleetTrackingView />
          </div>
        ) : activeNav === 'logistics' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <LogisticsView
              onNavigateToFleetVehicle={() => {
                setActiveNav('fleet');
              }}
            />
          </div>
        ) : activeNav === 'ai-risk' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AIRiskIntelligenceView
              onNavigateToCorridorMap={(corridor) => {
                const match = roads.find((r) => r.routeNumber === corridor.corridorCode);
                if (match) setSelectedRoad(match);
                setActiveNav('command');
              }}
            />
          </div>
        ) : activeNav === 'districts' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <DistrictMonitoringView
              onNavigateToCommandMap={(district) => {
                setSelectedState(district.state);
                setActiveNav('command');
              }}
            />
          </div>
        ) : activeNav === 'alerts' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AlertsView
              onViewOnMap={(alert) => {
                if (alert.targetIncidentId) {
                  const match = incidents.find((i) => i.id === alert.targetIncidentId);
                  if (match) setSelectedIncident(match);
                } else if (alert.targetRoad) {
                  const matchRoad = roads.find((r) => r.routeNumber === alert.targetRoad);
                  if (matchRoad) setSelectedRoad(matchRoad);
                }
                setActiveNav('command');
              }}
            />
          </div>
        ) : activeNav === 'field-reports' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <FieldReportsView
              onPromoteToIncident={async (report) => {
                const newIncident: IncidentMarker = {
                  id: `inc-rep-${Date.now().toString().slice(-4)}`,
                  code: `INC-FLD-${Date.now().toString().slice(-4)}`,
                  title: `${report.type}: ${report.location}`,
                  category:
                    report.type === 'Landslide'
                      ? 'landslide'
                      : report.type === 'Flood'
                      ? 'flood'
                      : report.type === 'Bridge Damage'
                      ? 'bridge_restriction'
                      : report.type === 'Road Damage'
                      ? 'road_damage'
                      : 'weather',
                  severity:
                    report.severity === 'Critical'
                      ? 'critical'
                      : report.severity === 'High'
                      ? 'high'
                      : 'medium',
                  district: report.district,
                  state: report.state,
                  coordinates: [report.coordinates[0], report.coordinates[1]],
                  latLng: report.gpsCoordinates,
                  roadName: report.location,
                  timestamp: 'Just now',
                  reportedBy: `${report.submittedBy} (${report.reporterAgency})`,
                  status: 'active',
                  description: `${report.description} [Verified from Field Report ${report.id}]`,
                  dispatchedTeams: ['District Response Team 1'],
                  estimatedClearance: '4-8 Hours',
                  affectedVehicles: 0,
                  verificationStatus: 'verified',
                  photoUrl: report.photoUrl,
                };
                const saved = await sbCreateIncident(newIncident);
                setIncidents((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
                setSelectedIncident(saved);
                setActiveNav('incidents');
              }}
            />
          </div>
        ) : activeNav === 'routes' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <RouteIntelligenceView
              onSelectRouteOnMap={(road) => {
                setSelectedRoad(road);
                setActiveNav('command');
              }}
            />
          </div>
        ) : activeNav === 'analytics' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnalyticsView
              onNavigateToCorridor={(corridorCode) => {
                const matchRoad = roads.find((r) => r.routeNumber.includes(corridorCode));
                if (matchRoad) setSelectedRoad(matchRoad);
                setActiveNav('routes');
              }}
            />
          </div>
        ) : activeNav === 'settings' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <SettingsView />
          </div>
        ) : activeNav === 'roles' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <UserManagementView />
          </div>
        ) : (
          /* Command Dashboard Page View */
          <main
            id="vector-dashboard-canvas"
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5 lg:overflow-hidden bg-[#F8FAFC]"
          >
            {/* TOP KPI ROW (Only 4 compact KPI cards) */}
            <section id="kpi-overview-section" className="shrink-0">
              <KpiRow
                activeFilter={kpiFilter}
                onSelectKpiFilter={handleSelectKpi}
                roadAccessibilityPercent={dashboardKpis.roadAccessibilityPercent}
                openKm={dashboardKpis.openNetworkKm}
                activeIncidentsCount={dashboardKpis.activeIncidentsCount}
                criticalIncidentsCount={dashboardKpis.criticalIncidentsCount}
                vehiclesInTransitCount={dashboardKpis.vehiclesInTransitCount}
                delayedVehiclesCount={dashboardKpis.delayedVehiclesCount}
                essentialDeliveriesCount={dashboardKpis.essentialDeliveriesCount}
                onTimeRate={dashboardKpis.onTimeDeliveryRate}
              />
            </section>

            {/* MAIN SECTION: LEFT — LARGE (Regional Operations) | RIGHT — COMPACT (Priority Alerts) */}
            <section
              id="main-operations-section"
              className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-12 min-h-0"
            >
              {/* LEFT — LARGE: Regional Operations GIS Map */}
              <div className="flex flex-col lg:col-span-8 xl:col-span-8 min-h-[380px] lg:min-h-0">
                <RegionalOperationsMap
                  roads={roads}
                  incidents={incidents}
                  vehicles={vehicles}
                  riskZones={riskZones}
                  bridges={bridges}
                  selectedIncident={selectedIncident}
                  selectedVehicle={selectedVehicle}
                  selectedRoad={selectedRoad}
                  selectedBridge={selectedBridge}
                  onSelectIncident={(inc) => {
                    setSelectedIncident(inc);
                    setSelectedVehicle(null);
                    setSelectedRoad(null);
                    setSelectedBridge(null);
                  }}
                  onSelectVehicle={(veh) => {
                    setSelectedVehicle(veh);
                    setSelectedIncident(null);
                    setSelectedRoad(null);
                    setSelectedBridge(null);
                  }}
                  onSelectRoad={(road) => {
                    setSelectedRoad(road);
                    setSelectedIncident(null);
                    setSelectedVehicle(null);
                    setSelectedBridge(null);
                  }}
                  onSelectBridge={(bridge) => {
                    setSelectedBridge(bridge);
                    setSelectedIncident(null);
                    setSelectedVehicle(null);
                    setSelectedRoad(null);
                  }}
                  selectedStateFilter={selectedState}
                />
              </div>

              {/* RIGHT — COMPACT: Priority Alerts */}
              <div className="flex flex-col lg:col-span-4 xl:col-span-4 min-h-[300px] lg:min-h-0">
                <PriorityAlerts
                  alerts={alerts}
                  onSelectAlertOnMap={handleSelectAlertOnMap}
                  onToggleAcknowledge={handleToggleAcknowledge}
                  onViewAllAlerts={() => setActiveNav('alerts')}
                />
              </div>
            </section>

            {/* BOTTOM: District Connectivity & AI Risk Outlook */}
            <section
              id="bottom-intelligence-section"
              className="grid grid-cols-1 gap-3 lg:grid-cols-2 shrink-0 lg:h-[190px]"
            >
              {/* District Connectivity */}
              <DistrictConnectivity
                districts={districts}
                onSelectDistrict={(dist) => {
                  setSelectedState(dist.state);
                }}
                onViewAllDistricts={() => setActiveNav('districts')}
              />

              {/* AI Risk Outlook */}
              <AIRiskOutlook
                outlooks={outlooks}
                onViewFullOutlook={() => setActiveNav('ai-risk')}
                onSelectPrediction={(pred) => {
                  if (pred.title.includes('NH-29')) {
                    const inc = incidents.find((i) => i.roadName.includes('NH-29'));
                    if (inc) setSelectedIncident(inc);
                  } else if (pred.title.includes('Tezpur')) {
                    const ferryInc = incidents.find((i) => i.id === 'inc-05');
                    if (ferryInc) setSelectedIncident(ferryInc);
                  }
                }}
              />
            </section>
          </main>
        )}
      </div>

      {/* Situation Report Modal */}
      <SitrepModal
        isOpen={isSitrepOpen}
        onClose={() => setIsSitrepOpen(false)}
      />

      {/* Emergency Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        onSendBroadcast={handleSendBroadcast}
      />

      {/* Detail Drawer for Selected Entity (Incident, Vehicle, Road, Bridge) */}
      <DetailDrawer
        incident={selectedIncident}
        vehicle={selectedVehicle}
        road={selectedRoad}
        bridge={selectedBridge}
        onClose={() => {
          setSelectedIncident(null);
          setSelectedVehicle(null);
          setSelectedRoad(null);
          setSelectedBridge(null);
        }}
        onOpenBroadcast={() => setIsBroadcastOpen(true)}
        onNavigateToIncidents={() => setActiveNav('incidents')}
      />
    </div>
  );
}
