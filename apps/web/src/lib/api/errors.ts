export class ApiError extends Error {
  statusCode: number;
  details: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const TECHNICAL_MESSAGE_PATTERN =
  /(api|fetch|network|axios|timeout|server|backend|unexpected|abort|failed|stack|trace|ECONN|ENOTFOUND|TypeError)/i;
const VALIDATION_INTERNAL_PATTERN =
  /^(property\s+.+\s+should not exist|an instance of .+ has failed the validation)/i;

const sanitizeMessage = (message?: string | null) => {
  const normalized = message?.trim();

  if (!normalized) {
    return null;
  }

  if (VALIDATION_INTERNAL_PATTERN.test(normalized)) {
    return null;
  }

  if (TECHNICAL_MESSAGE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
};

export function getFriendlyErrorMessage(
  error: unknown,
  fallback = "No se pudo completar la solicitud en este momento.",
) {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      return "Tu sesion ya no es valida. Inicia sesion nuevamente.";
    }

    if (error.statusCode === 403) {
      return "No tienes permiso para realizar esta accion.";
    }

    if (error.statusCode === 404) {
      return (
        sanitizeMessage(error.message) ??
        "No se encontro la informacion solicitada."
      );
    }

    if (error.statusCode === 409) {
      return (
        sanitizeMessage(error.message) ??
        "La informacion ya existe o cambio. Intenta nuevamente."
      );
    }

    if (error.statusCode === 400) {
      return sanitizeMessage(error.message) ?? fallback;
    }

    return fallback;
  }

  if (error instanceof Error) {
    return sanitizeMessage(error.message) ?? fallback;
  }

  return fallback;
}
