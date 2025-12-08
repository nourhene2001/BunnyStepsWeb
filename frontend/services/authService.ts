// services/auth.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Helper – safe localStorage access (SSR-safe)
const isBrowser = typeof window !== "undefined";

const storage = {
  getItem(key: string): string | null {
    return isBrowser ? localStorage.getItem(key) : null;
  },
  setItem(key: string, value: string) {
    if (isBrowser) localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (isBrowser) localStorage.removeItem(key);
  },
};

interface LoginResponse {
  user: { id: number; username: string; email: string };
  tokens: { access: string; refresh: string };
}

interface LoginData {
  username: string;
  password: string;
}

class AuthService {
  static setTokens(access: string, refresh: string) {
    storage.setItem("access_token", access);
    storage.setItem("refresh_token", refresh);
  }

  static getAccessToken(): string | null {
    return storage.getItem("access_token");
  }

  static getRefreshToken(): string | null {
    return storage.getItem("refresh_token");
  }

  static removeTokens() {
    storage.removeItem("access_token");
    storage.removeItem("refresh_token");
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  static async register(data: any) {
    const res = await fetch(`${API_BASE}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.detail || json.error || "Registration failed");
    }

    const access = json.access || json.tokens?.access;
    const refresh = json.refresh || json.tokens?.refresh;

    if (!access || !refresh) throw new Error("Missing tokens");

    this.setTokens(access, refresh);
    return json;
  }

  static async login(data: LoginData): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.detail || "Login failed");
    }

    this.setTokens(json.tokens.access, json.tokens.refresh);
    return json;
  }

  static async logout() {
    const refresh = this.getRefreshToken();

    if (refresh) {
      try {
        await fetch(`${API_BASE}/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getAccessToken() || ""}`,
          },
          body: JSON.stringify({ refresh }),
        });
      } catch (e) {
        // Even if logout endpoint fails, we still clear tokens
        console.warn("Logout request failed, clearing tokens anyway");
      }
    }

    this.removeTokens();
  }

  static async getCurrentUser() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        return await res.json();
      } else {
        this.removeTokens();
        return null;
      }
    } catch (error) {
      this.removeTokens();
      return null;
    }
  }
}

export default AuthService;