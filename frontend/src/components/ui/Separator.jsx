import React from 'react';

export const Separator = React.forwardRef(function Separator(
  { className = '', orientation = 'horizontal', decorative = true, ...rest },
  ref
) {
  const isVertical = orientation === 'vertical';
  const sizeClasses = isVertical ? 'w-px h-full' : 'h-px w-full';
  return (
    <div
      ref={ref}
      role={decorative ? undefined : 'separator'}
      aria-orientation={isVertical && !decorative ? 'vertical' : undefined}
      data-orientation={orientation}
      className={`${sizeClasses} bg-gray-200 ${className}`}
      {...rest}
    />
  );
});

Separator.displayName = 'Separator';

export default Separator;
