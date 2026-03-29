import { clientEnv } from "@/lib/env/client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { ApiError } from "./errors";

type HttpMethod = "GET" | "POST";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

const REQUEST_TIMEOUT_MS = 8000;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const buildQueryString = (query?: RequestOptions["query"]) => {
  const searchParams = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
};

const getDevHeaders = () => {
  if (!clientEnv.enableDevAuthBypass) {
    return {};
  }

  const devHeaders: Record<string, string> = {};

  if (clientEnv.devUserId) {
    devHeaders["x-dev-user-id"] = clientEnv.devUserId;
  }

  if (clientEnv.devBusinessId) {
    devHeaders["x-dev-business-id"] = clientEnv.devBusinessId;
  }

  if (clientEnv.devBranchId) {
    devHeaders["x-dev-branch-id"] = clientEnv.devBranchId;
  }

  if (clientEnv.devRegisterId) {
    devHeaders["x-dev-register-id"] = clientEnv.devRegisterId;
  }

  return devHeaders;
};

const resolveApiBaseUrl = () => {
  const configuredApiUrl = clientEnv.apiUrl.replace(/\/$/, "");

  if (typeof window === "undefined") {
    return configuredApiUrl;
  }

  try {
    const resolvedUrl = new URL(configuredApiUrl);
    const currentHostname = window.location.hostname;

    if (
      LOOPBACK_HOSTS.has(resolvedUrl.hostname) &&
      !LOOPBACK_HOSTS.has(currentHostname)
    ) {
      resolvedUrl.hostname = currentHostname;
    }

    return resolvedUrl.toString().replace(/\/$/, "");
  } catch {
    return configuredApiUrl;
  }
};

const getAuthHeaders = async () => {
  const supabase = getBrowserSupabaseClient();

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return getDevHeaders();
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  let response: Response;

  try {
    response = await fetch(
      `${resolveApiBaseUrl()}${path}${buildQueryString(options.query)}`,
      {
        method: options.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        "No se pudo completar la solicitud en este momento.",
        0,
        error,
      );
    }

    throw new ApiError(
      "No se pudo completar la solicitud en este momento.",
      0,
      error,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(errorPayload?.message)
      ? errorPayload.message.join(", ")
      : (errorPayload?.message ?? "No se pudo completar la solicitud.");

    throw new ApiError(message, response.status, errorPayload);
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return null as T;
  }

  return JSON.parse(responseText) as T;
}
