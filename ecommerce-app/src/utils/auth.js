import { func } from "prop-types";
import { loginRequest, registerRequest } from "../services/authService";


export async function register(name, email, password, phone) {
  try{
    await registerRequest(name, email, password, phone);
    return await login(email, password);
  }catch (err){
    const msg = err.response?.data?.message ||  "Error al crear la cuenta";
    return { success: false, error: msg };
  }
}

export async function login(email, password) {
  try {
    const data = await loginRequest(email, password);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    return { success: true};
  } catch (err) {
    const msg = err.response?.data?.message ||  "Error al iniciar sesión";
    return { success: false, error: msg };
  }
}

export function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
}

function decodeToken(token) {
  try {
    const paylod = token.split(".")[1];
    return JSON.parse(atob(paylod));
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const token = localStorage.getItem("authToken");
  if (!token) return null;
  return decodeToken(token);
}

export function isAuthenticated() {
  const token = localStorage.getItem("authToken");
  return token !== null;
}
