import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../store/useAuthStore";
import DashboardLayout from "../components/DashboardLayout";
import CreateUserModal from "../components/CreateUserModal";
import UserManagementHeader from "../components/superAdmin/superAdminUserManagement/UserManagementHeader.jsx";
import UserFilters from "../components/superAdmin/superAdminUserManagement/UserFilters.jsx";
import UserTable from "../components/superAdmin/superAdminUserManagement/UserTable.jsx";
import UserActionMenu from "../components/superAdmin/superAdminUserManagement/UserActionMenu.jsx";
import EditUserModal from "../components/superAdmin/superAdminUserManagement/EditUserModal.jsx";
import DeleteUserModal from "../components/superAdmin/superAdminUserManagement/DeleteUserModal.jsx";
import { useUserManagement } from "../hooks/superAdmin/superAdminUserManangement/useUserManagement.js";
import { useUserActions } from "../hooks/superAdmin/superAdminUserManangement/useUserActions.js";
import { useUrlParams } from "../hooks/superAdmin/superAdminUserManangement/useUrlParams.js";
import { normalizeUserData } from "../utils/userHelpers.jsx";

export default function UserManagement() {
    const { authUser, logout, isCheckingAuth } = useAuthStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });

    // Custom hooks for data management
    const {
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
    } = useUserManagement(logout);

    // Custom hook for user actions
    const {
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
    } = useUserActions(setUsers, filteredUsers, page, setPage, limit);

    // Custom hook for URL parameter management
    const { searchParams, setSearchParams } = useUrlParams(page, setPage, limit, setLimit);

    // Open create modal automatically if ?create=1 is present
    useEffect(() => {
        const c = searchParams.get('create');
        if (c === '1') {
            setIsCreateModalOpen(true);
            const params = new URLSearchParams(searchParams);
            params.delete('create');
            setSearchParams(params, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Menu management
    const closeMenu = () => setOpenMenuId(null);

    const openMenu = (userId, event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        
        const menuWidth = 192; // w-48 = 12rem = 192px
        const menuHeight = 140; // Approximate height of 3 buttons
        const spacing = 8;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Horizontal positioning: prioritize left side placement
        let x = rect.left - menuWidth - spacing;
        
        // If menu goes off-screen on the left, show on right side instead
        if (x < spacing) {
            x = rect.right + spacing;
            
            // If it also goes off-screen on the right, align to right edge
            if (x + menuWidth > viewportWidth - spacing) {
                x = viewportWidth - menuWidth - spacing;
            }
        }
        
        // Vertical positioning: align with button, but keep within viewport
        let y = rect.top;
        
        // If menu goes below viewport, shift it up
        if (y + menuHeight > viewportHeight - spacing) {
            y = Math.max(spacing, viewportHeight - menuHeight - spacing);
        }
        
        // Ensure minimum top spacing
        y = Math.max(spacing, y);
        
        setMenuCoords({ x, y });
        setOpenMenuId(userId);
    };

    const handleMenuAction = (action, user) => {
        action(user);
        closeMenu();
    };

    // Close menu on outside click or scroll/resize
    useEffect(() => {
        function onDocClick(e) { 
            if (!e.target.closest('.user-action-menu') && !e.target.closest('.user-action-trigger')) {
                closeMenu();
            }
        }
        if (openMenuId) {
            document.addEventListener('click', onDocClick);
        }
        const onScrollOrResize = () => closeMenu();
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
        return () => {
            document.removeEventListener('click', onDocClick);
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [openMenuId]);

    return (
        <DashboardLayout
            user={authUser}
            isLoading={isCheckingAuth}
            logout={logout}
        >
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
                <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8">
                    {/* Header Section */}
                    <UserManagementHeader onCreateUser={() => setIsCreateModalOpen(true)} />

                    {/* Search & Filters */}
                    <UserFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedRole={selectedRole}
                        setSelectedRole={setSelectedRole}
                        selectedDepartment={selectedDepartment}
                        setSelectedDepartment={setSelectedDepartment}
                        limit={limit}
                        setLimit={setLimit}
                    />

                    {/* Users Table */}
                    <UserTable
                        users={filteredUsers}
                        isLoading={isLoading}
                        totalUsers={totalUsers}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        totalPages={totalPages}
                        onMenuOpen={openMenu}
                    />

                    {/* Create User Modal */}
                    <CreateUserModal 
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onUserCreated={(newUser) => {
                            const normalized = normalizeUserData(newUser);
                            setUsers(prev => [normalized, ...prev]);
                        }}
                    />
                    
                    {/* Edit User Modal */}
                    <EditUserModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onSubmit={submitEdit}
                    />

                    {/* Delete User Modal */}
                    <DeleteUserModal
                        isOpen={isDeleteModalOpen}
                        onClose={cancelDelete}
                        user={userToDelete}
                        onConfirm={confirmDelete}
                    />

                    {/* Floating Action Menu - Rendered at body level */}
                    {openMenuId && createPortal(
                        (() => {
                            const user = users.find(u => u.id === openMenuId);
                            return (
                                <UserActionMenu
                                    user={user}
                                    menuCoords={menuCoords}
                                    onEdit={(u) => handleMenuAction(openEditModal, u)}
                                    onDeactivate={(u) => handleMenuAction(handleDeactivate, u)}
                                    onDelete={(u) => handleMenuAction(requestDelete, u)}
                                />
                            );
                        })(),
                        document.body
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}