import "./Loading.css";

export default function Loading({ message, children }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" aria-label="Cargando" />
      <span className="loading-text">{message || children}</span>
    </div>
  );
}