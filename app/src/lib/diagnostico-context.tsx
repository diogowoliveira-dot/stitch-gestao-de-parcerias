"use client";
import { createContext, useContext, useState, useReducer, useEffect, ReactNode, useCallback } from "react";
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
type DiagUserSafe = Omit<DiagUser, "senha">;

interface DiagAuthContextType {
  user: DiagUserSafe | null;
  isAdmin: boolean;
  isMaster: boolean;
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
  isMaster: false,
  login: async () => false,
  logout: () => {},
  users: [],
  addUser: async () => {},
  updateUser: async () => {},
  deleteUser: async () => {},
  loadingUsers: true,
});

const SESSION_KEY = 'diagUser';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function readSession(): DiagUserSafe | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Verifica expiração
    if (parsed._expiresAt && Date.now() > parsed._expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    const { _expiresAt: _, ...userData } = parsed;
    return userData;
  } catch { return null; }
}

function writeSession(userData: DiagUserSafe) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...userData, _expiresAt: Date.now() + SESSION_TTL_MS }));
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function DiagAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiagUserSafe | null>(() => readSession());
  const [users, setUsers] = useState<DiagUserSafe[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [useApi, setUseApi] = useState(true); // false = fallback to mock data

  const isMaster = user?.role === "master";
  const isAdmin = user?.role === "admin" || user?.role === "master";

  // Load users — try API first, fallback to mock
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/diagnostico/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setUseApi(true);
      } else {
        throw new Error("API error");
      }
    } catch {
      // Fallback to mock data (Vercel serverless without DB)
      console.warn("API indisponível, usando dados mock");
      setUseApi(false);
      setUsers(diagInitialUsers.map(({ senha, ...u }) => u));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const login = async (email: string, senha: string): Promise<boolean> => {
    // SEMPRE tenta a API real para autenticação — nunca usa credenciais mock.
    // (O fallback mock era perigoso: se fetchUsers falhasse ao carregar, useApi ficava false
    //  e nenhum usuário real conseguia logar.)
    try {
      const res = await fetch("/api/diagnostico/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        writeSession(userData);
        return true;
      }
      return false;
    } catch {
      // Erro de rede — API indisponível, não há fallback seguro
      console.error("Erro ao conectar à API de autenticação");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  const addUser = async (data: { nome: string; email: string; senha: string; role: string; status: string }) => {
    if (useApi) {
      const res = await fetch("/api/diagnostico/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchUsers();
        return;
      }
    }
    // Mock fallback
    const newUser: DiagUserSafe = {
      id: `du${Date.now()}`,
      nome: data.nome,
      email: data.email,
      role: data.role as "admin" | "consultor",
      status: data.status as "ativo" | "inativo",
      dataCriacao: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = async (id: string, data: Partial<DiagUser>) => {
    if (useApi) {
      const res = await fetch("/api/diagnostico/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
        if (user?.id === id) setUser(updated);
        return;
      }
    }
    // Mock fallback
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } as DiagUserSafe : u)));
    if (user?.id === id) setUser((prev) => (prev ? { ...prev, ...data } as DiagUserSafe : null));
  };

  const deleteUser = async (id: string) => {
    if (useApi) {
      const res = await fetch("/api/diagnostico/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao deletar usuário");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return;
    }
    // Mock fallback
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <DiagAuthContext.Provider
      value={{ user, isAdmin, isMaster, login, logout, users, addUser, updateUser, deleteUser, loadingUsers }}
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
  responsibleName?: string;
  responsibleRole?: string;
  // Campos de vendas / corretores (usados no cálculo do diagnóstico)
  totalVGV?: number;
  vgvGoal?: number;
  avgTicket?: number;
  totalBrokers?: number;
  activeBrokers?: number;
  hasCRM?: boolean;
  crmName?: string;
  challenges?: string[];
  challengesText?: string;
  desiredReports?: string[];
  tabelaZero?: boolean;
  tabelaZeroAccess?: string[];
  tabelaZeroObs?: string;
  observations?: string;
  toolCosts?: Record<string, number>;
  // Novos campos
  shareHouse?: number;
  shareParcerias?: number;
  numImobiliarias?: number;
  segmentacao?: string;
  segmentacaoDescritiva?: string;
  relatoriosDesejados?: string[];
  relatoriosDescritivo?: string;
  tabelaZeroParcerias?: boolean;
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
  | { type: "LOAD"; data: DiagFormState }
  | { type: "SET_FIELD"; field: string; value: unknown };

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
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
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
  deleteDiagnostico: (id: string, userId?: string) => Promise<void>;
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
  const [useApi, setUseApi] = useState(true);

  // Load diagnosticos — try API first, fallback to mock
  const fetchDiagnosticos = useCallback(async () => {
    try {
      const res = await fetch("/api/diagnostico/diagnosticos");
      if (res.ok) {
        const data = await res.json();
        setDiagnosticos(data);
        setUseApi(true);
      } else {
        throw new Error("API error");
      }
    } catch {
      console.warn("API indisponível, usando dados mock");
      setUseApi(false);
      setDiagnosticos(diagInitialDiagnosticos);
    } finally {
      setLoadingDiagnosticos(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnosticos();
  }, [fetchDiagnosticos]);

  const addDiagnostico = useCallback(async (d: DiagnosticoData) => {
    if (useApi) {
      try {
        const res = await fetch("/api/diagnostico/diagnosticos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        if (res.ok) {
          await fetchDiagnosticos();
          return;
        }
      } catch {
        // fallback
      }
    }
    // Mock fallback
    setDiagnosticos((prev) => [...prev, d]);
  }, [useApi, fetchDiagnosticos]);

  const deleteDiagnostico = useCallback(async (id: string, userId?: string) => {
    if (useApi) {
      try {
        const res = await fetch("/api/diagnostico/diagnosticos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, userId }),
        });
        if (res.ok) {
          setDiagnosticos((prev) => prev.filter((d) => d.id !== id));
          return;
        }
        // If 403, surface the error
        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Sem permissão");
        }
      } catch (err) {
        throw err;
      }
    }
    // Mock fallback
    setDiagnosticos((prev) => prev.filter((d) => d.id !== id));
  }, [useApi]);

  return (
    <DiagDataContext.Provider
      value={{ diagnosticos, addDiagnostico, deleteDiagnostico, formState, dispatch, loadingDiagnosticos }}
    >
      {children}
    </DiagDataContext.Provider>
  );
}

export const useDiagData = () => useContext(DiagDataContext);
