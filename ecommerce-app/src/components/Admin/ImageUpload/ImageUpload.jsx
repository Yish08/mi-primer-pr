import { useRef, useState } from "react";
import { uploadImage } from "../../../services/uploadService";
import Button from "../../common/Button";
import Icon from "../../common/Icon/Icon";
import "./ImageUpload.css";

// Mismas reglas que el backend (uploadMiddleware.js): se revisan antes de
// subir para avisar al instante sin gastar una peticion
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Selector de imagen del producto: al elegir un archivo (clic o arrastrando)
// se sube a Cloudinary y se entrega la URL resultante con onChange(url).
export default function ImageUpload({ value, onChange, onUploadingChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const setBusy = (busy) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato no permitido. Usa una imagen JPG, PNG, WEBP o GIF");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen no debe pesar más de ${MAX_SIZE_MB} MB`);
      return;
    }

    setBusy(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo subir la imagen");
    } finally {
      setBusy(false);
      // Permite volver a elegir el mismo archivo despues de un error
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) handleFile(e.dataTransfer.files?.[0]);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="image-upload">
      <span className="input-label">Imagen del producto</span>

      <div
        className={`image-upload-zone${dragging ? " is-dragging" : ""}${
          value ? " has-image" : ""
        }`}
        onClick={!value && !uploading ? openPicker : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <img className="image-upload-preview" src={value} alt="Vista previa" />
        ) : (
          <div className="image-upload-empty">
            <Icon name="image" size={36} />
            <strong>Arrastra una imagen aquí</strong>
            <span>o haz clic para elegirla de tu computadora</span>
            <small>JPG, PNG, WEBP o GIF · máximo {MAX_SIZE_MB} MB</small>
          </div>
        )}

        {uploading && (
          <div className="image-upload-overlay" role="status">
            <span className="image-upload-spinner" aria-hidden="true" />
            Subiendo a Cloudinary...
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="visually-hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        tabIndex={-1}
      />

      <div className="image-upload-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openPicker}
          disabled={uploading}
        >
          <Icon name="image" size={16} />
          {value ? "Cambiar imagen" : "Elegir imagen"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            disabled={uploading}
          >
            <Icon name="trash" size={16} />
            Quitar
          </Button>
        )}
      </div>

      {error && <span className="product-form-error">{error}</span>}
    </div>
  );
}
