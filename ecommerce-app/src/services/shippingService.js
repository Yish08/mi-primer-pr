import apiClient from "./apiClient";

export async function getShippingAddresses() {
  const response = await apiClient.get("/addresses");
  return response.data.addresses || [];
}

export async function getDefaultShippingAddress() {
  const addresses = await getShippingAddresses();
  return addresses.find((a) => a.isDefault) || addresses[0] || null;
}

export async function createAddress(addressData) {
  const response = await apiClient.post("/addresses", addressData);
  return response.data;
}

export async function updateAddress(id, addressData) {
  const response = await apiClient.put(`/addresses/${id}`, addressData);
  return response.data;
}

export async function deleteAddress(id) {
  const response = await apiClient.delete(`/addresses/${id}`);
  return response.data;
}