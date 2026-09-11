import apiClient from "./apiClient";

export async function getAllProducts() {
  const response = await apiClient.get("/products");
  console.log(response.data);
  return response.data;
}

export async function getProductById(id) {
  const response = await apiClient.get(`/products/${id}`);
  console.log(response.data);
  return response.data;
}

export async function searchProducts(query) {
    const response = await apiClient.get("/products/search", {
        params: { q: query },
    });
    return response.data.products;
}

export async function searchProductsCompleto({ q, category } = {}) {
  const response = await apiClient.get("/products/search", {
    params: { q, category },   
  });
  return response.data.products;
}