import apiClient from "./apiClient";

// El backend saca el usuario del token; todas responden { products: [...] }

export async function getWishlist() {
    const response = await apiClient.get("/wishlist");
    return response.data.products || [];
}

export async function addToWishlist(productId) {
    const response = await apiClient.post("/wishlist", { productId });
    return response.data.products || [];
}

export async function removeFromWishlist(productId) {
    const response = await apiClient.delete(`/wishlist/products/${productId}`);
    return response.data.products || [];
}
