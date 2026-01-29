import React from 'react';

const Button = React.forwardRef(function Button({ children, onClick, type = 'button', variant = 'primary', size = 'md', className = '', disabled = false, ...props }, ref) {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 shadow-sm hover:shadow-md hover:border-gray-400',
        destructive: 'border border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
        ghost: 'border border-transparent bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
        secondary: 'border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-blue-500 shadow-sm hover:shadow-md'
    };
    const sizes = { 
        sm: 'px-3 py-1.5 text-sm', 
        md: 'px-4 py-2 text-sm', 
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg'
    };
    return (
        <button 
            ref={ref}
            type={type} 
            className={`${base} ${variants[variant] || ''} ${sizes[size] || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`} 
            onClick={onClick} 
            disabled={disabled}
            aria-disabled={disabled || undefined}
            data-variant={variant}
            data-size={size}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
