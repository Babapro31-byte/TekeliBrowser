import { ipcMain } from 'electron';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

const SPACES_STATE_FILE = 'spaces-state.json';

interface SpacesState {
  collapsed: boolean;
}

const defaultSpacesState: SpacesState = {
  collapsed: false
};

async function getSpacesStatePath(): Promise<string> {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, SPACES_STATE_FILE);
}

async function loadSpacesState(): Promise<SpacesState> {
  try {
    const statePath = await getSpacesStatePath();
    const data = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(data);
    return { ...defaultSpacesState, ...parsed };
  } catch (error) {
    // File doesn't exist or is corrupted, return default
    return defaultSpacesState;
  }
}

async function saveSpacesState(state: SpacesState): Promise<void> {
  try {
    const statePath = await getSpacesStatePath();
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('[TekeliBrowser] Failed to save spaces state:', error);
  }
}

export function initSpacesManager(): void {
  console.log('[TekeliBrowser] Spaces manager initialized');
  
  // Get spaces state
  ipcMain.handle('getSpacesState', async () => {
    try {
      const state = await loadSpacesState();
      return { success: true, state };
    } catch (error) {
      console.error('[TekeliBrowser] Failed to get spaces state:', error);
      return { success: false, error: 'Failed to load spaces state' };
    }
  });

  // Set spaces state
  ipcMain.handle('setSpacesState', async (_, { collapsed }: SpacesState) => {
    try {
      const currentState = await loadSpacesState();
      const newState = { ...currentState, collapsed };
      await saveSpacesState(newState);
      return { success: true, state: newState };
    } catch (error) {
      console.error('[TekeliBrowser] Failed to set spaces state:', error);
      return { success: false, error: 'Failed to save spaces state' };
    }
  });
}
