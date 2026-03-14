import { pipefyQuery, PIPE_ID, REPORT_EMAIL } from "../utils";

interface CardNode {
  id: string;
  title: string;
  current_phase: { name: string };
  assignees: { name: string }[];
  updated_at: string;
}

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get pipe info and phases
    const pipeData = await pipefyQuery(`{
      pipe(id: ${PIPE_ID}) {
        name
        cards_count
        phases {
          name
          cards_count
        }
      }
    }`);

    // Get recent cards via allCards
    const cardsData = await pipefyQuery(`{
      allCards(pipeId: ${PIPE_ID}, first: 100) {
        edges {
          node {
            id
            title
            current_phase { name }
            assignees { name }
            updated_at
          }
        }
      }
    }`);

    const pipe = pipeData.data.pipe;
    const allRecent: CardNode[] =
      cardsData.data.allCards.edges.map((e: { node: CardNode }) => e.node) || [];

    // Filter to only cards updated today
    const movements = allRecent.filter((c) => {
      const updatedDate = new Date(c.updated_at);
      return updatedDate >= today;
    });

    const phases: { name: string; cards_count: number }[] = pipe.phases;

    const dateStr = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;color:#ffffff;">
  <div style="max-width:680px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:40px;height:40px;background:#ec1313;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">
          &#128202;
        </div>
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Relat&oacute;rio Di&aacute;rio CRM</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">${dateStr}</p>
        </div>
      </div>
      <p style="margin:16px 0 0;font-size:14px;color:#cbd5e1;">Funil - Incorporadoras Comercial</p>
    </div>

    <!-- Summary Cards -->
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      <div style="flex:1;min-width:140px;background:#121212;border-radius:12px;padding:20px;border:1px solid #27272a;">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Total Cards</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#ffffff;">${pipe.cards_count}</p>
      </div>
      <div style="flex:1;min-width:140px;background:#121212;border-radius:12px;padding:20px;border:1px solid #27272a;">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Movimentos Hoje</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#ec1313;">${movements.length}</p>
      </div>
      <div style="flex:1;min-width:140px;background:#121212;border-radius:12px;padding:20px;border:1px solid #27272a;">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Fases Ativas</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#10b981;">${phases.filter((p) => p.cards_count > 0).length}</p>
      </div>
    </div>

    <!-- Phases Overview -->
    <div style="background:#121212;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #27272a;">
      <h2 style="margin:0 0 20px;font-size:16px;font-weight:700;color:#ffffff;">&#128203; Fases do Funil</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #27272a;">
            <th style="text-align:left;padding:8px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Fase</th>
            <th style="text-align:right;padding:8px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Cards</th>
            <th style="text-align:right;padding:8px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">%</th>
          </tr>
        </thead>
        <tbody>
          ${phases
            .filter((p) => p.cards_count > 0)
            .sort((a, b) => b.cards_count - a.cards_count)
            .map(
              (p) => `
            <tr style="border-bottom:1px solid #1a1a1a;">
              <td style="padding:10px 12px;font-size:13px;color:#e2e8f0;">${p.name}</td>
              <td style="text-align:right;padding:10px 12px;font-size:13px;font-weight:600;color:#ffffff;">${p.cards_count}</td>
              <td style="text-align:right;padding:10px 12px;font-size:13px;color:#94a3b8;">${((p.cards_count / pipe.cards_count) * 100).toFixed(1)}%</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- Today's Movements -->
    <div style="background:#121212;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #27272a;">
      <h2 style="margin:0 0 20px;font-size:16px;font-weight:700;color:#ffffff;">&#128260; Movimenta&ccedil;&otilde;es de Hoje (${movements.length})</h2>
      ${
        movements.length === 0
          ? '<p style="color:#6b7280;font-size:14px;">Nenhuma movimenta&ccedil;&atilde;o registrada hoje.</p>'
          : movements
              .map(
                (m) => `
        <div style="padding:12px;background:#1a1a1a;border-radius:8px;margin-bottom:8px;border-left:3px solid #ec1313;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">${m.title}</p>
          <div style="display:flex;gap:16px;margin-top:6px;flex-wrap:wrap;">
            <span style="font-size:12px;color:#94a3b8;">&#128205; ${m.current_phase.name}</span>
            <span style="font-size:12px;color:#94a3b8;">&#128100; ${m.assignees.map((a) => a.name).join(", ") || "N&atilde;o atribu&iacute;do"}</span>
            <span style="font-size:12px;color:#6b7280;">&#9200; ${new Date(m.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      `
              )
              .join("")
      }
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:#4b5563;font-size:12px;">
      <p style="margin:0;">Relat&oacute;rio gerado automaticamente pelo Dashboard CRM DWV</p>
      <p style="margin:4px 0 0;">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    </div>
  </div>
</body>
</html>`;

    return Response.json({
      success: true,
      report: {
        to: REPORT_EMAIL,
        subject: `[CRM DWV] Relatório Diário - ${dateStr}`,
        html: emailHtml,
        movements: movements.length,
        totalCards: pipe.cards_count,
        date: dateStr,
      },
    });
  } catch (error) {
    console.error("Email report error:", error);
    return Response.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
