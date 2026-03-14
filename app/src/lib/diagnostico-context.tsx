"use client";
import { createContext, useContext, useState, useReducer, useEffect, ReactNode, useCallback } from "react";
import {
  DiagUser,
  DiagnosticoData,
  CargoData,
  PROBLEMAS_POR_FERRAMENTA,
} from "./diagnostico-mock-data";

// ============================================
// AUTH CONTEXT
// ============================================
type DiagUserSafe = Omit<DiagUser, "senha">;

interface DiagAuthContextType {
  user: DiagUserSafe | null;
  isAdmin: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  users: DiagUserSafe[];
  addUser: (user: { nome: string; email: string; senha: string; role: string; status: string }) => Promise<void>;
  updateUser: (id: string, data: Partial<DiagUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadingUsers: boolean;
}

const DiagAuthContext = createContext<DiagAuthContextType>({
  user: null,
  isAdmin: false,
  login: async () => false,
  logout: () => {},
  users: [],
  addUser: async () => {},
  updateUser: async () => {},
  deleteUser: async () => {},
  loadingUsers: true,
});

export function DiagAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiagUserSafe | null>(null);
  const [users, setUsers] = useState<DiagUserSafe[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const isAdmin = user?.role === "admin";

  // Load users from DB
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/diagnostico/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/diagnostico/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => setUser(null);

  const addUser = async (data: { nome: string; email: string; senha: string; role: string; status: string }) => {
    const res = await fetch("/api/diagnostico/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchUsers();
    }
  };

  const updateUser = async (id: string, data: Partial<DiagUser>) => {
    const res = await fetch("/api/diagnostico/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      if (user?.id === id) setUser(updated);
    }
  };

  const deleteUser = async (id: string) => {
    const res = await fetch("/api/diagnostico/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <DiagAuthContext.Provider
      value={{ user, isAdmin, login, logout, users, addUser, updateUser, deleteUser, loadingUsers }}
    >
      {children}
    </DiagAuthContext.Provider>
  );
}

export const useDiagAuth = () => useContext(DiagAuthContext);

// ============================================
// DIAGNOSTIC STATE
// ============================================
export interface DiagFormState {
  etapaAtual: number;
  empresa: { nome: string; cidade: string; estado: string };
  cargos: CargoData[];
  cargoAtualIndex: number;
  problemas: string[];
  outputGerado: boolean;
}

type DiagAction =
  | { type: "SET_ETAPA"; etapa: number }
  | { type: "SET_EMPRESA"; data: Partial<DiagFormState["empresa"]> }
  | { type: "ADD_CARGO"; cargo: CargoData }
  | { type: "UPDATE_CARGO"; index: number; data: Partial<CargoData> }
  | { type: "REMOVE_CARGO"; id: string }
  | { type: "SET_CARGO_INDEX"; index: number }
  | { type: "GERAR_PROBLEMAS" }
  | { type: "GERAR_OUTPUT" }
  | { type: "RESET" }
  | { type: "LOAD"; data: DiagFormState };

const initialFormState: DiagFormState = {
  etapaAtual: 1,
  empresa: { nome: "", cidade: "", estado: "" },
  cargos: [],
  cargoAtualIndex: 0,
  problemas: [],
  outputGerado: false,
};

function diagReducer(state: DiagFormState, action: DiagAction): DiagFormState {
  switch (action.type) {
    case "SET_ETAPA":
      return { ...state, etapaAtual: action.etapa };
    case "SET_EMPRESA":
      return { ...state, empresa: { ...state.empresa, ...action.data } };
    case "ADD_CARGO":
      return { ...state, cargos: [...state.cargos, action.cargo] };
    case "UPDATE_CARGO":
      return {
        ...state,
        cargos: state.cargos.map((c, i) =>
          i === action.index ? { ...c, ...action.data } : c
        ),
      };
    case "REMOVE_CARGO":
      return { ...state, cargos: state.cargos.filter((c) => c.id !== action.id) };
    case "SET_CARGO_INDEX":
      return { ...state, cargoAtualIndex: action.index };
    case "GERAR_PROBLEMAS": {
      const todasFerramentas = new Set<string>();
      state.cargos
        .filter((c) => c.existe)
        .forEach((c) => c.ferramentas.forEach((f) => todasFerramentas.add(f)));

      const problemas: string[] = [];
      todasFerramentas.forEach((f) => {
        if (PROBLEMAS_POR_FERRAMENTA[f]) {
          problemas.push(PROBLEMAS_POR_FERRAMENTA[f]);
        }
      });
      if (todasFerramentas.size > 4) {
        problemas.push("Estrutura com alto grau de fragmentação operacional");
      }
      return { ...state, problemas };
    }
    case "GERAR_OUTPUT":
      return { ...state, outputGerado: true };
    case "RESET":
      return { ...initialFormState };
    case "LOAD":
      return action.data;
    default:
      return state;
  }
}

// ============================================
// DIAGNOSTIC DATA CONTEXT
// ============================================
interface DiagDataContextType {
  diagnosticos: DiagnosticoData[];
  addDiagnostico: (d: DiagnosticoData) => Promise<void>;
  deleteDiagnostico: (id: string) => Promise<void>;
  formState: DiagFormState;
  dispatch: React.Dispatch<DiagAction>;
  loadingDiagnosticos: boolean;
}

const DiagDataContext = createContext<DiagDataContextType>({
  diagnosticos: [],
  addDiagnostico: async () => {},
  deleteDiagnostico: async () => {},
  formState: initialFormState,
  dispatch: () => {},
  loadingDiagnosticos: true,
});

export function DiagDataProvider({ children }: { children: ReactNode }) {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoData[]>([]);
  const [formState, dispatch] = useReducer(diagReducer, initialFormState);
  const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(true);

  // Load diagnosticos from DB
  const fetchDiagnosticos = useCallback(async () => {
    try {
      const res = await fetch("/api/diagnostico/diagnosticos");
      if (res.ok) {
        const data = await res.json();
        setDiagnosticos(data);
      }
    } catch (e) {
      console.error("Erro ao carregar diagnósticos:", e);
    } finally {
      setLoadingDiagnosticos(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnosticos();
  }, [fetchDiagnosticos]);

  const addDiagnostico = useCallback(async (d: DiagnosticoData) => {
    try {
      const res = await fetch("/api/diagnostico/diagnosticos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (res.ok) {
        await fetchDiagnosticos();
      }
    } catch (e) {
      console.error("Erro ao salvar diagnóstico:", e);
    }
  }, [fetchDiagnosticos]);

  const deleteDiagnostico = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/diagnostico/diagnosticos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setDiagnosticos((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (e) {
      console.error("Erro ao deletar diagnóstico:", e);
    }
  }, []);

  return (
    <DiagDataContext.Provider
      value={{ diagnosticos, addDiagnostico, deleteDiagnostico, formState, dispatch, loadingDiagnosticos }}
    >
      {children}
    </DiagDataContext.Provider>
  );
}

export const useDiagData = () => useContext(DiagDataContext);
