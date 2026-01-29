import { useState, useEffect } from 'react';
import { userService } from '../../../services/userService.js';
import { formatFullName } from '../../../utils/userHelpers.jsx';

/**
 * Custom hook for managing user data and pagination
 * Handles fetching, filtering, and search functionality
 */
export const useUserManagement = (logout) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const params = { page, limit };
        
        if (selectedRole !== 'all' && ['admin', 'management', 'superadmin'].includes(selectedRole)) {
          params.role = selectedRole;
        }
        if (selectedDepartment !== 'all') {
          params.department = selectedDepartment;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }

        const payload = await userService.getUsers(params);
        const list = Array.isArray(payload) ? payload : payload.data;
        
        setUsers(list);
        
        if (payload.meta) {
          setTotalPages(payload.meta.totalPages);
          setTotalUsers(payload.meta.total);
          if (payload.meta.limit && payload.meta.limit !== limit) {
            setLimit(payload.meta.limit);
          }
          if (page > payload.meta.totalPages && payload.meta.totalPages > 0) {
            setPage(payload.meta.totalPages);
          }
        } else {
          setTotalPages(1);
          setTotalUsers(list.length);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        if (error.response?.status === 401) {
          logout();
          return;
        }
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [logout, page, limit, selectedRole, selectedDepartment, searchQuery]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedRole, selectedDepartment]);

  // Filter users based on search query
  const q = (searchQuery || '').trim().toLowerCase();
  const filteredUsers = q
    ? users.filter(u => {
        const fullName = formatFullName(u).toLowerCase();
        const email = (u.email || '').toLowerCase();
        return fullName.includes(q) || email.includes(q);
      })
    : users;

  return {
    users,
    setUsers,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    selectedDepartment,
    setSelectedDepartment,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    totalUsers,
    filteredUsers,
  };
};
