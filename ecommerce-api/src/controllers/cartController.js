import Cart from "../models/Cart.js";

// Nunca exponer el hash de la contraseña al hacer populate del usuario
const USER_FIELDS = "name email";

const isOwnerOrAdmin = (req, ownerId) =>
  req.user.role === "admin" || String(ownerId) === String(req.user.userId);

async function getCarts(req, res, next) {
  try {
    const carts = await Cart.find()
      .populate("user", USER_FIELDS)
      .populate("products.product");
    res.json(carts);
  } catch (error) {
    next(error);
  }
}

async function getCartById(req, res, next) {
  try {
    const id = req.params.id;
    const cart = await Cart.findById(id)
      .populate("user", USER_FIELDS)
      .populate("products.product");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

async function getCartByUser(req, res, next) {
  try {
    const userId = req.params.id;
    const cart = await Cart.findOne({ user: userId })
      .populate("user", USER_FIELDS)
      .populate("products.product");
    if (!cart) {
      return res.status(200).json({ user: userId, products: [] });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

async function createCart(req, res, next) {
  try {
    const { user, products } = req.body;

    if (!user || !products || !Array.isArray(products)) {
      return res
        .status(400)
        .json({ error: "User and products array is required" });
    }

    if (!isOwnerOrAdmin(req, user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    for (let i = 0; i < products.length; i++) {
      if (
        !products[i].product ||
        !products[i].quantity ||
        products[i].quantity < 1
      ) {
        return res.status(400).json({
          error: "Each product must have product ID and quantity > = 1",
        });
      }
    }

    const newCart = await Cart.create({
      user,
      products,
    });

    await newCart.populate("user", USER_FIELDS);
    await newCart.populate("products.product");

    res.status(201).json(newCart);
  } catch (error) {
    next(error);
  }
}

async function updateCart(req, res, next) {
  try {
    const { id } = req.params;
    const { user, products } = req.body;

    if (!user || !products || !Array.isArray(products)) {
      return res
        .status(400)
        .json({ error: "User and products array is required" });
    }

    for (let i = 0; i < products.length; i++) {
      if (
        !products[i].product ||
        !products[i].quantity ||
        products[i].quantity < 1
      ) {
        return res.status(400).json({
          error: "Each product must have product ID and quantity > = 1",
        });
      }
    }

    const cart = await Cart.findById(id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // El carrito debe ser del usuario y no se puede reasignar a otro
    if (!isOwnerOrAdmin(req, cart.user) || !isOwnerOrAdmin(req, user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedCart = await Cart.findByIdAndUpdate(
      id,
      { user, products },
      { new: true },
    )
      .populate("user", USER_FIELDS)
      .populate("products.product");

    return res.status(200).json(updatedCart);
  } catch (error) {
    next(error);
  }
}

async function deleteCart(req, res, next) {
  try {
    const { id } = req.params;
    const cart = await Cart.findById(id);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (!isOwnerOrAdmin(req, cart.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Cart.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function addProductToCart(req, res, next) {
  try {
    // El usuario sale del token, no del body
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [{ product: productId, quantity }],
      });
    } else {
      const existingProductIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId,
      );

      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
    }

    await cart.save();
    await cart.populate("user", USER_FIELDS);
    await cart.populate("products.product");

    res.json(cart);
  } catch (error) {
    next(error);
  }
}

export {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  updateCart,
  deleteCart,
  addProductToCart,
};
