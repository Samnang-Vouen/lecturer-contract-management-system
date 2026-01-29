import React from 'react';
import { Search, Filter, Shield, Users, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card.jsx';
import Input from '../../ui/Input.jsx';
import Select, { SelectItem } from '../../ui/Select.jsx';
import { DEPARTMENT_OPTIONS } from '../../../utils/userHelpers.jsx';

/**
 * UserFilters Component
 * Search and filter controls for user list
 */
export default function UserFilters({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  selectedDepartment,
  setSelectedDepartment,
  limit,
  setLimit,
}) {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-900">Search & Filter Users</CardTitle>
            <CardDescription className="text-gray-600">
              Find and filter users by name, email, role, or department
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search by name or email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl" 
              />
            </div>
          </div>
          
          {/* Role Filter */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Filter by Role
            </label>
            <Select 
              value={selectedRole} 
              onValueChange={setSelectedRole} 
              placeholder="Select Role" 
              buttonClassName="h-11 rounded-xl"
            >
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
            </Select>
          </div>
          
          {/* Department Filter */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Filter by Department
            </label>
            <Select 
              value={selectedDepartment} 
              onValueChange={setSelectedDepartment} 
              placeholder="Select Department" 
              buttonClassName="h-11 rounded-xl"
            >
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENT_OPTIONS.filter(d => d !== 'all').map(dept => 
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              )}
            </Select>
          </div>
          
          {/* Results per Page */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Results per Page
            </label>
            <Select 
              value={String(limit)} 
              onValueChange={(v) => setLimit(parseInt(v))} 
              placeholder="Page Size" 
              buttonClassName="h-11 rounded-xl"
            >
              <SelectItem value="5">5 users</SelectItem>
              <SelectItem value="10">10 users</SelectItem>
              <SelectItem value="25">25 users</SelectItem>
              <SelectItem value="50">50 users</SelectItem>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
