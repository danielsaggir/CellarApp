import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { Wine } from "../types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${config.API_URL}${endpoint}`, options);

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed (HTTP ${res.status})`,
      res.status
    );
  }

  return data as T;
}

export const authApi = {
  async login(email: string, password: string): Promise<{ token: string }> {
    return apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<{ id: string; email: string; name: string }> {
    return apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
  },
};

export const wineApi = {
  async getMyWines(): Promise<Wine[]> {
    const auth = await getAuthHeaders();
    return apiFetch("/wines/my", { headers: auth });
  },

  async createWine(formData: FormData): Promise<Wine> {
    const auth = await getAuthHeaders();
    return apiFetch("/wines", {
      method: "POST",
      headers: auth,
      body: formData,
    });
  },
};

export const aiApi = {
  async getPairing(food: string): Promise<{ suggestion: string }> {
    return apiFetch("/ai/pairing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ food }),
    });
  },
};

export { ApiError };
