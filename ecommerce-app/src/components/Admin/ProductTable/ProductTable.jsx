import Badge from "../../common/Badge/Badge";
import Button from "../../common/Button";
import "./ProductTable.css";

const PLACEHOLDER = "/img/products/placeholder.svg";
const LOW_STOCK = 5;

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

const stockBadge = (stock = 0) => {
  if (stock <= 0) return { text: "Agotado", variant: "error" };
  if (stock <= LOW_STOCK) return { text: "Stock bajo", variant: "warning" };
  return { text: "Disponible", variant: "success" };
};

export default function ProductTable({ products, onEdit, onDelete, deletingId }) {
  return (
    <div className="product-table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th className="product-table-num">Precio</th>
            <th className="product-table-num">Stock</th>
            <th className="product-table-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const badge = stockBadge(product.stock);
            return (
              <tr key={product._id}>
                <td data-label="Producto">
                  <div className="product-table-product">
                    <div className="product-table-thumb">
                      <img
                        src={product.imagesUrl?.[0] || PLACEHOLDER}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER;
                        }}
                      />
                    </div>
                    <div className="product-table-info">
                      <span className="product-table-name">{product.name}</span>
                      {product.description && (
                        <span className="product-table-desc">
                          {product.description}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td data-label="Categoría">
                  {product.category?.name ? (
                    <Badge text={product.category.name} variant="info" />
                  ) : (
                    <span className="product-table-muted">Sin categoría</span>
                  )}
                </td>
                <td data-label="Precio" className="product-table-num">
                  <span className="product-table-price">
                    {formatMoney(product.price)}
                  </span>
                </td>
                <td data-label="Stock" className="product-table-num">
                  <div className="product-table-stock">
                    <span className="product-table-stock-qty">
                      {product.stock ?? 0}
                    </span>
                    <Badge text={badge.text} variant={badge.variant} />
                  </div>
                </td>
                <td className="product-table-actions">
                  <Button
                    variant="outline"
                    onClick={() => onEdit(product._id)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onDelete(product)}
                    disabled={deletingId === product._id}
                  >
                    {deletingId === product._id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
