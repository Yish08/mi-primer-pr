// Permite el acceso si el :id de la ruta es el del usuario del token, o si es admin
const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  const isSelf = String(req.user.userId) === req.params.id;
  if (!isSelf && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

export default isSelfOrAdmin;
