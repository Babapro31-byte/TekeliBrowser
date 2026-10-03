import { describe, expect, it } from 'vitest';
import { matchShortcut } from './shortcuts';

const k = (key: string, o: Record<string, boolean> = {}) => matchShortcut({ type: 'keyDown', key, ...o });

describe('matchShortcut', () => {
  it('matches core tab shortcuts', () => {
    expect(k('t', { control: true })).toBe('new-tab');
    expect(k('w', { control: true })).toBe('close-tab');
    expect(k('T', { control: true, shift: true })).toBe('reopen-tab');
    expect(k('N', { control: true, shift: true })).toBe('new-private-window');
    expect(k('Tab', { control: true })).toBe('next-tab');
    expect(k('Tab', { control: true, shift: true })).toBe('prev-tab');
    expect(k('3', { control: true })).toBe('tab-3');
  });

  it('is case-insensitive (Caps Lock safe)', () => {
    expect(k('L', { control: true })).toBe('focus-omnibox');
    expect(k('W', { control: true })).toBe('close-tab');
  });

  it('supports meta as the modifier', () => {
    expect(k('t', { meta: true })).toBe('new-tab');
  });

  it('maps navigation and zoom', () => {
    expect(k('ArrowLeft', { alt: true })).toBe('back');
    expect(k('ArrowRight', { alt: true })).toBe('forward');
    expect(k('F5')).toBe('reload');
    expect(k('F5', { control: true })).toBe('hard-reload');
    expect(k('=', { control: true })).toBe('zoom-in');
    expect(k('+', { control: true, shift: true })).toBe('zoom-in');
    expect(k('-', { control: true })).toBe('zoom-out');
    expect(k('0', { control: true })).toBe('zoom-reset');
  });

  it('does not steal plain typing or clipboard shortcuts', () => {
    expect(k('t')).toBeNull();
    expect(k('c', { control: true })).toBeNull();
    expect(k('v', { control: true })).toBeNull();
    expect(k('a', { control: true })).toBeNull();
    expect(k('w', { control: true, alt: true })).toBeNull();
  });

  it('ignores key-up events', () => {
    expect(matchShortcut({ type: 'keyUp', key: 't', control: true })).toBeNull();
  });
});
