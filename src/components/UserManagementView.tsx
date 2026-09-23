import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Building2,
  MapPin,
  Lock,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  Radio,
  SlidersHorizontal,
  Search,
  Filter,
  Trash2,
  Edit2,
  LifeBuoy,
  Plus,
  Phone,
  Mail,
  Award,
  Crown,
  CornerDownRight,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  SystemUser,
  UserRole,
  RescueTeam,
  ROLE_HIERARCHY_LEVEL,
  ROLE_DEFINITIONS,
  getCreatableRoles,
} from '../types';

export const UserManagementView: React.FC = () => {
  const {
    currentUser,
    users,
    rescueTeams,
    presets,
    activePresetId,
    switchRolePreset,
    switchUser,
    canManageRole,
    canManageUser,
    canAccessState,
    canAccessDistrict,
    canCreateRole,
    canDispatchRescueTeams,
    isSuperAdmin,
    isStateAdmin,
    isDistrictAdmin,
    isFieldOfficer,
    isRescueTeamMember,
    createUser,
    updateUser,
    deleteUser,
    createRescueTeam,
    updateRescueTeam,
    deleteRescueTeam,
    addMemberToTeam,
    removeMemberFromTeam,
  } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'personnel' | 'teams' | 'matrix'>('hierarchy');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  // Modals & Feedback
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<RescueTeam | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // User form state
  const initialUserState = {
    name: '',
    email: '',
    phone: '',
    role: (getCreatableRoles(currentUser.role)[0] || 'field_officer') as UserRole,
    state: isSuperAdmin ? 'Assam' : currentUser.state,
    district: isDistrictAdmin ? currentUser.district : isStateAdmin ? 'Kamrup' : 'Kamrup',
    department: '',
    designation: '',
    badgeId: '',
    status: 'active' as 'active' | 'on-duty' | 'off-duty' | 'suspended',
  };
  const [userFormData, setUserFormData] = useState(initialUserState);

  // Team form state
  const initialTeamState = {
    name: '',
    state: isSuperAdmin ? 'Assam' : currentUser.state,
    district: isDistrictAdmin ? currentUser.district : 'Kamrup',
    specialization: 'Flood & Water Rescue' as const,
    contactRadio: 'VHF 156.800 MHz',
    equipmentInput: 'Inflatable Boat, Hydraulic Cutter, First Aid Kit',
    baseLocation: '',
    status: 'standby' as const,
  };
  const [teamFormData, setTeamFormData] = useState(initialTeamState);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role Filter
      if (selectedRoleFilter !== 'all' && u.role !== selectedRoleFilter) return false;

      // State Filter
      if (selectedStateFilter !== 'all' && u.state !== selectedStateFilter && u.state !== 'ALL') {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchBadge = u.badgeId.toLowerCase().includes(q);
        const matchDept = u.department.toLowerCase().includes(q);
        const matchRole = ROLE_DEFINITIONS[u.role].label.toLowerCase().includes(q);
        const matchLoc = `${u.district} ${u.state}`.toLowerCase().includes(q);
        return matchName || matchEmail || matchBadge || matchDept || matchRole || matchLoc;
      }
      return true;
    });
  }, [users, selectedRoleFilter, selectedStateFilter, searchQuery]);

  // Handle User Form Submit
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.badgeId) {
      showToast('Name and Badge ID are required.', 'error');
      return;
    }

    if (editingUser) {
      const res = updateUser(editingUser.id, userFormData);
      if (res.success) {
        showToast(res.message, 'success');
        setEditingUser(null);
        setIsAddUserOpen(false);
      } else {
        showToast(res.message, 'error');
      }
    } else {
      const res = createUser(userFormData);
      if (res.success) {
        showToast(res.message, 'success');
        setUserFormData(initialUserState);
        setIsAddUserOpen(false);
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // Handle Team Form Submit
  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormData.name) {
      showToast('Team name is required.', 'error');
      return;
    }

    const equipment = teamFormData.equipmentInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const res = createRescueTeam({
      name: teamFormData.name,
      state: teamFormData.state,
      district: teamFormData.district,
      specialization: teamFormData.specialization,
      contactRadio: teamFormData.contactRadio,
      memberIds: [],
      memberCount: 0,
      status: teamFormData.status,
      equipment,
      baseLocation: teamFormData.baseLocation || `${teamFormData.district} Disaster Response Post`,
    });

    if (res.success) {
      showToast(res.message, 'success');
      setTeamFormData(initialTeamState);
      setIsCreateTeamOpen(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  // Creatable roles for current user
  const creatableRoles = getCreatableRoles(currentUser.role);
  const canCreateAnyUser = creatableRoles.length > 0;

  // State options
  const stateOptions = [
    'Assam',
    'Meghalaya',
    'Nagaland',
    'Manipur',
    'Arunachal Pradesh',
    'Sikkim',
    'Mizoram',
    'Tripura',
  ];

  // Districts by state
  const districtByState: Record<string, string[]> = {
    Assam: ['Kamrup', 'Dhemaji', 'Dima Hasao', 'Sonitpur', 'Cachar', 'Nagaon'],
    Meghalaya: ['East Khasi Hills', 'Ri-Bhoi', 'West Khasi Hills', 'West Garo Hills'],
    Nagaland: ['Dimapur', 'Kohima', 'Mokokchung', 'Tuensang'],
    Manipur: ['Imphal West', 'Noney', 'Churachandpur'],
    'Arunachal Pradesh': ['Lower Dibang Valley', 'Tawang', 'Papum Pare'],
    Sikkim: ['Pakyong', 'Gangtok'],
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[var(--bg-app)]">
      {/* View Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Role Hierarchy & Access Governance
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Hierarchical Multi-Level RBAC • Geographic Boundary Enforcement
                </p>
              </div>
            </div>
          </div>

          {/* Active User Persona Banner */}
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="flex flex-col text-right">
              <div className="flex items-center justify-end space-x-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Active Session
                </span>
                <span
                  className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${
                    ROLE_DEFINITIONS[currentUser.role].badgeClass
                  }`}
                >
                  {ROLE_DEFINITIONS[currentUser.role].label} (Level {ROLE_HIERARCHY_LEVEL[currentUser.role]})
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Scope: {currentUser.state === 'ALL' ? 'All States (Unrestricted)' : `${currentUser.district !== 'ALL' ? `${currentUser.district}, ` : ''}${currentUser.state}`}
              </span>
            </div>

            {/* Quick Switch Dropdown */}
            <div className="border-l border-slate-200 pl-3">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Test Role Switcher
              </label>
              <select
                value={activePresetId}
                onChange={(e) => switchRolePreset(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatarIcon} {p.shortLabel} — {p.scopeBadge}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-4 border-t border-slate-100 pt-3">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'hierarchy'
                ? 'bg-blue-50 text-blue-800 shadow-2xs border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Interactive Hierarchy Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('personnel')}
            className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'personnel'
                ? 'bg-blue-50 text-blue-800 shadow-2xs border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Personnel Directory ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'teams'
                ? 'bg-blue-50 text-blue-800 shadow-2xs border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LifeBuoy className="h-3.5 w-3.5 text-blue-600" />
            <span>Rescue Teams & Field Squads ({rescueTeams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'matrix'
                ? 'bg-blue-50 text-blue-800 shadow-2xs border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
            <span>Permissions Matrix</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between px-6 py-2.5 text-xs font-medium border-b transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: INTERACTIVE ROLE HIERARCHY TREE */}
        {/* ========================================================================= */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Hierarchy Rule Callout */}
            <div className="rounded-xl border border-blue-200 bg-linear-to-r from-blue-50/80 to-slate-50 p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
                      CORE GOVERNANCE RULE
                    </span>
                    <span className="rounded bg-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                      Strict Downward Delegation Only
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    A user can only create, edit, assign, or delete users/roles strictly below their own hierarchy level.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    Administrative authority and geographic boundaries are mutually enforced: an Assam State Admin cannot govern Meghalaya; a Kamrup District Admin is bounded strictly to Kamrup.
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end text-xs font-mono">
                  <span className="text-slate-500">Your Current Level</span>
                  <span className="text-lg font-bold text-blue-700">
                    Rank {ROLE_HIERARCHY_LEVEL[currentUser.role]} of 5
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Tree Graph */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Command Hierarchy Architecture
                </h3>
                <span className="text-xs text-slate-400">
                  Green outlines indicate roles you can govern • Red outlines indicate protected tiers
                </span>
              </div>

              {/* Tiers Stack */}
              <div className="space-y-3 relative">
                {/* Connecting backbone line */}
                <div className="absolute top-8 bottom-8 left-[39px] w-0.5 bg-slate-200 -z-0" />

                {(
                  [
                    'super_admin',
                    'state_admin',
                    'district_admin',
                    'field_officer',
                    'rescue_team_member',
                  ] as UserRole[]
                ).map((roleKey, idx) => {
                  const def = ROLE_DEFINITIONS[roleKey];
                  const isCurrent = currentUser.role === roleKey;
                  const isBelow = ROLE_HIERARCHY_LEVEL[currentUser.role] > def.rank;
                  const isAbove = ROLE_HIERARCHY_LEVEL[currentUser.role] < def.rank;
                  const isSame = ROLE_HIERARCHY_LEVEL[currentUser.role] === def.rank;

                  return (
                    <div
                      key={roleKey}
                      className={`relative z-10 flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4 transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : isBelow
                          ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                          : 'border-slate-200 bg-slate-50/60 opacity-90'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Rank Badge */}
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-base font-bold font-mono shadow-2xs ${
                            isCurrent
                              ? 'bg-blue-600 text-white border-blue-700'
                              : isBelow
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          L{def.rank}
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">{def.label}</span>
                            {isCurrent && (
                              <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white font-mono uppercase">
                                YOU ARE HERE
                              </span>
                            )}
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-semibold font-mono ${def.badgeClass}`}
                            >
                              Scope: {def.accessScope}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 max-w-2xl">{def.description}</p>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-0.5">
                            <span className="font-medium text-slate-700">
                              Can Create / Manage:
                            </span>
                            <span className="text-slate-600">{def.manageableScope}</span>
                          </div>
                        </div>
                      </div>

                      {/* Authority Relationship Tag */}
                      <div className="mt-3 md:mt-0 flex items-center space-x-2 shrink-0">
                        {isCurrent ? (
                          <div className="flex items-center space-x-1.5 rounded-md bg-blue-100 border border-blue-300 px-2.5 py-1 text-xs font-semibold text-blue-900">
                            <Crown className="h-3.5 w-3.5 text-blue-700" />
                            <span>Active Level</span>
                          </div>
                        ) : isBelow ? (
                          <div className="flex items-center space-x-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>You Can Manage</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <Lock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{isSame ? 'Equal Rank (Protected)' : 'Higher Tier (Protected)'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic Boundary Case Study */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <MapPin className="h-4 w-4 text-rose-600" />
                  <span>Geographic Isolation Example</span>
                </div>
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-purple-700 font-bold">Super Admin (All States)</div>
                  <div className="pl-4 text-blue-700">↓ State Admin — Assam</div>
                  <div className="pl-8 text-emerald-700">↓ District Admin — Kamrup</div>
                  <div className="pl-12 text-amber-700">↓ Field Officer — Kamrup</div>
                  <div className="pl-16 text-rose-700">↓ Rescue Team — SDRF Unit 1 Kamrup</div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  An <strong>Assam State Admin</strong> has full administrative control within Assam, but cannot touch Meghalaya, Nagaland, or Sikkim.
                  Similarly, a <strong>Kamrup District Admin</strong> can dispatch officers and rescue teams inside Kamrup, but cannot modify Dhemaji or East Khasi Hills.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>State Admin vs Super Admin</span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="rounded-md border border-slate-200 p-2 bg-slate-50">
                    <span className="font-bold text-slate-900 block">Super Admin (Rank 5)</span>
                    Full system access across all 8 North Eastern states. Can create State Admins, District Admins, Field Officers, and Rescue Teams anywhere.
                  </div>
                  <div className="rounded-md border border-slate-200 p-2 bg-slate-50">
                    <span className="font-bold text-slate-900 block">State Admin (Rank 4)</span>
                    Full administrative control within their state only. Can create District Admins, Field Officers, and Rescue Teams in their state. Cannot modify Super Admin or other states.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PERSONNEL DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'personnel' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Top Toolbar: Search & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search personnel, badge, dept..."
                    className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs hover:border-slate-300"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="state_admin">State Admin</option>
                  <option value="district_admin">District Admin</option>
                  <option value="field_officer">Field Officer</option>
                  <option value="rescue_team_member">Rescue Team Member</option>
                </select>

                {/* State Filter */}
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs hover:border-slate-300"
                >
                  <option value="all">All States</option>
                  {stateOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Personnel Button */}
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserFormData(initialUserState);
                  setIsAddUserOpen(true);
                }}
                disabled={!canCreateAnyUser}
                title={
                  !canCreateAnyUser
                    ? 'Your role does not have permission to create administrative personnel.'
                    : 'Add personnel below your hierarchy rank'
                }
                className={`flex items-center space-x-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
                  canCreateAnyUser
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Personnel</span>
              </button>
            </div>

            {/* Personnel Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                    <tr>
                      <th className="px-4 py-3">Personnel</th>
                      <th className="px-4 py-3">Hierarchy Tier</th>
                      <th className="px-4 py-3">Jurisdiction</th>
                      <th className="px-4 py-3">Department & Title</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions & Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const def = ROLE_DEFINITIONS[u.role];
                      const isSelf = u.id === currentUser.id;
                      const hasManagementAuth = canManageUser(u);

                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors hover:bg-slate-50/60 ${
                            isSelf ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          {/* Name & Badge */}
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-xs border border-slate-200">
                                {u.name.charAt(0)}
                              </div>
                              <div className="flex flex-col truncate">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-slate-900 truncate max-w-[180px]">
                                    {u.name}
                                  </span>
                                  {isSelf && (
                                    <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-800 font-mono">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {u.badgeId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role & Rank */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${def.badgeClass}`}
                            >
                              L{def.rank} • {def.label}
                            </span>
                          </td>

                          {/* Jurisdiction */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800">
                                {u.state === 'ALL' ? 'All States (NER)' : u.state}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {u.district === 'ALL' ? 'All Districts' : u.district}
                              </span>
                            </div>
                          </td>

                          {/* Department & Designation */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col truncate max-w-[220px]">
                              <span className="truncate font-medium text-slate-900">
                                {u.designation}
                              </span>
                              <span className="truncate text-[10px] text-slate-500">
                                {u.department}
                              </span>
                              {u.assignedTeamName && (
                                <span className="text-[10px] text-emerald-700 font-medium">
                                  Team: {u.assignedTeamName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium capitalize ${
                                u.status === 'active' || u.status === 'on-duty'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>

                          {/* Actions & Governance */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Switch test persona button */}
                              <button
                                onClick={() => switchUser(u.id)}
                                title={`Switch active session to ${u.name}`}
                                className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-colors"
                              >
                                Test As
                              </button>

                              {/* Authorized Edit / Delete vs Protected */}
                              {hasManagementAuth ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setUserFormData({
                                        name: u.name,
                                        email: u.email,
                                        phone: u.phone,
                                        role: u.role,
                                        state: u.state,
                                        district: u.district,
                                        department: u.department,
                                        designation: u.designation,
                                        badgeId: u.badgeId,
                                        status: u.status,
                                      });
                                      setIsAddUserOpen(true);
                                    }}
                                    className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                                    title="Edit Personnel Record"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Are you sure you want to remove ${u.name} (${def.label}) from the system?`
                                        )
                                      ) {
                                        const res = deleteUser(u.id);
                                        if (res.success) {
                                          showToast(res.message, 'success');
                                        } else {
                                          showToast(res.message, 'error');
                                        }
                                      }
                                    }}
                                    className="rounded border border-slate-200 bg-white p-1 text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-2xs"
                                    title="Remove Personnel"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              ) : (
                                <div
                                  className="flex items-center space-x-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200/80"
                                  title={
                                    isSelf
                                      ? 'Cannot perform management actions on current user'
                                      : ROLE_HIERARCHY_LEVEL[u.role] >= ROLE_HIERARCHY_LEVEL[currentUser.role]
                                      ? 'Protected: Equal or higher hierarchy rank'
                                      : 'Protected: Outside your geographic jurisdiction'
                                  }
                                >
                                  <Lock className="h-3 w-3 text-slate-400" />
                                  <span>Protected</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RESCUE TEAMS & FIELD SQUADS (DISTRICT ADMIN RESPONSIBILITY) */}
        {/* ========================================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-5 max-w-6xl mx-auto">
            {/* Top District Admin Operations Banner */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <LifeBuoy className="h-4 w-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider font-mono">
                      District Field Operations Mandate
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    The District Admin is specifically responsible for establishing Rescue Teams, maintaining member rosters, managing specialized equipment, and deploying units to live district emergencies.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setTeamFormData(initialTeamState);
                    setIsCreateTeamOpen(true);
                  }}
                  disabled={!canDispatchRescueTeams}
                  title={
                    !canDispatchRescueTeams
                      ? 'Requires District Admin or higher privileges to establish rescue teams'
                      : 'Establish a new vetted rescue squad'
                  }
                  className={`flex items-center space-x-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors shrink-0 ${
                    canDispatchRescueTeams
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Establish Rescue Team</span>
                </button>
              </div>
            </div>

            {/* Rescue Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rescueTeams.map((team) => {
                const canManageThisTeam = canAccessDistrict(team.state, team.district) && canDispatchRescueTeams;

                return (
                  <div
                    key={team.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-semibold uppercase text-slate-400">
                            {team.state} • {team.district}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {team.name}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold font-mono uppercase ${
                            team.status === 'deployed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : team.status === 'standby'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {team.status}
                        </span>
                      </div>

                      {/* Specialization & Radio */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">Specialization:</span>
                          <span className="font-semibold text-slate-800">
                            {team.specialization}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">Tactical Radio:</span>
                          <span className="font-mono font-medium text-slate-800">
                            {team.contactRadio}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">Lead Commander:</span>
                          <span className="font-medium text-slate-800">
                            {team.leadOfficerName || 'Not Assigned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <span className="text-slate-400">Active Members:</span>
                          <span className="font-bold text-slate-900">
                            {team.memberCount} Personnel
                          </span>
                        </div>
                        {team.currentIncidentCode && (
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-rose-700">
                            <span>Deployed To Incident:</span>
                            <span className="font-mono font-bold">
                              {team.currentIncidentCode}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Equipment List */}
                      <div className="mt-3">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                          Equipment Manifest
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {team.equipment.map((eq, i) => (
                            <span
                              key={i}
                              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700 font-medium"
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Team Actions */}
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      {canManageThisTeam ? (
                        <div className="flex items-center space-x-2 w-full justify-between">
                          <button
                            onClick={() => setSelectedTeamForMembers(team)}
                            className="flex items-center space-x-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Manage Roster ({team.memberIds.length})</span>
                          </button>

                          <div className="flex items-center space-x-1">
                            <select
                              value={team.status}
                              onChange={(e) =>
                                updateRescueTeam(team.id, {
                                  status: e.target.value as RescueTeam['status'],
                                })
                              }
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs"
                            >
                              <option value="standby">Standby</option>
                              <option value="deployed">Deployed</option>
                              <option value="transit">In Transit</option>
                              <option value="rest">Stand Down</option>
                            </select>

                            <button
                              onClick={() => {
                                if (confirm(`Disband ${team.name}?`)) {
                                  deleteRescueTeam(team.id);
                                }
                              }}
                              className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Disband Team"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                          <Lock className="h-3 w-3" />
                          <span>Outside your administrative jurisdiction</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PERMISSIONS MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  Multi-Tier Role Governance & Capability Matrix
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                    <tr>
                      <th className="px-4 py-3">Capability / Responsibility</th>
                      <th className="px-4 py-3 text-purple-700">Super Admin (L5)</th>
                      <th className="px-4 py-3 text-blue-700">State Admin (L4)</th>
                      <th className="px-4 py-3 text-emerald-700">District Admin (L3)</th>
                      <th className="px-4 py-3 text-amber-700">Field Officer (L2)</th>
                      <th className="px-4 py-3 text-rose-700">Rescue Member (L1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Geographic Jurisdiction
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">All 8 NE States</td>
                      <td className="px-4 py-3 font-mono text-[11px]">Assigned State Only</td>
                      <td className="px-4 py-3 font-mono text-[11px]">Assigned District Only</td>
                      <td className="px-4 py-3 font-mono text-[11px]">Assigned Sector/Incident</td>
                      <td className="px-4 py-3 font-mono text-[11px]">Assigned Team Tasks</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Can Create / Manage State Admins
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES ✓</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Can Create / Manage District Admins
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES ✓</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES (State Only) ✓</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Can Create / Manage Field Officers
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES ✓</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES (State Only) ✓</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES (District Only) ✓</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Can Create Rescue Teams & Add Members
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES ✓</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES (State Only) ✓</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">YES (Primary Mandate) ✓</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                      <td className="px-4 py-3 text-rose-600">NO ✕</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Incident & Squad Dispatch
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">Unrestricted</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">Statewide Convoys</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">District Incidents</td>
                      <td className="px-4 py-3 text-slate-600">On-Scene Recon Only</td>
                      <td className="px-4 py-3 text-slate-600">Tactical Action Only</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Emergency Telemetry Broadcast
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">Regional Broadcast</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">State Broadcast</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">District Broadcast</td>
                      <td className="px-4 py-3 text-rose-600">Unauthorized ✕</td>
                      <td className="px-4 py-3 text-rose-600">Unauthorized ✕</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PERSONNEL */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setIsAddUserOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingUser ? `Edit ${editingUser.name}` : 'Provision New Personnel'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-3.5">
              {/* Hierarchy Notice */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900 font-medium">
                Acting as <strong>{ROLE_DEFINITIONS[currentUser.role].label}</strong>: You can only assign roles strictly below Level {ROLE_HIERARCHY_LEVEL[currentUser.role]}.
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Assign Hierarchy Role *
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, role: e.target.value as UserRole })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  {creatableRoles.map((r) => (
                    <option key={r} value={r}>
                      Level {ROLE_HIERARCHY_LEVEL[r]} — {ROLE_DEFINITIONS[r].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, name: e.target.value })
                    }
                    placeholder="e.g. Insp. Tarun Kalita"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Official Badge ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.badgeId}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, badgeId: e.target.value })
                    }
                    placeholder="e.g. FO-ASM-KMP-305"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* State & District (Scoping) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Assigned State {isStateAdmin || isDistrictAdmin ? '(Locked)' : '*'}
                  </label>
                  {isSuperAdmin ? (
                    <select
                      value={userFormData.state}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          state: e.target.value,
                          district: districtByState[e.target.value]?.[0] || 'Kamrup',
                        })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                    >
                      {stateOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={currentUser.state}
                      className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Assigned District {isDistrictAdmin ? '(Locked)' : '*'}
                  </label>
                  {isDistrictAdmin ? (
                    <input
                      type="text"
                      disabled
                      value={currentUser.district}
                      className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={userFormData.district}
                      onChange={(e) =>
                        setUserFormData({ ...userFormData, district: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                    >
                      {(districtByState[userFormData.state] || ['Kamrup']).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Department / Agency
                  </label>
                  <input
                    type="text"
                    value={userFormData.department}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, department: e.target.value })
                    }
                    placeholder="e.g. DEOC Kamrup / SDRF"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Official Designation
                  </label>
                  <input
                    type="text"
                    value={userFormData.designation}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, designation: e.target.value })
                    }
                    placeholder="e.g. Quick Response Commander"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, email: e.target.value })
                    }
                    placeholder="officer@vector.gov.in"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={userFormData.phone}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, phone: e.target.value })
                    }
                    placeholder="+91 98640-XXXXX"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs"
                >
                  {editingUser ? 'Save Changes' : 'Confirm Provisioning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ESTABLISH RESCUE TEAM (DISTRICT ADMIN RESPONSIBILITY) */}
      {/* ========================================================================= */}
      {isCreateTeamOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setIsCreateTeamOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <LifeBuoy className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Establish District Rescue Team
                </h3>
              </div>
              <button
                onClick={() => setIsCreateTeamOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTeamSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  placeholder="e.g. SDRF Water Rescue Unit Charlie — Kamrup"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Specialization
                  </label>
                  <select
                    value={teamFormData.specialization}
                    onChange={(e) =>
                      setTeamFormData({
                        ...teamFormData,
                        specialization: e.target.value as any,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  >
                    <option value="Flood & Water Rescue">Flood & Water Rescue</option>
                    <option value="Landslide & Mountain SAR">Landslide & Mountain SAR</option>
                    <option value="Urban Search & Heavy Extrication">
                      Urban Search & Heavy Extrication
                    </option>
                    <option value="Medical Trauma & Evacuation">
                      Medical Trauma & Evacuation
                    </option>
                    <option value="Road Clearance & Hazardous Debris">
                      Road Clearance & Debris
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Tactical Radio Frequency
                  </label>
                  <input
                    type="text"
                    value={teamFormData.contactRadio}
                    onChange={(e) =>
                      setTeamFormData({ ...teamFormData, contactRadio: e.target.value })
                    }
                    placeholder="VHF 156.800 MHz"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    State {isStateAdmin || isDistrictAdmin ? '(Locked)' : ''}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={isSuperAdmin ? teamFormData.state : currentUser.state}
                    className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    District {isDistrictAdmin ? '(Locked)' : ''}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={isDistrictAdmin ? currentUser.district : teamFormData.district}
                    className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Equipment Manifest (comma separated)
                </label>
                <input
                  type="text"
                  value={teamFormData.equipmentInput}
                  onChange={(e) =>
                    setTeamFormData({ ...teamFormData, equipmentInput: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                >
                  Establish Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE TEAM ROSTER (ADD / REMOVE RESCUE MEMBERS) */}
      {/* ========================================================================= */}
      {selectedTeamForMembers && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedTeamForMembers(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] text-slate-400 uppercase">
                  {selectedTeamForMembers.district} • {selectedTeamForMembers.state}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Roster: {selectedTeamForMembers.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeamForMembers(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Members */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Assigned Team Members ({selectedTeamForMembers.memberIds.length})
              </span>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50">
                {selectedTeamForMembers.memberIds.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No members currently assigned to this squad.
                  </div>
                ) : (
                  selectedTeamForMembers.memberIds.map((mId) => {
                    const u = users.find((user) => user.id === mId);
                    return (
                      <div
                        key={mId}
                        className="flex items-center justify-between px-3.5 py-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {u ? u.name : mId}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {u ? `${u.badgeId} • ${u.designation}` : 'Rescue Tech'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            removeMemberFromTeam(selectedTeamForMembers.id, mId);
                            // Refresh local modal selection state
                            setSelectedTeamForMembers((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    memberIds: prev.memberIds.filter((id) => id !== mId),
                                    memberCount: Math.max(0, prev.memberCount - 1),
                                  }
                                : null
                            );
                          }}
                          className="rounded border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add Member Dropdown */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Assign Available Rescue Member
              </span>
              <div className="flex items-center space-x-2">
                <select
                  id="add-member-select"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                >
                  <option value="">Select available personnel...</option>
                  {users
                    .filter(
                      (u) =>
                        (u.role === 'rescue_team_member' || u.role === 'field_officer') &&
                        !selectedTeamForMembers.memberIds.includes(u.id) &&
                        (isSuperAdmin ||
                          (u.state.toLowerCase() === selectedTeamForMembers.state.toLowerCase() &&
                            u.district.toLowerCase() === selectedTeamForMembers.district.toLowerCase()))
                    )
                    .map((avail) => (
                      <option key={avail.id} value={avail.id}>
                        {avail.name} ({avail.badgeId} • {avail.designation})
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    const sel = document.getElementById(
                      'add-member-select'
                    ) as HTMLSelectElement;
                    if (sel && sel.value) {
                      addMemberToTeam(selectedTeamForMembers.id, sel.value);
                      setSelectedTeamForMembers((prev) =>
                        prev
                          ? {
                              ...prev,
                              memberIds: [...prev.memberIds, sel.value],
                              memberCount: prev.memberCount + 1,
                            }
                          : null
                      );
                      sel.value = '';
                    }
                  }}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
