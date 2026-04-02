import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, type LoginPayload } from "../services/authService";

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<AuthState>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";
const USERNAME_KEY = "username";
const ROLE_KEY = "role";

function readStorage(): AuthState {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    username: localStorage.getItem(USERNAME_KEY),
    role: localStorage.getItem(ROLE_KEY),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readStorage);

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(TOKEN_KEY, auth.token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (auth.username) {
      localStorage.setItem(USERNAME_KEY, auth.username);
    } else {
      localStorage.removeItem(USERNAME_KEY);
    }

    if (auth.role) {
      localStorage.setItem(ROLE_KEY, auth.role);
    } else {
      localStorage.removeItem(ROLE_KEY);
    }
  }, [auth]);

  const login = async (data: LoginPayload) => {
    const response = await loginRequest(data);
    const nextAuth = {
      token: response.token,
      username: response.username,
      role: response.role,
    };
    setAuth(nextAuth);
    return nextAuth;
  };

  const logout = () => {
    setAuth({
      token: null,
      username: null,
      role: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        isAuthenticated: Boolean(auth.token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
