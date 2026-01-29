import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { className = '', style, type = 'text', invalid = false, ...props },
  ref
) {
  const mergedStyle = {
    WebkitBoxShadow: '0 0 0 1000px white inset',
    color: '#000',
    ...(style || {})
  };
  // Force light (white) native date picker popup
  if (type === 'date') {
    mergedStyle.colorScheme = 'light';
  }

  const isDisabled = !!props.disabled;
  const isReadOnly = !!props.readOnly;
  const isInvalid = invalid || props['aria-invalid'] === true || props['aria-invalid'] === 'true';

  const base = 'w-full px-3 text-black bg-white border border-gray-300 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const disabledCls = isDisabled ? ' bg-gray-50 cursor-not-allowed opacity-60' : '';
  const readOnlyCls = isReadOnly && !isDisabled ? ' bg-gray-50' : '';
  const invalidCls = isInvalid ? ' border-red-500 focus:ring-red-500 focus:border-red-500' : '';
  const classes = `${base}${disabledCls}${readOnlyCls}${invalidCls} ${className}`.trim();

  const finalProps = {
    ...props,
    'aria-invalid': isInvalid ? true : props['aria-invalid'],
  };

  return (
    <input
      ref={ref}
      type={type}
      className={classes}
      style={mergedStyle}
      {...finalProps}
    />
  );
});

Input.displayName = 'Input';

export default Input;
