import { isTrustedSender, type SenderLike } from './core/ipc';

/** Back-compat shim for managers not yet migrated to core/ipc `handle()`. */
export function isValidSender(event: SenderLike): boolean {
  return isTrustedSender(event);
}
