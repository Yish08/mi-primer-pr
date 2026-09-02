import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `[API ${error.response.status}]`,
        error.response.data?.message,
      );
    } else if (error.request) {
      console.error(`[API] Backend no responde`);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
