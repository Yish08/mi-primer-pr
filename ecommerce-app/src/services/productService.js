import products from "../data/products.json";

export const fetchProducts = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(products);
    }, 2000);
  });
};

export const searchProducts = async (query) => {
  const lowerQuery = query.trim().toLowerCase();
  return fetchProducts().then((data) =>
    data.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery),
    ),
  );
};

export const getProductsByCategory = async (categoryId) => {
  return fetchProducts().then((data) =>
    data.filter((product) => product.category?._id === categoryId),
  );
};

export async function getProductById(id) {
  // Simulación de delay y búsqueda en mock data
  await new Promise((res) => setTimeout(res, 300));
  const products = await fetchProducts();
  return products.find((p) => p._id === id);
}
