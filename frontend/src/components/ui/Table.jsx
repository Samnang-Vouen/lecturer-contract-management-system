import React from 'react';

export const Table = React.forwardRef(function Table({ children, className = '', ...rest }, ref) {
  return (
    <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...rest}>
      {children}
    </table>
  );
});

export const TableHeader = React.forwardRef(function TableHeader({ children, className = '', ...rest }, ref) {
  return (
    <thead ref={ref} className={className} {...rest}>
      {children}
    </thead>
  );
});

export const TableBody = React.forwardRef(function TableBody({ children, className = '', ...rest }, ref) {
  return (
    <tbody ref={ref} className={className} {...rest}>
      {children}
    </tbody>
  );
});

export const TableRow = React.forwardRef(function TableRow({ children, className = '', ...rest }, ref) {
  return (
    <tr ref={ref} className={`border-b last:border-b-0 hover:bg-gray-50 ${className}`} {...rest}>
      {children}
    </tr>
  );
});

export const TableHead = React.forwardRef(function TableHead({ children, className = '', scope = 'col', ...rest }, ref) {
  return (
    <th ref={ref} scope={scope} className={`h-10 px-3 text-left align-middle font-medium text-gray-600 ${className}`} {...rest}>
      {children}
    </th>
  );
});

export const TableCell = React.forwardRef(function TableCell({ children, className = '', ...rest }, ref) {
  return (
    <td ref={ref} className={`p-3 align-middle ${className}`} {...rest}>
      {children}
    </td>
  );
});

Table.displayName = 'Table';
TableHeader.displayName = 'TableHeader';
TableBody.displayName = 'TableBody';
TableRow.displayName = 'TableRow';
TableHead.displayName = 'TableHead';
TableCell.displayName = 'TableCell';

export default { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
