import apiClient from "./apiClient";

export async function loginRequest(email, password) {
    const response = await apiClient.post("/auth/login",
        {email, password}
     );
    return response.data;
}

export async function registerRequest(name, email, password, phone) {
    const response = await apiClient.post("/auth/register", 
        {name, email, password, phone}
    );
    return response.data;
}