import apiClient from "./apiClient";

// Sube una imagen a Cloudinary a traves de POST /api/upload (solo admin).
// apiClient manda "Content-Type: application/json" por defecto y con ese
// header axios convertiria el FormData a JSON (el archivo se perderia):
// por eso aqui se indica multipart y el navegador completa el boundary.
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await apiClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // { url, publicId, width, height, format, bytes }
}
