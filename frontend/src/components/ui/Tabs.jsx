import React from 'react';

// Tabs container: passes active value, change handler, and orientation down to children.
export function Tabs({ children, value, onValueChange, onTabChange, orientation = 'auto', className, ...rest }) {
  // Back-compat: accept onTabChange on the root and map it to onValueChange, but pass down as onChangeTab (non-DOM prop name)
  const handleChange = onValueChange || onTabChange;
  return (
    <div className={className} {...rest}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const isDOM = typeof child.type === 'string';
        const isFragment = child.type === React.Fragment;
        // Only inject custom props into React components, never native DOM elements or Fragments
        return (isDOM || isFragment) ? child : React.cloneElement(child, { activeTab: value, onChangeTab: handleChange, orientation });
      })}
    </div>
  );
}

// TabsList: defaults to responsive (vertical on small, horizontal on sm+) unless orientation is explicitly set or a custom className is provided
export function TabsList({ children, activeTab, onChangeTab, orientation = 'auto', className, ariaLabel, ...rest }) {
  const hasCustom = !!className;
  let baseLayout = '';
  if (!hasCustom) {
    if (orientation === 'vertical') baseLayout = 'flex flex-col';
    else if (orientation === 'horizontal') baseLayout = 'flex flex-row';
    else baseLayout = 'flex flex-col sm:flex-row';
  }
  const baseStyle = hasCustom ? '' : 'bg-gray-100 rounded-lg p-1 mb-6 shadow-inner overflow-x-auto max-w-full gap-1 [--tw-ring-offset-shadow:0_0_0_var(--tw-ring-offset-width)_var(--tw-ring-offset-color)] [--tw-ring-shadow:0_0_0_calc(2px+var(--tw-ring-offset-width))_rgba(59,130,246,0.5)]';
  const classes = `${baseLayout} ${baseStyle} ${className || ''}`.trim();
  return (
    <div
      className={classes}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation === 'auto' ? undefined : orientation}
      data-orientation={orientation}
      {...rest}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const isDOM = typeof child.type === 'string';
        const isFragment = child.type === React.Fragment;
        // Avoid passing unknown props to DOM nodes or Fragments to silence React warnings
        return (isDOM || isFragment) ? child : React.cloneElement(child, { activeTab, onChangeTab, orientation });
      })}
    </div>
  );
}

// TabsTrigger: supports custom className; responsive default is full-width on small, flex-1 on sm+
export function TabsTrigger({ value, children, activeTab, onChangeTab, orientation = 'auto', className, onClick, onKeyDown: userOnKeyDown, disabled, ...rest }) {
  const selectedClasses = 'bg-white text-blue-700 shadow-sm border border-blue-200';
  const unselectedClasses = 'text-gray-700 hover:text-gray-900 hover:bg-white/70 border border-transparent';
  let defaultLayout = '';
  if (orientation === 'vertical') defaultLayout = 'w-full';
  else if (orientation === 'horizontal') defaultLayout = 'flex-1';
  else defaultLayout = 'w-full sm:flex-1';
  const base = 'px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white relative z-0';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const classes = `${defaultLayout} ${base} ${activeTab === value ? selectedClasses : unselectedClasses} ${disabledClasses} ${className || ''}`.trim();

  const handleKeyDown = (e) => {
    const list = e.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(list?.querySelectorAll?.('button[role="tab"]') || []);
    const total = tabs?.length ?? 0;
    if (!total) return;
    const idx = tabs.indexOf(e.currentTarget);
    if (idx === -1) return;
    const isVertical = (list.getAttribute('data-orientation') || orientation) === 'vertical';
    const prev = () => tabs[(idx - 1 + total) % total];
    const next = () => tabs[(idx + 1) % total];
    if ((isVertical && e.key === 'ArrowUp') || (!isVertical && e.key === 'ArrowLeft')) {
      e.preventDefault();
      const el = prev();
      el?.focus();
      const v = el?.getAttribute('data-value');
      if (v && onChangeTab) onChangeTab(v);
    } else if ((isVertical && e.key === 'ArrowDown') || (!isVertical && e.key === 'ArrowRight')) {
      e.preventDefault();
      const el = next();
      el?.focus();
      const v = el?.getAttribute('data-value');
      if (v && onChangeTab) onChangeTab(v);
    } else if (e.key === 'Home') {
      e.preventDefault();
      const el = tabs[0];
      el?.focus();
      const v = el?.getAttribute('data-value');
      if (v && onChangeTab) onChangeTab(v);
    } else if (e.key === 'End') {
      e.preventDefault();
      const el = tabs[total - 1];
      el?.focus();
      const v = el?.getAttribute('data-value');
      if (v && onChangeTab) onChangeTab(v);
    }
    if (userOnKeyDown) userOnKeyDown(e);
  };
  return (
    <button
      type="button"
      id={`tab-${value}`}
      role="tab"
      aria-selected={activeTab === value}
      aria-controls={`tab-panel-${value}`}
      aria-disabled={disabled || undefined}
      data-value={value}
      data-state={activeTab === value ? 'active' : 'inactive'}
      className={classes}
      disabled={disabled}
      onClick={(e) => {
        if (!disabled && onChangeTab) onChangeTab(value);
        if (onClick) onClick(e);
      }}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, activeTab, className, onChangeTab, orientation, ...rest }) {
  if (activeTab !== value) return null;
  return (
    <div
      id={`tab-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}
