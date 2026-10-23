import apiClient from "./apiClient";

export async function getAllProducts() {
  const response = await apiClient.get("/products");
  return response.data;
}

export async function getProductById(id) {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
}

export async function searchProducts(query) {
    const response = await apiClient.get("/products/search", {
        params: { q: query },
    });
    return response.data.products;
}

export async function createProduct(data) {
  const response = await apiClient.post("/products", data);
  return response.data;
}

export async function updateProduct(id, data) {
  const response = await apiClient.put(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);
}
