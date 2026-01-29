import { useState } from 'react';
import { userService } from '../../../services/userService.js';
import { formatFullName } from '../../../utils/userHelpers.jsx';

/**
 * Custom hook for user actions (edit, delete, deactivate)
 */
export const useUserActions = (setUsers, filteredUsers, page, setPage, limit) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    role: '', 
    department: '' 
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  /**
   * Handle user status toggle (activate/deactivate)
   */
  const handleDeactivate = async (user) => {
    try {
      const result = await userService.updateUserStatus(user.id);
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: result.status } : u
      ));
    } catch (error) {
      console.error('Deactivate failed', error);
    }
  };

  /**
   * Open edit modal with user data
   */
  const openEditModal = (user) => {
    setEditingUser(user);
    const normalizedRole = (user.role || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
    
    setEditForm({
      name: formatFullName(user),
      email: user.email,
      role: normalizedRole,
      department: user.department
    });
    setIsEditModalOpen(true);
  };

  /**
   * Submit user edit
   */
  const submitEdit = async () => {
    if (!editingUser) return;
    
    try {
      const payloadRole = editForm.role.trim().toLowerCase();
      await userService.updateUser(editingUser.id, {
        fullName: editForm.name,
        email: editForm.email,
        role: payloadRole,
        department: editForm.department
      });

      // Refresh user list
      const refreshedPayload = await userService.getUsers();
      const refreshedList = Array.isArray(refreshedPayload) 
        ? refreshedPayload 
        : refreshedPayload.data;
      
      setUsers(Array.isArray(refreshedList) ? refreshedList : []);
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Update failed', error);
    }
  };

  /**
   * Request user deletion (open confirmation modal)
   */
  const requestDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  /**
   * Confirm and execute user deletion
   */
  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await userService.deleteUser(userToDelete.id);
      
      const remaining = filteredUsers.length - 1;
      const newTotalPages = Math.ceil(remaining / limit) || 1;
      
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      
      if (page > newTotalPages) {
        setPage(newTotalPages);
      }
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  /**
   * Cancel deletion
   */
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  return {
    isEditModalOpen,
    setIsEditModalOpen,
    editingUser,
    editForm,
    setEditForm,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    userToDelete,
    handleDeactivate,
    openEditModal,
    submitEdit,
    requestDelete,
    confirmDelete,
    cancelDelete,
  };
};
