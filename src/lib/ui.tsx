/** Shared primitives, built from the Figma components (IconButton, Button, Toggle, Select, Segmented, Card, Row). */
import type { LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export function IconButton({
  icon: Icon, label, onClick, disabled, active, size = 18, className, onContextMenu,
}: {
  icon: LucideIcon; label: string; onClick?: () => void; disabled?: boolean; active?: boolean; size?: number; className?: string; onContextMenu?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cx(
        'no-drag grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors duration-fast',
        disabled ? 'text-fg-3 opacity-40' : active ? 'bg-pressed text-fg' : 'text-fg-2 hover:bg-hover hover:text-fg active:bg-pressed',
        className,
      )}
    >
      <Icon size={size} strokeWidth={2} aria-hidden />
    </button>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-fg-accent hover:bg-accent-hover',
  secondary: 'bg-raised text-fg border border-line hover:bg-hover',
  ghost: 'text-fg hover:bg-hover',
  danger: 'bg-danger-subtle text-danger border border-danger hover:brightness-110',
};

export function Button({ variant = 'secondary', children, onClick, disabled, type = 'button' }: {
  variant?: Variant; children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx('inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 text-body font-medium transition-colors duration-fast', VARIANTS[variant], disabled && 'opacity-40')}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('flex h-[22px] w-10 shrink-0 items-center rounded-full p-[3px] transition-colors duration-fast', checked ? 'justify-end bg-accent' : 'justify-start border border-line bg-pressed')}
    >
      <span className={cx('h-4 w-4 rounded-full transition-colors duration-fast', checked ? 'bg-fg-accent' : 'bg-fg-2')} />
    </button>
  );
}

export function Select<T extends string>({ value, options, onChange, label, width = 200 }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; width?: number;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      style={{ width }}
      className="h-8 rounded-md border border-line bg-field px-3 text-body text-fg outline-none transition-colors duration-fast hover:border-line-strong focus-visible:border-accent"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-0.5 rounded-md border border-line-subtle bg-field p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx('h-7 rounded-sm px-3 text-small transition-colors duration-fast', o.value === value ? 'bg-pressed font-medium text-fg' : 'text-fg-2 hover:text-fg')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="m-0 text-heading font-semibold text-fg">{title}</h1>
      {desc && <p className="m-0 text-body text-fg-2">{desc}</p>}
    </header>
  );
}

export function Group({ label, children }: { label?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={label ? id : undefined} className="flex flex-col gap-2">
      {label && <h2 id={id} className="m-0 text-caption font-medium uppercase tracking-wide text-fg-3">{label}</h2>}
      <div className="overflow-hidden rounded-lg border border-line-subtle bg-surface [&>*+*]:border-t [&>*+*]:border-line-subtle">{children}</div>
    </section>
  );
}

export function Row({ title, desc, children, leading, onClick }: {
  title: string; desc?: string; children?: ReactNode; leading?: ReactNode; onClick?: () => void;
}) {
  const body = (
    <>
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-medium text-fg">{title}</span>
        {desc && <span className="text-small text-fg-2">{desc}</span>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </>
  );
  const cls = 'flex w-full items-center gap-6 px-4 py-3 text-left';
  return onClick ? <button type="button" onClick={onClick} className={cx(cls, 'hover:bg-hover')}>{body}</button> : <div className={cls}>{body}</div>;
}

export function Favicon({ src, url, size = 16 }: { src?: string | null; url: string; size?: number }) {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* internal */ }
  const letter = (host[0] ?? 'T').toUpperCase();
  return src ? (
    <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-sm" draggable={false} />
  ) : (
    <span style={{ width: size, height: size, fontSize: Math.max(8, size * 0.6) }} className="grid shrink-0 place-items-center rounded-full bg-hover font-semibold text-fg-2" aria-hidden>{letter}</span>
  );
}

export { cx };
