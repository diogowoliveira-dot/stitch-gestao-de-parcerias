# Diagnóstico Comercial DWV — Documentação Completa

## O que é

O Diagnóstico Comercial DWV é um sistema de avaliação aplicado por consultores da DWV Operadora em incorporadoras imobiliárias interessadas nos serviços da DWV. Ele mapeia a situação atual do **canal de parcerias** da incorporadora — ou seja, a estrutura que gerencia corretores de imóveis externos que vendem os imóveis dessa incorporadora.

O diagnóstico é feito pelo consultor DWV durante ou após uma reunião com o responsável da incorporadora. Dura em média 15–25 minutos e gera um relatório automático com métricas, análise e projeção de ROI.

---

## Para que serve

- Identificar o nível de engajamento dos corretores da base
- Calcular quantos corretores precisam ser ativados para atingir a meta de VGV
- Apresentar as 3 rotas estratégicas para atingir essa meta
- Mostrar o organograma do canal de parcerias (atual vs. com DWV)
- Calcular o ROI de contratar a DWV (quantos corretores precisam ser ativados para o plano se pagar)
- Mapear ferramentas em uso, desafios e oportunidades do canal
- Registrar todas as informações para análise de BI agregado

---

## Quem usa

| Perfil | Acesso |
|--------|--------|
| Consultor DWV | Aplica o diagnóstico, visualiza o relatório, exporta PDF e copia para o Pipefy |
| Admin DWV | Tudo acima + gestão de usuários + acesso ao BI |
| Master DWV | Acesso total + BI com dados de todas as incorporadoras |

---

## Fluxo do sistema

```
Login → Dashboard → Iniciar Diagnóstico → 6 etapas de coleta → Relatório automático → Exportar
                                                                                       ↓
                                                                              Salvo no banco (Postgres/Neon)
                                                                              Disponível no BI
```

---

## Informações coletadas — as 6 etapas do formulário

### Etapa 1 — Dados da Incorporadora
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome da incorporadora | Texto | Nome da empresa |
| Responsável | Texto | Nome da pessoa que está sendo entrevistada |
| Cargo do responsável | Texto | Ex: Diretor de Parcerias |
| Cidade | Texto | Cidade sede |
| Estado | Select | UF (todos os estados brasileiros) |

---

### Etapa 2 — Histórico de Vendas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| VGV vendido nos últimos 12 meses (R$) | Valor | Total de vendas pelo canal de parcerias |
| Meta de VGV (R$) | Valor | Meta de vendas para os próximos 12 meses |
| Ticket médio por unidade (R$) | Valor | Usado para calcular unidades necessárias |
| Empreendimentos ativos | Número | Total de empreendimentos com unidades disponíveis |
| Pré-lançamento | Número | Empreendimentos em fase de tabela zero |
| Lançamentos | Número | Empreendimentos em fase de lançamento |
| Estoque | Número | Empreendimentos em fase de estoque |
| Foco de vendas atual | Select | Pré-lançamento / Lançamentos / Estoque / Todos |
| Total de imóveis à venda | Número | Quantidade total de unidades disponíveis |
| Propostas recebidas por mês | Número | Volume de propostas mensais |
| Fechamentos por mês | Número | Volume de vendas fechadas mensais |

---

### Etapa 3 — Estrutura Comercial
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Total de corretores na base | Número | Todos os corretores cadastrados |
| Corretores que venderam nos últimos 12m | Número | Corretores ativos (engajados) |
| Modelo de exclusividade | Select | Exclusivos / Não exclusivos / Misto |
| Canal House | Checkbox | Possui equipe interna de vendas |
| Canal Parcerias | Checkbox | Possui canal de corretores externos |
| Imobiliárias parceiras | Checkbox | Trabalha com imobiliárias |
| Número de imobiliárias | Número | Quantidade de imobiliárias parceiras |
| % VGV House | Número | Percentual das vendas feito pela equipe interna |
| % VGV Parcerias | Número | Percentual das vendas feito pelo canal externo |
| **Organograma do canal** | | |
| → Diretor de Parceria | Checkbox + detalhes | Existe? Qtd, KPI, atividades |
| → Gerente de Parceria | Checkbox + detalhes | Existe? Qtd, KPI, atividades |
| → Marketing | Checkbox + detalhes | Existe? Qtd, KPI, atividades |
| → Executivo de Parceria | Checkbox + detalhes | Existe? Qtd, KPI, atividades |

Para cada cargo existente: quantidade de pessoas, KPI principal e descrição das atividades (campo aberto, analisado por IA).

---

### Etapa 4 — Tecnologia e Ferramentas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Usa CRM de parceiros? | Radio Sim/Não | CRM voltado para gestão de corretores |
| Qual CRM | Texto | Nome do CRM se houver |
| **Ferramentas em uso** (checkbox + custo mensal) | | |
| → WhatsApp pessoal / grupos | Checkbox + R$/mês | Sem API, sem rastreio |
| → WhatsApp Business sem API | Checkbox + R$/mês | Risco de banimento |
| → E-mail marketing | Checkbox + R$/mês | |
| → Drive | Checkbox + R$/mês | |
| → Intranet / portal próprio | Checkbox + R$/mês | |
| → Planilhas Excel/Google Sheets | Checkbox + R$/mês | |
| → CRM focado em contratos | Checkbox + R$/mês + qual | Ex: Salesforce, HubSpot |
| → Orulo | Checkbox + R$/mês | Marketplace de imóveis |
| → Zé | Checkbox + R$/mês | Plataforma de corretores |
| → Ferramentas de disparo de WhatsApp | Checkbox + R$/mês | |
| → Anapro | Checkbox + R$/mês | CRM imobiliário |
| → Hypnobox | Checkbox + R$/mês | |
| → Facilita | Checkbox + R$/mês | |

---

### Etapa 5 — Dores e Desafios
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Batendo metas de VGV? | Radio | Sim / Parcialmente / Não |
| **Principais desafios** (múltipla escolha) | Checkboxes | |
| → Baixo engajamento de corretores | | |
| → Relatórios dos executivos de parceria | | |
| → Falta de gestão dos executivos | | |
| → Construir e treinar time de parcerias | | |
| → Alta demanda de solicitações dos corretores | | |
| → Falta de capacitação dos corretores | | |
| → Concorrência com outras incorporadoras | | |
| → Corretores não conhecem o produto | | |
| → Histórico perdido quando executivo sai | | |
| Segmentação da base | Radio | Não / Não mas gostaria / Sim parcial / Sim total |
| Como segmenta | Textarea | Descritivo (analisado por IA no BI) |
| **Relatórios desejados** (múltipla escolha) | Checkboxes | |
| → Quais corretores estão engajados | | |
| → Quais imobiliárias estão ofertando | | |
| → Impacto do executivo de parceria | | |
| Outros relatórios | Textarea | Campo aberto |
| Descrição dos obstáculos | Textarea | Campo aberto livre |
| Já testou ações de engajamento? | Radio Sim/Não | |
| Quais foram os resultados | Textarea | Se sim |
| Realiza eventos/treinamentos? | Radio | Sim frequente / Sim esporádico / Não |
| Programa de incentivo/comissionamento | Radio Sim/Não | |
| Principal concorrente na região | Textarea | Descrição livre |
| Expectativa com a DWV em 12 meses | Textarea | Descrição livre |

---

### Etapa 6 — Tabela Zero e Observações
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Trabalha com Tabela Zero? | Radio Sim/Não | Acesso antecipado ao produto (pré-lançamento) |
| Quem tem acesso à Tabela Zero | Checkboxes | Canal House / Canal Parcerias / Imobiliárias / Todos |
| Observações sobre a Tabela Zero | Textarea | Regras de acesso |

---

## O que é calculado automaticamente (Fórmula de Aceleração DWV)

Com os dados coletados, o sistema calcula:

### TE — Taxa de Engajamento
```
TE = (corretores ativos / total de corretores) × 100
```
- **< 15%** → Crítica (vermelho)
- **15–30%** → Regular (amarelo)
- **> 30%** → Boa (verde)

**O que significa:** qual percentual da base de corretores cadastrados realmente vendeu nos últimos 12 meses.

---

### DC — Delta de Corretores por Milhão
```
DC = corretores ativos / (VGV atual / 1.000.000)
```
**O que significa:** quantos corretores ativos são necessários para gerar R$ 1 milhão em VGV. Mede a produtividade do corretor.

---

### NC — Corretores Necessários para a Meta
```
NC = (Meta de VGV / 1.000.000) × DC
```
**O que significa:** quantos corretores precisam estar ativos para atingir a meta. A diferença entre NC e os ativos atuais é a **meta de ativação da DWV**.

---

### 3 Rotas Estratégicas

Com base nesses números, o sistema apresenta 3 caminhos para atingir a meta:

| Rota | Nome | O que mede |
|------|------|------------|
| A | Aumentar Engajamento | Nova TE necessária mantendo a base atual |
| B | Crescer a Base | Total de corretores necessários mantendo a TE atual |
| C | Aumentar Produtividade | DC necessário com base e TE atuais |

---

### Indicadores Operacionais calculados

| Indicador | Fórmula |
|-----------|---------|
| VGV por corretor ativo | VGV atual / ativos |
| Corretores a ativar | NC − ativos atuais |
| Corretores por executivo | Total corretores / nº executivos |
| Ociosidade da base | 100% − TE |
| Custo por corretor ativo | Custo anual ferramentas / ativos |
| Custo por corretor ativo (meta DWV) | Custo anual ferramentas / NC |
| Redução de custo com DWV | % de redução do custo por ativo ao atingir NC |
| Unidades necessárias para meta | Gap de VGV / Ticket médio |
| Taxa de conversão proposta→venda | Fechamentos / Propostas × 100 |
| Corretores mínimos para pagar o plano DWV | R$ 63.096,20 / VGV por corretor |
| Retorno potencial total | Corretores a ativar × VGV por corretor |

---

## O relatório — 9 seções de output

### Seção 1 — Taxa de Engajamento (TE)
Fórmula, classificação (crítica/regular/boa) e interpretação textual do nível de engajamento atual.

### Seção 2 — Delta de Corretores por Milhão (DC)
Fórmula e interpretação: qual o valor médio gerado por cada corretor ativo.

### Seção 3 — Corretores Necessários para a Meta (NC)
Fórmula e quantidade de corretores que precisam ser ativados para fechar o gap de VGV.

### Seção 4 — 3 Rotas Estratégicas
Cards com as 3 rotas (A: engajamento, B: base, C: produtividade) e como a DWV atua em cada uma.

### Seção 5 — Organograma e Fluxos do Canal de Parcerias
- Organograma atual (cargos existentes com KPIs)
- Fluxo atual "canal cego" (captação → resultado, todos os passos com problema)
- Organograma com DWV (como a operadora se posiciona lateralmente)
- Fluxo com DWV (captação rastreada → BI completo)
- Entregas DWV por nível hierárquico (Direção, Gerência, Executivos)
- Segmentação da base: Bronze / Prata / Ouro

### Seção 6 — Tecnologia e Ferramentas
- Ferramentas em uso com seus custos
- Custo anual total com ferramentas fragmentadas
- Diagnóstico: "X ferramentas desconectadas substituídas pela DWV"

### Seção 7 — Indicadores Operacionais
- Grid de cards: corretores/executivo, custo/ativo, ociosidade, unidades para meta, empreendimentos, imóveis à venda, propostas/mês, taxa de conversão, eventos/treinamentos
- Projeção de redução de custo por ativo ao atingir a meta com DWV
- Programa de incentivo, principal concorrente, expectativa em 12 meses

### Seção 8 — ROI (Retorno sobre Investimento)
- Plano DWV: R$ 63.096,20/ano (12x R$ 4.774,60/mês)
- VGV por corretor ativado
- Quantos corretores mínimos para pagar o plano
- Meta de ativações e retorno potencial total
- Economia com consolidação de ferramentas (se aplicável)
- Relatórios desejados confirmando que estão todos disponíveis na DWV
- Tabela Zero: como a DWV potencializa corretores Ouro

### Seção 9 — Dores, Segmentação e Relatórios
- Badges com os principais desafios selecionados + descrição livre do cliente
- Status de segmentação da base (não segmenta / parcial / total) com descritivo
- Lista de relatórios mais desejados com confirmação de disponibilidade na DWV
- Ações já testadas e seus resultados

---

## Exportações disponíveis

| Exportação | Conteúdo |
|------------|----------|
| **PDF** | Relatório completo formatado com todas as 9 seções, organograma, métricas e ROI |
| **Copiar para Pipefy** | Texto estruturado com todos os dados para colar no card do Pipefy (CRM de vendas DWV) |

---

## Armazenamento

- Banco de dados: **PostgreSQL no Neon** (cloud)
- Cada diagnóstico salvo inclui: dados da empresa, cargos, ferramentas, problemas identificados, data de criação, usuário que criou, flag de simulação
- Diagnósticos marcados como **simulação** (`isSimulacao: true`) ficam separados dos diagnósticos reais no dashboard

---

## BI Agregado

Administradores têm acesso a um painel de BI com dados consolidados de todas as incorporadoras diagnosticadas:

- TE média da base
- DC médio
- % com Tabela Zero
- % com CRM de parceiros
- % com Canal House
- Gap total de VGV da carteira
- Ferramentas mais utilizadas (ranking)
- Principais desafios declarados (ranking)
- Segmentação de corretores por status
- Distribuição de acesso à Tabela Zero
- Filtros por estado e período

---

## Plano DWV Operadora

| | Valor |
|-|-------|
| Anual | R$ 63.096,20 |
| Mensal | R$ 4.774,60/mês |

O plano é usado no cálculo de ROI: o sistema calcula automaticamente quantos corretores precisam ser ativados para que o valor do plano anual seja coberto pelo VGV gerado.

---

## Resumo — o que o diagnóstico entrega

O Diagnóstico Comercial DWV responde a uma pergunta central para a incorporadora:

> **"Quantos corretores da minha base estão engajados, quantos precisam ser ativados para eu atingir minha meta de VGV, e qual o retorno de contratar a DWV para fazer isso?"**

A DWV Operadora é uma empresa que gerencia o canal de parcerias de incorporadoras imobiliárias — ela não é uma imobiliária nem uma construtora. Ela atua **lateralmente** com a equipe da incorporadora, entregando:
- CRM de parceiros integrado com WhatsApp API
- Segmentação automática da base (Bronze/Prata/Ouro)
- BI completo para executivos, gerentes e diretores
- Campanhas de ativação e captação de corretores
- Relatórios de performance em tempo real

O diagnóstico é a ferramenta de venda e mapeamento que valida a necessidade do cliente e quantifica o valor da solução.
