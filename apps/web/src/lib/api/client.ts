import { clientEnv } from "@/lib/env/client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { ApiError } from "./errors";

type HttpMethod = "GET" | "POST";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
}

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

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${clientEnv.apiUrl}${path}${buildQueryString(options.query)}`,
    {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(errorPayload?.message)
      ? errorPayload?.message.join(", ")
      : (errorPayload?.message ?? "No fue posible completar la solicitud.");

    throw new ApiError(message, response.status, errorPayload);
  }

  return response.json() as Promise<T>;
}
