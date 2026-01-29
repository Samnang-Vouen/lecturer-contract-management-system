import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import Input from '../../ui/Input';

export default function LecturerSearch({ searchQuery, setSearchQuery }) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <div className='bg-white rounded-md py-1 px-3 flex items-center gap-2 shadow-sm border border-gray-400 max-w-3xl mx-auto w-full'>
              <div className='flex items-center gap-2 w-full'>
                <Search className='text-gray-400 w-4 h-4' />
                <Input 
                  placeholder='Search by name' 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className='border-0 shadow-none h-8 text-sm placeholder-gray-400 w-full' 
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
