import React, { useEffect, useState, useRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

// Added className hooks to allow sizing and minor style overrides from callers
export default React.forwardRef(function Select({
    children,
    value,
    onValueChange,
    onOpenChange,
    placeholder,
    disabled = false,
    className = '',
    buttonClassName = '',
    dropdownClassName = '',
    unstyled = false,
    id,
    name,
    ...rest
}, ref) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const reactId = useId();
    const buttonId = id || `sel-btn-${reactId}`;
    const listboxId = `sel-list-${reactId}`;
    const mergedRef = (node) => {
        containerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
    };

    useEffect(() => {
        setSelectedValue(value || '');
    }, [value]);

    // Determine the label to display for the current selected value
    const childArray = React.Children.toArray(children).filter(Boolean);
    const enabledItems = childArray.filter((c) => !c.props?.disabled);
    const matchedChild = childArray.find(child => child.props && child.props.value === selectedValue);
    const displayLabel = matchedChild ? matchedChild.props.children : (placeholder || 'Select');

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleSelect = (val) => {
        setSelectedValue(val);
        if (onValueChange) onValueChange(val);
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
    };

    const openDropdown = () => {
        if (disabled) return;
        if (!isOpen) {
            setIsOpen(true);
            if (onOpenChange) onOpenChange(true);
            const idx = enabledItems.findIndex((c) => c.props?.value === selectedValue);
            setHighlightedIndex(idx >= 0 ? idx : 0);
        }
    };

    const closeDropdown = () => {
        if (isOpen) {
            setIsOpen(false);
            if (onOpenChange) onOpenChange(false);
        }
    };

    const onButtonKeyDown = (e) => {
        if (disabled) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) {
                openDropdown();
                return;
            }
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            const total = enabledItems?.length ?? 0;
            const nextIndex = (() => {
                if (!total) return -1;
                const cur = highlightedIndex < 0 ? 0 : highlightedIndex;
                return (cur + dir + total) % total;
            })();
            setHighlightedIndex(nextIndex);
        } else if (e.key === 'Enter' || e.key === ' ') {
            if (isOpen && highlightedIndex >= 0) {
                e.preventDefault();
                const item = enabledItems[highlightedIndex];
                if (item) handleSelect(item.props.value);
            } else if (!isOpen) {
                e.preventDefault();
                openDropdown();
            }
        } else if (e.key === 'Escape') {
            closeDropdown();
        } else if (e.key === 'Home' || e.key === 'End') {
            if (isOpen) {
                e.preventDefault();
                const total = enabledItems?.length ?? 0;
                setHighlightedIndex(e.key === 'Home' ? 0 : Math.max(0, total - 1));
            }
        }
    };

    return (
        <div className={`relative ${className}`} ref={mergedRef} {...rest}>
            <button
                type="button"
                id={buttonId}
                name={name}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                className={`relative w-full px-3 pr-8 py-2 ${unstyled ? '' : 'border border-gray-300 rounded-lg bg-white'} text-left focus:outline-none flex items-center ${disabled ? 'text-gray-500 ' + (unstyled ? 'cursor-not-allowed opacity-60' : 'bg-gray-50 cursor-not-allowed opacity-60') : (unstyled ? '' : 'focus:ring-2 focus:ring-blue-500')} ${buttonClassName}`}
                onClick={() => {
                    if (disabled) return;
                    const next = !isOpen;
                    setIsOpen(next);
                    if (onOpenChange) onOpenChange(next);
                    if (next) {
                        const idx = enabledItems.findIndex((c) => c.props?.value === selectedValue);
                        setHighlightedIndex(idx >= 0 ? idx : 0);
                    }
                }}
                onKeyDown={onButtonKeyDown}
                aria-disabled={disabled || undefined}
            >
                <span className={(selectedValue ? 'text-gray-900' : 'text-gray-500') + ' block leading-snug whitespace-normal break-words text-base'}>
                    {displayLabel}
                </span>
                <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
            {isOpen && !disabled && (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-labelledby={buttonId}
                    className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto ${dropdownClassName}`}
                >
                    {childArray.map((child, idx) => {
                        if (!React.isValidElement(child)) return child;
                        const isDisabled = !!child.props?.disabled;
                        const isSelected = child.props?.value === selectedValue;
                        const isHighlighted = idx === highlightedIndex;
                        const optionId = `${listboxId}-opt-${idx}`;
                        return React.cloneElement(child, {
                            id: optionId,
                            role: 'option',
                            'aria-selected': isSelected,
                            'data-highlighted': isHighlighted ? '' : undefined,
                            onSelect: handleSelect,
                            onMouseEnter: () => setHighlightedIndex(idx),
                            disabled: isDisabled,
                            className: `${child.props.className || ''} ${isHighlighted ? 'bg-gray-100' : ''}`.trim(),
                        });
                    })}
                </div>
            )}
        </div>
    );
});

export function SelectItem({ value, children, onSelect, className = '', id, role = 'option', disabled = false, ...rest }) {
    return (
        <button
            type="button"
            id={id}
            role={role}
            aria-disabled={disabled || undefined}
            data-value={value}
            disabled={disabled}
            className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            onClick={() => { if (!disabled && onSelect) onSelect(value); }}
            {...rest}
        >
            {children}
        </button>
    );
}
