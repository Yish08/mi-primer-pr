import PaymentMethod from "../models/PaymentMethod.js";

// Nunca exponer el hash de la contraseña al hacer populate del usuario
const USER_FIELDS = "name email";
const SAFE_PAYMENT_SELECT = "-cardNumber -accountNumber";

const extractLast4 = (cardNumber, accountNumber) => {
  const raw = cardNumber || accountNumber;
  if (!raw) return undefined;
  const digits = String(raw).replace(/\D/g, "");
  return digits.slice(-4);
};

const sanitizePaymentResponse = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toJSON === "function" ? doc.toJSON() : { ...doc };
  delete obj.cardNumber;
  delete obj.accountNumber;
  return obj;
};

const isOwnerOrAdmin = (req, ownerId) =>
  req.user.role === "admin" || String(ownerId) === String(req.user.userId);

const getPaymentMethods = async (req, res, next) => {
  try {
    // Cada usuario solo ve sus propios métodos de pago (sin número completo de tarjeta/cuenta)
    const paymentMethods = await PaymentMethod.find({
      user: req.user.userId,
    })
      .select(SAFE_PAYMENT_SELECT)
      .populate("user", USER_FIELDS);
    res.status(200).json(paymentMethods.map(sanitizePaymentResponse));
  } catch (error) {
    next(error);
  }
};

const getPaymentMethodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id)
      .select(SAFE_PAYMENT_SELECT)
      .populate("user", USER_FIELDS);
    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(sanitizePaymentResponse(paymentMethod));
  } catch (error) {
    next(error);
  }
};

// El CVV y el PAN/cuenta completos no se guardan: solo se conservan los últimos 4 dígitos
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

    const last4 = extractLast4(cardNumber, accountNumber);

    const newPaymentMethod = await PaymentMethod.create({
      user: userId,
      type,
      last4,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      isDefault: isDefault || false,
    });
    await newPaymentMethod.populate("user", USER_FIELDS);
    res.status(201).json(sanitizePaymentResponse(newPaymentMethod));
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

    const last4 = extractLast4(cardNumber, accountNumber);
    const updatePayload = {
      type,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      isDefault,
    };
    if (last4 !== undefined) {
      updatePayload.last4 = last4;
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    )
      .select(SAFE_PAYMENT_SELECT)
      .populate("user", USER_FIELDS);
    res.status(200).json(sanitizePaymentResponse(updatedPaymentMethod));
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
