import { render, screen, waitFor } from "@testing-library/react";
import useFetch from "./useFetch";

function TestFetchComponent({ fetcher, options }) {
  const { data, loading, error } = useFetch(fetcher, [], options);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p role="alert">{error}</p>;
  return <p>Resultado: {data?.name}</p>;
}

describe("useFetch custom hook", () => {
  it("devuelve los datos cuando la petición es exitosa", async () => {
    const fetcher = jest.fn().mockResolvedValue({ name: "Teclado Mecánico" });

    render(<TestFetchComponent fetcher={fetcher} />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Resultado: Teclado Mecánico")).toBeInTheDocument();
    });
  });

  it("traduce error 404 a mensaje de recurso no encontrado", async () => {
    const err404 = Object.assign(new Error("Not Found"), {
      response: { status: 404 },
    });
    const fetcher = jest.fn().mockRejectedValue(err404);

    render(<TestFetchComponent fetcher={fetcher} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Este producto no existe o fue removido",
      );
    });
  });

  it("traduce error >= 500 a mensaje de problema con el servidor", async () => {
    const err500 = Object.assign(new Error("Server Error"), {
      response: { status: 500 },
    });
    const fetcher = jest.fn().mockRejectedValue(err500);

    render(<TestFetchComponent fetcher={fetcher} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Tuvimos un problema con el servidor. Intentalo mas tarde",
      );
    });
  });

  it("traduce error sin respuesta (!err.response) a mensaje de sin conexión", async () => {
    const networkErr = new Error("Network Error");
    const fetcher = jest.fn().mockRejectedValue(networkErr);

    render(<TestFetchComponent fetcher={fetcher} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No pudimos conectar, revisa tu conexion",
      );
    });
  });

  it("devuelve el mensaje por defecto para otros códigos de estado (ej. 400)", async () => {
    const err400 = Object.assign(new Error("Bad Request"), {
      response: { status: 400 },
    });
    const fetcher = jest.fn().mockRejectedValue(err400);

    render(<TestFetchComponent fetcher={fetcher} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Ocurrio un error al cargar el producto",
      );
    });
  });
});
