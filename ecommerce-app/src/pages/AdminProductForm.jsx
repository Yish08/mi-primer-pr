import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/common/Loading/Loading";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import ProductForm from "../components/Admin/ProductForm/ProductForm";
import useFetch from "../hooks/useFetch";
import { getAllCategories } from "../services/categoriesService";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "../services/productsService";
import "./AdminProducts.css";

// Adapta el producto del backend a los valores del formulario
const toFormValues = (product) => ({
  name: product.name ?? "",
  description: product.description ?? "",
  price: product.price ?? "",
  stock: product.stock ?? "",
  category: product.category?._id ?? "",
  imageUrl: product.imagesUrl?.[0] ?? "",
});

// El backend responde { message } o, si falla express-validator, { errors: [{ msg }] }
const getApiError = (err, fallback) => {
  const data = err.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => e.msg).join(". ");
  return data?.message || fallback;
};

export default function AdminProductForm() {
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    data,
    loading,
    error: loadError,
  } = useFetch(
    async () => {
      const [categoriesData, product] = await Promise.all([
        getAllCategories(),
        isEdit ? getProductById(productId) : null,
      ]);
      return {
        categories: categoriesData || [],
        initialValues: product ? toFormValues(product) : {},
      };
    },
    [isEdit, productId],
    {
      defaultErrorMessage: isEdit
        ? "No se pudo cargar el producto"
        : "No se pudieron cargar las categorías",
      preferBackendMessage: true,
    },
  );

  const categories = data?.categories || [];
  const initialValues = data?.initialValues || null;

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isEdit) await updateProduct(productId, payload);
      else await createProduct(payload);
      navigate("/admin/products");
    } catch (err) {
      setSubmitError(getApiError(err, "No se pudo guardar el producto"));
      setSubmitting(false);
    }
  };

  const goBack = () => navigate("/admin/products");

  if (loading) {
    return (
      <div className="admin-page admin-page--narrow">
        <Loading message="Cargando..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-page admin-page--narrow">
        <ErrorMessage message={loadError} />
      </div>
    );
  }

  return (
    <div className="admin-page admin-page--narrow">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Panel de administración</p>
          <h1>{isEdit ? "Editar producto" : "Nuevo producto"}</h1>
        </div>
      </header>

      {submitError && <ErrorMessage message={submitError} />}

      <ProductForm
        key={productId ?? "new"}
        initialValues={initialValues}
        categories={categories}
        isEdit={isEdit}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={goBack}
      />
    </div>
  );
}
