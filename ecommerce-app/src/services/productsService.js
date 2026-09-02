import apiClient from "./apiClient";

export async function getAllProducts() {
  const response = await apiClient.get("/products");
  console.log(response.data);
  return response.data;
}
