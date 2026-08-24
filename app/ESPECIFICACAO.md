# Registro de Visitas — especificação funcional e técnica

Documento de referência para desenvolvimento. Descreve o comportamento esperado
do sistema, o modelo de dados, as regras de negócio e as integrações.

O protótipo funcional está em `src/app/visitas`, `src/components/visitas`,
`src/lib/visitas-*` e `src/app/api/visitas`.

---

## 1. Problema e escopo

O executivo de parcerias visita imobiliárias em campo. Hoje o registro dessas
visitas é manual e não comprovável: não há como saber se a visita aconteceu, por
quanto tempo, com que objetivo, nem quais imobiliárias estão sendo esquecidas.

O sistema resolve três coisas:

1. **Comprovar** a visita — data, hora e posição vêm do aparelho, não da digitação.
2. **Organizar** a rota — agenda de visitas programadas, com aviso ao responsável.
3. **Medir** — quantas visitas, quanto tempo, por qual motivo, e quem ficou de fora.

Usuário principal: o executivo, em campo, no celular. Usuário secundário (fase 2):
o gestor, acompanhando a equipe.

---

## 2. Modelo de dados

Quatro entidades. No protótipo vivem no `localStorage` sob a chave
`dwv_registro_visitas_v1`; em produção devem ir para banco relacional com
identidade por executivo.

### Imobiliaria

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | string | gerado |
| `nome` | string | **obrigatório** |
| `lat`, `lng` | number | **obrigatório** — sem coordenada não existe cadastro |
| `endereco` | string | texto livre; preenchido por geocodificação reversa |
| `responsavel.nome` | string | **obrigatório** |
| `responsavel.telefone` | string | máscara `(00) 00000-0000` |
| `responsavel.email` | string | validado quando preenchido; habilita convite de agenda |
| `criadaEm` | ISO 8601 | |

### Visita

Registro de uma visita efetivamente realizada.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | string | gerado |
| `imobiliariaId` | string | |
| `motivo` | string | **obrigatório**; vem da lista editável ou texto livre |
| `observacao` | string | opcional |
| `checkIn` | ISO 8601 | **relógio do sistema**, nunca digitado |
| `checkOut` | ISO 8601 \| null | null enquanto a visita está aberta |
| `coordsCheckIn` | `{lat, lng, precisao}` \| null | null se o GPS não estiver disponível |
| `coordsCheckOut` | `{lat, lng, precisao}` \| null | |
| `distanciaCheckIn` | number \| null | metros entre o GPS e o pin, calculado no check-in |

### Agendamento

Visita programada. Pode virar `Visita` quando o check-in é feito a partir dele.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | string | usado como `UID` do evento de calendário |
| `imobiliariaId` | string | |
| `motivo` | string | **obrigatório** |
| `observacao` | string | opcional |
| `inicio` | ISO 8601 | data e hora programadas |
| `duracaoMin` | number | 30 / 45 / 60 / 90 / 120 |
| `status` | enum | `programada` \| `realizada` \| `cancelada` |
| `visitaId` | string \| null | preenchido quando o check-in acontece |
| `criadoEm` | ISO 8601 | |

### Perfil e configuração

| Campo | Uso |
| --- | --- |
| `perfil.nome`, `perfil.email` | organizador dos convites e destinatário dos e-mails |
| `perfil.lembreteDiario` | liga o e-mail das 7h |
| `perfil.lembreteSemanal` | liga o e-mail de segunda 7h30 |
| `perfil.avisoDoisDias` | liga o aviso de 2 dias antes |
| `perfil.convidarResponsavel` | deixa o convite de agenda pré-marcado ao agendar |
| `motivos` | lista de motivos de visita, editável |

---

## 3. Regras de negócio

Estas são as regras que precisam ser preservadas em qualquer reimplementação.

**RN-01 — Uma visita aberta por vez.** Só pode existir uma `Visita` com
`checkOut === null`. Tentar iniciar outra deve levar ao check-out da atual, não
abrir uma segunda.

**RN-02 — Horário não é digitável.** `checkIn` e `checkOut` vêm do relógio do
sistema no instante da ação. Na edição de uma visita, motivo e observação são
alteráveis; data, hora e coordenadas não.

**RN-03 — Distância é evidência, não trava.** O check-in grava
`distanciaCheckIn` mas não é bloqueado por ela. Se a regra passar a exigir
presença física, o bloqueio entra aqui (sugestão: acima de 200 m pedir
confirmação; acima de 1 km barrar).

**RN-04 — Sem GPS o sistema continua utilizável.** Falha ou negativa de
permissão não pode impedir cadastro nem check-in. O pin é marcado tocando no
mapa e a visita é registrada sem coordenadas e sem distância.

**RN-05 — Toda imobiliária tem pin.** Não existe cadastro sem `lat`/`lng`. Vale
inclusive na importação de planilha: linha sem coordenada não entra.

**RN-06 — Proteção contra duplicata.** Um toque no mapa a menos de **45 metros**
de uma imobiliária existente abre o cadastro dela em vez de criar outro.

**RN-07 — Agendamento vira visita.** Check-in feito a partir de um agendamento
pré-preenche motivo e observação e marca o agendamento como `realizada`,
gravando `visitaId`. Excluir a visita devolve o agendamento para `programada`.

**RN-08 — Renomear motivo atualiza o histórico.** Ao renomear um motivo, todas
as visitas e agendamentos que usavam o nome antigo passam a usar o novo — senão
o relatório contaria o mesmo motivo em duas linhas. Remover um motivo da lista
**não** altera o histórico.

**RN-09 — Tempo só conta visita fechada.** Totais e médias de duração
consideram apenas visitas com `checkOut`. As abertas são contadas e sinalizadas
à parte.

**RN-10 — Contagem sempre visível.** Ao lado de todo nome de imobiliária, em
qualquer tela, aparece o total de visitas realizadas — inclusive quando é zero.

---

## 4. Telas

Barra de navegação fixa no rodapé, quatro abas. O contador na Agenda mostra as
visitas programadas para hoje.

### 4.1 Mapa (`/visitas`)

Tela de operação. Abre centralizada na posição atual; enquanto o GPS não
responde, usa um centro padrão.

- Cada imobiliária é um pin com rótulo: **nome + total de visitas + data da
  última visita**. Abaixo do zoom 14 os rótulos somem para não sobrepor.
- **Cor do pin pela recência** da última visita:

  | Cor | Estado | Critério |
  | --- | --- | --- |
  | Verde `#00c29f` | Em dia | ≤ 7 dias |
  | Amarelo `#ffc300` | Atenção | 8 a 30 dias |
  | Vermelho `#ec1313` | Fria | > 30 dias |
  | Cinza `#6b7280` | Sem visita | nunca visitada |
  | Azul `#3b82f6` | Em visita | check-in aberto (pulsa) |

- **Toque no mapa** → aplica RN-06; se livre, cai um pin arrastável e abre o
  cadastro.
- **Toque no pin** → ficha da imobiliária.
- **Botão "Nova imobiliária"** → usa a posição do GPS; sem GPS, usa o centro do
  mapa e avisa para arrastar o pin (RN-04).
- Enquanto há visita aberta, banner fixo com nome, motivo, **cronômetro ao vivo**
  e botão de check-out.

### 4.2 Agenda (`/visitas/agenda`)

- **Dia** — lista por horário com duração prevista.
- **Semana** — faixa dos 7 dias com marcadores de quantidade + lista agrupada.
- **Mês** — grade completa com marcadores e resumo (programadas / realizadas /
  canceladas).
- Navegação por período com botão "Hoje"; cabeçalho mostra quantidade e horas
  previstas.
- Agendamento com horário passado e sem check-in recebe o rótulo **atrasada**.

### 4.3 Feed (`/visitas/feed`)

- Busca por imobiliária, responsável, endereço ou motivo.
- Ordenações: visitadas por último · mais visitadas · **precisam de visita** ·
  nome A–Z.
- Card expansível com o histórico completo: data, entrada, saída, duração,
  motivo, observações e distância registrada. Cada item permite corrigir motivo
  e observação (RN-02).
- Atalhos para WhatsApp e para ver no mapa.

### 4.4 Relatório (`/visitas/relatorio`)

Período por atalho (7 dias, 30 dias, mês atual, mês passado, tudo) ou datas de
início e fim.

- **Indicadores**: visitas realizadas (e média por dia), imobiliárias visitadas
  (sobre o total da carteira), tempo total em visita, duração média.
- **Visitas por dia** — barras do período, com o pico.
- **Motivos** — quantidade, percentual e duração média por motivo.
- **Situação da carteira** — quantas em cada estado da tabela de cores, hoje.
- **Agenda no período** — programadas, realizadas, canceladas e % de cumprimento.
- **Mais visitadas** (top 10) e **ainda sem nenhuma visita**.

---

## 5. Fluxos

### 5.1 Cadastro

Três entradas: toque no mapa, botão de posição atual, importação de planilha.

O formulário pede nome e responsável (obrigatórios), telefone, e-mail e
endereço. O **endereço é preenchido automaticamente** por geocodificação reversa
a partir do pin, e continua editável. Ao salvar: "Cadastrar e fazer check-in" ou
"Apenas cadastrar".

### 5.2 Check-in / check-out

```
abrir ficha → check-in
  ├─ lê GPS (best-effort, timeout 12s)
  ├─ exibe precisão e distância até o pin
  ├─ escolhe motivo (lista editável ou texto livre)
  ├─ observação opcional
  └─ confirma → grava Visita (RN-01, RN-02, RN-03)

banner com cronômetro
  └─ check-out → lê GPS → grava checkOut e coordsCheckOut
```

### 5.3 Agendamento

Escolhe imobiliária (com busca) ou cadastra uma nova ali mesmo — abre o mapa em
tela cheia para marcar o pin e volta ao agendamento já com ela selecionada.
Define data, hora, duração e motivo. Se a imobiliária tiver e-mail do
responsável, aparece a opção de enviar convite de agenda.

### 5.4 Importação de planilha

Quatro etapas: **arquivo → colunas → coordenadas → revisão**.

Aceita `.xlsx` e `.csv` (delimitador `;` ou `,`). O cabeçalho é reconhecido por
sinônimos em português; bairro, cidade, UF e CEP em colunas separadas melhoram a
geocodificação. Status por linha na revisão:

| Status | Significado | Ação disponível |
| --- | --- | --- |
| Pronta | endereço localizado | entra na importação |
| Sem localização | não encontrado | marcar no mapa à mão ou tentar de novo |
| Já cadastrada | nome coincide | vem desmarcada; pode importar mesmo assim |
| Sem nome | falta campo obrigatório | não entra |

---

## 6. Integrações

### 6.1 Geolocalização e endereços

- **Posição do aparelho**: `navigator.geolocation`, `enableHighAccuracy`,
  timeout 12s. Exige HTTPS (ou `localhost`).
- **Endereços**: Nominatim / OpenStreetMap, nos dois sentidos.
- **Obrigatório passar por proxy do servidor** (`/api/visitas/geocodificar`): a
  política do Nominatim exige um `User-Agent` identificando a aplicação, e o
  navegador não permite definir esse cabeçalho — requisições diretas do browser
  retornam **403**. O proxy também serializa as chamadas em 1 por segundo,
  conforme a política.
- Para volume maior (importação de listas grandes), trocar por serviço pago de
  geocodificação com suporte a lote.

### 6.2 Convite de agenda

Ao agendar com e-mail do responsável preenchido, o sistema envia um e-mail com
anexo `.ics` (`METHOD:REQUEST`). É isso que faz o evento entrar na agenda de quem
recebe, com botões de confirmação — Google, Outlook e Apple.

- `ORGANIZER` = executivo (por isso o e-mail dele precisa estar configurado).
- `ATTENDEE` = responsável, com `RSVP=TRUE`.
- `UID` = id do agendamento. Editar reenvia com o mesmo UID e **atualiza** o
  evento; cancelar envia `METHOD:CANCEL` e remove da agenda de todos.
- Dois alarmes: `-P2D` e `-PT1H`.
- **Atenção ao implementar**: o RFC 5545 limita a linha a **75 octetos**, não 75
  caracteres. Com acentuação um caractere ocupa 2 bytes — dobrar por caractere
  gera arquivo inválido para alguns clientes.

Não foi usado OAuth do Google Calendar: exigiria projeto no Google Cloud, tela de
consentimento e um token por executivo. O `.ics` entrega o mesmo resultado
prático. O OAuth só se justifica quando for preciso **ler** a agenda (detectar
conflito de horário) ou sincronizar nos dois sentidos.

### 6.3 E-mails automáticos

| Quando | Conteúdo | Destinatário |
| --- | --- | --- |
| Todo dia 07:00 (BRT) | visitas do dia | executivo |
| Toda segunda 07:30 (BRT) | visitas da semana (seg–dom) | executivo |
| 2 dias antes de cada visita | lembrete da visita | executivo e responsável |

O aviso de 2 dias roda **dentro da rodada diária**, não em cron próprio: o plano
Hobby da Vercel permite apenas 2 cron jobs, com um disparo por dia cada.

Os crons rodam em UTC (`0 10 * * *` e `30 10 * * 1` = 07:00 e 07:30 BRT). O fuso
do Brasil é fixo em `-03:00` desde 2019.

---

## 7. Endpoints

| Rota | Método | Função |
| --- | --- | --- |
| `/api/visitas/geocodificar` | GET | `?q=` endereço → coordenada; `?lat=&lng=` → endereço |
| `/api/visitas/convite` | POST | envia convite `.ics` (ou cancelamento) |
| `/api/visitas/lembretes` | GET | disparo automático (cron); exige `Bearer $CRON_SECRET` |
| `/api/visitas/lembretes` | POST | envio manual/teste com dados do app |
| `/api/visitas/sync` | POST | espelha a agenda no servidor para os crons lerem |

O `sync` existe apenas porque o protótipo guarda os dados no aparelho e o cron
roda no servidor. **Com banco central esse endpoint deixa de existir** — o cron
lê direto das tabelas.

---

## 8. Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `SPARKPOST_API_KEY` | envio de e-mails e convites |
| `CRON_SECRET` | autentica o disparo dos cron jobs (obrigatório em produção) |
| `DATABASE_URL` | Postgres (Prisma) |
| `NOMINATIM_USER_AGENT` | identificação da aplicação na busca de endereços (opcional) |

O build **não** depende de nenhuma delas — o cliente Prisma é carregado dentro
dos handlers, não no topo do módulo, justamente para isso.

---

## 9. Decisões de implementação que valem manter

- **Leaflet + OpenStreetMap/CARTO** em vez de Google Maps: sem chave de API e sem
  custo por uso. Se for preciso Street View ou Places, aí o Google se paga.
- **Pins com `divIcon`** em vez das imagens padrão do Leaflet: evita o problema
  clássico de caminho de ícone quebrado em bundler e permite estilizar por CSS.
- **Marcadores só são adicionados depois que o mapa termina de inicializar.** O
  Leaflet entra por import dinâmico; adicionar antes faz os pins sumirem numa
  carga limpa. O mesmo vale para o `flyTo` de deep link — o destino precisa ficar
  enfileirado até o mapa existir.
- **Estado derivado, não duplicado**: status da imobiliária, contagem de visitas
  e "próxima visita programada" são calculados a partir de `visitas` e
  `agendamentos`. Nada disso é campo persistido.

---

## 10. O que falta para produção

1. **Autenticação e base central.** Hoje os dados ficam no dispositivo: cada
   executivo tem a própria base e o gestor não enxerga a equipe. É o próximo
   passo obrigatório — tabelas `Imobiliaria`, `Visita`, `Agendamento` com
   `executivoId`, e o `sync` some.
2. **Painel do gestor.** Com base central: cobertura da carteira por executivo,
   frequência por região, ranking, imobiliárias sem visita há X dias.
3. **Regra de distância.** Definir se o check-in trava por distância (RN-03).
4. **Foto ou assinatura na visita** — se for preciso reforçar a comprovação.
5. **Modo offline real.** Hoje o app funciona sem GPS, mas depende de rede para
   carregar os tiles do mapa e geocodificar. Fila de sincronização e cache de
   tiles resolveriam o uso em área sem sinal.
6. **Geocodificação em lote** para importações grandes.
