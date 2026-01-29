import React from 'react';

const Label = React.forwardRef(function Label(
  { className = '', srOnly = false, disabled = false, required = false, children, ...props },
  ref
) {
  const base = 'text-sm font-medium text-gray-700';
  const hidden = srOnly ? 'sr-only' : '';
  const state = disabled ? 'opacity-60 cursor-not-allowed' : '';
  const classes = `${base} ${hidden} ${state} ${className}`.trim();
  return (
    <label
      ref={ref}
      className={classes}
      data-required={required || undefined}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';

export { Label };
export default Label;
