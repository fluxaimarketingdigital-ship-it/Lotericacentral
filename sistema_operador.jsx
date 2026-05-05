/**
 * Lotérica Central - Sistema Operador
 * Versão: 1.0.1 - Deploy Force Update
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DB } from "./firebase.js";
import logoLoterica from "./logo_loterica.png";
import html2canvas from "html2canvas";

/* ═══════ CONFIG PADRÃO ═══════ */
const DCFG = {
  meta: 15,
  minVisita: 300,
  minRelampago: 60,
  premioMeta: { nome:"Raspadinha CAIXA", emoji:"🎟️", desc:"Você completou {meta} visitas e ganhou {premioNome}! Retire no balcão." },
  relampagos: [
    { id:"r1",ativo:true, emoji:"🎟️",nome:"Raspadinha Bônus", prob:25, desc:"Raspadinha extra! Retire no caixa assim que receber aviso pelo WhatsApp." },
    { id:"r2",ativo:true, emoji:"🏷️",nome:"Bolões e Jogos", prob:25, desc:"Oferta Especial! Pela sua compra acima de R$ 60,00, você ganhou uma Raspadinha! Aguarde a conferência e receba seu cupom de retirada pelo WhatsApp." },
    { id:"r3",ativo:true, emoji:"🎁",nome:"Compra Bolão da mega 30 anos", prob:25, desc:"Mega 30 Anos! Você ganhou um prêmio bônus! Seu registro está em auditoria. Assim que aprovado, enviaremos seu cupom digital pelo WhatsApp." },
    { id:"r4",ativo:true, emoji:"⚡",nome:"Bolão Quina São João", prob:25, desc:"Quina de São João! Prêmio especial garantido. Aguarde a auditoria rápida e o envio do seu cupom digital via WhatsApp." },
    { id:"r5",ativo:false,emoji:"🌟",nome:"Sorteio-do-Mês", prob:5, desc:"Sorteio do Mês! Você foi contemplado(a)! Seu prêmio passará por auditoria. Fique atento ao seu WhatsApp." },
    { id:"r6",ativo:false,emoji:"🎁",nome:"Novo Prêmio", prob:5, desc:"Novo Prêmio! Parabéns! Seu registro foi encaminhado para auditoria. Você receberá o cupom de retirada pelo WhatsApp." },
  ],
  regulamento: `REGULAMENTO — PROGRAMA CLIENTE FIDELIZADO
Lotérica Central · CNPJ 20.845.956/0001-00 · Alagoinhas-BA

1. PARTICIPAÇÃO
Destinado a clientes que realizarem transações na unidade. A participação é validada através do App Fidelidade mediante comprovação física (comprovante) e código do operador.

2. MECÂNICA DE PONTUAÇÃO
• Visita Premiada: Cada visita com transações (pagamentos/depósitos) de valor igual ou superior a R$ {minVisita} garante 01 (uma) autenticação.
• Validação: O cliente deve informar o código do operador e registrar os dados do comprovante no App.

3. PRÊMIO PRINCIPAL
• Ao completar {meta} autenticações, o cliente ganha automaticamente um kit com {premioNome}.
• A notificação de retirada será enviada via WhatsApp.

4. PRÊMIO RELÂMPAGO (SORTEIO IMEDIATO)
• Clientes que incluírem Bolões ou Jogos no valor acima de R$ {minRelampago} em sua visita habilitam o sorteio instantâneo de prêmios surpresa.
• O sistema informará na hora se o cliente foi contemplado.

5. PREMIAÇÃO DE OPERADORES
• Como incentivo ao bom atendimento, as 2 operadoras com maior volume de autenticações no mês serão premiadas todo dia 05.

6. DISPOSIÇÕES GERAIS
• LGPD: Dados protegidos e usados exclusivamente para o programa.
• VIGÊNCIA: Campanha válida de {dataInicio} a {dataFim}. Registros fora deste prazo ou registrados após 7 dias não serão validados.`,
  appUrl:"", wts:"5575999990000",
  noticias: [
    { id:"ng1", tipo:"geral",   ativo:true,  emoji:"🎰", titulo:"Mega-Sena Acumulada!",             corpo:"Prêmio estimado em R$ 120 milhões! Aposte agora na lotérica.",                                         data:"2026-04-15" },
    { id:"ng2", tipo:"geral",   ativo:true,  emoji:"🕐", titulo:"Horário de Funcionamento",          corpo:"Seg–Sex: 09h às 17h\nSábado: 09h às 13h\nDomingo e Feriados: Fechado",                                data:"2026-04-01" },
    { id:"nv1", tipo:"vip",     ativo:true,  emoji:"🌟", titulo:"Sorteio VIP — Exclusivo Premiados", corpo:"Você foi selecionado para o Sorteio VIP de Maio! Prêmio: R$ 500 em Raspadinhas. Resultado dia 31/05.", data:"" },
    { id:"nv2", tipo:"vip",     ativo:true,  emoji:"🎁", titulo:"Bônus para clientes premiados",     corpo:"Mencione que é premiado no próximo registro e ganhe desconto em Bolões. Válido até 30/04.",              data:"" },
  ],
  formulario: {
    cats: [
      { id:"bc", nome:"Bancário", cor:"#003478" },
      { id:"jg", nome:"Jogos",    cor:"#7c3aed" },
    ],
    campos: [
      { id:"boleto",   nome:"Boleto",    emoji:"📄", cat:"bc", comValor:true,  triggerRelampago:false, ativo:true, obrigatorio:false },
      { id:"deposito", nome:"Depósito",  emoji:"💰", cat:"bc", comValor:true,  triggerRelampago:false, ativo:true, obrigatorio:false },
      { id:"saque",    nome:"Saque",     emoji:"💵", cat:"bc", comValor:true,  triggerRelampago:false, ativo:true, obrigatorio:false },
      { id:"pix",      nome:"PIX",       emoji:"📲", cat:"bc", comValor:true,  triggerRelampago:false, ativo:true, obrigatorio:false },
      { id:"lotofacil",nome:"Lotofácil", emoji:"🍀", cat:"jg", comValor:true,  triggerRelampago:true,  ativo:true, obrigatorio:false },
      { id:"megasena", nome:"Mega-Sena", emoji:"🎰", cat:"jg", comValor:true,  triggerRelampago:true,  ativo:true, obrigatorio:false },
      { id:"quina",    nome:"Quina",     emoji:"🎲", cat:"jg", comValor:true,  triggerRelampago:true,  ativo:true, obrigatorio:false },
      { id:"bolao",    nome:"Bolão",     emoji:"🎯", cat:"jg", comValor:true,  triggerRelampago:true,  ativo:true, obrigatorio:false },
      { id:"out_jg",   nome:"Outros Jogos", emoji:"🎮", cat:"jg", comValor:false, triggerRelampago:true, ativo:true, obrigatorio:false },
    ],
  },
  senhaMestra: "123456",
};

/* ═══════ CORES ═══════ */
const C={az:"#003478",az2:"#004fa8",azC:"#e8f0fb",ou:"#f5a800",ou2:"#d97706",ouC:"#fff8e6",vd:"#00a651",vdC:"#e6f9ef",rx:"#7c3aed",rxC:"#f3eeff",rd:"#e5001e",rdC:"#fff0f0",bg:"#f0f4fb",bd:"#dde6f5",tx:"#0d2137",sb:"#5a7a96",ops:["#7c3aed","#db2777","#059669","#d97706","#1d4ed8","#dc2626","#0891b2","#b45309","#6d28d9","#be185d"]};
const oc=i=>C.ops[Math.abs(i)%C.ops.length];

/* ═══════ UTILS ═══════ */
const uid=()=>Math.random().toString(36).slice(2,9);
const uidOp=(ops=[])=>{
  let cod,attempts=0;
  do{ cod=String(Math.floor(1000+Math.random()*9000)); attempts++; }
  while(ops.some(o=>o.id===cod)&&attempts<500);
  return cod;
};
const limpo = v=>v?v.replace(/\D/g,""):"";
const now=()=>new Date().toLocaleString("sv-SE", {timeZone:"America/Sao_Paulo"}).replace(" ","T")+"Z";
const fD=d=>new Date(d + (d?.includes("T") ? "" : "T12:00:00")).toLocaleDateString("pt-BR");
const fDT=d=>new Date(d).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const mAno=d=>{
  if(!d || d === "2000-01-01") return "Início";
  const dt = new Date(d + (d.includes("T") ? "" : "T12:00:00"));
  return `${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
};
const brl=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtDN = v=>{if(!v)return"—";if(v.length!==8)return v;return`${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`;};
const fmtW = v=>{if(!v)return"";const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;};
const hoje=()=>new Date().toLocaleString("sv-SE", {timeZone:"America/Sao_Paulo"}).slice(0,10);

/* ═══════ CSS ═══════ */
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{background:#f0f4fb;font-family:'Nunito',sans-serif;user-select:none;}
input, textarea { user-select: auto !important; }
button{cursor:pointer;transition:transform .1s active;user-select:none;}
button:active{transform:scale(0.96);}
@keyframes up {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes dt {0%,100%{opacity:.25;transform:scale(.65)}50%{opacity:1;transform:scale(1.2)}}
@keyframes sp {to{transform:rotate(360deg)}}
@keyframes fadeUp {from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`;

/* ═══════ ESTILOS ═══════ */
const L={fontSize:11,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:.5};
const I={padding:"11px 13px",border:`1.5px solid ${C.bd}`,borderRadius:11,fontSize:13,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff",width:"100%"};
const LS={fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:.4};
const IS={padding:"10px 12px",border:`1.5px solid ${C.bd}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff"};
const BV={background:"rgba(255,255,255,.18)",color:"#fff",border:"none",borderRadius:9,padding:"5px 13px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"};

async function getIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "Desconhecido";
  } catch(e) {
    return "Desconhecido";
  }
}

const VerMais = ({total, visiveis, setVisiveis}) => {
  const temMais = visiveis < total;
  return (
    <div style={{padding:"12px 0", textAlign:"center"}}>
      <button 
        disabled={!temMais}
        onClick={() => setVisiveis(prev => prev + 15)} 
        style={{
          background: temMais ? C.bg : "#f3f4f6", 
          border: `1.5px solid ${temMais ? C.bd : "#e5e7eb"}`, 
          borderRadius: 20, 
          padding: "6px 16px", 
          fontSize: 11, 
          fontWeight: 800, 
          color: temMais ? C.az : "#9ca3af", 
          cursor: temMais ? "pointer" : "default", 
          display: "flex", 
          alignItems:"center", 
          gap: 6, 
          margin: "0 auto", 
          transition: ".2s", 
          fontFamily: "inherit",
          opacity: temMais ? 1 : 0.7
        }}
      >
        {temMais ? `Ver mais ${Math.min(15, total - visiveis)} registros` : "Todos os registros exibidos"} 
        <span style={{fontSize:14, color: temMais ? C.az : "#9ca3af"}}>↓</span>
      </button>
    </div>
  );
};

/* ═══════ COMPONENTES GLOBAIS ═══════ */
const PromptModal = ({ data, onClose }) => {
  const [val, setVal] = useState("");
  const [vis, setVis] = useState(false);
  if (!data) return null;
  
  const submit = (e) => { 
    e?.preventDefault(); 
    data.resolve(data.type === "confirm" ? true : val); 
    onClose(); 
    setVal("");
  };
  
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:360,padding:25,boxShadow:"0 10px 40px rgba(0,0,0,0.5)"}}>
        <div style={{fontSize:30,textAlign:"center",marginBottom:10}}>{data.emoji || "🔒"}</div>
        <div style={{fontWeight:800,fontSize:16,textAlign:"center",marginBottom:10}}>{data.title || "Autorização"}</div>
        <div style={{fontSize:13,textAlign:"center",marginBottom:15}}>{data.message}</div>
        <form onSubmit={submit}>
          {data.type !== "confirm" && (
            <input autoFocus value={val} onChange={e=>setVal(e.target.value)} type={vis?"text":"password"} placeholder="Digite a senha..." style={{...I, marginBottom:15}} />
          )}
          <div style={{display:"flex",gap:10}}>
            <button type="button" onClick={()=>{data.resolve(null); onClose();}} style={{flex:1,padding:10,borderRadius:10,border:"1px solid #ccc",background:"#fff"}}>Cancelar</button>
            <button type="submit" style={{flex:1,padding:10,borderRadius:10,border:"none",background:C.az,color:"#fff",fontWeight:800}}>Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═══════ APP ROOT ═══════ */
export default function App(){
  const[tela,setTela]=useState("splash");
  const[role,setRole]=useState(null);
  const[opSel,setOpSel]=useState(null);
  const[adminSel,setAdminSel]=useState(null);
  const[ops,setOps_]=useState([]);
  const[admins,setAdmins_]=useState([]);
  const[cl,setCl_]=useState([]);
  const[pr,setPr_]=useState([]);
  const[cfg,setCfg_]=useState(DCFG);
  const[opPrizes,setOpPrizes_]=useState([]);
  const[adminLogs,setAdminLogs_]=useState([]);
  const[campanhas,setCampanhas_]=useState([]);
  
  const [promptData, setPromptData] = useState(null);
  
  const setOps=d=>{ if(typeof d==="function") { setOps_(prev=>{const n=d(prev);DB.save("lc-ops",n);return n;}); } else { setOps_(d); return DB.save("lc-ops",d); } };
  const setAdmins=d=>{ if(typeof d==="function") { setAdmins_(prev=>{const n=d(prev);DB.save("lc-admins",n);return n;}); } else { setAdmins_(d); return DB.save("lc-admins",d); } };
  const setCl=d=>{ if(typeof d==="function") { setCl_(prev=>{const n=d(prev);DB.save("lc-cl",n);return n;}); } else { setCl_(d); return DB.save("lc-cl",d); } };
  const setPr=d=>{ if(typeof d==="function") { setPr_(prev=>{const n=d(prev);DB.save("lc-pr",n);return n;}); } else { setPr_(d); return DB.save("lc-pr",d); } };
  const setCfg=d=>{ if(typeof d==="function") { setCfg_(prev=>{const n=d(prev);DB.save("lc-cfg",n);return n;}); } else { setCfg_(d); return DB.save("lc-cfg",d); } };
  const setOpPrizes=d=>{ if(typeof d==="function") { setOpPrizes_(prev=>{const n=d(prev);DB.save("lc-op-prizes",n);return n;}); } else { setOpPrizes_(d); return DB.save("lc-op-prizes",d); } };
  const setAdminLogs=d=>{ if(typeof d==="function") { setAdminLogs_(prev=>{const n=d(prev);DB.save("lc-admin-logs",n);return n;}); } else { setAdminLogs_(d); return DB.save("lc-admin-logs",d); } };
  const setCampanhas=d=>{ if(typeof d==="function") { setCampanhas_(prev=>{const n=d(prev);DB.save("lc-campanhas",n);return n;}); } else { setCampanhas_(d); return DB.save("lc-campanhas",d); } };
  const logAdminAction = async (acao, detalhes="", payload=null) => {
    if(!adminSel) return;
    const ip = await getIP();
    const log = {
      id: uid(),
      adminId: adminSel.id,
      adminNome: adminSel.nome,
      role: adminSel.role,
      acao,
      detalhes,
      payload,
      reverted: false,
      data: new Date().toISOString(),
      ip
    };
    setAdminLogs(prev => [log, ...(prev||[])].slice(0, 500)); 
  };

  const reverterAcao = async (logId) => {
    const log = adminLogs?.find(l => l.id === logId);
    if(!log || !log.payload) {
      alert("❌ Dados de restauração não encontrados ou incompatíveis.");
      return;
    }
    if(log.reverted) {
      alert("⚠️ Esta ação já foi revertida anteriormente.");
      return;
    }
    if(!(await customConfirm("Reverter Ação", "Deseja realmente REVERTER esta ação e restaurar os dados excluídos?", "↩️", "Reverter Agora"))) return;
    
    try {
      const p = log.payload;
      if(p.tipo === "cliente") {
        setCl(prev => [...prev, p.dado]);
      } else if(p.tipo === "auth") {
        setCl(prev => prev.map(c => c.id === p.clientId ? {...c, auths: [...(c.auths||[]), p.dado]} : c));
        if(p.prize) setPr(prev => [...prev, p.prize]);
      } else if(p.tipo === "operadora") {
        setOps(prev => [...prev, p.dado]);
      } else if(p.tipo === "opPrize") {
        setOpPrizes(prev => [...(prev||[]), p.dado]);
      } else if(p.tipo === "relampago") {
        setCfg(prev => ({...prev, relampagos: [...prev.relampagos, p.dado]}));
      } else if(p.tipo === "noticia") {
        setCfg(prev => ({...prev, noticias: [...prev.noticias, p.dado]}));
      } else {
         alert("Tipo de dado desconhecido para reversão.");
         return;
      }
      
      setAdminLogs(prev => prev.map(l => l.id === logId ? {...l, reverted: true, detalhes: l.detalhes + " (REVERTIDO)"} : l));
      alert("✅ Ação revertida com sucesso! O registro voltou ao sistema.");
    } catch(e) {
      alert("Erro ao reverter: " + e.message);
    }
  };
  useEffect(()=>{(async()=>{
    try{const[o,a,c,p,f,opp,al,cp]=await Promise.all([DB.load("lc-ops"),DB.load("lc-admins"),DB.load("lc-cl"),DB.load("lc-pr"),DB.load("lc-cfg"),DB.load("lc-op-prizes"),DB.load("lc-admin-logs"),DB.load("lc-campanhas")]);
      if(Array.isArray(o))setOps_(o);if(Array.isArray(a))setAdmins_(a);if(Array.isArray(c))setCl_(c);if(Array.isArray(p))setPr_(p);if(Array.isArray(opp))setOpPrizes_(opp);if(Array.isArray(al))setAdminLogs_(al);if(Array.isArray(cp))setCampanhas_(cp);
      if(f)setCfg_({...DCFG,...f,relampagos:f.relampagos||DCFG.relampagos,premioMeta:f.premioMeta||DCFG.premioMeta,noticias:f.noticias||DCFG.noticias,formulario:{...DCFG.formulario,...(f.formulario||{}),cats:f.formulario?.cats||DCFG.formulario.cats,campos:f.formulario?.campos||DCFG.formulario.campos}});}catch(_){}
    setTimeout(()=>{
      setTela("home");
    },1400);

    DB.listen?.("lc-ops", val => { if(Array.isArray(val)) setOps_(val); });
    DB.listen?.("lc-admins", val => { if(Array.isArray(val)) setAdmins_(val); });
    DB.listen?.("lc-cl", val => { if(Array.isArray(val)) setCl_(val); });
    DB.listen?.("lc-pr", val => { if(Array.isArray(val)) setPr_(val); });
    DB.listen?.("lc-op-prizes", val => { if(Array.isArray(val)) setOpPrizes_(val); });
    DB.listen?.("lc-admin-logs", val => { if(Array.isArray(val)) setAdminLogs_(val); });
    DB.listen?.("lc-campanhas", val => { if(Array.isArray(val)) setCampanhas_(val); });
    DB.listen?.("lc-cfg", val => { if(val) setCfg_(prev => ({...DCFG,...prev,...val})); });
  })();},[]);


  const checkM = (m="Digite sua Senha de Alteração e Exclusão para autorizar:", payload=null, acaoNome="EXCLUSAO") => {
    return new Promise(resolve => {
      if(!adminSel) {
        alert("❌ Acesso Negado: Você precisa estar logado como administrador.");
        resolve(false); return;
      }
      setPromptData({
        message: m,
        title: acaoNome === "EXCLUSAO" ? "Confirmar Exclusão" : "Autorização Gerencial",
        emoji: acaoNome === "EXCLUSAO" ? "🗑️" : "🔒",
        resolve: (p) => {
          if (p === null) { resolve(false); return; }
          if (p === (adminSel.senhaMestra || "123456")) {
            logAdminAction(acaoNome, m, payload);
            resolve(true);
          } else {
            alert("❌ Senha incorreta!");
            resolve(false);
          }
        }
      });
    });
  };

  const customPrompt = (title, message, emoji="💬", placeholder="") => {
    return new Promise(resolve => {
      setPromptData({
        title, message, emoji, placeholder,
        resolve: (p) => resolve(p)
      });
    });
  };

  const customConfirm = (title, message, emoji="❓", confirmLabel="Sim, Confirmar") => {
    return new Promise(resolve => {
      setPromptData({
        type: "confirm", title, message, emoji, confirmLabel,
        resolve: (v) => resolve(!!v)
      });
    });
  };

  const ctx={tela,setTela,role,setRole,opSel,setOpSel,adminSel,setAdminSel,ops,setOps,admins,setAdmins,cl,setCl,pr,setPr,cfg,setCfg,opPrizes,setOpPrizes,adminLogs,setAdminLogs,campanhas,setCampanhas,logAdminAction,reverterAcao,checkM,customPrompt,customConfirm};
  return(<><style>{CSS}</style>
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",maxWidth:520,margin:"0 auto",fontSize:13,color:C.tx}}>
      {tela==="splash"&&<Splash/>}{tela==="home"&&<Home{...ctx}/>}{tela==="opreg"&&<OpReg{...ctx}/>}
      {tela==="op"&&<OpPanel{...ctx}/>}{tela==="admin"&&<AdminPanel{...ctx}/>}
    </div>
    <PromptModal data={promptData} onClose={() => setPromptData(null)} />
  </>);
}

function Splash(){return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},${C.az2})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:C.ou,opacity:.07}}/>
  <div style={{textAlign:"center",zIndex:1}}>
    <div style={{background:"#fff", width:190, height:190, borderRadius:40, margin:"0 auto 16px", display:"flex", alignItems:"center", justifySelf:"center", padding:8, boxShadow:`0 10px 25px rgba(0,0,0,.15)`, animation:"pop .6s"}}>
      <img src={logoLoterica} style={{width:"100%", height:"100%", objectFit:"contain"}} alt="Logo"/>
    </div>
    <div style={{fontWeight:700,fontSize:11,color:C.ou,marginTop:2,letterSpacing:3,textTransform:"uppercase"}}>Sistema de Gestão</div>
    <div style={{marginTop:30,textAlign:"center",fontSize:11,color:"#fff",fontWeight:700}}>Desenvolvido por <strong>FluxAI Marketing Digital</strong></div>
  </div>
</div>);}

function Home({ops,admins,setAdmins,cl,pr,setRole,setOpSel,setAdminSel,setTela}){
  const[senha,setSenha]=useState("");const[showS,setShowS]=useState(false);const[erroS,setErroS]=useState("");const[showOps,setShowOps]=useState(false);
  const[opLogin,setOpLogin]=useState(null);const[senhaOp,setSenhaOp]=useState("");const[erroOp,setErroOp]=useState("");
  const[adminLogin,setAdminLogin]=useState(null);
  const[vis,setVis]=useState({adm:false,op:false});
  const totPoints=useMemo(()=>{
    let n=0; 
    cl.forEach(c=>(c.auths||[]).forEach(a=>{
      if(a.status === "approved" || (a.status === "pending" && a.valida !== false)) n++;
    }));
    return n;
  },[cl]);
  const totA=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.length||0),0),[cl]);
  const metas=pr.filter(p=>p.tipo==="raspadinha"&&(p.status==="approved"||p.status==="redeemed")).length;
  const relamp=pr.filter(p=>p.tipo==="relampago"&&(p.status==="approved"||p.status==="redeemed")).length;
  function entrarAdmin(){
    if(senha==="central2026"){
      setRole("admin");
      setAdminSel({id:"master",nome:"Master Padrao",role:"master"});
      setTela("admin");
    }else setErroS("Senha incorreta.");
  }
  async function entrarAdminNovo(){
    if(!adminLogin) return;
    if(adminLogin.senhaAcesso === senha || !adminLogin.senhaAcesso){
      let finalAdmin = {...adminLogin};
      if(adminLogin.primeiroAcesso !== false && (adminLogin.senhaAcesso === "123456" || !adminLogin.senhaAcesso || !adminLogin.senhaMestra)) {
        const nAcesso = await customPrompt("[PRIMEIRO ACESSO]", "Defina sua NOVA SENHA DE ACESSO (para logar):", "🔑", "Nova senha de acesso...");
        if(!nAcesso) return alert("Você precisa definir uma senha de acesso!");
        const nMestra = await customPrompt("[PRIMEIRO ACESSO]", "Defina sua NOVA SENHA DE ALTERAÇÃO E EXCLUSÃO (para autorizar modificações do sistema):", "🔒", "Senha mestra/gerência...");
        if(!nMestra) return alert("Você precisa definir uma senha de alteração e exclusão!");
        finalAdmin.senhaAcesso = nAcesso.trim();
        finalAdmin.senhaMestra = nMestra.trim();
        finalAdmin.primeiroAcesso = false;
        const updatedAdmins = admins.map(a => a.id === finalAdmin.id ? finalAdmin : a);
        if(typeof setAdmins === "function") setAdmins(updatedAdmins);
        alert("Senhas configuradas com sucesso! Bem-vindo(a).");
      }
      setRole("admin");
      setAdminSel(finalAdmin);
      setTela("admin");
    } else {
      setErroS("Senha incorreta.");
    }
  }
  function entrarOp(){
    if(!opLogin) return;
    if(opLogin.senha === senhaOp || !opLogin.senha) {
      setOpSel(opLogin);setRole("op");setTela("op");
    } else {
      setErroOp("Senha incorreta.");
    }
  }
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
    <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,borderRadius:"0 0 30px 30px",padding:"44px 22px 40px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:C.ou,opacity:.07}}/>
      <div style={{background:"#fff", width:190, height:190, borderRadius:40, margin:"0 auto 12px", display:"flex", alignItems:"center", justifySelf:"center", padding:8, boxShadow:`0 8px 20px rgba(0,0,0,.2)`, animation:"pop .5s"}}>
        <img src={logoLoterica} style={{width:"100%", height:"100%", objectFit:"contain"}} alt="Logo"/>
      </div>
      <div style={{fontSize:10,color:C.ou,fontWeight:700,marginTop:2,letterSpacing:3,textTransform:"uppercase"}}>Sistema de Gestão</div>
    </div>
    <div style={{flex:1,padding:"20px 16px",display:"flex",flexDirection:"column",gap:11}}>
      <div style={{background:"#fff",borderRadius:17,border:`1px solid ${C.bd}`,overflow:"hidden"}}>
        <div style={{padding:"13px 15px",borderBottom:showOps?`1px solid ${C.bd}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:900,fontSize:15,color:C.tx}}>👤 Sou Operador de Caixa</div><div style={{fontSize:11,color:C.sb,marginTop:2}}>Acesse seu painel e código</div></div>
          <button onClick={()=>setShowOps(!showOps)} style={{background:C.az,color:"#fff",border:"none",borderRadius:9,padding:"8px 13px",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{showOps?"Fechar":"Selecionar →"}</button>
        </div>
        {showOps&&<div style={{maxHeight:240,overflowY:"auto"}}>
          {ops.length===0&&<div style={{padding:"16px",textAlign:"center",fontSize:12,color:C.sb}}>Nenhuma operadora cadastrada ainda.</div>}
          {ops.map((o,i)=><div key={o.id} onClick={()=>{setOpLogin(o);setSenhaOp("");setErroOp("");}}
            style={{padding:"11px 15px",borderBottom:`1px solid ${C.bd}22`,display:"flex",alignItems:"center",gap:11,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.azC} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{width:34,height:34,borderRadius:"50%",background:oc(i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff",flexShrink:0}}>{o.nome[0].toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:C.tx}}>{o.nome}</div><div style={{fontSize:10,color:C.sb}}>{fD(o.cadastro)}</div></div>
            <span style={{fontSize:16,color:C.sb}}>→</span>
          </div>)}
          {opLogin && <form onSubmit={e=>{e.preventDefault(); entrarOp();}} style={{padding:"11px 15px",background:C.azC,borderTop:`1px solid ${C.bd}`}}>
            <div style={{fontSize:11,fontWeight:800,color:C.az,marginBottom:8}}>SENHA DE {opLogin.nome.toUpperCase()}</div>
            <div style={{display:"flex",gap:7,position:"relative"}}>
              <input value={senhaOp} onChange={e=>setSenhaOp(e.target.value)} type={vis.op?"text":"password"} placeholder="Senha..." autoFocus style={{flex:1,...I,paddingRight:42}}/>
              <button type="button" onClick={()=>setVis({...vis,op:!vis.op})} style={{position:"absolute",right:105,top:"50%",transform:"translateY(-50%)",background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"2px 5px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.op?"Ocultar":"Ver"}</button>
              <button type="submit" style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>ENTRAR</button>
            </div>
            {erroOp && <div style={{marginTop:7,fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {erroOp}</div>}
          </form>}
          <div onClick={()=>setTela("opreg")} style={{padding:"11px 15px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:C.az,fontWeight:800,fontSize:12,borderTop:`1px solid ${C.bd}`}}>
            <span style={{fontSize:17}}>➕</span> Cadastrar Nova Operadora
          </div>
        </div>}
      </div>
      <div style={{background:"#fff",borderRadius:17,border:`1px solid ${C.bd}`,overflow:"hidden"}}>
        <div style={{padding:"13px 15px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:900,fontSize:15,color:C.tx}}>🔒 Administrador / Lotérica</div><div style={{fontSize:11,color:C.sb,marginTop:2}}>Dashboard completo + Configurações</div></div>
          <button onClick={()=>setShowS(!showS)} style={{background:"#374151",color:"#fff",border:"none",borderRadius:9,padding:"8px 13px",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{showS?"Fechar":"Entrar →"}</button>
        </div>
        {showS&&<div style={{maxHeight:240,overflowY:"auto"}}>
          {!admins?.some(a=>a.role==="master")&&<form onSubmit={e=>{e.preventDefault(); entrarAdmin();}} style={{padding:"11px 15px",borderTop:`1px solid ${C.bd}`}}>
            <div style={{display:"flex",gap:7,marginBottom:erroS?7:0,position:"relative"}}>
              <input value={senha} onChange={e=>{setSenha(e.target.value);setErroS("");}} type={vis.adm?"text":"password"} placeholder="Senha master padrão…" style={{flex:1,...I,paddingRight:42}}/>
              <button type="button" onClick={()=>setVis({...vis,adm:!vis.adm})} style={{position:"absolute",right:65,top:"50%",transform:"translateY(-50%)",background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"2px 5px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.adm?"Ocultar":"Ver"}</button>
              <button type="submit" style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
            </div>
            {erroS&&<div style={{fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {erroS}</div>}
          </form>}
          {admins?.length>0&&admins.map((a,i)=><div key={a.id} onClick={()=>{setAdminLogin(a);setSenha("");setErroS("");}}
            style={{padding:"11px 15px",borderBottom:`1px solid ${C.bd}22`,display:"flex",alignItems:"center",gap:11,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.azC} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{width:34,height:34,borderRadius:"50%",background:C.az,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff",flexShrink:0}}>{a.nome[0].toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:C.tx}}>{a.nome}</div><div style={{fontSize:10,color:C.sb}}>{a.role==="master"?"Acesso Master":"Gerência"}</div></div>
            <span style={{fontSize:16,color:C.sb}}>→</span>
          </div>)}
          {adminLogin && <form onSubmit={e=>{e.preventDefault(); entrarAdminNovo();}} style={{padding:"11px 15px",background:C.azC,borderTop:`1px solid ${C.bd}`}}>
            <div style={{fontSize:11,fontWeight:800,color:C.az,marginBottom:8}}>SENHA DE {adminLogin.nome.toUpperCase()}</div>
            <div style={{display:"flex",gap:7,position:"relative"}}>
              <input value={senha} onChange={e=>{setSenha(e.target.value);setErroS("");}} type={vis.adm?"text":"password"} placeholder="Senha..." autoFocus style={{flex:1,...I,paddingRight:42}}/>
              <button type="button" onClick={()=>setVis({...vis,adm:!vis.adm})} style={{position:"absolute",right:105,top:"50%",transform:"translateY(-50%)",background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"2px 5px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.adm?"Ocultar":"Ver"}</button>
              <button type="submit" style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>ENTRAR</button>
            </div>
            {erroS && <div style={{marginTop:7,fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {erroS}</div>}
          </form>}
        </div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[["🏅",ops.length,"Operadoras"],["👥",cl.length,"Clientes"],["✅",totPoints,"Válidas"],["🏪",totA,"Registros"],["🎟️",metas,"Metas"],["⚡",relamp,"Relâmp."]].map(([em,v,l])=>(
          <div key={l} style={{background:"#fff",borderRadius:12,padding:"11px 8px",textAlign:"center",border:`1px solid ${C.bd}`}}>
            <div style={{fontSize:16}}>{em}</div><div style={{fontWeight:900,fontSize:20,color:C.az}}>{v}</div>
            <div style={{fontSize:9,color:C.sb,textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:20,paddingBottom:20,textAlign:"center",fontSize:12,color:C.az,fontWeight:900}}>
        Desenvolvido por <strong>FluxAI Marketing Digital</strong>
      </div>
    </div>
  </div>);
}

function OpReg({ops,setOps,setOpSel,setRole,setTela}){
  const[nome,setNome]=useState("");const[senha,setSenha]=useState("1234");const[erro,setErro]=useState("");const[nova,setNova]=useState(null);const[v,setV]=useState(false);
  function cad(){const n=(nome||"").trim();const s=(senha||"").trim();if(!n){setErro("Informe o nome.");return;}if(!s || s.length < 4){setErro("A senha deve ter no mínimo 4 caracteres.");return;}if(ops.some(o=>o.nome.toLowerCase()===n.toLowerCase())){setErro("Nome já cadastrado.");return;}const op={id:uidOp(ops),nome:n,senha:s,cadastro:now()};setOps([...ops,op]);setNova(op);setNome("");setSenha("");setErro("");}
  if(nova)return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},#5b21b6)`,padding:"28px 18px",textAlign:"center"}}>
    <div style={{fontSize:54,animation:"pop .5s",marginBottom:10}}>✅</div>
    <div style={{fontWeight:900,fontSize:22,color:"#fff",marginBottom:6}}>Cadastrada!</div>
    <div style={{fontSize:14,color:"rgba(255,255,255,.8)",marginBottom:16}}><strong style={{color:C.ou}}>{nova.nome}</strong> registrada com sucesso.</div>
    <div style={{background:"rgba(255,255,255,.12)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:18,padding:"18px 20px",marginBottom:22,display:"inline-block",minWidth:220}}>
      <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,.55)",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Código da Operadora</div>
      <div style={{fontFamily:"monospace",fontWeight:900,fontSize:48,color:C.ou,letterSpacing:12,lineHeight:1}}>{nova.id}</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:8}}>Código de 4 dígitos para identificação</div>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"center"}}>
      <button onClick={()=>{setOpSel(nova);setRole("op");setTela("op");}} style={{background:C.ou,color:C.az,border:"none",borderRadius:12,padding:"12px 20px",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>📱 Acessar Painel</button>
      <button onClick={()=>setNova(null)} style={{background:"rgba(255,255,255,.2)",color:"#fff",border:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>➕ Nova</button>
    </div>
  </div>);
  return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},${C.az2})`}}>
    <div style={{padding:"22px 18px 14px"}}><button onClick={()=>setTela("home")} style={BV}>← Voltar</button><div style={{fontWeight:900,fontSize:22,color:"#fff",marginTop:12}}>Nova Operadora</div></div>
    <div style={{background:"#fff",borderRadius:"24px 24px 0 0",minHeight:"calc(100vh - 110px)",padding:"22px 19px"}}>
      <label style={L}>👤 Nome *</label>
      <input value={nome} onChange={e=>{setNome(e.target.value);setErro("");}} onKeyDown={e=>e.key==="Enter"&&cad()} placeholder="Ex: Maria, Caixa 01…" autoFocus style={{...I,marginTop:6,border:`2px solid ${nome?C.az:C.bd}`,background:nome?C.azC:"#fff"}}/>
      <label style={{...L,marginTop:12}}>🔒 Senha de Acesso *</label>
      <div style={{position:"relative"}}>
        <input value={senha} onChange={e=>{setSenha(e.target.value);setErro("");}} type={v?"text":"password"} placeholder="Mínimo 4 caracteres" style={{...I,marginTop:6,border:`2px solid ${senha?C.az:C.bd}`,background:senha?C.azC:"#fff",paddingRight:42}}/>
        <button onClick={()=>setV(!v)} style={{position:"absolute",right:10,top:"59%",transform:"translateY(-50%)",background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"2px 5px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{v?"Ocultar":"Ver"}</button>
      </div>
      {erro&&<div style={{marginTop:7,fontSize:12,color:C.rd,fontWeight:700}}>⚠️ {erro}</div>}
      <div style={{marginTop:11,padding:"11px 13px",background:C.azC,borderRadius:10,fontSize:11,color:C.az,lineHeight:1.7}}>💡 Ao cadastrar, um <strong>código exclusivo</strong> é gerado. O cliente utiliza para registrar a visita no App.</div>
      <button onClick={cad} style={{width:"100%",marginTop:16,padding:15,borderRadius:13,border:"none",background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 16px ${C.az}44`}}>Cadastrar e Gerar Código 📱</button>
      {ops.length>0&&<div style={{marginTop:18}}><div style={{fontWeight:700,fontSize:12,color:C.tx,marginBottom:8}}>Cadastradas ({ops.length}):</div>
        {ops.map((o,i)=><div key={o.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",background:C.bg,borderRadius:10,marginBottom:6,border:`1px solid ${C.bd}`}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:oc(i),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff"}}>{i+1}</div>
          <span style={{fontWeight:700,fontSize:12,flex:1}}>{o.nome}</span>
          <span style={{fontFamily:"monospace",fontWeight:900,fontSize:15,color:C.az,background:C.azC,padding:"3px 10px",borderRadius:8,border:`1px solid ${C.bd}`,letterSpacing:3}}>{o.id}</span>
        </div>)}
      </div>}
    </div>
  </div>);
}

function OpPanel({opSel,setOpSel,ops,setOps,cl,pr,setPr,cfg,setTela,setRole,logAdminAction,adminLogs,setAdminLogs}){
  const[aba,setAba]=useState("qr");const[showAlt,setShowAlt]=useState(false);const[altS,setAltS]=useState({a:"",n:"",c:""});const[msgS,setMsgS]=useState("");const[vis,setVis]=useState({a:false,n:false,c:false});
  const ABAS=[{id:"qr",emoji:"📲",label:"Código"},{id:"auths",emoji:"✅",label:"Visitas"},{id:"clnts",emoji:"👥",label:"Clientes"},{id:"voucher",emoji:"🎟️",label:"Voucher"},{id:"rank",emoji:"🏅",label:"Rank"}];
  const op = ops.find(o => o.id === opSel?.id) || opSel;
  const idx = Math.max(0, ops.findIndex(o => o.id === op?.id));
  const lastReset = cfg.lastReset || "2000-01-01";
  if(!op) return(<div style={{padding:40,textAlign:"center",color:C.sb}}><div style={{fontSize:40,marginBottom:15}}>⚠️</div><div>Sessão não encontrada ou expirada.</div><button onClick={()=>{setRole(null);setOpSel(null);setTela("home");}} style={{marginTop:20,padding:"10px 20px",background:C.az,color:"#fff",border:"none",borderRadius:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Fazer Login</button></div>);
  const checkM = (m="Digite a SENHA MESTRA para autorizar:", payload=null, acaoNome="AUTORIZACAO_LOCAL") => {
    return new Promise(async resolve => {
      const p = await customPrompt("Autorização Necessária", m, "🔒", "Digite a senha mestra...");
      if(p === (cfg.senhaMestra||"123456")) {
        if(typeof logAdminAction === "function") {
          const log = {
            id: uid(),
            adminId: "master_local",
            adminNome: "Gerência/Master",
            role: "master",
            acao: acaoNome,
            detalhes: m,
            payload: payload,
            data: new Date().toISOString(),
            ip: "Local (Operador)"
          };
          setAdminLogs(prev => [log, ...(prev||[])].slice(0, 500));
        }
        resolve(true);
      } else {
        if(p !== null) alert("❌ Senha incorreta!");
        resolve(false);
      }
    });
  };
  const minhas = useMemo(() => {
    let all = [];
    cl.forEach(c => {
      (c.auths || []).forEach(a => {
        if (a.opId === op?.id) all.push({ ...a, cn: c.nome, cid: c.id });
      });
    });
    return all.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [cl, op]);

  const minhasV = useMemo(() => minhas.filter(a => {
    const s = a.status || (a.valida !== false ? "approved" : "rejected");
    return s === "approved" || (s === "pending" && a.valida !== false);
  }), [minhas]);
  const hoje_ = useMemo(() => minhasV.filter(a => a.data?.slice(0, 10) === hoje()), [minhasV]);
  const meusCl = cl.filter(c => (c.auths || []).some(a => {
    const s = a.status || (a.valida !== false ? "approved" : "rejected");
    return a.opId === op?.id && (s === "approved" || (s === "pending" && a.valida !== false));
  }));
  const metasOp = useMemo(() => pr.filter(p => p.tipo === "raspadinha" && (p.status === "approved" || p.status === "redeemed") && minhas.some(a => a.id === p.authId)).length, [pr, minhas]);
  const relampOp = useMemo(() => pr.filter(p => p.tipo === "relampago" && (p.status === "approved" || p.status === "redeemed") && minhas.some(a => a.id === p.authId)).length, [pr, minhas]);

  const rank = useMemo(() => {
    const list = ops.map((o, i) => {
      let t = 0;
      const lrTime = new Date(lastReset).getTime();
      cl.forEach(c => (c.auths || []).forEach(a => {
        const isVal = a.valida !== false && a.status !== "rejected" && a.status !== "not_counted";
        if (a.opId === o.id && isVal && new Date(a.data).getTime() >= lrTime) t++;
      }));
      return { op: o, t, i };
    });
    return list.sort((a, b) => b.t - a.t);
  }, [cl, ops, lastReset]);
  const pos = rank.findIndex(r => r.op.id === op?.id) + 1;
  const isDefault = !op?.senha || String(op?.senha) === "1234";

  function mudarS(){if(altS.n.length<4){setMsgS("❌ Mínimo 4 caracteres.");return;}if(altS.n!==altS.c){setMsgS("❌ Senhas não conferem.");return;}if(!isDefault && String(altS.a)!==String(op?.senha)){setMsgS("❌ Senha atual incorreta.");return;}setOps(ops.map(o=>o.id===op?.id?{...o,senha:altS.n}:o));setMsgS("✅ Senha alterada!");setTimeout(()=>{setShowAlt(false);setMsgS("");setAltS({a:"",n:"",c:""});},2000);}

  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
    {isDefault && <div style={{position:"fixed",inset:0,background:"rgba(0,52,120,.95)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:24,padding:24,width:"100%",maxWidth:400,textAlign:"center",animation:"pop .4s"}}>
        <div style={{fontSize:44,marginBottom:15}}>🔒</div>
        <div style={{fontWeight:900,fontSize:20,color:C.tx,marginBottom:8}}>Troca Obrigatória</div>
        <div style={{fontSize:13,color:C.sb,lineHeight:1.6,marginBottom:20}}>Para sua segurança, você deve alterar a senha padrão (1234) no primeiro acesso.</div>
        <div style={{textAlign:"left",display:"flex",flexDirection:"column",gap:12,maxHeight:"80vh",overflowY:"auto"}}>
          <div style={{position:"relative"}}><label style={L}>Nova Senha</label><input value={altS.n} onChange={e=>setAltS({...altS,n:e.target.value})} type={vis.n?"text":"password"} placeholder="Mínimo 4 caracteres" style={{...I,paddingRight:42}}/><button onClick={()=>setVis({...vis,n:!vis.n})} style={{position:"absolute",right:11,top:32,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.n?"Ocultar":"Ver"}</button></div>
          <div style={{position:"relative"}}><label style={L}>Confirmar Nova Senha</label><input value={altS.c} onChange={e=>setAltS({...altS,c:e.target.value})} type={vis.c?"text":"password"} placeholder="Repita a nova senha" style={{...I,paddingRight:42}}/><button onClick={()=>setVis({...vis,c:!vis.c})} style={{position:"absolute",right:11,top:32,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.c?"Ocultar":"Ver"}</button></div>
          {msgS && <div style={{fontSize:12,fontWeight:700,color:msgS.startsWith("✅")?C.vd:C.rd}}>{msgS}</div>}
          <button onClick={mudarS} style={{marginTop:8,padding:14,borderRadius:12,border:"none",background:C.az,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Salvar Nova Senha</button>
        </div>
      </div>
    </div>}
    {showAlt && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:22,padding:22,width:"100%",maxWidth:400,animation:"up .3s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontWeight:900,fontSize:17,color:C.tx}}>🔒 Alterar Minha Senha</div>
          <button onClick={()=>setShowAlt(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.sb}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{position:"relative"}}><label style={L}>Senha Atual</label><input value={altS.a} onChange={e=>setAltS({...altS,a:e.target.value})} type={vis.a?"text":"password"} style={{...I,paddingRight:42}}/><button onClick={()=>setVis({...vis,a:!vis.a})} style={{position:"absolute",right:11,top:32,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.a?"Ocultar":"Ver"}</button></div>
          <div style={{height:1,background:C.bd,margin:"5px 0"}}/>
          <div style={{position:"relative"}}><label style={L}>Nova Senha</label><input value={altS.n} onChange={e=>setAltS({...altS,n:e.target.value})} type={vis.n?"text":"password"} placeholder="Mínimo 4 dígitos" style={{...I,paddingRight:42}}/><button onClick={()=>setVis({...vis,n:!vis.n})} style={{position:"absolute",right:11,top:32,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.n?"Ocultar":"Ver"}</button></div>
          <div style={{position:"relative"}}><label style={L}>Confirmar Nova</label><input value={altS.c} onChange={e=>setAltS({...altS,c:e.target.value})} type={vis.c?"text":"password"} style={{...I,paddingRight:42}}/><button onClick={()=>setVis({...vis,c:!vis.c})} style={{position:"absolute",right:11,top:32,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.c?"Ocultar":"Ver"}</button></div>
          {msgS && <div style={{fontSize:12,fontWeight:700,color:msgS.startsWith("✅")?C.vd:C.rd}}>{msgS}</div>}
          <button onClick={mudarS} style={{marginTop:10,padding:14,borderRadius:12,border:"none",background:C.az,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Atualizar Senha</button>
        </div>
      </div>
    </div>}
    <div style={{background:`linear-gradient(135deg,${oc(idx)},${C.az})`,padding:"18px 18px 22px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>{setRole(null);setOpSel(null);setTela("home");}} style={BV}>← Sair</button>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setAba("reg")} style={{...BV,background:"rgba(255,255,255,.2)",color:"#fff"}}>📋 Regras</button>
          <button onClick={()=>setShowAlt(true)} style={{...BV,background:C.ou,color:C.az}}>🔒 Mudar Senha</button>
        </div>
      </div>
      <div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>{op.nome} <span style={{fontSize:9,opacity:.5,fontWeight:400}}>v1.3</span></div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:1}}>Operador de Caixa · {fD(op.cadastro)}</div>
      <div style={{display:"flex",gap:6,marginTop:13,overflowX:"auto",paddingBottom:5,scrollbarWidth:"none"}}>
        {[["👥",meusCl.length,"Clientes"],["✅",minhasV.length,"Válidas"],["🏪",minhas.length,"Registros"],["🎟️",metasOp,"Metas"],["⚡",relampOp,"Relâmp."],[`${pos}º`,"","Ranking"]].map(([em,v,l],ki)=>(
          <div key={l+ki} style={{flex:"1 0 62px",background:"rgba(255,255,255,.12)",borderRadius:9,padding:"7px 2px",textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
            <div style={{fontSize:13}}>{em}</div><div style={{fontWeight:900,fontSize:14,color:"#fff",lineHeight:1}}>{v}</div>
            <div style={{fontSize:7,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.3,marginTop:1}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{flex:1,padding:"13px 13px 76px",animation:"up .3s"}}>
      {aba==="qr"   &&<OpQR    op={op} cfg={cfg} minhas={minhas} minhasV={minhasV} hoje_={hoje_} ops={ops}/>}
      {aba==="auths"&&<OpAuths minhasV={minhasV} hoje_={hoje_}/>}
      {aba==="clnts"&&<OpCl    meusCl={meusCl} cfg={cfg}/>}
      {aba==="voucher"&&<OpVoucher pr={pr} setPr={setPr} cl={cl} op={op} cfg={cfg} checkM={checkM}/>}

      {aba==="rank" && <OpRank rank={rank} op={op} pos={pos}/>}
      {aba==="reg"  && <OpRegulamento cfg={cfg}/>}
    </div>
    <Nav abas={ABAS} aba={aba} setAba={setAba} cor={oc(idx)}/>
  </div>);
}

function OpQR({op,cfg,minhas,minhasV,hoje_}){
  const tk = op.id; 
  const wa=`Olá! 🏆 Sou *${op.nome}* da Lotérica Central.\nMeu código de atendimento é: *${tk}*\nUse-o para registrar sua visita no App Fidelidade!`;
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="📱" t="Meu Código Fixo" s="Informe este código ao cliente"/>

    <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,borderRadius:20,padding:"24px 20px",textAlign:"center",position:"relative",overflow:"hidden",boxShadow:`0 8px 24px ${C.az}44`}}>
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:C.ou,opacity:.08}}/>
      <div style={{zIndex:1,position:"relative"}}>
        <div style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Código de Identificação</div>
        <div style={{fontFamily:"monospace",fontWeight:900,fontSize:60,color:C.ou,letterSpacing:10,lineHeight:1,textShadow:"0 2px 10px rgba(0,0,0,.2)"}}>{tk}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginTop:12}}>Este código é fixo e exclusivo seu</div>
      </div>
    </div>

    <div style={{display:"flex",gap:10}}>
      <button onClick={()=>navigator.clipboard?.writeText(tk).then(()=>alert("✅ Código copiado!"))} 
        style={{flex:1,background:"#fff",color:C.az,border:`1.5px solid ${C.bd}`,borderRadius:14,padding:"14px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        📋 Copiar Código
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(wa)}`} target="_blank" rel="noreferrer" 
        style={{flex:1,background:"#25D366",color:"#fff",borderRadius:14,padding:"14px",fontWeight:800,fontSize:14,textDecoration:"none",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        📲 WhatsApp
      </a>
    </div>

    <div style={{background:C.ouC,borderRadius:14,padding:"14px",border:`1.5px solid ${C.ou}44`,fontSize:11,color:C.ou2,lineHeight:1.7}}>
      💡 <strong>Como usar:</strong> Mostre este código para o cliente digitar no App dele após carregar os dados do atendimento. Este é seu código permanente de identificação.
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
      {[["📅",hoje_.length,"Visitas Hoje",C.az],["✅",minhasV.length,"Visitas Válidas",C.vd]].map(([em,v,l,cor])=>(
        <div key={l} style={{background:"#fff",borderRadius:12,padding:"13px",textAlign:"center",border:`1px solid ${C.bd}`}}>
          <div style={{fontSize:20,marginBottom:4}}>{em}</div><div style={{fontWeight:900,fontSize:26,color:cor}}>{v}</div>
          <div style={{fontSize:10,color:C.sb,fontWeight:700}}>{l}</div>
        </div>
      ))}
    </div>
    {hoje_.length>0&&<div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bd}`,fontWeight:800,fontSize:12,color:C.tx}}>📋 Visitas de Hoje ({hoje_.length})</div>
      {hoje_.slice(0,15).map((a,i)=><div key={a.id} style={{padding:"9px 13px",borderBottom:i<14?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:30,height:30,borderRadius:8,background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🏪</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{a.cn}</div><div style={{fontSize:10,color:C.sb}}>{fDT(a.data)}{a.total>0?` · ${brl(a.total)}`:""}</div></div>
      </div>)}
      {hoje_.length > 15 && <div style={{padding:8, textAlign:"center", fontSize:10, color:C.sb, background:C.bg}}>Exibindo as 15 visitas mais recentes</div>}
    </div>}
    <div style={{marginTop:20,textAlign:"center",fontSize:12,color:C.az,fontWeight:900}}>
      Desenvolvido por <strong>FluxAI Marketing Digital</strong>
    </div>
  </div>);
}

function OpAuths({minhasV,hoje_}){
  const[f,setF]=useState("all");const[vis,setVis]=useState(15);
  const lista=f==="hj"?hoje_:minhasV;
  const gr=useMemo(()=>{const m={};minhasV.forEach(a=>{const k=mAno(a.data);if(!m[k])m[k]={mes:k,auths:0};m[k].auths++;});return Object.values(m).sort((a,b)=>a.mes.localeCompare(b.mes)).slice(-6);},[minhasV]);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="✅" t="Minhas Visitas Válidas"/>
    {gr.length>0&&<div style={{background:"#fff",borderRadius:13,padding:"12px 11px",border:`1px solid ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:12,color:C.tx,marginBottom:10}}>📈 Por Mês</div>
      <ResponsiveContainer width="100%" height={130}><BarChart data={gr} margin={{left:-20,right:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
        <XAxis dataKey="mes" tick={{fill:C.sb,fontSize:8}} tickLine={false}/>
        <YAxis tick={{fill:C.sb,fontSize:8}} axisLine={false} tickLine={false}/>
        <Tooltip contentStyle={{background:"#fff",border:`1px solid ${C.bd}`,fontSize:10,borderRadius:8}}/>
        <Bar dataKey="auths" radius={[5,5,0,0]}>{gr.map((_,i)=><Cell key={i} fill={i===gr.length-1?C.ou:C.az} fillOpacity={i===gr.length-1?1:.7}/>)}</Bar>
      </BarChart></ResponsiveContainer>
    </div>}
    <div style={{display:"flex",gap:7}}>{[["all","Válidas",minhasV.length],["hj","Hoje",hoje_.length]].map(([v,l,n])=>(
      <button key={v} onClick={()=>setF(v)} style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${f===v?C.az:C.bd}`,background:f===v?C.az:"#fff",color:f===v?"#fff":C.sb,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{l} ({n})</button>
    ))}</div>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {lista.length===0&&<V em="✅" msg="Nenhuma autenticação neste período."/>}
      {lista.slice(0,vis).map((a,i)=>{const v=a.valida!==false;return(<div key={a.id} style={{padding:"10px 13px",borderBottom:i<lista.slice(0,vis).length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:v?C.azC:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{v?"✅":"⏳"}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:v?C.tx:C.sb}}>{a.cn} · {v?"Ponto":"Histórico"}</div><div style={{fontSize:10,color:C.sb}}>{fDT(a.data)}{a.total>0?` · ${brl(a.total)}`:""}</div></div>
      </div>);})}
    </div>
    <VerMais total={lista.length} visiveis={vis} setVisiveis={setVis} />
  </div>);
}

function OpCl({meusCl,cfg}){
  const[vis,setVis]=useState(15);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
  <T em="👥" t="Meus Clientes" s={`${meusCl.length} atendidos`}/>
  <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
    {meusCl.length===0&&<V em="👥" msg="Ainda nenhum cliente atendido."/>}
    {meusCl.slice(0,vis).map((c,i)=>{
      const vs=c.auths?.filter(a=>a.valida!==false)||[];
      const prog=vs.length%cfg.meta;const ganhou=vs.length>0&&vs.length%cfg.meta===0;
      return(<div key={c.id} style={{padding:"10px 13px",borderBottom:i<meusCl.slice(0,vis).length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:34,height:34,borderRadius:"50%",background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:C.az,flexShrink:0}}>{c.nome?.[0]?.toUpperCase()||"?"}</div>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{c.nome}</div><div style={{fontSize:10,color:C.sb}}>{vs.length} pts / {c.auths?.length||0} total</div></div>
      {ganhou&&<span style={{background:C.vdC,color:C.vd,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>{cfg.premioMeta.emoji} Pronto!</span>}
      {!ganhou&&prog>=cfg.meta-3&&prog>0&&<span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>Faltam {cfg.meta-prog}</span>}
    </div>);})}</div>
    <VerMais total={meusCl.length} visiveis={vis} setVisiveis={setVis} />
</div>);}

function OpVoucher({pr, setPr, cl, op, cfg, checkM}){

  const [cod, setCod] = useState("");
  const [res, setRes] = useState(null);
  
  function buscar(){
    const v = pr.find(p=>p.id.toUpperCase()===cod.toUpperCase().trim());
    if(!v){ setRes({erro:"Voucher não encontrado."}); return; }
    const c = cl.find(x=>x.id===v.clientId);
    setRes({pr: v, c: c});
  }

  async function validar(p, expirado=false){
    if(expirado) {
      if(!(await checkM("⚠️ VOUCHER VENCIDO! Para autorizar a entrega deste prêmio (" + p.nome + "), digite a SENHA DE ALTERAÇÃO:", {id: p.id, cliente: res.c?.nome, acao: "entrega_vencido"}, "ENTREGA_VENCIDO"))) return;
    } else {
      if(!window.confirm("Confirmar a retirada deste prêmio no balcão?")) return;
    }
    setPr(pr.map(x=>x.id===p.id?{...x, status:"redeemed", dataRetirada:new Date().toISOString(), opNomeRetirada:op.nome, opIdRetirada:op.id, autorizadoVencido:expirado}:x));
    setRes({...res, pr:{...p, status:"redeemed", dataRetirada:new Date().toISOString(), opNomeRetirada:op.nome, autorizadoVencido:expirado}});
    alert("✅ Retirada registrada com sucesso!");
  }

  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="🎟️" t="Validar Voucher" s="Verifique e entregue os prêmios dos clientes"/>
    <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.bd}`}}>
      <label style={L}>Código do Voucher</label>
      <div style={{display:"flex",gap:8,marginTop:6}}>
        <input value={cod} onChange={e=>{setCod(e.target.value.toUpperCase());setRes(null);}} placeholder="Ex: A1B2C3" style={{flex:1,...I,fontFamily:"monospace",fontSize:18,fontWeight:900,letterSpacing:2}}/>
        <button onClick={buscar} style={{background:C.az,color:"#fff",border:"none",borderRadius:11,padding:"0 20px",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Buscar</button>
      </div>
    </div>

    {res && res.erro && <div style={{background:C.rdC,color:C.rd,padding:14,borderRadius:12,fontWeight:700,textAlign:"center"}}>{res.erro}</div>}
    
    {res && res.pr && (
      <div style={{background:"#fff",borderRadius:14,padding:16,border:`2px solid ${res.pr.status==="approved"?C.ou:C.bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
           <div>
             <div style={{fontSize:11,fontWeight:800,color:C.sb,textTransform:"uppercase"}}>Cliente</div>
             <div style={{fontWeight:900,fontSize:16,color:C.tx}}>{res.c?.nome}</div>
             <div style={{fontSize:11,color:C.sb}}>{res.c?.whats}</div>
           </div>
           <div style={{width:44,height:44,borderRadius:12,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{res.pr.emoji}</div>
        </div>
        
        <div style={{background:C.bg,padding:12,borderRadius:10,marginBottom:14}}>
          <div style={{fontSize:10,color:C.sb,fontWeight:800,textTransform:"uppercase",marginBottom:4}}>Prêmio</div>
          <div style={{fontWeight:900,fontSize:14,color:C.tx}}>{res.pr.nome}</div>
          <div style={{fontSize:11,color:C.sb}}>{res.pr.tipo==="relampago"?"Prêmio Relâmpago":"Prêmio Meta"}</div>
        </div>

        {res.pr.status === "approved" && (() => {
           const dVal = res.pr.validade || new Date(new Date(res.pr.data).getTime() + (cfg.validadeDias||30)*86400000).toISOString();
           const isExp = new Date(dVal) < new Date(hoje() + "T23:59:59");
           
           return (
             <div style={{display:"flex", flexDirection:"column", gap:10}}>
               <div style={{background:isExp?C.rdC:C.bg, padding:12, borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center", border:isExp?`1px solid ${C.rd}44`:"none"}}>
                 <div>
                   <div style={{fontSize:10, color:isExp?C.rd:C.sb, fontWeight:800, textTransform:"uppercase"}}>Validade do Prêmio</div>
                   <div style={{fontWeight:900, color:isExp?C.rd:C.tx, fontSize:15}}>{fD(dVal)}</div>
                 </div>
                 {isExp && <div style={{background:C.rd, color:"#fff", fontSize:9, fontWeight:900, padding:"4px 8px", borderRadius:20, animation:"pop .3s"}}>VENCIDO ⚠️</div>}
               </div>

               {isExp && (
                 <div style={{fontSize:11, color:C.rd, fontWeight:700, textAlign:"center", background:"#fff", padding:8, borderRadius:8, border:`1px dashed ${C.rd}66`}}>
                   Este voucher expirou. A entrega requer autorização da Gerência.
                 </div>
               )}

               <button onClick={()=>validar(res.pr, isExp)} style={{width:"100%",background:isExp?C.rd:C.vd,color:"#fff",border:"none",borderRadius:12,padding:14,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${isExp?C.rd:C.vd}44`}}>
                 {isExp ? "🔐 Autorizar Entrega Vencida" : "✅ Registrar Retirada no Balcão"}
               </button>
             </div>
           );
        })()}
        {res.pr.status === "redeemed" && (
           <div style={{background:C.vdC,color:C.vd,padding:14,borderRadius:12,fontWeight:800,textAlign:"center",border:`1px solid ${C.vd}44`}}>
             ✅ Prêmio retirado em {fDT(res.pr.dataRetirada||res.pr.redeemedAt||res.pr.data)}<br/>
             <span style={{fontSize:10,opacity:.8}}>Operador: {res.pr.opNomeRetirada||res.pr.opRedeemed||"Lotérica Central"}</span>
           </div>
        )}
        {res.pr.status === "pending" && (
           <div style={{background:C.ouC,color:C.ou2,padding:14,borderRadius:12,fontWeight:800,textAlign:"center",border:`1px solid ${C.ou}44`}}>
             ⏳ Este prêmio ainda não foi aprovado pelo administrador.
           </div>
        )}
      </div>
    )}
  </div>);
}


function OpRank({rank,op,pos}){
  const[vis,setVis]=useState(15);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="🏅" t="Ranking de Operadores" s="Competição mensal"/>
    <div style={{background:C.az,borderRadius:18,padding:22,textAlign:"center",color:"#fff",boxShadow:`0 8px 25px ${C.az}44`,marginBottom:10,animation:"pop .5s"}}>
      <div style={{fontSize:11,textTransform:"uppercase",fontWeight:800,letterSpacing:2,opacity:.7,marginBottom:6}}>Sua Posição</div>
      <div style={{fontSize:52,fontWeight:900,lineHeight:1}}>#{pos}</div>
      <div style={{fontSize:12,fontWeight:700,marginTop:10,background:"rgba(255,255,255,.15)",padding:"5px 12px",borderRadius:20,display:"inline-block"}}>Você está no top {Math.round((pos/rank.length)*100)}%</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rank.slice(0,vis).map((r,i)=><div key={r.op.id} style={{background:r.op.id===op.id?C.azC:"#fff",borderRadius:13,padding:"13px 15px",display:"flex",alignItems:"center",gap:12,border:`1.5px solid ${r.op.id===op.id?C.az:C.bd+"66"}`,animation:`up .4s ${i*0.05}s both`}}>
        <div style={{width:28,height:28,borderRadius:8,background:i===0?C.ou:i===1?"#cbd5e1":i===2?"#d97706":C.bg,color:i<3?"#fff":C.sb,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14}}>{i+1}</div>
        <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.tx}}>{r.op.nome}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:C.az}}>{r.t}</div><div style={{fontSize:9,color:C.sb,fontWeight:700,textTransform:"uppercase"}}>Pontos</div></div>
      </div>)}
    </div>
    <VerMais total={rank.length} visiveis={vis} setVisiveis={setVis} />
  </div>);
}

function OpRegulamento({cfg}){
  const meta = cfg.meta || 15;
  const pNome = cfg.premioMeta?.nome || "Prêmio";
  const minV = cfg.minVisita || 300;
  const minR = cfg.minRelampago || 60;
  const dIni = cfg.dataInicio || "2026-04-01";
  const dFim = cfg.dataFim || "2026-12-31";

  const rTxt = (cfg.regulamento && cfg.regulamento.trim().length > 0 ? cfg.regulamento : DCFG.regulamento)
    .replace(/{meta}/g, meta)
    .replace(/{premioNome}/g, pNome)
    .replace(/{minVisita}/g, minV)
    .replace(/{minRelampago}/g, minR)
    .replace(/{dataInicio}/g, fD(dIni))
    .replace(/{dataFim}/g, fD(dFim));

  return(<div style={{display:"flex",flexDirection:"column",gap:11,animation:"up .3s"}}>
    <T em="📋" t="Regulamento da Promoção" s="Consulte as regras vigentes"/>
    
    <div style={{background:"#fff",borderRadius:15,padding:14,border:`1px solid ${C.bd}`,display:"flex",gap:8,marginBottom:4}}>
      <div style={{flex:1,background:C.bg,borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:9,color:C.sb,textTransform:"uppercase",fontWeight:800}}>Início</div><div style={{fontWeight:900,fontSize:13,color:C.az}}>{fD(dIni)}</div></div>
      <div style={{flex:1,background:C.bg,borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:9,color:C.sb,textTransform:"uppercase",fontWeight:800}}>Término</div><div style={{fontWeight:900,fontSize:13,color:C.rd}}>{fD(dFim)}</div></div>
    </div>

    <div style={{background:"#fff",borderRadius:16,padding:22,border:`1px solid ${C.bd}`,boxShadow:`0 4px 15px rgba(0,0,0,.03)`,maxHeight:"calc(100vh - 280px)",overflowY:"auto"}}>
      <div style={{lineHeight:1.8,fontSize:13,whiteSpace:"pre-wrap",color:C.tx,fontFamily:"inherit"}}>
        {rTxt}
      </div>
    </div>
    <div style={{background:C.azC,borderRadius:12,padding:14,border:`1px solid ${C.az}22`,fontSize:11,color:C.az,lineHeight:1.6}}>
      💡 <strong>Nota para Operador:</strong> Este regulamento é gerenciado pelo administrador. Em caso de dúvidas, consulte o gerente.
    </div>
  </div>);
}

/* ═══════ RELATÓRIOS ═══════ */
function ARels({cl,setCl,pr,setPr,ops,opPrizes,setOpPrizes,cfg,setCfg,campanhas,setCampanhas,adminLogs,setAdminLogs,checkM,adminSel}){
  const[aba,setAba]=useState("cli");
  const[vis,setVis]=useState(15);
  const isM = adminSel?.role === "master";

  const ABAS=[
    {id:"cli",l:"👥 Clientes"},
    {id:"vis",l:"✅ Visitas"},
    {id:"pr",l:"🎁 Prêmios"},
    {id:"ops",l:"🏅 Operadores"},
    {id:"met",l:"📊 Métricas"},
    ...(isM ? [{id:"admLog",l:"🛡️ Auditoria Adm"}] : []),
    {id:"hist",l:"📚 Histórico"}
  ];

  // Métricas auxiliares
  const met = useMemo(() => {
    let totV = 0, totV_V = 0, totVal = 0, totBoleto = 0, totPix = 0, totJogos = 0, totBolao = 0;
    const campoUso = {};
    cl.forEach(c => {
      (c.auths||[]).forEach(a => {
        totV++;
        if(a.valida !== false) {
          totV_V++;
          totVal += (a.total || 0);
        }
        Object.keys(a.detalhes||{}).forEach(fid => {
          const f = cfg.formulario.campos.find(x=>x.id===fid);
          if(f) {
            campoUso[f.nome] = (campoUso[f.nome]||0) + 1;
            if(f.cat === "bc") {
              if(f.id === "pix") totPix++;
              else totBoleto++;
            } else {
              if(f.id === "bolao") totBolao++;
              else totJogos++;
            }
          }
        });
      });
    });
    const sortedCampos = Object.entries(campoUso).sort((a,b)=>b[1]-a[1]);
    return { totV, totV_V, totVal, totBoleto, totPix, totJogos, totBolao, sortedCampos, avg: totV_V > 0 ? totVal/totV_V : 0 };
  }, [cl, cfg]);

  const exportPDF = (titulo, colunas, dados, orientation="p") => {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>${titulo}</title>
      <style>
        body { font-family: 'Nunito', sans-serif; padding: 40px; color: #0d2137; }
        .h { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003478; padding-bottom: 15px; margin-bottom: 20px; }
        h1 { color: #003478; margin: 0; font-size: 24px; }
        .info { text-align: right; font-size: 11px; color: #5a7a96; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #dde6f5; }
        th { background: #f0f4fb; color: #003478; font-weight: 800; text-transform: uppercase; }
        .footer { margin-top: 30px; font-size: 9px; color: #5a7a96; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; }
        @media print { @page { size: ${orientation === "p" ? "A4 portrait" : "A4 landscape"}; margin: 1cm; } }
      </style></head><body>
        <div class="h">
          <div style="display:flex; align-items:center; gap:15px;">
            <img src="${logoLoterica}" style="height:60px; width:60px; object-fit:contain; background:#fff; border-radius:10px; padding:5px; border:1px solid #eee;" />
            <div>
              <h1>${titulo}</h1>
              <div style="font-size:12px; font-weight:800; color:#d97706; margin-top:5px;">Campanha: ${cfg.premioMeta.nome}</div>
            </div>
          </div>
          <div class="info">
            Período: ${fD(cfg.dataInicio)} — ${fD(cfg.dataFim)}<br/>
            Gerado em: ${new Date().toLocaleString("pt-BR")}
          </div>
        </div>
        <table>
          <thead><tr>${colunas.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
          <tbody>${dados.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
        <div class="footer">
          <span>Relatório Oficial — Lotérica Central</span>
          <span>Página 1 de 1</span>
        </div>
        <script>setTimeout(()=>{ window.print(); setTimeout(window.close, 500); }, 500);</script>
      </body></html>
    `);
    w.document.close();
  };

  const relCli = () => {
    const dados = cl.map(c => [
      c.nome,
      c.whats ? fmtW(c.whats) : "—",
      fmtDN(c.nasc),
      fD(c.cadastro),
      c.auths?.length || 0,
      pr.filter(p=>p.clientId===c.id).length,
      brl(c.auths?.reduce((s,a)=>s+(a.total||0),0)||0)
    ]);
    exportPDF("Relatório de Clientes", ["Nome", "WhatsApp", "Nascimento", "Cadastro", "Registros", "Prêmios", "Total Movimentado"], dados, "l");
  };

  const relPr = () => {
    const dados = pr.map(p => {
      const cli = cl.find(c=>c.id===p.clientId);
      const expirado = p.validade && new Date(p.validade) < new Date();
      return [
        fDT(p.data),
        p.nome + (p.status==="redeemed" && p.validade && new Date(p.dataRetirada) > new Date(p.validade) ? " ⚠️ (Vencido)" : ""),
        p.tipo === "relampago" ? "⚡ Relâmpago" : "🏆 Meta",
        cli?.nome || "—",
        p.status === "redeemed" ? "✅ Retirado" : p.status === "approved" ? "⏳ Aguardando" : "❌ Pendente",
        p.opNomeRetirada || "—",
        p.validade ? fD(p.validade) : "—"
      ];
    });
    exportPDF("Relatório de Prêmios", ["Data/Hora", "Prêmio", "Tipo", "Cliente", "Status", "Operador (Retirada)", "Validade"], dados, "l");
  };

  const relOps = () => {
    const dados = ops.map(o => {
      const pts = cl.reduce((s,c)=>s+(c.auths?.filter(a=>a.opId===o.id && a.valida!==false).length||0),0);
      const premios = (opPrizes||[]).filter(p=>p.vencedores.some(v=>v.opId===o.id && p.status==="paid")).length;
      return [o.nome, o.id, fD(o.cadastro), pts, premios];
    });
    exportPDF("Relatório de Operadores", ["Nome", "ID/Código", "Cadastro", "Visitas Válidas", "Ciclos Pagos"], dados);
  };

  const relVis = () => {
    const dados = [];
    let tot = 0;
    cl.forEach(c => {
      (c.auths||[]).forEach(a => {
        tot += (a.total||0);
        dados.push([
          fDT(a.data),
          c.nome,
          a.valida !== false ? "✅ Válida" : "⏳ Pendente",
          brl(a.total),
          a.opNome || "—",
          a.controle || "—"
        ]);
      });
    });
    dados.sort((a,b) => new Date(b[0]) - new Date(a[0]));
    dados.push(["—", "TOTAL GERAL", `${dados.length} Visitas`, brl(tot), "—", "—"]);
    exportPDF("Relatório Geral de Visitas", ["Data/Hora", "Cliente", "Status", "Valor", "Operador", "Registro"], dados, "l");
  };

  const relAdm = () => {
    const dados = (adminLogs||[]).map(l => [
      fDT(l.data),
      l.adminNome + " (" + l.role + ")",
      l.acao,
      l.detalhes,
      l.ip
    ]);
    exportPDF("Auditoria de Ações Administrativas", ["Data/Hora", "Administrador", "Ação", "Detalhes", "IP"], dados, "l");
  };

  const fecharCampanha = async () => {
    if(!(await checkM(`⚠️ ATENÇÃO: Esta ação irá ENCERRAR a campanha "${cfg.premioMeta.nome}".
Um relatório final será gerado e salvo no histórico.
Os dados de visitas e prêmios da campanha atual serão APAGADOS para iniciar um novo ciclo.
Confirmar encerramento? Digite sua Senha de Alteração e Exclusão:`, null, "ENCERRAMENTO_CAMPANHA"))) return;

    const summary = {
      id: uid(),
      nome: cfg.premioMeta.nome,
      inicio: cfg.dataInicio,
      fim: cfg.dataFim || now().slice(0,10),
      dataFechamento: now(),
      metricas: {
        totalClientes: cl.length,
        totalVisitas: met.totV,
        totalMovimentado: met.totVal,
        ticketMedio: met.avg,
        premiosEntregues: pr.filter(p=>p.status==="redeemed").length,
        premiosNaoEntregues: pr.filter(p=>p.status!=="redeemed").length,
        clientesSemProgresso: cl.filter(c=>(c.auths?.length||0)===0).length,
        detalhes: met.sortedCampos
      }
    };

    setCampanhas(prev => [summary, ...(prev||[])]);
    
    // Limpar dados sazonais conforme solicitado
    // 1. Gerar PDF final automaticamente para o usuário salvar ANTES de apagar
    relVis();
    
    // 2. Limpar dados sazonais
    setCl(prev => prev.map(c => ({...c, auths: []})));
    setPr([]);
    setAdminLogs([]);
    setOpPrizes([]);
    
    alert("✅ Campanha encerrada com sucesso!\n\n1. O relatório final foi salvo no Histórico.\n2. O PDF de visitas foi gerado para seu arquivo.");
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="📈" t="Central de Relatórios" s="Gere e exporte dados da campanha atual"/>
    
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <div style={{fontSize:11,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:1}}>Tipo de Relatório</div>
        <select value={aba} onChange={e=>setAba(e.target.value)} style={{...IS,width:"auto",padding:"6px 12px",fontSize:12,fontWeight:700,background:C.azC,border:`1px solid ${C.az}33`,color:C.az}}>
          {ABAS.map(a=><option key={a.id} value={a.id}>{a.l}</option>)}
        </select>
      </div>

      <div style={{display:"flex",gap:5,background:"#fff",borderRadius:11,padding:4,border:`1px solid ${C.bd}`,overflowX:"auto",paddingBottom:8}}>
        {ABAS.map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{flex:"1 0 auto",padding:"8px 15px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11,background:aba===a.id?C.az:"transparent",color:aba===a.id?"#fff":C.sb,transition:"all .2s",whiteSpace:"nowrap"}}>{a.l}</button>)}
      </div>
    </div>

    {aba==="cli" && (
      <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.bd}`,animation:"up .3s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Base de Clientes</div>
          <button onClick={relCli} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {cl.slice(0,vis).map(c=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,borderBottom:`1px solid ${C.bd}33`,paddingBottom:6}}>
              <span style={{fontWeight:700}}>{c.nome}</span>
              <span style={{color:C.sb}}>{c.auths?.length||0} vis.</span>
            </div>
          ))}
        </div>
        <VerMais total={cl.length} visiveis={vis} setVisiveis={setVis} />
      </div>
    )}

    {aba==="vis" && (
      <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.bd}`,animation:"up .3s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Log Geral de Visitas</div>
          <button onClick={relVis} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {cl.flatMap(c=>(c.auths||[]).map(a=>({...a, cNome:c.nome}))).sort((a,b)=>new Date(b.data)-new Date(a.data)).slice(0,vis).map(a=>(
            <div key={a.id} style={{fontSize:11, borderBottom:`1px solid ${C.bd}22`, paddingBottom:6, display:"flex", justifyContent:"space-between"}}>
              <div>
                <div style={{fontWeight:800}}>{a.cNome}</div>
                <div style={{fontSize:9, color:C.sb}}>{fDT(a.data)} · {a.opNome}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:900, color:C.az}}>{brl(a.total)}</div>
                <div style={{fontSize:9, color:a.valida!==false?C.vd:C.ou2}}>{a.valida!==false?"VÁLIDA":"PENDENTE"}</div>
              </div>
            </div>
          ))}
        </div>
        <VerMais total={cl.reduce((s,c)=>s+(c.auths?.length||0),0)} visiveis={vis} setVisiveis={setVis} />
      </div>
    )}

    {aba==="pr" && (
      <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.bd}`,animation:"up .3s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Distribuição de Prêmios</div>
          <button onClick={relPr} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:15}}>
          <div style={{background:C.bg,padding:10,borderRadius:10,textAlign:"center"}}>
            <div style={{fontSize:18}}>✅</div>
            <div style={{fontWeight:900,fontSize:16,color:C.vd}}>{pr.filter(p=>p.status==="redeemed").length}</div>
            <div style={{fontSize:9,color:C.sb,fontWeight:800}}>RETIRADOS</div>
          </div>
          <div style={{background:C.bg,padding:10,borderRadius:10,textAlign:"center"}}>
            <div style={{fontSize:18}}>⏳</div>
            <div style={{fontWeight:900,fontSize:16,color:C.ou2}}>{pr.filter(p=>p.status!=="redeemed").length}</div>
            <div style={{fontSize:9,color:C.sb,fontWeight:800}}>PENDENTES</div>
          </div>
        </div>
      </div>
    )}

    {aba==="ops" && (
      <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.bd}`,animation:"up .3s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Desempenho de Operadores</div>
          <button onClick={relOps} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ops.map(o=>(
            <div key={o.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"6px 0",borderBottom:`1px solid ${C.bd}22`}}>
              <span>{o.nome}</span>
              <span style={{fontWeight:800,color:C.az}}>{cl.reduce((s,c)=>s+(c.auths?.filter(a=>a.opId===o.id && a.valida!==false).length||0),0)} pts</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {aba==="met" && (
      <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.bd}`,animation:"up .3s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Métricas da Campanha</div>
          <button onClick={()=>{
            const dados = [
              ["Movimentação Total", brl(met.totVal)],
              ["Total de Visitas", met.totV],
              ["Ticket Médio", brl(met.avg)],
              ["Uso de Boleto/Bancário", met.totBoleto],
              ["Uso de PIX", met.totPix],
              ["Uso de Jogos", met.totJogos],
              ["Uso de Bolões", met.totBolao],
              ...met.sortedCampos.map(([n,v])=>["Uso de "+n, v])
            ];
            exportPDF("Métricas de Desempenho", ["Indicador", "Quantidade/Resultado"], dados);
          }} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
        </div>
        
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:15}}>
          <div style={{background:C.azC,padding:12,borderRadius:12,textAlign:"center"}}>
            <div style={{fontSize:10,color:C.az,fontWeight:800}}>TICKET MÉDIO</div>
            <div style={{fontWeight:900,fontSize:18,color:C.az}}>{brl(met.avg)}</div>
          </div>
          <div style={{background:C.ouC,padding:12,borderRadius:12,textAlign:"center"}}>
            <div style={{fontSize:10,color:C.ou2,fontWeight:800}}>TOTAL VISITAS</div>
            <div style={{fontWeight:900,fontSize:18,color:C.ou2}}>{met.totV}</div>
          </div>
        </div>

        <div style={{fontWeight:800,fontSize:11,color:C.sb,marginBottom:10}}>TOP ATIVIDADES</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {met.sortedCampos.slice(0,5).map(([nome,qtd])=>(
            <div key={nome} style={{fontSize:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span>{nome}</span><span style={{fontWeight:800}}>{qtd}</span></div>
              <div style={{height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:C.az,width:(qtd/met.totV*100)+"%"}}/></div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {aba==="admLog" && (
      <div style={{background:"#fff",borderRadius:14,padding:16,border:`1px solid ${C.bd}`,animation:"up .3s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Auditoria Administrativa</div>
          <button onClick={relAdm} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(adminLogs||[]).slice(0,vis).map(l=>(
            <div key={l.id} style={{fontSize:11, borderBottom:`1px solid ${C.bd}22`, paddingBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:800}}>{l.adminNome} ({l.role})</span>
                <span style={{color:C.sb}}>{fDT(l.data)}</span>
              </div>
              <div style={{marginTop:3}}><span style={{fontWeight:800,color:l.acao==="EXCLUSAO"?C.rd:C.az}}>[{l.acao}]</span> {l.detalhes}</div>
            </div>
          ))}
        </div>
        <VerMais total={(adminLogs||[]).length} visiveis={vis} setVisiveis={setVis} />
      </div>
    )}

    {aba==="hist" && (
      <div style={{display:"flex",flexDirection:"column",gap:10,animation:"up .3s"}}>
        {campanhas.length === 0 && <V em="📚" msg="Ainda não existem campanhas encerradas no histórico." />}
        {campanhas.map(camp => (
          <div key={camp.id} style={{background:"#fff",borderRadius:14,padding:14,border:`1px solid ${C.bd}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontWeight:900,fontSize:14,color:C.tx}}>{camp.nome}</div>
                <div style={{fontSize:10,color:C.sb}}>{fD(camp.inicio)} — {fD(camp.fim)}</div>
              </div>
              <button onClick={()=>{
                const m = camp.metricas;
                const dados = [
                  ["Total Clientes", m.totalClientes],
                  ["Total Visitas", m.totalVisitas],
                  ["Movimentação Total", brl(m.totalMovimentado)],
                  ["Ticket Médio", brl(m.ticketMedio)],
                  ["Prêmios Entregues", m.premiosEntregues],
                  ["Prêmios Pendentes", m.premiosNaoEntregues],
                  ["Clientes s/ Progresso", m.clientesSemProgresso],
                  ...m.detalhes.map(([n,v]) => ["Uso: "+n, v])
                ];
                exportPDF("Relatório de Campanha Encerrada", ["Indicador", "Resultado"], dados);
              }} style={{background:"none",border:`1px solid ${C.bd}`,borderRadius:8,padding:"5px 10px",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>📊 Ver Relatório</button>
            </div>
            <div style={{fontSize:11,color:C.sb,background:C.bg,padding:8,borderRadius:8}}>
              Encerrada em {fDT(camp.dataFechamento)}
            </div>
          </div>
        ))}
      </div>
    )}

    <div style={{marginTop:20,padding:18,background:C.rdC,borderRadius:16,border:`1.5px dashed ${C.rd}44`,textAlign:"center"}}>
      <div style={{fontWeight:900,fontSize:14,color:C.rd,marginBottom:6}}>⚠️ Encerrar Campanha Atual</div>
      <div style={{fontSize:11,color:C.rd,opacity:.8,marginBottom:15,lineHeight:1.5}}>Ao encerrar, os dados da campanha atual serão salvos no histórico e a base de visitas será limpa para um novo ciclo.</div>
      <button onClick={fecharCampanha} style={{background:C.rd,color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 15px ${C.rd}44`}}>🔒 Fechar Campanha e Limpar Dados</button>
    </div>
  </div>);
}

/* ═══════ ADMIN PANEL ═══════ */
function AdminPanel({admins,setAdmins,ops,setOps,cl,setCl,pr,setPr,cfg,setCfg,campanhas,setCampanhas,setTela,setRole,adminSel,setAdminSel,opPrizes,setOpPrizes,adminLogs,setAdminLogs,logAdminAction,reverterAcao,checkM}){
  const[aba,setAba]=useState("dash");
  const[bus,setBus]=useState("");
  const totPoints=useMemo(()=>{
    let n=0; 
    cl.forEach(c=>(c.auths||[]).forEach(a=>{
      if(a.status === "approved" || (a.status === "pending" && a.valida !== false)) n++;
    }));
    return n;
  },[cl]);
  const totA=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.length||0),0),[cl]);
  const hjA=useMemo(()=>{const h=hoje();let n=0;cl.forEach(c=>(c.auths||[]).forEach(a=>{if(a.data?.slice(0,10)===h)n++;}));return n;},[cl]);
  const encerrada = new Date() > new Date((cfg.dataFim||"2100-01-01") + "T23:59:59");
  const pendsG = useMemo(()=> {
    if(encerrada) return 0;
    return cl.reduce((s,c)=>s+(c.auths?.filter(a=>a.status==="pending").length||0),0);
  },[cl, encerrada]);

  // Auto-finalização sugerida
  useEffect(() => {
    if (encerrada && (cl.some(c => (c.auths || []).length > 0) || pr.length > 0)) {
       const timer = setTimeout(() => {
          if (window.confirm(`📢 CAMPANHA ENCERRADA!
A data de término (${fD(cfg.dataFim)}) já passou.
Para iniciar um novo ciclo, você deve gerar o Relatório Final agora.
Isso irá ARQUIVAR os dados atuais e LIMPAR o histórico de visitas/prêmios para a nova campanha.
Deseja ir para a tela de Relatórios agora?`)) {
           setAba("rel");
           // Role relatórios tem o botão de fechar campanha no final
          }
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [encerrada, cl, pr]);

  const pendsP = useMemo(()=> {
    if(encerrada) return 0;
    const hj = new Date();
    return pr.filter(p => {
      if(p.status === "redeemed") return false;
      const dVal = p.validade || new Date(new Date(p.data).getTime() + (cfg.validadeDias||30)*86400000);
      const expirado = new Date(dVal) < hj;
      if(expirado) return false;
      // Alertar se pendente ou se aprovado mas ainda não retirado
      return p.status === "pending" || p.status === "approved";
    }).length;
  }, [pr, cfg, encerrada]);

  const terminaHoje = hoje() === cfg.dataFim;





  const ABAS=[
    {id:"dash",emoji:"📊",label:"Painel"},
    {id:"ops",emoji:"🏅",label:"Operadoras"},
    {id:"cl",emoji:"👥",label:"Clientes",badge:pendsG},
    {id:"pr",emoji:"🎁",label:"Prêmios",badge:pendsP},
    {id:"rel",emoji:"📈",label:"Relatórios"},
    {id:"cfg",emoji:"⚙️",label:"Ajustes"}
  ];
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
    <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,padding:"18px 18px 22px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:170,height:170,borderRadius:"50%",background:C.ou,opacity:.07}}/>
      <button onClick={()=>{setRole(null);setTela("home");}} style={BV}>← Sair</button>
      <div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>🔒 Administrador <span style={{fontSize:12,fontWeight:400,opacity:.8}}>({adminSel?.nome})</span> <span style={{fontSize:9,background:C.vd,color:"#fff",padding:"2px 6px",borderRadius:5,marginLeft:5}}>v2.4-STABLE</span></div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.65)"}}>{adminSel?.role==="master"?"Acesso Total (Master)":"Acesso Limitado (Gerência)"}</div>

      <div style={{display:"flex",gap:6,marginTop:13,overflowX:"auto",paddingBottom:5,scrollbarWidth:"none"}}>
        {[["👥",cl.length,"Clientes"],["✅",totPoints,"Válidas"],["🏪",totA,"Registros"],["🎟️",pr.filter(p=>p.tipo==="raspadinha"&&(p.status==="approved"||p.status==="redeemed")).length,"Metas"],["⚡",pr.filter(p=>p.tipo==="relampago"&&(p.status==="approved"||p.status==="redeemed")).length,"Relâmp."]].map(([em,v,l])=>(
          <div key={l} style={{flex:"1 0 62px",background:"rgba(255,255,255,.1)",borderRadius:9,padding:"7px 2px",textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
            <div style={{fontSize:13}}>{em}</div><div style={{fontWeight:900,fontSize:14,color:"#fff",lineHeight:1}}>{v}</div>
            <div style={{fontSize:7,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.3,marginTop:1}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{flex:1,padding:"13px 13px 76px",animation:"up .3s"}}>
      {aba==="dash" && (
        <>
          {hoje() === cfg.dataFim && (
            <div style={{background:C.rd, color:"#fff", padding:"12px 16px", borderRadius:14, marginBottom:16, display:"flex", alignItems:"center", gap:12, boxShadow:`0 8px 20px ${C.rd}44`, border:`1px solid rgba(255,255,255,.2)`}}>
              <span style={{fontSize:24, animation:"dt 1s infinite"}}>🚨</span>
              <div>
                <div style={{fontWeight:900, fontSize:14}}>ATENÇÃO: A campanha se encerra HOJE!</div>
                <div style={{fontSize:11, opacity:.9}}>Após as 23:59h o app cliente entrará em modo "Somente Leitura".</div>
                <div style={{fontSize:10, fontWeight:800, marginTop:4, background:"rgba(0,0,0,.2)", padding:"2px 8px", borderRadius:4, display:"inline-block"}}>Amanhã você deverá gerar o Relatório Final para zerar o histórico.</div>
              </div>
            </div>
          )}
          <ADash ops={ops} cl={cl} pr={pr} cfg={cfg} setAba={setAba} setBus={setBus} encerrada={encerrada}/>
        </>
      )}

      {aba==="ops" && <AOps ops={ops} setOps={setOps} cl={cl} cfg={cfg} setCfg={setCfg} opPrizes={opPrizes} setOpPrizes={setOpPrizes} op={null} checkM={checkM} adminSel={adminSel} />}
      {aba==="cl"  && <ACl cl={cl} setCl={setCl} ops={ops} cfg={cfg} pr={pr} setPr={setPr} bus={bus} setBus={setBus} op={null} checkM={checkM} />}
      {aba==="pr"  && <APr pr={pr} cl={cl} cfg={cfg} setPr={setPr} checkM={checkM} />}

      {aba==="rel" && <ARels cl={cl} setCl={setCl} pr={pr} setPr={setPr} ops={ops} opPrizes={opPrizes} setOpPrizes={setOpPrizes} cfg={cfg} setCfg={setCfg} campanhas={campanhas} setCampanhas={setCampanhas} adminLogs={adminLogs} setAdminLogs={setAdminLogs} checkM={checkM} adminSel={adminSel} />}
      {aba==="cfg" && <ACfg cfg={cfg} setCfg={setCfg} ops={ops} setOps={setOps} cl={cl} pr={pr} checkM={checkM} adminSel={adminSel} setAdminSel={setAdminSel} admins={admins} setAdmins={setAdmins} adminLogs={adminLogs} logAdminAction={logAdminAction} reverterAcao={reverterAcao} />}
      <div style={{marginTop:20,paddingBottom:20,textAlign:"center",fontSize:13,color:C.az,fontWeight:900}}>
        Fluxo de Fidelidade — <strong>Lotérica Central</strong><br/>
        Desenvolvido por <strong>FluxAI Marketing Digital</strong>
      </div>
    </div>
    <Nav abas={ABAS} aba={aba} setAba={setAba} cor={C.az}/>
  </div>);
}

function ADash({ops,cl,pr,cfg,setAba,setBus,encerrada}){
  const totA=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.length||0),0),[cl]);
  const totP=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.filter(a=>a.valida!==false && a.status!=="rejected").length||0),0),[cl]);
  const prontos=useMemo(() => {
    if(encerrada) return [];
    return cl.filter(c => 
      pr.some(p => p.clientId === c.id && p.tipo === "raspadinha" && p.status === "pending")
    );
  }, [cl, pr, encerrada]);
  const perto=cl.filter(c=>{
    const vs=c.auths?.filter(a=>a.valida!==false)||[];
    const p=vs.length%cfg.meta;
    return p>0 && p>=cfg.meta-3;
  });
  const gr=useMemo(()=>{const m={};cl.forEach(c=>(c.auths||[]).forEach(a=>{const k=mAno(a.data);if(!m[k])m[k]={mes:k,auths:0};m[k].auths++;}));return Object.values(m).sort((a,b)=>a.mes.localeCompare(b.mes)).slice(-8);},[cl]);
  const lastReset = cfg.lastReset || "2000-01-01";
  const lrTime = new Date(lastReset).getTime();
  const topOps=useMemo(()=>ops.map((o,i)=>{
    let t=0;
    cl.forEach(c=>(c.auths||[]).forEach(a=>{
      const isVal = a.status === "approved" || (a.status === "pending" && a.valida !== false);
      if(a.opId===o.id && isVal && new Date(a.data).getTime() >= lrTime) t++;
    }));
    return{op:o,t,i};
  }).sort((a,b)=>b.t-a.t).slice(0,5),[ops,cl,lastReset]);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="📊" t="Dashboard" s="Visão completa da lotérica"/>
    
    {!encerrada && pr.filter(p=>p.tipo==="relampago" && p.status==="pending").length > 0 && (
       <div style={{background:C.rx,color:"#fff",padding:14,borderRadius:13,boxShadow:`0 4px 15px ${C.rx}44`,display:"flex",alignItems:"center",gap:12,animation:"pop .4s",marginBottom:11}}>
         <span style={{fontSize:24}}>⚡</span>
         <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:14}}>Novo Prêmio Relâmpago Pendente!</div>
            <div style={{fontSize:11,opacity:.9}}>Audite o histórico do cliente para conferir e aprovar.</div>
         </div>
       </div>
    )}

    {prontos.length>0&&<div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`2px solid ${C.ou}55`,boxShadow:`0 4px 14px ${C.ou}22`,marginBottom:11}}>
      <div style={{background:C.ou,padding:"9px 13px",display:"flex",gap:7,alignItems:"center"}}><span style={{fontSize:16}}>{cfg.premioMeta.emoji}</span><span style={{fontWeight:800,fontSize:12,color:C.az}}>{prontos.length} cliente{prontos.length>1?"s":""} atingiu a meta de {cfg.meta} pontos!</span></div>
      {prontos.slice(0,3).map(c=>{
        const vs=c.auths.filter(a=>a.valida!==false);
        return(<div key={c.id} style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{c.nome}</div><div style={{fontSize:10,color:C.sb}}>{vs.length} pontos válidos</div></div>
        <button onClick={()=>{ setBus(c.whats); setAba("cl"); }} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🔍 Auditar</button>
      </div>);})}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {[
        ["👥","Clientes",cl.length,C.az],
        ["🏪","Registros",totA,C.rx],
        ["✅","Visitas Válidas",totP,C.vd],
        ["🏆","Prêmios Meta",pr.filter(p=>p.tipo==="raspadinha"&&(p.status==="approved"||p.status==="redeemed")).length,C.ou2],
        ["⚡","Relâmpagos",pr.filter(p=>p.tipo==="relampago"&&(p.status==="approved"||p.status==="redeemed")).length,C.rx]
      ].map(([em,t,v,cor],i)=>(
        <div key={t} style={{background:"#fff",borderRadius:12,padding:"12px",border:`1px solid ${C.bd}`,gridColumn:i===0?"span 1":i===1?"span 1":"span 1"}}>
          <div style={{fontSize:20,marginBottom:4}}>{em}</div><div style={{fontWeight:900,fontSize:22,color:cor,lineHeight:1}}>{v}</div>
          <div style={{fontWeight:800,fontSize:10,color:C.tx,marginTop:2}}>{t}</div>
        </div>
      ))}
    </div>
    {gr.length>0&&<div style={{background:"#fff",borderRadius:13,padding:"12px 11px",border:`1px solid ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:12,color:C.tx,marginBottom:10}}>📈 Visitas Válidas por Mês</div>
      <ResponsiveContainer width="100%" height={140}><BarChart data={gr} margin={{left:-20,right:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
        <XAxis dataKey="mes" tick={{fill:C.sb,fontSize:8}} tickLine={false}/>
        <YAxis tick={{fill:C.sb,fontSize:8}} axisLine={false} tickLine={false}/>
        <Tooltip contentStyle={{background:"#fff",border:`1px solid ${C.bd}`,fontSize:10,borderRadius:8}}/>
        <Bar dataKey="auths" radius={[5,5,0,0]}>{gr.map((_,i)=><Cell key={i} fill={i===gr.length-1?C.ou:C.az} fillOpacity={i===gr.length-1?1:.7}/>)}</Bar>
      </BarChart></ResponsiveContainer>
    </div>}
    {topOps.length>0&&<div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bd}`,fontWeight:800,fontSize:12,color:C.tx}}>🏅 Top Operadoras</div>
      {topOps.map((r,i)=><div key={r.op.id} style={{padding:"9px 13px",borderBottom:i<topOps.length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:oc(r.i),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff",flexShrink:0}}>{i+1}</div>
        <span style={{flex:1,fontWeight:700,fontSize:12,color:C.tx}}>{r.op.nome}</span>
        <span style={{fontWeight:900,fontSize:14,color:C.az}}>{r.t}</span>
      </div>)}
    </div>}
    {perto.length>0&&<div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bd}`,fontWeight:800,fontSize:12,color:C.tx}}>⚡ Quase na meta</div>
      {perto.slice(0,5).map((c,i)=>{
        const vs=c.auths.filter(a=>a.valida!==false);
        const falt=cfg.meta-vs.length%cfg.meta;
        return(<div key={c.id} style={{padding:"9px 13px",borderBottom:i<4?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <span style={{flex:1,fontWeight:700,fontSize:12,color:C.tx}}>{c.nome?.split(" ")[0]}</span>
        <span style={{background:C.ouC,color:C.ou2,fontSize:10,fontWeight:800,padding:"2px 9px",borderRadius:20}}>Falta{falt>1?"m":""} {falt}</span>
      </div>);})}
    </div>}
    <FeedbackDash cl={cl} ops={ops}/>
  </div>);
}

function FeedbackDash({cl,ops}){
  const feeds = useMemo(() => {
    const list = [];
    cl.forEach(c => (c.auths||[]).forEach(a => {
      if(a.nota > 0 || a.obs) list.push({...a, cNome: c.nome});
    }));
    return list.sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0,10);
  }, [cl]);

  if(feeds.length===0) return null;

  return (<div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
    <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bd}`,fontWeight:800,fontSize:12,color:C.tx}}>💬 Feedbacks Recentes</div>
    {feeds.map((f,i) => (
      <div key={f.id} style={{padding:"10px 13px",borderBottom:i<feeds.length-1?`1px solid ${C.bd}22`:"none",display:"flex",flexDirection:"column",gap:4}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:11,color:C.tx}}>{f.cNome} <span style={{fontWeight:400,color:C.sb}}>atendido por</span> {ops.find(o=>o.id===f.opId)?.nome||f.opNome}</div>
          {f.nota > 0 && <span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:20}}>⭐ {f.nota}</span>}
        </div>
        {f.obs && <div style={{fontSize:10,color:C.sb,background:C.bg,padding:"6px 10px",borderRadius:8,fontStyle:"italic"}}>"{f.obs}"</div>}
        <div style={{fontSize:9,color:C.sb,textAlign:"right"}}>{fDT(f.data)}</div>
      </div>
    ))}
  </div>);
}

function AOps({ops,setOps,cl,cfg,setCfg,opPrizes,setOpPrizes,op,checkM,adminSel}){
  const[eId,setEId]=useState(null);const[eN,setEN]=useState("");
  const[visR,setVisR]=useState(15);const[visP,setVisP]=useState(15);
  const lastReset = cfg.lastReset || "2000-01-01";
  const lrTime = new Date(lastReset).getTime();
  const rank=useMemo(()=>ops.map((o,i)=>{
    let a=0,cs=new Set();
    cl.forEach(c=>(c.auths||[]).forEach(x=>{
      const isVal = x.status === "approved" || (x.status === "pending" && x.valida !== false);
      if(x.opId===o.id && isVal && new Date(x.data).getTime() >= lrTime){
        a++; cs.add(c.id);
      }
    }));
    return{op:o,i,a,cs:cs.size};
  }).sort((a,b)=>b.a-a.a),[ops,cl,lastReset]);

  function encerrarCiclo(){
    if(!window.confirm("Deseja encerrar o ciclo mensal atual? Os 2 primeiros colocados serão registrados para premiação e o ranking voltará a zero.")) return;
    const v1 = rank[0]; const v2 = rank[1];
    if(!v1 || v1.a === 0){ alert("Nenhuma autenticação registrada neste ciclo."); return; }
    let periodo = mAno(lastReset);
    if(periodo === "Início") periodo = mAno(now());
    const novoPremio = {
      id: uid(),
      data: now(),
      periodo: periodo,
      vencedores: [
        {opId: v1.op.id, opNome: v1.op.nome, auths: v1.a, rank: 1},
        ...(v2 && v2.a > 0 ? [{opId: v2.op.id, opNome: v2.op.nome, auths: v2.a, rank: 2}] : [])
      ],
      status: "pending"
    };
    setOpPrizes([novoPremio, ...(opPrizes||[])]);
    setCfg({...cfg, lastReset: now()});
    alert("✅ Ciclo encerrado com sucesso! Vencedores registrados.");
  }

  function pagar(pid){
    if(!window.confirm("Confirmar que os prêmios deste ciclo foram pagos?")) return;
    setOpPrizes(opPrizes.map(p=>p.id===pid?{...p, status:"paid", paidAt:now()}:p));
  }
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="🏅" t="Operadoras" s={`${ops.length} cadastradas`}/>
    {rank.length > 0 && (
      <div style={{background:C.az,borderRadius:14,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,boxShadow:`0 4px 12px ${C.az}44`}}>
        <div><div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:800,textTransform:"uppercase"}}>Ciclo Mensal Atual</div><div style={{color:"#fff",fontWeight:900,fontSize:14}}>Desde {fD(lastReset)}</div></div>
        <button onClick={async ()=>{if(await checkM("Encerrar o ciclo mensal? Esta ação zerará o ranking atual. Digite sua Senha de Alteração e Exclusão:")) await encerrarCiclo();}} style={{background:C.ou,color:C.az,border:"none",borderRadius:9,padding:"8px 14px",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🏆 Encerrar Ciclo</button>
      </div>
    )}

    {rank.slice(0,visR).map((r,i)=><div key={r.op.id} style={{background:"#fff",borderRadius:13,padding:"13px",border:i<2?`2px solid ${C.ou}55`:`1px solid ${C.bd}`}}>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:oc(r.i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#fff",flexShrink:0}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
        <div style={{flex:1}}>
          {eId===r.op.id?<div style={{display:"flex",gap:5}}><input value={eN} onChange={e=>setEN(e.target.value)} style={{flex:1,...I,padding:"5px 9px",fontSize:12}}/><button onClick={()=>{setOps(ops.map(o=>o.id===r.op.id?{...o,nome:eN}:o));setEId(null);}} style={{background:C.vd,color:"#fff",border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓</button><button onClick={()=>setEId(null)} style={{background:"#f3f4f6",color:C.sb,border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button></div>
          :<div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{fontWeight:800,fontSize:14,color:C.tx}}>{r.op.nome}</div>{i<2&&<span style={{background:C.ouC,color:(op && r.op.id===op.id)?C.vd:C.ou2,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>{(op && r.op.id===op.id)?"VOCÊ":"🏆 Dia 05"}</span>}<div style={{marginLeft:"auto",display:"flex",gap:10}}>{adminSel?.role==="master" && <div style={{fontSize:11,fontFamily:"monospace",fontWeight:800,color:C.az,background:C.azC,padding:"2px 6px",borderRadius:6,border:`1px solid ${C.bd}`}} title="Senha atual">{r.op.senha||"1234"}</div>}<button onClick={async ()=>{if(await checkM(`Resetar senha de ${r.op.nome} para 1234? Digite sua Senha de Alteração e Exclusão:`)) setOps(ops.map(o=>o.id===r.op.id?{...o,senha:"1234"}:o));}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer"}} title="Resetar para 1234">🔄</button><button onClick={()=>{setEId(r.op.id);setEN(r.op.nome);}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer"}}>✏️</button><button onClick={async ()=>{if(await checkM(`Remover operadora ${r.op.nome}? Digite sua Senha de Alteração e Exclusão:`, {tipo: 'operadora', dado: r.op})) setOps(ops.filter(o=>o.id!==r.op.id));}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer"}}>🗑️</button></div></div>}
          <div style={{fontSize:10,color:C.sb,marginTop:2}}>Desde {fD(r.op.cadastro)}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["✅","Visitas Válidas",r.a,C.az],["👥","Clientes",r.cs,C.vd]].map(([em,l,v,cor])=><div key={l} style={{background:C.bg,borderRadius:9,padding:"8px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:cor}}>{v}</div><div style={{fontSize:9,color:C.sb,textTransform:"uppercase",letterSpacing:.5}}>{em} {l}</div></div>)}</div>
      <div style={{marginTop:8,background:"#f3f4f6",borderRadius:6,height:5,overflow:"hidden"}}><div style={{height:"100%",background:oc(r.i),borderRadius:6,width:(r.a/Math.max(rank[0]?.a||1,1)*100)+"%"}}/></div>
    </div>)}
    <VerMais total={rank.length} visiveis={visR} setVisiveis={setVisR} />
    {ops.length===0&&<V em="👤" msg="Nenhuma operadora cadastrada."/>}

    {opPrizes && opPrizes.length > 0 && (
      <div style={{marginTop:20}}>
        <T em="🎁" t="Histórico de Prêmios" s="Controle de pagamentos das operadoras"/>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:10}}>
          {opPrizes.slice(0,visP).map(p => (
            <div key={p.id} style={{background:"#fff",borderRadius:13,padding:14,border:`1px solid ${p.status==="paid"?C.vd+"33":C.bd}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontWeight:800,fontSize:13,color:C.tx}}>Ciclo {p.periodo}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{background:p.status==="paid"?C.vdC:C.ouC,color:p.status==="paid"?C.vd:C.ou2,fontSize:9,fontWeight:900,padding:"2px 8px",borderRadius:20}}>{p.status==="paid"?"✅ PAGO":"⏳ PENDENTE"}</div>
                  <button onClick={async ()=>{if(await checkM("Remover este registro do histórico de prêmios? Digite sua Senha de Alteração e Exclusão:", {tipo: 'opPrize', dado: p})) setOpPrizes(opPrizes.filter(x=>x.id!==p.id));}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:.6}}>🗑️</button>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {p.vencedores.map(v => (
                  <div key={v.opId} style={{display:"flex",justifyContent:"space-between",fontSize:12,alignItems:"center",background:C.bg,padding:"6px 10px",borderRadius:8}}>
                    <span style={{fontWeight:700}}>{v.rank}º {v.opNome}</span>
                    <span style={{fontWeight:800,color:C.az}}>{v.auths} visitas válidas</span>
                  </div>
                ))}
              </div>
              {p.status === "pending" && (
                <button onClick={()=>pagar(p.id)} style={{width:"100%",marginTop:12,background:C.vd,color:"#fff",border:"none",borderRadius:9,padding:"8px",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Confirmar Pagamento</button>
              )}
              {p.status === "paid" && (
                <div style={{fontSize:9,color:C.sb,textAlign:"right",marginTop:8}}>Pago em {fDT(p.paidAt)}</div>
              )}
            </div>
          ))}
          <VerMais total={opPrizes.length} visiveis={visP} setVisiveis={setVisP} />
        </div>
      </div>
    )}
  </div>);
}

function AAud({a,c,corS,labelS,opN,brl,fDT,cfg,setCl,cl,pr,setPr,setVoucherVer,checkM}){
  const [expA, setExpA] = useState(false);
  const [edit, setEdit] = useState(false);
  const [fEdit, setFEdit] = useState(a.detalhes||{});
  useEffect(()=>{ if(edit) setFEdit(a.detalhes||{}); },[edit, a.detalhes]);
  
  const s = a.status || (a.valida!==false?"approved":"rejected");
  const updateStatusNative = async (newS) => {
    if(newS==="rejected" && !window.confirm("Deseja realmente RECUSAR esta autenticação?")) return;
    const newAuths = c.auths.map(x=>x.id===a.id?{...x, status:newS, modificado:false, obsAdmin:newS==="rejected"?"Recusado":""}:x);
    setCl(cl.map(x=>x.id===c.id?{...x, auths:newAuths}:x));
    if(newS==="rejected"){
      setPr(pr.map(p=>p.authId===a.id && p.status !== "redeemed" ? {...p,status:"rejected"}:p));
    }
  };
  const excluirAuthNative = async () => {
    const s = window.prompt("Tem certeza que deseja EXCLUIR permanentemente? Digite a Senha de Alteração:");
    if(s !== (adminSel.senhaMestra || "123456")) {
      if(s !== null) alert("❌ Senha incorreta!");
      return;
    }
    const associatedPrize = pr.find(p=>p.authId===a.id);
    setCl(cl.map(x=>x.id===c.id?{...x, auths:c.auths.filter(y=>y.id!==a.id)}:x));
    setPr(pr.filter(p=>p.authId!==a.id));
    logAdminAction("EXCLUSAO", "Exclusão de Autenticação", {tipo: 'auth', clientId: c.id, dado: a, prize: associatedPrize});
  };
  const updPrize = async (pid, newS) => {
    if(newS==="approved") {
      const pObj = pr.find(x=>x.id===pid);
      if(pObj?.tipo === "raspadinha"){
        const hasPending = c.auths.some(ax => (ax.status === "pending" || !ax.status) && ax.valida !== false);
        if(hasPending){
          alert("⚠️ Não é possível aprovar o PRÊMIO META ainda. Existem Visitas PENDENTES que precisam ser auditadas primeiro.");
          return;
        }
      }
    }
    if(newS==="rejected" && !(await customConfirm("Recusar Prêmio", "Deseja realmente RECUSAR este prêmio?", "❌", "Sim, Recusar"))) return;
    if(newS==="rejected") {
      setPr(pr.map(p=>p.id===pid?{...p, status:"rejected"}:p));
      const auth = c.auths.find(x=>x.id===a.id);
      if(auth) {
        const newAuths = c.auths.map(x=>x.id===a.id?{...x, modificado:false}:x);
        setCl(cl.map(x=>x.id===c.id?{...x, auths:newAuths}:x));
      }
    } else {
      setPr(pr.map(p=>p.id===pid?{...p, status:newS}:p));
    }
  };
  function handleUpload(e){
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=async()=>{
      const img=r.result;
      const newAuths = c.auths.map(x=>x.id===a.id?{...x, foto:img}:x);
      await setCl(cl.map(x=>x.id===c.id?{...x, auths:newAuths}:x));
      alert("✅ Comprovante anexado!");
    };
    r.readAsDataURL(f);
  }
  function salvarEdicao() {
    let t = 0; let totalP = 0; let totalJ = 0;
    const sels=[]; const idsSels=[];
    cfg.formulario.campos.forEach(campo=>{
      const v = fEdit[campo.id];
      if(v) {
        const val = parseFloat(v);
        if(campo.comValor) {
           t += val;
           if(campo.cat === "bc") totalP += val;
           if(campo.cat === "jg") totalJ += val;
        }
        sels.push(campo.nome);
        idsSels.push(campo.id);
      }
    });

    const isV = totalP >= (cfg.minVisita || 300);
    const newStatus = a.status === "redeemed" ? "redeemed" : (isV ? "pending" : "not_counted");
    const emojis = idsSels.map(id=>cfg.formulario.campos.find(f=>f.id===id)?.emoji||"");

    const newAuths = c.auths.map(x=>x.id===a.id?{...x, detalhes:fEdit, total:t, selecionados:idsSels, emojis:emojis, valida:isV, status:newStatus, modificado:false}:x);
    setCl(cl.map(x=>x.id===c.id?{...x, auths:newAuths}:x));

    // Sincronizar prêmios
    const minR = cfg.minRelampago || 60;
    const minV = cfg.minVisita || 300;
    const temPrRl = pr.some(px=>px.authId===a.id && px.tipo==="relampago");
    
    setPr(pr.map(p=>{
      if(p.authId===a.id && p.status !== "redeemed"){
        const qualifies = (p.tipo === "relampago" && totalJ >= minR) || (p.tipo === "raspadinha" && totalP >= minV);
        if(!qualifies) return {...p, status: "not_counted"};
        if(p.status === "not_counted" || p.status === "rejected") return {...p, status: "pending"};
      }
      return p;
    }));

    if(totalJ >= minR && !temPrRl){
       // Criar novo se agora qualifica e não existia
       const ativos = cfg.relampagos.filter(r=>r.ativo);
       if(ativos.length > 0){
          const sort = ativos[Math.floor(Math.random()*ativos.length)];
          const newP = {id:Math.random().toString(36).substr(2,9), clientId:c.id, authId:a.id, tipo:"relampago", nome:sort.nome, emoji:sort.emoji, desc:sort.desc, data:new Date().toISOString(), status:"pending"};
          setPr(curr => [...curr, newP]);
       }
    }

    setEdit(false);
    alert("✅ Valores e Status atualizados!");
  }

  return(
    <div style={{background:"#fff",borderRadius:10,border:`1px solid ${expA?C.az:C.bd+"66"}`,overflow:"hidden"}}>
      <div onClick={()=>setExpA(!expA)} style={{padding:10,display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:expA?C.azC:"#fff"}}>
        <div style={{width:24,height:24,borderRadius:6,background:`${corS}15`,color:corS,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{s==="approved"?"✅":s==="pending"?"⏳":s==="not_counted"?"📜":"❌"}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:C.tx}}>{fDT(a.data)} <span style={{fontWeight:400,color:C.sb}}>por {opN(a.opId)}</span></div>
          <div style={{fontSize:10,color:C.sb}}>{brl(a.total)} · {labelS} · <span style={{fontWeight:800,color:C.az}}>#{a.controle}</span></div>
          {s === "not_counted" && (a.obsAdmin || pr.some(p=>p.authId===a.id && p.status==="rejected")) && (
            <div style={{background:C.rdC, color:C.rd, fontSize:8, fontWeight:900, padding:"1px 6px", borderRadius:4, display:"inline-block", marginTop:4, border:`1px solid ${C.rd}33`}}>❌ AGUARDANDO CLIENTE (EM LOJA)</div>
          )}
        </div>
        <div style={{fontSize:12,color:C.sb}}>{expA?"▲":"▼"}</div>
      </div>
      {a.modificado && !expA && <div style={{background:C.ou, color:"#fff", fontSize:8, fontWeight:900, textAlign:"center", padding:"2px 0", textTransform:"uppercase"}}>🔄 Corrigido pelo Cliente</div>}
      {expA && <div style={{padding:12,borderTop:`1px solid ${C.bd}33`,background:"#fafafa"}}>
         {a.modificado && <div style={{background:C.ouC, color:C.ou2, padding:"6px 10px", borderRadius:8, fontSize:9, fontWeight:800, marginBottom:10, border:`1px solid ${C.ou}22`}}>🔄 Corrigido pelo Cliente</div>}
         {edit ? (
           <div style={{marginBottom:12,padding:10,background:"#fff",borderRadius:8,border:`1px solid ${C.bd}`}}>
             <div style={{fontWeight:800,fontSize:11,marginBottom:8}}>✏️ Editar Valores e Serviços</div>
             {cfg.formulario.campos.map(f => (
               <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                 <label style={{fontSize:11,color:C.sb}}>{f.emoji} {f.nome}</label>
                 {f.comValor ? (
                   <input type="number" value={fEdit[f.id]||""} onChange={e=>setFEdit({...fEdit, [f.id]:e.target.value})} style={{width:80,padding:"4px 8px",borderRadius:6,border:`1px solid ${C.bd}`,fontSize:11}} placeholder="R$..." />
                 ) : (
                   <input type="checkbox" checked={!!fEdit[f.id]} onChange={e=>setFEdit({...fEdit, [f.id]:e.target.checked})} />
                  )}
               </div>
             ))}
             <div style={{display:"flex",gap:6,marginTop:10}}>
               <button onClick={salvarEdicao} style={{flex:1,background:C.vd,color:"#fff",border:"none",borderRadius:6,padding:6,fontSize:10,fontWeight:800,cursor:"pointer"}}>Salvar</button>
               <button onClick={()=>setEdit(false)} style={{flex:1,background:C.bg,color:C.sb,border:`1px solid ${C.bd}`,borderRadius:6,padding:6,fontSize:10,fontWeight:800,cursor:"pointer"}}>Cancelar</button>
             </div>
           </div>
         ) : (
           <div style={{fontSize:11,display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
              {Object.entries(a.detalhes||{}).map(([fid, val]) => {
                const f = cfg.formulario.campos.find(x=>x.id===fid);
                if(!f || !val) return null;
                return <div key={fid} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}11`,paddingBottom:2}}>
                  <span>{f.emoji} {f.nome}</span>
                  <strong style={{color:C.tx}}>{f.comValor?brl(val):"Sim"}</strong>
                </div>
              })}
              <button onClick={()=>setEdit(true)} style={{alignSelf:"flex-start",background:"none",border:"none",color:C.az,fontSize:10,fontWeight:800,cursor:"pointer",marginTop:4,padding:0}}>✏️ Editar valores</button>
           </div>
         )}
         
         {a.foto ? (
           <img src={a.foto} style={{width:"100%",borderRadius:8,marginBottom:12,cursor:"pointer"}} onClick={()=>window.open(a.foto)} alt="comprovante"/>
         ) : (
           <div style={{marginBottom:12,padding:12,border:`1px dashed ${C.bd}`,textAlign:"center",borderRadius:8}}>
             <div style={{fontSize:10,color:C.sb,marginBottom:6}}>⚠️ Sem comprovante</div>
             <label style={{background:C.bg,color:C.tx,border:`1px solid ${C.bd}`,borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
               📎 Anexar Comprovante
               <input type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}} />
             </label>
           </div>
         )}
         
         {pr.filter(px=>px.authId===a.id).map(px=>(
            <div key={px.id} style={{marginBottom:12,padding:10,background:px.status==="pending"?C.ouC:px.status==="approved"?C.vdC:C.rdC,borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20}}>{px.emoji||"🎁"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:800}}>{px.nome}</div>
                {px.status==="pending" ? (
                  <div style={{display:"flex",gap:5,marginTop:5}}>
                    <button onClick={async ()=>await updPrize(px.id,"approved")} style={{background:C.vd,color:"#fff",border:"none",borderRadius:6,padding:"4px 8px",fontSize:9,fontWeight:800,cursor:"pointer"}}>✅ Aprovar Prêmio</button>
                    <button onClick={async ()=>await updPrize(px.id,"rejected")} style={{background:C.rd,color:"#fff",border:"none",borderRadius:6,padding:"4px 8px",fontSize:9,fontWeight:800,cursor:"pointer"}}>❌ Recusar</button>
                  </div>
                ) : px.status==="approved" ? (
                  <div style={{display:"flex",gap:5,marginTop:5}}>
                    <button onClick={()=>setVoucherVer(px)} style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 14px",fontSize:12,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🎫 Ver Cupom</button>
                  </div>
                 ) : null}
               </div>
             </div>
         ))}
         
         <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {a.valida !== false && s!=="approved" && <button onClick={async ()=>await updateStatus("approved")} style={{flex:1,minWidth:"35%",background:C.vd,color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>✅ Aprovar Autenticação</button>}
            {a.valida !== false && s!=="rejected" && <button onClick={async ()=>await updateStatus("rejected")} style={{flex:1,minWidth:"35%",background:C.rd,color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>❌ Recusar Autenticação</button>}
            <button onClick={async ()=>await excluirAuth()} style={{flex:1,minWidth:"35%",background:"#374151",color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>🗑️ Excluir Autenticação</button>
         </div>
      </div>}
    </div>
  );
}

function ACl({cl,setCl,ops,cfg,pr,setPr,bus,setBus,op,checkM}){
  const[exp,setExp]=useState(null);const[vis,setVis]=useState(15);
  const[voucherVer,setVoucherVer]=useState(null);
  const opN=id=>ops.find(o=>o.id===id)?.nome||"—";
  
  const lista=useMemo(()=>{
    const q=bus.toLowerCase().trim();
    return cl.filter(c=>{
      if(!q) return true;
      const matchNome = c.nome?.toLowerCase().includes(q);
      const matchWhats = c.whats?.includes(q);
      const matchID = (c.auths||[]).some(a => {
        const cVal = String(a.controle || a.numControle || a.nsu || "").toLowerCase();
        const dVal = Object.entries(a.detalhes || {}).map(([k,v])=>{
          const f = cfg.formulario.campos.find(x=>x.id===k);
          return (f?f.nome.toLowerCase():"") + " " + String(v).toLowerCase();
        }).join(" ");
        return cVal.includes(q) || dVal.includes(q);
      });
      return matchNome || matchWhats || matchID;
    }).sort((a,b)=>(b.auths?.length||0)-(a.auths?.length||0));
  },[cl,bus,cfg.formulario.campos]);

  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="👥" t="Todos os Clientes" s={`${cl.length} cadastrados`}/>
    <input value={bus} onChange={e=>setBus(e.target.value)} placeholder="🔍 Buscar por nome, WhatsApp ou Número de Controle…" style={{...I}}/>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {lista.length===0&&<V em="👥" msg="Nenhum cliente encontrado."/>}
      {lista.slice(0,vis).map(c=>(<div key={c.id} style={{borderBottom:`1px solid ${C.bd}22`}}>
        <div style={{padding:12,display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:exp===c.id?C.bg:"#fff"}}>
          <div onClick={()=>setExp(exp===c.id?null:c.id)} style={{width:34,height:34,borderRadius:10,background:C.azC,color:C.az,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14}}>{c.nome?.charAt(0)}</div>
          <div onClick={()=>setExp(exp===c.id?null:c.id)} style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:12,color:C.tx,display:"flex",alignItems:"center",gap:6,justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span>{c.nome}</span>
                {(c.auths?.some(a=>a.status==="pending") || pr.some(p=>p.clientId===c.id && p.status==="pending")) && <span style={{background:C.ou,color:"#fff",fontSize:8,padding:"2px 5px",borderRadius:5,fontWeight:900}}>⏳ PENDENTE</span>}
              </div>
              <div onClick={async (e)=>{e.stopPropagation(); if(await checkM(`Excluir o cliente ${c.nome} permanentemente? Digite sua Senha de Alteração e Exclusão:`, {tipo: 'cliente', dado: c})) setCl(cl.filter(x=>x.id!==c.id));}} style={{width:24,height:24,borderRadius:6,background:C.rdC,color:C.rd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer"}}>🗑️</div>
            </div>
            <div onClick={()=>setExp(exp===c.id?null:c.id)} style={{fontSize:10,color:C.sb}}>{c.auths?.length||0} registros · Faltam {cfg.meta - ((c.auths?.filter(a=>a.valida!==false && a.status==="approved").length||0)%cfg.meta)}</div>
          </div>
        </div>
        {exp===c.id&&<div style={{padding:"12px 13px",background:"#fcfdfe",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:10,color:C.sb,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>📞 {c.whats||"—"}</div>
            <div>🎂 Nascimento: {fmtDN(c.nasc)}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {c.auths?.slice().reverse().map(a=>{
               const s = a.status || (a.valida===false?"not_counted":"approved");
               const corS = s==="approved"?C.vd : s==="pending"?C.ou : s==="not_counted"?C.sb : C.rd;
               const labelS = s==="approved"?"Aprovada" : s==="pending"?"Aguardando Auditoria" : s==="not_counted"?"Histórico" : "Recusada";
               return <AAud key={a.id} a={a} c={c} corS={corS} labelS={labelS} opN={opN} brl={brl} fDT={fDT} cfg={cfg} setCl={setCl} cl={cl} pr={pr} setPr={setPr} setVoucherVer={setVoucherVer} checkM={checkM}/>;
            })}
          </div>
        </div>}
      </div>))}
    </div>
    <VerMais total={lista.length} visiveis={vis} setVisiveis={setVis} />
    {voucherVer && <OpVoucherCard p={voucherVer} cli={cl.find(c=>c.id===voucherVer.clientId)} cfg={cfg} onClose={()=>setVoucherVer(null)} />}
  </div>);
}

function APr({pr, cl, cfg, setPr, checkM}){

  const [voucherVer, setVoucherVer] = useState(null);const [vis, setVis] = useState(15);
  const cN=id=>cl.find(c=>c.id===id)?.nome||"—";
  const visPr = pr.filter(p=>p.status!=="rejected" && p.status!=="not_counted");
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="🎁" t="Prêmios Distribuídos" s={`${visPr.length} total`}/>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {[...visPr].reverse().slice(0,vis).map((p,i)=>{
        const cli=cl.find(c=>c.id===p.clientId);
        const isP = p.status==="pending";
        const isR = p.status==="redeemed";
        return(<div key={p.id} style={{background:"#fff",borderRadius:16,padding:"15px",marginBottom:10,border:`1.5px solid ${isR?C.vd+"33":C.bd}`,boxShadow:"0 4px 12px rgba(0,0,0,.03)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:12,background:p.tipo==="relampago"?(isP?C.ouC:C.rxC):(isP?C.ouC:C.vdC),display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{p.emoji||cfg.premioMeta.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:C.tx}}>{p.nome}</div>
              <div style={{fontSize:11,color:C.sb}}>Cliente: <b style={{color:C.az}}>{cli?.nome}</b></div>
            </div>
            <div style={{textAlign:"right"}}>
              {isP && <span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:20}}>PENDENTE</span>}
              {isR && <span style={{background:C.vdC,color:C.vd,fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:20}}>RETIRADO</span>}
              {p.status==="approved" && <span style={{background:C.azC,color:C.az,fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:20}}>LIBERADO</span>}
            </div>
          </div>

          {isR && (
            <div style={{background:C.bg, borderRadius:12, padding:10, marginBottom:10, border:`1px solid ${C.bd}66`}}>
              <div style={{fontSize:10, color:C.sb, fontWeight:800, textTransform:"uppercase", marginBottom:4}}>Dados da Retirada</div>
              <div style={{fontSize:11, color:C.tx}}>Operador: <b>{p.opNomeRetirada || p.opRedeemed || "Administrador"}</b></div>
              <div style={{fontSize:11, color:C.tx}}>Data: <b>{fDT(p.dataRetirada || p.redeemedAt || p.data)}</b></div>
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column", gap:8}}>
            {p.status==="approved" && (
              <>
                <div style={{background:C.bg, padding:10, borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10, color:C.sb, fontWeight:800}}>VALIDADE</div>
                    <div style={{fontWeight:900, color:C.tx}}>{fD(p.validade || new Date(new Date(p.data).getTime() + (cfg.validadeDias||30)*86400000).toISOString())}</div>
                  </div>
                  <button onClick={async () => {
                    const novaV = await customPrompt("Alterar Validade", "Digite a nova data de validade (AAAA-MM-DD):", "📅", (p.validade || new Date(new Date(p.data).getTime() + (cfg.validadeDias||30)*86400000).toISOString()).slice(0,10));
                    if(novaV && (await checkM(`Alterar validade de ${p.nome} (${cli?.nome||"?"}) para ${fD(novaV)}?`, {id: p.id, nova: novaV, antiga: p.validade}, "ALTERACAO_VALIDADE"))) {
                      setPr(pr.map(x => x.id === p.id ? {...x, validade: novaV + "T23:59:59Z"} : x));
                    }
                  }} style={{background:"none", border:`1px solid ${C.bd}`, borderRadius:8, padding:"4px 8px", fontSize:10, fontWeight:800, cursor:"pointer", color:C.az}}>✏️ Alterar</button>
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button onClick={()=>setVoucherVer(p)} style={{background:C.az,color:"#fff",border:"none",borderRadius:12,padding:"12px 14px",fontSize:13,fontWeight:800,cursor:"pointer",flex:1,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🎫 Ver Cupom</button>
                  <button onClick={async ()=>{
                    if(await checkM(`Dar baixa manual no prêmio ${p.nome} (${cli?.nome||"?"})?`, {id: p.id, acao: "baixa_manual_admin"}, "BAIXA_MANUAL_ADMIN")) {
                      setPr(pr.map(x=>x.id===p.id?{...x, status:"redeemed", dataRetirada:new Date().toISOString(), opNomeRetirada:"Administrador", opIdRetirada:"admin"}:x));
                      alert("✅ Baixa manual realizada e registrada no log.");
                    }
                  }} style={{background:C.vd,color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:11,fontWeight:800,cursor:"pointer",flex:1.2,fontFamily:"inherit"}}>✅ Dar Baixa Manual</button>
                </div>
              </>
            )}
            {isP && <div style={{fontSize:10,color:C.sb,fontStyle:"italic",textAlign:"center",width:"100%"}}>Aguardando aprovação no Dashboard</div>}
          </div>

        </div>);
      })}
    </div>
    <VerMais total={visPr.length} visiveis={vis} setVisiveis={setVis} />
    {voucherVer && <OpVoucherCard p={voucherVer} cli={cl.find(c=>c.id===voucherVer.clientId)} cfg={cfg} onClose={()=>setVoucherVer(null)} />}
  </div>);
}

function OpVoucherCard({p, cli, cfg, onClose}){
  const dVal = p.validade || new Date(new Date(p.data).getTime() + (cfg.validadeDias||30)*86400000).toISOString();
  const msg = `🎟️ *MEU CUPOM DIGITAL DE RETIRADA*\n\nPrêmio: *${p.nome} ${p.emoji||""}*\nCódigo: *${p.id.toUpperCase()}*\n⚠️ *Retire até: ${fD(dVal)}*\n\nLotérica Central — Cliente Premiado! 🏆`;
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function shareImg() {
    setGerando(true);
    try {
      const el = document.getElementById("cupom-capture-admin");
      if(!el) {
        console.error("Elemento cupom-capture-admin não encontrado.");
        setGerando(false);
        return;
      }
      await new Promise(r => setTimeout(r, 600)); // Espera um pouco mais para garantir render
      const canvas = await html2canvas(el, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff", 
        width: 600, 
        height: 600,
        logging: false
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setGerando(false);
          alert("Erro ao gerar arquivo de imagem.");
          return;
        }
        const file = new File([blob], "cupom.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: "Cupom Lotérica Central", text: msg }); }
          catch (e) { fallbackDownload(blob); }
        } else { fallbackDownload(blob); }
        setGerando(false);
      }, "image/png");
    } catch(e) { 
      console.error("Erro no html2canvas:", e); 
      setGerando(false); 
      alert("Erro ao gerar imagem do cupom."); 
    }
  }

  function fallbackDownload(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cupom.png"; a.click(); URL.revokeObjectURL(url);
    const tel = limpo(cli?.whats);
    const link = `https://wa.me/${tel.startsWith("55") ? tel : "55"+tel}?text=${encodeURIComponent(msg)}`;
    setTimeout(() => { window.open(link); }, 1000);
  }

  function copy() {
    navigator.clipboard.writeText(p.id.toUpperCase());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:10,backdropFilter:"blur(5px)"}} onClick={(e)=>{ if(e.target === e.currentTarget) onClose(); }}>
    {/* CAPTURA (ESCONDIDO) */}
    <div style={{position:"fixed", left: "-9999px", top: 0}}>
      <div id="cupom-capture-admin" style={{background:"#fff", width: "600px", height: "600px", fontFamily: "'Nunito', sans-serif", textAlign: "center", display: "block", overflow: "hidden"}}>
        <div style={{background:`linear-gradient(160deg,${C.az},${C.az2})`,padding:"35px 25px",position:"relative", display: "flex", alignItems:"center", gap:25, justifyContent:"center"}}>
          <div style={{background:"#fff",width:130,height:130,borderRadius:24,display:"flex",alignItems:"center",justifyContent:"center",padding:6,boxShadow:"0 12px 30px rgba(0,0,0,0.2)",flexShrink:0}}>
            <img src={logoLoterica} style={{width:"100%", height:"100%", objectFit:"contain"}} alt="Logo"/>
          </div>
          <div style={{textAlign:"left"}}>
            <div style={{color:C.ou,fontSize:14,fontWeight:800,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Certificado</div>
            <div style={{color:"#fff",fontSize:32,fontWeight:900,lineHeight:1.1,marginBottom:10}}>Cliente<br/>Premiado</div>
            <div style={{background:C.ou,color:C.az,display:"inline-block",padding:"6px 18px",borderRadius:20,fontSize:16,fontWeight:900,letterSpacing:1.5}}>VOUCHER: {p.id.toUpperCase()}</div>
          </div>
        </div>
        <div style={{padding:"40px 40px 10px",textAlign:"center", display: "block"}}>
          <div style={{fontSize:26,fontWeight:900,color:C.tx,marginBottom:30, display: "block"}}>{cli?.nome}</div>
          <div style={{background:C.bg,borderRadius:24,padding:25,marginBottom:30,border:`1px solid ${C.bd}`, display: "block"}}>
            <div style={{fontSize:14,fontWeight:800,color:C.sb,textTransform:"uppercase",marginBottom:8}}>Você ganhou</div>
            <div style={{fontSize:54,marginBottom:10, display: "block"}}>{p.emoji||cfg.premioMeta.emoji}</div>
            <div style={{fontSize:26,fontWeight:900,color:C.az, display: "block"}}>{p.nome}</div>
          </div>
          <div style={{display:"flex", gap:15, justifyContent:"center"}}>
             <div style={{background:C.ouC,borderRadius:16,padding:"15px 20px",border:`1px solid ${C.ou}33`, textAlign: "center", flex:1}}>
                <div style={{fontSize:11,fontWeight:800,color:C.ou2,textTransform:"uppercase", marginBottom: 4}}>Voucher</div>
                <div style={{fontSize:22,fontWeight:900,color:C.tx,fontFamily:"monospace"}}>{p.id.toUpperCase()}</div>
             </div>
             <div style={{background:C.rdC,borderRadius:16,padding:"15px 20px",border:`1px solid ${C.rd}33`, textAlign: "center", flex:1}}>
                <div style={{fontSize:11,fontWeight:800,color:C.rd,textTransform:"uppercase", marginBottom: 4}}>Validade</div>
                <div style={{fontSize:18,fontWeight:900,color:C.tx}}>{fD(dVal)}</div>
             </div>
          </div>
        </div>
      </div>
    </div>

    {/* PREVIEW */}
    <div style={{background:"#fff",width:"100%",maxWidth:380,borderRadius:24,overflow:"hidden",boxShadow:"0 30px 60px rgba(0,0,0,.5)",animation:"pop .4s ease"}} onClick={e=>e.stopPropagation()}>
      <div style={{background:`linear-gradient(160deg,${C.az},${C.az2})`,padding:"20px 15px",position:"relative", display: "flex", alignItems:"center", gap:15, justifyContent:"center"}}>
        <button onClick={onClose} style={{position:"absolute",top:10,right:10,background:"rgba(255,255,255,0.2)",border:"none",width:32,height:32,borderRadius:"50%",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>✕</button>
        <div style={{background:"#fff",width:80,height:80,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",padding:4,boxShadow:"0 8px 20px rgba(0,0,0,.2)",flexShrink:0}}>
          <img src={logoLoterica} style={{width:"100%", height:"100%", objectFit:"contain"}} alt="Logo"/>
        </div>
        <div style={{textAlign:"left"}}>
          <div style={{color:C.ou,fontSize:9,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>Certificado</div>
          <div style={{color:"#fff",fontSize:20,fontWeight:900,lineHeight:1.1,marginBottom:6}}>Cupom Digital</div>
          <div onClick={copy} style={{background:C.ou,color:C.az,display:"inline-block",padding:"5px 14px",borderRadius:20,fontSize:13,fontWeight:900,letterSpacing:1,boxShadow:"0 4px 10px rgba(0,0,0,0.2)",cursor:"pointer",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            VOUCHER: {p.id.toUpperCase()} {copiado ? "✅" : "📋"}
          </div>
        </div>
      </div>

      <div style={{padding:"22px 20px",textAlign:"center"}}>
        <div style={{fontSize:18,fontWeight:900,color:C.tx,marginBottom:15}}>{cli?.nome}</div>
        
        {p.status === "redeemed" && (
          <div style={{background:C.vdC, color:C.vd, padding:12, borderRadius:12, marginBottom:15, border:`1px solid ${C.vd}33`}}>
            <div style={{fontWeight:900, fontSize:11, textTransform:"uppercase"}}>✅ PRÊMIO JÁ RETIRADO</div>
          </div>
        )}

        <div style={{background:C.bg,borderRadius:18,padding:15,marginBottom:15,border:`1px solid ${C.bd}`}}>
          <div style={{fontSize:32,marginBottom:4}}>{p.emoji||cfg.premioMeta.emoji}</div>
          <div style={{fontSize:18,fontWeight:900,color:C.az}}>{p.nome}</div>
        </div>

        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <div onClick={copy} style={{flex:1,background:C.ouC,borderRadius:12,padding:8,border:`1px solid ${C.ou}33`,cursor:"pointer"}}>
            <div style={{fontSize:9,fontWeight:800,color:C.ou2,textTransform:"uppercase"}}>Código</div>
            <div style={{fontSize:16,fontWeight:900,color:C.tx,fontFamily:"monospace"}}>{p.id.toUpperCase()} {copiado&&"✅"}</div>
          </div>
          <div style={{flex:1,background:C.rdC,borderRadius:12,padding:8,border:`1px solid ${C.rd}33`}}>
            <div style={{fontSize:9,fontWeight:800,color:C.rd,textTransform:"uppercase"}}>Validade</div>
            <div style={{fontSize:14,fontWeight:900,color:C.tx}}>{fD(dVal)}</div>
          </div>
        </div>

        <button onClick={shareImg} disabled={gerando} style={{width:"100%",background:"#25D366",color:"#fff",borderRadius:14,padding:14,fontWeight:900,fontSize:15,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,justifyContent:"center",boxShadow:"0 8px 20px rgba(37,211,102,.3)"}}>
          {gerando ? <Sp label="Gerando Cupom..."/> : <><span style={{fontSize:20}}>📲</span> Compartilhar no WhatsApp</>}
        </button>
      </div>

      <div style={{background:C.bg,padding:16,textAlign:"center",borderTop:`1px solid ${C.bd}`}}>
        <button onClick={onClose} style={{background:"none",color:C.sb,border:"none",fontWeight:800,fontSize:15,cursor:"pointer",width:"100%",padding:8,fontFamily:"inherit"}}>Fechar Cupom</button>
      </div>
    </div>
  </div>);}

function ACfg({cfg,setCfg,ops,setOps,cl,pr,checkM,adminSel,setAdminSel,admins,setAdmins,adminLogs,logAdminAction,reverterAcao}){
  const[sub,setSub]=useState("meta");
  const isMaster = adminSel?.role === "master";
  let SUBS=[{id:"meta",l:"🎯 Meta"},{id:"rl",l:"⚡ Relâmpago"},{id:"form",l:"📝 Formulário"},{id:"reg",l:"📋 Regulamento"},{id:"not",l:"📰 Notícias"},{id:"sis",l:"🔧 Sistema"}];
  if(isMaster) {
    SUBS.push({id:"admins",l:"🛡️ Administrador"});
    SUBS.push({id:"audit",l:"🕵️ Auditoria"});
  }
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="⚙️" t="Configurações" s="Edite prêmios, formulário, notícias e sistema"/>
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <div style={{display:"flex",gap:4,background:"#fff",borderRadius:12,padding:4,border:`1px solid ${C.bd}`,flexWrap:"wrap"}}>
        {SUBS.filter(s=>!["admins","audit"].includes(s.id)).map(s=>(
          <button key={s.id} onClick={()=>setSub(s.id)} 
            style={{flex:1,minWidth:58,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:10,background:sub===s.id?C.az:"transparent",color:sub===s.id?"#fff":C.sb,transition:"all .2s"}}>
            {s.l}
          </button>
        ))}
      </div>
      {isMaster && (
        <div style={{display:"flex",gap:4,background:"#fff",borderRadius:12,padding:4,border:`1px solid ${C.bd}`}}>
          {SUBS.filter(s=>["admins","audit"].includes(s.id)).map(s=>(
            <button key={s.id} onClick={()=>setSub(s.id)} 
              style={{flex:1,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:10,background:sub===s.id?C.az:"transparent",color:sub===s.id?"#fff":C.sb,transition:"all .2s"}}>
              {s.l}
            </button>
          ))}
        </div>
      )}
    </div>
    {sub==="meta"&&<CfgMeta cfg={cfg} setCfg={setCfg} checkM={checkM}/>}
    {sub==="rl"  && <CfgRelampagos cfg={cfg} setCfg={setCfg} checkM={checkM}/>}
    {sub==="form"&&<CfgForm cfg={cfg} setCfg={setCfg} checkM={checkM}/>}
    {sub==="reg" &&<CfgReg  cfg={cfg} setCfg={setCfg} checkM={checkM}/>}
    {sub==="not" &&<CfgNoticias cfg={cfg} setCfg={setCfg} checkM={checkM}/>}
    {sub==="sis" &&<CfgSis  cfg={cfg} setCfg={setCfg} ops={ops} setOps={setOps} cl={cl} pr={pr} adminSel={adminSel} setAdminSel={setAdminSel} admins={admins} setAdmins={setAdmins} checkM={checkM}/>}
    {sub==="admins" && isMaster && <CfgAdmins admins={admins} setAdmins={setAdmins} adminSel={adminSel} />}
    {sub==="audit" && isMaster && <CfgAuditoria adminLogs={adminLogs} reverterAcao={reverterAcao} />}
  </div>);
}

function CfgAdmins({admins,setAdmins,adminSel}){
  const[nome,setNome]=useState("");const[role,setRole]=useState("gerencia");
  const[erro,setErro]=useState("");
  const salvar = () => {
    if(!nome.trim()){setErro("Nome obrigatório");return;}
    setAdmins([...(admins||[]),{id:uid(),nome:nome.trim(),senhaAcesso:"123456",role,senhaMestra:"",cadastro:new Date().toISOString()}]);
    setNome("");setErro("");setRole("gerencia");
    alert("Administrador criado! A senha de acesso padrão é 123456. No primeiro login, o sistema exigirá a configuração das senhas.");
  };
  const resetSenha = (a) => {
    if(!window.confirm(`Deseja resetar as senhas de ${a.nome}? \n\nA senha de acesso voltará a ser 123456 e ele terá que configurar novas senhas no próximo login.`)) return;
    const updated = admins.map(x => x.id === a.id ? { ...x, senhaAcesso: "123456", senhaMestra: "", primeiroAcesso: true } : x);
    setAdmins(updated);
    alert("✅ Senhas resetadas com sucesso!");
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:11,animation:"up .3s"}}>
    <div style={{background:"#fff",borderRadius:15,padding:14,border:`1px solid ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:14,marginBottom:11,color:C.az}}>➕ Novo Administrador</div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        <div><label style={LS}>Nome</label><input value={nome} onChange={e=>{setNome(e.target.value);setErro("");}} style={{width:"100%",marginTop:4,...IS}}/></div>
        <div><label style={LS}>Perfil</label><select value={role} onChange={e=>setRole(e.target.value)} style={{width:"100%",marginTop:4,...IS}}><option value="gerencia">Gerência</option><option value="master">Master</option></select></div>
        <div style={{fontSize:11,color:C.sb,background:C.bg,padding:10,borderRadius:8,lineHeight:1.4}}>⚠️ A senha padrão de acesso será <strong>123456</strong>. No primeiro login, o administrador será forçado a criar suas próprias senhas de acesso e de alteração e exclusão.</div>
        {erro&&<div style={{color:C.rd,fontSize:11,fontWeight:700}}>⚠️ {erro}</div>}
        <button onClick={salvar} style={{width:"100%",background:C.az,color:"#fff",border:"none",borderRadius:10,padding:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>Salvar Administrador</button>
      </div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {(admins||[]).map(a=><div key={a.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:34,height:34,borderRadius:"50%",background:C.azC,color:C.az,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,flexShrink:0}}>{a.nome[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:13,color:C.tx}}>{a.nome} {a.id===adminSel.id&&<span style={{color:C.vd,fontSize:10,fontWeight:800}}>(Você)</span>}</div>
          <div style={{fontSize:10,color:C.sb}}>{a.role==="master"?"Acesso Master":"Gerência"}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {a.id!==adminSel.id && (
            <button onClick={()=>resetSenha(a)} style={{background:C.bg,color:C.az,border:`1px solid ${C.bd}`,borderRadius:8,padding:"7px",fontSize:12,cursor:"pointer"}} title="Resetar Senhas">🔄</button>
          )}
          {a.id!==adminSel.id && (
            <button onClick={()=>remover(a.id)} style={{background:C.rdC,color:C.rd,border:"none",borderRadius:8,padding:"7px",fontSize:12,cursor:"pointer"}} title="Remover">🗑️</button>
          )}
        </div>
      </div>)}
    </div>
  </div>);
}

function CfgAuditoria({adminLogs, reverterAcao}){
  const [dI, setDI] = useState("");
  const [dF, setDF] = useState("");
  const [vis, setVis] = useState(15);

  const fLogs = (adminLogs||[]).filter(l => {
    if(!dI && !dF) return true;
    const d = new Date(l.data);
    const ini = dI ? new Date(dI+"T00:00:00") : new Date(0);
    const fim = dF ? new Date(dF+"T23:59:59") : new Date();
    return d >= ini && d <= fim;
  });

  const exportarPDF = () => {
    const el = document.getElementById("print-audit");
    if(!el) return;
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Auditoria do Sistema</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; }
        h1 { color: #003478; border-bottom: 2px solid #003478; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; color: #4b5563; font-weight: 800; }
        .rd { color: #dc2626; font-weight: 700; }
        .ip { font-family: monospace; background: #f3f4f6; padding: 2px 5px; border-radius: 4px; }
      </style></head><body>
        <h1>Relatório de Auditoria</h1>
        <p><strong>Período:</strong> ${dI ? dI.split("-").reverse().join("/") : "Início"} até ${dF ? dF.split("-").reverse().join("/") : "Hoje"}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        <table>
          <thead><tr><th>Data/Hora</th><th>Admin / Perfil</th><th>Ação</th><th>Detalhes</th><th>IP</th></tr></thead>
          <tbody>
            ${fLogs.map(l => `<tr>
              <td>${new Date(l.data).toLocaleString("pt-BR")}</td>
              <td>${l.adminNome} (${l.role})</td>
              <td class="${l.acao==='EXCLUSAO'?'rd':''}">${l.acao}</td>
              <td>${l.detalhes}</td>
              <td class="ip">${l.ip}</td>
            </tr>`).join("")}
          </tbody>
        </table>
        <script>window.print(); setTimeout(window.close, 500);</script>
      </body></html>
    `);
    w.document.close();
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:11,animation:"up .3s"}}>
    <div style={{background:C.azC,padding:14,borderRadius:12,border:`1px solid ${C.az}33`,fontSize:11,color:C.az,lineHeight:1.5}}>
      <strong>Auditoria do Sistema</strong><br/>Este log registra todas as exclusões ou ações críticas feitas pelos administradores, capturando data, hora e endereço de IP da máquina que realizou o comando.
    </div>

    <div style={{display:"flex",gap:10,background:"#fff",padding:14,borderRadius:12,border:`1px solid ${C.bd}`,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{display:"flex",flexDirection:"column",flex:1,minWidth:120}}>
        <label style={{fontSize:10,fontWeight:800,color:C.sb,marginBottom:4}}>Data Inicial</label>
        <input type="date" value={dI} onChange={e=>setDI(e.target.value)} style={{...IS,width:"100%"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",flex:1,minWidth:120}}>
        <label style={{fontSize:10,fontWeight:800,color:C.sb,marginBottom:4}}>Data Final</label>
        <input type="date" value={dF} onChange={e=>setDF(e.target.value)} style={{...IS,width:"100%"}}/>
      </div>
      <button onClick={exportarPDF} style={{padding:"10px 16px",marginTop:16,background:C.tx,color:"#fff",border:"none",borderRadius:9,fontWeight:800,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"inherit"}}>
        🖨️ Exportar PDF
      </button>
    </div>

    <div id="print-audit" style={{background:"#fff",borderRadius:14,border:`1px solid ${C.bd}`,overflow:"hidden"}}>
      {fLogs.length===0&&<div style={{padding:20,textAlign:"center",color:C.sb,fontSize:12}}>Nenhum registro encontrado neste período.</div>}
      {fLogs.slice(0,vis).map((l,i)=><div key={l.id} style={{padding:"12px 15px",borderBottom:i<fLogs.slice(0,vis).length-1?`1px solid ${C.bd}33`:"none",display:"flex",flexDirection:"column",gap:5}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:800,fontSize:12,color:C.tx}}>{l.adminNome} <span style={{color:C.sb,fontWeight:600}}>({l.role})</span></div>
          <div style={{fontSize:10,color:C.sb,fontFamily:"monospace"}}>{new Date(l.data).toLocaleString("pt-BR")}</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div style={{fontSize:11,color:C.tx,flex:1}}><span style={{fontWeight:800,color:l.acao==="EXCLUSAO"?C.rd:C.az}}>[{l.acao}]</span> {l.detalhes}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {l.acao === "EXCLUSAO" && l.payload && !l.reverted && (
              <button onClick={()=>reverterAcao(l.id)} style={{background:C.ouC,color:C.ou2,border:`1px solid ${C.ou}55`,padding:"4px 8px",borderRadius:6,fontSize:9,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>↩️ REVERTER</button>
            )}
            {l.reverted && <span style={{background:C.bg,color:C.sb,padding:"4px 8px",borderRadius:6,fontSize:9,fontWeight:800,border:`1px solid ${C.bd}`}}>REVERTIDO</span>}
            <div style={{fontSize:9,color:C.sb,fontFamily:"monospace",background:C.bg,padding:"2px 6px",borderRadius:4,border:`1px solid ${C.bd}`}}>IP: {l.ip}</div>
          </div>
        </div>
      </div>)}
    </div>
    <VerMais total={fLogs.length} visiveis={vis} setVisiveis={setVis} />
  </div>);
}

function CfgForm({cfg,setCfg,checkM}){
  const form0 = cfg.formulario || {cats:[],campos:[]};
  const[campos,setCampos]=useState(form0.campos.map(c=>({...c})));
  const[cats,  setCats]  =useState(form0.cats.map(c=>({...c})));
  const[editId,setEditId]=useState(null);
  const[novaC, setNovaC] =useState({nome:"",emoji:"📦",cat:"",comValor:true,triggerRelampago:false,obrigatorio:false});
  const[novaG, setNovaG] =useState({nome:"",cor:"#003478"});
  const[showNG,setShowNG]=useState(false);
  const[showNC,setShowNC]=useState(false);
  const[msg,   setMsg]   =useState("");
  const[aba,   setAba]   =useState("campos");

  const updCampo=(id,k,v)=>{setCampos(l=>l.map(c=>c.id===id?{...c,[k]:v}:c));}
  const removeCampo=(id)=>{if(!window.confirm("Remover este campo?"))return;setCampos(l=>l.filter(c=>c.id!==id));setEditId(null);}
  const moverCampo=(id,dir)=>{setCampos(l=>{const i=l.findIndex(c=>c.id===id);if(dir===-1&&i===0)return l;if(dir===1&&i===l.length-1)return l;const n=[...l];[n[i],n[i+dir]]=[n[i+dir],n[i]];return n;});}
  const addCampo=()=>{if(!novaC.nome.trim()){setMsg("❌ Informe o nome do campo.");return;}if(!novaC.cat){setMsg("❌ Selecione uma categoria.");return;}const c={...novaC,id:uid(),ativo:true};setCampos(l=>[...l,c]);setNovaC({nome:"",emoji:"📦",cat:cats[0]?.id||"",comValor:true,triggerRelampago:false,obrigatorio:false});setShowNC(false);setMsg("");}
  const addCat=()=>{if(!novaG.nome.trim()){setMsg("❌ Informe o nome da categoria.");return;}setCats(l=>[...l,{id:uid(),nome:novaG.nome.trim(),cor:novaG.cor}]);setNovaG({nome:"",cor:"#003478"});setShowNG(false);setMsg("");}
  const removeCat=(id)=>{if(!window.confirm("Remover categoria?"))return;setCats(l=>l.filter(c=>c.id!==id));}
  const salvar=async()=>{ if(!(await checkM("Digite sua Senha de Alteração e Exclusão para salvar o Formulário:", null, "ALTERACAO"))) return; setCfg({...cfg,formulario:{cats,campos}}); DB.save("lc-cfg",{...cfg,formulario:{cats,campos}}); setMsg("✅ Salvo!"); setTimeout(()=>setMsg(""),4000); }
  const abas=[{id:"campos",l:"📋 Campos"},{id:"cats",l:"🏷️ Categorias"},{id:"preview",l:"👁️ Preview"}];

  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <div style={{display:"flex",gap:5,background:"#fff",borderRadius:11,padding:4,border:`1px solid ${C.bd}`}}>
      {abas.map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11,background:aba===a.id?C.az:"transparent",color:aba===a.id?"#fff":C.sb,transition:"all .2s"}}>{a.l}</button>)}
    </div>
    {aba==="campos"&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {cats.map(cat=>{
        const cc=campos.filter(c=>c.cat===cat.id);
        if(cc.length===0)return null;
        return(<div key={cat.id}>
          <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:7}}>
            <div style={{width:3,height:15,borderRadius:4,background:cat.cor}}/>
            <div style={{fontWeight:800,fontSize:11,color:cat.cor,textTransform:"uppercase",letterSpacing:.5}}>{cat.nome}</div>
          </div>
          {cc.map((c)=>{
            return(<div key={c.id} style={{background:"#fff",borderRadius:12,border:`1px solid ${c.ativo?cat.cor+"33":C.bd}`,overflow:"hidden",marginBottom:6}}>
              <div style={{padding:"10px 12px",display:"flex",gap:9,alignItems:"center",cursor:"pointer",borderBottom:editId===c.id?`1px solid ${C.bd}`:"none"}} onClick={()=>setEditId(editId===c.id?null:c.id)}>
                <div style={{width:34,height:34,borderRadius:9,background:c.ativo?`${cat.cor}15`:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.emoji}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:c.ativo?C.tx:"#9ca3af",textDecoration:c.ativo?"none":"line-through"}}>{c.nome}</div></div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    <button onClick={e=>{e.stopPropagation();moverCampo(c.id,-1);}} style={{background:"none",border:`1px solid ${C.bd}`,borderRadius:4,width:20,height:16,cursor:"pointer",fontSize:8,color:C.sb}}>▲</button>
                    <button onClick={e=>{e.stopPropagation();moverCampo(c.id,1);}} style={{background:"none",border:`1px solid ${C.bd}`,borderRadius:4,width:20,height:16,cursor:"pointer",fontSize:8,color:C.sb}}>▼</button>
                  </div>
                  <div onClick={e=>{e.stopPropagation();updCampo(c.id,"ativo",!c.ativo);}} style={{width:36,height:20,borderRadius:10,cursor:"pointer",position:"relative",background:c.ativo?C.vd:"#d1d5db",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:2,left:c.ativo?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/></div>
                </div>
              </div>
              {editId===c.id&&<div style={{padding:"12px",display:"flex",flexDirection:"column",gap:9,background:"#fafcff"}}>
                <div style={{display:"flex",gap:7}}><div style={{flex:0}}><label style={LS}>Emoji</label><input value={c.emoji} onChange={e=>updCampo(c.id,"emoji",e.target.value)} style={{width:48,marginTop:4,...IS,fontSize:18,textAlign:"center"}}/></div><div style={{flex:1}}><label style={LS}>Nome do campo *</label><input value={c.nome} onChange={e=>updCampo(c.id,"nome",e.target.value)} style={{width:"100%",marginTop:4,...IS}}/></div></div>
                <div><label style={LS}>Categoria</label><select value={c.cat} onChange={e=>updCampo(c.id,"cat",e.target.value)} style={{width:"100%",marginTop:4,...IS}}>{cats.map(g=><option key={g.id} value={g.id}>{g.nome}</option>)}</select></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>{[["comValor","💰 R$"],["triggerRelampago","⚡ Relâmpago"],["obrigatorio","❗ Obrigatório"]].map(([k,l])=><div key={k} style={{background:c[k]?cat.cor+"10":C.bg,borderRadius:9,padding:"9px 8px",border:`1.5px solid ${c[k]?cat.cor:C.bd}`,cursor:"pointer",textAlign:"center"}} onClick={()=>updCampo(c.id,k,!c[k])}><div style={{fontSize:13,marginBottom:3}}>{l.slice(0,2)}</div><div style={{fontWeight:700,fontSize:9,color:c[k]?cat.cor:C.sb}}>{l.slice(2)}</div></div>)}</div>
                <button onClick={()=>removeCampo(c.id)} style={{background:C.rdC,color:C.rd,border:`1px solid ${C.rd}33`,borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑️ Remover</button>
              </div>}
            </div>);
          })}
        </div>);
      })}
      {!showNC&&<button onClick={()=>{setShowNC(true);setNovaC({nome:"",emoji:"📦",cat:cats[0]?.id||"",comValor:true,triggerRelampago:false,obrigatorio:false});}} style={{background:C.azC,color:C.az,border:`1.5px dashed ${C.az}55`,borderRadius:12,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>➕ Adicionar Novo Campo</button>}
      {showNC&&<div style={{background:"#fff",borderRadius:14,padding:"15px",border:`2px solid ${C.az}44`}}>
        <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>➕ Novo Campo</div>
        <div style={{display:"flex",gap:7,marginBottom:10}}><div style={{flex:0}}><label style={LS}>Emoji</label><input value={novaC.emoji} onChange={e=>setNovaC({...novaC,emoji:e.target.value})} style={{width:48,marginTop:4,...IS,fontSize:18,textAlign:"center"}}/></div><div style={{flex:1}}><label style={LS}>Nome *</label><input value={novaC.nome} onChange={e=>setNovaC({...novaC,nome:e.target.value})} style={{width:"100%",marginTop:4,...IS}}/></div></div>
        <div style={{marginBottom:10}}><label style={LS}>Categoria *</label><select value={novaC.cat} onChange={e=>setNovaC({...novaC,cat:e.target.value})} style={{width:"100%",marginTop:4,...IS}}><option value="">Selecione…</option>{cats.map(g=><option key={g.id} value={g.id}>{g.nome}</option>)}</select></div>
        <div style={{display:"flex",gap:8}}><button onClick={addCampo} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:C.az,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✅ Adicionar</button><button onClick={()=>setShowNC(false)} style={{flex:1,padding:"10px",borderRadius:10,background:"#fff",color:C.sb,border:`1px solid ${C.bd}`,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button></div>
      </div>}
    </div>)}
    {aba==="cats"&&(<div style={{display:"flex",flexDirection:"column",gap:9}}>
      {cats.map(g=><div key={g.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:`1px solid ${g.cor}44`,display:"flex",alignItems:"center",gap:11}}><div style={{width:22,height:22,borderRadius:"50%",background:g.cor}}/><div style={{flex:1}}><div style={{fontWeight:800,fontSize:13}}>{g.nome}</div></div><input type="color" value={g.cor} onChange={e=>setCats(l=>l.map(x=>x.id===g.id?{...x,cor:e.target.value}:x))} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.bd}`,cursor:"pointer"}}/><button onClick={()=>removeCat(g.id)} style={{background:C.rdC,color:C.rd,border:"none",borderRadius:8,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>🗑️</button></div>)}
      {!showNG&&<button onClick={()=>setShowNG(true)} style={{background:C.azC,color:C.az,border:`1.5px dashed ${C.az}55`,borderRadius:12,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>➕ Nova Categoria</button>}
      {showNG&&<div style={{background:"#fff",borderRadius:13,padding:"14px",border:`2px solid ${C.az}44`}}>
        <div style={{fontWeight:800,fontSize:13,marginBottom:11}}>➕ Nova Categoria</div>
        <div style={{display:"flex",gap:8,marginBottom:10}}><input value={novaG.nome} onChange={e=>setNovaG({...novaG,nome:e.target.value})} placeholder="Nome…" style={{flex:1,...IS}}/><input type="color" value={novaG.cor} onChange={e=>setNovaG({...novaG,cor:e.target.value})} style={{width:44,height:44,borderRadius:9,border:`1px solid ${C.bd}`,cursor:"pointer"}}/></div>
        <div style={{display:"flex",gap:8}}><button onClick={addCat} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:C.az,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✅ Adicionar</button><button onClick={()=>setShowNG(false)} style={{flex:1,padding:"10px",borderRadius:10,background:"#fff",color:C.sb,border:`1px solid ${C.bd}`,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button></div>
      </div>}
    </div>)}
    {aba==="preview"&&(<div style={{display:"flex",flexDirection:"column",gap:9}}>{cats.map(g=>{const cc=campos.filter(c=>c.cat===g.id&&c.ativo);if(cc.length===0)return null;return(<div key={g.id}><div style={{display:"flex",gap:7,alignItems:"center",marginBottom:7}}><div style={{width:3,height:15,borderRadius:4,background:g.cor}}/><div style={{fontWeight:800,fontSize:11,color:g.cor,textTransform:"uppercase"}}>{g.nome}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>{cc.map(c=><div key={c.id} style={{background:"#fff",borderRadius:11,border:`2px solid ${g.cor}22`,padding:"9px 10px",display:"flex",alignItems:"center",gap:7,opacity:.85}}><span style={{fontSize:16}}>{c.emoji}</span><span style={{fontSize:11,fontWeight:700,flex:1}}>{c.nome}</span></div>)}</div></div>);})}</div>)}
    {msg&&<div style={{padding:"10px 12px",borderRadius:10,fontSize:12,fontWeight:700,background:C.vdC,color:C.vd}}>{msg}</div>}
    <button onClick={salvar} style={{width:"100%",padding:14,borderRadius:13,border:"none",background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.az}44`}}>💾 Salvar Formulário</button>
  </div>);
}

function CfgMeta({cfg,setCfg,checkM}){
  const[meta,setMeta]=useState(String(cfg.meta));
  const[minV,setMinV]=useState(cfg.minVisita||300);
  const[valDias,setValDias]=useState(cfg.validadeDias||30);
  const[emoji,setEmoji]=useState(cfg.premioMeta.emoji);
  const[nome,setNome]=useState(cfg.premioMeta.nome);
  const[desc,setDesc]=useState(cfg.premioMeta.desc);
  const[msg,setMsg]=useState("");
  async function salvar(){if(!(await checkM("Digite sua Senha de Alteração e Exclusão para salvar a Meta:", null, "ALTERACAO"))) return; const m=parseInt(meta,10);if(!m||m<1||m>100){setMsg("❌ Meta deve ser entre 1 e 100.");return;}if(!nome.trim()){setMsg("❌ Informe o nome do prêmio.");return;}setCfg({...cfg,meta:m,minVisita:parseFloat(minV),validadeDias:parseInt(valDias)||30,premioMeta:{nome:nome.trim(),emoji,desc}});setMsg("✅ Meta salva!");setTimeout(()=>setMsg(""),3000);}
  return(<div style={{background:"#fff",borderRadius:16,padding:18,border:`1px solid ${C.bd}`}}>
    <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:14}}>🎯 Prêmio a cada N autenticações</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
      <div style={{flex:1}}>
        <label style={L}>📊 Meta Visitas</label>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:7}}>
          <input value={meta} onChange={e=>setMeta(e.target.value.replace(/\D/g,""))} style={{width:"100%",padding:"10px",border:`2px solid ${C.az}`,borderRadius:11,fontSize:18,fontWeight:900,textAlign:"center",fontFamily:"inherit",outline:"none",color:C.az}}/>
        </div>
      </div>
      <div style={{flex:1}}>
        <label style={L}>💰 Valor Mín (R$)</label>
        <div style={{marginTop:7}}>
          <input type="number" value={minV} onChange={e=>setMinV(e.target.value)} style={{width:"100%",padding:"10px",border:`2px solid ${C.ou}`,borderRadius:11,fontSize:18,fontWeight:900,textAlign:"center",fontFamily:"inherit",outline:"none",color:C.tx}}/>
        </div>
      </div>
      <div style={{flex:1}}>
        <label style={L}>📅 Validade de retirada do prêmio (Dias)</label>
        <div style={{marginTop:7}}>
          <input type="number" value={valDias} onChange={e=>setValDias(e.target.value)} style={{width:"100%",padding:"10px",border:`2px solid ${C.rd}`,borderRadius:11,fontSize:18,fontWeight:900,textAlign:"center",fontFamily:"inherit",outline:"none",color:C.tx}}/>
        </div>
      </div>
    </div>
    <div style={{marginBottom:14}}>
      <label style={L}>🎨 Emoji do prêmio</label>
      <div style={{display:"flex",gap:7,marginTop:6,flexWrap:"wrap"}}>
        {["🎟️","🏆","🎁","💰","⭐","🎰","🎊","🎈"].map(e=><button key={e} onClick={()=>setEmoji(e)} style={{width:38,height:38,borderRadius:10,border:`2px solid ${e===emoji?C.az:C.bd}`,background:e===emoji?C.azC:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>)}
        <input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{width:40,padding:"7px 4px",border:`1.5px solid ${C.bd}`,borderRadius:10,textAlign:"center",fontSize:18,fontFamily:"inherit",outline:"none"}} placeholder="?"/>
      </div>
    </div>
    <div style={{marginBottom:14}}><label style={L}>🏷️ Nome do prêmio *</label><input value={nome} onChange={e=>setNome(e.target.value)} style={{...I,marginTop:5,border:`2px solid ${nome?C.az:C.bd}`}} placeholder="Ex: Raspadinha CAIXA, Brinde…"/></div>
    <div style={{marginBottom:14}}>
      <label style={L}>💬 Mensagem para o cliente</label>
      <div style={{fontSize:10,color:C.sb,margin:"3px 0 5px"}}>Use <code style={{background:C.bg,padding:"1px 4px",borderRadius:4}}>{"{meta}"}</code> e <code style={{background:C.bg,padding:"1px 4px",borderRadius:4}}>{"{premioNome}"}</code></div>
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} style={{...I,resize:"vertical"}} placeholder="Você completou {meta} visitas e ganhou {premioNome}!"/>
    </div>
    <div style={{background:C.vdC,borderRadius:11,padding:"12px 13px",marginBottom:14,border:`1px solid ${C.vd}44`}}>
      <div style={{fontWeight:800,fontSize:11,color:C.vd,marginBottom:7}}>👀 Preview:</div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:44,height:44,borderRadius:12,background:C.vd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{emoji}</div><div><div style={{fontWeight:800,fontSize:14,color:C.tx}}>{nome||"Nome do prêmio"}</div><div style={{fontSize:11,color:C.sb,marginTop:3,lineHeight:1.6}}>{desc.replace("{meta}",meta).replace("{premioNome}",nome)||"Descrição…"}</div></div></div>
    </div>
    {msg&&<div style={{padding:"9px 12px",borderRadius:9,marginBottom:10,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd}}>{msg}</div>}
    <button onClick={salvar} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.vd},#059669)`,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.vd}44`}}>💾 Salvar Configuração de Meta</button>
  </div>);
}

function CfgRelampagos({cfg,setCfg,checkM}){
  const[lista,setLista]=useState(cfg.relampagos.map(r=>({...r})));
  const[minR,setMinR]=useState(cfg.minRelampago||60);
  const[editId,setEditId]=useState(null);
  const[msg,setMsg]=useState("");
  const totP=lista.filter(r=>r.ativo).reduce((s,r)=>s+(parseFloat(r.prob)||0),0);
  const upd=(id,k,v)=>setLista(l=>l.map(r=>r.id===id?{...r,[k]:v}:r));
  function addNovo(){setLista(l=>[...l,{id:uid(),ativo:true,emoji:"🎁",nome:"Novo Prêmio",prob:5,desc:"Você ganhou um prêmio surpresa! Retire no balcão."}]);}
  function remover(id){if(lista.length<=1){setMsg("❌ Mínimo 1 prêmio.");return;}setLista(l=>l.filter(r=>r.id!==id));}
  function salvar(){if(!checkM("Digite sua Senha de Alteração e Exclusão para salvar os Relâmpagos:", null, "ALTERACAO")) return; const inv=lista.filter(r=>!r.nome.trim()||!(parseFloat(r.prob)>0));if(inv.length){setMsg("❌ Todos precisam de nome e probabilidade > 0.");return;}setCfg({...cfg,minRelampago:parseFloat(minR),relampagos:lista.map(r=>({...r,prob:parseFloat(r.prob)||0}))});setMsg("✅ Prêmios relâmpago salvos!");setTimeout(()=>setMsg(""),3000);}
  return(<div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{background:"#fff",borderRadius:13,padding:"12px 14px",border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <label style={L}>Mínimo em Jogos (R$)</label>
      <input type="number" value={minR} onChange={e=>setMinR(e.target.value)} style={{width:100,...I,textAlign:"center"}}/>
    </div>
    <div style={{background:totP>50?C.rdC:C.azC,borderRadius:11,padding:"10px 13px",border:`1px solid ${totP>50?C.rd+"44":C.bd}`,fontSize:11,color:totP>50?C.rd:C.az,fontWeight:700}}>
      {totP>50?"⚠️":"📊"} Probabilidade total (ativos): <strong>{totP.toFixed(1)}%</strong>
      {totP<=50&&<span style={{fontWeight:400,color:C.sb}}> — chance a cada visita com Jogo.</span>}
    </div>
    {lista.map((r)=><div key={r.id} style={{background:"#fff",borderRadius:13,border:`1px solid ${r.ativo?C.rx+"44":C.bd}`,overflow:"hidden"}}>
      <div style={{padding:"11px 13px",display:"flex",gap:10,alignItems:"center",cursor:"pointer",borderBottom:editId===r.id?`1px solid ${C.bd}`:"none"}} onClick={()=>setEditId(editId===r.id?null:r.id)}>
        <div style={{width:38,height:38,borderRadius:10,background:r.ativo?C.rxC:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{r.emoji}</div>
        <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:r.ativo?C.tx:"#9ca3af",textDecoration:r.ativo?"none":"line-through"}}>{r.nome}</div><div style={{fontSize:10,color:C.sb}}>Probabilidade: <strong style={{color:r.ativo?C.rx:"#9ca3af"}}>{r.prob}%</strong></div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div onClick={e=>{e.stopPropagation();upd(r.id,"ativo",!r.ativo);}} style={{width:40,height:22,borderRadius:11,cursor:"pointer",position:"relative",background:r.ativo?C.vd:"#d1d5db",transition:"background .2s"}}><div style={{position:"absolute",top:3,left:r.ativo?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/></div>
          <span style={{fontSize:14,color:C.sb}}>{editId===r.id?"▲":"▼"}</span>
        </div>
      </div>
      {editId===r.id&&<div style={{padding:"13px 13px",display:"flex",flexDirection:"column",gap:9}}>
        <div style={{display:"flex",gap:8}}><div style={{flex:1}}><label style={L}>Emoji</label><input value={r.emoji} onChange={e=>upd(r.id,"emoji",e.target.value)} style={{width:"100%",marginTop:4,padding:"8px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:18,textAlign:"center",fontFamily:"inherit",outline:"none"}}/></div><div style={{flex:1}}><label style={L}>Prob. (%)</label><input value={r.prob} onChange={e=>upd(r.id,"prob",e.target.value)} type="number" min="0.1" max="100" step="0.1" style={{width:"100%",marginTop:4,...I}}/></div></div>
        <div><label style={L}>Nome *</label><input value={r.nome} onChange={e=>upd(r.id,"nome",e.target.value)} style={{width:"100%",marginTop:4,...I}} placeholder="Ex: Raspadinha Bônus"/></div>
        <div><label style={L}>Descrição</label><textarea value={r.desc} onChange={e=>upd(r.id,"desc",e.target.value)} rows={2} style={{width:"100%",marginTop:4,...I,resize:"vertical"}} placeholder="Mensagem para o cliente…"/></div>
        <button onClick={async ()=>{if(await checkM("Remover este prêmio relâmpago? Digite sua Senha de Alteração e Exclusão:", {tipo: 'relampago', dado: r})) remover(r.id);}} style={{background:C.rdC,color:C.rd,border:`1px solid ${C.rd}33`,borderRadius:9,padding:"8px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑️ Remover este prêmio</button>
      </div>}
    </div>)}
    <button onClick={addNovo} style={{background:C.rxC,color:C.rx,border:`1.5px dashed ${C.rx}55`,borderRadius:12,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>➕ Adicionar Novo Prêmio Relâmpago</button>
    {msg&&<div style={{padding:"9px 12px",borderRadius:9,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd}}>{msg}</div>}
    <button onClick={salvar} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.rx},#5b21b6)`,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.rx}44`}}>💾 Salvar Prêmios Relâmpago</button>
  </div>);
}

function CfgReg({cfg,setCfg,checkM}){
  const[txt,setTxt]=useState(cfg.regulamento);
  const[ini,setIni]=useState(cfg.dataInicio||"2026-04-01");
  const[fim,setFim]=useState(cfg.dataFim||"2026-12-31");
  const[msg,setMsg]=useState("");
  async function salvar(){
    if(!(await checkM("Digite sua Senha de Alteração e Exclusão para salvar o Regulamento:", null, "ALTERACAO"))) return;
    if(!txt.trim()){setMsg("❌ Regulamento não pode estar vazio.");return;}
    setCfg({...cfg,regulamento:txt,dataInicio:ini,dataFim:fim});
    setMsg("✅ Regulamento e Vigência atualizados!");
    setTimeout(()=>setMsg(""),3000);
  }
  function restaurar(){if(window.confirm("Restaurar regulamento padrão?"))setTxt(DCFG.regulamento);}
  return(<div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{background:"#fff",borderRadius:16,padding:18,border:`1px solid ${C.bd}`,display:"flex",gap:12,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:140}}><label style={LS}>📅 Início da Campanha</label><input type="date" value={ini} onChange={e=>setIni(e.target.value)} style={{...I,marginTop:5}}/></div>
      <div style={{flex:1,minWidth:140}}><label style={LS}>📅 Fim da Campanha</label><input type="date" value={fim} onChange={e=>setFim(e.target.value)} style={{...I,marginTop:5}}/></div>
    </div>
    <div style={{background:C.azC,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.bd}`,fontSize:11,color:C.az,lineHeight:1.7}}>
      💡 Use <code style={{background:"rgba(0,52,120,.1)",padding:"1px 5px",borderRadius:4}}>{"{meta}"}</code>, <code style={{background:"rgba(0,52,120,.1)",padding:"1px 5px",borderRadius:4}}>{"{premioNome}"}</code>, <code style={{background:"rgba(0,52,120,.1)",padding:"1px 5px",borderRadius:4}}>{"{dataInicio}"}</code> e <code style={{background:"rgba(0,52,120,.1)",padding:"1px 5px",borderRadius:4}}>{"{dataFim}"}</code>.
    </div>
    <textarea value={txt} onChange={e=>setTxt(e.target.value)} rows={20} style={{...I,resize:"vertical",lineHeight:1.8,fontSize:11}}/>
    {msg&&<div style={{padding:"9px 12px",borderRadius:9,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd}}>{msg}</div>}
    <div style={{display:"flex",gap:8}}>
      <button onClick={salvar} style={{flex:2,padding:13,borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.az}44`}}>💾 Salvar Regulamento</button>
      <button onClick={restaurar} style={{flex:1,padding:13,borderRadius:12,background:"#fff",color:C.sb,border:`1px solid ${C.bd}`,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔄 Padrão</button>
    </div>
  </div>);
}

function CfgSis({cfg,setCfg,ops,setOps,cl,pr,adminSel,setAdminSel,admins,setAdmins,checkM}){
  const[url,setUrl]=useState(cfg.appUrl||"");const[wts,setWts]=useState(cfg.wts||"");const[msg,setMsg]=useState("");
  const[novaAcesso,setNovaAcesso]=useState("");const[novaMestra,setNovaMestra]=useState("");
  const[showM,setShowM]=useState(false);const[showA,setShowA]=useState(false);const[visM,setVisM]=useState(false);

  const isMaster = adminSel?.role === "master";

  async function salvar(){
    setMsg("⏳ Gravando...");
    try {
      if((novaAcesso.trim() && novaAcesso.trim().length < 4) || (novaMestra.trim() && novaMestra.trim().length < 4)){
        setMsg("❌ Erro: Mínimo 4 caracteres.");
        alert("❌ A senha deve ter no mínimo 4 caracteres (números ou letras).");
        return;
      }
      
      await setCfg({...cfg,appUrl:url.trim(),wts:wts.trim()});
      let s = "✅ Configurações salvas!";
      
      if(novaAcesso.trim() || novaMestra.trim()){
        const adminAtualizado = {...adminSel};
        if(novaAcesso.trim()) adminAtualizado.senhaAcesso = novaAcesso.trim();
        if(novaMestra.trim()) adminAtualizado.senhaMestra = novaMestra.trim();
        if(typeof setAdmins === "function") {
          await setAdmins((admins||[]).map(a => a.id === adminSel.id ? adminAtualizado : a));
        }
        setAdminSel(adminAtualizado);
        s = "✅ Senhas alteradas com sucesso!";
      }
      
      setMsg(s);
      setNovaAcesso(""); setNovaMestra("");
      setTimeout(()=>setMsg(""),10000);
      alert(s);
    } catch(e) {
      setMsg("❌ Erro ao salvar");
      alert("Erro ao salvar: " + e.message);
    }
  }
  function csv(rows,name){const d=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(d);a.download=name;a.click();}
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <div style={{background:"#fff",borderRadius:14,padding:"15px",border:`1px solid ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:10}}>🌐 URL do Aplicativo Cliente</div>
      <div style={{fontSize:11,color:C.sb,marginBottom:8,lineHeight:1.7}}>URL pública do portal do cliente (ex: <code>https://meuapp.vercel.app</code>). Necessária para os QR Codes funcionarem no celular. {!isMaster && "(Apenas Master pode alterar)"}</div>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://meuapp.vercel.app" style={{...I,marginBottom:12,background:!isMaster?"#f3f4f6":"#fff",color:!isMaster?C.sb:C.tx}} readOnly={!isMaster}/>
      <input value={wts} onChange={e=>setWts(e.target.value)} placeholder="5575999990000" style={{...I,marginBottom:12,background:!isMaster?"#f3f4f6":"#fff",color:!isMaster?C.sb:C.tx}} readOnly={!isMaster}/>
      
      <div style={{fontWeight:800,fontSize:13,color:C.tx,marginTop:10,marginBottom:8}}>🔒 Meu Perfil: Segurança</div>
      <div style={{fontSize:11,color:C.sb,marginBottom:12}}>Gerencie suas senhas de acesso e de operações críticas.</div>
      
      <button onClick={()=>setShowM(true)} style={{...BV,background:C.ou,color:C.az,width:"100%",padding:12,borderRadius:10,fontWeight:900,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:15}}>
        🔒 Alterar Minhas Senhas
      </button>

      {showM && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#fff",borderRadius:22,padding:22,width:"100%",maxWidth:400,animation:"up .3s",boxShadow:"0 10px 40px rgba(0,0,0,.3)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div style={{fontWeight:900,fontSize:17,color:C.tx}}>🔒 Alterar Minhas Senhas</div>
            <button onClick={()=>{setShowM(false);setNovaAcesso("");setNovaMestra("");}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.sb}}>✕</button>
          </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{position:"relative"}}>
              <label style={L}>Nova Senha de Acesso</label>
              <input value={novaAcesso} onChange={e=>setNovaAcesso(e.target.value)} type={showA?"text":"password"} placeholder="Mínimo 4 caracteres" style={{...I,marginTop:5,paddingRight:42}}/>
              <button onClick={()=>setShowA(!showA)} style={{position:"absolute",right:10,top:32,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{showA?"Ocultar":"Ver"}</button>
            </div>

            <div style={{position:"relative"}}>
              <label style={L}>Nova Senha de Alteração/Exclusão</label>
              <input value={novaMestra} onChange={e=>setNovaMestra(e.target.value)} type={visM?"text":"password"} placeholder="Mínimo 4 caracteres" style={{...I,marginTop:5,paddingRight:42}}/>
              <button onClick={()=>setVisM(!visM)} style={{position:"absolute",right:10,top:32,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{visM?"Ocultar":"Ver"}</button>
            </div>

            {msg && <div style={{padding:"10px",borderRadius:10,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd,textAlign:"center"}}>{msg}</div>}
            
            <button onClick={salvar} style={{marginTop:10,padding:15,borderRadius:13,border:"none",background:C.az,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.az}44`}}>
              Confirmar Alteração de Senhas
            </button>
          </div>
        </div>
      </div>}

      {msg && <div style={{padding:"10px",borderRadius:10,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd,textAlign:"center",marginBottom:10}}>{msg}</div>}
      
      {isMaster && <button onClick={salvar} style={{width:"100%",padding:13,borderRadius:11,border:"none",background:`linear-gradient(135deg,${C.vd},#059669)`,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✅ Salvar Configurações Globais</button>}
    </div>
  </div>);
}

/* ═══════ CONFIG NOTÍCIAS ═══════ */
function CfgNoticias({cfg,setCfg,checkM}){
  const nots0 = cfg.noticias||DCFG.noticias;
  const[lista,  setLista]  = useState(nots0.map(n=>({...n})));
  const[editId, setEditId] = useState(null);
  const[nova,   setNova]   = useState({tipo:"geral",emoji:"📢",titulo:"",corpo:"",data:""});
  const[showNew,setShowNew]= useState(false);
  const[msg,    setMsg]    = useState("");
  const[filtro, setFiltro] = useState("todos"); // todos | geral | vip

  const uid2=()=>Math.random().toString(36).slice(2,9);

  function upd(id,k,v){ setLista(l=>l.map(n=>n.id===id?{...n,[k]:v}:n)); }
  async function remover(id){
    const n = lista.find(x=>x.id===id);
    if(!(await checkM("Remover esta notícia?", {tipo: 'noticia', dado: n}))) return; 
    setLista(l=>l.filter(x=>x.id!==id)); setEditId(null); 
  }
  function addNova(){
    if(!nova.titulo.trim()){setMsg("❌ Informe o título da notícia.");return;}
    if(!nova.corpo.trim()) {setMsg("❌ Informe o conteúdo da notícia.");return;}
    setLista(l=>[...l,{...nova,id:uid2(),ativo:true}]);
    setNova({tipo:"geral",emoji:"📢",titulo:"",corpo:"",data:""});
    setShowNew(false);setMsg("");
  }
  async function salvar(){
    if(!(await checkM("Digite sua Senha de Alteração e Exclusão para salvar Notícias:", null, "ALTERACAO"))) return;
    const invalidas=lista.filter(n=>!n.titulo.trim()||!n.corpo.trim());
    if(invalidas.length){setMsg("❌ Todas as notícias precisam de título e conteúdo.");return;}
    setCfg({...cfg,noticias:lista});
    DB.save("lc-cfg",{...cfg,noticias:lista});
    setMsg("✅ Notícias salvas! O app do cliente já reflete as mudanças.");
    setTimeout(()=>setMsg(""),4000);
  }

  const visiveis=filtro==="todos"?lista:lista.filter(n=>n.tipo===filtro);

  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>

    {/* Info */}
    <div style={{background:C.azC,borderRadius:12,padding:"11px 13px",border:`1px solid ${C.bd}`,fontSize:11,color:C.az,lineHeight:1.8}}>
      📰 <strong>Notícias Gerais</strong> — visíveis para todos os clientes.<br/>
      🌟 <strong>Notícias VIP</strong> — visíveis apenas para clientes que já ganharam algum prêmio.<br/>
      Alterações publicadas imediatamente no app do cliente ao salvar.
    </div>

    {/* Filtro */}
    <div style={{display:"flex",gap:6}}>
      {[["todos","Todas",lista.length],["geral","Gerais",lista.filter(n=>n.tipo==="geral").length],["vip","VIP 🌟",lista.filter(n=>n.tipo==="vip").length]].map(([v,l,n])=>(
        <button key={v} onClick={()=>setFiltro(v)}
          style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${filtro===v?C.az:C.bd}`,background:filtro===v?C.az:"#fff",color:filtro===v?"#fff":C.sb,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
          {l} ({n})
        </button>
      ))}
    </div>

    {/* Lista de notícias */}
    {visiveis.length===0&&<V em="📰" msg="Nenhuma notícia nesta categoria."/>}
    {visiveis.map(n=>(
      <div key={n.id} style={{background:"#fff",borderRadius:14,border:`1px solid ${n.ativo?(n.tipo==="vip"?C.rx+"44":C.az+"33"):C.bd}`,overflow:"hidden"}}>
        {/* Header da notícia */}
        <div style={{padding:"12px 13px",display:"flex",gap:10,alignItems:"center",cursor:"pointer",borderBottom:editId===n.id?`1px solid ${C.bd}`:"none"}}
          onClick={()=>setEditId(editId===n.id?null:n.id)}>
          <div style={{width:38,height:38,borderRadius:11,background:n.tipo==="vip"?C.rxC:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
            {n.emoji}
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
              <div style={{fontWeight:800,fontSize:12,color:n.ativo?C.tx:"#9ca3af",textDecoration:n.ativo?"none":"line-through"}}>{n.titulo}</div>
              <span style={{background:n.tipo==="vip"?C.rxC:C.azC,color:n.tipo==="vip"?C.rx:C.az,fontSize:9,fontWeight:800,padding:"1px 7px",borderRadius:20}}>
                {n.tipo==="vip"?"🌟 VIP":"📰 Geral"}
              </span>
            </div>
            <div style={{fontSize:10,color:C.sb,lineHeight:1.4}}>{n.corpo.slice(0,60)}{n.corpo.length>60?"…":""}</div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
            {/* Toggle ativo */}
            <div onClick={e=>{e.stopPropagation();upd(n.id,"ativo",!n.ativo);}}
              style={{width:40,height:22,borderRadius:11,cursor:"pointer",position:"relative",background:n.ativo?C.vd:"#d1d5db",transition:"background .2s"}}>
              <div style={{position:"absolute",top:3,left:n.ativo?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
            </div>
            <span style={{fontSize:13,color:C.sb}}>{editId===n.id?"▲":"▼"}</span>
          </div>
        </div>

        {/* Formulário de edição */}
        {editId===n.id&&(
          <div style={{padding:"14px 13px",display:"flex",flexDirection:"column",gap:10,background:"#fafcff"}}>
            {/* Tipo + Emoji */}
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:0}}>
                <label style={LS}>Emoji</label>
                <input value={n.emoji} onChange={e=>upd(n.id,"emoji",e.target.value)}
                  style={{width:50,marginTop:4,padding:"8px 4px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:18,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
              </div>
              <div style={{flex:1}}>
                <label style={LS}>Tipo</label>
                <select value={n.tipo} onChange={e=>upd(n.id,"tipo",e.target.value)}
                  style={{width:"100%",marginTop:4,...IS}}>
                  <option value="geral">📰 Geral — todos os clientes</option>
                  <option value="vip">🌟 VIP — apenas clientes premiados</option>
                </select>
              </div>
            </div>
            {/* Título */}
            <div>
              <label style={LS}>Título *</label>
              <input value={n.titulo} onChange={e=>upd(n.id,"titulo",e.target.value)}
                style={{width:"100%",marginTop:4,...IS}} placeholder="Ex: Mega-Sena Acumulada!"/>
            </div>
            {/* Conteúdo */}
            <div>
              <label style={LS}>Conteúdo *</label>
              <textarea value={n.corpo} onChange={e=>upd(n.id,"corpo",e.target.value)}
                rows={4} style={{width:"100%",marginTop:4,...IS,resize:"vertical",lineHeight:1.7}}
                placeholder="Texto da notícia para o cliente…"/>
            </div>
            {/* Data */}
            <div>
              <label style={LS}>Data (opcional)</label>
              <input value={n.data||""} onChange={e=>upd(n.id,"data",e.target.value)}
                type="date" style={{width:"100%",marginTop:4,...IS}}/>
            </div>
            {/* Preview */}
            <div style={{background:n.tipo==="vip"?C.rxC:C.azC,borderRadius:11,padding:"11px 13px",
              border:`1px solid ${n.tipo==="vip"?C.rx+"33":C.bd}`}}>
              <div style={{fontWeight:800,fontSize:10,color:n.tipo==="vip"?C.rx:C.az,marginBottom:8}}>👁️ Preview no App:</div>
              <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                <div style={{width:34,height:34,borderRadius:10,background:n.tipo==="vip"?C.rxC:C.azC,
                  border:`1px solid ${n.tipo==="vip"?C.rx+"33":C.bd}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{n.emoji}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:12,color:C.tx}}>{n.titulo||"(sem título)"}</div>
                  {n.data&&<div style={{fontSize:10,color:C.sb,marginTop:1}}>{new Date(n.data+"T12:00:00").toLocaleDateString("pt-BR")}</div>}
                  <div style={{fontSize:11,color:C.sb,marginTop:5,lineHeight:1.7,whiteSpace:"pre-line"}}>{n.corpo||"(sem conteúdo)"}</div>
                </div>
              </div>
            </div>
            {/* Botão remover */}
            <button onClick={()=>remover(n.id)}
              style={{background:C.rdC,color:C.rd,border:`1px solid ${C.rd}33`,borderRadius:9,padding:"8px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
              🗑️ Remover esta notícia
            </button>
          </div>
        )}
      </div>
    ))}

    {/* Nova notícia */}
    {!showNew&&(
      <button onClick={()=>setShowNew(true)}
        style={{background:"#f0f4ff",color:C.az,border:`1.5px dashed ${C.az}55`,borderRadius:13,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
        ➕ Adicionar Nova Notícia
      </button>
    )}
    {showNew&&(
      <div style={{background:"#fff",borderRadius:14,padding:"15px 13px",border:`2px solid ${C.az}44`,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:4}}>➕ Nova Notícia</div>
        {/* Tipo + Emoji */}
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:0}}>
            <label style={LS}>Emoji</label>
            <input value={nova.emoji} onChange={e=>setNova({...nova,emoji:e.target.value})}
              style={{width:50,marginTop:4,padding:"8px 4px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:18,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <label style={LS}>Tipo *</label>
            <select value={nova.tipo} onChange={e=>setNova({...nova,tipo:e.target.value})}
              style={{width:"100%",marginTop:4,...IS}}>
              <option value="geral">📰 Geral — todos os clientes</option>
              <option value="vip">🌟 VIP — apenas clientes premiados</option>
            </select>
          </div>
        </div>
        <div>
          <label style={LS}>Título *</label>
          <input value={nova.titulo} onChange={e=>setNova({...nova,titulo:e.target.value})}
            style={{width:"100%",marginTop:4,...IS}} placeholder="Ex: Promoção Especial de Maio!"/>
        </div>
        <div>
          <label style={LS}>Conteúdo *</label>
          <textarea value={nova.corpo} onChange={e=>setNova({...nova,corpo:e.target.value})}
            rows={3} style={{width:"100%",marginTop:4,...IS,resize:"vertical",lineHeight:1.7}}
            placeholder="Texto da notícia…"/>
        </div>
        <div>
          <label style={LS}>Data (opcional)</label>
          <input value={nova.data} onChange={e=>setNova({...nova,data:e.target.value})}
            type="date" style={{width:"100%",marginTop:4,...IS}}/>
        </div>
        {msg&&msg.startsWith("❌")&&<div style={{padding:"9px 12px",borderRadius:9,fontSize:12,fontWeight:700,background:C.rdC,color:C.rd}}>{msg}</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={addNova}
            style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:C.az,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✅ Adicionar</button>
          <button onClick={()=>{setShowNew(false);setMsg("");}}
            style={{flex:1,padding:"10px",borderRadius:10,background:"#fff",color:C.sb,border:`1px solid ${C.bd}`,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
        </div>
      </div>
    )}

    {msg&&<div style={{padding:"10px 12px",borderRadius:10,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd}}>{msg}</div>}

    <button onClick={salvar}
      style={{width:"100%",padding:14,borderRadius:13,border:"none",background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.az}44`}}>
      💾 Salvar e Publicar Notícias
    </button>
  </div>);
}

/* ═══════ MICRO-COMPONENTES ═══════ */
function T({em,t,s}){return(<div style={{marginBottom:4}}><div style={{fontWeight:900,fontSize:19,color:C.tx}}>{em} {t}</div>{s&&<div style={{fontSize:11,color:C.sb,marginTop:2}}>{s}</div>}</div>);}
function V({em,msg}){return(<div style={{padding:"26px 20px",textAlign:"center",color:C.sb}}><div style={{fontSize:40,marginBottom:8,opacity:.4}}>{em}</div><div style={{fontSize:12,lineHeight:1.7}}>{msg}</div></div>);}
function Pts(){return(<div style={{display:"flex",gap:8,justifyContent:"center",marginTop:6}}>{[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:C.ou,animation:`dt 1.1s ${i*.22}s infinite`}}/>)}</div>);}
function Nav({abas,aba,setAba,cor}){return(<nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"#fff",borderTop:`1px solid ${C.bd}`,display:"flex",boxShadow:"0 -4px 20px rgba(0,0,0,.08)",zIndex:1000}}>
  {abas.map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{flex:1,padding:"10px 2px 12px",border:"none",cursor:"pointer",fontFamily:"inherit",background:aba===a.id?"#f0f4fb":"#fff",borderTop:`3px solid ${aba===a.id?cor:"transparent"}`,transition:"all .2s",position:"relative"}}>
    {a.badge>0 && <div style={{position:"absolute",top:3,right:"15%",background:C.rd,color:"#fff",fontSize:9,fontWeight:900,padding:"1px 4px",borderRadius:10}}>{a.badge}</div>}
    <div style={{fontSize:18,marginBottom:3}}>{a.emoji}</div><div style={{fontSize:10,fontWeight:aba===a.id?900:700,color:aba===a.id?cor:C.sb,lineHeight:1}}>{a.label}</div>
  </button>)}
</nav>);}
function Sp({label}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><div style={{width:16,height:16,border:"2px solid rgba(0,0,0,.1)",borderTopColor:C.az,borderRadius:"50%",animation:"up .8s linear infinite"}}/><span>{label}</span></div>);}
