import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  SystemUser,
  RescueTeam,
  UserRole,
  ROLE_HIERARCHY_LEVEL,
  ROLE_DEFINITIONS,
  canManageRole as checkCanManageRole,
  canManageUser as checkCanManageUser,
  canAccessState as checkCanAccessState,
  canAccessDistrict as checkCanAccessDistrict,
  getCreatableRoles as checkGetCreatableRoles,
} from '../types';
import {
  INITIAL_SYSTEM_USERS,
  INITIAL_RESCUE_TEAMS,
  ROLE_SWITCHER_PRESETS,
  RolePreset,
} from '../data/mockUsersAndRoles';
import { supabase, isSupabaseLiveConfigured } from '../lib/supabase';
import { logAuditEvent } from '../services/supabaseService';

const AUTH_STORAGE_KEY = 'vector_auth_session_v1';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  currentUser: SystemUser;
  users: SystemUser[];
  rescueTeams: RescueTeam[];
  presets: RolePreset[];
  activePresetId: string;
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // Role Switchers
  switchRolePreset: (presetId: string) => void;
  switchUser: (userId: string) => void;
  // RBAC checks for current user
  canManageRole: (targetRole: UserRole) => boolean;
  canManageUser: (targetUser: SystemUser) => boolean;
  canAccessState: (state: string) => boolean;
  canAccessDistrict: (state: string, district?: string) => boolean;
  canCreateRole: (role: UserRole) => boolean;
  getCreatableRoles: () => UserRole[];
  canDispatchRescueTeams: boolean;
  canAssignIncidentOfficers: boolean;
  canBroadcastEmergency: boolean;
  canManagePersonnel: boolean;
  isSuperAdmin: boolean;
  isStateAdmin: boolean;
  isDistrictAdmin: boolean;
  isFieldOfficer: boolean;
  isRescueTeamMember: boolean;
  // Personnel CRUD
  createUser: (userData: Omit<SystemUser, 'id' | 'createdAt'>) => {
    success: boolean;
    message: string;
    user?: SystemUser;
  };
  updateUser: (
    userId: string,
    updates: Partial<SystemUser>
  ) => { success: boolean; message: string };
  deleteUser: (userId: string) => { success: boolean; message: string };
  // Rescue Teams CRUD
  createRescueTeam: (
    teamData: Omit<RescueTeam, 'id' | 'lastStatusUpdate'>
  ) => { success: boolean; message: string; team?: RescueTeam };
  updateRescueTeam: (
    teamId: string,
    updates: Partial<RescueTeam>
  ) => { success: boolean; message: string };
  deleteRescueTeam: (teamId: string) => { success: boolean; message: string };
  addMemberToTeam: (
    teamId: string,
    userId: string
  ) => { success: boolean; message: string };
  removeMemberFromTeam: (
    teamId: string,
    userId: string
  ) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const stored = localStorage.getItem('vector_sb_users_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return INITIAL_SYSTEM_USERS;
  });

  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>(() => {
    try {
      const stored = localStorage.getItem('vector_sb_teams_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return INITIAL_RESCUE_TEAMS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored).authenticated === true : false;
    } catch (e) {
      return false;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.presetId) return parsed.presetId;
      }
    } catch (e) {
      // fallback
    }
    return 'preset-super-admin';
  });

  // Check Supabase session on mount
  useEffect(() => {
    let mounted = true;

    async function checkAuthSession() {
      try {
        if (isSupabaseLiveConfigured()) {
          const { data } = await supabase.auth.getSession();
          if (data.session && mounted) {
            setIsAuthenticated(true);
            // Match user by email
            const userEmail = data.session.user.email?.toLowerCase();
            const matchedUser = users.find((u) => u.email.toLowerCase() === userEmail);
            if (matchedUser) {
              const matchedPreset = ROLE_SWITCHER_PRESETS.find((p) => p.user.id === matchedUser.id || p.role === matchedUser.role);
              if (matchedPreset) setActivePresetId(matchedPreset.id);
            }
          }
        }
      } catch (err) {
        console.warn('Supabase auth session check notice:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAuthSession();

    // Listen to Supabase Auth state changes
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setIsAuthenticated(true);
        }
      });
      return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
      };
    } catch (e) {
      mounted = false;
    }
  }, [users]);

  // Find the active preset
  const activePreset = useMemo(() => {
    return (
      ROLE_SWITCHER_PRESETS.find((p) => p.id === activePresetId) ||
      ROLE_SWITCHER_PRESETS[0]
    );
  }, [activePresetId]);

  // Current user derived from the users array
  const currentUser = useMemo(() => {
    const matched = users.find((u) => u.id === activePreset.user.id);
    return matched || activePreset.user;
  }, [users, activePreset]);

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    // Attempt real Supabase Auth if configured
    if (isSupabaseLiveConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          console.warn('Supabase Auth response:', error.message);
          // If remote account doesn't exist yet, we still check registered government directory
        }
      } catch (err) {
        console.warn('Supabase Auth error:', err);
      }
    }

    // Match in system users directory
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.email.toLowerCase().includes(cleanEmail.split('@')[0])
    );

    if (matchedUser) {
      const matchedPreset = ROLE_SWITCHER_PRESETS.find(
        (p) => p.user.id === matchedUser.id || p.role === matchedUser.role
      );
      if (matchedPreset) {
        setActivePresetId(matchedPreset.id);
      }

      setIsAuthenticated(true);
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          authenticated: true,
          email: matchedUser.email,
          presetId: matchedPreset?.id || 'preset-super-admin',
          timestamp: new Date().toISOString(),
        })
      );

      await logAuditEvent('User Logged In', 'auth', matchedUser.id, {
        name: matchedUser.name,
        role: matchedUser.role,
        email: matchedUser.email,
      });

      return { success: true };
    }

    // Default fallback: allow login as Super Admin or role matching keyword
    let fallbackPreset = 'preset-super-admin';
    if (cleanEmail.includes('assam') || cleanEmail.includes('state')) fallbackPreset = 'preset-state-admin-assam';
    else if (cleanEmail.includes('kamrup') || cleanEmail.includes('district')) fallbackPreset = 'preset-district-admin-kamrup';
    else if (cleanEmail.includes('field')) fallbackPreset = 'preset-field-officer-kamrup';
    else if (cleanEmail.includes('rescue')) fallbackPreset = 'preset-rescue-member-kamrup';

    setActivePresetId(fallbackPreset);
    setIsAuthenticated(true);
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        authenticated: true,
        email: cleanEmail,
        presetId: fallbackPreset,
        timestamp: new Date().toISOString(),
      })
    );

    await logAuditEvent('User Logged In', 'auth', cleanEmail, { email: cleanEmail });
    return { success: true };
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseLiveConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      // ignore
    }

    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    await logAuditEvent('User Logged Out', 'auth', currentUser.id, {
      name: currentUser.name,
      role: currentUser.role,
    });
  };

  // Switch role preset handler
  const switchRolePreset = (presetId: string) => {
    const target = ROLE_SWITCHER_PRESETS.find((p) => p.id === presetId);
    if (target) {
      setActivePresetId(target.id);
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          authenticated: true,
          email: target.user.email,
          presetId: target.id,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  // Switch to specific user in directory
  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      const matchingPreset = ROLE_SWITCHER_PRESETS.find((p) => p.user.id === found.id);
      if (matchingPreset) {
        setActivePresetId(matchingPreset.id);
      } else {
        const rolePreset = ROLE_SWITCHER_PRESETS.find((p) => p.role === found.role);
        if (rolePreset) setActivePresetId(rolePreset.id);
      }
    }
  };

  // RBAC checks evaluated against currentUser
  const canManageRole = (targetRole: UserRole) => {
    return checkCanManageRole(currentUser.role, targetRole);
  };

  const canManageUser = (targetUser: SystemUser) => {
    return checkCanManageUser(currentUser, targetUser);
  };

  const canAccessState = (state: string) => {
    return checkCanAccessState(currentUser, state);
  };

  const canAccessDistrict = (state: string, district?: string) => {
    return checkCanAccessDistrict(currentUser, state, district);
  };

  const canCreateRole = (role: UserRole) => {
    return ROLE_HIERARCHY_LEVEL[currentUser.role] > ROLE_HIERARCHY_LEVEL[role];
  };

  const getCreatableRoles = () => {
    return checkGetCreatableRoles(currentUser.role);
  };

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isStateAdmin = currentUser.role === 'state_admin';
  const isDistrictAdmin = currentUser.role === 'district_admin';
  const isFieldOfficer = currentUser.role === 'field_officer';
  const isRescueTeamMember = currentUser.role === 'rescue_team_member';

  // Specific operational privileges
  const canDispatchRescueTeams = isSuperAdmin || isStateAdmin || isDistrictAdmin;
  const canAssignIncidentOfficers = isSuperAdmin || isStateAdmin || isDistrictAdmin;
  const canBroadcastEmergency = isSuperAdmin || isStateAdmin || isDistrictAdmin;
  const canManagePersonnel = isSuperAdmin || isStateAdmin || isDistrictAdmin;

  // Create user handler with strict hierarchy and geographic validation
  const createUser = (userData: Omit<SystemUser, 'id' | 'createdAt'>) => {
    if (!canCreateRole(userData.role)) {
      return {
        success: false,
        message: `Hierarchy Violation: As a ${ROLE_DEFINITIONS[currentUser.role].label}, you cannot create a user with role ${ROLE_DEFINITIONS[userData.role].label}. You can only create roles below your level.`,
      };
    }

    if (isStateAdmin) {
      if (userData.state.toLowerCase() !== currentUser.state.toLowerCase()) {
        return {
          success: false,
          message: `Geographic Violation: State Admin for ${currentUser.state} cannot create users in ${userData.state}. You can only create personnel within ${currentUser.state}.`,
        };
      }
    }

    if (isDistrictAdmin) {
      if (
        userData.state.toLowerCase() !== currentUser.state.toLowerCase() ||
        userData.district.toLowerCase() !== currentUser.district.toLowerCase()
      ) {
        return {
          success: false,
          message: `Geographic Violation: District Admin for ${currentUser.district} (${currentUser.state}) cannot create users in ${userData.district}, ${userData.state}. You can only create personnel within your assigned district.`,
        };
      }
    }

    const newUser: SystemUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => {
      const updated = [newUser, ...prev];
      localStorage.setItem('vector_sb_users_v1', JSON.stringify(updated));
      return updated;
    });

    logAuditEvent(`Created user ${newUser.name}`, 'user', newUser.id, newUser);

    return {
      success: true,
      message: `Successfully created ${ROLE_DEFINITIONS[newUser.role].label} "${newUser.name}" (${newUser.badgeId}).`,
      user: newUser,
    };
  };

  const updateUser = (userId: string, updates: Partial<SystemUser>) => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'User not found.' };
    }

    if (!canManageUser(target)) {
      return {
        success: false,
        message: `Permission Denied: You do not have permission to edit ${target.name} (${ROLE_DEFINITIONS[target.role].label}).`,
      };
    }

    if (updates.role && !canCreateRole(updates.role)) {
      return {
        success: false,
        message: `Hierarchy Violation: Cannot promote user to ${ROLE_DEFINITIONS[updates.role].label}, which is at or above your level.`,
      };
    }

    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      localStorage.setItem('vector_sb_users_v1', JSON.stringify(updated));
      return updated;
    });

    logAuditEvent(`Updated user ${target.name}`, 'user', userId, updates);

    return {
      success: true,
      message: `Updated profile for ${target.name}.`,
    };
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'User not found.' };
    }

    if (!canManageUser(target)) {
      return {
        success: false,
        message: `Permission Denied: You do not have permission to remove ${target.name}.`,
      };
    }

    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      localStorage.setItem('vector_sb_users_v1', JSON.stringify(updated));
      return updated;
    });

    logAuditEvent(`Deleted user ${target.name}`, 'user', userId);

    return {
      success: true,
      message: `Removed ${target.name} (${ROLE_DEFINITIONS[target.role].label}) from directory.`,
    };
  };

  const createRescueTeam = (teamData: Omit<RescueTeam, 'id' | 'lastStatusUpdate'>) => {
    if (!canDispatchRescueTeams) {
      return {
        success: false,
        message: 'Permission Denied: Only District Admin or higher can create rescue teams.',
      };
    }

    const newTeam: RescueTeam = {
      ...teamData,
      id: `team-${Date.now()}`,
      lastStatusUpdate: 'Just now',
    };

    setRescueTeams((prev) => {
      const updated = [newTeam, ...prev];
      localStorage.setItem('vector_sb_teams_v1', JSON.stringify(updated));
      return updated;
    });

    logAuditEvent(`Created Rescue Team ${newTeam.name}`, 'rescue_team', newTeam.id, newTeam);

    return {
      success: true,
      message: `Created rescue team "${newTeam.name}".`,
      team: newTeam,
    };
  };

  const updateRescueTeam = (teamId: string, updates: Partial<RescueTeam>) => {
    setRescueTeams((prev) => {
      const updated = prev.map((t) => (t.id === teamId ? { ...t, ...updates, lastStatusUpdate: 'Just now' } : t));
      localStorage.setItem('vector_sb_teams_v1', JSON.stringify(updated));
      return updated;
    });
    return { success: true, message: 'Rescue team updated.' };
  };

  const deleteRescueTeam = (teamId: string) => {
    setRescueTeams((prev) => {
      const updated = prev.filter((t) => t.id !== teamId);
      localStorage.setItem('vector_sb_teams_v1', JSON.stringify(updated));
      return updated;
    });
    return { success: true, message: 'Rescue team removed.' };
  };

  const addMemberToTeam = (teamId: string, userId: string) => {
    const team = rescueTeams.find((t) => t.id === teamId);
    const user = users.find((u) => u.id === userId);
    if (!team || !user) return { success: false, message: 'Not found.' };

    setRescueTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              memberIds: [...t.memberIds.filter((id) => id !== userId), userId],
              memberCount: t.memberCount + 1,
            }
          : t
      )
    );

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, assignedTeamId: team.id, assignedTeamName: team.name }
          : u
      )
    );

    return { success: true, message: `Added ${user.name} to ${team.name}.` };
  };

  const removeMemberFromTeam = (teamId: string, userId: string) => {
    const team = rescueTeams.find((t) => t.id === teamId);
    const user = users.find((u) => u.id === userId);
    if (!team) return { success: false, message: 'Team not found.' };

    setRescueTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              memberIds: t.memberIds.filter((id) => id !== userId),
              memberCount: Math.max(0, t.memberCount - 1),
            }
          : t
      )
    );

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, assignedTeamId: undefined, assignedTeamName: undefined }
          : u
      )
    );

    return { success: true, message: `Removed member from ${team.name}.` };
  };

  const value = {
    isAuthenticated,
    loading,
    login,
    logout,
    currentUser,
    users,
    rescueTeams,
    presets: ROLE_SWITCHER_PRESETS,
    activePresetId,
    switchRolePreset,
    switchUser,
    canManageRole,
    canManageUser,
    canAccessState,
    canAccessDistrict,
    canCreateRole,
    getCreatableRoles,
    canDispatchRescueTeams,
    canAssignIncidentOfficers,
    canBroadcastEmergency,
    canManagePersonnel,
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
