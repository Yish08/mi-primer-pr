import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import Breadcrumb from "../../layout/Breadcrumb/Breadcrumb";
import { getCategoryById, getProductByCategory } from "../../services/categoriesService";
import ProductCard from "../ProductCard/ProductCard";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Loading from "../common/Loading/Loading";
import "./CategoryProducts.css";

export default function CategoryProducts({ categoryId }) {
  const { data, loading, error } = useFetch(
    async () => {
      const [categoryData, productsData] = await Promise.all([
        getCategoryById(categoryId),
        getProductByCategory(categoryId),
      ]);
      if (!categoryData) return null;
      return { category: categoryData, products: productsData || [] };
    },
    [categoryId],
    {
      notFoundMessage: "Categoría no encontrada",
      defaultErrorMessage: "Error al cargar la categoría o productos",
      emptyErrorMessage: "Categoría no encontrada",
    },
  );

  const category = data?.category || null;
  const products = data?.products || [];

  if (loading) {
    return (
      <div className="category-products-root">
        <Loading message="Cargando categoría y productos..." />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="category-products-root">
        <ErrorMessage message={error || "Categoría no encontrada"}>
          <p className="category-products-muted">
            Vuelve al <Link to="/">inicio</Link> o explora nuestras categorías
            destacadas.
          </p>
        </ErrorMessage>
      </div>
    );
  }

  return (
    <div className="category-products-root">
      <Breadcrumb categories={category} />
      <div className="category-products-container">
        <div className="category-products-header">
          <div className="category-products-title">
            <h1 className="category-products-h1">
              {category.parentCategory
                ? `${category.parentCategory.name}: ${category.name}`
                : category.name}
            </h1>
            {category.description && (
              <p className="category-products-muted">{category.description}</p>
            )}
          </div>
        </div>
        {products.length > 0 ? (
          <div className="category-products-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                orientation="vertical"
                className="card"
              />
            ))}
          </div>
        ) : (
          <ErrorMessage message="No se encontraron productos">
            <p className="category-products-muted">
              No hay productos disponibles en esta categoría por el momento.
            </p>
          </ErrorMessage>
        )}
      </div>
    </div>
  );
}
