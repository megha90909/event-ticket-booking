import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setUnauthorizedHandler } from "../api/axios";
import { fetchCurrentUser, loginUser, registerUser } from "../api/authApi";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";

/**
 * Provides JWT storage, session hydration via /api/auth/me, and auth actions.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY))
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setAuthLoading(false);
  }, []);

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let ignore = false;
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setAuthLoading(false);
      return undefined;
    }

    const hydrateUser = async () => {
      try {
        const data = await fetchCurrentUser();
        if (!ignore) {
          setUser(data.user);
        }
      } catch {
        if (!ignore) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setAuthLoading(false);
        }
      }
    };

    hydrateUser();

    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(
    async (credentials) => {
      const data = await loginUser(credentials);
      persistSession(data.token, data.user);
      return data;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const data = await registerUser(payload);
      persistSession(data.token, data.user);
      return data;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      authLoading,
      login,
      register,
      logout,
    }),
    [token, user, authLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the current authentication state and actions.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

