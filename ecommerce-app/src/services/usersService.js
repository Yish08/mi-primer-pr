import apiClient from "./apiClient";

export async function getUserById(userId) {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
}

export async function updateUser(userId, userData) {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
}
