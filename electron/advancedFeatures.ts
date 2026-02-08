import { initPasswordManager } from './passwordManager.js';
import { initPerfManager } from './perfManager.js';

export function initializeAdvancedFeatures(): void {
  initPerfManager();
  initPasswordManager();
  console.log('[TekeliBrowser] Advanced features initialized');
}