import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "./RegisterForm";
import { register } from "../../utils/auth";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock("../../utils/auth", () => ({
  register: jest.fn(),
}));

describe("RegisterForm — Ruta crítica de registro (/register)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  test("permite registrar un usuario nuevo (camino feliz) y redirige al inicio", async () => {
    const user = userEvent.setup();
    register.mockResolvedValueOnce({ success: true });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/Nombre/i), "Ana López");
    await user.type(screen.getByLabelText(/Email/i), "ana@eshop.com");
    await user.type(screen.getByLabelText(/Contraseña/i), "Segura123!");
    await user.type(screen.getByLabelText(/Teléfono/i), "5512345678");

    await user.click(screen.getByRole("button", { name: /Registrarme/i }));

    expect(register).toHaveBeenCalledWith(
      "Ana López",
      "ana@eshop.com",
      "Segura123!",
      "5512345678"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("muestra un mensaje de error visible cuando el correo ya está registrado (caso negativo)", async () => {
    const user = userEvent.setup();
    register.mockResolvedValueOnce({
      success: false,
      error: "User already exist",
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/Nombre/i), "Ana López");
    await user.type(screen.getByLabelText(/Email/i), "ana@eshop.com");
    await user.type(screen.getByLabelText(/Contraseña/i), "Segura123!");
    await user.type(screen.getByLabelText(/Teléfono/i), "5512345678");

    await user.click(screen.getByRole("button", { name: /Registrarme/i }));

    expect(await screen.findByText("User already exist")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

