# Registro de Visitas — protótipo

Sistema mobile-first de check-in/check-out de visitas às imobiliárias por
geolocalização, com agenda de visitas programadas e lembretes por e-mail.

## Telas

| Rota              | O que faz                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| `/visitas`        | Mapa. Abre no GPS do executivo, mostra todas as imobiliárias com a data da última visita, cadastro por toque no mapa, check-in e check-out. |
| `/visitas/agenda` | Agenda das visitas programadas nas visões **dia / semana / mês** + configuração dos lembretes. |
| `/visitas/feed`   | Lista das imobiliárias com nº de visitas, datas, horários e motivos, e a importação de planilha. |

Navegação por barra inferior fixa nas três telas (badge = visitas programadas para hoje).

## Fluxos principais

**Endereço sem imobiliária cadastrada** → toca no mapa → pin cai no ponto (arrastável)
→ nome, responsável, telefone, e-mail (endereço vem preenchido por geocodificação reversa)
→ *Cadastrar e fazer check-in* → escolhe o motivo → confirma.

**Imobiliária já cadastrada** → toca no pin → *Fazer check-in* → motivo → confirma.

**Check-in** grava data/hora do sistema + coordenadas do GPS + distância em metros até o
pin da imobiliária (evidência de que a visita foi presencial). **Check-out** grava o horário
de saída e as coordenadas; um banner com cronômetro fica visível enquanto a visita está aberta.
Só uma visita fica aberta por vez.

**Agenda** → *Agendar visita* → escolhe imobiliária (ou cadastra uma nova ali mesmo,
marcando o pin no mapa) → data, hora, duração e motivo. Um agendamento vira visita
realizada automaticamente quando o check-in é feito a partir dele.

**Importar planilha** (Feed → *Importar*) → escolhe o .xlsx/.csv → confirma de qual
coluna vem cada campo (já vem preenchido pelo cabeçalho) → o sistema busca as
coordenadas de cada endereço → revisão linha a linha antes de gravar.

Cor do pin pela recência: verde ≤ 7 dias · amarelo 8–30 dias · vermelho > 30 dias ·
cinza nunca visitada · azul visita em andamento.

**Dados de demonstração** — com o mapa vazio aparece o botão *Carregar dados de
demonstração*: 16 imobiliárias geradas ao redor da posição atual (4 em dia, 5 em atenção,
4 frias, 3 nunca visitadas), 32 visitas com histórico e 12 visitas programadas espalhadas
entre hoje, a semana e o mês — o suficiente para as três telas ficarem realistas na hora
de mostrar o sistema.

## Importação de lista (Excel / CSV)

Como o sistema é baseado em mapa, toda imobiliária precisa de um pin — e a planilha
traz endereço, não coordenada. Por isso a importação tem uma etapa de
**geocodificação**: cada endereço vira lat/lng pelo Nominatim (OpenStreetMap).

Etapas: **arquivo → colunas → coordenadas → revisão**. Na revisão cada linha fica com
um status:

| Status | O que é | O que dá para fazer |
| --- | --- | --- |
| Pronta | endereço localizado | entra na importação |
| Sem localização | endereço não encontrado | *Marcar no mapa* (abre o seletor de pin) ou *Tentar de novo* |
| Já cadastrada | nome bate com uma imobiliária existente | vem desmarcada; dá para marcar e importar assim mesmo |
| Sem nome | linha sem o campo obrigatório | não entra |

Reconhece cabeçalhos em português por sinônimos ("Imobiliária", "Nome do contato",
"Celular"…) e aceita bairro/cidade/UF/CEP em colunas separadas — o que melhora
bastante o acerto da geocodificação. Aceita `.xlsx` e `.csv` (com `;` ou `,`).
O botão *Baixar modelo* gera um CSV de exemplo.

Leitura de `.xlsx` por `read-excel-file` (carregado sob demanda, fica fora do bundle
principal). `.xls` antigo não é suportado — a mensagem pede para salvar como `.xlsx`.

## Integração com o Google Agenda

Ao agendar, se a imobiliária tiver e-mail do responsável, aparece a opção
**Convidar o responsável**. O sistema envia um e-mail com anexo `.ics`
(`METHOD:REQUEST`) — é assim que o evento entra na agenda de quem recebe, com os
botões de confirmar, tanto no Google Agenda quanto no Outlook e no Apple Calendar.
O executivo entra como `ORGANIZER` (por isso o e-mail dele precisa estar configurado
em Lembretes) e recebe o mesmo convite.

- **Editar** o agendamento reenvia o convite atualizado (mesmo `UID`, o calendário
  atualiza o evento em vez de duplicar).
- **Cancelar** dispara um `METHOD:CANCEL`, que remove o evento da agenda de todos.
- O botão **Google Agenda** no detalhe abre o Google já preenchido — atalho para a
  agenda do próprio executivo, sem envolver e-mail.
- O `.ics` já leva dois alarmes: **2 dias antes** e **1 hora antes**.

**Por que não OAuth do Google:** a API do Calendar exigiria projeto no Google Cloud,
tela de consentimento e um token por executivo — e o protótipo ainda não tem login.
O convite por `.ics` entrega o mesmo resultado prático (o evento na agenda do
responsável) sem nada disso. Se depois for preciso ler/sincronizar a agenda nos dois
sentidos, aí sim vale o OAuth.

## Arquitetura

```
src/lib/visitas-types.ts          tipos, geo (Haversine, GPS), datas, calendário
src/lib/visitas-context.tsx       estado + persistência (localStorage) + sync com o servidor
src/lib/visitas-import.ts         leitura de xlsx/csv, detecção de colunas, geocodificação
src/lib/visitas-ics.ts            convite iCalendar + link do Google Agenda
src/lib/visitas-convite.ts        cliente do envio de convite
src/lib/visitas-email.ts          templates HTML + envio (SparkPost)
src/components/visitas/           MapaVisitas (Leaflet), sheets, seletor de local, nav, UI
src/app/visitas/                  mapa · agenda · feed
src/app/api/visitas/geocodificar  proxy do Nominatim (User-Agent + 1 req/s)
src/app/api/visitas/sync          espelha a agenda do executivo no Postgres
src/app/api/visitas/convite       envia o convite .ics (e o cancelamento)
src/app/api/visitas/lembretes     GET = cron · POST = envio manual/teste
```

Mapa em **Leaflet + tiles CARTO dark** (sem chave de API). Endereços por **Nominatim**
(OpenStreetMap) através de `/api/visitas/geocodificar` — o proxy existe porque a
política do Nominatim exige um User-Agent identificando a aplicação, e o navegador
não deixa definir esse cabeçalho. O proxy também serializa as chamadas em 1 por
segundo, como a política pede.

## Lembretes por e-mail

Configurados em **Agenda → sino**: nome, e-mail e os dois switches. Os disparos:

- **todo dia às 07:00 (BRT)** — visitas do dia
- **toda segunda às 07:30 (BRT)** — visitas da semana (segunda a domingo)
- **2 dias antes de cada visita** — aviso para o executivo e para o responsável da
  imobiliária (quando há e-mail no cadastro)

O aviso de 2 dias vai junto com a rodada diária das 07:00, e não em um cron próprio:
o plano Hobby da Vercel permite só 2 cron jobs, com um disparo por dia cada.

`vercel.json` registra os dois Cron Jobs em UTC (`0 10 * * *` e `30 10 * * 1`).

Como o protótipo guarda os dados no dispositivo, o app espelha a agenda no servidor
(`POST /api/visitas/sync`, debounce de 1,5s) na tabela `VisitaAgendaSnapshot` — é dela
que o cron lê para montar os e-mails.

### Para os e-mails funcionarem em produção

1. Criar a tabela (aditivo, não mexe nas tabelas existentes):
   ```bash
   npx prisma db push
   ```
2. Variáveis de ambiente na Vercel:
   - `SPARKPOST_API_KEY` — já usada pelo módulo de diagnóstico; vale também para os
     convites de agenda
   - `CRON_SECRET` — o `GET /api/visitas/lembretes` exige `Bearer $CRON_SECRET`
     em produção (a Vercel envia esse header automaticamente nos Cron Jobs)
   - `NOMINATIM_USER_AGENT` (opcional) — identificação da aplicação na busca de
     endereços; o padrão já é válido

O botão *Enviar agora (teste)* na tela de lembretes usa o `POST`, que monta o e-mail
com os dados enviados pelo próprio app — não depende da tabela nem do cron.

## Limites conhecidos do protótipo

- **Dados no `localStorage`** do dispositivo: não há login, e cada aparelho/navegador tem
  sua própria base. O gestor ainda não enxerga as visitas do time. Para virar produto:
  models `Imobiliaria`/`Visita`/`Agendamento` no Postgres + identidade do executivo.
- A geolocalização exige **HTTPS** (ou `localhost`). Sem permissão de GPS o check-in é
  registrado assim mesmo, mas sem coordenadas e sem a distância até o pin.
- O check-in não é bloqueado por distância — a distância é registrada como evidência.
  Se quiser exigir presença física, dá para barrar acima de X metros.
- Plano Hobby da Vercel permite 2 cron jobs, 1 disparo/dia — é exatamente o que o
  `vercel.json` usa.
- A geocodificação da importação leva ~1 segundo por linha (limite do Nominatim
  gratuito). Para listas grandes vale usar um serviço pago de geocodificação, que
  aceita lote.
- O convite de agenda é enviado por e-mail (`.ics`), não pela API do Google: o sistema
  não lê a agenda do executivo nem detecta conflitos de horário.
