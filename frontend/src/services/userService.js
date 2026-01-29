import { axiosInstance } from "../lib/axios";

/**
 * User Service
 * Handles all user-related API calls
 */

/**
 * Create a new user
 * @param {Object} payload - User data
 * @returns {Promise} API response with user data and temporary password
 */
export async function createUser(payload) {
  const res = await axiosInstance.post('/users', payload);
  return res.data;
}

export const userService = {
  /**
   * Fetch users with optional filters and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getUsers(params = {}) {
    const response = await axiosInstance.get('/users', { params });
    return response.data;
  },

  /**
   * Update user status (activate/deactivate)
   * @param {string|number} userId - User ID
   * @returns {Promise} API response
   */
  async updateUserStatus(userId) {
    const response = await axiosInstance.patch(`/users/${userId}/status`);
    return response.data;
  },

  /**
   * Delete a user
   * @param {string|number} userId - User ID
   * @returns {Promise} API response
   */
  async deleteUser(userId) {
    await axiosInstance.delete(`/users/${userId}`);
  },

  /**
   * Update user information
   * @param {string|number} userId - User ID
   * @param {Object} data - User data to update
   * @returns {Promise} API response
   */
  async updateUser(userId, data) {
    const response = await axiosInstance.put(`/users/${userId}`, data);
    return response.data;
  },
};
