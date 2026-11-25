import { render, screen, waitFor } from "@testing-library/react";
import ProductDetails from "./ProductDetails";
import { getProductById } from "../../services/productsService";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

jest.mock("../../services/productsService", () => ({
  getProductById: jest.fn(),
}));

jest.mock("../../context/CartContext", () => ({
  useCart: () => ({
    getQuantityInCart: () => 0,
    addToCart: jest.fn(),
  }),
}));

describe("ProductDetails con useFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el detalle del producto cuando la petición responde 200", async () => {
    getProductById.mockResolvedValue({
      _id: "prod-1",
      name: "Audífonos Pro",
      description: "Cancelación activa de ruido",
      price: 1500,
      stock: 5,
      imagesUrl: ["/img/products/placeholder.svg"],
      category: { _id: "cat-1", name: "Audio" },
    });

    render(<ProductDetails productId="prod-1" />);

    expect(screen.getByText(/Cargando producto/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Audífonos Pro" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("$1500")).toBeInTheDocument();
  });

  it("muestra mensaje de 404 cuando el producto no existe", async () => {
    const err404 = Object.assign(new Error("Not found"), {
      response: { status: 404 },
    });
    getProductById.mockRejectedValue(err404);

    render(<ProductDetails productId="prod-404" />);

    await waitFor(() => {
      expect(
        screen.getByText("Este producto no existe o fue removido"),
      ).toBeInTheDocument();
    });
  });

  it("muestra mensaje de 500 cuando falla el servidor", async () => {
    const err500 = Object.assign(new Error("Server error"), {
      response: { status: 503 },
    });
    getProductById.mockRejectedValue(err500);

    render(<ProductDetails productId="prod-500" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Tuvimos un problema con el servidor. Intentalo mas tarde",
        ),
      ).toBeInTheDocument();
    });
  });

  it("muestra mensaje de sin conexión cuando no hay response del servidor", async () => {
    getProductById.mockRejectedValue(new Error("Network Error"));

    render(<ProductDetails productId="prod-offline" />);

    await waitFor(() => {
      expect(
        screen.getByText("No pudimos conectar, revisa tu conexion"),
      ).toBeInTheDocument();
    });
  });
});
