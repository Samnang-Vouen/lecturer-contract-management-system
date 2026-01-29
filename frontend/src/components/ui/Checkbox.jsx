import React, { forwardRef, useEffect, useRef } from 'react';

// Checkbox with forwardRef, supports mixed state via `indeterminate` or checked === 'indeterminate'.
// onCheckedChange(boolean) mirrors shadcn/ui's API for easier reuse, while also calling onChange if provided.
export const Checkbox = forwardRef(function Checkbox(
  { id, checked, onCheckedChange, onChange, indeterminate = false, className = '', onClick, disabled, ...rest },
  ref
) {
  const base =
    'h-4 w-4 rounded border border-gray-300 bg-white text-white appearance-none checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors';

  const internalRef = useRef(null);
  const setRef = (node) => {
    internalRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const isMixed = indeterminate || checked === 'indeterminate';
  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = !!isMixed;
    }
  }, [isMixed]);

  const disabledCls = disabled ? ' cursor-not-allowed opacity-60' : ' cursor-pointer';
  const classes = `${base}${disabledCls} ${className}`.trim();

  const ariaChecked = isMixed ? 'mixed' : (checked !== undefined ? !!checked : undefined);
  const dataState = isMixed ? 'indeterminate' : (checked ? 'checked' : 'unchecked');

  const handleChange = (e) => {
    if (onChange) onChange(e);
    if (onCheckedChange) onCheckedChange(e.target.checked);
  };

  const inputProps = {};
  if (checked !== undefined && checked !== 'indeterminate') {
    inputProps.checked = !!checked;
  }

  return (
    <input
      id={id}
      ref={setRef}
      type="checkbox"
      className={classes}
      aria-checked={ariaChecked}
      data-state={dataState}
      disabled={disabled}
      onChange={handleChange}
      onClick={onClick}
      {...inputProps}
      {...rest}
    />
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
