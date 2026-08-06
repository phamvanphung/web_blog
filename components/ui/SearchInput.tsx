import { clsx } from 'clsx';

type Props = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

/**
 * Pill-shaped search field. Only used on `/tim-kiem` (Playwright spec asserts
 * exactly one `input[name="q"]` + one `button[type="submit"]` on that route —
 * do NOT place a SearchInput in Header / Footer / Sidebar).
 */
export function SearchInput({
  name = 'q',
  defaultValue = '',
  placeholder = 'Tìm kiếm',
  className,
  autoFocus
}: Props) {
  return (
    <input
      type="search"
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={clsx(
        'h-11 w-full rounded-pill bg-canvas-parchment px-5 text-[15px] text-ink',
        'placeholder:text-ink-48 border border-transparent outline-none',
        'focus:border-primary-focus focus:bg-canvas',
        className
      )}
    />
  );
}
