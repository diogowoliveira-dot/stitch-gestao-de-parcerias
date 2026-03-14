"use client";
import { createContext, useContext, useState, useReducer, ReactNode, useCallback } from "react";
import {
  DiagUser,
  DiagnosticoData,
  CargoData,
  diagInitialUsers,
  diagInitialDiagnosticos,
  PROBLEMAS_POR_FERRAMENTA,
} from "./diagnostico-mock-data";

// ============================================
// AUTH CONTEXT
// ============================================
interface DiagAuthContextType {
  user: DiagUser | null;
  isAdmin: boolean;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  users: DiagUser[];
  addUser: (user: Omit<DiagUser, "id" | "dataCriacao">) => void;
  updateUser: (id: string, data: Partial<DiagUser>) => void;
  deleteUser: (id: string) => void;
}

const DiagAuthContext = createContext<DiagAuthContextType>({
  user: null,
  isAdmin: false,
  login: () => false,
  logout: () => {},
  users: [],
  addUser: () => {},
  updateUser: () => {},
  deleteUser: () => {},
});

export function DiagAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiagUser | null>(null);
  const [users, setUsers] = useState<DiagUser[]>(diagInitialUsers);

  const isAdmin = user?.role === "admin";

  const login = (email: string, senha: string): boolean => {
    const found = users.find(
      (u) => u.email === email && u.senha === senha && u.status === "ativo"
    );
    if (found) {
      const updated = { ...found, ultimoAcesso: new Date().toISOString().split("T")[0] };
      setUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === found.id ? updated : u)));
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const addUser = (data: Omit<DiagUser, "id" | "dataCriacao">) => {
    const newUser: DiagUser = {
      ...data,
      id: `du${Date.now()}`,
      dataCriacao: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, data: Partial<DiagUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    if (user?.id === id) setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <DiagAuthContext.Provider
      value={{ user, isAdmin, login, logout, users, addUser, updateUser, deleteUser }}
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
  addDiagnostico: (d: DiagnosticoData) => void;
  deleteDiagnostico: (id: string) => void;
  formState: DiagFormState;
  dispatch: React.Dispatch<DiagAction>;
}

const DiagDataContext = createContext<DiagDataContextType>({
  diagnosticos: [],
  addDiagnostico: () => {},
  deleteDiagnostico: () => {},
  formState: initialFormState,
  dispatch: () => {},
});

export function DiagDataProvider({ children }: { children: ReactNode }) {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoData[]>(diagInitialDiagnosticos);
  const [formState, dispatch] = useReducer(diagReducer, initialFormState);

  const addDiagnostico = useCallback((d: DiagnosticoData) => {
    setDiagnosticos((prev) => [...prev, d]);
  }, []);

  const deleteDiagnostico = useCallback((id: string) => {
    setDiagnosticos((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <DiagDataContext.Provider
      value={{ diagnosticos, addDiagnostico, deleteDiagnostico, formState, dispatch }}
    >
      {children}
    </DiagDataContext.Provider>
  );
}

export const useDiagData = () => useContext(DiagDataContext);
