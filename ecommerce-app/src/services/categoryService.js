import categories from "../data/categories.json";
import products from "../data/products.json";

export const fetchCategories = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(categories);
    }, 1200); // 1.2 segundos de delay
  });
};

export const fetchProducts = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(products);
    }, 800);
  });
};

export const searchCategories = async (query) => {
  const lowerQuery = query.trim().toLowerCase();
  return fetchCategories().then((data) =>
    data.filter(
      (cat) =>
        cat.name.toLowerCase().includes(lowerQuery) ||
        cat.description?.toLowerCase().includes(lowerQuery)
    )
  );
};

export const getCategoryById = async (categoryId) => {
  return fetchCategories().then((data) =>
    data.find((cat) => cat._id === categoryId)
  );
};

// Obtener todas las categorías hijas de una categoría padre
export const getChildCategories = async (parentCategoryId) => {
  return fetchCategories().then((data) =>
    data.filter((cat) => cat.parentCategory?._id === parentCategoryId)
  );
};

// Obtener productos por categoría específica
export const getProductsByCategory = async (categoryId) => {
  return fetchProducts().then((data) =>
    data.filter((product) => product.category._id === categoryId)
  );
};

// Obtener productos de una categoría incluyendo sus subcategorías
export const getProductsByCategoryAndChildren = async (categoryId) => {
  const allProducts = await fetchProducts();
  const allCategories = await fetchCategories();

  // Encontrar la categoría
  const category = allCategories.find((cat) => cat._id === categoryId);

  if (!category) return [];

  // Si es una categoría padre (parentCategory is null)
  if (!category.parentCategory) {
    // Obtener IDs de todas las categorías hijas
    const childCategoryIds = allCategories
      .filter((cat) => cat.parentCategory?._id === categoryId)
      .map((cat) => cat._id);

    // Incluir el ID de la categoría padre también
    const allCategoryIds = [categoryId, ...childCategoryIds];

    // Retornar productos de la categoría padre y sus hijas
    return allProducts.filter((product) =>
      allCategoryIds.includes(product.category._id)
    );
  }

  // Si es una categoría hija, solo retornar sus productos
  return allProducts.filter((product) => product.category._id === categoryId);
};

// Obtener categorías principales (sin padre)
export const getParentCategories = async () => {
  return fetchCategories().then((data) =>
    data.filter((cat) => cat.parentCategory === null)
  );
};
