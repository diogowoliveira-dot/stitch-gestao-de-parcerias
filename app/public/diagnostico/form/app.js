// ── CONSTANTS ─────────────────────────────────────────────────
const STEPS=[
  {tag:'Etapa 1 de 6',title:'Dados da Incorporadora',desc:'Empresa, responsável e localização.'},
  {tag:'Etapa 2 de 6',title:'Histórico de Vendas',desc:'VGV realizado e metas de crescimento.'},
  {tag:'Etapa 3 de 6',title:'Estrutura Comercial',desc:'Canais, equipe e organograma atual.'},
  {tag:'Etapa 4 de 6',title:'Tecnologia e Ferramentas',desc:'Ferramentas em uso no canal de parceiros e seus custos.'},
  {tag:'Etapa 5 de 6',title:'Dores e Desafios',desc:'Obstáculos no canal de parcerias.'},
  {tag:'Etapa 6 de 6',title:'Tabela Zero e Observações',desc:'Pré-lançamento e contexto adicional.'}
];
const CHAL_LABELS={
  engagement:'Baixo engajamento de corretores',
  exec_reports:'Relatórios dos executivos de parceria',
  exec_mgmt:'Falta de gestão dos executivos de parceria',
  build_team:'Construir e treinar time de parcerias',
  high_demand:'Alta demanda de solicitações dos corretores',
  training:'Falta de capacitação dos corretores',
  competition:'Concorrência com outras incorporadoras',
  product:'Corretores não conhecem o produto',
  data_loss:'Histórico perdido quando executivo sai'
};
const RPT_LABELS={
  corretores_engajados:'Quais e quantos corretores estão engajados nos meus produtos',
  imob_ofertando:'Quais e quantas imobiliárias estão ofertando meu produto',
  impacto_exec:'Quantos corretores o executivo de parceria impacta diariamente/semanalmente e mensalmente'
};
const TZ_LABELS={
  house:'Canal House',
  canal_parcerias:'Canal Parcerias',
  imobiliarias:'Imobiliárias parceiras selecionadas',
  todos:'Todos ao mesmo tempo'
};
const TOOLS_DEF=[
  {k:'toolsWhatsapp',   l:'WhatsApp pessoal / grupos avulsos',      hint:'Sem API, sem rastreamento de leitura'},
  {k:'toolsWhatsappBiz',l:'WhatsApp Business sem API oficial',       hint:'Risco de banimento do número'},
  {k:'toolsEmail',      l:'E-mail marketing',                        hint:'Sem taxa de abertura rastreada'},
  {k:'toolsDrive',      l:'Drive',                                   hint:'Sem rastreamento de acesso por corretor'},
  {k:'toolsIntranet',   l:'Intranet / portal próprio',               hint:'Sem monitoramento de acesso individual'},
  {k:'toolsExcel',      l:'Planilhas Excel / Google Sheets',         hint:'Sem visão consolidada de carteira'},
  {k:'toolsOfficialCRM',l:'CRM focado em contratos',                hint:'Não gerencia relacionamento com corretores',askWhich:true},
  {k:'toolsOrulo',      l:'Orulo',                                   hint:'Marketplace de imóveis'},
  {k:'toolsZe',         l:'Zé',                                      hint:'Plataforma de corretores'},
  {k:'toolsDisparos',   l:'Ferramentas de disparos de WhatsApp',     hint:'Disparos em massa via WhatsApp'},
  {k:'toolsAnapro',     l:'Anapro',                                  hint:'CRM imobiliário'},
  {k:'toolsHypnobox',   l:'Hypnobox',                                hint:'Atendimento digital'},
  {k:'toolsFacilita',   l:'Facilita',                                hint:'Gestão de vendas imobiliárias'}
];

// Plano Operadora DWV
const PLANO_ANUAL  = 63096.20;
const PLANO_MENSAL = 4774.60;

// ── AUTH & SESSION ────────────────────────────────────────────
function getUser(){
  try{
    const raw=localStorage.getItem('diagUser');
    if(!raw) return null;
    const parsed=JSON.parse(raw);
    if(parsed._expiresAt && Date.now() > parsed._expiresAt){
      localStorage.removeItem('diagUser');
      return null;
    }
    const {_expiresAt:_, ...userData}=parsed;
    return userData;
  }catch{return null;}
}
function checkAuth(){
  const u=getUser();
  if(!u){window.location.href='/diagnostico';return false;}
  return u;
}

// ── STORAGE (API-backed) ─────────────────────────────────────
let _dbCache=null;
async function loadDB(){
  if(_dbCache) return _dbCache;
  try{
    const res=await fetch('/api/diagnostico/diagnosticos');
    if(!res.ok) return [];
    const data=await res.json();
    _dbCache=data.map(mapAPItoV1);
    return _dbCache;
  }catch{return [];}
}
function loadDBSync(){return _dbCache||[];}

async function addToDB(record, idOverride){
  const user=getUser();
  if(!user) return null;
  const payload=mapV1toAPI(record, user);
  try{
    let res;
    if(idOverride){
      // Edição — PUT com id
      res=await fetch('/api/diagnostico/diagnosticos',{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:idOverride, ...payload})
      });
      if(res.ok){ _dbCache=null; return idOverride; }
    } else {
      // Criação — POST
      res=await fetch('/api/diagnostico/diagnosticos',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      if(res.ok){
        _dbCache=null;
        const data=await res.json();
        return data.id||null;
      }
    }
  }catch(e){console.error('Erro ao salvar:',e);}
  return null;
}

function mapV1toAPI(d, user){
  let cidade=d.cidade||'', estado=d.estado||'';
  if(!cidade && d.location){
    const parts=d.location.split(/[,\/]/);
    cidade=(parts[0]||'').trim();
    estado=(parts[1]||'').trim();
  }
  const cargosPayload=CARGOS_CANAL.filter(c=>d.cargos?.[c.id]?.existe).map(c=>{
    const cargoData=d.cargos[c.id];
    return {
      id:'cargo_'+c.id,
      nome:c.nome,
      existe:true,
      tarefas:[],metricas:[],ferramentas:[],
      subordinadosDe: c.id==='executivo'?'cargo_gerente':c.id==='gerente'?'cargo_diretor':null,
      subordinados: c.id==='diretor'?['cargo_gerente']:c.id==='gerente'?['cargo_executivo']:c.id==='marketing'?[]:null,
      quantidade:cargoData.qtd||1,
      kpiPrincipal:cargoData.kpi?[cargoData.kpi]:[],
      atividadesDescritivas:cargoData.atividades||'',
      crmNome: d.hasCRM?(d.crmName||null):null
    };
  });
  // Ferramentas ativas (keys) e custos
  const ferramentasAtivas=TOOLS_DEF.filter(t=>d[t.k]).map(t=>t.k);
  const custosFerramentas={};
  TOOLS_DEF.forEach(t=>{ if(d.toolCosts?.[t.k]) custosFerramentas[t.k]=d.toolCosts[t.k]; });

  return {
    empresa:{nome:d.companyName||'', cidade, estado},
    criadoPor: user.id,
    status:'completo',
    isSimulacao: d.isSim||false,

    // Responsável
    responsavelNome: d.responsibleName||null,
    responsavelCargo: d.responsibleRole||null,

    // Métricas
    totalVGV: d.totalVGV??null,
    vgvGoal: d.vgvGoal??null,
    avgTicket: d.avgTicket??null,
    totalBrokers: d.totalBrokers??null,
    activeBrokers: d.activeBrokers??null,

    // Canais
    shareHouse: d.shareHouse??null,
    shareParcerias: d.shareParcerias??null,
    numImobiliarias: d.numImobiliarias??null,
    hasHouse: d.hasHouse||false,
    hasParc: d.hasParc||false,
    hasImob: d.hasImob||false,
    exclusividade: d.brokersExclusivity||null,

    // Inventário
    numEmpreendimentos: d.numEmpreendimentos??null,
    numPreLancamento: d.numPreLancamento??null,
    numLancamento: d.numLancamento??null,
    numEstoque: d.numEstoque??null,
    focoVendas: d.focoVendas||null,
    totalImoveisVenda: d.totalImoveisVenda??null,
    propostasMensais: d.propostasMensais??null,
    fechamentosMensais: d.fechamentosMensais??null,

    // Tecnologia
    temCRM: d.hasCRM||false,
    crmNome: d.crmName||null,
    crmContratoNome: d.crmContratoNome||null,
    ferramentasAtivas,
    custosFerramentas,

    // Segmentação e relatórios
    segmentacao: d.brokerSegmentation||null,
    segmentacaoDescritiva: d.brokerSegDescritivo||null,
    relatoriosDesejados: d.desiredReports||[],
    relatoriosDescritivo: d.desiredReportsDescritivo||null,

    // Dores
    atingiuMetas: d.meetingGoals||null,
    desafiosKeys: d.challenges||[],
    desafiosTexto: d.challengesText||null,
    acoesTestadas: d.testedActions||false,
    resultadosTestados: d.testedResults||null,

    // Contexto estratégico
    temEventos: d.hasEventos||null,
    temIncentivo: d.hasIncentivo||null,
    concorrente: d.concorrente||null,
    expectativa12m: d.expectativa12m||null,

    // Tabela Zero
    tabelaZeroParcerias: d.tabelaZero||false,
    tabelaZeroAcesso: d.tabelaZeroAccess||[],
    tabelaZeroObs: d.tabelaZeroObs||null,

    // Observações gerais
    observacoesGerais: d.observations||null,

    // Cargos e ferramentas gerais (para compatibilidade/relatório)
    cargos: cargosPayload,
    ferramentasGerais: ferramentasAtivas,
    problemasIdentificados: (d.challenges||[]).map(k=>CHAL_LABELS[k]||k),
  };
}

function mapAPItoV1(rec){
  // Reconstruir objeto D completo a partir do registro da API
  const gerCargo=rec.cargos?.find(c=>c.id?.includes('gerente'));
  const execCargo=rec.cargos?.find(c=>c.id?.includes('executivo'));
  const dirCargo=rec.cargos?.find(c=>c.id?.includes('diretor'));
  const mktCargo=rec.cargos?.find(c=>c.id?.includes('marketing'));

  // Reconstruir D.cargos a partir dos cargos salvos
  const cargos={};
  CARGOS_CANAL.forEach(c=>{
    const saved=rec.cargos?.find(x=>x.id==='cargo_'+c.id);
    cargos[c.id]={
      existe: !!saved,
      qtd: saved?.quantidade||1,
      kpi: saved?.kpiPrincipal?.[0]||'',
      atividades: saved?.atividadesDescritivas||''
    };
  });

  // Reconstruir ferramentas ativas como flags booleanas no D
  const ferrFlags={};
  TOOLS_DEF.forEach(t=>{ ferrFlags[t.k]=false; });
  (rec.ferramentasAtivas||[]).forEach(k=>{ ferrFlags[k]=true; });

  return {
    id: rec.id,
    companyName: rec.empresa?.nome||'',
    location: (rec.empresa?.cidade||'')+'/'+(rec.empresa?.estado||''),
    cidade: rec.empresa?.cidade||'',
    estado: rec.empresa?.estado||'',
    date: rec.dataCriacao,
    isSim: rec.isSimulacao||false,
    criadoPorNome: rec.criadoPorNome||'',

    // Responsável
    responsibleName: rec.responsavelNome||rec.criadoPorNome||'',
    responsibleRole: rec.responsavelCargo||'',

    // Métricas
    totalVGV: rec.totalVGV||0,
    vgvGoal: rec.vgvGoal||0,
    avgTicket: rec.avgTicket||0,
    totalBrokers: rec.totalBrokers||0,
    activeBrokers: rec.activeBrokers||0,

    // Canais
    shareHouse: rec.shareHouse||0,
    shareParcerias: rec.shareParcerias||0,
    numImobiliarias: rec.numImobiliarias||0,
    hasHouse: rec.hasHouse||false,
    hasParc: rec.hasParc||false,
    hasImob: rec.hasImob||false,
    brokersExclusivity: rec.exclusividade||'',

    // Cargos reconstruídos
    cargos,
    parcManagers: gerCargo?.quantidade||0,
    parcExecutives: execCargo?.quantidade||0,

    // Inventário
    numEmpreendimentos: rec.numEmpreendimentos||0,
    numPreLancamento: rec.numPreLancamento||0,
    numLancamento: rec.numLancamento||0,
    numEstoque: rec.numEstoque||0,
    focoVendas: rec.focoVendas||'',
    totalImoveisVenda: rec.totalImoveisVenda||0,
    propostasMensais: rec.propostasMensais||0,
    fechamentosMensais: rec.fechamentosMensais||0,

    // Tecnologia
    hasCRM: rec.temCRM||false,
    crmName: rec.crmNome||'',
    crmContratoNome: rec.crmContratoNome||'',
    toolCosts: rec.custosFerramentas||{},
    ...ferrFlags,

    // Segmentação e relatórios
    brokerSegmentation: rec.segmentacao||'',
    brokerSegDescritivo: rec.segmentacaoDescritiva||'',
    desiredReports: rec.relatoriosDesejados||[],
    desiredReportsDescritivo: rec.relatoriosDescritivo||'',

    // Dores
    meetingGoals: rec.atingiuMetas||'',
    challenges: rec.desafiosKeys||[],
    challengesText: rec.desafiosTexto||'',
    testedActions: rec.acoesTestadas||false,
    testedResults: rec.resultadosTestados||'',

    // Contexto estratégico
    hasEventos: rec.temEventos||'',
    hasIncentivo: rec.temIncentivo||'',
    concorrente: rec.concorrente||'',
    expectativa12m: rec.expectativa12m||'',

    // Tabela Zero
    tabelaZero: rec.tabelaZeroParcerias||false,
    tabelaZeroAccess: rec.tabelaZeroAcesso||[],
    tabelaZeroObs: rec.tabelaZeroObs||'',

    // Observações gerais
    observations: rec.observacoesGerais||'',
  };
}

// ── HELPERS ────────────────────────────────────────────────────
const fmt=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0);
const fmtN=v=>new Intl.NumberFormat('pt-BR').format(Math.round(v||0));
const fmtP=v=>(v||0).toFixed(1)+'%';
const parseCur=s=>Number(String(s).replace(/\D/g,''))||0;
const fmtCI=v=>{const n=String(v).replace(/\D/g,'');return n?parseInt(n).toLocaleString('pt-BR'):'';}

// ── STATE ──────────────────────────────────────────────────────
let D={};
let isSim=false;
let currentStep=0;
let editingId=null; // ID do diagnóstico sendo editado
let _saving=false; // evita salvamento duplo
let _savedThisSession=false; // evita re-save se usuário navegar para trás

const ESTADOS_BR=['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const CARGOS_CANAL=[
  {id:'diretor',nome:'Diretor de Parceria',nivel:1},
  {id:'gerente',nome:'Gerente de Parceria',nivel:2},
  {id:'marketing',nome:'Marketing',nivel:2},
  {id:'executivo',nome:'Executivo de Parceria',nivel:3}
];
function resetD(){
  D={
    companyName:'',cidade:'',estado:'',responsibleName:'',responsibleRole:'',
    totalVGV:0,vgvGoal:0,avgTicket:0,
    totalBrokers:0,activeBrokers:0,brokersExclusivity:'',
    hasHouse:false,hasParc:true,hasImob:false,numImobiliarias:0,
    shareHouse:0,shareParcerias:0,
    // Cargos dinâmicos
    cargos:{},// {id: {existe:bool, qtd:number, kpi:'', atividades:''}}
    numEmpreendimentos:0,numPreLancamento:0,numLancamento:0,numEstoque:0,focoVendas:'',
    totalImoveisVenda:0,propostasMensais:0,fechamentosMensais:0,
    hasCRM:false,crmName:'',crmContratoNome:'',toolCosts:{},
    meetingGoals:'',challenges:[],challengesText:'',
    testedActions:false,testedResults:'',
    brokerSegmentation:'',brokerSegDescritivo:'',
    desiredReports:[],desiredReportsDescritivo:'',
    hasEventos:'',hasIncentivo:'',concorrente:'',expectativa12m:'',
    tabelaZero:false,tabelaZeroAccess:[],tabelaZeroObs:'',
    observations:'',
    parcManagers:0,parcExecutives:0
  };
  CARGOS_CANAL.forEach(c=>D.cargos[c.id]={existe:false,qtd:1,kpi:'',atividades:''});
  TOOLS_DEF.forEach(t=>D[t.k]=false);
}
resetD();

// ── START ──────────────────────────────────────────────────────
function showStart(){
  document.getElementById('startScreen').style.display='block';
  document.getElementById('formWrap').style.display='none';
  document.getElementById('results').style.display='none';
  document.getElementById('dashboard').style.display='none';
  document.getElementById('tutorial').style.display='none';
  document.getElementById('startScreen').innerHTML=`
    <div class="start">
      <h1>Diagnóstico Comercial</h1>
      <p>Aplique a Fórmula de Aceleração DWV para mapear a situação atual da incorporadora, calcular o gap de engajamento e apresentar as 3 rotas estratégicas.</p>
      <div class="start-btns">
        <button class="btn-start btn-real" onclick="startDiag(false)">Iniciar Diagnóstico Real</button>
        <button class="btn-start btn-sim" onclick="startDiag(true)">▷ Simulação com dados não reais</button>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px">
        <button class="dash-link" onclick="window.location.href='/diagnostico/dashboard'">← Voltar ao Dashboard</button>
        <button class="dash-link" onclick="showTutorial()">? Tutorial</button>
      </div>
    </div>`;
}

function startDiag(sim){
  resetD();isSim=sim;currentStep=0;_savedThisSession=false;
  if(!sim){ offerBackupRestore(); }
  if(sim){
    D.companyName='Vertice Incorporadora';D.cidade='Florianópolis';D.estado='SC';
    D.responsibleName='Ricardo Menezes';D.responsibleRole='Diretor de Parcerias';
    D.totalVGV=48000000;D.vgvGoal=80000000;D.avgTicket=620000;
    D.totalBrokers=420;D.activeBrokers=58;D.brokersExclusivity='non-exclusive';
    D.hasHouse=true;D.hasParc=true;D.hasImob=true;D.numImobiliarias=12;
    D.shareHouse=30;D.shareParcerias=70;
    D.cargos.diretor={existe:true,qtd:1,kpi:'VGV mensal, gestão do time',atividades:'Gestão estratégica do canal de parcerias, definição de metas e acompanhamento de resultados.'};
    D.cargos.gerente={existe:true,qtd:3,kpi:'VGV mensal, nº corretores ativos',atividades:'Visitas a imobiliárias, treinamentos de produto, gestão dos executivos.'};
    D.cargos.marketing={existe:true,qtd:1,kpi:'Leads gerados, campanhas ativas',atividades:'Gestão de campanhas, materiais de venda, redes sociais.'};
    D.cargos.executivo={existe:true,qtd:6,kpi:'Nº visitas, propostas geradas',atividades:'Visitas a corretores, treinamentos, captação de novos corretores, atendimento via WhatsApp.'};
    D.parcManagers=3;D.parcExecutives=6;
    D.hasCRM=false;D.toolsWhatsapp=true;D.toolsEmail=true;D.toolsDrive=true;D.toolsExcel=true;
    D.toolCosts={toolsEmail:350,toolsDrive:200};
    D.meetingGoals='partial';D.challenges=['engagement','exec_reports','exec_mgmt'];
    D.challengesText='Executivos não conseguem rastrear quais corretores estão próximos de fechar.';
    D.testedActions=true;D.testedResults='Grupos de WhatsApp por empreendimento, sem controle de leitura.';
    D.brokerSegmentation='nao';D.desiredReports=['corretores_engajados','imob_ofertando','impacto_exec'];
    D.tabelaZero=true;D.tabelaZeroAccess=['canal_parcerias'];D.tabelaZeroObs='Apenas corretores Ouro.';
    D.numEmpreendimentos=4;D.numPreLancamento=1;D.numLancamento=2;D.numEstoque=1;D.focoVendas='Lançamentos';
    D.totalImoveisVenda=380;D.propostasMensais=45;D.fechamentosMensais=12;
    D.hasEventos='sim_esporadico';
    D.hasIncentivo='no';
    D.concorrente='Construtora Alpha — forte presença no segmento médio-alto com comissionamento agressivo.';
    D.expectativa12m='Aumentar engajamento para 25%, ter visibilidade do pipeline por executivo.';
  }
  document.getElementById('startScreen').style.display='none';
  document.getElementById('formWrap').style.display='block';
  document.getElementById('simBadge').style.display=sim?'flex':'none';
  document.getElementById('results').style.display='none';
  document.getElementById('dashboard').style.display='none';
  render();
}

// ── PILLS ─────────────────────────────────────────────────────
function pills(){
  document.getElementById('pills').innerHTML=STEPS.map((s,i)=>{
    const n=s.tag.split(' ')[1];
    const c=i===currentStep?'active':i<currentStep?'done':'';
    return`<div class="pill ${c}" onclick="${i<currentStep?'goStep('+i+')':''}">${n}</div>`;
  }).join('');
  document.getElementById('prog').style.width=(((currentStep+1)/STEPS.length)*100)+'%';
}

// ── SAVE ──────────────────────────────────────────────────────
function save(){
  const g=id=>{const e=document.getElementById(id);return e?e.value:''};
  const gc=id=>{const e=document.getElementById(id);return e?e.checked:false};
  const gr=name=>{const e=document.querySelector(`input[name=${name}]:checked`);return e?e.value:''};
  const gca=name=>Array.from(document.querySelectorAll(`input[name=${name}]:checked`)).map(e=>e.value);
  if(currentStep===0){D.companyName=g('cN');D.cidade=g('cidadeField');D.estado=g('estadoField');D.responsibleName=g('rN');D.responsibleRole=g('rR');}
  else if(currentStep===1){D.totalVGV=parseCur(g('tVGV'));D.vgvGoal=parseCur(g('vGoal'));D.avgTicket=parseCur(g('avgT'));D.numEmpreendimentos=parseInt(g('numEmpreendimentos'))||0;D.numPreLancamento=parseInt(g('numPreLanc'))||0;D.numLancamento=parseInt(g('numLanc'))||0;D.numEstoque=parseInt(g('numEstoque'))||0;D.focoVendas=g('focoVendas');D.totalImoveisVenda=parseInt(g('totalImoveisVenda'))||0;D.propostasMensais=parseInt(g('propostasMensais'))||0;D.fechamentosMensais=parseInt(g('fechamentosMensais'))||0;}
  else if(currentStep===2){
    D.totalBrokers=parseInt(g('tBr'))||0;D.activeBrokers=parseInt(g('aBr'))||0;
    D.brokersExclusivity=g('bExcl');
    D.hasHouse=gc('chHouse');D.hasParc=gc('chParc');D.hasImob=gc('chImob');
    D.numImobiliarias=parseInt(g('numImob'))||0;
    D.shareHouse=parseInt(g('shareHouse'))||0;D.shareParcerias=parseInt(g('shareParc'))||0;
    CARGOS_CANAL.forEach(c=>{
      D.cargos[c.id].existe=gc('cargo_'+c.id);
      D.cargos[c.id].qtd=parseInt(g('cargoQtd_'+c.id))||1;
      D.cargos[c.id].kpi=g('cargoKpi_'+c.id);
      D.cargos[c.id].atividades=g('cargoAtiv_'+c.id);
    });
    // Backward compat
    const ger=D.cargos.gerente;const exec=D.cargos.executivo;
    D.parcManagers=ger.existe?ger.qtd:0;D.parcExecutives=exec.existe?exec.qtd:0;
  }
  else if(currentStep===3){
    D.hasCRM=gr('hasCRM')==='yes';D.crmName=g('crmName');
    D.crmContratoNome=g('which_toolsOfficialCRM')||'';
    TOOLS_DEF.forEach(t=>{D[t.k]=gc(t.k);const v=g('cost_'+t.k);if(v)D.toolCosts[t.k]=parseCur(v);else delete D.toolCosts[t.k];});
  }
  else if(currentStep===4){
    D.meetingGoals=gr('mGoals');D.challenges=gca('chal');D.challengesText=g('chalText');
    D.testedActions=gr('tested')==='yes';D.testedResults=g('testRes');
    D.brokerSegmentation=gr('bSeg');D.brokerSegDescritivo=g('segDescritivo')||'';
    D.desiredReports=gca('reports');D.desiredReportsDescritivo=g('repDescritivo')||'';
    D.hasEventos=gr('hasEventos');
    D.hasIncentivo=gr('hasIncentivo');
    D.concorrente=g('concorrente');
    D.expectativa12m=g('expectativa12m');
  }
  else if(currentStep===5){
    D.tabelaZero=gr('tz')==='yes';D.tabelaZeroAccess=gca('tzAccess');
    D.tabelaZeroObs=g('tzObs');D.observations=g('obs');
  }
}

function isAdmin(){const u=getUser();return u&&(u.role==='admin'||u.role==='master');}
function canNext(){
  if(isAdmin()) return true;
  if(currentStep===0)return !!(document.getElementById('cN')?.value);
  if(currentStep===1)return parseCur(document.getElementById('tVGV')?.value||'')>0&&parseCur(document.getElementById('vGoal')?.value||'')>0;
  if(currentStep===2)return (parseInt(document.getElementById('tBr')?.value)||0)>0&&(parseInt(document.getElementById('aBr')?.value)||0)>0;
  return true;
}

function goStep(i){save();currentStep=i;render();}
function prev(){if(currentStep===0)return;save();currentStep--;render();window.scrollTo({top:0,behavior:'smooth'});}
function next(){
  save();
  saveBackup(); // backup a cada avanço
  if(currentStep<STEPS.length-1){currentStep++;render();window.scrollTo({top:0,behavior:'smooth'});}
  else showResults();
}

function updateConditionals(){
  const crmYes=document.querySelector('input[name=hasCRM][value=yes]')?.checked;
  const crmF=document.getElementById('crmNameField');if(crmF)crmF.style.display=crmYes?'block':'none';
  const tested=document.querySelector('input[name=tested][value=yes]')?.checked;
  const tF=document.getElementById('testResField');if(tF)tF.style.display=tested?'block':'none';
  const tzYes=document.querySelector('input[name=tz][value=yes]')?.checked;
  const tzF=document.getElementById('tzAccessField');if(tzF)tzF.style.display=tzYes?'block':'none';
  // Segmentação — mostrar descritivo se Sim parcial ou total
  const segSim=document.querySelector('input[name=bSeg][value=sim_parcial]')?.checked||document.querySelector('input[name=bSeg][value=sim_total]')?.checked;
  const segF=document.getElementById('segDescField');if(segF)segF.style.display=segSim?'block':'none';
  // Imobiliárias — mostrar número se checkbox marcado
  const imobChecked=document.getElementById('chImob')?.checked;
  const imobF=document.getElementById('numImobField');if(imobF)imobF.style.display=imobChecked?'block':'none';
  // Share VGV — mostrar se tem pelo menos 1 canal
  const hasHouse=document.getElementById('chHouse')?.checked;
  const hasParc=document.getElementById('chParc')?.checked;
  const shareF=document.getElementById('shareVGVFields');if(shareF)shareF.style.display=(hasHouse||hasParc)?'block':'none';
  const shareHF=document.getElementById('shareHouseField');if(shareHF)shareHF.style.display=hasHouse?'block':'none';
  // Cargos — mostrar detalhes se checkbox marcado
  CARGOS_CANAL.forEach(c=>{
    const cb=document.getElementById('cargo_'+c.id);
    const det=document.getElementById('cargoDetail_'+c.id);
    if(cb&&det)det.style.display=cb.checked?'block':'none';
  });
  TOOLS_DEF.forEach(t=>{
    const cb=document.getElementById(t.k);
    const row=document.getElementById('costrow_'+t.k);
    if(cb&&row)row.style.display=cb.checked?'flex':'none';
  });
  const nb=document.getElementById('nextBtn');if(nb)nb.disabled=!canNext();
}

function render(){
  pills();
  const s=STEPS[currentStep];
  const isLast=currentStep===STEPS.length-1;
  document.getElementById('form-area').innerHTML=`
    ${editingId?`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:10px 14px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:12px">
      <span style="font-size:12px;color:#60a5fa;font-weight:600">✏️ Editando diagnóstico</span>
      <button onclick="window.location.href='/diagnostico/dashboard'" style="font-size:12px;color:#94a3b8;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);padding:6px 14px;border-radius:8px;cursor:pointer">← Voltar ao Dashboard</button>
    </div>`:''}
    <div class="stag">${s.tag}</div>
    <div class="stitle">${s.title}</div>
    <div class="sdesc">${s.desc}</div>
    ${body()}
    <div class="nav">
      ${currentStep===0
        ? `<button class="btn btng" onclick="window.location.href='/diagnostico/dashboard'">← Home</button>`
        : `<button class="btn btng" onclick="prev()">← Anterior</button>`
      }
      <button id="nextBtn" class="btn btnp" onclick="next()" ${!canNext()?'disabled':''}>
        ${isLast?'Ver Diagnóstico →':'Avançar →'}
      </button>
    </div>`;
  restore();
  document.querySelectorAll('input,select,textarea').forEach(el=>{
    el.addEventListener('input',updateConditionals);
    el.addEventListener('change',updateConditionals);
  });
  updateConditionals();
}

// ── STEP BODIES ───────────────────────────────────────────────
function body(){
  if(currentStep===0)return`
    <div class="field"><label>Nome da Incorporadora <span class="req">*</span></label>
      <input type="text" id="cN" placeholder="Ex: Incorporadora Valor S.A."/></div>
    <div class="g2">
      <div class="field"><label>Responsável <span class="req">*</span></label>
        <input type="text" id="rN" placeholder="Nome completo"/></div>
      <div class="field"><label>Cargo</label>
        <input type="text" id="rR" placeholder="Ex: Diretor de Parceria"/></div>
    </div>
    <div class="g2">
      <div class="field"><label>Cidade <span class="req">*</span></label>
        <input type="text" id="cidadeField" placeholder="Ex: Florianópolis"/></div>
      <div class="field"><label>Estado <span class="req">*</span></label>
        <select id="estadoField"><option value="">Selecione</option>${ESTADOS_BR.map(e=>`<option value="${e}">${e}</option>`).join('')}</select></div>
    </div>`;

  if(currentStep===1)return`
    <div class="field"><label>VGV vendido nos últimos 12 meses (R$) <span class="req">*</span></label>
      <input type="text" id="tVGV" placeholder="0" oninput="this.value=fmtCI(this.value)"/>
      <div class="hint">Total de vendas pelo canal de parcerias nos últimos 12 meses.</div></div>
    <div class="field"><label>Meta de VGV (R$) <span class="req">*</span></label>
      <input type="text" id="vGoal" placeholder="0" oninput="this.value=fmtCI(this.value)"/></div>
    <div class="field"><label>Ticket médio por unidade (R$)</label>
      <input type="text" id="avgT" placeholder="0" oninput="this.value=fmtCI(this.value)"/>
      <div class="hint">Valor médio por unidade — usado para estimar volume necessário.</div></div>
    <div class="field"><label>Quantos empreendimentos ativos para venda?</label>
      <input type="number" id="numEmpreendimentos" placeholder="0" min="0"/></div>
    <div class="g3">
      <div class="field"><label>Pré-lançamento (Tab. Zero)</label>
        <input type="number" id="numPreLanc" placeholder="0" min="0"/></div>
      <div class="field"><label>Lançamentos</label>
        <input type="number" id="numLanc" placeholder="0" min="0"/></div>
      <div class="field"><label>Estoque</label>
        <input type="number" id="numEstoque" placeholder="0" min="0"/></div>
    </div>
    <div class="field"><label>Foco de vendas atualmente</label>
      <select id="focoVendas"><option value="">Selecione</option><option value="Pre-lancamento">Pré-lançamento</option><option value="Lancamentos">Lançamentos</option><option value="Estoque">Estoque</option><option value="Todos">Todos igualmente</option></select></div>
    <div class="g3">
      <div class="field"><label>Total de imóveis à venda</label>
        <input type="number" id="totalImoveisVenda" placeholder="0" min="0"/></div>
      <div class="field"><label>Propostas recebidas / mês</label>
        <input type="number" id="propostasMensais" placeholder="0" min="0"/></div>
      <div class="field"><label>Fechamentos / mês</label>
        <input type="number" id="fechamentosMensais" placeholder="0" min="0"/></div>
    </div>`;

  if(currentStep===2)return`
    <div class="g2">
      <div class="field"><label>Total de corretores na base <span class="req">*</span></label>
        <input type="number" id="tBr" placeholder="0" min="0"/></div>
      <div class="field"><label>Corretores que venderam nos últimos 12m <span class="req">*</span></label>
        <input type="number" id="aBr" placeholder="0" min="0"/></div>
    </div>
    <div class="field"><label>Modelo de exclusividade dos corretores</label>
      <select id="bExcl">
        <option value="">Selecione uma opção</option>
        <option value="exclusive">Exclusivos — trabalham só com esta incorporadora</option>
        <option value="non-exclusive">Não exclusivos — trabalham com várias incorporadoras</option>
        <option value="mixed">Modelo misto — parte exclusiva, parte não</option>
      </select></div>
    <div class="field"><label>Canais comerciais ativos</label>
      <div class="rg h" style="margin-top:8px">
        <label class="co"><input type="checkbox" id="chHouse"/> Canal House (equipe interna)</label>
        <label class="co"><input type="checkbox" id="chParc"/> Canal Parcerias</label>
        <label class="co"><input type="checkbox" id="chImob"/> Imobiliária(s) parceiras</label>
      </div></div>
    <div id="numImobField" style="display:none" class="field"><label>Número de imobiliárias parceiras</label>
      <input type="number" id="numImob" placeholder="0" min="0"/></div>
    <div id="shareVGVFields" style="display:none">
      <div class="g2">
        <div id="shareHouseField" style="display:none" class="field"><label>% do VGV vendido pela House</label>
          <input type="number" id="shareHouse" placeholder="0" min="0" max="100"/> <span style="color:var(--mu);font-size:12px">%</span></div>
        <div class="field"><label>% do VGV vendido pelo Canal de Parcerias</label>
          <input type="number" id="shareParc" placeholder="0" min="0" max="100"/> <span style="color:var(--mu);font-size:12px">%</span></div>
      </div>
    </div>
    <div class="subbox">
      <div class="subbox-tag">Organograma · Canal Parcerias</div>
      <div class="hint" style="margin-bottom:12px">Selecione os cargos que existem e informe quantidade, KPI e atividades de cada um.</div>
      ${CARGOS_CANAL.map(c=>`
        <div class="tool-row" style="flex-direction:column;align-items:stretch">
          <label class="tool-check" style="margin-bottom:6px"><input type="checkbox" id="cargo_${c.id}"/>
            <div><div style="font-size:13px;font-weight:600">${c.nome}</div><div style="font-size:11px;color:var(--mu)">Nível ${c.nivel}</div></div>
          </label>
          <div id="cargoDetail_${c.id}" style="display:none;padding-left:28px">
            <div class="g2" style="margin-bottom:8px">
              <div class="field"><label>Quantidade de pessoas</label><input type="number" id="cargoQtd_${c.id}" placeholder="1" min="1" value="1" style="width:80px"/></div>
              <div class="field"><label>KPI / Métrica de resultado</label><input type="text" id="cargoKpi_${c.id}" placeholder="Ex: VGV mensal, nº propostas, nº visitas..."/></div>
            </div>
            <div class="field"><label>Atividades do cargo</label>
              <textarea id="cargoAtiv_${c.id}" placeholder="Descreva as principais atividades deste cargo..." style="min-height:60px"></textarea>
              <div class="hint">Esta resposta será analisada por IA para gerar insights no relatório.</div>
            </div>
          </div>
        </div>`).join('')}
    </div>`;

  if(currentStep===3)return`
    <div class="field"><label>A incorporadora usa um CRM voltado para parceiros?</label>
      <div class="rg h" style="margin-top:8px">
        <label class="ro"><input type="radio" name="hasCRM" value="yes"/> Sim</label>
        <label class="ro"><input type="radio" name="hasCRM" value="no"/> Não</label>
      </div></div>
    <div id="crmNameField" style="display:none" class="field"><label>Qual CRM é utilizado?</label>
      <input type="text" id="crmName" placeholder="Ex: HubSpot, Salesforce, CRM próprio..."/></div>
    <div class="field">
      <label>Ferramentas utilizadas para comunicação e gestão de corretores</label>
      <div class="hint" style="margin-bottom:12px">Selecione as que utiliza e informe o custo mensal de cada uma quando aplicável.</div>
      ${TOOLS_DEF.map(t=>`
        <div class="tool-row">
          <label class="tool-check"><input type="checkbox" id="${t.k}"/>
            <div><div style="font-size:13px">${t.l}</div><div style="font-size:11px;color:var(--mu);margin-top:1px">${t.hint}</div></div>
          </label>
          <div id="costrow_${t.k}" style="display:none;align-items:center;gap:8px">
            <div class="tool-cost-pfx"><span>R$</span>
              <input type="text" id="cost_${t.k}" placeholder="0/mês" oninput="this.value=fmtCI(this.value)" style="width:120px;font-size:13px;padding:7px 10px 7px 28px"/>
            </div>
            ${t.askWhich?`<input type="text" id="which_${t.k}" placeholder="Qual CRM?" style="width:180px;font-size:13px;padding:7px 10px"/>`:''}
          </div>
        </div>`).join('')}
    </div>`;

  if(currentStep===4)return`
    <div class="field"><label>A incorporadora está batendo as metas de VGV?</label>
      <div class="rg" style="margin-top:8px">
        <label class="ro"><input type="radio" name="mGoals" value="yes"/> Sim, consistentemente</label>
        <label class="ro"><input type="radio" name="mGoals" value="partial"/> Parcialmente — alguns meses sim, outros não</label>
        <label class="ro"><input type="radio" name="mGoals" value="no"/> Não, abaixo da meta</label>
      </div></div>
    <div class="field"><label>Principais desafios no canal de parcerias</label>
      <div class="cg" style="margin-top:8px">
        ${Object.entries(CHAL_LABELS).map(([k,l])=>`<label class="co"><input type="checkbox" name="chal" value="${k}"/> ${l}</label>`).join('')}
      </div></div>
    <div class="field"><label>Existe alguma segmentação dos corretores da base?</label>
      <div class="rg" style="margin-top:8px">
        <label class="ro"><input type="radio" name="bSeg" value="nao"/> Não</label>
        <label class="ro"><input type="radio" name="bSeg" value="nao_gostaria"/> Não, mas eu gostaria</label>
        <label class="ro"><input type="radio" name="bSeg" value="sim_parcial"/> Sim, parcialmente</label>
        <label class="ro"><input type="radio" name="bSeg" value="sim_total"/> Sim, totalmente</label>
      </div></div>
    <div id="segDescField" style="display:none" class="field"><label>Descreva como é feita a segmentação</label>
      <textarea id="segDescritivo" placeholder="Descreva como segmenta seus corretores..."></textarea>
      <div class="hint">Esta resposta será analisada por IA para gerar insights no BI.</div></div>
    <div class="field"><label>Quais relatórios você mais gostaria de ter sobre o canal de parcerias?</label>
      <div class="cg" style="margin-top:8px">
        ${Object.entries(RPT_LABELS).map(([k,l])=>`<label class="co"><input type="checkbox" name="reports" value="${k}"/> ${l}</label>`).join('')}
      </div></div>
    <div class="field"><label>Outros relatórios ou observações</label>
      <textarea id="repDescritivo" placeholder="Descreva outros relatórios que gostaria de ter..."></textarea>
      <div class="hint">Esta resposta será analisada por IA para gerar insights no BI.</div></div>
    <div class="field"><label>Descrição dos obstáculos comerciais</label>
      <textarea id="chalText" placeholder="Conte mais sobre o que trava o crescimento do canal de parcerias..."></textarea></div>
    <div class="field"><label>Já testaram ações para engajar mais corretores?</label>
      <div class="rg h" style="margin-top:8px">
        <label class="ro"><input type="radio" name="tested" value="yes"/> Sim</label>
        <label class="ro"><input type="radio" name="tested" value="no"/> Não</label>
      </div></div>
    <div id="testResField" style="display:none" class="field"><label>Quais foram os resultados?</label>
      <textarea id="testRes" placeholder="Descreva as ações e os resultados..."></textarea></div>
    <div class="field"><label>Realiza eventos ou treinamentos para corretores?</label>
      <div class="rg" style="margin-top:8px">
        <label class="ro"><input type="radio" name="hasEventos" value="sim_frequente"/> Sim, com frequência</label>
        <label class="ro"><input type="radio" name="hasEventos" value="sim_esporadico"/> Sim, esporádico</label>
        <label class="ro"><input type="radio" name="hasEventos" value="nao"/> Não</label>
      </div></div>
    <div class="field"><label>Possui programa de incentivo/comissionamento diferenciado?</label>
      <div class="rg h" style="margin-top:8px">
        <label class="ro"><input type="radio" name="hasIncentivo" value="yes"/> Sim</label>
        <label class="ro"><input type="radio" name="hasIncentivo" value="no"/> Não</label>
      </div></div>
    <div class="field"><label>Principal concorrente na região</label>
      <textarea id="concorrente" placeholder="Ex: Construtora X — forte presença no segmento médio..."></textarea></div>
    <div class="field"><label>Expectativa com a DWV em 12 meses</label>
      <textarea id="expectativa12m" placeholder="Ex: Aumentar engajamento, ter visibilidade do pipeline..."></textarea></div>`;

  if(currentStep===5)return`
    <div class="field"><label>Trabalha com Tabela Zero (pré-lançamento)?</label>
      <div class="rg h" style="margin-top:8px">
        <label class="ro"><input type="radio" name="tz" value="yes"/> Sim</label>
        <label class="ro"><input type="radio" name="tz" value="no"/> Não</label>
      </div></div>
    <div id="tzAccessField" style="display:none">
      <div class="field"><label>Quem tem acesso à Tabela Zero antes de todos?</label>
        <div class="rg" style="margin-top:8px">
          ${Object.entries(TZ_LABELS).map(([k,l])=>`<label class="co"><input type="checkbox" name="tzAccess" value="${k}"/> ${l}</label>`).join('')}
        </div></div>
      <div class="field"><label>Observações sobre a Tabela Zero</label>
        <textarea id="tzObs" placeholder="Ex: só corretores Ouro têm acesso, parceiros recebem 48h antes..."></textarea></div>
    </div>
    <div class="field"><label>Observações gerais</label>
      <textarea id="obs" placeholder="Observações adicionais sobre o diagnóstico..."></textarea></div>
    `;
  return '';
}

// ── RESTORE ───────────────────────────────────────────────────
function restore(){
  const s=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};
  const sc=(id,v)=>{const e=document.getElementById(id);if(e)e.checked=v;};
  const sr=(name,v)=>{if(!v)return;const e=document.querySelector(`input[name=${name}][value="${v}"]`);if(e)e.checked=true;};
  const sca=(name,arr)=>(arr||[]).forEach(v=>{const e=document.querySelector(`input[name=${name}][value="${v}"]`);if(e)e.checked=true;});
  if(currentStep===0){s('cN',D.companyName);s('rN',D.responsibleName);s('rR',D.responsibleRole);s('cidadeField',D.cidade);s('estadoField',D.estado);}
  else if(currentStep===1){
    s('tVGV',D.totalVGV?D.totalVGV.toLocaleString('pt-BR'):'');
    s('vGoal',D.vgvGoal?D.vgvGoal.toLocaleString('pt-BR'):'');
    s('avgT',D.avgTicket?D.avgTicket.toLocaleString('pt-BR'):'');
    s('numEmpreendimentos',D.numEmpreendimentos||'');
    s('numPreLanc',D.numPreLancamento||'');s('numLanc',D.numLancamento||'');s('numEstoque',D.numEstoque||'');
    s('focoVendas',D.focoVendas||'');
    s('totalImoveisVenda',D.totalImoveisVenda||'');s('propostasMensais',D.propostasMensais||'');s('fechamentosMensais',D.fechamentosMensais||'');
  }
  else if(currentStep===2){
    s('tBr',D.totalBrokers||'');s('aBr',D.activeBrokers||'');s('bExcl',D.brokersExclusivity);
    sc('chHouse',D.hasHouse);sc('chParc',D.hasParc);sc('chImob',D.hasImob);
    s('numImob',D.numImobiliarias||'');s('shareHouse',D.shareHouse||'');s('shareParc',D.shareParcerias||'');
    CARGOS_CANAL.forEach(c=>{
      sc('cargo_'+c.id,D.cargos[c.id]?.existe);
      s('cargoQtd_'+c.id,D.cargos[c.id]?.qtd||1);
      s('cargoKpi_'+c.id,D.cargos[c.id]?.kpi||'');
      s('cargoAtiv_'+c.id,D.cargos[c.id]?.atividades||'');
    });
  }
  else if(currentStep===3){
    sr('hasCRM',D.hasCRM?'yes':'no');s('crmName',D.crmName);s('which_toolsOfficialCRM',D.crmContratoNome||'');
    TOOLS_DEF.forEach(t=>{sc(t.k,D[t.k]);if(D.toolCosts[t.k])s('cost_'+t.k,D.toolCosts[t.k].toLocaleString('pt-BR'));});
  }
  else if(currentStep===4){
    sr('mGoals',D.meetingGoals);sca('chal',D.challenges);s('chalText',D.challengesText);
    sr('tested',D.testedActions?'yes':'no');s('testRes',D.testedResults);
    sr('bSeg',D.brokerSegmentation);s('segDescritivo',D.brokerSegDescritivo||'');
    sca('reports',D.desiredReports);s('repDescritivo',D.desiredReportsDescritivo||'');
    sr('hasEventos',D.hasEventos);
    sr('hasIncentivo',D.hasIncentivo);
    s('concorrente',D.concorrente);
    s('expectativa12m',D.expectativa12m);
  }
  else if(currentStep===5){
    sr('tz',D.tabelaZero?'yes':'no');sca('tzAccess',D.tabelaZeroAccess);
    s('tzObs',D.tabelaZeroObs);s('obs',D.observations);
  }
}

// ── CALC ─────────────────────────────────────────────────────
function calc(data){
  const d=data||D;
  const te=d.totalBrokers>0?(d.activeBrokers/d.totalBrokers)*100:0;
  const dc=d.totalVGV>0?d.activeBrokers/(d.totalVGV/1e6):0;
  const nc=d.vgvGoal>0?dc*(d.vgvGoal/1e6):0;
  const nct=te>0?nc/(te/100):0;
  const nteNeeded=d.totalBrokers>0?(nc/d.totalBrokers)*100:0;
  const dcNovo=d.vgvGoal>0&&d.activeBrokers>0?1e6/(d.vgvGoal/d.activeBrokers):0;
  const gap=d.vgvGoal-d.totalVGV;

  // VGV médio por corretor ativo (produtividade atual)
  const vgvPorCorretor=d.activeBrokers>0?d.totalVGV/d.activeBrokers:0;

  // Corretores adicionais necessários (meta = atingir NC total)
  const corretoresAdicionar=Math.max(0,Math.ceil(nc-d.activeBrokers));

  // Plano DWV com Operadora
  const planoAnual=PLANO_ANUAL;
  const planoMensal=PLANO_MENSAL;

  // Retorno por corretor ativado (em R$)
  const retornoPorCorretor=vgvPorCorretor;

  // Quantos corretores mínimos para pagar o plano anual
  const corretoresParaPagarPlano=vgvPorCorretor>0?Math.ceil(planoAnual/vgvPorCorretor):null;

  // Retorno total se conseguir todos os corretores necessários
  const retornoTotal=corretoresAdicionar*vgvPorCorretor;

  // Custo ferramentas
  const totalToolCost=Object.values(d.toolCosts||{}).reduce((a,b)=>a+(b||0),0)*12;
  const nTools=TOOLS_DEF.filter(t=>d[t.k]).length+(!d.hasCRM?1:0);
  const unids=d.avgTicket>0?Math.ceil(gap/d.avgTicket):null;

  return{
    te,dc,nc,nct,nteNeeded,dcNovo,gap,
    vgvPorCorretor,corretoresAdicionar,
    planoAnual,planoMensal,
    retornoPorCorretor,corretoresParaPagarPlano,retornoTotal,
    totalToolCost,nTools,unids,
    corretoresPorExec: d.cargos.executivo?.existe ? Math.round(d.totalBrokers / (d.cargos.executivo?.qtd || 1)) : null,
    ociosidade: d.totalBrokers > 0 ? 100 - te : 0,
    corretoresOciosos: d.totalBrokers - d.activeBrokers,
    unidadesParaMeta: d.avgTicket > 0 ? Math.ceil(gap / d.avgTicket) : null,
    custoCorretorAtivo: (d.activeBrokers > 0 && totalToolCost > 0) ? Math.round(totalToolCost / d.activeBrokers) : null,
    custoCorretorAtivoMeta: (nc > 0 && totalToolCost > 0) ? Math.round(totalToolCost / nc) : null,
    reducaoCusto: (d.activeBrokers > 0 && nc > 0 && totalToolCost > 0) ? Math.round((1 - d.activeBrokers / nc) * 100) : null,
    taxaConversao: d.propostasMensais > 0 ? (d.fechamentosMensais / d.propostasMensais) * 100 : null
  };
}

// ── RESULTS ───────────────────────────────────────────────────
async function showResults(viewOnly){
  if(_saving) return; // bloqueia chamada dupla
  _saving=true;
  const r=calc();
  // viewOnly=true: apenas renderiza (ex: ?ver=ID — não salva no DB)
  // _savedThisSession=true: já foi salvo nesta sessão — não duplica
  if(!viewOnly && !_savedThisSession){
    const savedId=await addToDB({...D,results:r,isSim:isSim}, editingId||null);
    if(savedId){
      _savedThisSession=true;
      clearBackup();
    }
  }
  _saving=false;
  document.getElementById('formWrap').style.display='none';
  document.getElementById('results').style.display='block';

  const teColor=r.te<15?'r':r.te<30?'a':'g';
  const teLabel=r.te<15?'Crítica':r.te<30?'Regular':'Boa';
  const chalLabels=D.challenges.map(k=>CHAL_LABELS[k]||k);
  const rptLabels=D.desiredReports.map(k=>RPT_LABELS[k]||k);
  const toolBadges=TOOLS_DEF.filter(t=>D[t.k]).map(t=>`<div class="badge hi">${t.l}${D.toolCosts[t.k]?' · '+fmt(D.toolCosts[t.k]*12)+'/ano':''}</div>`).join('');
  const allToolBadges=toolBadges+(!D.hasCRM?'<div class="badge hi">Sem CRM de parceiros</div>':'');
  const tzTxt=D.tabelaZeroAccess.map(k=>TZ_LABELS[k]||k).join(', ');

  // Organograma dinâmico — baseado nos cargos selecionados
  function buildOrgLevel(cargoId, label, cssClass){
    const c=D.cargos[cargoId];
    if(!c||!c.existe) return '';
    const boxes=Array(Math.min(c.qtd,10)).fill(0).map((_,i)=>
      `<div class="ob ${cssClass}">${label} ${c.qtd>1?i+1:''}</div>`).join('')+
      (c.qtd>10?`<div class="ob" style="color:var(--mu)">+${c.qtd-10}</div>`:'');
    const kpiHtml=c.kpi?`<div style="font-size:10px;color:var(--am);margin-top:4px">KPI: ${c.kpi}</div>`:'';
    return `<div class="ol"><div class="olab">${CARGOS_CANAL.find(x=>x.id===cargoId)?.nome||label}</div>
      <div class="obs-boxes">${boxes}</div>${kpiHtml}</div>`;
  }
  const dirLevel=buildOrgLevel('diretor','Dir. Parceria','hi');
  const gerLevel=buildOrgLevel('gerente','Ger. Parceria','hi');
  const mktLevel=D.cargos.marketing?.existe?`<div class="ob" style="background:rgba(139,92,246,0.1);color:#a78bfa;border-color:rgba(139,92,246,0.2)">Marketing${D.cargos.marketing.qtd>1?' ×'+D.cargos.marketing.qtd:''}</div>`:'';
  const execLevel=buildOrgLevel('executivo','Exec.','');

  // ROI — narrativa em corretores
  const corMinTxt=r.corretoresParaPagarPlano!==null
    ? (r.corretoresParaPagarPlano===1
        ? 'Com apenas <strong>1 corretor</strong> ativado pela DWV o investimento anual já se paga.'
        : `Com apenas <strong>${r.corretoresParaPagarPlano} corretores</strong> ativados o investimento anual já se paga.`)
    : '';
  const retornoTotalTxt=r.retornoTotal>0
    ? `Se a DWV conseguir ativar todos os <strong>${fmtN(r.corretoresAdicionar)} corretores necessários</strong>, o retorno potencial é de <strong>${fmt(r.retornoTotal)}</strong> em VGV adicional.`
    : '';

  document.getElementById('results').innerHTML=`
    ${isSim?`<div class="sim-warn">⚠ Simulação com dados não reais — este diagnóstico não representa uma incorporadora real.</div>`:''}

    <!-- RESUMO EXECUTIVO -->
    <div class="exec-card">
      <div class="exec-lbl">Resumo Executivo · ${D.companyName||'Incorporadora'} · ${D.cidade||''}${D.estado?'/'+D.estado:''}</div>
      <div class="kpis">
        <div class="kpi"><div class="kl">VGV Atual (12m)</div><div class="kv">${fmt(D.totalVGV)}</div><div class="ks">Canal parcerias</div></div>
        <div class="kpi"><div class="kl">Meta de VGV</div><div class="kv r">${fmt(D.vgvGoal)}</div><div class="ks">Gap de ${fmt(r.gap)}</div></div>
        <div class="kpi"><div class="kl">Taxa de Engajamento</div><div class="kv ${teColor}">${fmtP(r.te)}</div><div class="ks">${teLabel} · ${fmtN(D.activeBrokers)} de ${fmtN(D.totalBrokers)}</div></div>
        <div class="kpi"><div class="kl">Corretores a Ativar</div><div class="kv r">${fmtN(r.corretoresAdicionar)}</div><div class="ks">Meta da DWV</div></div>
      </div>
      ${D.responsibleName ? `<div style="font-size:12px;color:var(--mu);margin-bottom:10px">Responsável: <strong style="color:#fff">${D.responsibleName}</strong>${D.responsibleRole ? ' · ' + D.responsibleRole : ''}</div>` : ''}
      ${D.hasHouse ? `<div style="margin-bottom:10px">
        <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Proporção VGV por canal</div>
        <div style="display:flex;height:18px;border-radius:6px;overflow:hidden;background:var(--s2)">
          <div style="width:${D.shareHouse||0}%;background:rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:500">${D.shareHouse||0}% House</div>
          <div style="width:${D.shareParcerias||0}%;background:rgba(232,57,42,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:500">${D.shareParcerias||0}% Parcerias</div>
        </div>
      </div>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
        <div class="badge" style="background:rgba(224,160,32,0.1);border-color:rgba(224,160,32,0.3);color:var(--am)">Metas: ${D.meetingGoals === 'yes' ? 'Batendo' : D.meetingGoals === 'partial' ? 'Parcialmente' : 'Abaixo'}</div>
        <div class="badge" style="background:rgba(224,160,32,0.1);border-color:rgba(224,160,32,0.3);color:var(--am)">Exclusividade: ${{exclusive:'Exclusivos','non-exclusive':'Não exclusivos',mixed:'Misto'}[D.brokersExclusivity] || 'N/A'}</div>
        ${D.hasImob ? `<div class="badge" style="background:rgba(224,160,32,0.1);border-color:rgba(224,160,32,0.3);color:var(--am)">${D.numImobiliarias||''} imobiliárias parceiras</div>` : ''}
      </div>
      <div class="verdict">
        A <strong>${D.companyName||'incorporadora'}</strong> tem <strong>${fmtN(D.totalBrokers)} corretores</strong> cadastrados, mas apenas <strong>${fmtN(D.activeBrokers)} (${fmtP(r.te)})</strong> venderam — engajamento <strong>${teLabel.toLowerCase()}</strong>. Para atingir <strong>${fmt(D.vgvGoal)}</strong>, a DWV precisa ativar mais <strong>${fmtN(r.corretoresAdicionar)} corretores</strong>. Cada corretor ativado representa em média <strong>${fmt(r.vgvPorCorretor)}</strong> em VGV.${chalLabels.length>0?` Principais desafios: <strong>${chalLabels.slice(0,3).join(', ')}</strong>.`:''}
      </div>
    </div>

    <!-- 1: TE -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>1 · Taxa de Engajamento (TE)</h3><div class="dhr"><span class="dtag ${teColor}">${teLabel} · ${fmtP(r.te)}</span><span class="chev">▾</span></div></div>
      <div class="dbody">
        <div class="fm">TE = (${fmtN(D.activeBrokers)} / ${fmtN(D.totalBrokers)}) × 100 = ${fmtP(r.te)}</div>
        <div class="cl">Apenas ${fmtP(r.te)} da base vendeu nos últimos 12 meses. ${r.te<15?'Nível crítico — a maioria da base está inativa.':r.te<30?'Nível regular — há espaço para ativar inativos.':'Bom engajamento — foco em crescimento de base.'}</div>
      </div>
    </div>

    <!-- 2: DC -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>2 · Delta de Corretores por Milhão (DC)</h3><div class="dhr"><span class="dtag">${r.dc.toFixed(2)} corretores/M</span><span class="chev">▾</span></div></div>
      <div class="dbody">
        <div class="fm">DC = ${fmtN(D.activeBrokers)} / (${fmt(D.totalVGV)} / 1M) = ${r.dc.toFixed(2)} corretores/M</div>
        <div class="cl">São necessários ${r.dc.toFixed(2)} corretores ativos para gerar R$ 1 milhão em VGV. Cada corretor ativado vale em média <strong>${fmt(r.vgvPorCorretor)}</strong>.</div>
      </div>
    </div>

    <!-- 3: NC -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>3 · Corretores Necessários para a Meta</h3><div class="dhr"><span class="dtag">${fmtN(r.nc)} corretores ativos</span><span class="chev">▾</span></div></div>
      <div class="dbody">
        <div class="fm">NC = (${fmt(D.vgvGoal)} / 1M) × ${r.dc.toFixed(2)} = ${fmtN(r.nc)} corretores ativos</div>
        <div class="cl">Para atingir ${fmt(D.vgvGoal)}, a incorporadora precisa de <strong>${fmtN(r.nc)} corretores engajados</strong>. Hoje tem ${fmtN(D.activeBrokers)} — a DWV precisa ativar mais <strong>${fmtN(r.corretoresAdicionar)}</strong>.</div>
      </div>
    </div>

    <!-- 4: ROTAS -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>4 · 3 Rotas Estratégicas</h3><div class="dhr"><span class="dtag">Como atingir a meta</span><span class="chev">▾</span></div></div>
      <div class="dbody">
        <div class="routes">
          <div class="rc"><div class="rcn">Rota A</div><div class="rct">Aumentar Engajamento</div><div class="rcv">${fmtP(r.nteNeeded)}</div><div class="rcd">Nova TE mantendo base de ${fmtN(D.totalBrokers)}. Hoje: ${fmtP(r.te)}.</div></div>
          <div class="rc"><div class="rcn">Rota B</div><div class="rct">Crescer a Base</div><div class="rcv">${fmtN(r.nct)}</div><div class="rcd">Total necessário mantendo TE atual. Hoje: ${fmtN(D.totalBrokers)}.</div></div>
          <div class="rc"><div class="rcn">Rota C</div><div class="rct">Aumentar Produtividade</div><div class="rcv">${r.dcNovo.toFixed(2)}/M</div><div class="rcd">DC necessário com base e TE atuais. Hoje: ${r.dc.toFixed(2)}/M.</div></div>
        </div>
        <div class="cl" style="margin-top:12px">A DWV atua nas 3 rotas: ativa inativos via WhatsApp API + campanhas (A), expande base via Meta Ads (B) e aumenta produtividade com CRM, Tabela Zero e treinamento (C).</div>
      </div>
    </div>

    <!-- 5: ORGANOGRAMA — só Canal Parcerias -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>5 · Organograma e Fluxos · Canal Parcerias</h3><div class="dhr"><span class="dtag">Sem DWV vs. Com DWV</span><span class="chev">▾</span></div></div>
      <div class="dbody">

        <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">Organograma atual — sem DWV</div>
        <div class="org">
          ${dirLevel?dirLevel+'<div class="oarr">↓</div>':''}
          ${gerLevel||mktLevel?`<div class="ol"><div class="olab">Gerência / Marketing</div>
            <div class="obs-boxes">${gerLevel?D.cargos.gerente.existe?Array(Math.min(D.cargos.gerente.qtd,10)).fill(0).map((_,i)=>'<div class="ob hi">Ger. '+(D.cargos.gerente.qtd>1?i+1:'Parceria')+'</div>').join(''):'':''}${mktLevel}</div>
            ${D.cargos.gerente?.kpi?'<div style="font-size:10px;color:var(--am);margin-top:4px">KPI Gerente: '+D.cargos.gerente.kpi+'</div>':''}
          </div><div class="oarr">↓</div>`:''}
          ${D.cargos.executivo?.existe?`<div class="ol"><div class="olab">Executivos de Parceria</div>
            <div class="obs-boxes">${Array(Math.min(D.cargos.executivo.qtd,10)).fill(0).map((_,i)=>'<div class="ob">Exec. '+(i+1)+'</div>').join('')}${D.cargos.executivo.qtd>10?'<div class="ob" style="color:var(--mu)">+'+( D.cargos.executivo.qtd-10)+'</div>':''}</div>
            ${D.cargos.executivo.kpi?'<div style="font-size:10px;color:var(--am);margin-top:4px">KPI: '+D.cargos.executivo.kpi+'</div>':''}
          </div><div class="oarr">↓</div>`:''}
          <div class="ol"><div class="olab">Base de Corretores</div>
            <div class="obs-boxes">
              <div class="ob">${fmtN(D.totalBrokers)} cadastrados</div>
              <div class="ob hi">${fmtN(D.activeBrokers)} ativos (${fmtP(r.te)})</div>
              ${D.hasImob?`<div class="ob">${D.numImobiliarias||''} imobiliárias parceiras</div>`:''}
            </div>
          </div>
        </div>

        <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin:20px 0 10px">Fluxo atual — canal cego</div>
        <div class="flow">
          <div class="fs red"><div class="ft">Captação</div><div class="fd">Manual. Sem rastreio de origem.</div></div><div class="farr">→</div>
          <div class="fs red"><div class="ft">Cadastro</div><div class="fd">Planilha. Sem segmentação.</div></div><div class="farr">→</div>
          <div class="fs red"><div class="ft">Comunicação</div><div class="fd">WhatsApp pessoal. Sem rastreio.</div></div><div class="farr">→</div>
          <div class="fs red"><div class="ft">Proposta</div><div class="fd">Sem visibilidade do gerente.</div></div><div class="farr">→</div>
          <div class="fs red"><div class="ft">Resultado</div><div class="fd">Gerente vê só na mesa de propostas.</div></div>
        </div>

        <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin:20px 0 10px">Organograma com Operadora DWV</div>
        <div class="org">
          ${D.cargos.diretor?.existe ? `<div class="ol"><div class="olab">Direção</div><div class="obs-boxes"><div class="ob hi">Dir. de Parceria</div></div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Relatórios de performance da equipe</div>
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Análises de mercado</div>
            </div>
          </div><div class="oarr">↓</div>` : ''}
          ${D.cargos.gerente?.existe ? `<div class="ol"><div class="olab">Gerência · Operadora DWV (lateral)</div>
            <div class="obs-boxes">
              ${Array(Math.min(D.cargos.gerente.qtd,10)).fill(0).map((_,i)=>'<div class="ob hi">Ger. '+(D.cargos.gerente.qtd>1?i+1:'Parceria')+'</div>').join('')}
              ${mktLevel}
              <div class="ob gn">Operadora DWV ↔ Gerentes</div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Definição de estratégias</div>
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Relatórios gerenciais</div>
              ${!D.cargos.diretor?.existe ? '<div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Relatórios de performance da equipe</div><div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Análises de mercado</div>' : ''}
            </div>
          </div>` : (!D.cargos.diretor?.existe && !D.cargos.gerente?.existe) ? `<div class="ol"><div class="olab">Responsável · Operadora DWV (lateral)</div>
            <div class="obs-boxes">
              <div class="ob hi">${D.responsibleName || 'Responsável'}</div>
              ${mktLevel}
              <div class="ob gn">Operadora DWV ↔</div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Relatórios de performance da equipe</div>
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Análises de mercado</div>
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Definição de estratégias</div>
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Relatórios gerenciais</div>
            </div>
          </div>` : `<div class="ol"><div class="olab">Gerência · Operadora DWV (lateral)</div>
            <div class="obs-boxes">
              ${mktLevel}
              <div class="ob gn">Operadora DWV</div>
            </div>
          </div>`}
          ${D.cargos.executivo?.existe?`
          <div class="oarr">↓</div>
          <div class="ol"><div class="olab">Executivos · Suporte Operadora</div>
            <div class="obs-boxes">${Array(Math.min(D.cargos.executivo.qtd,10)).fill(0).map((_,i)=>'<div class="ob">Exec. '+(i+1)+'</div>').join('')}<div class="ob gn">Suporte Op.</div></div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Organização de carteiras</div>
              <div class="badge" style="background:rgba(58,184,122,0.1);border-color:rgba(58,184,122,0.3);color:var(--gr);font-size:10px">Ativações</div>
            </div>
          </div>`:''}
          <div class="oarr">↓</div>
          <div class="ol"><div class="olab">Base Segmentada pela DWV</div>
            <div class="obs-boxes">
              <div class="ob go">Ouro — já venderam</div>
              <div class="ob si">Prata — engajados</div>
              <div class="ob br">Bronze — inativos</div>
            </div>
          </div>
        </div>

        <div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px 16px;margin:14px 0">
          <div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;font-weight:500">Entregas DWV por nível</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">
            ${D.cargos.diretor?.existe ? '<strong style="color:#fff">Diretor:</strong> Relatórios de performance da equipe, Análises de mercado<br/>' : ''}
            ${D.cargos.gerente?.existe ? '<strong style="color:#fff">Gerente:</strong> Definição de estratégias, Relatórios gerenciais' + (!D.cargos.diretor?.existe ? ', Relatórios de performance da equipe, Análises de mercado' : '') + '<br/>' : ''}
            ${!D.cargos.diretor?.existe && !D.cargos.gerente?.existe ? '<strong style="color:#fff">' + (D.responsibleName || 'Responsável') + ':</strong> Relatórios de performance, Análises de mercado, Definição de estratégias, Relatórios gerenciais<br/>' : ''}
            ${D.cargos.executivo?.existe ? '<strong style="color:#fff">Executivo:</strong> Organização de carteiras, Ativações' : ''}
          </div>
        </div>

        <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin:20px 0 10px">Fluxo com Operadora DWV</div>
        <div class="flow">
          <div class="fs hi"><div class="ft">Captação</div><div class="fd">Meta Ads → CRM DWV. Rastreada.</div></div><div class="farr">→</div>
          <div class="fs hi"><div class="ft">Classificação</div><div class="fd">Bronze/Prata/Ouro automático.</div></div><div class="farr">→</div>
          <div class="fs hi"><div class="ft">Ativação</div><div class="fd">WhatsApp API + e-mail + Stories.</div></div><div class="farr">→</div>
          <div class="fs hi"><div class="ft">Proposta</div><div class="fd">Rastreada em tempo real.</div></div><div class="farr">→</div>
          <div class="fs hi"><div class="ft">BI Completo</div><div class="fd">Exec / Gerente / Diretoria.</div></div>
        </div>

        <div class="cl" style="margin-top:14px">A Operadora DWV não é subordinada — atua <strong>lateralmente</strong> com gerentes e diretores, entregando inteligência de dados que hoje não existe no canal.</div>
      </div>
    </div>

    <!-- 6: FERRAMENTAS -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>6 · Tecnologia e Ferramentas</h3><div class="dhr"><span class="dtag">${r.nTools} desconectadas</span><span class="chev">▾</span></div></div>
      <div class="dbody">
        ${!D.hasCRM?'<div class="cl" style="margin-bottom:12px">Sem CRM voltado para parceiros. Canal opera sem rastreamento de ações por corretor.</div>':`<div style="font-size:13px;color:var(--mu);margin-bottom:12px">CRM em uso: <strong style="color:#fff">${D.crmName||'não especificado'}</strong> — focado em contratos, não em gestão de corretores.</div>`}
        <div class="badges">${allToolBadges}</div>
        ${r.totalToolCost>0?`<div style="font-size:13px;color:var(--mu);margin-top:12px">Custo anual estimado com essas ferramentas: <strong style="color:#fff">${fmt(r.totalToolCost)}</strong></div>`:''}
        <div class="cl" style="margin-top:12px">A DWV substitui <strong>${r.nTools} ferramentas desconectadas</strong> em um único ambiente integrado — WhatsApp API, e-mail com rastreio, CRM de parceiros, eventos com QR, tráfego pago e BI completo.</div>
      </div>
    </div>

    <!-- 7: INDICADORES OPERACIONAIS -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>7 · Indicadores Operacionais</h3><div class="dhr"><span class="dtag a">Visão operacional</span><span class="chev">▾</span></div></div>
      <div class="dbody">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
          ${r.corretoresPorExec !== null ? `<div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Corretores por Executivo</div>
            <div style="font-size:26px;font-weight:500;color:var(--red)">${fmtN(r.corretoresPorExec)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">${fmtN(D.totalBrokers)} corretores / ${D.cargos.executivo.qtd} executivos</div>
          </div>` : ''}

          ${r.custoCorretorAtivo !== null ? `<div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Custo por Corretor Ativo</div>
            <div style="font-size:26px;font-weight:500;color:var(--red)">${fmt(r.custoCorretorAtivo)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">${fmt(r.totalToolCost)} / ${fmtN(D.activeBrokers)} ativos</div>
          </div>` : ''}

          <div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Ociosidade da Base</div>
            <div style="font-size:26px;font-weight:500;color:var(--red)">${fmtP(r.ociosidade)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">${fmtN(r.corretoresOciosos)} corretores inativos</div>
          </div>

          ${r.unidadesParaMeta !== null ? `<div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Unidades p/ Atingir Meta</div>
            <div style="font-size:26px;font-weight:500;color:var(--am)">${fmtN(r.unidadesParaMeta)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">Gap ${fmt(r.gap)} / Ticket ${fmt(D.avgTicket)}</div>
          </div>` : ''}

          ${D.numEmpreendimentos > 0 ? `<div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Empreendimentos Ativos</div>
            <div style="font-size:26px;font-weight:500;color:#fff">${D.numEmpreendimentos}</div>
            <div style="font-size:10px;color:var(--mu);margin-top:4px">${D.numPreLancamento?D.numPreLancamento+' pré-lanç':''}${D.numPreLancamento&&D.numLancamento?' · ':''}${D.numLancamento?D.numLancamento+' lanç':''}${(D.numPreLancamento||D.numLancamento)&&D.numEstoque?' · ':''}${D.numEstoque?D.numEstoque+' estoque':''}</div>
            ${D.focoVendas?'<div style="font-size:10px;color:var(--am);margin-top:2px">Foco: '+D.focoVendas+'</div>':''}
          </div>` : ''}

          ${D.totalImoveisVenda > 0 ? `<div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Imóveis à Venda</div>
            <div style="font-size:26px;font-weight:500;color:#fff">${fmtN(D.totalImoveisVenda)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">unidades disponíveis</div>
          </div>` : ''}

          ${D.propostasMensais > 0 ? `<div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Propostas / mês</div>
            <div style="font-size:26px;font-weight:500;color:var(--am)">${fmtN(D.propostasMensais)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">${D.fechamentosMensais} fechamentos${r.taxaConversao!==null?' · '+fmtP(r.taxaConversao)+' conversão':''}</div>
          </div>` : ''}

          <div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Eventos / Treinamentos</div>
            <div style="font-size:20px;font-weight:500;color:${D.hasEventos === 'sim_frequente' ? 'var(--gr)' : D.hasEventos === 'sim_esporadico' ? 'var(--am)' : 'var(--red)'}">${D.hasEventos === 'sim_frequente' ? 'Frequente' : D.hasEventos === 'sim_esporadico' ? 'Esporádico' : 'Não realiza'}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">${D.hasEventos === 'nao' || !D.hasEventos ? 'oportunidade DWV' : ''}</div>
          </div>
        </div>

        ${r.totalToolCost > 5000 ? `
        <div style="background:rgba(58,184,122,0.06);border:.5px solid rgba(58,184,122,0.15);border-radius:10px;padding:16px 18px;margin-bottom:12px">
          <div style="font-size:11px;color:var(--gr);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;font-weight:500">Projeção: custo por corretor ativo com a DWV</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--mu);margin-bottom:4px">Hoje (${fmtN(D.activeBrokers)} ativos)</div>
              <div style="font-size:20px;font-weight:500;color:var(--red)">${fmt(r.custoCorretorAtivo)}</div>
              <div style="font-size:11px;color:var(--mu)">por corretor/ano</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--mu);margin-bottom:4px">Meta DWV (${fmtN(r.nc)} ativos)</div>
              <div style="font-size:20px;font-weight:500;color:var(--am)">${fmt(r.custoCorretorAtivoMeta)}</div>
              <div style="font-size:11px;color:var(--mu)">por corretor/ano</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--mu);margin-bottom:4px">Redução</div>
              <div style="font-size:20px;font-weight:500;color:var(--gr)">-${r.reducaoCusto}%</div>
              <div style="font-size:11px;color:var(--mu)">no custo por ativo</div>
            </div>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:10px;line-height:1.6">Ao atingir a meta de engajamento com a DWV, o custo por corretor ativo cai de <strong style="color:#fff">${fmt(r.custoCorretorAtivo)}</strong> para <strong style="color:var(--gr)">${fmt(r.custoCorretorAtivoMeta)}</strong> — mais eficiência com o mesmo investimento em ferramentas.</div>
        </div>` : r.totalToolCost > 0 && r.totalToolCost <= 5000 ? `
        <div style="background:rgba(58,184,122,0.06);border:.5px solid rgba(58,184,122,0.15);border-radius:10px;padding:14px 16px;margin-bottom:12px">
          <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6">A DWV substitui ferramentas fragmentadas por uma plataforma unificada — o ganho é em <strong style="color:var(--gr)">produtividade</strong>, não em economia.</div>
        </div>` : `
        <div style="background:rgba(58,184,122,0.06);border:.5px solid rgba(58,184,122,0.15);border-radius:10px;padding:14px 16px;margin-bottom:12px">
          <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6">A incorporadora não possui ferramentas dedicadas ao canal de parcerias — a DWV será a <strong style="color:var(--gr)">primeira plataforma integrada</strong> para gestão do canal.</div>
        </div>`}

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
          <div class="badge" style="background:rgba(224,160,32,0.1);border-color:rgba(224,160,32,0.3);color:var(--am)">Programa de incentivo: ${D.hasIncentivo === 'yes' ? 'Sim' : 'Não possui'}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${D.concorrente ? `<div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px 16px">
            <div style="font-size:10px;color:var(--am);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;font-weight:500">Principal concorrente na região</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.65">${D.concorrente}</div>
          </div>` : ''}
          ${D.expectativa12m ? `<div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px 16px">
            <div style="font-size:10px;color:var(--am);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;font-weight:500">Expectativa com a DWV em 12 meses</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.65">${D.expectativa12m}</div>
          </div>` : ''}
        </div>
      </div>
    </div>

    <!-- 8: ROI — lógica de corretores -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>8 · Retorno sobre Investimento DWV</h3><div class="dhr"><span class="dtag g">${fmtN(r.corretoresAdicionar)} corretores · ${fmt(r.retornoTotal)}</span><span class="chev">▾</span></div></div>
      <div class="dbody">

        <div class="g2" style="margin-bottom:16px">
          <div>
            <div style="font-size:11px;color:var(--mu);margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em">Plano com Operadora DWV</div>
            <div style="font-size:22px;font-weight:500">${fmt(r.planoAnual)}<span style="font-size:13px;color:var(--mu);font-weight:400">/ano</span></div>
            <div style="font-size:13px;color:var(--mu);margin-top:3px">12x ${fmt(r.planoMensal)}/mês</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--mu);margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em">VGV por corretor ativado</div>
            <div style="font-size:22px;font-weight:500;color:var(--red)">${fmt(r.vgvPorCorretor)}</div>
            <div style="font-size:13px;color:var(--mu);margin-top:3px">produtividade média atual</div>
          </div>
        </div>

        <div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:16px 18px;margin-bottom:14px">
          <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Meta da DWV — corretores a ativar</div>
          <div style="font-size:13px;line-height:1.8;color:rgba(255,255,255,0.85)">
            A incorporadora precisa ativar <strong>${fmtN(r.corretoresAdicionar)} corretores</strong> para atingir a meta de VGV.<br/>
            Cada corretor ativado gera em média <strong>${fmt(r.vgvPorCorretor)}</strong> em VGV.<br/>
            ${corMinTxt}<br/>
            ${retornoTotalTxt}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Corretores p/ pagar o plano</div>
            <div style="font-size:26px;font-weight:500;color:var(--red)">${r.corretoresParaPagarPlano!==null?r.corretoresParaPagarPlano:'—'}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">ponto de equilíbrio</div>
          </div>
          <div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Meta de ativações DWV</div>
            <div style="font-size:26px;font-weight:500;color:var(--am)">${fmtN(r.corretoresAdicionar)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">corretores a engajar</div>
          </div>
          <div style="background:var(--s2);border:.5px solid var(--b);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:11px;color:var(--mu);margin-bottom:6px">Retorno se meta atingida</div>
            <div style="font-size:18px;font-weight:500;color:var(--gr)">${fmt(r.retornoTotal)}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:4px">em VGV adicional</div>
          </div>
        </div>

        ${r.totalToolCost>0?`<div style="font-size:13px;color:var(--mu);padding:10px 13px;background:rgba(58,184,122,0.06);border:.5px solid rgba(58,184,122,0.15);border-radius:8px;margin-bottom:12px">Economia adicional ao consolidar ${r.nTools} ferramentas na DWV: <strong style="color:var(--gr)">${fmt(r.totalToolCost)}/ano</strong></div>`:''}

        <div class="cl g">
          ${rptLabels.length>0?`Relatórios desejados pelo cliente — <strong>${rptLabels.join(', ')}</strong> — todos disponíveis na plataforma DWV.<br/><br/>`:''}
          ${D.tabelaZero?`Com <strong>Tabela Zero</strong> (acesso: ${tzTxt}), a DWV potencializa a fidelização dos corretores Ouro, que têm acesso antecipado ao produto — aumentando a produtividade por corretor ativo.`:''}
        </div>
      </div>
    </div>

    <!-- 9: DORES, SEGMENTAÇÃO E RELATÓRIOS -->
    <div class="db"><div class="dh" onclick="tog(this)"><h3>9 · Dores, Segmentação e Relatórios</h3><div class="dhr"><span class="dtag a">Canal de Parcerias</span><span class="chev">▾</span></div></div>
      <div class="dbody">

        <!-- Principais Desafios -->
        ${chalLabels.length>0?`<div style="margin-bottom:16px">
          <div style="font-size:11px;color:var(--red);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;font-weight:500">Principais desafios no canal de parcerias</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${chalLabels.map(l=>'<div class="badge hi">'+l+'</div>').join('')}
          </div>
          ${D.challengesText?'<div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px 16px;margin-top:10px"><div style="font-size:10px;color:var(--am);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;font-weight:500">Contexto descrito pelo cliente</div><div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.65">'+D.challengesText+'</div></div>':''}
        </div>`:''}

        <!-- Segmentação -->
        <div style="margin-bottom:16px">
          <div style="font-size:11px;color:var(--red);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;font-weight:500">Segmentação dos corretores da base</div>
          <div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px 16px">
            <div style="font-size:15px;font-weight:500;color:${{nao:'var(--red)',nao_gostaria:'var(--am)',sim_parcial:'var(--am)',sim_total:'var(--gr)'}[D.brokerSegmentation]||'var(--mu)'}">${{nao:'Não segmenta',nao_gostaria:'Não, mas gostaria de segmentar',sim_parcial:'Sim, parcialmente',sim_total:'Sim, totalmente'}[D.brokerSegmentation]||'Não informado'}</div>
            ${D.brokerSegDescritivo?'<div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:8px;line-height:1.6">'+D.brokerSegDescritivo+'</div>':''}
          </div>
        </div>

        <!-- Relatórios desejados -->
        ${rptLabels.length>0||D.desiredReportsDescritivo?`<div style="margin-bottom:16px">
          <div style="font-size:11px;color:var(--gr);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;font-weight:500">Relatórios mais desejados sobre o canal de parcerias</div>
          ${rptLabels.length>0?'<ul style="margin:0 0 10px 16px;padding:0">'+rptLabels.map(l=>'<li style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.7;list-style:disc">'+l+'</li>').join('')+'</ul>':''}
          ${D.desiredReportsDescritivo?'<div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px 16px"><div style="font-size:10px;color:var(--gr);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;font-weight:500">Observações do cliente</div><div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.65">'+D.desiredReportsDescritivo+'</div></div>':''}
          <div style="font-size:13px;color:var(--gr);margin-top:10px;font-weight:500">Todos disponíveis na plataforma DWV.</div>
        </div>`:''}

        <!-- Ações testadas -->
        ${D.testedActions===true&&D.testedResults?`<div>
          <div style="font-size:11px;color:var(--am);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;font-weight:500">Ações já testadas pelo cliente</div>
          <div style="background:var(--s);border:.5px solid rgba(224,160,32,0.25);border-radius:10px;padding:14px 16px">
            <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.65">${D.testedResults}</div>
          </div>
        </div>`:''}
      </div>
    </div>

    <div class="acts">
      <button class="bto" onclick="window.location.href='/diagnostico/dashboard'">← Dashboard</button>
      <button class="bto" onclick="openAll()">Expandir Tudo</button>
      <button class="btr" onclick="generatePDF()">⬇ Baixar PDF</button>
    </div>`;

  document.querySelector('#results .dbody')?.classList.add('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

function tog(h){const b=h.nextElementSibling;const c=h.querySelector('.chev');const o=b.classList.contains('open');b.classList.toggle('open',!o);if(c)c.classList.toggle('o',!o);}
function openAll(){document.querySelectorAll('.dbody').forEach(b=>b.classList.add('open'));}

// ── DASHBOARD ─────────────────────────────────────────────────
async function showDashboard(){
  document.getElementById('startScreen').style.display='none';
  document.getElementById('formWrap').style.display='none';
  document.getElementById('results').style.display='none';
  const dash=document.getElementById('dashboard');
  dash.style.display='block';
  const records=(await loadDB()).filter(r=>!r.isSim);
  if(records.length===0){
    dash.innerHTML=`
      <button class="bto" style="margin-bottom:20px" onclick="window.location.href='/diagnostico/dashboard'">← Voltar ao Dashboard</button>
      <div style="font-size:20px;font-weight:500;margin-bottom:20px">Painel Consolidado</div>
      <div class="dash-card"><div class="empty-state">Nenhum diagnóstico real salvo ainda.<br/><span style="font-size:12px">Complete um diagnóstico para vê-lo aqui.</span></div></div>`;
    return;
  }
  const N=records.length;
  const avgTE=records.reduce((a,r)=>a+(r.results?.te||0),0)/N;
  const avgDC=records.reduce((a,r)=>a+(r.results?.dc||0),0)/N;
  const withTZ=records.filter(r=>r.tabelaZero).length;
  const withCRM=records.filter(r=>r.hasCRM).length;
  const withHouse=records.filter(r=>r.hasHouse).length;
  const totalGap=records.reduce((a,r)=>a+(r.results?.gap||0),0);
  const toolFreq={};TOOLS_DEF.forEach(t=>{toolFreq[t.k]=records.filter(r=>r[t.k]).length;});
  const topTools=TOOLS_DEF.map(t=>({l:t.l,n:toolFreq[t.k]})).sort((a,b)=>b.n-a.n).filter(t=>t.n>0);
  const chalFreq={};Object.keys(CHAL_LABELS).forEach(k=>{chalFreq[k]=records.filter(r=>(r.challenges||[]).includes(k)).length;});
  const topChals=Object.entries(chalFreq).map(([k,n])=>({l:CHAL_LABELS[k],n})).sort((a,b)=>b.n-a.n).filter(t=>t.n>0).slice(0,8);
  const tzAccess={house:0,canal_parcerias:0,imobiliarias:0,todos:0};
  records.filter(r=>r.tabelaZero).forEach(r=>(r.tabelaZeroAccess||[]).forEach(k=>{if(tzAccess[k]!==undefined)tzAccess[k]++;}));

  dash.innerHTML=`
    <button class="bto" style="margin-bottom:20px" onclick="window.location.href='/diagnostico/dashboard'">← Voltar ao Dashboard</button>
    <div style="font-size:20px;font-weight:500;margin-bottom:20px">Painel Consolidado · ${N} Incorporadora${N>1?'s':''}</div>
    <div class="agg-grid">
      <div class="agg-card"><div class="agg-l">TE Média</div><div class="agg-v" style="color:${avgTE<15?'var(--red)':avgTE<30?'var(--am)':'var(--gr)'}">${fmtP(avgTE)}</div></div>
      <div class="agg-card"><div class="agg-l">DC Médio</div><div class="agg-v">${avgDC.toFixed(2)}/M</div></div>
      <div class="agg-card"><div class="agg-l">Com Tabela Zero</div><div class="agg-v">${withTZ} / ${N}</div></div>
      <div class="agg-card"><div class="agg-l">Com CRM parceiros</div><div class="agg-v">${withCRM} / ${N}</div></div>
      <div class="agg-card"><div class="agg-l">Com Canal House</div><div class="agg-v">${withHouse} / ${N}</div></div>
      <div class="agg-card"><div class="agg-l">Gap total de VGV</div><div class="agg-v" style="font-size:14px;color:var(--red)">${fmt(totalGap)}</div></div>
    </div>
    <div class="dash-card">
      <h3>Incorporadoras diagnosticadas</h3>
      <div style="overflow-x:auto">
      <table class="dt">
        <thead><tr><th>Empresa</th><th>Local</th><th>TE</th><th>DC/M</th><th>Ativos/Total</th><th>Gap VGV</th><th>House</th><th>Tab. Zero</th><th>CRM</th></tr></thead>
        <tbody>${records.map(r=>{
          const te=r.results?.te||0;const tc=te<15?'r':te<30?'a':'g';
          const tzA=(r.tabelaZeroAccess||[]).map(k=>({house:'House',parcerias:'H+P',imobiliarias:'Imob.',todos:'Todos'}[k]||k)).join(', ');
          return`<tr>
            <td><div class="co-name">${r.companyName||'—'}</div><div class="co-sub">${r.responsibleName||''}</div></td>
            <td style="font-size:11px;color:var(--mu)">${r.location||'—'}</td>
            <td><span class="te-pill ${tc}">${fmtP(te)}</span></td>
            <td style="font-size:12px">${(r.results?.dc||0).toFixed(2)}</td>
            <td style="font-size:12px">${fmtN(r.activeBrokers)} / ${fmtN(r.totalBrokers)}<div class="bar-wrap"><div class="bar-fill" style="width:${Math.min(te,100)}%;background:${te<15?'var(--red)':te<30?'var(--am)':'var(--gr)'}"></div></div></td>
            <td style="font-size:12px;color:var(--red)">${fmt(r.results?.gap||0)}</td>
            <td style="font-size:11px">${r.hasHouse?'✓':'—'}</td>
            <td style="font-size:11px">${r.tabelaZero?'✓ '+tzA:'—'}</td>
            <td style="font-size:11px">${r.hasCRM?r.crmName||'Sim':'—'}</td>
          </tr>`;}).join('')}
        </tbody>
      </table>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      <div class="dash-card"><h3>Ferramentas mais utilizadas</h3>
        <div class="tool-rank">${topTools.map(t=>`
          <div class="tool-row-d">
            <div class="tool-label">${t.l}</div>
            <div class="tool-bar-wrap"><div class="tool-bar" style="width:${Math.round(t.n/N*100)}%"></div></div>
            <div class="tool-count">${t.n}/${N}</div>
          </div>`).join('')}</div>
      </div>
      <div class="dash-card"><h3>Principais desafios declarados</h3>
        <div class="chal-grid">${topChals.map(c=>`
          <div class="chal-row">
            <div class="chal-label">${c.l}</div>
            <div class="chal-bar-wrap"><div class="chal-bar" style="width:${Math.round(c.n/N*100)}%"></div></div>
            <div class="chal-count">${c.n}</div>
          </div>`).join('')}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="dash-card"><h3>Segmentação de corretores</h3>
        <div class="seg-grid">
          <div class="seg-card"><div class="seg-v" style="color:var(--red)">${records.filter(r=>r.brokerSegmentation==='nao').length}</div><div class="seg-l">Não segmentam</div></div>
          <div class="seg-card"><div class="seg-v" style="color:var(--am)">${records.filter(r=>r.brokerSegmentation==='sim_parcial').length}</div><div class="seg-l">Sim, parcialmente</div></div>
          <div class="seg-card"><div class="seg-v" style="color:var(--gr)">${records.filter(r=>r.brokerSegmentation==='sim_total').length}</div><div class="seg-l">Sim, totalmente</div></div>
        </div>
      </div>
      <div class="dash-card"><h3>Tabela Zero · quem absorve</h3>
        <div class="tz-rows">${Object.entries(TZ_LABELS).map(([k,l])=>`
          <div class="tz-row">
            <div class="tz-label">${l}</div>
            <div class="tz-bar-wrap"><div class="tz-bar" style="width:${withTZ>0?Math.round((tzAccess[k]||0)/withTZ*100):0}%"></div></div>
            <div class="tz-count">${tzAccess[k]||0}/${withTZ}</div>
          </div>`).join('')}</div>
      </div>
    </div>`;
}

// ── PDF ───────────────────────────────────────────────────────
function generatePDF(){
  const r=calc();
  const chalTxt=D.challenges.map(k=>CHAL_LABELS[k]||k).join(', ')||'Não informado';
  const rptTxt=D.desiredReports.map(k=>RPT_LABELS[k]||k).join(', ')||'Não informado';
  const toolRows=TOOLS_DEF.filter(t=>D[t.k]).map(t=>`<tr><td>${t.l}</td><td>${D.toolCosts[t.k]?fmt(D.toolCosts[t.k])+'/mês':'—'}</td><td>${D.toolCosts[t.k]?fmt(D.toolCosts[t.k]*12)+'/ano':'—'}</td></tr>`).join('');
  const tzTxt=D.tabelaZero?D.tabelaZeroAccess.map(k=>TZ_LABELS[k]).join(', '):'Não utiliza';
  const segTxt={nao:'Não segmenta',nao_gostaria:'Não, mas gostaria de segmentar',sim_parcial:'Sim, parcialmente',sim_total:'Sim, totalmente'}[D.brokerSegmentation]||'Não informado';
  const teColor=r.te<15?'#E8392A':r.te<30?'#e0a020':'#2e9e60';
  const teLabel=r.te<15?'Crítica':r.te<30?'Regular':'Boa';
  const nTools=TOOLS_DEF.filter(t=>D[t.k]).length+(!D.hasCRM?1:0);
  const corMinTxt=r.corretoresParaPagarPlano!==null
    ?(r.corretoresParaPagarPlano===1
      ?'Com apenas <strong>1 corretor</strong> ativado, o investimento já se paga.'
      :`Com apenas <strong>${r.corretoresParaPagarPlano} corretores</strong> ativados, o investimento já se paga.`)
    :'';

  // Org boxes - apenas parcerias
  const parcBoxesPDF=Array(Math.max(D.parcManagers,0)).fill(0).map((_,i)=>`<div class="rob hi">Ger. Parceria ${D.parcManagers>1?i+1:''}</div>`).join('');
  const execBoxesPDF=Array(Math.min(D.parcExecutives,8)).fill(0).map((_,i)=>`<div class="rob">Exec. ${i+1}</div>`).join('');

  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Diagnóstico DWV — ${D.companyName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111;background:#fff;padding:28px;font-size:12px;line-height:1.55}
h1{font-size:18px;font-weight:700}
h2{font-size:11px;font-weight:700;margin:16px 0 7px;color:#E8392A;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #f0d0ce;padding-bottom:4px}
.sim-w{background:#fff8e1;border:1px solid #f9c12a;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#7a5c00;font-weight:600}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #E8392A;padding-bottom:12px;margin-bottom:16px}
.logo-b{background:#E8392A;border-radius:7px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;flex-shrink:0}
.kpis{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:14px}
.kpi{background:#f7f7f7;border-radius:7px;padding:10px;border-left:3px solid #E8392A}
.kl{font-size:10px;color:#777;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}.kv{font-size:16px;font-weight:700;color:#E8392A}.ks{font-size:10px;color:#999;margin-top:2px}
.box{margin-bottom:12px;padding:12px 14px;background:#f9f9f9;border-radius:7px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:10px 0}
.routes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:8px 0}
.route{background:#fff;border:1px solid #ddd;border-radius:6px;padding:9px}
.rn{font-size:10px;color:#E8392A;text-transform:uppercase;font-weight:700;margin-bottom:3px}
.rv{font-size:15px;font-weight:700;color:#E8392A}.rd{font-size:10px;color:#888;margin-top:3px}
table{width:100%;border-collapse:collapse;margin:6px 0;font-size:11px}
th{text-align:left;padding:6px 8px;background:#E8392A;color:#fff;font-weight:600}
td{padding:6px 8px;border-bottom:1px solid #eee}
tr:last-child td{border-bottom:none}tr:nth-child(even)td{background:#fafafa}
.fm{background:#f0f0f0;border-radius:4px;padding:6px 10px;font-family:monospace;font-size:11px;margin:5px 0 10px;color:#444}
.hl{background:#fef3f2;border:1px solid #f5c6c2;border-radius:5px;padding:10px 12px;margin:8px 0}
.gl{background:#f0fdf4;border:1px solid #86efac;border-radius:5px;padding:12px 14px}
.roi-card{background:#fff;border:1px solid #ddd;border-radius:7px;padding:12px;text-align:center}
.roi-n{font-size:20px;font-weight:700;color:#E8392A;margin-bottom:3px}
.roi-l{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.org{margin:8px 0}.org-lev{margin-bottom:6px}.org-lab{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.rob-boxes{display:flex;gap:5px;flex-wrap:wrap}
.rob{background:#f0f0f0;border:1px solid #ddd;border-radius:5px;padding:3px 9px;font-size:11px}
.rob.hi{border-color:#E8392A;color:#E8392A;background:#fef3f2}
.rob.gn{border-color:#2e9e60;color:#2e9e60;background:#f0fdf4}
.rob.go{border-color:#c09000;color:#c09000;background:#fffbeb}
.rob.si{border-color:#999;color:#666}.rob.br{border-color:#a06030;color:#a06030}
.oarr{color:#bbb;font-size:11px;margin:2px 0 2px 6px}
.flow{display:flex;align-items:center;flex-wrap:wrap;gap:0;margin:8px 0}
.fstep{background:#fff;border:1px solid #ddd;border-radius:6px;padding:7px 9px;font-size:11px;flex:1;min-width:70px}
.fstep.red{border-color:#f5c6c2;background:#fef9f9}.fstep.gn{border-color:#86efac;background:#f0fdf4}
.ft{font-weight:700;font-size:11px;margin-bottom:2px}.fd{font-size:10px;color:#888;line-height:1.4}
.farr{color:#bbb;font-size:12px;padding:0 2px;flex-shrink:0;align-self:center}
.footer{margin-top:20px;padding-top:10px;border-top:1px solid #eee;font-size:10px;color:#aaa;text-align:center}
@media print{body{padding:16px}@page{margin:12mm;size:A4}}
</style></head><body>
${isSim?'<div class="sim-w">⚠ SIMULAÇÃO COM DADOS NÃO REAIS — Este diagnóstico não representa uma incorporadora real.</div>':''}
<div class="hdr">
  <div>
    <h1>Diagnóstico Comercial DWV</h1>
    <div style="font-size:11px;color:#666;margin-top:3px">${D.companyName} · ${D.cidade}/${D.estado} · Responsável: ${D.responsibleName}${D.responsibleRole?' ('+D.responsibleRole+')':''}</div>
    <div style="font-size:10px;color:#aaa;margin-top:2px">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}</div>
  </div>
  <div class="logo-b">DWV</div>
</div>

<h2>Resumo Executivo</h2>
<div class="kpis">
  <div class="kpi"><div class="kl">VGV Atual (12m)</div><div class="kv">${fmt(D.totalVGV)}</div><div class="ks">Canal parcerias</div></div>
  <div class="kpi"><div class="kl">Meta de VGV</div><div class="kv">${fmt(D.vgvGoal)}</div><div class="ks">Gap: ${fmt(r.gap)}</div></div>
  <div class="kpi"><div class="kl">Taxa de Engajamento</div><div class="kv" style="color:${teColor}">${fmtP(r.te)} · ${teLabel}</div><div class="ks">${fmtN(D.activeBrokers)} de ${fmtN(D.totalBrokers)}</div></div>
  <div class="kpi"><div class="kl">Corretores a Ativar</div><div class="kv">${fmtN(r.corretoresAdicionar)}</div><div class="ks">Meta da DWV</div></div>
</div>
<p style="font-size:12px;color:#444;line-height:1.65;margin-bottom:8px">
  A <strong>${D.companyName}</strong> possui <strong>${fmtN(D.totalBrokers)} corretores</strong> cadastrados, mas apenas <strong>${fmtN(D.activeBrokers)} (${fmtP(r.te)})</strong> realizaram vendas — engajamento <strong style="color:${teColor}">${teLabel.toLowerCase()}</strong>. Cada corretor ativo gera em média <strong>${fmt(r.vgvPorCorretor)}</strong> em VGV. A DWV precisa ativar mais <strong>${fmtN(r.corretoresAdicionar)} corretores</strong> para atingir a meta de <strong>${fmt(D.vgvGoal)}</strong>.
</p>

<h2>Fórmula de Aceleração</h2>
<div class="box">
  <strong>Taxa de Engajamento (TE)</strong><div class="fm">TE = (${fmtN(D.activeBrokers)} / ${fmtN(D.totalBrokers)}) × 100 = ${fmtP(r.te)}</div>
  <strong>Delta de Corretores por Milhão (DC)</strong><div class="fm">DC = ${fmtN(D.activeBrokers)} / (${fmt(D.totalVGV)} / 1M) = ${r.dc.toFixed(2)} corretores/M</div>
  <strong>Corretores Necessários para a Meta (NC)</strong><div class="fm">NC = (${fmt(D.vgvGoal)} / 1M) × ${r.dc.toFixed(2)} = ${fmtN(r.nc)} corretores ativos → ativar mais ${fmtN(r.corretoresAdicionar)}</div>
</div>

<h2>3 Rotas Estratégicas</h2>
<div class="routes">
  <div class="route"><div class="rn">Rota A · Engajamento</div><div class="rv">${fmtP(r.nteNeeded)}</div><div class="rd">Nova TE (hoje: ${fmtP(r.te)})</div></div>
  <div class="route"><div class="rn">Rota B · Crescer Base</div><div class="rv">${fmtN(r.nct)}</div><div class="rd">Corretores totais (hoje: ${fmtN(D.totalBrokers)})</div></div>
  <div class="route"><div class="rn">Rota C · Produtividade</div><div class="rv">${r.dcNovo.toFixed(2)}/M</div><div class="rd">DC necessário (hoje: ${r.dc.toFixed(2)}/M)</div></div>
</div>

<h2>Organograma · Canal Parcerias</h2>
<div class="box">
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Sem DWV</div>
  <div class="org">
    ${D.cargos.diretor?.existe?`<div class="org-lev"><div class="org-lab">Direção</div><div class="rob-boxes">${Array(D.cargos.diretor.qtd).fill(0).map((_,i)=>'<div class="rob hi">Dir. Parceria'+(D.cargos.diretor.qtd>1?' '+(i+1):'')+'</div>').join('')}</div>${D.cargos.diretor.kpi?'<div style="font-size:9px;color:#c09000;margin-top:2px">KPI: '+D.cargos.diretor.kpi+'</div>':''}</div><div class="oarr">↓</div>`:''}
    ${D.cargos.gerente?.existe||D.cargos.marketing?.existe?`<div class="org-lev"><div class="org-lab">Gerência / Marketing</div><div class="rob-boxes">${D.cargos.gerente?.existe?Array(D.cargos.gerente.qtd).fill(0).map((_,i)=>'<div class="rob hi">Ger. '+(D.cargos.gerente.qtd>1?(i+1):'Parceria')+'</div>').join(''):''}${D.cargos.marketing?.existe?'<div class="rob" style="border-color:#7c3aed;color:#7c3aed;background:#f5f3ff">Marketing'+(D.cargos.marketing.qtd>1?' ×'+D.cargos.marketing.qtd:'')+'</div>':''}</div>${D.cargos.gerente?.kpi?'<div style="font-size:9px;color:#c09000;margin-top:2px">KPI Gerente: '+D.cargos.gerente.kpi+'</div>':''}</div><div class="oarr">↓</div>`:''}
    ${D.cargos.executivo?.existe?`<div class="org-lev"><div class="org-lab">Executivos</div><div class="rob-boxes">${execBoxesPDF}</div>${D.cargos.executivo.kpi?'<div style="font-size:9px;color:#c09000;margin-top:2px">KPI: '+D.cargos.executivo.kpi+'</div>':''}</div><div class="oarr">↓</div>`:''}
    <div class="org-lev"><div class="org-lab">Base</div><div class="rob-boxes"><div class="rob">${fmtN(D.totalBrokers)} cadastrados</div><div class="rob hi">${fmtN(D.activeBrokers)} ativos (${fmtP(r.te)})</div>${D.hasImob?'<div class="rob">'+D.numImobiliarias+' imob. parceiras</div>':''}</div></div>
  </div>
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.05em;margin:10px 0 6px">Fluxo atual — canal cego</div>
  <div class="flow">
    <div class="fstep red"><div class="ft">Captação</div><div class="fd">Manual, sem rastreio</div></div><div class="farr">→</div>
    <div class="fstep red"><div class="ft">Cadastro</div><div class="fd">Planilha, sem segmentação</div></div><div class="farr">→</div>
    <div class="fstep red"><div class="ft">Comunicação</div><div class="fd">WhatsApp pessoal</div></div><div class="farr">→</div>
    <div class="fstep red"><div class="ft">Proposta</div><div class="fd">Sem visibilidade gerente</div></div><div class="farr">→</div>
    <div class="fstep red"><div class="ft">Resultado</div><div class="fd">Gerente vê só na mesa</div></div>
  </div>
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.05em;margin:10px 0 6px">Com Operadora DWV</div>
  <div class="org">
    ${D.cargos.diretor?.existe?`<div class="org-lev"><div class="org-lab">Direção</div><div class="rob-boxes"><div class="rob hi">Dir. de Parceria</div><div class="rob gn">Relatórios de performance</div><div class="rob gn">Análises de mercado</div></div></div><div class="oarr">↓</div>`:''}
    <div class="org-lev"><div class="org-lab">Gerência · Operadora DWV (lateral)</div><div class="rob-boxes">${D.cargos.gerente?.existe?Array(D.cargos.gerente.qtd).fill(0).map((_,i)=>'<div class="rob hi">Ger. '+(D.cargos.gerente.qtd>1?(i+1):'Parceria')+'</div>').join(''):''}${D.cargos.marketing?.existe?'<div class="rob" style="border-color:#7c3aed;color:#7c3aed;background:#f5f3ff">Marketing</div>':''}<div class="rob gn">Definição de estratégias</div><div class="rob gn">Relatórios gerenciais</div>${!D.cargos.diretor?.existe?'<div class="rob gn">Relatórios de performance</div><div class="rob gn">Análises de mercado</div>':''}</div></div>
    ${D.cargos.executivo?.existe?`<div class="oarr">↓</div><div class="org-lev"><div class="org-lab">Executivos + Suporte Operadora</div><div class="rob-boxes">${execBoxesPDF}<div class="rob gn">Organização de carteiras</div><div class="rob gn">Ativações</div></div></div>`:''}
    <div class="oarr">↓</div>
    <div class="org-lev"><div class="org-lab">Base Segmentada pela DWV</div><div class="rob-boxes"><div class="rob go">Ouro</div><div class="rob si">Prata</div><div class="rob br">Bronze</div></div></div>
  </div>
  <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.05em;margin:10px 0 6px">Fluxo com DWV</div>
  <div class="flow">
    <div class="fstep gn"><div class="ft">Captação</div><div class="fd">Meta Ads → CRM</div></div><div class="farr">→</div>
    <div class="fstep gn"><div class="ft">Classificação</div><div class="fd">Bronze/Prata/Ouro</div></div><div class="farr">→</div>
    <div class="fstep gn"><div class="ft">Ativação</div><div class="fd">WhatsApp API + e-mail</div></div><div class="farr">→</div>
    <div class="fstep gn"><div class="ft">Proposta</div><div class="fd">Rastreada em tempo real</div></div><div class="farr">→</div>
    <div class="fstep gn"><div class="ft">BI Completo</div><div class="fd">Exec/Gerente/Diretoria</div></div>
  </div>
</div>

<h2>Tecnologia e Ferramentas</h2>
<div class="box">
  <p><strong>CRM de parceiros:</strong> ${D.hasCRM?'Sim — '+D.crmName:'Não utiliza'}</p>
  ${toolRows?`<table style="margin-top:8px"><tr><th>Ferramenta</th><th>Custo mensal</th><th>Custo anual</th></tr>${toolRows}</table>`:''}
  ${r.totalToolCost>0?`<p style="margin-top:8px"><strong>Custo anual total com ferramentas desconectadas: ${fmt(r.totalToolCost)}</strong></p>`:''}
  <div class="hl" style="margin-top:8px">A DWV substitui <strong>${nTools} ferramentas desconectadas</strong> em um único ambiente integrado.</div>
</div>

<h2>Indicadores Operacionais</h2>
<div class="g3">
  ${r.corretoresPorExec!==null?`<div class="roi-card"><div class="roi-l">Corretores por Executivo</div><div class="roi-n">${fmtN(r.corretoresPorExec)}</div><div style="font-size:10px;color:#888">${fmtN(D.totalBrokers)} / ${D.cargos.executivo.qtd} exec.</div></div>`:''}
  ${r.custoCorretorAtivo!==null?`<div class="roi-card"><div class="roi-l">Custo / Corretor Ativo</div><div class="roi-n">${fmt(r.custoCorretorAtivo)}</div><div style="font-size:10px;color:#888">por ano</div></div>`:''}
  <div class="roi-card"><div class="roi-l">Ociosidade da Base</div><div class="roi-n">${fmtP(r.ociosidade)}</div><div style="font-size:10px;color:#888">${fmtN(r.corretoresOciosos)} inativos</div></div>
  ${r.unidadesParaMeta!==null?`<div class="roi-card"><div class="roi-l">Unidades p/ Meta</div><div class="roi-n" style="color:#e0a020">${fmtN(r.unidadesParaMeta)}</div><div style="font-size:10px;color:#888">Gap / Ticket médio</div></div>`:''}
  ${D.numEmpreendimentos>0?`<div class="roi-card"><div class="roi-l">Empreendimentos</div><div class="roi-n" style="color:#111">${D.numEmpreendimentos}</div><div style="font-size:10px;color:#888">${D.numPreLancamento?D.numPreLancamento+' pré-lanç':''}${D.numPreLancamento&&D.numLancamento?' · ':''}${D.numLancamento?D.numLancamento+' lanç':''}${(D.numPreLancamento||D.numLancamento)&&D.numEstoque?' · ':''}${D.numEstoque?D.numEstoque+' estoque':''}</div>${D.focoVendas?'<div style="font-size:10px;color:#c09000;margin-top:2px">Foco: '+D.focoVendas+'</div>':''}</div>`:''}
  ${D.propostasMensais>0?`<div class="roi-card"><div class="roi-l">Propostas / mês</div><div class="roi-n" style="color:#e0a020">${fmtN(D.propostasMensais)}</div><div style="font-size:10px;color:#888">${D.fechamentosMensais} fech.${r.taxaConversao!==null?' · '+fmtP(r.taxaConversao)+' conv.':''}</div></div>`:''}
</div>
${D.totalImoveisVenda>0?`<p style="font-size:11px;color:#666;margin-top:6px">Total de imóveis à venda: <strong>${fmtN(D.totalImoveisVenda)}</strong> unidades</p>`:''}
${r.custoCorretorAtivo!==null&&r.totalToolCost>5000?`<div class="gl" style="margin-top:8px"><p style="font-size:11px">Projeção com DWV: custo por ativo cai de <strong>${fmt(r.custoCorretorAtivo)}</strong> para <strong style="color:#2e9e60">${fmt(r.custoCorretorAtivoMeta)}</strong> (-${r.reducaoCusto}%) ao atingir meta de engajamento.</p></div>`:''}

<h2>Dores e Desafios</h2>
<div class="box">
  <p><strong>Desafios:</strong> ${chalTxt}</p>
  ${D.challengesText?`<p style="margin-top:6px"><strong>Contexto:</strong> ${D.challengesText}</p>`:''}
  ${D.testedActions&&D.testedResults?`<p style="margin-top:6px"><strong>Ações já testadas:</strong> ${D.testedResults}</p>`:''}
  <p style="margin-top:6px"><strong>Relatórios desejados:</strong> ${rptTxt}</p>
  ${D.desiredReportsDescritivo?`<p style="margin-top:4px;font-size:11px;color:#666"><em>${D.desiredReportsDescritivo}</em></p>`:''}
  <p style="margin-top:6px"><strong>Segmentação:</strong> ${{nao:'Não segmenta',nao_gostaria:'Não, mas gostaria',sim_parcial:'Sim, parcialmente',sim_total:'Sim, totalmente'}[D.brokerSegmentation]||'N/I'}${D.brokerSegDescritivo?' — '+D.brokerSegDescritivo:''}</p>
  <p style="margin-top:6px"><strong>Eventos/treinamentos:</strong> ${{sim_frequente:'Sim, com frequência',sim_esporadico:'Sim, esporádico',nao:'Não realiza'}[D.hasEventos]||'N/I'}</p>
  <p style="margin-top:4px"><strong>Programa de incentivo:</strong> ${D.hasIncentivo==='yes'?'Sim':'Não'}</p>
</div>

${D.concorrente||D.expectativa12m?`<h2>Mercado e Expectativas</h2>
<div class="box">
  ${D.concorrente?`<p><strong>Principal concorrente:</strong> ${D.concorrente}</p>`:''}
  ${D.expectativa12m?`<p style="margin-top:6px"><strong>Expectativa com a DWV em 12 meses:</strong> ${D.expectativa12m}</p>`:''}
</div>`:''}

<h2>Retorno sobre Investimento DWV</h2>
<div class="gl">
  <div class="g2" style="margin-bottom:12px">
    <div>
      <div style="font-size:10px;color:#555;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">Plano com Operadora DWV</div>
      <div style="font-size:16px;font-weight:700">${fmt(r.planoAnual)}/ano</div>
      <div style="font-size:11px;color:#888">12x ${fmt(r.planoMensal)}/mês</div>
    </div>
    <div>
      <div style="font-size:10px;color:#555;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">VGV por corretor ativado</div>
      <div style="font-size:16px;font-weight:700;color:#E8392A">${fmt(r.vgvPorCorretor)}</div>
      <div style="font-size:11px;color:#888">produtividade média atual</div>
    </div>
  </div>
  <div class="g3">
    <div class="roi-card"><div class="roi-l">Ponto de equilíbrio</div><div class="roi-n">${r.corretoresParaPagarPlano||'—'}</div><div style="font-size:11px;color:#888">corretores mínimos p/ pagar o plano</div></div>
    <div class="roi-card"><div class="roi-l">Meta da DWV</div><div class="roi-n" style="color:#e0a020">${fmtN(r.corretoresAdicionar)}</div><div style="font-size:11px;color:#888">corretores a ativar</div></div>
    <div class="roi-card"><div class="roi-l">Retorno se meta atingida</div><div class="roi-n" style="color:#2e9e60;font-size:16px">${fmt(r.retornoTotal)}</div><div style="font-size:11px;color:#888">em VGV adicional</div></div>
  </div>
  <p style="margin-top:12px;font-size:12px;line-height:1.65">${corMinTxt} Se a DWV conseguir ativar todos os <strong>${fmtN(r.corretoresAdicionar)} corretores necessários</strong>, o retorno é de <strong>${fmt(r.retornoTotal)}</strong> em VGV adicional.${r.totalToolCost>0?' Somando a economia de '+fmt(r.totalToolCost)+'/ano ao consolidar as ferramentas, o retorno total supera esse valor.':''}${D.tabelaZero?' Com Tabela Zero ('+tzTxt+'), corretores Ouro têm acesso antecipado — aumentando produtividade por ativo.':''}</p>
</div>

<h2>Equipe do Canal de Parcerias</h2>
<table>
  <tr><th>Cargo</th><th>Qtd</th><th>KPI</th><th>Atividades</th></tr>
  ${CARGOS_CANAL.filter(c=>D.cargos[c.id]?.existe).map(c=>`<tr><td style="font-weight:600">${c.nome}</td><td>${D.cargos[c.id].qtd}</td><td>${D.cargos[c.id].kpi||'—'}</td><td style="font-size:10px">${D.cargos[c.id].atividades||'—'}</td></tr>`).join('')}
</table>

<div style="margin-top:12px">
  <table><tr><th colspan="2">Estrutura · Canal Parcerias</th></tr>
    <tr><td>Exclusividade</td><td>${{exclusive:'Exclusivos','non-exclusive':'Não exclusivos',mixed:'Misto'}[D.brokersExclusivity]||'—'}</td></tr>
    <tr><td>Canais</td><td>${D.hasHouse?'House ('+D.shareHouse+'%)':''}${D.hasHouse&&D.hasParc?' · ':''}${D.hasParc?'Parcerias ('+D.shareParcerias+'%)':''}</td></tr>
    <tr><td>Imobiliárias parceiras</td><td>${D.hasImob?D.numImobiliarias+' imobiliárias':'Não'}</td></tr>
    <tr><td>Tabela Zero</td><td>${D.tabelaZero?'Sim — '+tzTxt:'Não'}</td></tr>
    ${D.tabelaZeroObs?`<tr><td>Obs. Tabela Zero</td><td>${D.tabelaZeroObs}</td></tr>`:''}
    ${D.crmContratoNome?`<tr><td>CRM de contratos</td><td>${D.crmContratoNome}</td></tr>`:''}
  </table>
</div>

${D.observations?`<h2>Observações</h2><div class="box">${D.observations}</div>`:''}
<div class="footer">DWV · Diagnóstico Comercial · Fórmula de Aceleração · dwvapp.com.br</div>
</body></html>`;

  const w=window.open('','_blank');
  if(!w){alert('Libere popups para gerar o PDF.');return;}
  w.document.write(html);w.document.close();
  setTimeout(()=>{w.focus();w.print();},600);
}

// ── POPULATE D FROM API RECORD ────────────────────────────────
function populateFromAPI(rec){
  resetD();
  // Reutiliza o mapeamento completo de mapAPItoV1 para garantir
  // que TODOS os campos (dores, tecnologia, tabela zero, etc.) apareçam no PDF
  const v1=mapAPItoV1(rec);
  Object.assign(D,v1);
  isSim=rec.isSimulacao||false;
}

// ── TUTORIAL ──────────────────────────────────────────────────
let _tutorialFrom='start'; // rastreia de onde veio para voltar corretamente

function showTutorial(){
  // Detecta seção visível para saber para onde voltar
  if(document.getElementById('results').style.display==='block') _tutorialFrom='results';
  else if(document.getElementById('formWrap').style.display==='block') _tutorialFrom='form';
  else if(document.getElementById('dashboard').style.display==='block') _tutorialFrom='dashboard';
  else _tutorialFrom='start';

  document.getElementById('startScreen').style.display='none';
  document.getElementById('formWrap').style.display='none';
  document.getElementById('results').style.display='none';
  document.getElementById('dashboard').style.display='none';

  const tut=document.getElementById('tutorial');
  tut.style.display='block';

  // Gera a data de atualização do sistema a partir de constantes-chave
  const sysVersion=`PLANO_ANUAL=${PLANO_ANUAL} | STEPS=${STEPS.length} | TOOLS=${TOOLS_DEF.length} | CHAL=${Object.keys(CHAL_LABELS).length}`;

  // Constrói as etapas dinamicamente de STEPS
  const stepsHtml=STEPS.map((s,i)=>`
    <div class="tut-step">
      <div class="tut-step-num">${s.tag}</div>
      <div class="tut-step-ttl">${s.title}</div>
      <div class="tut-step-desc">${s.desc}</div>
    </div>`).join('');

  // Ferramentas de TOOLS_DEF
  const toolsHtml=TOOLS_DEF.map(t=>`<div class="tut-tool">${t.l}</div>`).join('');

  // Desafios de CHAL_LABELS
  const chalsHtml=Object.values(CHAL_LABELS).map(l=>`<div class="tut-chal">${l}</div>`).join('');

  // Relatórios de RPT_LABELS
  const rptsHtml=Object.values(RPT_LABELS).map(l=>`<li style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7;list-style:disc;margin-left:14px">${l}</li>`).join('');

  // Cargos de CARGOS_CANAL
  const cargosHtml=CARGOS_CANAL.map(c=>`<div class="tut-chal">${c.nome} <span style="color:var(--mu);font-size:10px">(Nível ${c.nivel})</span></div>`).join('');

  // Seções do relatório (fixas mas com valores dinâmicos onde aplicável)
  const reportSections=[
    ['Resumo Executivo','KPIs: VGV atual, meta, taxa de engajamento, corretores a ativar. Responsável, canais, badges de contexto e parágrafo de diagnóstico.','Leitura rápida do estado do canal. Os 4 KPIs do topo são o resumo da situação.'],
    ['1 · Taxa de Engajamento (TE)','Fórmula: TE = (ativos / total) × 100. Classifica o canal em Crítica (<15%), Regular (15–30%) ou Boa (>30%).','Termômetro central do canal. Quanto menor, maior o desperdício de base.'],
    ['2 · Delta de Corretores/M (DC)','DC = ativos / (VGV / 1M). Indica quantos corretores são necessários por R$ 1 milhão em VGV.','Índice de produtividade. O inverso é o VGV médio por corretor ativo — base do ROI.'],
    ['3 · Corretores para a Meta (NC)','NC = (meta / 1M) × DC. Número exato de ativos necessários para atingir o VGV meta.','A diferença entre NC e ativos atuais é a meta de ativação da DWV.'],
    ['4 · 3 Rotas Estratégicas','Rota A: aumentar TE. Rota B: crescer a base. Rota C: aumentar produtividade por corretor.','Apresenta os 3 caminhos com valores numéricos. A Rota A é sempre o foco da DWV.'],
    ['5 · Organograma e Fluxos','Mapa visual do canal sem DWV vs. com DWV. Inclui KPIs por cargo, fluxo de vendas e entregas DWV por nível.','Regra de cascata: entregas sobem para o nível disponível (Diretor → Gerente → Responsável).'],
    ['6 · Tecnologia e Ferramentas','Lista as ferramentas em uso, custo anual total e quantas a DWV substitui.','Custo zero = DWV será a primeira plataforma. Custo baixo = argumento de produtividade. Custo alto = argumento de economia.'],
    ['7 · Indicadores Operacionais','Corretores/executivo, custo/corretor ativo, ociosidade, unidades para meta, empreendimentos, propostas/fechamentos, eventos.','Seis métricas que traduzem a operação do canal em números concretos.'],
    ['8 · Retorno sobre Investimento','Plano DWV ('+new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2}).format(PLANO_ANUAL)+'/ano), ponto de equilíbrio em corretores, retorno total se meta atingida.','Com 1 corretor ativado o plano já se paga. Argumento central de fechamento.'],
    ['9 · Dores, Segmentação e Relatórios','Desafios declarados com contexto, nível de segmentação atual, relatórios desejados e ações já testadas.','Personaliza a proposta. Mostrar que a DWV entrega exatamente os relatórios pedidos é altamente convincente.'],
  ];
  const reportHtml=reportSections.map(([title,desc,tip])=>`
    <div class="tut-rpt-row">
      <div class="tut-rpt-hdr"><span>${title}</span></div>
      <div class="tut-rpt-body">
        <div style="margin-bottom:6px">${desc}</div>
        <div style="padding:7px 10px;background:rgba(58,184,122,0.06);border:.5px solid rgba(58,184,122,0.15);border-radius:6px;font-size:11px;color:rgba(255,255,255,0.55)">💡 ${tip}</div>
      </div>
    </div>`).join('');

  tut.innerHTML=`
    <div class="tut-hdr">
      <div>
        <div class="tut-title">Tutorial · Diagnóstico Comercial DWV</div>
        <div class="tut-sub">Fórmula de Aceleração · Canal de Parcerias</div>
      </div>
      <button class="bto" onclick="_backFromTutorial()">← Voltar</button>
    </div>

    <div class="tut-toc">
      <div class="tut-toc-title">Conteúdo</div>
      <ul class="tut-toc-list">
        <li><a href="#t1"><span class="tut-toc-num">01</span> O que é o Diagnóstico</a></li>
        <li><a href="#t2"><span class="tut-toc-num">02</span> As ${STEPS.length} etapas do formulário</a></li>
        <li><a href="#t3"><span class="tut-toc-num">03</span> Fórmula de Aceleração</a></li>
        <li><a href="#t4"><span class="tut-toc-num">04</span> As ${reportSections.length} seções do relatório</a></li>
        <li><a href="#t5"><span class="tut-toc-num">05</span> Ferramentas e desafios mapeados</a></li>
        <li><a href="#t6"><span class="tut-toc-num">06</span> Plano DWV e ROI</a></li>
        <li><a href="#t7"><span class="tut-toc-num">07</span> Exportação e fluxo pós-diagnóstico</a></li>
        <li><a href="#t8"><span class="tut-toc-num">08</span> Checklist do consultor</a></li>
      </ul>
    </div>

    <!-- 01 -->
    <a class="tut-sec-anchor" id="t1"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">01</div>
        <div><div class="tut-sec-ttl">O que é o Diagnóstico Comercial</div><div class="tut-sec-desc">Propósito, escopo e o que o sistema entrega.</div></div>
      </div>
      <p style="font-size:13px;color:rgba(255,255,255,0.75);line-height:1.75;margin-bottom:12px">
        O <strong>Diagnóstico Comercial DWV</strong> mapeia em profundidade o Canal de Parcerias de uma incorporadora — identificando gaps de engajamento, calculando o potencial de crescimento e apresentando as <strong>3 rotas estratégicas</strong> para atingir as metas de VGV. É a ferramenta de entrada da Operadora DWV no processo comercial.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px">
        <div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px">
          <div style="font-size:10px;color:var(--red);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Quem aplica</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8)">Equipe DWV em processo de prospecção ou onboarding de nova incorporadora</div>
        </div>
        <div style="background:var(--s);border:.5px solid var(--b);border-radius:10px;padding:14px">
          <div style="font-size:10px;color:var(--red);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Quem responde</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8)">Diretor ou Gerente de Parcerias da incorporadora, em reunião presencial ou remota</div>
        </div>
      </div>
      <div class="tut-callout amber">
        <strong>Modo Simulação:</strong> use para demonstrações, treinamento interno e apresentações. Diagnósticos de simulação ficam separados dos reais no Dashboard e identificados visualmente.
      </div>
    </div>

    <hr class="tut-divider"/>

    <!-- 02 -->
    <a class="tut-sec-anchor" id="t2"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">02</div>
        <div><div class="tut-sec-ttl">As ${STEPS.length} etapas do formulário</div><div class="tut-sec-desc">Progressivo — só avança quando os campos obrigatórios estão preenchidos.</div></div>
      </div>
      <div class="tut-steps">${stepsHtml}</div>
      <div class="tut-callout blue">
        <strong>Tempo estimado:</strong> 30–45 minutos. Campos com <span style="color:var(--red)">*</span> são obrigatórios. O relatório é gerado automaticamente ao concluir a etapa ${STEPS.length}.
      </div>
    </div>

    <hr class="tut-divider"/>

    <!-- 03 -->
    <a class="tut-sec-anchor" id="t3"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">03</div>
        <div><div class="tut-sec-ttl">Fórmula de Aceleração — as 3 métricas</div><div class="tut-sec-desc">Todo o diagnóstico é construído sobre três métricas interdependentes.</div></div>
      </div>

      <div class="tut-metric">
        <div class="tut-metric-name">① Taxa de Engajamento (TE) <span class="tut-tag r">Principal</span></div>
        <div class="tut-formula">TE = (Corretores ativos / Total de corretores) × 100</div>
        <div class="tut-metric-desc">Percentual da base que realizou pelo menos uma venda nos últimos 12 meses. Termômetro central do canal.</div>
        <div class="tut-levels">
          <div class="tut-lp r">Crítica — abaixo de 15%</div>
          <div class="tut-lp a">Regular — 15% a 30%</div>
          <div class="tut-lp g">Boa — acima de 30%</div>
        </div>
        <div class="tut-metric-ex"><strong style="color:var(--gr)">Exemplo:</strong> 58 ativos / 420 total × 100 = <strong style="color:var(--gr)">13,8% → Crítica</strong></div>
      </div>

      <div class="tut-metric">
        <div class="tut-metric-name">② Delta de Corretores/M (DC) <span class="tut-tag a">Produtividade</span></div>
        <div class="tut-formula">DC = Corretores ativos / (VGV atual / R$ 1.000.000)</div>
        <div class="tut-metric-desc">Corretores necessários para gerar R$ 1M em VGV. O inverso (1/DC) é o VGV médio por corretor ativo — base do cálculo de ROI.</div>
        <div class="tut-metric-ex"><strong style="color:var(--gr)">Exemplo:</strong> 58 / (48M / 1M) = <strong style="color:var(--gr)">1,21 corr/M → R$ 827.586/corretor</strong></div>
      </div>

      <div class="tut-metric">
        <div class="tut-metric-name">③ Corretores para a Meta (NC) <span class="tut-tag g">Meta</span></div>
        <div class="tut-formula">NC = (VGV meta / R$ 1.000.000) × DC atual</div>
        <div class="tut-metric-desc">Quantos corretores ativos são necessários para atingir a meta de VGV. A diferença entre NC e ativos atuais é a meta de ativação da DWV.</div>
        <div class="tut-metric-ex"><strong style="color:var(--gr)">Exemplo:</strong> (80M / 1M) × 1,21 = <strong style="color:var(--gr)">97 necessários → ativar mais 39</strong></div>
      </div>
    </div>

    <hr class="tut-divider"/>

    <!-- 04 -->
    <a class="tut-sec-anchor" id="t4"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">04</div>
        <div><div class="tut-sec-ttl">As ${reportSections.length} seções do relatório</div><div class="tut-sec-desc">Geradas automaticamente ao concluir o formulário. Cada seção e o que observar.</div></div>
      </div>
      ${reportHtml}
    </div>

    <hr class="tut-divider"/>

    <!-- 05 -->
    <a class="tut-sec-anchor" id="t5"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">05</div>
        <div><div class="tut-sec-ttl">Ferramentas e desafios mapeados</div><div class="tut-sec-desc">Opções disponíveis no formulário — ${TOOLS_DEF.length} ferramentas e ${Object.keys(CHAL_LABELS).length} desafios.</div></div>
      </div>

      <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">${TOOLS_DEF.length} ferramentas disponíveis</div>
      <div class="tut-tools">${toolsHtml}</div>

      <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin:14px 0 8px">${Object.keys(CHAL_LABELS).length} desafios mapeados</div>
      <div class="tut-chals">${chalsHtml}</div>

      <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin:14px 0 8px">${Object.keys(RPT_LABELS).length} relatórios desejados</div>
      <ul style="padding:0;margin:0">${rptsHtml}</ul>

      <div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin:14px 0 8px">${CARGOS_CANAL.length} cargos do canal</div>
      <div class="tut-chals">${cargosHtml}</div>
    </div>

    <hr class="tut-divider"/>

    <!-- 06 -->
    <a class="tut-sec-anchor" id="t6"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">06</div>
        <div><div class="tut-sec-ttl">Plano DWV e ROI</div><div class="tut-sec-desc">Os números do contrato usados no diagnóstico.</div></div>
      </div>
      <div class="tut-roi">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Plano anual</div>
            <div style="font-size:22px;font-weight:600">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2}).format(PLANO_ANUAL)}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Mensalidade</div>
            <div style="font-size:22px;font-weight:600">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2}).format(PLANO_MENSAL)}/mês</div>
          </div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6">
          O diagnóstico calcula automaticamente o <strong style="color:#fff">ponto de equilíbrio</strong> (quantos corretores mínimos para pagar o plano) e o <strong style="color:#fff">retorno total</strong> se a meta de ativação for atingida. Com 1 corretor ativado pela DWV gerando a produtividade média do canal, o plano anual já se paga.
        </div>
      </div>
      <div class="tut-callout amber">
        <strong>Lógica condicional de custo de ferramentas:</strong><br/>
        Custo zero → "DWV será a primeira plataforma integrada"<br/>
        Custo até R$ 5.000/ano → argumento de produtividade<br/>
        Custo acima de R$ 5.000/ano → projeção de redução de custo por corretor ativo
      </div>
    </div>

    <hr class="tut-divider"/>

    <!-- 07 -->
    <a class="tut-sec-anchor" id="t7"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">07</div>
        <div><div class="tut-sec-ttl">Exportação e fluxo pós-diagnóstico</div><div class="tut-sec-desc">O que fazer após concluir o formulário.</div></div>
      </div>
      <div class="tut-steps">
        <div class="tut-step">
          <div class="tut-step-num">Exportação</div>
          <div class="tut-step-ttl">⬇ Baixar PDF</div>
          <div class="tut-step-desc">Gera documento completo formatado para envio ao cliente. Inclui todas as seções do relatório.</div>
        </div>
        <div class="tut-step">
          <div class="tut-step-num">Histórico</div>
          <div class="tut-step-ttl">Dashboard</div>
          <div class="tut-step-desc">Todos os diagnósticos ficam salvos. Reais e simulações separados em colunas.</div>
        </div>
      </div>
      <div class="tut-callout green">
        <strong>Fluxo recomendado:</strong> 1. Gerar PDF e enviar ao cliente · 2. Usar ROI como base da proposta comercial formal
      </div>
    </div>

    <hr class="tut-divider"/>

    <!-- 08 -->
    <a class="tut-sec-anchor" id="t8"></a>
    <div class="tut-sec">
      <div class="tut-sec-hdr">
        <div class="tut-sec-num">08</div>
        <div><div class="tut-sec-ttl">Checklist do consultor</div><div class="tut-sec-desc">O que confirmar antes de encerrar o diagnóstico.</div></div>
      </div>
      <div class="tut-checklist">
        <div class="tut-check-item">TE identificada e classificada (Crítica / Regular / Boa)</div>
        <div class="tut-check-item">Número exato de corretores a ativar calculado (NC − ativos)</div>
        <div class="tut-check-item">Ponto de equilíbrio ROI comunicado ao cliente</div>
        <div class="tut-check-item">Organograma mapeado com cargos, KPIs e atividades preenchidos</div>
        <div class="tut-check-item">Ferramentas selecionadas com custos informados</div>
        <div class="tut-check-item">Desafios e relatórios desejados registrados</div>
        <div class="tut-check-item">PDF gerado e enviado ao cliente</div>
        <div class="tut-check-item">Diagnóstico salvo e visível no Dashboard</div>
      </div>
      <div class="tut-callout red">
        <strong>Sinais de alerta:</strong>
        TE abaixo de 10% = canal em colapso · Sem nenhum cargo de execução = estrutura mínima · Sem CRM algum = processo 100% manual · "Não bate metas" + TE crítica = urgência alta
      </div>
    </div>

    <div style="margin-top:40px;padding-top:16px;border-top:.5px solid var(--b);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div style="font-size:11px;color:var(--mu)">DWV · Tutorial · versão sincronizada com o sistema</div>
      <button class="bto" onclick="_backFromTutorial()">← Voltar</button>
    </div>
  `;

  window.scrollTo({top:0,behavior:'smooth'});
}

function _backFromTutorial(){
  document.getElementById('tutorial').style.display='none';
  if(_tutorialFrom==='results'){document.getElementById('results').style.display='block';}
  else if(_tutorialFrom==='form'){document.getElementById('formWrap').style.display='block';}
  else if(_tutorialFrom==='dashboard'){document.getElementById('dashboard').style.display='block';}
  else{window.location.href='/diagnostico/dashboard';}
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── BACKUP LOCAL ──────────────────────────────────────────────
function _backupKey(name){return'dwv_bkp_'+(name||'').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');}

function saveBackup(){
  if(!D.companyName) return;
  try{
    localStorage.setItem(_backupKey(D.companyName), JSON.stringify({D, step:currentStep, isSim, ts:Date.now()}));
  }catch(e){}
}

function clearBackup(){
  if(!D.companyName) return;
  try{ localStorage.removeItem(_backupKey(D.companyName)); }catch(e){}
}

function findAnyRecentBackup(){
  const MAX=24*60*60*1000; // 24h
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||!k.startsWith('dwv_bkp_')) continue;
      const b=JSON.parse(localStorage.getItem(k)||'null');
      if(b&&b.D?.companyName&&(Date.now()-b.ts)<MAX) return b;
    }
  }catch(e){}
  return null;
}

function offerBackupRestore(){
  const b=findAnyRecentBackup();
  if(!b) return false;
  const mins=Math.round((Date.now()-b.ts)/60000);
  const label=mins<2?'agora mesmo':mins<60?mins+' min atrás':(Math.round(mins/60))+'h atrás';
  if(confirm('Encontramos um diagnóstico não finalizado de "'+b.D.companyName+'" ('+label+'). Deseja continuar de onde parou?')){
    Object.assign(D, b.D);
    currentStep=b.step||0;
    isSim=b.isSim||false;
    return true;
  }
  return false;
}

// ── INIT ──────────────────────────────────────────────────────
(async function init(){
  const user=checkAuth();
  if(!user) return;

  const params=new URLSearchParams(window.location.search);

  if(params.get('tutorial')==='true'){
    showTutorial();
    return;
  }

  if(params.get('simulacao')==='true'){
    startDiag(true);
    return;
  }

  // Editar — abre no formulário step 0
  if(params.get('editar')){
    const id=params.get('editar');
    try{
      const res=await fetch('/api/diagnostico/diagnosticos');
      const all=await res.json();
      const rec=all.find(d=>d.id===id);
      if(rec){
        populateFromAPI(rec);
        _savedThisSession = false;
        editingId=id;
        currentStep=0;
        document.getElementById('startScreen').style.display='none';
        document.getElementById('formWrap').style.display='block';
        document.getElementById('simBadge').style.display=isSim?'flex':'none';
        document.getElementById('results').style.display='none';
        document.getElementById('dashboard').style.display='none';
        render();
        return;
      }
    }catch(e){console.error(e);}
  }

  // Ver — abre direto no relatório (viewOnly: não salva no DB)
  if(params.get('ver')){
    const id=params.get('ver');
    try{
      const res=await fetch('/api/diagnostico/diagnosticos');
      const all=await res.json();
      const rec=all.find(d=>d.id===id);
      if(rec){
        populateFromAPI(rec);
        showResults(true); // viewOnly — apenas renderiza, sem salvar
        return;
      }
    }catch(e){console.error(e);}
  }

  // Sem parâmetros = novo diagnóstico real → vai direto para o formulário
  startDiag(false);
})();
