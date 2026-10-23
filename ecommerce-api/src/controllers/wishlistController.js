import WishList from "../models/WishList.js";
import Product from "../models/Product.js";

// Nunca exponer el hash de la contraseña al hacer populate del usuario
const USER_FIELDS = "name email";

const isOwnerOrAdmin = (req, ownerId) =>
  req.user.role === "admin" || String(ownerId) === String(req.user.userId);

// Respuesta comun para el usuario logueado: solo los productos poblados.
// Se filtran los null que deja populate cuando un producto fue borrado.
const toResponse = async (wishlist) => {
  if (!wishlist) return { products: [] };
  await wishlist.populate("products");
  return { products: wishlist.products.filter(Boolean) };
};

// GET /wishlist — favoritos del usuario del token
const getMyWishlist = async (req, res, next) => {
  try {
    const wishlist = await WishList.findOne({ user: req.user.userId });
    res.status(200).json(await toResponse(wishlist));
  } catch (error) {
    next(error);
  }
};

// POST /wishlist { productId }
// $addToSet + upsert es atomico: crea la wishlist si no existe, no duplica
// productos y dos peticiones simultaneas no se pisan entre si.
const addProductToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const wishlist = await WishList.findOneAndUpdate(
      { user: req.user.userId },
      { $addToSet: { products: productId } },
      { new: true, upsert: true }
    );

    res.status(200).json(await toResponse(wishlist));
  } catch (error) {
    next(error);
  }
};

// DELETE /wishlist/products/:productId
// $pull atomico: varios productos movidos al carrito a la vez no se pierden
// (con leer-modificar-guardar, borrados simultaneos se pisaban).
const removeProductFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await WishList.findOneAndUpdate(
      { user: req.user.userId },
      { $pull: { products: productId } },
      { new: true }
    );

    res.status(200).json(await toResponse(wishlist));
  } catch (error) {
    next(error);
  }
};

// GET /wishlist/all — solo admin
const getWishlists = async (req, res, next) => {
  try {
    const wishlists = await WishList.find()
      .populate("user", USER_FIELDS)
      .populate("products");
    res.status(200).json(wishlists);
  } catch (error) {
    next(error);
  }
};

// GET /wishlist/user/:id — el propio usuario o admin (isSelfOrAdmin en la ruta)
const getWishlistByUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await WishList.findOne({ user: id })
      .populate("user", USER_FIELDS)
      .populate("products");
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    res.status(200).json(wishlist);
  } catch (error) {
    next(error);
  }
};

// DELETE /wishlist/:id — borra la lista completa (dueño o admin)
const deleteWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await WishList.findById(id);
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    if (!isOwnerOrAdmin(req, wishlist.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await WishList.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getMyWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  getWishlists,
  getWishlistByUser,
  deleteWishlist,
};
