import { pipefyQuery, PIPE_ID } from "./utils";

export async function GET() {
  try {
    // Get phases with card counts and sample cards
    const phasesData = await pipefyQuery(`{
      pipe(id: ${PIPE_ID}) {
        id
        name
        cards_count
        phases {
          id
          name
          cards_count
          cards(first: 50) {
            edges {
              node {
                id
                title
                assignees { id name }
                current_phase { id name }
                created_at
                updated_at
                done
                due_date
                fields { name value }
              }
            }
          }
        }
      }
    }`);

    // Get cards updated today for the daily movements
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const recentCardsData = await pipefyQuery(`{
      allCards(pipeId: ${PIPE_ID}, first: 100) {
        edges {
          node {
            id
            title
            current_phase { id name }
            assignees { name }
            updated_at
            created_at
          }
        }
      }
    }`);

    const phases = phasesData.data.pipe.phases;
    const totalCards = phasesData.data.pipe.cards_count;
    const allRecentCards =
      recentCardsData.data?.allCards?.edges?.map(
        (e: { node: unknown }) => e.node
      ) || [];
    // Filter to cards updated today
    const todayMovements = allRecentCards.filter((c: { updated_at: string }) => {
      return new Date(c.updated_at) >= today;
    });

    // Categorize phases into funnel stages
    const funnelStages = {
      prospeccao: {
        label: "Prospecção",
        phases: ["Leads Embaixador", "Leads SDR"],
        color: "#6366f1",
      },
      contato: {
        label: "Contato",
        phases: ["1º Contato SDR", "2º Contato SDR", "3º Contato SDR"],
        color: "#8b5cf6",
      },
      nurturing: {
        label: "Nutrição",
        phases: ["Nutrição", "Resgate", "Resgate Embaixador"],
        color: "#f59e0b",
      },
      negociacao: {
        label: "Negociação",
        phases: [
          "Em contato/agendamento",
          "Reunião agendada 🤝",
          "No Show",
          "Apresentação Realizada",
          "Proposta Enviada",
        ],
        color: "#3b82f6",
      },
      fechados: {
        label: "Fechados",
        phases: [
          "Fechado Free",
          "Fechado Essencial @👩🏻",
          "Fechado Performance@👩🏻",
          "Fechado Avançado@👩🏻",
          "Fechados Transferir Cards",
        ],
        color: "#10b981",
      },
      upsell: {
        label: "Upsell",
        phases: [
          "Operadora de Parcerias",
          "Agendamento upsell @👩🏻",
          "Proposta Upssel 🚀",
        ],
        color: "#06b6d4",
      },
      perdidos: {
        label: "Perdidos / Inativos",
        phases: [
          "Não Fechado Comercial ❌",
          "Distrato",
          "Churn, Contratos não assinados e inadimplência",
          "Sem Perfil 💀",
          "Não mexer (relacionamento)",
          "Arquivo (Comercial)",
        ],
        color: "#ef4444",
      },
    };

    // Aggregate data per funnel stage
    const stageData = Object.entries(funnelStages).map(([key, stage]) => {
      const matchingPhases = phases.filter(
        (p: { name: string }) =>
          stage.phases.includes(p.name) ||
          stage.phases.some((sp) => p.name.includes(sp.replace(/[^\w\s]/g, "")))
      );
      const count = matchingPhases.reduce(
        (sum: number, p: { cards_count: number }) => sum + p.cards_count,
        0
      );
      return {
        key,
        ...stage,
        count,
        phases: matchingPhases.map(
          (p: { id: string; name: string; cards_count: number }) => ({
            id: p.id,
            name: p.name,
            count: p.cards_count,
          })
        ),
      };
    });

    // Calculate conversion rates based on cumulative pipeline flow
    // Cards flow: Prospecção → Contato → Negociação → Fechados (or Perdidos)
    // "Passed through" a stage = current count in that stage + all cards that moved beyond it
    const prospeccaoCount =
      stageData.find((s) => s.key === "prospeccao")?.count || 0;
    const contatoCount =
      stageData.find((s) => s.key === "contato")?.count || 0;
    const nurturingCount =
      stageData.find((s) => s.key === "nurturing")?.count || 0;
    const negociacaoCount =
      stageData.find((s) => s.key === "negociacao")?.count || 0;
    const fechadosCount =
      stageData.find((s) => s.key === "fechados")?.count || 0;
    const upsellCount =
      stageData.find((s) => s.key === "upsell")?.count || 0;
    const perdidosCount =
      stageData.find((s) => s.key === "perdidos")?.count || 0;

    // Total cards that ever entered the funnel
    const totalEver = totalCards;
    // Cards that progressed past prospecção (reached contato or beyond)
    const passedContact = totalEver - prospeccaoCount;
    // Cards that reached negociação or beyond
    const passedNegociacao = negociacaoCount + fechadosCount + upsellCount + perdidosCount;
    // Cards that closed (won)
    const totalWon = fechadosCount + upsellCount;

    const conversionRates = {
      leadToContact: ((passedContact / (totalEver || 1)) * 100).toFixed(1),
      contactToNegotiation: ((passedNegociacao / (passedContact || 1)) * 100).toFixed(1),
      negotiationToClose: ((totalWon / (passedNegociacao || 1)) * 100).toFixed(1),
      overallConversion: ((totalWon / (totalEver || 1)) * 100).toFixed(1),
    };

    // Get assignee distribution
    const assigneeCounts: Record<string, number> = {};
    phases.forEach(
      (phase: {
        cards: {
          edges: {
            node: { assignees: { name: string }[] };
          }[];
        };
      }) => {
        phase.cards.edges.forEach(
          (edge: { node: { assignees: { name: string }[] } }) => {
            edge.node.assignees.forEach((a: { name: string }) => {
              assigneeCounts[a.name] = (assigneeCounts[a.name] || 0) + 1;
            });
          }
        );
      }
    );

    const topAssignees = Object.entries(assigneeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Phase details
    const phaseDetails = phases.map(
      (p: { id: string; name: string; cards_count: number }) => ({
        id: p.id,
        name: p.name,
        count: p.cards_count,
      })
    );

    return Response.json({
      pipeName: phasesData.data.pipe.name,
      totalCards,
      stageData,
      conversionRates,
      topAssignees,
      phaseDetails,
      todayMovements,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pipefy API error:", error);
    return Response.json({ error: "Failed to fetch Pipefy data" }, { status: 500 });
  }
}
