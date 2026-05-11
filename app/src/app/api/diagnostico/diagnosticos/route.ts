import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all diagnosticos
export async function GET() {
  try {
  const diagnosticos = await prisma.diagnostico.findMany({
    include: {
      criadoPor: { select: { id: true, nome: true } },
      cargos: {
        include: {
          tarefas: true,
          metricas: true,
          ferramentas: true,
          subordinados: true,
        },
      },
      ferramentasGerais: true,
      problemasIdentificados: true,
    },
    orderBy: { dataCriacao: "desc" },
  });

  const result = diagnosticos.map((d) => ({
    id: d.id,
    empresa: {
      nome: d.empresaNome,
      cidade: d.empresaCidade,
      estado: d.empresaEstado,
    },
    cargos: d.cargos.map((c) => ({
      id: c.cargoKey,
      nome: c.nome,
      existe: c.existe,
      acumulaFuncao: c.acumulaFuncao,
      personalizado: c.personalizado,
      tarefas: c.tarefas.map((t) => t.nome),
      metricas: c.metricas.map((m) => m.nome),
      ferramentas: c.ferramentas.map((f) => f.nome),
      subordinadosDe: c.subordinadosDe,
      subordinados: c.subordinados.map((s) => s.cargoKey),
      quantidade: c.quantidade,
      kpiPrincipal: c.kpiPrincipal ? JSON.parse(c.kpiPrincipal) : [],
      atividadesDescritivas: c.atividadesDescritivas || "",
      crmNome: c.crmNome,
    })),
    ferramentasGerais: d.ferramentasGerais.map((f) => f.nome),
    problemasIdentificados: d.problemasIdentificados.map((p) => p.descricao),
    dataCriacao: d.dataCriacao.toISOString().split("T")[0],
    criadoPor: d.criadoPorId,
    criadoPorNome: d.criadoPor.nome,
    status: d.status,
    isSimulacao: d.isSimulacao,
    aiAnalysis: d.aiAnalysis,

    // Responsável
    responsavelNome: d.responsavelNome,
    responsavelCargo: d.responsavelCargo,

    // Métricas VGV / corretores
    totalVGV: d.totalVGV,
    vgvGoal: d.vgvGoal,
    avgTicket: d.avgTicket,
    totalBrokers: d.totalBrokers,
    activeBrokers: d.activeBrokers,

    // Canais
    shareHouse: d.shareHouse,
    shareParcerias: d.shareParcerias,
    numImobiliarias: d.numImobiliarias,
    hasHouse: d.hasHouse,
    hasParc: d.hasParc,
    hasImob: d.hasImob,
    exclusividade: d.exclusividade,

    // Inventário
    numEmpreendimentos: d.numEmpreendimentos,
    numPreLancamento: d.numPreLancamento,
    numLancamento: d.numLancamento,
    numEstoque: d.numEstoque,
    focoVendas: d.focoVendas,
    totalImoveisVenda: d.totalImoveisVenda,
    propostasMensais: d.propostasMensais,
    fechamentosMensais: d.fechamentosMensais,

    // Tecnologia
    temCRM: d.temCRM,
    crmNome: d.crmNome,
    crmContratoNome: d.crmContratoNome,
    ferramentasAtivas: d.ferramentasAtivas ? JSON.parse(d.ferramentasAtivas) : [],
    custosFerramentas: d.custosFerramentas ? JSON.parse(d.custosFerramentas) : {},

    // Segmentação e relatórios
    segmentacao: d.segmentacao,
    segmentacaoDescritiva: d.segmentacaoDescritiva,
    relatoriosDesejados: d.relatoriosDesejados ? JSON.parse(d.relatoriosDesejados) : [],
    relatoriosDescritivo: d.relatoriosDescritivo,

    // Dores
    atingiuMetas: d.atingiuMetas,
    desafiosKeys: d.desafiosKeys ? JSON.parse(d.desafiosKeys) : [],
    desafiosTexto: d.desafiosTexto,
    acoesTestadas: d.acoesTestadas,
    resultadosTestados: d.resultadosTestados,

    // Contexto estratégico
    temEventos: d.temEventos,
    temIncentivo: d.temIncentivo,
    concorrente: d.concorrente,
    expectativa12m: d.expectativa12m,

    // Tabela Zero
    tabelaZeroParcerias: d.tabelaZeroParcerias,
    tabelaZeroAcesso: d.tabelaZeroAcesso ? JSON.parse(d.tabelaZeroAcesso) : [],
    tabelaZeroObs: d.tabelaZeroObs,

    // Observações gerais
    observacoesGerais: d.observacoesGerais,
  }));

  return NextResponse.json(result);
  } catch (err) {
    console.error("GET /diagnosticos error:", err);
    return NextResponse.json({ error: "Erro ao buscar diagnósticos" }, { status: 500 });
  }
}

// ── Validação de consistência dos dados métricos ──────────────────────────────
function validateMetrics(data: Record<string, unknown>): string | null {
  const total  = data.totalBrokers  != null ? Number(data.totalBrokers)  : null;
  const active = data.activeBrokers != null ? Number(data.activeBrokers) : null;
  const props  = data.propostasMensais   != null ? Number(data.propostasMensais)   : null;
  const fechs  = data.fechamentosMensais != null ? Number(data.fechamentosMensais) : null;

  if (total !== null && total <= 0)
    return 'totalBrokers deve ser maior que zero';
  if (active !== null && active < 0)
    return 'activeBrokers não pode ser negativo';
  if (total !== null && active !== null && active > total)
    return `activeBrokers (${active}) não pode ser maior que totalBrokers (${total})`;
  if (props !== null && props <= 0)
    return 'propostasMensais deve ser maior que zero';
  if (fechs !== null && props !== null && fechs > props)
    return `fechamentosMensais (${fechs}) não pode ser maior que propostasMensais (${props})`;
  return null;
}

// POST create diagnostico
export async function POST(req: NextRequest) {
  const data = await req.json();

  const metricError = validateMetrics(data);
  if (metricError) {
    return NextResponse.json({ error: metricError }, { status: 422 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const diag = await tx.diagnostico.create({
        data: {
          // Empresa
          empresaNome: data.empresa.nome,
          empresaCidade: data.empresa.cidade,
          empresaEstado: data.empresa.estado,
          status: data.status || "completo",
          criadoPorId: data.criadoPor,
          isSimulacao: data.isSimulacao ?? false,

          // Responsável
          responsavelNome: data.responsavelNome ?? null,
          responsavelCargo: data.responsavelCargo ?? null,

          // Métricas
          totalVGV: data.totalVGV ?? null,
          vgvGoal: data.vgvGoal ?? null,
          avgTicket: data.avgTicket ?? null,
          totalBrokers: data.totalBrokers ?? null,
          activeBrokers: data.activeBrokers ?? null,

          // Canais
          shareHouse: data.shareHouse ?? null,
          shareParcerias: data.shareParcerias ?? null,
          numImobiliarias: data.numImobiliarias ?? null,
          hasHouse: data.hasHouse ?? null,
          hasParc: data.hasParc ?? null,
          hasImob: data.hasImob ?? null,
          exclusividade: data.exclusividade ?? null,

          // Inventário
          numEmpreendimentos: data.numEmpreendimentos ?? null,
          numPreLancamento: data.numPreLancamento ?? null,
          numLancamento: data.numLancamento ?? null,
          numEstoque: data.numEstoque ?? null,
          focoVendas: data.focoVendas ?? null,
          totalImoveisVenda: data.totalImoveisVenda ?? null,
          propostasMensais: data.propostasMensais ?? null,
          fechamentosMensais: data.fechamentosMensais ?? null,

          // Tecnologia
          temCRM: data.temCRM ?? null,
          crmNome: data.crmNome ?? null,
          crmContratoNome: data.crmContratoNome ?? null,
          ferramentasAtivas: data.ferramentasAtivas?.length ? JSON.stringify(data.ferramentasAtivas) : null,
          custosFerramentas: data.custosFerramentas && Object.keys(data.custosFerramentas).length ? JSON.stringify(data.custosFerramentas) : null,

          // Segmentação e relatórios
          segmentacao: data.segmentacao ?? null,
          segmentacaoDescritiva: data.segmentacaoDescritiva ?? null,
          relatoriosDesejados: data.relatoriosDesejados?.length ? JSON.stringify(data.relatoriosDesejados) : null,
          relatoriosDescritivo: data.relatoriosDescritivo ?? null,

          // Dores
          atingiuMetas: data.atingiuMetas ?? null,
          desafiosKeys: data.desafiosKeys?.length ? JSON.stringify(data.desafiosKeys) : null,
          desafiosTexto: data.desafiosTexto ?? null,
          acoesTestadas: data.acoesTestadas ?? null,
          resultadosTestados: data.resultadosTestados ?? null,

          // Contexto
          temEventos: data.temEventos ?? null,
          temIncentivo: data.temIncentivo ?? null,
          concorrente: data.concorrente ?? null,
          expectativa12m: data.expectativa12m ?? null,

          // Tabela Zero
          tabelaZeroParcerias: data.tabelaZeroParcerias ?? null,
          tabelaZeroAcesso: data.tabelaZeroAcesso?.length ? JSON.stringify(data.tabelaZeroAcesso) : null,
          tabelaZeroObs: data.tabelaZeroObs ?? null,

          // Observações gerais
          observacoesGerais: data.observacoesGerais ?? null,
        },
      });

      // Cargos em paralelo (evita timeout por loop sequencial)
      await Promise.all((data.cargos || []).map((cargo: Record<string, unknown>) =>
        tx.cargo.create({
          data: {
            cargoKey: cargo.id as string,
            nome: cargo.nome as string,
            existe: cargo.existe as boolean,
            acumulaFuncao: (cargo.acumulaFuncao as string) || null,
            personalizado: (cargo.personalizado as boolean) || false,
            subordinadosDe: (cargo.subordinadosDe as string) || null,
            quantidade: (cargo.quantidade as number) || 1,
            kpiPrincipal: (cargo.kpiPrincipal as string[])?.length ? JSON.stringify(cargo.kpiPrincipal) : null,
            atividadesDescritivas: (cargo.atividadesDescritivas as string) || null,
            crmNome: (cargo.crmNome as string) || null,
            diagnosticoId: diag.id,
            tarefas: { create: ((cargo.tarefas as string[]) || []).map((t: string) => ({ nome: t })) },
            metricas: { create: ((cargo.metricas as string[]) || []).map((m: string) => ({ nome: m })) },
            ferramentas: { create: ((cargo.ferramentas as string[]) || []).map((fv: string) => ({ nome: fv })) },
            subordinados: { create: ((cargo.subordinados as string[]) || []).map((s: string) => ({ cargoKey: s })) },
          },
        })
      ));

      // Ferramentas gerais e problemas em paralelo
      await Promise.all([
        ...(data.ferramentasGerais || []).map((f: string) =>
          tx.ferramentaGeral.create({ data: { nome: f, diagnosticoId: diag.id } })
        ),
        ...(data.problemasIdentificados || []).map((p: string) =>
          tx.problemaIdentificado.create({ data: { descricao: p, diagnosticoId: diag.id } })
        ),
      ]);

      return { id: diag.id };
    }, { timeout: 30000 }); // 30s — evita timeout padrão de 5s em cold start Neon

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('POST /diagnosticos error:', err);
    return NextResponse.json({ error: 'Erro interno ao criar diagnóstico' }, { status: 500 });
  }
}

// PUT update diagnostico (completo)
export async function PUT(req: NextRequest) {
  const data = await req.json();
  const { id, ...f } = data;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Para validar totalBrokers/activeBrokers no PUT precisamos conhecer os valores
  // actuais se só um dos dois campos for enviado
  const needsBrokerCheck = f.totalBrokers !== undefined || f.activeBrokers !== undefined;
  if (needsBrokerCheck) {
    let checkTotal  = f.totalBrokers;
    let checkActive = f.activeBrokers;
    if (checkTotal === undefined || checkActive === undefined) {
      // Busca o valor atual do outro campo
      const cur = await prisma.diagnostico.findUnique({
        where: { id }, select: { totalBrokers: true, activeBrokers: true }
      });
      if (cur) {
        if (checkTotal  === undefined) checkTotal  = cur.totalBrokers;
        if (checkActive === undefined) checkActive = cur.activeBrokers;
      }
    }
    const metricError = validateMetrics({ totalBrokers: checkTotal, activeBrokers: checkActive,
      propostasMensais: f.propostasMensais, fechamentosMensais: f.fechamentosMensais });
    if (metricError) {
      return NextResponse.json({ error: metricError }, { status: 422 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u: Record<string, any> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined) u[k] = v; };
  const setj = (k: string, v: unknown) => {
    if (v === undefined) return;
    if (Array.isArray(v) && v.length === 0) { u[k] = null; return; }
    u[k] = JSON.stringify(v);
  };

  set("empresaNome", f.empresa?.nome);
  set("empresaCidade", f.empresa?.cidade);
  set("empresaEstado", f.empresa?.estado);
  set("responsavelNome", f.responsavelNome);
  set("responsavelCargo", f.responsavelCargo);
  set("totalVGV", f.totalVGV);
  set("vgvGoal", f.vgvGoal);
  set("avgTicket", f.avgTicket);
  set("totalBrokers", f.totalBrokers);
  set("activeBrokers", f.activeBrokers);
  set("shareHouse", f.shareHouse);
  set("shareParcerias", f.shareParcerias);
  set("numImobiliarias", f.numImobiliarias);
  set("hasHouse", f.hasHouse);
  set("hasParc", f.hasParc);
  set("hasImob", f.hasImob);
  set("exclusividade", f.exclusividade);
  set("numEmpreendimentos", f.numEmpreendimentos);
  set("numPreLancamento", f.numPreLancamento);
  set("numLancamento", f.numLancamento);
  set("numEstoque", f.numEstoque);
  set("focoVendas", f.focoVendas);
  set("totalImoveisVenda", f.totalImoveisVenda);
  set("propostasMensais", f.propostasMensais);
  set("fechamentosMensais", f.fechamentosMensais);
  set("temCRM", f.temCRM);
  set("crmNome", f.crmNome);
  set("crmContratoNome", f.crmContratoNome);
  setj("ferramentasAtivas", f.ferramentasAtivas);
  setj("custosFerramentas", f.custosFerramentas);
  set("segmentacao", f.segmentacao);
  set("segmentacaoDescritiva", f.segmentacaoDescritiva);
  setj("relatoriosDesejados", f.relatoriosDesejados);
  set("relatoriosDescritivo", f.relatoriosDescritivo);
  set("atingiuMetas", f.atingiuMetas);
  setj("desafiosKeys", f.desafiosKeys);
  set("desafiosTexto", f.desafiosTexto);
  set("acoesTestadas", f.acoesTestadas);
  set("resultadosTestados", f.resultadosTestados);
  set("temEventos", f.temEventos);
  set("temIncentivo", f.temIncentivo);
  set("concorrente", f.concorrente);
  set("expectativa12m", f.expectativa12m);
  set("tabelaZeroParcerias", f.tabelaZeroParcerias);
  setj("tabelaZeroAcesso", f.tabelaZeroAcesso);
  set("tabelaZeroObs", f.tabelaZeroObs);
  set("observacoesGerais", f.observacoesGerais);
  set("aiAnalysis", f.aiAnalysis);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.diagnostico.update({ where: { id }, data: u });

      // Recriar cargos em paralelo se fornecidos
      if (f.cargos !== undefined) {
        await tx.cargo.deleteMany({ where: { diagnosticoId: id } });
        await Promise.all((f.cargos || []).map((cargo: Record<string, unknown>) =>
          tx.cargo.create({
            data: {
              cargoKey: cargo.id as string,
              nome: cargo.nome as string,
              existe: cargo.existe as boolean,
              acumulaFuncao: (cargo.acumulaFuncao as string) || null,
              personalizado: (cargo.personalizado as boolean) || false,
              subordinadosDe: (cargo.subordinadosDe as string) || null,
              quantidade: (cargo.quantidade as number) || 1,
              kpiPrincipal: (cargo.kpiPrincipal as string[])?.length ? JSON.stringify(cargo.kpiPrincipal) : null,
              atividadesDescritivas: (cargo.atividadesDescritivas as string) || null,
              crmNome: (cargo.crmNome as string) || null,
              diagnosticoId: id,
              tarefas: { create: ((cargo.tarefas as string[]) || []).map((t: string) => ({ nome: t })) },
              metricas: { create: ((cargo.metricas as string[]) || []).map((m: string) => ({ nome: m })) },
              ferramentas: { create: ((cargo.ferramentas as string[]) || []).map((fv: string) => ({ nome: fv })) },
              subordinados: { create: ((cargo.subordinados as string[]) || []).map((s: string) => ({ cargoKey: s })) },
            },
          })
        ));
      }

      // Recriar problemas identificados em paralelo se fornecidos
      if (f.problemasIdentificados !== undefined) {
        await tx.problemaIdentificado.deleteMany({ where: { diagnosticoId: id } });
        await Promise.all((f.problemasIdentificados || []).map((p: string) =>
          tx.problemaIdentificado.create({ data: { descricao: p, diagnosticoId: id } })
        ));
      }

      // Recriar ferramentas gerais em paralelo se fornecidas
      if (f.ferramentasGerais !== undefined) {
        await tx.ferramentaGeral.deleteMany({ where: { diagnosticoId: id } });
        await Promise.all((f.ferramentasGerais || []).map((fv: string) =>
          tx.ferramentaGeral.create({ data: { nome: fv, diagnosticoId: id } })
        ));
      }
    }, { timeout: 30000 }); // 30s — evita timeout padrão de 5s em cold start Neon

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /diagnosticos error:', err);
    return NextResponse.json({ error: 'Erro interno ao atualizar diagnóstico' }, { status: 500 });
  }
}

// DELETE diagnostico
export async function DELETE(req: NextRequest) {
  try {
    const { id, userId } = await req.json();

    // Fetch the diagnostico to check isSimulacao
    const diag = await prisma.diagnostico.findUnique({ where: { id }, select: { isSimulacao: true } });
    if (!diag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (!diag.isSimulacao) {
      // Real diagnostico — only master can delete
      if (!userId) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || user.role !== "master") {
        return NextResponse.json({ error: "Apenas o usuário master pode apagar diagnósticos reais" }, { status: 403 });
      }
    }
    // Simulations: any authenticated user can delete (userId optional, no role check)

    await prisma.diagnostico.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Erro interno ao deletar" }, { status: 500 });
  }
}
