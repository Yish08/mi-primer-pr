import "./ErrorMessage.css";

export default function ErrorMessage({ message, children }) {
  return (
    <div className="error-message">
      {message && <p>{message}</p>}
      {children}
    </div>
  )
}
