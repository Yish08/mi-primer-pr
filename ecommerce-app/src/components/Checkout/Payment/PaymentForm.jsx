import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./PaymentForm.css";

const PaymentForm = ({
  onSubmit,
  onCancel,
  initialValues = {},
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    cardNumber: "",
    type: "credit_card",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
    isDefault: false,
    ...initialValues,
  });

  // Actualizar formulario cuando initialValues cambia (modo edición)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        cardNumber: "",
        type: "credit_card",
        cardHolderName: "",
        expiryDate: "",
        cvv: "",
        isDefault: false,
        ...initialValues,
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);

    // Resetear formulario solo si es nuevo (no edición)
    if (!isEdit) {
      setFormData({
        cardNumber: "",
        type: "credit_card",
        cardHolderName: "",
        expiryDate: "",
        cvv: "",
        isDefault: false,
        ...initialValues,
      });
    }
  };

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? "Editar Método de Pago" : "Nuevo Método de Pago"}</h3>

      <Input
        label="Número de tarjeta"
        name="cardNumber"
        value={formData.cardNumber}
        onChange={handleChange}
        pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
        placeHolder="1234-5678-9012-3456"
        required
      />

      <Input
        label="Nombre del titular"
        name="cardHolderName"
        value={formData.cardHolderName}
        onChange={handleChange}
        required
      />
      <div className="form-row">
        <label>Tipo de Pago</label>
        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="credit_card">Tarjeta de Credito</option>
          <option value="debit_card">Tarjeta de Debito</option>
          <option value="paypal">Paypal</option>
          <option value="bank_transfer">Transferencia Bancaria</option>
          <option value="cash_on_delivery">Pagar al entregar</option>
        </select>
      </div>
      
      <div className="form-row">
        <Input
          label="Fecha de expiración"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          placeHolder="MM/YY"
          pattern="[0-9]{2}/[0-9]{2}"
          required
        />

        <Input
          label="CVV"
          name="cvv"
          value={formData.cvv}
          onChange={handleChange}
          type="password"
          maxLength="4"
          pattern="[0-9]{3,4}"
          required
        />
      </div>

      <div className="form-checkbox">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          id="isDefaultPayment"
        />
        <label htmlFor="isDefaultPayment">
          Establecer como método de pago predeterminado
        </label>
      </div>

      <div className="form-actions">
        <Button type="submit">
          {isEdit ? "Guardar Cambios" : "Agregar Método de Pago"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};

export default PaymentForm;
