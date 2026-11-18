import { render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import { getCurrentUser, isAuthenticated } from "../utils/auth";

jest.mock(
  "react-router-dom",
  () => ({
    Navigate: ({ to }) => <div data-testid="redirect-target">Redirigiendo a {to}</div>,
  }),
  { virtual: true }
);

jest.mock("../utils/auth", () => ({
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(),
}));

describe("ProtectedRoute — Guardia de rutas críticas y roles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirige a /login cuando el usuario no está autenticado (caso negativo)", () => {
    isAuthenticated.mockReturnValue(false);

    render(
      <ProtectedRoute>
        <div>Contenido Privado</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Redirigiendo a /login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido Privado")).not.toBeInTheDocument();
  });

  test("muestra 'Acceso denegado' cuando un usuario customer intenta entrar a una ruta de admin (caso negativo)", () => {
    isAuthenticated.mockReturnValue(true);
    getCurrentUser.mockReturnValue({
      userId: "u-1",
      name: "Cliente",
      role: "customer",
    });

    render(
      <ProtectedRoute allowedRoles={["admin"]}>
        <div>Panel de Administración</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(
      screen.getByText("No tienes permisos para acceder a esta página.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Panel de Administración")
    ).not.toBeInTheDocument();
  });

  test("muestra el contenido protegido cuando el usuario está autenticado y tiene el rol permitido (camino feliz)", () => {
    isAuthenticated.mockReturnValue(true);
    getCurrentUser.mockReturnValue({
      userId: "admin-1",
      name: "Admin",
      role: "admin",
    });

    render(
      <ProtectedRoute allowedRoles={["admin"]}>
        <div>Panel de Administración</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Panel de Administración")).toBeInTheDocument();
  });
});

