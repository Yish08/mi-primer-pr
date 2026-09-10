import apiClient from "./apiClient";

export async function getCategoryById(id) {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
}

export async function getProductByCategory(id) {
    const response = await apiClient.get("/products/search", {
        params: { category: id },
    });
    return response.data.products;
}

export async function getAllCategories() {
    const response = await apiClient.get("/categories");
    return response.data;
}