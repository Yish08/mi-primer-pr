import { fetchUsers } from "../services/userService";

const validUsers = {
  "admin@email.com": "admin123",
  "cliente@email.com": "cliente123",
};

export async function login(email, password) {
  if (!validUsers[email] || validUsers[email] !== password) {
    return {
      success: false,
      error: "Email o contraseña incorrectos",
    };
  }

  const users = await fetchUsers();
  const user = users.find((u) => u.email === email);

  if (user) {
    const token = btoa(`${email}:${Date.now()}`);
    const userWithLoginDate = { ...user, loginDate: new Date().toISOString() };
    localStorage.setItem("authToken", token);
    localStorage.setItem("userData", JSON.stringify(userWithLoginDate));
    return { success: true, user: userWithLoginDate };
  }
  return { success: false, error: "Usuario no encontrado" };
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
