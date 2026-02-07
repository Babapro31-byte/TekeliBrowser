/**
 * TekeliBrowser Permission Manager
 * Per-site permission storage for camera, microphone, location, notifications
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const PERMISSIONS_FILE = 'permissions.json';
let permissionsPath = '';

type PermissionDecision = 'allow' | 'block';

interface SitePermissions {
  [permission: string]: PermissionDecision;
}

interface PermissionsData {
  [site: string]: SitePermissions;
}

let permissionsStore: PermissionsData = {};

function getPermissionsPath(): string {
  if (!permissionsPath) {
    permissionsPath = path.join(app.getPath('userData'), PERMISSIONS_FILE);
  }
  return permissionsPath;
}

function loadPermissions(): void {
  try {
    const filePath = getPermissionsPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      permissionsStore = JSON.parse(raw);
    }
  } catch (err: any) {
    console.error('[PermissionManager] Load failed:', err.message);
    permissionsStore = {};
  }
}

function savePermissions(): void {
  try {
    fs.writeFileSync(getPermissionsPath(), JSON.stringify(permissionsStore, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[PermissionManager] Save failed:', err.message);
  }
}

/**
 * Extract site/host from URL for permission key
 */
export function getSiteFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    // Use registrable domain (e.g. youtube.com, not m.youtube.com)
    const parts = host.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return host;
  } catch {
    return '';
  }
}

/**
 * Get stored permission decision for a site
 */
export function getPermission(site: string, permission: string): PermissionDecision | null {
  if (!site) return null;
  const sitePerms = permissionsStore[site];
  if (!sitePerms) return null;
  return sitePerms[permission] ?? null;
}

/**
 * Store permission decision for a site
 */
export function setPermission(site: string, permission: string, decision: PermissionDecision): void {
  if (!site) return;
  if (!permissionsStore[site]) permissionsStore[site] = {};
  permissionsStore[site][permission] = decision;
  savePermissions();
}

/**
 * Get all stored permissions (for PrivacySettings UI)
 */
export function getAllPermissions(): PermissionsData {
  return { ...permissionsStore };
}

/**
 * Clear permission for a site (or all)
 */
export function clearPermission(site?: string, permission?: string): void {
  if (!site) {
    permissionsStore = {};
  } else if (!permission) {
    delete permissionsStore[site];
  } else if (permissionsStore[site]) {
    delete permissionsStore[site][permission];
    if (Object.keys(permissionsStore[site]).length === 0) {
      delete permissionsStore[site];
    }
  }
  savePermissions();
}

// Load on init
loadPermissions();
