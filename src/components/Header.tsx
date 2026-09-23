import React, { useState } from 'react';
import {
  Download,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  Radio,
  Lock,
  ChevronRight,
  LogOut,
  Database,
} from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFINITIONS, ROLE_HIERARCHY_LEVEL } from '../types';
import { isSupabaseLiveConfigured } from '../lib/supabase';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  selectedState: string;
  onSelectState: (state: string) => void;
  onOpenSitrep: () => void;
  onOpenBroadcast: () => void;
  lastSyncTime: string;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onNavigateToRoles?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Command Dashboard',
  subtitle = 'North Eastern Region • Live operational overview',
  selectedState,
  onSelectState,
  onOpenSitrep,
  onOpenBroadcast,
  lastSyncTime,
  isSyncing,
  onTriggerSync,
  onNavigateToRoles,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const {
    currentUser,
    presets,
    activePresetId,
    switchRolePreset,
    isSuperAdmin,
    canBroadcastEmergency,
    logout,
  } = useAuth();

  const stateOptions = [
    { id: 'all', label: 'North Eastern Region (All 8)' },
    { id: 'Assam', label: 'Assam' },
    { id: 'Meghalaya', label: 'Meghalaya' },
    { id: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
    { id: 'Nagaland', label: 'Nagaland' },
    { id: 'Manipur', label: 'Manipur' },
    { id: 'Mizoram', label: 'Mizoram' },
    { id: 'Tripura', label: 'Tripura' },
    { id: 'Sikkim', label: 'Sikkim' },
  ];

  // Check if a state is geographically accessible by current role
  const isStateAllowed = (stateId: string) => {
    if (isSuperAdmin) return true;
    if (stateId === 'all') return false; // Non-super admins cannot view regional all-8 aggregate
    return currentUser.state.toLowerCase() === stateId.toLowerCase();
  };

  return (
    <header
      id="vector-command-header"
      className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between shrink-0 select-none shadow-2xs"
    >
      {/* Title and Scope */}
      <div className="flex items-center space-x-3">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-snug">
            {title}
          </h1>
          <p className="text-xs text-slate-500 leading-tight">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Role Badge/Switcher, Theme selector, Region selector, Sync, SITREP, Broadcast */}
      <div className="flex items-center space-x-2">
        {/* Active Role Switcher Pill */}
        <div className="relative">
          <button
            id="header-role-switcher-btn"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex h-8 items-center space-x-1.5 rounded-md border border-slate-200 bg-slate-50/80 px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-2xs"
            title="Click to switch simulated role / view hierarchy"
          >
            <span className="text-xs">
              {currentUser.role === 'super_admin'
                ? '👑'
                : currentUser.role === 'state_admin'
                ? '🏛️'
                : currentUser.role === 'district_admin'
                ? '🏢'
                : currentUser.role === 'field_officer'
                ? '🦺'
                : '⛑️'}
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-900 uppercase">
              {ROLE_DEFINITIONS[currentUser.role].label}
            </span>
            {currentUser.state !== 'ALL' && (
              <span className="rounded bg-slate-200/80 px-1 py-0.2 text-[9px] text-slate-700 font-medium">
                {currentUser.district !== 'ALL' ? currentUser.district : currentUser.state}
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {roleSwitcherOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
              <div className="border-b border-slate-100 px-3.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Simulate Hierarchy Persona
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 font-mono">
                    Rank {ROLE_HIERARCHY_LEVEL[currentUser.role]} / 5
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-800 mt-0.5">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {currentUser.designation}
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {presets.map((preset) => {
                  const isActive = preset.id === activePresetId;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        switchRolePreset(preset.id);
                        setRoleSwitcherOpen(false);
                        // Auto-adjust state filter if switching to state/district admin
                        if (preset.user.state !== 'ALL') {
                          onSelectState(preset.user.state);
                        }
                      }}
                      className={`flex w-full items-start space-x-2.5 px-3.5 py-2 text-left transition-colors hover:bg-slate-50 ${
                        isActive ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <span className="text-base leading-tight shrink-0 mt-0.5">
                        {preset.avatarIcon}
                      </span>
                      <div className="flex-1 truncate">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isActive ? 'text-blue-950' : 'text-slate-900'
                            }`}
                          >
                            {preset.shortLabel}
                          </span>
                          {isActive && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block leading-tight">
                          {preset.scopeBadge}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1 leading-tight mt-0.5">
                          {preset.keyCapability}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {onNavigateToRoles && (
                <div className="border-t border-slate-100 p-1.5 bg-slate-50/50">
                  <button
                    onClick={() => {
                      setRoleSwitcherOpen(false);
                      onNavigateToRoles();
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100/60 transition-colors"
                  >
                    <span>Open Roles & Access Governance</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme / Background Color Selector */}
        <ThemeSelector />

        {/* Region Selector Dropdown with Geographic Enforcement */}
        <div className="relative">
          <button
            id="sector-filter-dropdown"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-8 items-center space-x-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <span className="truncate max-w-[170px]">
              {selectedState === 'all'
                ? 'North Eastern Region'
                : selectedState}
            </span>
            {!isSuperAdmin && (
              <span className="rounded bg-amber-50 text-amber-800 text-[9px] font-bold font-mono px-1">
                LOCKED
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {isSuperAdmin
                  ? 'Select Regional Jurisdiction'
                  : `Jurisdiction Bounded: ${currentUser.state}`}
              </div>
              {stateOptions.map((opt) => {
                const allowed = isStateAllowed(opt.id);

                return (
                  <button
                    key={opt.id}
                    disabled={!allowed}
                    onClick={() => {
                      if (allowed) {
                        onSelectState(opt.id);
                        setDropdownOpen(false);
                      }
                    }}
                    title={
                      !allowed
                        ? `Restricted: Your active role (${ROLE_DEFINITIONS[currentUser.role].label}) is bound to ${currentUser.state}`
                        : undefined
                    }
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                      !allowed
                        ? 'opacity-40 bg-slate-50 cursor-not-allowed text-slate-400'
                        : selectedState === opt.id
                        ? 'bg-blue-50/70 font-semibold text-blue-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      {!allowed && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
                      <span>{opt.label}</span>
                    </div>
                    {selectedState === opt.id && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sync Button */}
        <button
          id="sync-telemetry-btn"
          onClick={onTriggerSync}
          disabled={isSyncing}
          className="flex h-8 items-center space-x-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-colors shadow-2xs"
          title={`Last sync: ${lastSyncTime}`}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`}
          />
          <span className="text-xs font-medium">Sync</span>
        </button>

        {/* SITREP Button */}
        <button
          id="open-sitrep-modal-btn"
          onClick={onOpenSitrep}
          className="flex h-8 items-center space-x-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-2xs"
        >
          <Download className="h-3.5 w-3.5 text-slate-600" />
          <span>SITREP</span>
        </button>

        {/* Broadcast Button with RBAC Protection */}
        <button
          id="open-broadcast-modal-btn"
          onClick={onOpenBroadcast}
          disabled={!canBroadcastEmergency}
          className={`flex h-8 items-center space-x-1.5 rounded-md border px-2.5 text-xs transition-colors shadow-2xs ${
            canBroadcastEmergency
              ? 'border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          title={
            !canBroadcastEmergency
              ? 'Emergency broadcast requires District Admin or higher privileges'
              : 'Emergency broadcast telemetry'
          }
        >
          <Radio className={`h-3.5 w-3.5 ${canBroadcastEmergency ? 'text-slate-500' : 'text-slate-400'}`} />
          <span className="text-xs font-medium">Broadcast</span>
        </button>

        {/* Supabase Realtime Status Pill */}
        <div
          title="Supabase Database & Realtime Connection: Synchronized"
          className="hidden xl:flex h-8 items-center space-x-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 px-2 text-[11px] font-medium text-emerald-800 shadow-2xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[10px] font-bold">Supabase</span>
        </div>

        {/* Logout Button */}
        <button
          id="header-logout-btn"
          onClick={() => {
            if (window.confirm('Log out from VECTOR Command Terminal?')) {
              logout();
            }
          }}
          className="flex h-8 items-center space-x-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors shadow-2xs"
          title={`Log Out (${currentUser.name})`}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Logout</span>
        </button>
      </div>
    </header>

  );
};
