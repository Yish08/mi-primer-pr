import PaymentMethod from "../models/PaymentMethod.js";

// Nunca exponer el hash de la contraseña al hacer populate del usuario
const USER_FIELDS = "name email";

const isOwnerOrAdmin = (req, ownerId) =>
  req.user.role === "admin" || String(ownerId) === String(req.user.userId);

const getPaymentMethods = async (req, res, next) => {
  try {
    // Cada usuario solo ve sus propios métodos de pago
    const paymentMethods = await PaymentMethod.find({
      user: req.user.userId,
    }).populate("user", USER_FIELDS);
    res.status(200).json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const getPaymentMethodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id).populate(
      "user",
      USER_FIELDS,
    );
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(paymentMethod);
  } catch (error) {
    next(error);
  }
};

// El CVV no se guarda: almacenarlo esta prohibido por PCI DSS
const createPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
    } = req.body;

    if (isDefault) {
      await PaymentMethod.updateMany({ user: userId }, { isDefault: false });
    }

    const newPaymentMethod = await PaymentMethod.create({
      user: userId,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault: isDefault || false,
    });
    await newPaymentMethod.populate("user", USER_FIELDS);
    res.status(201).json(newPaymentMethod);
  } catch (error) {
    next(error);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
    } = req.body;

    const existing = await PaymentMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    if (!isOwnerOrAdmin(req, existing.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (isDefault) {
      await PaymentMethod.updateMany(
        { user: existing.user, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { type, cardNumber, cardHolderName, expiryDate, paypalEmail, bankName, accountNumber, isDefault },
      { new: true }
    ).populate("user", USER_FIELDS);
    res.status(200).json(updatedPaymentMethod);
  } catch (error) {
    next(error);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    if (!isOwnerOrAdmin(req, paymentMethod.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await PaymentMethod.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
