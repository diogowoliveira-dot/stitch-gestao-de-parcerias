import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Users ──
  const admin = await prisma.user.create({
    data: {
      nome: "Admin DWV",
      email: "admin@dwv.com",
      senha: await bcrypt.hash("123", 10),
      role: "admin",
      status: "ativo",
      dataCriacao: new Date("2024-01-01"),
      ultimoAcesso: new Date("2026-03-13"),
    },
  });

  const roberto = await prisma.user.create({
    data: {
      nome: "Roberto Almeida",
      email: "roberto@dwv.com",
      senha: await bcrypt.hash("123456", 10),
      role: "consultor",
      status: "ativo",
      dataCriacao: new Date("2024-01-10"),
      ultimoAcesso: new Date("2026-03-12"),
    },
  });

  const ana = await prisma.user.create({
    data: {
      nome: "Ana Pereira",
      email: "ana@dwv.com",
      senha: await bcrypt.hash("123456", 10),
      role: "consultor",
      status: "ativo",
      dataCriacao: new Date("2024-02-01"),
      ultimoAcesso: new Date("2026-03-10"),
    },
  });

  await prisma.user.create({
    data: {
      nome: "Carlos Mendes",
      email: "carlos@dwv.com",
      senha: await bcrypt.hash("123456", 10),
      role: "consultor",
      status: "inativo",
      dataCriacao: new Date("2024-02-15"),
    },
  });

  // ── Helper to create a full diagnostico ──
  async function criarDiagnostico(data: {
    empresa: { nome: string; cidade: string; estado: string };
    cargos: Array<{
      cargoKey: string;
      nome: string;
      existe: boolean;
      subordinadosDe: string | null;
      tarefas: string[];
      metricas: string[];
      ferramentas: string[];
      subordinados: string[];
    }>;
    ferramentasGerais: string[];
    problemas: string[];
    dataCriacao: string;
    criadoPorId: string;
    status: string;
  }) {
    const diag = await prisma.diagnostico.create({
      data: {
        empresaNome: data.empresa.nome,
        empresaCidade: data.empresa.cidade,
        empresaEstado: data.empresa.estado,
        status: data.status,
        dataCriacao: new Date(data.dataCriacao),
        criadoPorId: data.criadoPorId,
      },
    });

    for (const cargo of data.cargos) {
      await prisma.cargo.create({
        data: {
          cargoKey: cargo.cargoKey,
          nome: cargo.nome,
          existe: cargo.existe,
          subordinadosDe: cargo.subordinadosDe,
          diagnosticoId: diag.id,
          tarefas: { create: cargo.tarefas.map((t) => ({ nome: t })) },
          metricas: { create: cargo.metricas.map((m) => ({ nome: m })) },
          ferramentas: { create: cargo.ferramentas.map((f) => ({ nome: f })) },
          subordinados: { create: cargo.subordinados.map((s) => ({ cargoKey: s })) },
        },
      });
    }

    for (const f of data.ferramentasGerais) {
      await prisma.ferramentaGeral.create({
        data: { nome: f, diagnosticoId: diag.id },
      });
    }

    for (const p of data.problemas) {
      await prisma.problemaIdentificado.create({
        data: { descricao: p, diagnosticoId: diag.id },
      });
    }

    return diag;
  }

  // ── Diagnóstico 1: MRV ──
  await criarDiagnostico({
    empresa: { nome: "MRV Engenharia", cidade: "Belo Horizonte", estado: "MG" },
    cargos: [
      {
        cargoKey: "cargo_diretor_comercial", nome: "Diretor Comercial", existe: true,
        subordinadosDe: null,
        tarefas: ["Definição de metas", "Relatórios para diretoria", "Gestão de campanhas"],
        metricas: ["VGV mensal", "Número de propostas", "Taxa de conversão"],
        ferramentas: ["Planilhas Excel / Google Sheets", "WhatsApp pessoal", "Google Drive / Intranet"],
        subordinados: ["cargo_diretor_parceria"],
      },
      {
        cargoKey: "cargo_diretor_parceria", nome: "Diretor de Parceria", existe: true,
        subordinadosDe: "cargo_diretor_comercial",
        tarefas: ["Gestão de campanhas", "Definição de metas", "Relatórios para diretoria"],
        metricas: ["VGV mensal", "Engajamento da base", "Número de corretores ativos"],
        ferramentas: ["CRM interno (focado em contratos)", "Planilhas Excel / Google Sheets", "E-mail marketing (ferramenta genérica)"],
        subordinados: ["cargo_gerente_parceria"],
      },
      {
        cargoKey: "cargo_gerente_parceria", nome: "Gerente de Parceria", existe: true,
        subordinadosDe: "cargo_diretor_parceria",
        tarefas: ["Aprovação de propostas", "Gestão de campanhas", "Relatórios para diretoria", "Treinamentos de produto"],
        metricas: ["Número de corretores ativos", "Taxa de conversão", "Número de propostas"],
        ferramentas: ["CRM interno (focado em contratos)", "E-mail marketing (ferramenta genérica)", "WhatsApp pessoal", "Planilhas Excel / Google Sheets"],
        subordinados: ["cargo_executivo_parceria", "cargo_assistente_comercial"],
      },
      {
        cargoKey: "cargo_executivo_parceria", nome: "Executivo de Parceria", existe: true,
        subordinadosDe: "cargo_gerente_parceria",
        tarefas: ["Visitas a corretores / imobiliárias", "Captação de novos corretores", "Atendimento via WhatsApp", "Distribuição de tabelas e materiais", "Treinamentos de produto"],
        metricas: ["Número de visitas realizadas", "Número de novos corretores captados", "Engajamento da base"],
        ferramentas: ["WhatsApp pessoal", "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)", "Ferramenta não oficial de disparo em massa", "Google Drive / Intranet"],
        subordinados: [],
      },
      {
        cargoKey: "cargo_assistente_comercial", nome: "Assistente Comercial", existe: true,
        subordinadosDe: "cargo_gerente_parceria",
        tarefas: ["Distribuição de tabelas e materiais", "Atualização de preços", "Atendimento via WhatsApp"],
        metricas: ["Engajamento da base"],
        ferramentas: ["WhatsApp pessoal", "Planilhas Excel / Google Sheets", "Google Drive / Intranet"],
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      "Planilhas Excel / Google Sheets", "WhatsApp pessoal", "CRM interno (focado em contratos)",
      "E-mail marketing (ferramenta genérica)", "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)",
      "Ferramenta não oficial de disparo em massa", "Google Drive / Intranet",
    ],
    problemas: [
      "Dados descentralizados e desatualizados — sem visão de carteira em tempo real",
      "Histórico de relacionamento some quando o executivo sai — risco de perda de carteira",
      "CRM focado em contrato, não em corretor — sem perfil de engajamento da base",
      "Disparos sem rastreamento de abertura — impossível saber quem engajou",
      "Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta",
      "Risco real de banimento do número — operação em risco",
      "Materiais compartilhados sem rastreamento — ninguém sabe quem acessou o quê",
      "Estrutura com alto grau de fragmentação operacional",
    ],
    dataCriacao: "2026-03-10", criadoPorId: roberto.id, status: "completo",
  });

  // ── Diagnóstico 2: Cyrela ──
  await criarDiagnostico({
    empresa: { nome: "Cyrela Brazil Realty", cidade: "São Paulo", estado: "SP" },
    cargos: [
      {
        cargoKey: "cargo_diretor_parceria", nome: "Diretor de Parceria", existe: true,
        subordinadosDe: null,
        tarefas: ["Definição de metas", "Aprovação de propostas", "Relatórios para diretoria", "Gestão de campanhas"],
        metricas: ["VGV mensal", "Número de propostas", "Taxa de conversão"],
        ferramentas: ["Planilhas Excel / Google Sheets", "CRM interno (focado em contratos)", "WhatsApp pessoal"],
        subordinados: ["cargo_executivo_parceria"],
      },
      {
        cargoKey: "cargo_executivo_parceria", nome: "Executivo de Parceria", existe: true,
        subordinadosDe: "cargo_diretor_parceria",
        tarefas: ["Visitas a corretores / imobiliárias", "Captação de novos corretores", "Atendimento via WhatsApp", "Treinamentos de produto"],
        metricas: ["Número de visitas realizadas", "Número de novos corretores captados"],
        ferramentas: ["WhatsApp pessoal", "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)", "E-mail marketing (ferramenta genérica)"],
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      "Planilhas Excel / Google Sheets", "CRM interno (focado em contratos)", "WhatsApp pessoal",
      "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)", "E-mail marketing (ferramenta genérica)",
    ],
    problemas: [
      "Dados descentralizados e desatualizados — sem visão de carteira em tempo real",
      "Histórico de relacionamento some quando o executivo sai — risco de perda de carteira",
      "CRM focado em contrato, não em corretor — sem perfil de engajamento da base",
      "Disparos sem rastreamento de abertura — impossível saber quem engajou",
      "Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta",
      "Estrutura com alto grau de fragmentação operacional",
    ],
    dataCriacao: "2026-03-08", criadoPorId: ana.id, status: "completo",
  });

  // ── Diagnóstico 3: Tenda ──
  await criarDiagnostico({
    empresa: { nome: "Tenda Construtora", cidade: "Rio de Janeiro", estado: "RJ" },
    cargos: [
      {
        cargoKey: "cargo_executivo_parceria", nome: "Executivo de Parceria", existe: true,
        subordinadosDe: null,
        tarefas: ["Visitas a corretores / imobiliárias", "Captação de novos corretores", "Atendimento via WhatsApp", "Distribuição de tabelas e materiais"],
        metricas: ["Número de visitas realizadas", "Número de novos corretores captados", "Engajamento da base"],
        ferramentas: ["WhatsApp pessoal", "Planilhas Excel / Google Sheets", "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)"],
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      "WhatsApp pessoal", "Planilhas Excel / Google Sheets", "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)",
    ],
    problemas: [
      "Histórico de relacionamento some quando o executivo sai — risco de perda de carteira",
      "Dados descentralizados e desatualizados — sem visão de carteira em tempo real",
      "Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta",
    ],
    dataCriacao: "2026-03-05", criadoPorId: roberto.id, status: "completo",
  });

  // ── Diagnóstico 4: Direcional ──
  await criarDiagnostico({
    empresa: { nome: "Direcional Engenharia", cidade: "Goiânia", estado: "GO" },
    cargos: [
      {
        cargoKey: "cargo_diretor_comercial", nome: "Diretor Comercial", existe: true,
        subordinadosDe: null,
        tarefas: ["Definição de metas", "Relatórios para diretoria"],
        metricas: ["VGV mensal", "Taxa de conversão"],
        ferramentas: ["Planilhas Excel / Google Sheets", "Google Drive / Intranet"],
        subordinados: ["cargo_coordenador_comercial", "cargo_supervisor_vendas"],
      },
      {
        cargoKey: "cargo_coordenador_comercial", nome: "Coordenador Comercial", existe: true,
        subordinadosDe: "cargo_diretor_comercial",
        tarefas: ["Gestão de campanhas", "Aprovação de propostas", "Treinamentos de produto"],
        metricas: ["Número de propostas", "Número de corretores ativos"],
        ferramentas: ["CRM interno (focado em contratos)", "E-mail marketing (ferramenta genérica)", "WhatsApp pessoal"],
        subordinados: ["cargo_executivo_parceria"],
      },
      {
        cargoKey: "cargo_supervisor_vendas", nome: "Supervisor de Vendas", existe: true,
        subordinadosDe: "cargo_diretor_comercial",
        tarefas: ["Treinamentos de produto", "Gestão de campanhas", "Relatórios para diretoria"],
        metricas: ["Engajamento da base", "Taxa de conversão"],
        ferramentas: ["WhatsApp pessoal", "Planilhas Excel / Google Sheets"],
        subordinados: ["cargo_executivo_parceria"],
      },
      {
        cargoKey: "cargo_executivo_parceria", nome: "Executivo de Parceria", existe: true,
        subordinadosDe: "cargo_coordenador_comercial",
        tarefas: ["Visitas a corretores / imobiliárias", "Captação de novos corretores", "Atendimento via WhatsApp", "Distribuição de tabelas e materiais"],
        metricas: ["Número de visitas realizadas", "Número de novos corretores captados"],
        ferramentas: ["WhatsApp pessoal", "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)", "Ferramenta não oficial de disparo em massa"],
        subordinados: [],
      },
      {
        cargoKey: "cargo_assistente_comercial", nome: "Assistente Comercial", existe: true,
        subordinadosDe: "cargo_coordenador_comercial",
        tarefas: ["Atualização de preços", "Distribuição de tabelas e materiais", "Atendimento via WhatsApp"],
        metricas: ["Engajamento da base"],
        ferramentas: ["WhatsApp pessoal", "Google Drive / Intranet", "Planilhas Excel / Google Sheets"],
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      "Planilhas Excel / Google Sheets", "WhatsApp pessoal", "CRM interno (focado em contratos)",
      "E-mail marketing (ferramenta genérica)", "Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)",
      "Ferramenta não oficial de disparo em massa", "Google Drive / Intranet",
    ],
    problemas: [
      "Dados descentralizados e desatualizados — sem visão de carteira em tempo real",
      "Histórico de relacionamento some quando o executivo sai — risco de perda de carteira",
      "CRM focado em contrato, não em corretor — sem perfil de engajamento da base",
      "Disparos sem rastreamento de abertura — impossível saber quem engajou",
      "Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta",
      "Risco real de banimento do número — operação em risco",
      "Materiais compartilhados sem rastreamento — ninguém sabe quem acessou o quê",
      "Estrutura com alto grau de fragmentação operacional",
    ],
    dataCriacao: "2026-03-01", criadoPorId: ana.id, status: "completo",
  });

  // ── Diagnóstico 5: Even (rascunho) ──
  await criarDiagnostico({
    empresa: { nome: "Even Construtora", cidade: "São Paulo", estado: "SP" },
    cargos: [
      {
        cargoKey: "cargo_gerente_parceria", nome: "Gerente de Parceria", existe: true,
        subordinadosDe: null,
        tarefas: ["Aprovação de propostas"],
        metricas: ["Número de propostas"],
        ferramentas: ["CRM interno (focado em contratos)"],
        subordinados: ["cargo_executivo_parceria"],
      },
      {
        cargoKey: "cargo_executivo_parceria", nome: "Executivo de Parceria", existe: true,
        subordinadosDe: "cargo_gerente_parceria",
        tarefas: ["Visitas a corretores / imobiliárias", "Atendimento via WhatsApp"],
        metricas: ["Número de visitas realizadas"],
        ferramentas: ["WhatsApp pessoal"],
        subordinados: [],
      },
    ],
    ferramentasGerais: ["CRM interno (focado em contratos)", "WhatsApp pessoal"],
    problemas: [
      "CRM focado em contrato, não em corretor — sem perfil de engajamento da base",
      "Histórico de relacionamento some quando o executivo sai — risco de perda de carteira",
    ],
    dataCriacao: "2026-03-12", criadoPorId: roberto.id, status: "rascunho",
  });

  console.log("✅ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
