import React from 'react';
import { Plus, Clipboard, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import toast from 'react-hot-toast';

export default function SessionCreatedList({ createdLecturers, onOpenCreateModal }) {
  return (
    <Card className='rounded-2xl shadow-lg border-gray-100'>
      <CardHeader className='border-b-0 px-6 py-6 sm:px-8 sm:py-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl'>
              <GraduationCap className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
            <div>
              <CardTitle className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'>
                Create Lecturer
              </CardTitle>
              <CardDescription className='text-gray-600 mt-1 sm:mt-2 text-sm sm:text-lg'>
                Add a new lecturer and view lecturers created this session.
              </CardDescription>
            </div>
          </div>

          <Button
            onClick={onOpenCreateModal}
            className='w-full sm:w-auto justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'
          >
            <Plus className='w-5 h-5 mr-2' />
            <span>New Lecturer</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='border rounded-md overflow-hidden'>
          <div className='px-4 py-3 bg-gray-50 flex items-center justify-between'>
            <p className='text-sm font-medium text-gray-700'>
              Session Created ({createdLecturers.length})
            </p>
          </div>
          
          {createdLecturers.length === 0 ? (
            <div className='p-6 text-sm text-gray-500 text-center'>
              No lecturers created yet this session.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='text-left text-gray-500'>
                    <th className='px-4 py-2 font-medium'>Name</th>
                    <th className='px-4 py-2 font-medium'>Email</th>
                    <th className='px-4 py-2 font-medium'>Temp Password</th>
                    <th className='px-4 py-2 font-medium'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {createdLecturers.map(lecturer => (
                    <tr key={lecturer.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-2 whitespace-nowrap font-medium text-gray-800'>
                        {lecturer.name}
                      </td>
                      <td className='px-4 py-2 whitespace-nowrap text-gray-600'>
                        {lecturer.email}
                      </td>
                      <td className='px-4 py-2 whitespace-nowrap text-xs'>
                        {lecturer.tempPassword ? (
                          <div className='flex items-center gap-2'>
                            <span className='font-mono select-none'>••••••••</span>
                            <button
                              type='button'
                              onClick={() => {
                                navigator.clipboard.writeText(lecturer.tempPassword);
                                toast.success('Copied');
                              }}
                              className='px-2 py-0.5 text-[11px] rounded border bg-white hover:bg-gray-100'
                              title='Copy temp password'
                              aria-label='Copy temp password'
                            >
                              <Clipboard className='w-4 h-4'/>
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                      <td className='px-4 py-2 whitespace-nowrap'>
                        <Badge className='bg-gray-100 text-gray-700 font-semibold'>
                          active
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
