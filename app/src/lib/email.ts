const FROM_NAME = "DWV Diagnóstico";
const FROM_EMAIL = "noreply@mail.dwvapp.com.br";
const BASE_URL = "https://dwv-diagnostico-comercial.vercel.app";
const SPARKPOST_ENDPOINT = "https://api.sparkpost.com/api/v1/transmissions";

async function sparkPost(html: string, subject: string, email: string, nome: string) {
  const res = await fetch(SPARKPOST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.SPARKPOST_API_KEY!,
    },
    body: JSON.stringify({
      recipients: [{ address: { email, name: nome } }],
      content: { from: { name: FROM_NAME, email: FROM_EMAIL }, subject, html },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SparkPost error: ${err}`);
  }
}

export async function sendInviteEmail({
  nome,
  email,
  senha,
}: {
  nome: string;
  email: string;
  senha: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#ec1313,#b00000);padding:32px 40px;text-align:center">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase">DWV OPERADORA</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800">Diagnóstico Comercial</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px">Olá,</p>
          <h2 style="margin:0 0 24px;color:#fff;font-size:20px;font-weight:700">${nome}</h2>

          <p style="margin:0 0 28px;color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7">
            Seu acesso ao sistema de Diagnóstico Comercial DWV foi criado. Use as credenciais abaixo para fazer login.
          </p>

          <!-- Credentials box -->
          <table width="100%" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:28px">
            <tr><td style="padding:20px 24px">
              <table width="100%">
                <tr>
                  <td style="padding:6px 0">
                    <span style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px">E-mail</span><br>
                    <span style="color:#fff;font-size:14px;font-weight:600">${email}</span>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:6px 0 0"></td></tr>
                <tr>
                  <td style="padding:6px 0">
                    <span style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px">Senha</span><br>
                    <span style="color:#ec1313;font-size:18px;font-weight:800;letter-spacing:2px;font-family:monospace">${senha}</span>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA -->
          <table width="100%"><tr><td align="center" style="padding-bottom:28px">
            <a href="${BASE_URL}/diagnostico" style="display:inline-block;background:linear-gradient(135deg,#ec1313,#b00000);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.5px">
              Acessar o Sistema →
            </a>
          </td></tr></table>

          <p style="margin:0;color:rgba(255,255,255,0.35);font-size:12px;line-height:1.7">
            Recomendamos alterar sua senha após o primeiro acesso.<br>
            Em caso de dúvidas, entre em contato com o administrador.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px">DWV Operadora · Diagnóstico Comercial</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sparkPost(html, "Seu acesso ao Diagnóstico Comercial DWV", email, nome);
}

export async function sendResetPasswordEmail({
  nome,
  email,
  token,
}: {
  nome: string;
  email: string;
  token: string;
}) {
  const resetUrl = `${BASE_URL}/diagnostico/nova-senha?token=${token}`;
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#ec1313,#b00000);padding:32px 40px;text-align:center">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase">DWV OPERADORA</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800">Recuperação de Senha</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px">Olá,</p>
          <h2 style="margin:0 0 24px;color:#fff;font-size:20px;font-weight:700">${nome}</h2>

          <p style="margin:0 0 28px;color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link é válido por <strong style="color:#fff">1 hora</strong>.
          </p>

          <!-- CTA -->
          <table width="100%"><tr><td align="center" style="padding-bottom:28px">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#ec1313,#b00000);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.5px">
              Redefinir Senha →
            </a>
          </td></tr></table>

          <p style="margin:0 0 16px;color:rgba(255,255,255,0.35);font-size:12px;line-height:1.7">
            Se você não solicitou a redefinição de senha, ignore este e-mail — sua senha permanece a mesma.
          </p>

          <!-- Token fallback -->
          <table width="100%" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
            <tr><td style="padding:16px 20px">
              <p style="margin:0 0 6px;color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px">Se o botão não funcionar, copie este link:</p>
              <p style="margin:0;color:#ec1313;font-size:12px;word-break:break-all">${resetUrl}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px">DWV Operadora · Diagnóstico Comercial</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sparkPost(html, "Redefinição de senha — DWV Diagnóstico", email, nome);
}
