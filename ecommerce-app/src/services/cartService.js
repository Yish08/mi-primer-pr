import apiClient from "./apiClient";

function toFrontend(backendProducts) {
    return backendProducts.map((item) => ({
        ...item.product,
        quantity: item.quantity,
    }));
}

export async function getCart(userId) {
    const response = await apiClient.get(`/cart/user/${userId}`);
    return toFrontend(response.data.products || []);
}

export async function addToCartAPI(userId, productId, quantity = 1) {
    const response = await apiClient.post("/cart/add", {
        userId, productId, quantity,
    });
    return response.data;
}