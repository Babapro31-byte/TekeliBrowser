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
export type SearchEngine = 'duckduckgo' | 'google';
export type DoHProvider = 'off' | 'cloudflare' | 'quad9' | 'google' | 'custom';

interface Settings {
  cookiePolicy?: CookiePolicy;
  trackerBlocking?: boolean;
  searchEngine?: SearchEngine;
  dohProvider?: DoHProvider;
  dohCustom?: string;
  httpsOnly?: boolean;
  fingerprintDefender?: boolean;
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

export function getSearchEngine(): SearchEngine {
  return settings.searchEngine ?? 'duckduckgo';
}

export function setSearchEngine(engine: SearchEngine): void {
  settings.searchEngine = engine;
  saveSettings();
}

export function getDoHProvider(): DoHProvider {
  return settings.dohProvider ?? 'off';
}

export function setDoHProvider(provider: DoHProvider): void {
  settings.dohProvider = provider;
  saveSettings();
}

export function getDoHCustom(): string {
  return settings.dohCustom ?? '';
}

export function setDoHCustom(url: string): void {
  settings.dohCustom = url;
  saveSettings();
}

export function getHttpsOnly(): boolean {
  return settings.httpsOnly ?? false;
}

export function setHttpsOnly(enabled: boolean): void {
  settings.httpsOnly = enabled;
  saveSettings();
}

export function getFingerprintDefender(): boolean {
  return settings.fingerprintDefender ?? false;
}

export function setFingerprintDefender(enabled: boolean): void {
  settings.fingerprintDefender = enabled;
  saveSettings();
}

loadSettings();