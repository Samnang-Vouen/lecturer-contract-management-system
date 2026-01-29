import React from 'react';

export const Card = React.forwardRef(function Card({ children, className = '', ...rest }, ref) {
    return (
        <div ref={ref} className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...rest}>
            {children}
        </div>
    );
});

export const CardHeader = React.forwardRef(function CardHeader({ children, className = '', ...rest }, ref) {
    return (
        <div ref={ref} className={`px-6 py-4 border-b border-gray-200 ${className}`} {...rest}>
            {children}
        </div>
    );
});

export const CardTitle = React.forwardRef(function CardTitle({ children, className = '', as: Component = 'h3', ...rest }, ref) {
    return (
        <Component ref={ref} className={`text-lg font-semibold text-gray-900 ${className}`} {...rest}>
            {children}
        </Component>
    );
});

export const CardDescription = React.forwardRef(function CardDescription({ children, className = '', ...rest }, ref) {
    return (
        <p ref={ref} className={`text-sm text-gray-600 mt-1 ${className}`} {...rest}>
            {children}
        </p>
    );
});

export const CardContent = React.forwardRef(function CardContent({ children, className = '', ...rest }, ref) {
    return (
        <div ref={ref} className={`px-6 py-4 ${className}`} {...rest}>
            {children}
        </div>
    );
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
