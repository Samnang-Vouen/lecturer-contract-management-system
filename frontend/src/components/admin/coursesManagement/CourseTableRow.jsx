import React from 'react';
import { TableRow, TableCell } from '../../ui/Table.jsx';
import Button from '../../ui/Button.jsx';
import { Eye, Edit, Trash2 } from 'lucide-react';

/**
 * CourseTableRow - Table row component for displaying a course
 */
export default function CourseTableRow({ course, onView, onEdit, onDelete }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{course.course_code}</TableCell>
      <TableCell className="font-bold">{course.course_name}</TableCell>
      <TableCell className="max-w-xs truncate">{course.description || '—'}</TableCell>
      <TableCell>{course.hours || 0}h</TableCell>
      <TableCell>{course.credits || 0}</TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
