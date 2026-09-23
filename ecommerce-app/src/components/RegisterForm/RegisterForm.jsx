import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { register } from "../../utils/auth";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Input from "../common/Input";
import "./RegisterForm.css";

export default function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const onSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      const result = await register(name, email, password, phone);

      if(result.success){
        navigate("/");
        window.location.reload();
      } else {
        setError(result.error); 
      }
      setLoading(false);
    }

    return (
        <div className="register-container">
          <div className="register-card">
            <h2>Registrate</h2>
            <form className="register-form" onSubmit={onSubmit}>
              <div className="form-group">
                <Input
                  id="name"
                  label="Nombre: "
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ingresa tu nombre"
                  required
                />
              </div>
              <div className="form-group">
                <Input
                  id="email"
                  label="Email: "
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Ingresa tu email"
                  required
                />
              </div>
              <div className="form-group">
                <Input
                  id="password"
                  label="Contraseña: "
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
              <div className="form-group">
                <Input
                  id="phone"
                  label="Teléfono: "
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ingresa tu Teléfono"
                  required
                />
              </div>
    
              {error && <ErrorMessage>{error}</ErrorMessage>}
    
              <Button disabled={loading} type="submit" variant="primary">
                {loading ? "Registrando..." : "Registrarme"}
              </Button>
            </form>
            <div className="register-footer">
              <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
            </div>
          </div>
        </div>
    );
}