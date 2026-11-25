import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/apiClient";

/**
 * Traduce un error de Axios/red a un mensaje amigable según el código HTTP:
 * - 404: Recurso no encontrado
 * - >= 500: Error del servidor
 * - Sin respuesta (!err.response): Error de red / sin conexión
 * - Otro: Mensaje del backend o mensaje por defecto
 */
export function getFetchErrorMessage(err, options = {}) {
  const {
    notFoundMessage = "Este producto no existe o fue removido",
    serverErrorMessage = "Tuvimos un problema con el servidor. Intentalo mas tarde",
    networkErrorMessage = "No pudimos conectar, revisa tu conexion",
    defaultErrorMessage = "Ocurrio un error al cargar el producto",
    preferBackendMessage = false,
  } = options;

  if (preferBackendMessage && err?.response?.data?.message) {
    return err.response.data.message;
  }

  const status = err?.response?.status;
  if (status === 404) {
    return notFoundMessage;
  }
  if (status >= 500) {
    return serverErrorMessage;
  }
  if (!err?.response) {
    return networkErrorMessage;
  }
  return err?.response?.data?.message || defaultErrorMessage;
}

/**
 * Custom hook para consultar datos de la API manejando data, loading y error,
 * con traducción de errores por status (404, 500, sin conexión y por defecto).
 *
 * @param {Function | string} fetcher - Función asíncrona que retorna los datos o ruta de apiClient
 * @param {Array} dependencies - Lista de dependencias para re-ejecutar la petición
 * @param {Object} options - Opciones de configuración y mensajes personalizados
 */
export function useFetch(fetcher, dependencies = [], options = {}) {
  const {
    initialData = null,
    enabled = true,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(async () => {
    const currentFetcher = fetcherRef.current;
    const currentOptions = optionsRef.current;

    if (!currentFetcher || currentOptions.enabled === false) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result =
        typeof currentFetcher === "function"
          ? await currentFetcher()
          : (await apiClient.get(currentFetcher)).data;

      if (!result && currentOptions.emptyErrorMessage) {
        setError(currentOptions.emptyErrorMessage);
        setData(currentOptions.initialData ?? null);
        return null;
      }

      setData(result);
      return result;
    } catch (err) {
      const message = getFetchErrorMessage(err, currentOptions);
      setError(message);
      if (currentOptions.initialData !== undefined) {
        setData(currentOptions.initialData);
      }
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      const currentFetcher = fetcherRef.current;
      const currentOptions = optionsRef.current;

      if (!currentFetcher || currentOptions.enabled === false) {
        if (!ignore) setLoading(false);
        return;
      }

      if (!ignore) {
        setLoading(true);
        setError(null);
      }

      try {
        const result =
          typeof currentFetcher === "function"
            ? await currentFetcher()
            : (await apiClient.get(currentFetcher)).data;

        if (ignore) return;

        if (!result && currentOptions.emptyErrorMessage) {
          setError(currentOptions.emptyErrorMessage);
          setData(currentOptions.initialData ?? null);
        } else {
          setData(result);
        }
      } catch (err) {
        if (ignore) return;
        const message = getFetchErrorMessage(err, currentOptions);
        setError(message);
        if (currentOptions.initialData !== undefined) {
          setData(currentOptions.initialData);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return {
    data,
    setData,
    loading,
    error,
    setError,
    refetch: execute,
  };
}

export default useFetch;
