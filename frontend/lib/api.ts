export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown = null;

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : "Não foi possível concluir a solicitação.";

    throw new Error(message);
  }

  return data as T;
}

export type UsuarioPermissoes = {
  grupos: string[];
  is_superuser: boolean;
  pode_visualizar?: boolean;
  pode_exportar: boolean;
  pode_ver_historico: boolean;
  pode_sincronizar: boolean;
};

export type UsuarioLogado = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  permissions: UsuarioPermissoes;
};

export type LoginResponse = {
  detail: string;
  user: UsuarioLogado;
};

export async function loginUsuario(username: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: {
      username,
      password,
    },
  });
}

export async function buscarUsuarioLogado() {
  return apiRequest<UsuarioLogado>("/auth/me/");
}

export async function logoutUsuario() {
  return apiRequest<{ detail: string }>("/auth/logout/", {
    method: "POST",
  });
}