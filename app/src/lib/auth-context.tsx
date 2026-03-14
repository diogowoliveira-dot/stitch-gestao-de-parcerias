"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { User, initialUsers, initialVendedores, Vendedor } from "./mock-data";

interface AuthContextType {
  user: User | null;
  vendedor: Vendedor | null;
  isAdmin: boolean;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  vendedor: null,
  isAdmin: false,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const vendedor = user
    ? initialVendedores.find((v) => v.userId === user.id) || null
    : null;

  const isAdmin = user?.role === "admin";

  const login = (email: string, senha: string): boolean => {
    const found = initialUsers.find(
      (u) => u.email === email && u.senha === senha && u.status === "ativo"
    );
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, vendedor, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
