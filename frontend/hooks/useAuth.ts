import { create } from "zustand";
import { apiClient, AuthResponse, login, signup } from "../lib/api";

interface AuthState {
  token?: string;
  userId?: number;
  loading: boolean;
  error?: string;
  loginUser: (email: string, password: string) => Promise<void>;
  signupUser: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  loading: false,
  async loginUser(email, password) {
    set({ loading: true, error: undefined });
    try {
      const response = await login(email, password);
      applyAuth(response);
      set({ token: response.token, userId: response.user_id, loading: false });
    } catch (error) {
      set({ error: "Login failed", loading: false });
      throw error;
    }
  },
  async signupUser(name, email, password) {
    set({ loading: true, error: undefined });
    try {
      const response = await signup(name, email, password);
      applyAuth(response);
      set({ token: response.token, userId: response.user_id, loading: false });
    } catch (error) {
      set({ error: "Signup failed", loading: false });
      throw error;
    }
  },
  logout() {
    localStorage.removeItem("cim_token");
    localStorage.removeItem("cim_user");
    apiClient.defaults.headers.common.Authorization = "";
    set({ token: undefined, userId: undefined });
  }
}));

function applyAuth(auth: AuthResponse) {
  if (typeof window !== "undefined") {
    localStorage.setItem("cim_token", auth.token);
    localStorage.setItem("cim_user", String(auth.user_id));
  }
  apiClient.defaults.headers.common.Authorization = `Bearer ${auth.token}`;
}

if (typeof window !== "undefined") {
  const storedToken = localStorage.getItem("cim_token");
  const storedUser = localStorage.getItem("cim_user");
  if (storedToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
    useAuth.setState({ token: storedToken, userId: storedUser ? Number(storedUser) : undefined });
  }
}
