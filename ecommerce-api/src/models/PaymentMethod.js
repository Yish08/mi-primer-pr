import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "credit_card",
        "debit_card",
        "paypal",
        "bank_transfer",
        "cash_on_delivery",
      ],
    },
    // Solo se almacenan los últimos 4 dígitos de la tarjeta o cuenta (cumplimiento PCI-DSS / A04)
    last4: { type: String, maxLength: 4 },
    cardHolderName: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: String,
    },
    paypalEmail: {
      type: String,
    },
    bankName: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.cardNumber;
        delete ret.accountNumber;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        delete ret.cardNumber;
        delete ret.accountNumber;
        return ret;
      },
    },
  },
);

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
