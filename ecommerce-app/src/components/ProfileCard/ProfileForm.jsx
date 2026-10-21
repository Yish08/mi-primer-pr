import { useEffect, useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";

const ProfileForm = ({
  onSubmit,
  onCancel,
  initialValues = {},
  isSaving = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    ...initialValues,
  });

  // Actualizar formulario cuando initialValues cambia
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        ...initialValues,
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    });
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <Input
        id="profile-name"
        label="Nombre"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <Input
        id="profile-email"
        label="Correo electrónico"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <Input
        id="profile-phone"
        label="Teléfono"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="10 dígitos"
        pattern="\d{10}"
        maxLength={10}
        inputMode="numeric"
        title="El teléfono debe tener 10 dígitos"
      />

      <div className="profile-form-actions">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
