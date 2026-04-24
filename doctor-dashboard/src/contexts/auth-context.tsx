import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Used for normal refresh (will try token refresh on 401)
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      // Only allow doctor users in the dashboard
      if (userData.role !== "doctor") {
        setUser(null);
        return;
      }
      setUser(userData);
    } catch {
      // Silently fail - user is not authenticated
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Initial auth check - uses getMeInitial which won't trigger refresh loop
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const userData = await authService.getMeInitial();
        if (userData.role === "doctor") {
          setUser(userData);
        }
      } catch {
        // Not authenticated - this is expected on first load
        setUser(null);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    // Check if user is doctor
    if (response.user.role !== "doctor") {
      // Logout to clear any cookies that were set
      try {
        await authService.logout();
      } catch {
        // Ignore logout errors
      }
      throw new Error("لوحة التحكم متاحة فقط للدكاترة");
    }
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
