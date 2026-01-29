import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import LecturerTableRow from './LecturerTableRow';
import PaginationControls from './PaginationControls';

export default function LecturerTable({ 
  lecturers, 
  isLoading, 
  totalLecturers,
  page,
  setPage,
  totalPages,
  onOpenMenu,
  onOpenCoursesPopover
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className='p-8 text-center'>
            <div className='animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading lecturers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lecturers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5'/> Lecturers (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='p-8 text-center text-gray-600'>No lecturers found.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='w-5 h-5'/> Lecturers ({totalLecturers})
        </CardTitle>
        <CardDescription>All lecturer accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm bg-white'>
              <thead>
                <tr className='text-left'>
                  <th className='px-6 py-3 font-medium text-xs uppercase tracking-wider text-gray-500 bg-gray-50'>
                    Name
                  </th>
                  <th className='px-6 py-3 font-medium text-xs uppercase tracking-wider text-gray-500 bg-gray-50'>
                    Department
                  </th>
                  <th className='px-6 py-3 font-medium text-xs uppercase tracking-wider text-gray-500 bg-gray-50'>
                    Position
                  </th>
                  <th className='px-6 py-3 font-medium text-xs uppercase tracking-wider text-gray-500 bg-gray-50'>
                    Research Fields
                  </th>
                  <th className='px-6 py-3 font-medium text-xs uppercase tracking-wider text-gray-500 bg-gray-50'>
                    Courses
                  </th>
                  <th className='px-6 py-3 font-medium text-xs uppercase tracking-wider text-gray-500 bg-gray-50'>
                    Status
                  </th>
                  <th className='px-6 py-3 font-medium text-xs uppercase tracking-wider text-gray-500 bg-gray-50 text-right'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map(lecturer => (
                  <LecturerTableRow
                    key={lecturer.id}
                    lecturer={lecturer}
                    onOpenMenu={onOpenMenu}
                    onOpenCoursesPopover={onOpenCoursesPopover}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <PaginationControls
              page={page}
              setPage={setPage}
              totalPages={totalPages}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
