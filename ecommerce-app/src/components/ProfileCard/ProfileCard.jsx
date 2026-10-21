import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../../utils/auth";
import { getUserById, updateUser } from "../../services/usersService";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Icon from "../common/Icon/Icon";
import Loading from "../common/Loading/Loading";
import ProfileForm from "./ProfileForm";
import "./ProfileCard.css";

const ROLE_LABELS = {
  admin: "Administrador",
  customer: "Cliente",
};

const ACCOUNT_LINKS = [
  { to: "/orders", icon: "package", label: "Mis pedidos" },
  { to: "/wishlist", icon: "heart", label: "Lista de deseos" },
  { to: "/cart", icon: "cart", label: "Mi carrito" },
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

const formatDate = (isoString) => {
  if (!isoString) return "No disponible";
  return new Date(isoString).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message ||
  err.response?.data?.errors?.[0]?.msg ||
  fallback;

export default function ProfileCard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadUser = async () => {
      try {
        const { userId } = getCurrentUser() || {};
        const data = await getUserById(userId);
        if (!ignore) setUser(data);
      } catch (err) {
        if (!ignore) {
          setLoadError(getErrorMessage(err, "No se pudo cargar tu perfil"));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  // Ocultar el mensaje de éxito después de unos segundos
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Memorizado para que el formulario no se reinicie en cada render
  const formValues = useMemo(
    () => ({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }),
    [user]
  );

  const handleEdit = () => {
    setSaveError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const updatedUser = await updateUser(user._id, formData);
      setUser(updatedUser);
      setIsEditing(false);
      setSuccessMessage("Tu perfil se actualizó correctamente");
    } catch (err) {
      setSaveError(getErrorMessage(err, "No se pudieron guardar los cambios"));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <Loading message="Cargando perfil..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="profile-container">
        <ErrorMessage message={loadError} />
      </div>
    );
  }

  const role = user.role || "customer";

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-cover" />

        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {getInitials(user.name)}
          </div>
          <h1 className="profile-name">{user.name}</h1>
          <span className={`profile-role-badge profile-role-${role}`}>
            {ROLE_LABELS[role] || role}
          </span>
          <p className="profile-email">{user.email}</p>
        </div>

        {successMessage && (
          <div className="profile-alert profile-alert-success" role="status">
            <Icon name="checkCircle" size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        <section className="profile-section">
          <div className="profile-section-head">
            <h2>Información personal</h2>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                Editar perfil
              </Button>
            )}
          </div>

          {isEditing ? (
            <>
              {saveError && (
                <div className="profile-alert profile-alert-error" role="alert">
                  <Icon name="alertCircle" size={18} />
                  <span>{saveError}</span>
                </div>
              )}
              <ProfileForm
                initialValues={formValues}
                onSubmit={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
              />
            </>
          ) : (
            <dl className="profile-info">
              <div className="info-item">
                <dt>
                  <Icon name="user" size={16} /> Nombre
                </dt>
                <dd>{user.name}</dd>
              </div>
              <div className="info-item">
                <dt>
                  <Icon name="mail" size={16} /> Correo electrónico
                </dt>
                <dd>{user.email}</dd>
              </div>
              <div className="info-item">
                <dt>
                  <Icon name="phone" size={16} /> Teléfono
                </dt>
                <dd className={user.phone ? "" : "muted"}>
                  {user.phone || "Sin registrar"}
                </dd>
              </div>
              <div className="info-item">
                <dt>
                  <Icon name="clock" size={16} /> Miembro desde
                </dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="profile-section">
          <div className="profile-section-head">
            <h2>Mi cuenta</h2>
          </div>
          <nav className="profile-links">
            {ACCOUNT_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="profile-link">
                <span className="profile-link-icon">
                  <Icon name={link.icon} size={20} />
                </span>
                <span className="profile-link-label">{link.label}</span>
                <Icon name="chevronRight" size={18} />
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </div>
  );
}
