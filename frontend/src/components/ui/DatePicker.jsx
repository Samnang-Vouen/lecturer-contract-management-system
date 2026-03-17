import React from 'react';
import { Calendar } from 'lucide-react';
import Input from './Input';

function toDateOnly(value) {
  const s = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

export default function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  disabled = false,
  inputClassName = '',
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  const safeValue = toDateOnly(value);
  const safeMin = toDateOnly(min);
  const safeMax = toDateOnly(max);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
  };

  const handleToggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          readOnly
          disabled={disabled}
          value={safeValue}
          placeholder={placeholder}
          className={`cursor-pointer pr-10 focus:ring-blue-500 h-10 sm:h-9 text-sm ${inputClassName}`.trim()}
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          aria-label="Pick date"
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          onClick={handleToggle}
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 mt-2 z-50 rounded-lg border border-gray-200 bg-white shadow-lg p-2">
          <calendar-date
            months={1}
            value={safeValue}
            min={safeMin || undefined}
            max={safeMax || undefined}
            onChange={(e) => {
              const next = toDateOnly(e?.target?.value);
              if (next) onChange?.(next);
              setOpen(false);
            }}
          ></calendar-date>
        </div>
      )}
    </div>
  );
}
