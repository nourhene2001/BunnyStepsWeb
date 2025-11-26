// services/auth.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface LoginResponse {
  user: { id: number; username: string; email: string };
  tokens: { access: string; refresh: string };
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

class AuthService {
  static setTokens(access: string, refresh: string) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }

  static getAccessToken() {
    return localStorage.getItem("access_token");
  }

  static getRefreshToken() {
    return localStorage.getItem("refresh_token");
  }

  static removeTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  static isAuthenticated() {
    return !!this.getAccessToken();
  }

static async register(data: any) {
  const res = await fetch(`${API_BASE}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok && res.status !== 201) {
    throw new Error(json.detail || json.error || "Registration failed")
  }

  const access = json.access || json.tokens?.access
  const refresh = json.refresh || json.tokens?.refresh

  if (!access || !refresh) throw new Error("Missing tokens")

  this.setTokens(access, refresh)
  return json
}

  static async login(data: LoginData): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json;
    this.setTokens(json.tokens.access, json.tokens.refresh);
    return json;
  }

  static async logout() {
    const refresh = this.getRefreshToken();
    if (refresh) {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ refresh }),
      });
    }
    this.removeTokens();
  }

  static async getCurrentUser() {
    const token = this.getAccessToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      return await res.json();
    } else {
      this.removeTokens();
      return null;
    }
  }
}

export default AuthService;