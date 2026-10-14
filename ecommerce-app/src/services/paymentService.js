import apiClient from "./apiClient";

export async function getPaymentMethods() {
  const response = await apiClient.get("/payment-methods");
  return response.data.paymentMethods || response.data || [];
}

export async function getDefaultPaymentMethod() {
  const methods = await getPaymentMethods();
  return methods.find((m) => m.isDefault || m.default) || methods[0] || null;
}

export async function createPaymetMethod(data) {
  const response = await apiClient.post("/payment-methods", data);
  return response.data;
}

export async function updatePaymetMethod(id, data) {
  const response = await apiClient.put(`/payment-methods/${id}`, data);
  return response.data;
}

export async function deletePaymetMethod(id) {
  const response = await apiClient.delete(`/payment-methods/${id}`);
  return response.data;
}