import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Nunca exponer el hash de la contraseña al hacer populate del usuario
const USER_FIELDS = "name email";

// Devuelve al inventario lo que se habia descontado
const releaseStock = (items) =>
  Promise.all(
    items.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }),
    ),
  );

// Descuenta el stock de cada producto de la orden.
// El filtro { stock: { $gte: quantity } } hace la operacion atomica: Mongo solo
// descuenta si alcanza, asi dos compras simultaneas no pueden dejar stock negativo.
// Si un producto no alcanza, se devuelve lo ya descontado y se rechaza la orden.
const reserveStock = async (products) => {
  // Si el mismo producto viene dos veces, se suman sus cantidades
  const quantities = new Map();
  for (const { productId, quantity } of products) {
    const key = String(productId);
    quantities.set(key, (quantities.get(key) || 0) + Number(quantity));
  }

  const reserved = [];
  for (const [productId, quantity] of quantities) {
    const updated = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
    );

    if (!updated) {
      await releaseStock(reserved);
      const product = await Product.findById(productId).select("name stock");
      return {
        ok: false,
        status: product ? 409 : 404,
        message: product
          ? `Stock insuficiente para "${product.name}". Disponibles: ${product.stock}`
          : "Uno de los productos ya no existe",
      };
    }
    reserved.push({ productId, quantity });
  }

  return { ok: true, reserved };
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", USER_FIELDS)
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod", "type cardHolderName cardNumber");
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user", USER_FIELDS)
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = String(order.user?._id) === String(req.user.userId);
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { products, address, paymentMethod, totalPrice, shippingCost } =
      req.body;

    const stock = await reserveStock(products);
    if (!stock.ok) {
      return res.status(stock.status).json({ message: stock.message });
    }

    let newOrder;
    try {
      newOrder = await Order.create({
        user: userId,
        products,
        address,
        paymentMethod,
        totalPrice,
        shippingCost,
      });
    } catch (error) {
      // Si la orden no se pudo guardar, el stock regresa al inventario
      await releaseStock(stock.reserved);
      throw error;
    }

    await newOrder.populate("user", USER_FIELDS);
    await newOrder.populate("products.productId");
    await newOrder.populate("address");
    await newOrder.populate("paymentMethod");

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updated = await Order.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export { getOrders, getMyOrders, getOrderById, createOrder, updateOrderStatus };
