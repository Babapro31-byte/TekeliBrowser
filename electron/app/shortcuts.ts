/** Single keyboard map. Pure matching (testable); the window layer executes the actions. */

export type ShortcutAction =
  | 'new-tab' | 'close-tab' | 'reopen-tab' | 'new-window' | 'new-private-window'
  | 'focus-omnibox' | 'find' | 'bookmark' | 'history' | 'downloads' | 'settings' | 'print'
  | 'reload' | 'hard-reload' | 'stop' | 'back' | 'forward'
  | 'zoom-in' | 'zoom-out' | 'zoom-reset'
  | 'next-tab' | 'prev-tab' | `tab-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | 'fullscreen' | 'devtools' | 'escape';

export interface KeyInput {
  type: string;
  key: string;
  control?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

interface Binding { key: string; mod?: boolean; shift?: boolean; alt?: boolean; action: ShortcutAction }

const B = (key: string, action: ShortcutAction, o: Partial<Omit<Binding, 'key' | 'action'>> = {}): Binding => ({ key, action, ...o });

const BINDINGS: Binding[] = [
  B('t', 'new-tab', { mod: true }),
  B('w', 'close-tab', { mod: true }),
  B('t', 'reopen-tab', { mod: true, shift: true }),
  B('n', 'new-window', { mod: true }),
  B('n', 'new-private-window', { mod: true, shift: true }),
  B('l', 'focus-omnibox', { mod: true }),
  B('k', 'focus-omnibox', { mod: true }),
  B('f6', 'focus-omnibox'),
  B('f', 'find', { mod: true }),
  B('d', 'bookmark', { mod: true }),
  B('h', 'history', { mod: true }),
  B('j', 'downloads', { mod: true }),
  B(',', 'settings', { mod: true }),
  B('p', 'print', { mod: true }),
  B('r', 'reload', { mod: true }),
  B('f5', 'reload'),
  B('r', 'hard-reload', { mod: true, shift: true }),
  B('f5', 'hard-reload', { mod: true }),
  B('arrowleft', 'back', { alt: true }),
  B('arrowright', 'forward', { alt: true }),
  B('=', 'zoom-in', { mod: true }),
  B('+', 'zoom-in', { mod: true, shift: true }),
  B('-', 'zoom-out', { mod: true }),
  B('0', 'zoom-reset', { mod: true }),
  B('tab', 'next-tab', { mod: true }),
  B('tab', 'prev-tab', { mod: true, shift: true }),
  B('pagedown', 'next-tab', { mod: true }),
  B('pageup', 'prev-tab', { mod: true }),
  B('f11', 'fullscreen'),
  B('f12', 'devtools'),
  B('i', 'devtools', { mod: true, shift: true }),
  B('escape', 'escape'),
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((n) => B(String(n), `tab-${n}`, { mod: true })),
];

/** Resolve a key event to an action, or null. Case-insensitive, so Caps Lock never breaks shortcuts. */
export function matchShortcut(input: KeyInput): ShortcutAction | null {
  if (input.type !== 'keyDown') return null;
  const key = input.key.toLowerCase();
  const mod = !!(input.control || input.meta);
  const shift = !!input.shift;
  const alt = !!input.alt;
  for (const b of BINDINGS) {
    if (b.key !== key) continue;
    if (!!b.mod !== mod) continue;
    if (!!b.alt !== alt) continue;
    // '+' and '=' already encode shift on most layouts; do not require an exact shift match there.
    const shiftAgnostic = key === '+' || key === '=' || key === '-' || key === ',' || key === '0';
    if (!shiftAgnostic && !!b.shift !== shift) continue;
    return b.action;
  }
  return null;
}
