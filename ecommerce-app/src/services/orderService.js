import apiClient from "./apiClient";

export async function createOrder(orderData) {
    const response = await apiClient.post("/orders", orderData);
    return response.data;
}

