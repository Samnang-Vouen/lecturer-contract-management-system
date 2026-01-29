import React from 'react';

export const Alert = React.forwardRef(function Alert({ children, className = '', role = 'status', ...rest }, ref) {
  return (
    <div
      ref={ref}
      role={role}
      className={`w-full rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

export const AlertDescription = React.forwardRef(function AlertDescription({ children, className='', ...rest }, ref) {
  return (
    <div ref={ref} className={`mt-1 text-blue-800 ${className}`} {...rest}>
      {children}
    </div>
  );
});

Alert.displayName = 'Alert';
AlertDescription.displayName = 'AlertDescription';

export default Alert;
