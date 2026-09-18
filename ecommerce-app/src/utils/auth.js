import { loginRequest } from "../services/authService";

export async function login(email, password) {
  try {
    const data = await loginRequest(email, password);
    localStorage.setItem("authToken", data.token);
    return { success: true};
  } catch (err) {
    const msg = err.response?.data?.message ||  "Error al iniciar sesión";
    return { success: false, error: msg };
  }
}

export function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userData");
}

export function getCurrentUser() {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
}

export function isAuthenticated() {
  const token = localStorage.getItem("authToken");
  return token !== null;
}
