import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../layout/Breadcrumb/Breadcrumb";
import {
  getCategoryById,
  getProductsByCategoryAndChildren,
} from "../../services/categoryService";
import ProductCard from "../ProductCard/ProductCard";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Loading from "../common/Loading/Loading";
import "./CategoryProducts.css";

export default function CategoryProducts({ categoryId }) {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadCategoryAndProducts = async () => {
      try {
        // Cargar la categoría y sus productos
        const [categoryData, productsData] = await Promise.all([
          getCategoryById(categoryId),
          getProductsByCategoryAndChildren(categoryId),
        ]);

        if (!categoryData) {
          setError("Categoría no encontrada");
          return;
        }

        setCategory(categoryData);
        setProducts(productsData);
      } catch (err) {
        setError("Error al cargar la categoría o productos");
      } finally {
        setLoading(false);
      }
    };

    loadCategoryAndProducts();
  }, [categoryId]);

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
      <Breadcrumb
        items={[{ label: "Inicio", to: "/" }, { label: category.name }]}
      />
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
