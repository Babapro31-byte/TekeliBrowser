/**
 * TekeliBrowser Settings Manager
 * Stores user preferences in userData/settings.json
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const SETTINGS_FILE = 'settings.json';
let settingsPath = '';

export type CookiePolicy = 'all' | 'block-third-party' | 'block-all';

interface Settings {
  cookiePolicy?: CookiePolicy;
  trackerBlocking?: boolean;
}

let settings: Settings = {};

function getSettingsPath(): string {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), SETTINGS_FILE);
  }
  return settingsPath;
}

function loadSettings(): void {
  try {
    const filePath = getSettingsPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      settings = JSON.parse(raw);
    }
  } catch (err: any) {
    console.error('[SettingsManager] Load failed:', err.message);
    settings = {};
  }
}

function saveSettings(): void {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[SettingsManager] Save failed:', err.message);
  }
}

export function getCookiePolicy(): CookiePolicy {
  return settings.cookiePolicy ?? 'all';
}

export function setCookiePolicy(policy: CookiePolicy): void {
  settings.cookiePolicy = policy;
  saveSettings();
}

export function getTrackerBlocking(): boolean {
  return settings.trackerBlocking ?? true;
}

export function setTrackerBlockingSetting(enabled: boolean): void {
  settings.trackerBlocking = enabled;
  saveSettings();
}

loadSettings();
