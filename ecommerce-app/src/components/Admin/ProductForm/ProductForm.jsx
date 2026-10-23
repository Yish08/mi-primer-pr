import { useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import ImageUpload from "../ImageUpload/ImageUpload";
import "./ProductForm.css";

const PLACEHOLDER_IMAGE = "/img/products/placeholder.svg";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  imageUrl: "",
};

// Las subcategorias se muestran como "Padre: Hija"
const categoryLabel = (category) =>
  category.parentCategory?.name
    ? `${category.parentCategory.name}: ${category.name}`
    : category.name;

export default function ProductForm({
  initialValues,
  categories = [],
  isEdit = false,
  submitting = false,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [errors, setErrors] = useState({});
  // Mientras la imagen se sube a Cloudinary no se puede guardar el producto
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (form.price === "" || Number(form.price) < 0) {
      newErrors.price = "El precio debe ser un número mayor o igual a 0";
    }
    if (
      form.stock !== "" &&
      (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)
    ) {
      newErrors.stock = "El stock debe ser un entero mayor o igual a 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: form.stock === "" ? 0 : Number(form.stock),
    };

    // Al editar siempre se manda: null le quita la categoria al producto
    if (isEdit) payload.category = form.category || null;
    else if (form.category) payload.category = form.category;

    // La URL viene de Cloudinary (ImageUpload). Al editar, quitar la imagen
    // la regresa al placeholder; al crear, el backend pone el placeholder solo.
    if (form.imageUrl) payload.imagesUrl = [form.imageUrl];
    else if (isEdit) payload.imagesUrl = [PLACEHOLDER_IMAGE];

    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploadingImage || !validate()) return;
    onSubmit(buildPayload());
  };

  const sortedCategories = [...categories].sort((a, b) =>
    categoryLabel(a).localeCompare(categoryLabel(b), "es")
  );

  return (
    <form className="product-form" onSubmit={handleSubmit} noValidate>
      <div className="product-form-field product-form-full">
        <Input
          id="product-name"
          name="name"
          label="Nombre *"
          value={form.name}
          onChange={handleChange}
          placeholder="Ej. Audífonos inalámbricos"
        />
        {errors.name && <span className="product-form-error">{errors.name}</span>}
      </div>

      <div className="product-form-field product-form-full">
        <label htmlFor="product-description" className="input-label">
          Descripción
        </label>
        <textarea
          id="product-description"
          name="description"
          className="input-field product-form-textarea"
          value={form.description}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <div className="product-form-field">
        <Input
          id="product-price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          label="Precio *"
          value={form.price}
          onChange={handleChange}
        />
        {errors.price && <span className="product-form-error">{errors.price}</span>}
      </div>

      <div className="product-form-field">
        <Input
          id="product-stock"
          name="stock"
          type="number"
          min="0"
          step="1"
          label="Stock"
          value={form.stock}
          onChange={handleChange}
        />
        {errors.stock && <span className="product-form-error">{errors.stock}</span>}
      </div>

      <div className="product-form-field">
        <label htmlFor="product-category" className="input-label">
          Categoría
        </label>
        <select
          id="product-category"
          name="category"
          className="input-field"
          value={form.category}
          onChange={handleChange}
        >
          <option value="">Sin categoría</option>
          {sortedCategories.map((category) => (
            <option key={category._id} value={category._id}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="product-form-field product-form-full">
        <ImageUpload
          value={form.imageUrl === PLACEHOLDER_IMAGE ? "" : form.imageUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
          onUploadingChange={setUploadingImage}
        />
      </div>

      <div className="product-form-actions product-form-full">
        <Button type="submit" disabled={submitting || uploadingImage}>
          {submitting
            ? "Guardando..."
            : uploadingImage
              ? "Subiendo imagen..."
            : isEdit
              ? "Guardar Cambios"
              : "Crear Producto"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
