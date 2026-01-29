import React from 'react';
import { Plus, Clipboard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import toast from 'react-hot-toast';

export default function SessionCreatedList({ createdLecturers, onOpenCreateModal }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Plus className='w-5 h-5'/> Create Lecturer
        </CardTitle>
        <CardDescription>Add a new lecturer and view lecturers created this session.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <Button onClick={onOpenCreateModal} className='flex items-center gap-2'>
            <Plus className='w-4 h-4'/> New Lecturer
          </Button>
        </div>
        
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
