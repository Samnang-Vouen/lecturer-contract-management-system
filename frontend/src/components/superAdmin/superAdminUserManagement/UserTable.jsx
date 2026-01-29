import React from 'react';
import { Users, Mail, Calendar, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card.jsx';
import Badge from '../../ui/Badge.jsx';
import { 
  formatFullName, 
  getRoleBadgeVariant, 
  getRoleIcon, 
  getStatusBadgeClass 
} from '../../../utils/userHelpers.jsx';

/**
 * UserTable Component
 * Displays the user list in a table format with pagination
 */
export default function UserTable({
  users,
  isLoading,
  totalUsers,
  page,
  setPage,
  limit,
  totalPages,
  onMenuOpen,
}) {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">Loading user data...</p>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-12 text-center text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-gray-400">Try adjusting your search criteria or filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">
                User Directory ({totalUsers} users)
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage all registered users
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                    Department
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                    Last Activity
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => {
                  const fullName = formatFullName(user);
                  return (
                    <tr key={user.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-xs sm:text-sm">
                                {fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 truncate max-w-[140px] sm:max-w-none">
                              {fullName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 truncate max-w-[220px]">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <Badge 
                          variant={getRoleBadgeVariant(user.role)} 
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          {getRoleIcon(user.role)}
                          {(user.role || '').replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 hidden lg:table-cell">
                        <span className="text-sm text-gray-700 font-medium">
                          {user.department}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 'secondary'} 
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(user.status)}`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-1 ${user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {user.lastLogin && user.lastLogin !== 'Never' 
                              ? new Date(user.lastLogin).toLocaleDateString() 
                              : 'Never logged in'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right relative">
                        <button 
                          className="user-action-trigger p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onMenuOpen(user.id, e);
                          }}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
              <div className="flex items-center">
                <span className="text-xs sm:text-sm text-gray-600">
                  Showing <span className="font-semibold">{((page - 1) * limit) + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(page * limit, totalUsers)}</span> of{' '}
                  <span className="font-semibold">{totalUsers}</span> users
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === 1 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), page + 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          p === page 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                </div>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === totalPages 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
