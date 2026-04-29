import React, { useState, useEffect, useMemo, useRef } from "react";
import Tesseract from "tesseract.js";
import { DB } from "./firebase.js";
import logoLoterica from "./logo_loterica.png";
import html2canvas from "html2canvas";

/* ══════════════════════════════════════════
   CONFIG PADRÃO — sincroniza com lc-cfg
══════════════════════════════════════════ */
const CFG0 = {
  meta: 15,
  minVisita: 300,
  minRelampago: 60,
  premioMeta: { nome:"Raspadinha CAIXA", emoji:"🎟️", desc:"Você completou {meta} visitas e ganhou {premioNome}! Retire no balcão." },
  relampagos: [
    {id:"r1",ativo:true, emoji:"🎟️",nome:"Raspadinha Bônus", prob:8,  desc:"Raspadinha extra! Retire no balcão hoje."},
    {id:"r2",ativo:true, emoji:"🏷️",nome:"Cupom de Desconto",prob:15, desc:"10% de desconto na próxima Raspadinha. Válido 7 dias!"},
    {id:"r3",ativo:true, emoji:"🎁",nome:"Brinde Surpresa",  prob:10, desc:"Um brinde especial esperando por você no balcão!"},
    {id:"r4",ativo:true, emoji:"⚡",nome:"Dobro de Pontos",  prob:12, desc:"Esta visita vale 2 autenticações!"},
    {id:"r5",ativo:false,emoji:"🌟",nome:"Sorteio do Mês",   prob:5,  desc:"Você entrou no Sorteio do Mês! Resultado dia 01."},
  ],
  regulamento:`REGULAMENTO — CLIENTE FIDELIZADO PREMIADO
Lotérica Central · CNPJ 20.845.956/0001-00 · Alagoinhas-BA

1. PARTICIPAÇÃO
Clientes atendidos na lotérica que realizem cadastro pelo App Fidelidade e validem suas visitas com o código dinâmico do operador de caixa.

2. COMO PARTICIPAR
• Escaneie o QR Code da Promoção (painel da lotérica).
• Leia o regulamento e faça seu cadastro.
• A cada atendimento, peça ao operador o código dinâmico do caixa.
• Informe o código do operador para registrar sua visita.

3. PRÊMIO PRINCIPAL
• A cada {meta} visitas autenticadas: 1 {premioNome}.
• Retirada na lotérica em até 30 dias após notificação via WhatsApp.

4. PRÊMIO RELÂMPAGO
• Ao incluir Jogos na visita, o cliente concorre a prêmios surpresa automáticos.

5. PRÊMIO OPERADORAS
• Todo dia 05: as 2 operadoras com mais autenticações no mês ganham prêmio especial.

6. LGPD — Dados usados exclusivamente neste programa.
7. VIGÊNCIA — Campanha válida de **{dataInicio}** a **{dataFim}**. Visitas fora deste prazo ou registradas após 7 dias não serão validadas.`,
  dataInicio: "2026-04-01",
  dataFim: "2026-12-31",
  wts:"5575999990000",
  formulario:{
    cats:[
      {id:"bc",nome:"Bancário",cor:"#003478"},
      {id:"jg",nome:"Jogos",   cor:"#7c3aed"},
    ],
    campos:[
      {id:"boleto",   nome:"Boleto",    emoji:"📄",cat:"bc",comValor:true, triggerRelampago:false,ativo:true,obrigatorio:false},
      {id:"deposito", nome:"Depósito",  emoji:"💰",cat:"bc",comValor:true, triggerRelampago:false,ativo:true,obrigatorio:false},
      {id:"saque",    nome:"Saque",     emoji:"💵",cat:"bc",comValor:true, triggerRelampago:false,ativo:true,obrigatorio:false},
      {id:"pix",      nome:"PIX",       emoji:"📲",cat:"bc",comValor:true, triggerRelampago:false,ativo:true,obrigatorio:false},
      {id:"lotofacil",nome:"Lotofácil", emoji:"🍀",cat:"jg",comValor:true, triggerRelampago:true, ativo:true,obrigatorio:false},
      {id:"megasena", nome:"Mega-Sena", emoji:"🎰",cat:"jg",comValor:true, triggerRelampago:true, ativo:true,obrigatorio:false},
      {id:"quina",    nome:"Quina",     emoji:"🎲",cat:"jg",comValor:true, triggerRelampago:true, ativo:true,obrigatorio:false},
      {id:"bolao",    nome:"Bolão",     emoji:"🎯",cat:"jg",comValor:true, triggerRelampago:true, ativo:true,obrigatorio:false},
      {id:"out_jg",   nome:"Outros Jogos",emoji:"🎮",cat:"jg",comValor:false,triggerRelampago:true,ativo:true,obrigatorio:false},
    ],
  },
};

const NOME = "Lotérica Central";
const C={az:"#003478",az2:"#004fa8",azC:"#e8f0fb",ou:"#f5a800",ou2:"#d97706",ouC:"#fff8e6",vd:"#00a651",vdC:"#e6f9ef",rx:"#7c3aed",rxC:"#f3eeff",rd:"#e5001e",rdC:"#fff0f0",bg:"#f0f4fb",bd:"#dde6f5",tx:"#0d2137",sb:"#5a7a96"};

const uid  = ()=>Math.random().toString(36).slice(2,9);
const now  = ()=>new Date().toISOString();
const fD   = d=>new Date(d + (d?.includes("T") ? "" : "T12:00:00")).toLocaleDateString("pt-BR");
const fDT  = d=>new Date(d).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const brl  = v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtW = v=>{if(!v)return"";const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;};
const fmtDN = v=>{if(!v)return"";const d=v.replace(/\D/g,"").slice(0,8);if(d.length<=2)return d;if(d.length<=4)return`${d.slice(0,2)}/${d.slice(2)}`;return`${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;};
const limpo = v=>v?v.replace(/\D/g,""):"";
const hoje  = ()=>new Date().toISOString().slice(0,10);

/* DB importado via firebase.js */

function sortear(selecionados,cfg){
  const campos=cfg.formulario?.campos||[];
  if(!selecionados.some(id=>campos.find(c=>c.id===id)?.triggerRelampago))return null;
  const ativos=(cfg.relampagos||[]).filter(r=>r.ativo&&r.prob>0);
  if(!ativos.length)return null;
  let acum=0;const roll=Math.random();
  for(const p of ativos){acum+=p.prob/100;if(roll<acum)return p;}
  return null;
}

const N_GERAL=[
  {id:"ng1",emoji:"🎰",titulo:"Mega-Sena Acumulada!",corpo:"Prêmio estimado em R$ 120 milhões! Aposte agora.",data:"2026-04-15"},
  {id:"ng2",emoji:"🕐",titulo:"Horário de Funcionamento",corpo:"Seg–Sex: 09h às 17h\nSábado: 09h às 13h\nDomingo: Fechado",data:"2026-04-01"},
];
const N_VIP=[
  {id:"nv1",emoji:"🌟",titulo:"Sorteio VIP — Exclusivo Premiados",corpo:"Você foi selecionado para o Sorteio VIP de Maio! Prêmio: R$ 500 em Raspadinhas. Resultado dia 31/05."},
  {id:"nv2",emoji:"🎁",titulo:"Bônus para clientes premiados",corpo:"Mencione que é premiado na próxima visita e ganhe desconto em Bolões. Válido até 30/04."},
];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{background:#f0f4fb;font-family:'Nunito',sans-serif;}
@keyframes up  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop {from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes dt  {0%,100%{opacity:.25;transform:scale(.65)}50%{opacity:1;transform:scale(1.2)}}
@keyframes sp  {to{transform:rotate(360deg)}}
@keyframes glw {0%,100%{box-shadow:0 0 8px rgba(245,168,0,.4)}50%{box-shadow:0 0 24px rgba(245,168,0,.8)}}
@keyframes priz{0%{transform:scale(0)rotate(-12deg);opacity:0}75%{transform:scale(1.08)rotate(2deg)}100%{transform:scale(1)rotate(0);opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
`;

const I={padding:"13px 15px",fontSize:15,fontWeight:600,fontFamily:"inherit",border:`2px solid ${C.bd}`,borderRadius:13,outline:"none",color:C.tx,background:"#fff",transition:"all .2s",width:"100%"};
const LS={fontSize:11,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:4};
const BV={background:"rgba(255,255,255,.18)",color:"#fff",border:"none",borderRadius:9,padding:"5px 13px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"};

/* ══════════════════════ APP ROOT ══════════════════════ */
export default function App(){
  const[tela,   setTela]   = useState("splash");
  const[cli,    setCli_]   = useState(null);
  const[clients,setCl_]    = useState([]);
  const[premios,setPr_]    = useState([]);
  const[ops,    setOps_]   = useState([]);
  const[cfg,    setCfg_]   = useState(CFG0);
  const[opQR,   setOpQR]   = useState(null);
  const[relamp, setRelamp] = useState(null);
  const setCl = d=>{setCl_(d); return DB.save("lc-cl",d);};
  const setPr = d=>{setPr_(d); return DB.save("lc-pr",d);};
  const cliAtual = cli?(clients.find(c=>c.id===cli.id)||cli):null;

  useEffect(()=>{(async()=>{
    try{
      const[cl,pr,op,cf]=await Promise.all([DB.load("lc-cl"),DB.load("lc-pr"),DB.load("lc-ops"),DB.load("lc-cfg")]);
      if(Array.isArray(cl))setCl_(cl);
      if(Array.isArray(pr))setPr_(pr);
      if(Array.isArray(op))setOps_(op);
      if(cf)setCfg_({...CFG0,...cf,
        relampagos:cf.relampagos||CFG0.relampagos,
        premioMeta:cf.premioMeta||CFG0.premioMeta,
        noticias:cf.noticias||CFG0.noticias,
        formulario:{cats:cf.formulario?.cats||CFG0.formulario.cats,campos:cf.formulario?.campos||CFG0.formulario.campos},
      });
    }catch(_){}

    DB.listen?.("lc-ops", val => { if(Array.isArray(val)) setOps_(val); });
    DB.listen?.("lc-cl", val => { if(Array.isArray(val)) setCl_(val); });
    DB.listen?.("lc-pr", val => { if(Array.isArray(val)) setPr_(val); });

    // Detectar ?op= (QR do operador) ou ?promo (QR da promoção)
    try{
      const params=new URLSearchParams(window.location.search);
      const opId=params.get("op") || params.get("tk");
      const promo=params.get("promo");
      if(opId){
        setOpQR({id:opId.toUpperCase()});
      }
      if(promo==="1"||promo==="true"){
        setTela("regulamento");return;
      }
    }catch(_){}
    setTimeout(()=>setTela("boas_vindas"),1500);
  })();},[]);

  const ctx={tela,setTela,cliente:cliAtual,setCli:setCli_,clients,setCl,premios,setPr,ops,cfg,opQR,setOpQR,relamp,setRelamp};

  return(<><style>{CSS}</style>
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",maxWidth:480,margin:"0 auto",fontSize:13,color:C.tx,position:"relative"}}>
      {tela==="splash"      && <Splash/>}
      {tela==="boas_vindas" && <BoasVindas {...ctx}/>}
      {tela==="regulamento" && <Regulamento {...ctx}/>}
      {tela==="cadastro"    && <Cadastro {...ctx}/>}
      {tela==="login"       && <Login {...ctx}/>}
      {tela==="painel"      && <Painel {...ctx}/>}
      {relamp && <PremioOvl relamp={relamp} setRelamp={setRelamp} cli={cliAtual} wts={cfg.wts||CFG0.wts}/>}
    </div>
  </>);
}

/* ══════════════════════ SPLASH ══════════════════════ */
function Splash(){return(
  <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},${C.az2})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:C.ou,opacity:.07}}/>
    <div style={{textAlign:"center",animation:"pop .5s ease",zIndex:1}}>
      <div style={{background:"#fff", width:190, height:190, borderRadius:40, margin:"0 auto 20px", display:"flex", alignItems:"center", justifySelf:"center", padding:8, boxShadow:`0 12px 30px rgba(0,0,0,.2)`, animation:"pop .6s"}}>
        <img src={logoLoterica} style={{width:"100%", height:"100%", objectFit:"contain"}} alt="Logo"/>
      </div>
      <div style={{fontWeight:700,fontSize:11,color:C.ou,marginTop:6,letterSpacing:3,textTransform:"uppercase"}}>Cliente Fidelizado Premiado</div>
      <div style={{display:"flex",gap:9,justifyContent:"center",marginTop:28}}>
        {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:C.ou,animation:`dt 1.1s ${i*.22}s infinite`}}/>)}
      </div>
    </div>
  </div>
);}

/* ══════════════════════ BOAS-VINDAS ══════════════════════ */
function BoasVindas({setTela,clients,setCli,cfg,ops,setOpQR}){
  // Verificar se ?op= presente → ir para login direto
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const opId=params.get("op");
    if(opId){
      (async()=>{
        const opsArr=await DB.load("lc-ops");
        const found=Array.isArray(opsArr)?opsArr.find(o=>o.id===opId):null;
        setOpQR({id:opId,nome:found?.nome||"Operador"});
        setTela("login");
      })();
    }
  },[]);

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},${C.az2})`,display:"flex",flexDirection:"column"}}>
      {/* Hero */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:C.ou,opacity:.08}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:180,height:180,borderRadius:"50%",background:C.ou,opacity:.05}}/>
        <div style={{background:"#fff", width:190, height:190, borderRadius:40, margin:"0 auto 20px", display:"flex", alignItems:"center", justifySelf:"center", padding:8, boxShadow:`0 12px 30px rgba(0,0,0,.2)`, animation:"pop .6s"}}>
          <img src={logoLoterica} style={{width:"100%", height:"100%", objectFit:"contain"}} alt="Logo"/>
        </div>
        <div style={{fontWeight:700,fontSize:12,color:C.ou,letterSpacing:3,textTransform:"uppercase",marginBottom:22}}>Cliente Fidelizado Premiado</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,.8)",lineHeight:1.8,maxWidth:340,marginBottom:32}}>
          Acumule visitas, ganhe <strong style={{color:C.ou}}>Super Prêmio</strong> e concorra a <strong style={{color:C.ou}}>Prêmios Relâmpago</strong> toda vez que visitar a nossa Lotérica!
        </div>
        {/* chips */}
        <div style={{display:"flex",gap:9,flexWrap:"wrap",justifyContent:"center",marginBottom:36}}>
          {[["🎟️",`Prêmio a cada ${cfg.meta} visitas`],["⚡","Prêmios Relâmpago"],["📱","App 100% digital"]].map(([em,t])=>(
            <div key={t} style={{background:"rgba(255,255,255,.12)",borderRadius:24,padding:"6px 14px",fontSize:11,fontWeight:700,color:"#fff",display:"flex",gap:6,alignItems:"center",border:"1px solid rgba(255,255,255,.18)"}}>
              <span>{em}</span><span style={{color:"rgba(255,255,255,.85)"}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Botões */}
      <div style={{background:"#fff",borderRadius:"28px 28px 0 0",padding:"28px 22px 40px"}}>
        <button onClick={()=>setTela("regulamento")}
          style={{width:"100%",padding:16,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:17,cursor:"pointer",background:`linear-gradient(135deg,${C.ou},${C.ou2})`,color:C.az,boxShadow:`0 4px 20px ${C.ou}55`,marginBottom:12}}>
          📋 Ler Regulamento e Cadastrar
        </button>
        <button onClick={()=>setTela("login")}
          style={{width:"100%",padding:14,borderRadius:14,border:`1.5px solid ${C.bd}`,fontFamily:"inherit",fontWeight:800,fontSize:15,cursor:"pointer",background:"#fff",color:C.az}}>
          Já tenho cadastro — Entrar →
        </button>
        <div style={{textAlign:"center",marginTop:18,fontSize:11,color:C.sb,lineHeight:1.7}}>
          Ao continuar você aceita os termos da promoção.<br/>Dados protegidos pela LGPD.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════ REGULAMENTO ══════════════════════ */
function Regulamento({setTela,cfg}){
  const [lido,setLido]=useState(false);
  const txt=(cfg.regulamento||CFG0.regulamento)
    .replace(/{meta}/g,cfg.meta)
    .replace(/{premioNome}/g,cfg.premioMeta.nome)
    .replace(/{minVisita}/g,cfg.minVisita||300)
    .replace(/{minRelampago}/g,cfg.minRelampago||60)
    .replace(/{dataInicio}/g,fD(cfg.dataInicio))
    .replace(/{dataFim}/g,fD(cfg.dataFim));

  function onScroll(e){
    const el=e.target;
    if(el.scrollTop+el.clientHeight>=el.scrollHeight-20) setLido(true);
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,padding:"22px 20px 24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:150,height:150,borderRadius:"50%",background:C.ou,opacity:.08}}/>
        <button onClick={()=>setTela("boas_vindas")} style={BV}>← Voltar</button>
        <div style={{marginTop:12,fontWeight:900,fontSize:20,color:"#fff"}}>📋 Regulamento</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:3}}>Leia até o final para continuar</div>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",padding:"14px 16px 0"}}>
        <div style={{background:"#fff",borderRadius:15,padding:12,border:`1px solid ${C.bd}`,display:"flex",gap:8,marginBottom:12}}>
          <div style={{flex:1,background:C.bg,borderRadius:10,padding:8,textAlign:"center"}}><div style={{fontSize:8,color:C.sb,textTransform:"uppercase",fontWeight:800}}>Início</div><div style={{fontWeight:900,fontSize:13,color:C.az}}>{fD(cfg.dataInicio)}</div></div>
          <div style={{flex:1,background:C.bg,borderRadius:10,padding:8,textAlign:"center"}}><div style={{fontSize:8,color:C.sb,textTransform:"uppercase",fontWeight:800}}>Término</div><div style={{fontWeight:900,fontSize:13,color:C.rd}}>{fD(cfg.dataFim)}</div></div>
        </div>
        <div onScroll={onScroll}
          style={{flex:1,overflowY:"auto",background:"#fff",borderRadius:16,padding:"18px 16px",border:`1px solid ${C.bd}`,maxHeight:"calc(100vh - 240px)"}}>
          <pre style={{fontSize:12,color:C.tx,lineHeight:2,whiteSpace:"pre-wrap",fontFamily:"'Nunito',sans-serif"}}>{txt}</pre>
          {/* Marca de fim */}
          <div style={{marginTop:20,textAlign:"center",padding:"12px",background:C.vdC,borderRadius:12,border:`1px solid ${C.vd}44`,fontSize:11,color:C.vd,fontWeight:700}}>
            ✅ Você chegou ao final do regulamento!
          </div>
        </div>
        {!lido&&(
          <div style={{background:C.azC,borderRadius:10,padding:"9px 14px",margin:"10px 0",fontSize:11,color:C.az,fontWeight:700,textAlign:"center",border:`1px solid ${C.bd}`}}>
            👆 Role até o final para aceitar e continuar
          </div>
        )}
        <button onClick={()=>setTela("cadastro")} disabled={!lido}
          style={{width:"100%",margin:"10px 0 24px",padding:15,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:16,cursor:lido?"pointer":"not-allowed",background:lido?`linear-gradient(135deg,${C.vd},#059669)`:"#d1d5db",color:lido?"#fff":"#9ca3af",boxShadow:lido?`0 4px 16px ${C.vd}44`:"none",transition:"all .3s"}}>
          {lido?"✅ Aceito — Fazer meu Cadastro":"Leia o regulamento para continuar"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════ CADASTRO ══════════════════════ */
function Cadastro({setCli,clients,setCl,setTela,cfg}){
  const[nome, setNome] =useState("");
  const[wts,  setWts]  =useState(()=>localStorage.getItem("lc_wts")||"");
  const[email,setEmail]=useState(()=>localStorage.getItem("lc_email")||"");
  const[nasc, setNasc] =useState(()=>localStorage.getItem("lc_nasc")||"");
  const[err,  setErr]  =useState("");
  const num=limpo(wts);
  const dataN=limpo(nasc);

  function cad(){
    if(!nome.trim()){setErr("Informe seu nome completo.");return;}
    if(num.length<10){setErr("Informe um WhatsApp válido com DDD.");return;}
    if(dataN.length<8){setErr("Informe sua data de nascimento completa.");return;}
    if(clients.find(c=>c.whats===num)){setErr("Este WhatsApp já está cadastrado. Use a opção de login.");return;}
    const c={id:uid(),nome:nome.trim(),whats:num,nasc:dataN,email:email.trim().toLowerCase(),cadastro:now(),auths:[]};
    localStorage.setItem("lc_wts", num);
    localStorage.setItem("lc_nasc", dataN);
    if(email) localStorage.setItem("lc_email", email.trim().toLowerCase());
    setCl([...clients,c]);setCli(c);setTela("painel");
  }

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},#5b21b6)`}}>
      <div style={{padding:"22px 20px 14px"}}>
        <button onClick={()=>setTela("regulamento")} style={BV}>← Voltar</button>
        <div style={{marginTop:13,fontWeight:900,fontSize:23,color:"#fff"}}>Cadastro 🎉</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:4}}>Rápido — nome, WhatsApp e nascimento.</div>
      </div>
      <div style={{background:"#fff",borderRadius:"26px 26px 0 0",minHeight:"calc(100vh - 120px)",padding:"26px 22px 40px",animation:"up .35s"}}>
        {/* Progresso */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:24,padding:"12px 14px",background:C.azC,borderRadius:13,border:`1px solid ${C.bd}`}}>
          {[["✅","Regulamento lido"],["📝","Cadastro"],["📱","Pronto!"]].map(([em,l],i)=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5,flex:1}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:i===0?C.vd:i===1?C.az:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:i<2?"#fff":C.sb,flexShrink:0}}>{i<2?em:i+1}</div>
              <div style={{fontSize:9,color:i<2?C.tx:C.sb,fontWeight:i<2?800:600,lineHeight:1.2}}>{l}</div>
              {i<2&&<div style={{width:12,height:2,background:C.bd,borderRadius:2,flexShrink:0}}/>}
            </div>
          ))}
        </div>

        <Cp label="👤 Nome Completo *" value={nome} onChange={v=>{setNome(v);setErr("");}} placeholder="Como quer ser chamado(a)?" ativo={!!nome} autoComplete="name"/>
        
        <div style={{display:"flex",gap:10,marginTop:12}}>
          <div style={{flex:1}}>
            <label style={LS}>📅 Nascimento *</label>
            <input value={nasc} onChange={e=>{setNasc(fmtDN(e.target.value));setErr("");}} placeholder="DD/MM/AAAA" type="tel"
              style={{...I, border:`2px solid ${dataN.length===8?C.az:C.bd}`, background:dataN.length===8?C.azC:"#fff", fontSize:14}} autoComplete="bday"/>
          </div>
          <div style={{flex:1.4}}>
            <label style={LS}>📱 WhatsApp *</label>
            <input value={wts} onChange={e=>{setWts(fmtW(e.target.value));setErr("");}} placeholder="(00) 00000-0000" type="tel" autoComplete="tel"
              style={{...I, border:`2px solid ${num.length>=10?C.az:C.bd}`, background:num.length>=10?C.azC:"#fff", fontSize:14}}/>
          </div>
        </div>

        <div style={{marginTop:14}}>
          <Cp label="📧 E-mail (opcional)" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" sub="Para receber notificações exclusivas" autoComplete="email"/>
        </div>
        {err&&<Alerta msg={err}/>}

        <button onClick={cad}
          style={{width:"100%",marginTop:8,padding:16,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:17,cursor:"pointer",background:`linear-gradient(135deg,${C.ou},${C.ou2})`,color:C.az,boxShadow:`0 4px 20px ${C.ou}55`}}>
          Criar minha conta e participar 🏆
        </button>
        <div style={{textAlign:"center",marginTop:14}}>
          <button onClick={()=>setTela("login")} style={{background:"none",border:"none",fontSize:12,color:C.sb,cursor:"pointer",fontFamily:"inherit"}}>
            Já tenho cadastro — Entrar →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════ LOGIN ══════════════════════ */
function Login({setCli,clients,setTela,opQR}){
  const[wts, setWts] =useState(()=>localStorage.getItem("lc_wts")||"");
  const[nasc, setNasc] =useState(()=>localStorage.getItem("lc_nasc")||"");
  const[err, setErr] =useState("");
  const[load,setLoad]=useState(false);
  const num=limpo(wts);
  const dataN=limpo(nasc);

  function entrar(){
    if(num.length<10){setErr("Informe um WhatsApp válido com DDD.");return;}
    if(dataN.length<8){setErr("Informe sua data de nascimento.");return;}
    setLoad(true);
    setTimeout(()=>{
      const f=clients.find(c=>c.whats===num && limpo(c.nasc||"")===dataN);
      setLoad(false);
      if(f){
        localStorage.setItem("lc_wts", num);
        localStorage.setItem("lc_nasc", dataN);
        setCli(f); setTela("painel");
      }
      else {
        // Verificar se o whats existe mas a data tá errada ou se nada existe
        const whatsOk = clients.find(c=>c.whats===num);
        if(whatsOk) setErr("Data de nascimento incorreta para este número.");
        else setErr("Cadastro não encontrado. Verifique os dados ou cadastre-se.");
      }
    },700);
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      <div style={{background:`linear-gradient(150deg,${C.az},${C.az2})`,borderRadius:"0 0 34px 34px",padding:"48px 22px 44px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:190,height:190,borderRadius:"50%",background:C.ou,opacity:.08}}/>
        <div style={{fontSize:52,animation:"pop .5s",marginBottom:10}}>🏆</div>
        <div style={{fontWeight:900,fontSize:22,color:"#fff"}}>{NOME}</div>
        <div style={{fontWeight:700,fontSize:10,color:C.ou,marginTop:5,letterSpacing:3,textTransform:"uppercase"}}>Área do Cliente</div>
        {opQR&&<div style={{marginTop:13,background:"rgba(0,166,81,.22)",borderRadius:12,padding:"10px 14px",border:"1px solid rgba(0,166,81,.45)"}}><div style={{fontWeight:800,fontSize:12,color:"#fff"}}>✅ QR do Operador detectado!</div><div style={{fontSize:11,color:"rgba(255,255,255,.8)",marginTop:2}}>Operador: <strong>{opQR.nome}</strong> — faça login para registrar.</div></div>}
      </div>
      <div style={{flex:1,padding:"26px 20px"}}>
        <div style={{background:"#fff",borderRadius:22,padding:24,boxShadow:"0 8px 36px rgba(0,52,120,.1)",animation:"up .4s"}}>
          <div style={{fontWeight:900,fontSize:20,color:C.tx,marginBottom:5}}>Bem-vindo(a) de volta! 👋</div>
          <div style={{fontSize:13,color:C.sb,marginBottom:22,lineHeight:1.6}}>Informe seu <strong>WhatsApp</strong> e <strong>nascimento</strong> para entrar.</div>
          
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={LS}>📱 WhatsApp (DDD)</label>
              <input value={wts} onChange={e=>{setWts(fmtW(e.target.value));setErr("");}} placeholder="(00) 00000-0000" type="tel" autoFocus autoComplete="username"
                onKeyDown={e=>e.key==="Enter"&&entrar()}
                style={{width:"100%",marginTop:5,padding:"14px 16px",fontSize:17,fontWeight:700,fontFamily:"inherit",border:`2px solid ${num.length>=10?C.az:C.bd}`,borderRadius:14,outline:"none",color:C.tx,background:num.length>=10?C.azC:"#fff",transition:"all .2s"}}/>
            </div>
            <div>
              <label style={LS}>📅 Data de Nascimento</label>
              <input value={nasc} onChange={e=>{setNasc(fmtDN(e.target.value));setErr("");}} placeholder="DD/MM/AAAA" type="tel" autoComplete="current-password"
                onKeyDown={e=>e.key==="Enter"&&entrar()}
                style={{width:"100%",marginTop:5,padding:"14px 16px",fontSize:17,fontWeight:700,fontFamily:"inherit",border:`2px solid ${dataN.length===8?C.az:C.bd}`,borderRadius:14,outline:"none",color:C.tx,background:dataN.length===8?C.azC:"#fff",transition:"all .2s"}}/>
            </div>
          </div>
          {err&&<Alerta msg={err}/>}
          <button onClick={entrar} disabled={load}
            style={{width:"100%",marginTop:16,padding:15,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:16,cursor:load?"not-allowed":"pointer",background:load?"#e2e8f0":`linear-gradient(135deg,${C.az},${C.az2})`,color:load?"#9ca3af":"#fff",boxShadow:load?"none":`0 5px 18px ${C.az}44`,transition:"all .3s"}}>
            {load?<Sp label="Verificando…"/>:(opQR?"Entrar e Registrar →":"Entrar →")}
          </button>
          <button onClick={()=>setTela("regulamento")}
            style={{width:"100%",marginTop:12,padding:13,borderRadius:12,background:"#fff",color:C.az,border:`1.5px solid ${C.az}33`,fontFamily:"inherit",fontWeight:800,fontSize:14,cursor:"pointer"}}>
            Não tenho cadastro — Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════ PAINEL ══════════════════════ */
function Painel({cliente,clients,setCl,premios,setPr,ops,cfg,opQR,setOpQR,setRelamp,setCli,setTela}){
  const[aba,setAba]=useState(()=>opQR?"reg":"ini");
  useEffect(()=>{if(opQR)setAba("reg");},[opQR]);

  const ABAS=[{id:"ini",l:"Início",em:"🏠"},{id:"reg",l:"Registrar",em:"📱"},{id:"pr",l:"Prêmios",em:"🎁"},{id:"not",l:"Notícias",em:"📰"},{id:"ct",l:"Conta",em:"👤"}];
  const c=cliente;if(!c)return null;
  const dIni = cfg.dataInicio || "2000-01-01";
  const dFim = cfg.dataFim || "2100-01-01";
  const dFimDate = new Date(dFim + "T23:59:59");
  const agora = new Date();
  const encerrada = agora > dFimDate;
  const diasFaltam = Math.ceil((dFimDate - agora) / (1000 * 60 * 60 * 24));

  const authsValidas = (c.auths||[]).filter(a=>a.valida!==false && a.status !== "rejected" && a.status !== "not_counted" && a.data >= dIni);
  const tot=c.auths?.length||0;const totV=authsValidas.length;
  const meta = cfg.meta || 15;
  const unredeemedMeta = (premios||[]).filter(p=>p.clientId===c.id && p.tipo==="raspadinha" && p.status!=="redeemed");
  const isLocked = unredeemedMeta.length > 0;
  const isPend = isLocked && unredeemedMeta.some(p=>p.status==="pending");
  const prog=isLocked ? meta : (totV%meta);const raspa=Math.floor(totV/meta);const falt=meta-prog;const pct=Math.round((prog/meta)*100);
  const meusPr=(premios||[]).filter(p=>p.clientId===c.id && p.status !== "rejected");const temPr=meusPr.length>0;
  const notsAll  = cfg.noticias||CFG0.noticias||[];
  const notsGeral= notsAll.filter(n=>n.tipo==="geral"&&n.ativo!==false);
  const notsVip  = notsAll.filter(n=>n.tipo==="vip"&&n.ativo!==false);
  const noticias=[...(temPr?notsVip:[]),...notsGeral];const nBadge=temPr?notsVip.length:0;
  const [voucherVer, setVoucherVer] = useState(null);

  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
    {/* HEADER */}
    <div style={{background:`linear-gradient(150deg,${C.az},${C.az2})`,padding:"22px 20px 26px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:C.ou,opacity:.07}}/>
      <div style={{zIndex:1,position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{width:80, height:24, background:"#fff", borderRadius:6, padding:"2px 6px", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <img src={logoLoterica} style={{width:"100%", height:"100%", objectFit:"contain"}} alt="Logo"/>
          </div>
          {diasFaltam >= 0 && diasFaltam <= 2 && !encerrada && (
            <div style={{background:C.ou,color:C.az,fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:20,animation:"dt 1s infinite"}}>
              ⚠️ CAMPANHA ENCERRA {diasFaltam===0?"HOJE":`EM ${diasFaltam} DIA${diasFaltam>1?"S":""}`}!
            </div>
          )}
          {encerrada && (
            <div style={{background:C.rd,color:"#fff",fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:20}}>
              🚫 CAMPANHA ENCERRADA
            </div>
          )}
        </div>
        <div style={{fontWeight:800,fontSize:14,color:"rgba(255,255,255,.6)"}}>Olá, <span style={{color:"#fff",fontWeight:900,fontSize:22}}>{c.nome?.split(" ")[0]}!</span> 👋 <span style={{fontSize:9,opacity:.5}}>v1.3</span></div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:2}}>Membro desde {fD(c.cadastro)}{temPr&&<span style={{marginLeft:8,background:C.ou,color:C.az,fontWeight:800,fontSize:9,padding:"1px 7px",borderRadius:20}}>🏆 PREMIADO</span>}</div>
        <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginTop:5,display:"flex",alignItems:"center",gap:5}}>
          <span style={{opacity:.8}}>📅 Período da Campanha:</span>
          <span style={{color:"#fff",fontWeight:800}}>{fD(dIni)} — {fD(dFim)}</span>
        </div>
      </div>
      {/* GLOBAL REJECTION ALERT */}
      {c.auths?.some(a=>(a.status==="rejected" || (premios||[]).some(p=>p.authId===a.id && p.status==="rejected")) && !a.modificado) && aba !== "ct" && (
        <div onClick={()=>setAba("ct")} style={{marginTop:16, background:C.rdC, border:`2px solid ${C.rd}`, borderRadius:16, padding:"12px 14px", display:"flex", gap:10, alignItems:"center", animation:"pop .4s", cursor:"pointer"}}>
          <div style={{fontSize:24}}>⚠️</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:13,color:C.rd}}>Registros Recusados</div>
            <div style={{fontSize:10,color:C.rd,opacity:.8,fontWeight:700}}>Toque aqui para corrigir pendências.</div>
          </div>
          <span style={{fontSize:18,color:C.rd}}>→</span>
        </div>
      )}
      <div style={{marginTop:16,background:"rgba(255,255,255,.12)",borderRadius:20,padding:"15px 17px",border:"1px solid rgba(255,255,255,.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>Próximo Prêmio</div>
            <div style={{fontWeight:900,fontSize:16,color:"#fff",marginTop:3}}>
              {isLocked ? (isPend ? "Em Auditoria ⏳" : "Retire seu Prêmio! 🏆") : <>Faltam <span style={{color:C.ou,fontSize:24}}>{falt}</span> {falt===1?"visita":"visitas"}</>}
            </div>
          </div>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.8}}>Ganhos</div><div style={{fontWeight:900,fontSize:26,color:C.ou,lineHeight:1.1}}>{cfg.premioMeta.emoji} {raspa}</div></div>
        </div>
        <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,height:9,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",borderRadius:8,background:`linear-gradient(90deg,${C.ou},#ffca28)`,width:`${pct}%`,transition:"width .7s"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,.5)"}}><span style={{color:C.ou,fontWeight:700}}>{prog}/{cfg.meta}</span><span>Total: {tot}</span></div>
        <div style={{display:"flex",gap:4,marginTop:12,flexWrap:"wrap"}}>
          {Array.from({length:cfg.meta}).map((_,i)=><div key={i} style={{width:15,height:15,borderRadius:"50%",background:i<prog?C.ou:"rgba(255,255,255,.15)",border:`1.5px solid ${i<prog?C.ou:"rgba(255,255,255,.25)"}`,boxShadow:i<prog?`0 0 5px ${C.ou}99`:"none",transition:"all .2s"}}/>)}
        </div>
      </div>
    </div>
    {/* CONTEÚDO */}
    <div style={{flex:1,padding:"14px 14px 82px"}}>
      {aba==="ini"&&<Inicio c={c} cfg={cfg} meusPr={meusPr} temPr={temPr} nBadge={nBadge} setAba={setAba} premios={premios}/>}
      {aba==="reg" && (encerrada ? (
        <div style={{padding:30,textAlign:"center",animation:"up .4s"}}>
          <div style={{fontSize:60,marginBottom:15}}>⌛</div>
          <div style={{fontWeight:900,fontSize:20,color:C.tx,marginBottom:8}}>Campanha Encerrada</div>
          <div style={{fontSize:13,color:C.sb,lineHeight:1.6,marginBottom:20}}>Esta campanha chegou ao fim em {fD(dFim)}. Aguarde a nova campanha para registrar suas visitas e pontuar novamente!</div>
          <button onClick={()=>setAba("ini")} style={{marginTop:20,background:C.az,color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Voltar ao Início</button>
        </div>
      ) : <FormAuth c={c} clients={clients} setCl={setCl} premios={premios} setPr={setPr} cfg={cfg} ops={ops} opQR={opQR} setOpQR={setOpQR} setRelamp={setRelamp} setAba={setAba} setCli={setCli}/>)}
      {aba==="pr" &&<Premios meusPr={meusPr} c={c} wts={cfg.wts||CFG0.wts} setVoucherVer={setVoucherVer}/>}
      {aba==="not"&&<Noticias noticias={noticias} temPr={temPr} wts={cfg.wts||CFG0.wts}/>}
      {aba==="ct" &&<Conta c={c} temPr={temPr} meusPr={meusPr} tot={tot} raspa={raspa} cfg={cfg} setCli={setCli} setTela={setTela} clients={clients} setCl={setCl} encerrada={encerrada} dFim={dFim} dIni={dIni} premios={premios} setPr={setPr} setVoucherVer={setVoucherVer}/>}
    </div>
    {/* NAV */}
    <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:`1px solid ${C.bd}`,display:"flex",boxShadow:"0 -4px 20px rgba(0,52,120,.09)",zIndex:100}}>
      {ABAS.map(a=>{const badge=a.id==="not"&&temPr&&nBadge>0;const isReg=a.id==="reg";return(
        <button key={a.id} onClick={()=>setAba(a.id)} style={{flex:1,padding:"9px 3px 11px",border:"none",cursor:"pointer",fontFamily:"inherit",background:aba===a.id?C.azC:"#fff",borderTop:`2.5px solid ${aba===a.id?C.az:"transparent"}`,transition:"all .2s",position:"relative"}}>
          {badge&&<div style={{position:"absolute",top:6,right:"50%",transform:"translateX(10px)",width:16,height:16,borderRadius:"50%",background:C.rd,color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{nBadge}</div>}
          <div style={{fontSize:18,marginBottom:2}}>{isReg?<span style={{display:"inline-flex",width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${C.ou},${C.ou2})`,alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:`0 2px 10px ${C.ou}55`,animation:opQR?"glw 1.5s infinite":"none"}}>{a.em}</span>:a.em}</div>
          <div style={{fontSize:9,fontWeight:aba===a.id?800:600,color:aba===a.id?C.az:C.sb,lineHeight:1}}>{a.l}</div>
        </button>
      );})}
    </nav>
    {voucherVer && <VoucherCard p={voucherVer} cli={c} cfg={cfg} onClose={()=>setVoucherVer(null)} />}
  </div>);}

/* ══════════════════════ INÍCIO ══════════════════════ */
function Inicio({c,cfg,meusPr,temPr,nBadge,setAba,premios}){
  const authsValidas = (c.auths||[]).filter(a=>a.valida!==false && a.status !== "rejected");
  const tot=c.auths?.length||0;const totV=authsValidas.length;
  const raspa=Math.floor(totV/cfg.meta);const prog=totV%cfg.meta;
  const pendsR = (c.auths||[]).filter(a => a.status === "rejected" || (premios||[]).some(p=>p.authId===a.id && p.status==="rejected"));

  return(<div style={{display:"flex",flexDirection:"column",gap:11,animation:"up .3s"}}>
    {pendsR.length > 0 && (
      <div style={{background:C.rdC, border:`2px solid ${C.rd}`, borderRadius:18, padding:16, display:"flex", gap:14, alignItems:"center", animation:"pop .4s", marginBottom:12, boxShadow:`0 4px 15px ${C.rd}22`}}>
        <div style={{fontSize:32, animation:"pulse 1s infinite"}}>⚠️</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:14,color:C.rd}}>Registros Recusados pela Gerência</div>
          <div style={{fontSize:11,color:C.rd,opacity:.8,marginTop:4, fontWeight:700}}>Você possui pendências em seu histórico (visitas ou prêmios recusados). Toque para corrigir e reenviar.</div>
        </div>
        <button onClick={()=>setAba("ct")} style={{background:C.rd, color:"#fff", border:"none", borderRadius:10, padding:"8px 14px", fontSize:11, fontWeight:900, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 2px 8px ${C.rd}44`}}>Corrigir</button>
      </div>
    )}

    <button onClick={()=>setAba("reg")} style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",border:"none",borderRadius:18,padding:"16px 18px",fontWeight:900,fontFamily:"inherit",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",animation:"glw 2.5s infinite",boxShadow:`0 6px 22px ${C.az}44`}}>
      <div><div style={{fontSize:12,fontWeight:700,marginBottom:3,opacity:.8,color:C.ou}}>Comprovante em mãos?</div><div style={{fontSize:18,fontWeight:900}}>📷 Escanear Comprovante</div></div>
      <span style={{fontSize:38}}>📄</span>
    </button>
    {temPr&&nBadge>0&&<div onClick={()=>setAba("not")} style={{background:`linear-gradient(135deg,${C.rx},#5b21b6)`,borderRadius:16,padding:"13px 16px",cursor:"pointer",display:"flex",gap:12,alignItems:"center"}}>
      <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌟</div>
      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:"#fff"}}>Notícias exclusivas!</div><div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:2}}>{nBadge} especial{nBadge>1?"is":""} para clientes premiados</div></div>
      <div style={{background:C.ou,color:C.az,fontWeight:900,fontSize:12,width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{nBadge}</div>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {[["🎯","Total Visitas",tot,C.az],[cfg.premioMeta.emoji,"Prêmios",raspa,C.ou2],["⚡","Relâmpagos",meusPr.filter(p=>p.tipo==="relampago").length,C.rx],["✅","Pontos Válidos",totV,C.vd]].map(([em,t,v,cor])=>(
        <div key={t} style={{background:"#fff",borderRadius:14,padding:"12px",border:`1px solid ${C.bd}`}}><div style={{fontSize:20,marginBottom:4}}>{em}</div><div style={{fontWeight:900,fontSize:26,color:cor,lineHeight:1}}>{v}</div><div style={{fontWeight:800,fontSize:10,color:C.tx,marginTop:2}}>{t}</div></div>
      ))}
    </div>
    {tot>0&&<div style={{background:"#fff",borderRadius:14,overflow:"hidden",border:`1.5px solid ${C.bd}`}}>
      <div style={{padding:"11px 14px",borderBottom:`1.5px solid ${C.bd}`,fontWeight:800,fontSize:12,color:C.tx}}>📋 Últimas Visitas</div>
      {[...c.auths].reverse().slice(0,5).map((a,i)=>{const v=a.valida!==false;return(<div key={a.id} style={{padding:"10px 14px",borderBottom:i<4?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:v?C.azC:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{v?"🏪":"⏳"}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:C.tx}}>{a.opNome||"Visita"} · <span style={{color:a.status==="pending"?C.ou:v?C.vd:C.rd}}>{a.status==="pending"?"Pendente ⏳":v?"Validada ✅":"Abaixo do Mínimo"}</span></div>
          <div style={{fontSize:10,color:C.sb}}>{fDT(a.data)}{a.total/1>0?` · ${brl(a.total)}`:""} · <span style={{fontWeight:800,color:C.az}}>#{a.controle}</span></div>
        </div>
        <div style={{fontWeight:900,fontSize:12,color:v?C.az:C.sb}}>{c.auths.length-i}ª</div>
      </div>);})}
    </div>}
  </div>);}

function FormAuth({c,clients,setCl,premios,setPr,cfg,ops,opQR,setOpQR,setRelamp,setAba,setCli}){
  const[step,  setStep]    = useState(opQR?"form":"qr");
  const[controle,setControle] = useState("");
  const[dataRec,setDataRec] = useState(hoje());
  const[foto,  setFoto]    = useState(null);
  const[sel,   setSel]     = useState({});
  const[obs,   setObs]     = useState("");
  const[nota,  setNota]    = useState(0);
  const[opToken,setOpToken] = useState(opQR?.id||"");
  const[errF,  setErrF]    = useState("");
  const[valida,setValida]  = useState(false);
  const[novoProg,setNP]   = useState(null);
  const[sub, setSub]      = useState(false);

  // OCR States
  const [camAtiva, setCamAtiva] = useState(false);
  const [scanProg, setScanProg] = useState(0);
  const [validando, setValidando] = useState(false);
  const [errQR, setErrQR] = useState("");
  const fileInputRef = useRef(null);

  function processImage(file) {
    setCamAtiva(true);
    setValidando(true);
    setScanProg(0);
    const url = URL.createObjectURL(file);
    
    Tesseract.recognize(
      url,
      'por',
      { logger: m => { if(m.status === 'recognizing text') setScanProg(m.progress); } }
    ).then(({ data: { text } }) => {
      setValidando(false);
      setCamAtiva(false);
      
      const txt = text.toUpperCase();
      console.log("✅ TEXTO OCR COMPLETO:\n", txt);
      
      // 1. Extrair TOTAL
      let totalAchado = 0;
      const matchTotal = txt.match(/TOTAL\s*(?:DOS ITENS|RECEBIDO|PAGO)?[\s:\.]*R\$?[\s]*([0-9\.,]+)/);
      if(matchTotal) {
          totalAchado = parseFloat(matchTotal[1].replace('.','').replace(',','.'));
      } else {
          const matchesValor = [...txt.matchAll(/(?:VALOR|R\$|RS).*?([0-9]+[.,][0-9]{2})/ig)];
          matchesValor.forEach(m => {
              totalAchado += parseFloat(m[1].replace('.','').replace(',','.'));
          });
      }

      const minV = cfg.minVisita || 300;
      const minR = cfg.minRelampago || 60;

      if (totalAchado <= 0) {
          setErrQR(`Não foi possível identificar o valor total no cupom. Tente uma foto mais nítida ou digite manualmente.`);
          return;
      }

      if (totalAchado < minV && totalAchado < minR) {
          // Se for menor que ambos, avisa que será histórico
          console.log(`⚠️ Valor R$ ${totalAchado.toFixed(2)} abaixo do mínimo da campanha (R$ ${minV.toFixed(2)}).`);
      }

      // 2. Extrair CONTROLE
      let matchControle = txt.match(/(?:CONTROLE|TERM|REGISTRO|NSU)[:\s\.-]*([0-9]{5,10})/);
      let controleDet = matchControle ? matchControle[1] : "";
      
      if(controleDet) {
        const jaUsou = clients.some(cc=>cc.auths?.some(a=>a.controle===controleDet || a.opId===controleDet));
        if(jaUsou){
          setErrQR("Comprovante "+controleDet+" duplicado! Já registrado.");
          return;
        }
        setControle(controleDet);
      }

      // 3. Auto-preenchimento por blocos
      let newSel = {};
      const blocos = txt.split(/JOGO\/?SERVI[CÇS]O|SERVI[CÇS]O|JOGO/i);
      if(blocos.length > 1) {
         blocos.slice(1).forEach(b => {
             const matchVal = b.match(/(?:VALOR|R\$|RS).*?([0-9]+[.,][0-9]{2})/i);
             let val = "";
             if(matchVal) val = matchVal[1].replace('.','').replace(',','.');
             
             if(b.includes("SANEAMENTO") || b.includes("PGTO") || b.includes("BOLETO") || b.includes("CONVENIO")) {
                newSel["boleto"] = val || true;
             }
             else if(b.includes("DEPOSITO") || b.includes("DEPÓSITO")) newSel["deposito"] = val || true;
             else if(b.includes("SAQUE")) newSel["saque"] = val || true;
             else if(b.includes("PIX")) newSel["pix"] = val || true;
             else if(b.includes("LOTOF") || b.includes("LOTO")) newSel["lotofacil"] = val || true;
             else if(b.includes("MEGA")) newSel["megasena"] = val || true;
             else if(b.includes("QUINA")) newSel["quina"] = val || true;
             else if(b.includes("BOLÃO") || b.includes("BOLAO")) newSel["bolao"] = val || true;
         });
      } else {
         if(txt.includes("SANEAMENTO") || txt.includes("PGTO") || txt.includes("BOLETO")) newSel["boleto"] = totalAchado > 0 ? totalAchado.toFixed(2) : true;
         if(txt.includes("LOTOF") || txt.includes("LOTO")) newSel["lotofacil"] = true;
      }
      
      setSel(newSel); 
      setStep("form");
      setFoto(url);
    }).catch(err => {
      console.error(err);
      setValidando(false);
      setCamAtiva(false);
      setErrQR("Falha na leitura da imagem. Tente a digitação manual.");
    });
  }


  const form    = cfg.formulario||CFG0.formulario;
  const cats    = form.cats||[];
  const campos  = (form.campos||[]).filter(f=>f.ativo);
  const sels    = Object.keys(sel).filter(k=>sel[k]!==false&&sel[k]!=="");
  
  const totalPagamentos = Object.entries(sel).reduce((s,[id,v])=>{
    const c = campos.find(f=>f.id===id);
    if(c?.cat==="bc"){return s+(parseFloat(String(v).replace(',','.'))||0);}
    return s;
  },0);
  const totalJogos = Object.entries(sel).reduce((s,[id,v])=>{
    const c = campos.find(f=>f.id===id);
    if(c?.cat==="jg"){return s+(parseFloat(String(v).replace(',','.'))||0);}
    return s;
  },0);

  const total   = totalPagamentos + totalJogos;
  const temTrig = totalJogos >= (cfg.minRelampago||60);
  const obrigF  = campos.filter(f=>f.obrigatorio&&!sels.includes(f.id));
  const trigF   = campos.filter(f=>f.triggerRelampago&&f.ativo);

  const minV = cfg.minVisita || 300;
  const minR = cfg.minRelampago || 60;
  const faltaVisita = Math.max(0, minV - totalPagamentos);
  const faltaRelamp = Math.max(0, minR - totalJogos);

  function toggle(id){setSel(p=>{const n={...p};if(n[id]!==undefined&&n[id]!==false){delete n[id];}else{n[id]=true;}return n;});setErrF("");}
  function setVal(id,v){setSel(p=>({...p,[id]:v}));}

  async function gravar(){
    if(!opToken){setErrF("Selecione ou identifique a Operadora que te atendeu.");return;}
    if(!controle){setErrF("Informe o número do comprovante (Controle).");return;}
    if(!dataRec){setErrF("Informe a data que consta no comprovante.");return;}
    if(nota===0){setErrF("Avalie o atendimento de 1 a 10.");return;}
    
    setStep("loading");

    // Validar Controle Único (Global)
    const conflicto = (() => {
      for (const cli of clients) {
        for (const a of (cli.auths || [])) {
          if (a.controle && String(a.controle).trim() === String(controle).trim()) {
            return { cNome: cli.nome, data: a.data };
          }
          if (a.nsu && String(a.nsu).trim() === String(controle).trim()) {
            return { cNome: cli.nome, data: a.data };
          }
        }
      }
      return null;
    })();

    if (conflicto) {
      setStep("form");
      setErrF(`❌ O número [${controle}] já consta como usado por ${conflicto.cNome} em ${fDT(conflicto.data)}. Use um número diferente.`);
      return;
    }

    // Validar Prazo (ex: máximo 7 dias atrás E dentro da vigência)
    const dC = new Date(dataRec); const dH = new Date();
    const dIni = new Date(cfg.dataInicio || CFG0.dataInicio);
    const dFim = new Date(cfg.dataFim || CFG0.dataFim);
    
    const diff = Math.floor((dH - dC) / (1000 * 60 * 60 * 24));
    if(diff < 0 || diff > 7){ 
       setStep("form");
       setErrF("❌ A data do comprovante está fora do prazo permitido (máximo 7 dias atrás).");
       return;
    }
    if(dC < dIni || dC > dFim){
      setStep("form");
      setErrF(`❌ Visita inválida. A campanha atual é válida de ${fD(dIni)} a ${fD(dFim)}.`);
      return;
    }

    if(sub) return;
    setSub(true);
    
    let opsAtual=ops;
    try{const fresh=await DB.load("lc-ops");if(fresh)opsAtual=fresh;}catch(_){}
    const operator = opsAtual.find(o => o.id === opToken);
    
    if (!operator) {
       setSub(false);
       setStep("form");
       setErrF("❌ Operadora não identificada. Verifique o código informado."); 
       return; 
    }

    setTimeout(async ()=>{
      try {
        // Combinar data do comprovante com hora atual para exibição correta
        const agora = new Date();
        const h = String(agora.getHours()).padStart(2, '0');
        const m = String(agora.getMinutes()).padStart(2, '0');
        const s = String(agora.getSeconds()).padStart(2, '0');
        const dIso = new Date(`${dataRec}T${h}:${m}:${s}`).toISOString();
        
        const emojis=sels.map(id=>campos.find(f=>f.id===id)?.emoji||"");
        const isV = totalPagamentos >= minV;
        setValida(isV);
        const auth={id:uid(),data:dIso,controle,opId:operator.id,opNome:operator.nome,selecionados:sels,emojis,total,obs,nota,foto,created:now(),valida:isV,status:isV?"pending":"not_counted",detalhes:sel};
        const auths=[...(c.auths||[]),auth];
        // Para o prêmio de meta, consideramos as aprovadas + a nova que está entrando (pendente)
        const totalParaMeta = auths.filter(a=>a.status!=="rejected" && a.status!=="not_counted").length;
        const meta = cfg.meta || 15;
        const ganhou=isV && (totalParaMeta % meta === 0);
        
        const pr=(totalJogos >= minR)?sortear(sels,cfg):null;
        const cUpd={...c,auths};
        const novPr=[...premios];
        
        if(ganhou)novPr.push({id:uid(),clientId:c.id,authId:auth.id,tipo:"raspadinha",nome:cfg.premioMeta.nome,emoji:cfg.premioMeta.emoji,desc:cfg.premioMeta.desc.replace("{meta}",cfg.meta).replace("{premioNome}",cfg.premioMeta.nome),data:now(),status:"pending"});
        if(pr)novPr.push({id:uid(),clientId:c.id,authId:auth.id,tipo:"relampago",nome:pr.nome,emoji:pr.emoji,desc:pr.desc,data:now(),status:"pending"});
        
        // Transição de UI IMEDIATA
        setNP({total:totalParaMeta,ganhouMeta:ganhou,premioRl:pr});
        setStep("ok");

        // Atualizações Globais síncronas para não dar lag na top bar
        setCl(clients.map(x=>x.id===c.id?cUpd:x));
        setCli(cUpd);
        setPr(novPr);
        if(pr)setRelamp({...pr,cliNome:c.nome});
      } catch (err) {
        console.error(err);
        setErrF("Falha na sincronização: Verifique sua internet e tente novamente.");
        setStep("form");
      } finally {
        setSub(false);
      }
    }, 250);
  }

  if(step==="loading")return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:340,gap:18}}>
    <div style={{width:58,height:58,borderRadius:"50%",border:`4px solid ${C.az}`,borderTopColor:"transparent",animation:"sp .8s linear infinite"}}/>
    <div style={{fontWeight:800,fontSize:16,color:C.az}}>Validando regulamento…</div>
    <div style={{fontSize:12,color:C.sb}}>Verificando Controle e integridade dos dados 🛡️</div>
  </div>);

  if(step==="ok"){
    const novoTot=novoProg?.total||0;const novoPr_=novoTot%cfg.meta;const novoR=Math.floor(novoTot/cfg.meta);
    const novoPct=Math.round((novoPr_/cfg.meta)*100);const gM=novoProg?.ganhouMeta;const pRl=novoProg?.premioRl;
    return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"20px 0",animation:"fadeUp .5s ease"}}>
      <div style={{fontSize:72,animation:"pop .6s",lineHeight:1}}>{valida?"✅":"⏳"}</div>
      <div style={{fontWeight:900,fontSize:24,color:valida?C.vd:C.ou,textAlign:"center"}}>{valida?"Autenticação Válida!":"Visita Registrada!"}</div>
      <div style={{fontSize:13,color:C.sb,lineHeight:1.7,textAlign:"center"}}><strong style={{color:C.tx}}>{valida?"Você ganhou 1 ponto!":"Registrada no histórico."}</strong><br/>{valida?"Visita válida para o prêmio principal.":`Esta visita não pontuou (valor abaixo de ${brl(minV)}).`}</div>
      <div style={{width:"100%",background:`linear-gradient(135deg,${C.az},${C.az2})`,borderRadius:20,padding:"18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:13}}>
          <div><div style={{fontSize:10,color:"rgba(255,255,255,.55)",fontWeight:700,textTransform:"uppercase"}}>Progresso</div><div style={{fontWeight:900,fontSize:16,color:"#fff",marginTop:3}}>{gM?<><span style={{color:C.ou,fontSize:22}}>{cfg.premioMeta.emoji}</span> Você ganhou!</>:<>Faltam <span style={{color:C.ou,fontSize:22}}>{cfg.meta-novoPr_}</span> visitas</>}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"rgba(255,255,255,.55)",textTransform:"uppercase"}}>Ganhos</div><div style={{fontWeight:900,fontSize:24,color:C.ou}}>{cfg.premioMeta.emoji} {novoR}</div></div>
        </div>
        <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,height:10,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",borderRadius:8,background:`linear-gradient(90deg,${C.ou},#ffca28)`,width:gM?"100%":`${novoPct}%`,transition:"width .8s ease"}}/></div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:10}}>
          {Array.from({length:cfg.meta}).map((_,i)=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<novoPr_?C.ou:gM?"rgba(0,166,81,.5)":"rgba(255,255,255,.15)",border:`1.5px solid ${i<novoPr_?C.ou:gM?C.vd:"rgba(255,255,255,.25)"}`,boxShadow:i<novoPr_?`0 0 6px ${C.ou}99`:"none",transition:"all .3s",transitionDelay:`${i*25}ms`}}/>)}
        </div>
      </div>
      <div style={{width:"100%",background:"#fff",borderRadius:14,padding:"13px 14px",border:`1px solid ${C.bd}`,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{fontSize:28}}>⭐</div>
        <div><div style={{fontWeight:800,fontSize:13,color:C.tx}}>Sua avaliação: {nota}/10</div><div style={{fontSize:11,color:C.sb,marginTop:2}}>{nota>=9?"Excelente! Muito obrigado!":nota>=7?"Ótimo! Obrigado pelo feedback.":nota>=5?"Agradecemos a avaliação.":"Obrigado. Vamos melhorar!"}</div></div>
      </div>
      {gM&&<div style={{width:"100%",background:`linear-gradient(135deg,${C.vd},#059669)`,borderRadius:18,padding:"18px",textAlign:"center",animation:"pop .5s"}}><div style={{fontSize:48,marginBottom:6}}>{cfg.premioMeta.emoji}</div><div style={{fontWeight:900,fontSize:20,color:"#fff",marginBottom:6}}>Parabéns! Prêmio Conquistado!</div><div style={{fontSize:12,color:"rgba(255,255,255,.85)",lineHeight:1.7}}>Aguardando auditoria. Assim que aprovado, você receberá o voucher de resgate via WhatsApp!</div></div>}
      {pRl&&<div style={{width:"100%",background:`linear-gradient(135deg,${C.rx},#5b21b6)`,borderRadius:18,padding:"16px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:6}}>{pRl.emoji}</div><div style={{fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,.7)",marginBottom:5}}>⚡ Prêmio Relâmpago!</div><div style={{fontWeight:900,fontSize:18,color:"#fff",marginBottom:6}}>{pRl.nome}</div><div style={{fontSize:12,color:"rgba(255,255,255,.8)",lineHeight:1.6}}>Aguardando auditoria. Assim que aprovado, você receberá o voucher via WhatsApp!</div></div>}
      <a href={`https://wa.me/${cfg.wts||CFG0.wts}?text=${encodeURIComponent(`Olá! Sou *${c.nome}* e registrei minha visita na ${NOME}.${gM?` 🎉 ${cfg.premioMeta.emoji} ${cfg.premioMeta.nome}!`:""}${pRl?` ⚡ ${pRl.nome}!`:""}`)}`} target="_blank" rel="noreferrer"
        style={{display:"block",width:"100%",background:"#25D366",color:"#fff",borderRadius:14,padding:"14px",fontWeight:800,fontSize:15,textDecoration:"none",textAlign:"center",boxShadow:"0 4px 16px rgba(37,211,102,.4)"}}>
        📲 Avisar a Lotérica via WhatsApp
      </a>
      <button onClick={()=>{setAba("ini");setOpQR(null);}} style={{width:"100%",background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.az}44`}}>Ver meu progresso</button>
    </div>);}

  if(step==="qr"||step==="cam")return(<div style={{display:"flex",flexDirection:"column",gap:12,animation:"up .3s"}}>
    <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,padding:"22px 20px 24px",borderRadius:18,position:"relative",overflow:"hidden",color:"#fff"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:150,height:150,borderRadius:"50%",background:C.ou,opacity:.08}}/>
      <div style={{fontWeight:900,fontSize:20}}>📷 Escanear Comprovante</div>
      <div style={{fontSize:11,opacity:.7,marginTop:3}}>A IA fará a leitura automática dos dados</div>
    </div>
    
    <input type="file" accept="image/*" ref={fileInputRef} onChange={e=>{ if(e.target.files[0]) processImage(e.target.files[0]); }} style={{display:"none"}} />
    
    {!camAtiva&&<div style={{background:`linear-gradient(135deg,${C.ou},${C.ou2})`,borderRadius:18,padding:"28px 18px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:C.ou,opacity:.08}}/>
      <div style={{fontSize:56,marginBottom:15}}>📄</div>
      <div style={{fontWeight:900,fontSize:18,color:C.az,marginBottom:14}}>Anexar Comprovante</div>
      <div style={{fontSize:13,color:C.az,opacity:.8,lineHeight:1.6,marginBottom:20}}>Tire uma foto nítida do cupom fiscal da Lotérica ou anexe o arquivo para preenchimento.</div>
      <button onClick={()=>{ fileInputRef.current.click(); }} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:16,cursor:"pointer",background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",boxShadow:`0 4px 18px ${C.az}44`}}>
        📸 Tirar Foto / Anexar Arquivo
      </button>
    </div>}
    
    {camAtiva&&<div style={{background:"#000",borderRadius:18,height:220,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:50,height:50,borderRadius:"50%",border:`4px solid ${C.ou}`,borderTopColor:"transparent",animation:"sp .8s linear infinite"}}/>
      <div style={{color:"#fff",fontWeight:800,marginTop:12}}>Inteligência Artificial processando...</div>
      <div style={{color:C.ou,fontSize:11,marginTop:6}}>Efetuando OCR: {Math.round(scanProg*100)}% concluído</div>
    </div>}

    <div style={{background:"#fff",borderRadius:14,padding:"16px",border:`1.5px dashed ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:12,color:C.tx,marginBottom:8}}>⌨️ Comprovante apagado? Digite manualmente</div>
      <div style={{display:"flex",gap:7}}>
        <button onClick={()=>{ setStep("form"); setSel({}); }} 
          style={{flex:1,background:C.bg,color:C.az,border:"none",borderRadius:10,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          Ir para Preenchimento Manual →
        </button>
      </div>
      {errQR&&<div style={{marginTop:10,padding:10,background:C.rdC,borderRadius:10,fontSize:11,color:C.rd,fontWeight:700,border:`1px solid ${C.rd}44`}}>⚠️ {errQR}</div>}
    </div>
    <button onClick={()=>setAba("ini")} style={{background:"#fff",color:C.sb,border:`1.5px solid ${C.bd}`,borderRadius:12,padding:12,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Voltar ao Início</button>
  </div>);

  if(step==="start" || step==="form"){
    return(<div style={{display:"flex",flexDirection:"column",gap:12,animation:"up .3s"}}>
      
      {/* ── IDENTIFICAÇÃO DO OPERADOR ── */}
      <div style={{background:opToken?C.vdC:"#fff",borderRadius:16,padding:"16px 14px",border:`1.5px solid ${opToken?C.vd:C.ou}`,boxShadow:opToken?"none":`0 4px 14px ${C.ou}22`}}>
        <div style={{fontWeight:900,fontSize:14,color:opToken?C.vd:C.ou2,marginBottom:8}}>{opToken?"✅ Operadora Identificada":"👩‍💼 Selecionar Operadora"}</div>
        {opToken ? (
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:C.vd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👩‍💼</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,color:C.tx}}>{ops.find(o=>o.id===opToken || o.curToken===opToken)?.nome || "Operadora Autorizada"}</div><div style={{fontSize:11,color:C.sb}}>ID: {opToken}</div></div>
            <button onClick={()=>{setOpToken("");setOpQR(null);}} style={{background:C.bg,border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,color:C.sb,cursor:"pointer"}}>Alterar</button>
          </div>
        ) : (
          <div>
            <div style={{fontSize:11,color:C.tx,marginBottom:12}}>Escolha a operadora que fez o seu atendimento:</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <select value={opToken} onChange={e=>setOpToken(e.target.value)} style={{width:"100%",padding:12,borderRadius:11,border:`1.5px solid ${C.bd}`,fontFamily:"inherit",fontSize:14,fontWeight:700,background:"#fff",outline:"none"}}>
                <option value="">Selecione...</option>
                {ops.map(o=><option key={o.id} value={o.id}>{o.nome} (Cód: {o.id})</option>)}
              </select>
              <div style={{textAlign:"center",fontSize:10,color:C.sb,margin:"5px 0"}}>OU DIGITE O CÓDIGO DA OPERADORA</div>
              <div style={{display:"flex",gap:8}}>
                <input value={opToken} onChange={e=>setOpToken(e.target.value.replace(/\D/g,""))} placeholder="CÓDIGO DE 4 DÍGITOS" maxLength={4} style={{flex:1,padding:"12px 14px",border:`2px solid ${C.ou}`,borderRadius:11,fontSize:18,fontWeight:900,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff",textAlign:"center"}} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DADOS DO COMPROVANTE ── */}
      <div style={{background:"#fff",borderRadius:16,padding:"15px 14px",border:`1px solid ${C.bd}`}}>
        <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>📄 Dados do Comprovante</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <label style={LS}>Data do Cupom *</label>
            <input type="date" value={dataRec} onChange={e=>setDataRec(e.target.value)} style={{width:"100%",marginTop:5,...I,fontSize:13}} />
          </div>
          <div>
            <label style={LS}>Controle / Registro *</label>
            <input value={controle} onChange={e=>setControle(e.target.value.replace(/\D/g,""))} placeholder="Ex: 545118" style={{width:"100%",marginTop:5,...I}} />
          </div>
        </div>
        <label style={LS}>Foto do Comprovante (opcional)</label>
        <div style={{marginTop:5,position:"relative"}}>
          <input type="file" accept="image/*" capture="environment" onChange={e=>{if(e.target.files[0]) setFoto(URL.createObjectURL(e.target.files[0]))}} style={{display:"none"}} id="foto-inp" />
          <label htmlFor="foto-inp" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:foto?C.vdC:C.azC,color:foto?C.vd:C.az,padding:14,borderRadius:12,border:`2px dashed ${foto?C.vd:C.az}44`,cursor:"pointer",fontWeight:800,fontSize:14}}>
            {foto ? "✅ Foto Selecionada" : "📸 Tirar Foto do Cupom"}
          </label>
          {foto && <div style={{marginTop:10,textAlign:"center"}}><img src={foto} style={{width:100,height:100,objectFit:"cover",borderRadius:12,border:`2px solid ${C.bd}`}} alt="comprovante" /><div onClick={()=>setFoto(null)} style={{fontSize:11,color:C.rd,fontWeight:700,marginTop:4,cursor:"pointer"}}>Excluir Foto</div></div>}
        </div>
      </div>

      {/* ── RESUMO DE VALORES E NUDGES ── */}
      <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,borderRadius:16,padding:"16px",display:"flex",flexDirection:"column",gap:12,boxShadow:`0 8px 20px ${C.az}33`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>Total Operação</div>
            <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>{brl(total)}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>Autenticação</div>
            <div style={{fontSize:22,fontWeight:900,color:totalPagamentos>=minV?C.vd:C.ou}}>
              {totalPagamentos>=minV?"LIBERADA ✅":"PENDENTE ⏳"}
            </div>
          </div>
        </div>

        {/* Nudge Visita */}
        <div style={{background:"rgba(255,255,255,.1)",borderRadius:12,padding:10,border:`1px solid ${totalPagamentos>=minV?C.vd+"88":"rgba(255,255,255,.2)"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:800,color:"#fff",marginBottom:5}}>
            <span>🏢 PAGAMENTOS / DEPÓSITOS</span>
            <span>{brl(totalPagamentos)} / {brl(minV)}</span>
          </div>
          <div style={{height:6,background:"rgba(0,0,0,.3)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",background:totalPagamentos>=minV?C.vd:C.ou,width:`${Math.min(100,(totalPagamentos/minV)*100)}%`,transition:"width .4s"}}/>
          </div>
          {faltaVisita>0 && <div style={{fontSize:11,color:C.ou,fontWeight:700,marginTop:6,textAlign:"center"}}>Faltam {brl(faltaVisita)} para validar sua visita!</div>}
        </div>

        {/* Nudge Relâmpago */}
        <div style={{background:"rgba(255,255,255,.1)",borderRadius:12,padding:10,border:`1px solid ${totalJogos>=minR?C.rx+"88":"rgba(255,255,255,.2)"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:800,color:"#fff",marginBottom:5}}>
            <span>⚡ BOLÕES / JOGOS</span>
            <span>{brl(totalJogos)} / {brl(minR)}</span>
          </div>
          <div style={{height:6,background:"rgba(0,0,0,.3)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",background:totalJogos>=minR?C.rx:"rgba(255,255,255,.3)",width:`${Math.min(100,(totalJogos/minR)*100)}%`,transition:"width .4s"}}/>
          </div>
          {faltaRelamp>0 ? (
            <div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:700,marginTop:6,textAlign:"center"}}>Adicione {brl(faltaRelamp)} em jogos para o Prêmio Relâmpago! ⚡</div>
          ) : (
            <div style={{fontSize:11,color:C.rxC,fontWeight:800,marginTop:6,textAlign:"center",animation:"pop .5s"}}>VOCÊ ESTÁ CONCORRENDO AO PRÊMIO RELÂMPAGO! 🎰</div>
          )}
        </div>
      </div>

      {/* ── SERVIÇOS ── */}
      <div style={{background:"#fff",borderRadius:16,padding:"15px 14px",border:`1px solid ${C.bd}`}}>
        {cats.map((cat,ci)=>{
          const cc=campos.filter(f=>f.cat===cat.id);if(cc.length===0)return null;
          return(<div key={cat.id} style={{marginBottom:ci<cats.length-1?16:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
              <div style={{width:3,height:15,borderRadius:4,background:cat.cor,flexShrink:0}}/>
              <div style={{fontWeight:800,fontSize:11,color:cat.cor,textTransform:"uppercase",letterSpacing:.5}}>{cat.nome}</div>
              <div style={{fontSize:9,color:C.sb,marginLeft:"auto"}}>(opcional)</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {cc.map(f=>{const on=f.id in sel&&sel[f.id]!==false&&sel[f.id]!=="";return(
                <div key={f.id} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <button onClick={()=>toggle(f.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 10px",borderRadius:12,border:`2px solid ${on?cat.cor:C.bd}`,background:on?`${cat.cor}10`:"#fff",cursor:"pointer",fontFamily:"inherit",transition:"all .18s",width:"100%"}}>
                    <span style={{fontSize:17,flexShrink:0}}>{f.emoji}</span>
                    <span style={{fontSize:11,fontWeight:700,color:on?cat.cor:C.tx,flex:1,textAlign:"left",lineHeight:1.2}}>{f.nome}</span>
                    {on&&<div style={{width:16,height:16,borderRadius:"50%",background:cat.cor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:9,fontWeight:900}}>✓</span></div>}
                  </button>
                  {on&&f.comValor&&<div style={{position:"relative",animation:"up .15s"}}>
                    <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.sb,fontWeight:600}}>R$</span>
                    <input value={typeof sel[f.id]==="string"?sel[f.id]:""} onChange={e=>setVal(f.id,e.target.value)} type="number" min="0" step="0.01" placeholder="0,00" autoFocus
                      style={{width:"100%",paddingLeft:26,paddingRight:8,paddingTop:8,paddingBottom:8,border:`1.5px solid ${cat.cor}66`,borderRadius:9,fontSize:13,fontFamily:"inherit",outline:"none",fontWeight:700,color:C.tx,background:"#fff"}}/>
                  </div>}
                </div>
              );})}
            </div>
          </div>);
        })}
      </div>

      {/* ── AVALIAÇÃO ── */}
      <div style={{background:"#fff",borderRadius:16,padding:"16px 14px",border:`1.5px solid ${nota>0?C.ou+88:C.bd}`}}>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:11,background:C.ouC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⭐</div>
          <div><div style={{fontWeight:800,fontSize:13,color:C.tx}}>Avalie o Atendimento *</div><div style={{fontSize:11,color:C.sb,marginTop:2}}>Nota de 1 a 10</div></div>
          {nota>0&&<div style={{marginLeft:"auto",fontWeight:900,fontSize:24,color:nota>=8?C.vd:nota>=5?C.ou2:C.rd}}>{nota}</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:7}}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=>{
            const cor=n>=8?C.vd:n>=5?C.ou:C.rd;const on=nota===n;
            return(<button key={n} onClick={()=>setNota(n)} style={{padding:"10px 0",borderRadius:12,border:`2px solid ${on?cor:C.bd}`,background:on?`${cor}15`:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <span style={{fontWeight:900,fontSize:15,color:on?cor:C.tx}}>{n}</span>
            </button>);
          })}
        </div>
      </div>

      <div style={{background:"#fff",borderRadius:14,padding:"13px 14px",border:`1px solid ${C.bd}`}}>
        <label style={LS}>Observação (opcional)</label>
        <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Algum detalhe extra…" rows={2} style={{width:"100%",marginTop:5,padding:10,borderRadius:11,border:`1.5px solid ${C.bd}`,fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",background:"#fff"}}/>
      </div>

      {errF&&<Alerta msg={errF}/>}
      <button onClick={gravar} style={{padding:16,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:17,cursor:"pointer",background:`linear-gradient(135deg,${C.vd},#059669)`,color:"#fff",boxShadow:`0 4px 18px ${C.vd}44`}}>✅ Finalizar e Pontuar!</button>
      <button onClick={()=>{setAba("ini");setOpQR(null);}} style={{background:"#f9fafb",color:C.sb,border:`1px solid ${C.bd}`,borderRadius:12,padding:12,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
    </div>);
  }
}


/* ══════════════════════ PRÊMIOS ══════════════════════ */
function Premios({meusPr,c,wts,setVoucherVer}){return(<div style={{display:"flex",flexDirection:"column",gap:11,animation:"up .3s"}}>
  <Tit em="🎁" t="Meus Prêmios" s="Todos os prêmios conquistados"/>
  {meusPr.length===0&&<Vz em="🎟️" msg="Nenhum prêmio ainda. Continue acumulando e inclua Jogos para o Relâmpago!"/>}
  {[...meusPr].filter(p=>p.status!=="rejected").reverse().map(p=>{
    const isPend = p.status === "pending";
    const isRedeemed = p.status === "redeemed";
    const isAppr = p.status === "approved";
    return(<div key={p.id} style={{background:"#fff",borderRadius:15,padding:"14px",border:`1.5px solid ${p.tipo==="relampago"?C.ou+"44":C.vd+"44"}`,display:"flex",gap:12,alignItems:"flex-start"}}>
    <div style={{width:46,height:46,borderRadius:12,flexShrink:0,background:p.tipo==="relampago"?C.ouC:C.vdC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{p.emoji||"🎟️"}</div>
    <div style={{flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:6,marginBottom:4}}>
        <div style={{fontWeight:800,fontSize:13,color:C.tx}}>{p.nome}</div>
        <span style={{background:p.tipo==="relampago"?C.ouC:C.vdC,color:p.tipo==="relampago"?C.ou2:C.vd,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>
          {isPend ? "⏳ Auditoria" : isRedeemed ? "✅ Retirado" : (p.tipo==="relampago"?"⚡ Relâmpago":"🎟️ Meta")}
        </span>
      </div>
      <div style={{fontSize:11,color:C.sb,lineHeight:1.6}}>
        {isRedeemed ? "Você já retirou este prêmio no balcão da Lotérica." : (isPend ? "Aguardando o administrador verificar os comprovantes desta etapa." : p.desc)}
      </div>
      
      {isAppr && <button onClick={()=>setVoucherVer(p)} style={{marginTop:10,width:"100%",background:C.az,color:"#fff",border:"none",borderRadius:10,padding:10,fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🎫 Abrir Cupom Digital</button>}
      
      <div style={{fontSize:10,color:C.sb,marginTop:8}}>📅 {fDT(p.data)} {isRedeemed && p.redeemedAt && `· Retirado em ${fDT(p.redeemedAt)}`}</div>
    </div>
  </div>);})}
</div>);}

/* ══════════════════════ NOTÍCIAS ══════════════════════ */
function Noticias({noticias,temPr,wts}){return(<div style={{display:"flex",flexDirection:"column",gap:11,animation:"up .3s"}}>
  <Tit em="📰" t="Notícias"/>
  {temPr&&<div style={{background:`linear-gradient(135deg,${C.rx},#5b21b6)`,borderRadius:12,padding:"11px 14px",display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:22}}>🌟</span><div><div style={{fontWeight:800,fontSize:12,color:"#fff"}}>Conteúdo exclusivo ativo</div><div style={{fontSize:10,color:"rgba(255,255,255,.7)",marginTop:1}}>Você recebe notícias especiais por ser cliente premiado!</div></div></div>}
  {noticias.map(n=>{const excl=n.tipo==="vip";return(<div key={n.id} style={{background:"#fff",borderRadius:15,overflow:"hidden",border:`1px solid ${excl?C.rx+"44":C.bd}`}}>
    <div style={{height:4,background:excl?C.rx:C.az}}/>
    <div style={{padding:"13px 14px"}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:9}}>
        <div style={{width:38,height:38,borderRadius:11,flexShrink:0,background:excl?C.rxC:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{n.emoji}</div>
        <div style={{flex:1}}><div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}><div style={{fontWeight:800,fontSize:14,color:C.tx}}>{n.titulo}</div>{excl&&<span style={{background:C.rxC,color:C.rx,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>🌟 Exclusiva</span>}</div>{n.data&&<div style={{fontSize:10,color:C.sb,marginTop:2}}>{n.data}</div>}</div>
      </div>
      <div style={{fontSize:12,color:C.sb,lineHeight:1.8,whiteSpace:"pre-line"}}>{n.corpo}</div>
    </div>
  </div>);})}
  <a href={`https://wa.me/${wts}?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre o programa Fidelizado Premiado.")}`} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"#fff",borderRadius:15,padding:"14px",fontWeight:800,fontSize:14,textDecoration:"none",textAlign:"center"}}>📲 Falar com a Lotérica</a>
</div>);}

/* ══════════════════════ CONTA ══════════════════════ */
function HistItem({a, cfg, c, clients, setCl, setVoucherVer, premios, setPr}){
  const [exp, setExp] = useState(false);
  const s = a.status || (a.valida!==false?"approved":"rejected"); // fallback legacy
  const hasRejP = (premios||[]).some(p=>p.authId===a.id && p.status==="rejected");
  const corS = (s==="rejected" || hasRejP) ? C.rd : s==="approved"?C.vd : s==="pending"?C.ou : s==="not_counted"?C.sb : C.rd;
  const labelS = (s==="rejected" || hasRejP) ? "Recusada" : s==="approved"?"Aprovada" : s==="pending"?"Aguardando Auditoria" : s==="not_counted"?"Histórico" : "Recusada";
  const d = a.detalhes || {};

  const [isEditing, setIsEditing] = useState(false);
  const [eData, setEData] = useState(a.data ? a.data.slice(0,10) : "");
  const [eSel, setESel] = useState(a.detalhes || {});
  const [eFoto, setEFoto] = useState(a.foto || null);

  function handleEFoto(e){
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=()=>setEFoto(r.result);
r.readAsDataURL(f);
  }

  function toggleSel(id){ setESel(p=>{const n={...p}; if(n[id]!==undefined) delete n[id]; else n[id]=true; return n;}); }
  function setSelVal(id, v){ setESel(p=>({...p, [id]:v})); }

  async function salvarEdicao(){
    const form = cfg.formulario||{};
    const campos = form.campos||[];
    const sels = Object.keys(eSel).filter(k=>eSel[k]!==false&&eSel[k]!=="");
    const totalP = Object.entries(eSel).reduce((s,[id,v])=>{
      const c = campos.find(f=>f.id===id);
      if(c?.cat==="bc"){return s+(parseFloat(String(v).replace(',','.'))||0);}
      return s;
    },0);
    const totalJ = Object.entries(eSel).reduce((s,[id,v])=>{
      const c = campos.find(f=>f.id===id);
      if(c?.cat==="jg"){return s+(parseFloat(String(v).replace(',','.'))||0);}
      return s;
    },0);
    const total = totalP + totalJ;
    const isV = totalP >= (cfg.minVisita||300);
    const emojis = sels.map(id=>campos.find(f=>f.id===id)?.emoji||"");
    const newStatus = isV ? "pending" : "not_counted";
    
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, '0');
    const m = String(agora.getMinutes()).padStart(2, '0');
    const s = String(agora.getSeconds()).padStart(2, '0');
    const dIso = `${eData}T${h}:${m}:${s}`;

    const newA = {...a, data: dIso, detalhes: eSel, selecionados: sels, emojis: emojis, total: total, valida: isV, foto: eFoto, status: newStatus, modificado: true, obsModificacao: "Corrigido pelo cliente"};
    const newAuths = c.auths.map(ax=>ax.id===a.id?newA:ax);
    await setCl(clients.map(x=>x.id===c.id ? {...x, auths:newAuths} : x));

    // Resetar prêmios associados para pendente se existirem
    if(premios && setPr){
       setPr(premios.map(p=>p.authId===a.id && p.status==="rejected" ? {...p, status:"pending"}:p));
    }

    setIsEditing(false);
    alert("✅ Alterações enviadas com sucesso! O registro passará por uma nova auditoria.");
  }

  if(isEditing){
     const form = cfg.formulario||{};
     const campos = (form.campos||[]).filter(f=>f.ativo);
     return (
       <div style={{background:"#fff",padding:16,borderBottom:`1px solid ${C.bd}33`,animation:"fadeUp .3s"}}>
         <div style={{fontWeight:900,fontSize:14,color:C.az,marginBottom:12}}>✏️ Corrigir Informações</div>
         
         <div style={{marginBottom:10}}>
           <label style={{fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase"}}>Controle / Registro (Não editável)</label>
           <div style={{background:C.bg,padding:"10px 12px",borderRadius:8,color:C.az,fontWeight:900,fontFamily:"monospace", border:`1px solid ${C.bd}`}}>#{a.controle}</div>
         </div>

         <div style={{marginBottom:12}}>
           <label style={{fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase"}}>Data do Cupom</label>
           <input type="date" value={eData} onChange={e=>setEData(e.target.value)} style={{width:"100%",marginTop:4,padding:"10px 12px",border:`1.5px solid ${C.bd}`,borderRadius:8,fontSize:13,fontFamily:"inherit"}}/>
         </div>

         <div style={{marginBottom:14}}>
           <label style={{fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase",display:"block",marginBottom:6}}>Valores e Serviços</label>
           <div style={{display:"flex",flexDirection:"column",gap:6}}>
             {campos.map(f=>{
                const checked = eSel[f.id]!==undefined && eSel[f.id]!==false;
                return <div key={f.id} style={{display:"flex",gap:8,alignItems:"center",background:checked?C.azC:C.bg,padding:10,borderRadius:8,border:`1px solid ${checked?C.az:C.bd}`}}>
                  <input type="checkbox" checked={checked} onChange={()=>toggleSel(f.id)} style={{width:18,height:18,accentColor:C.az}}/>
                  <span style={{fontSize:16}}>{f.emoji}</span>
                  <span style={{flex:1,fontWeight:checked?800:700,fontSize:13,color:checked?C.tx:C.sb}}>{f.nome}</span>
                  {f.comValor && checked && <input value={eSel[f.id]===true?"":eSel[f.id]} onChange={e=>setSelVal(f.id, e.target.value)} placeholder="R$ 0,00" style={{width:80,padding:"6px 8px",border:`1px solid ${C.bd}`,borderRadius:6,fontFamily:"inherit",fontSize:12,outline:"none"}}/>}
                </div>
             })}
           </div>
         </div>

         <div style={{marginBottom:16}}>
           <label style={{fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase",display:"block",marginBottom:6}}>Comprovante (Foto)</label>
           <label style={{display:"flex",alignItems:"center",justifyContent:"center",background:eFoto?C.vdC:C.bg,color:eFoto?C.vd:C.tx,padding:12,borderRadius:8,border:`1.5px dashed ${eFoto?C.vd:C.bd}`,cursor:"pointer",fontWeight:800}}>
             {eFoto?"✅ Foto Selecionada":"📸 Nova Foto do Cupom"}
             <input type="file" accept="image/*" capture="environment" onChange={handleEFoto} style={{display:"none"}}/>
           </label>
           {eFoto && <img src={eFoto} style={{width:80,height:80,objectFit:"cover",borderRadius:8,marginTop:8,border:`1px solid ${C.bd}`}} alt="preview"/>}
         </div>

         <div style={{display:"flex",gap:8}}>
           <button onClick={()=>setIsEditing(false)} style={{flex:1,background:C.bg,color:C.sb,border:`1px solid ${C.bd}`,borderRadius:10,padding:12,fontWeight:800,fontSize:13,cursor:"pointer"}}>Cancelar</button>
           <button onClick={salvarEdicao} style={{flex:2,background:C.az,color:"#fff",border:"none",borderRadius:10,padding:12,fontWeight:900,fontSize:13,cursor:"pointer",boxShadow:`0 4px 12px ${C.az}44`}}>Salvar e Reenviar</button>
         </div>
       </div>
     );
  }

  return(
    <div style={{borderBottom:`1px solid ${C.bd}11`}}>
      <div onClick={()=>setExp(!exp)} style={{padding:"12px 17px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:exp?C.bg:"#fff",borderLeft:`4px solid ${corS}`}}>
        <div style={{width:34,height:34,borderRadius:10,background:`${corS}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,border:`1px solid ${corS}33`}}>
          {s==="approved"?"✅":s==="pending"?"⏳":"❌"}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:13,color:C.tx}}>{(a.opNome||"Atendimento").split(" ")[0]} · {brl(a.total)}</div>
          <div style={{fontSize:10,color:C.sb}}>{fDT(a.data)} · <span style={{fontWeight:800,color:C.az}}>#{a.controle}</span></div>
        </div>
        <div style={{textAlign:"right"}}>
           <div style={{background:corS,color:"#fff",fontSize:8,fontWeight:900,padding:"2px 8px",borderRadius:6,textTransform:"uppercase",boxShadow:`0 2px 5px ${corS}44`}}>{labelS}</div>
           <div style={{fontSize:12,color:C.sb,marginTop:3}}>{exp?"▲":"▼"}</div>
        </div>
      </div>
      
      {exp && <div style={{padding:"10px 17px 15px 63px",background:"#fafafa",fontSize:11,color:C.sb,animation:"fadeUp .2s"}}>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
           {Object.entries(d).map(([fid, val]) => {
             const f = cfg.formulario.campos.find(x=>x.id===fid);
             if(!f || !val) return null;
             return <div key={fid} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}11`,paddingBottom:2}}>
               <span>{f.emoji} {f.nome}</span>
               <strong style={{color:C.tx}}>{f.comValor?brl(val):"Sim"}</strong>
             </div>
           })}
           {a.obs && <div style={{marginTop:5,fontStyle:"italic"}}>Obs: {a.obs}</div>}
           <div style={{marginTop:5,fontSize:9,opacity:.7, fontWeight:800}}>Controle / Registro: {a.controle}</div>
        </div>
        
        {(s === "rejected" || hasRejP) && (
           <div style={{background:C.rdC,padding:12,borderRadius:8,marginBottom:12,border:`1px solid ${C.rd}33`}}>
             <div style={{fontWeight:800,color:C.rd,marginBottom:4}}>⚠️ Atenção: {hasRejP && s==="not_counted" ? "Prêmio Recusado" : "Registro Recusado"}</div>
             <div style={{fontSize:10,color:C.rd,lineHeight:1.6}}>
               {a.data > (cfg.dataFim || "2100-01-01") 
                 ? <span>Esta visita foi registrada após o encerramento da campanha e <strong>não pôde ser validada</strong>. O prazo foi excedido.</span>
                 : <span>O administrador recusou {hasRejP && s==="not_counted" ? "o seu prêmio relâmpago" : "este registro"}: <strong>{a.obsAdmin||"Incompatibilidade das informações."}</strong> Você pode corrigir os dados (valores de jogo/bolão, foto ou data) e reenviar para nova conferência.</span>
               }
             </div>
             {a.data <= (cfg.dataFim || "2100-01-01") && (
               <button onClick={()=>setIsEditing(true)} style={{display:"inline-block",marginTop:8,background:C.rd,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontSize:10,fontWeight:800,cursor:"pointer",boxShadow:`0 2px 6px ${C.rd}55`,fontFamily:"inherit"}}>
                 ✏️ Corrigir Informações
               </button>
             )}
           </div>
        )}

        {(() => {
          const pLink = (c.premios||[]).find(p=>p.authId===a.id && p.status!=="rejected");
          if(!pLink) return null;
          return (
            <>
              {pLink.status==="approved" && (
                <button onClick={(e)=>{e.stopPropagation();setVoucherVer(pLink);}} style={{width:"100%",background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"8px",fontWeight:800,fontSize:10,cursor:"pointer",marginTop:8}}>🎫 Visualizar Cupom Digital</button>
              )}
              {pLink.status==="redeemed" && (
                <div style={{background:C.bg,padding:8,borderRadius:8,textAlign:"center",color:C.sb,fontSize:10,fontWeight:700,marginTop:8}}>✅ Prêmio Retirado</div>
              )}
            </>
          );
        })()}
      </div>}
    </div>
  );
}

function Conta({c,temPr,meusPr,tot,raspa,cfg,setCli,setTela,clients,setCl,encerrada,dFim,dIni,premios,setPr,setVoucherVer}){
  const[sub,setSub]=useState("dados");
  return(<div style={{display:"flex",flexDirection:"column",gap:12,animation:"up .3s"}}>
    <Tit em="👤" t="Minha Conta"/>
    <div style={{display:"flex",gap:5,background:"#fff",borderRadius:11,padding:4,border:`1px solid ${C.bd}`}}>{[["dados","Meus Dados"],["reg","Regulamento"]].map(s=><button key={s[0]} onClick={()=>setSub(s[0])} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:sub===s[0]?C.az:"transparent",color:sub===s[0]?"#fff":C.sb,transition:"all .2s"}}>{s[1]}</button>)}</div>
    {sub==="dados"&&<>
      <div style={{background:"#fff",borderRadius:16,overflow:"hidden",border:`1px solid ${C.bd}`}}>
        {[["👤","Nome",c.nome],["📱","WhatsApp",fmtW(c.whats)],["📧","E-mail",c.email||"—"],["📅","Membro desde",fD(c.cadastro)]].map(([em,lbl,val])=>(
          <div key={lbl} style={{padding:"12px 17px",borderBottom:`1px solid ${C.bd}22`,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22,flexShrink:0}}>{em}</span>
            <div><div style={{fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:.5}}>{lbl}</div><div style={{fontWeight:700,fontSize:14,color:C.tx,marginTop:1}}>{val}</div></div>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:16,overflow:"hidden",border:`1px solid ${C.bd}`,marginTop:12}}>
        <div style={{padding:"12px 17px",fontWeight:800,fontSize:12,color:C.tx,borderBottom:`1px solid ${C.bd}22`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>📖 Histórico Detalhado</span>
          {encerrada && <span style={{fontSize:9,background:C.rdC,color:C.rd,padding:"2px 8px",borderRadius:20,fontWeight:900}}>Campanha Encerrada</span>}
        </div>
        {((c.auths||[]).length===0) && <div style={{padding:20,textAlign:"center",color:C.sb,fontSize:12}}>Nenhuma visita registrada ainda.</div>}
        {(() => {
          const sorted = [...(c.auths||[])].sort((a,b)=>new Date(b.data)-new Date(a.data));
          const items = [];
          let dividerAdded = false;
          sorted.forEach((a, i) => {
            if (!dividerAdded && a.data < dIni) {
              items.push(<div key="divider-end" style={{padding:"10px 17px", background:C.bg, color:C.sb, fontSize:10, fontWeight:900, textAlign:"center", textTransform:"uppercase", letterSpacing:1, borderTop:`1px dashed ${C.bd}`, borderBottom:`1px dashed ${C.bd}`}}>
                🏁 Ciclo Encerrado em {fD(new Date(new Date(dIni).getTime() - 86400000))}
              </div>);
              dividerAdded = true;
            }
            items.push(<HistItem key={a.id} a={a} cfg={cfg} c={c} clients={clients} setCl={setCl} setVoucherVer={setVoucherVer} premios={premios} setPr={setPr}/>);
          });
          return items;
        })()}
      </div>
      {temPr&&<div style={{background:`linear-gradient(135deg,${C.ou},${C.ou2})`,borderRadius:15,padding:"13px 15px",display:"flex",gap:12,alignItems:"center"}}><span style={{fontSize:32}}>🏆</span><div><div style={{fontWeight:900,fontSize:14,color:C.az}}>Cliente Premiado!</div><div style={{fontSize:11,color:C.az,opacity:.8,marginTop:2}}>Notícias e ofertas exclusivas ativas.</div></div></div>}
      <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,borderRadius:16,padding:"17px"}}>
        <div style={{fontWeight:800,fontSize:11,color:"rgba(255,255,255,.55)",marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>🏆 Histórico</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center"}}>
          {[[tot,"Atendimentos","#fff"],[raspa,"Prêmios",C.ou],[(meusPr||[]).filter(p=>p.tipo==="relampago").length,"Relâmpagos","#c4b5fd"]].map(([v,l,cor])=>(
            <div key={l}><div style={{fontWeight:900,fontSize:24,color:cor,lineHeight:1}}>{v}</div><div style={{fontSize:9,color:"rgba(255,255,255,.5)",marginTop:2,textTransform:"uppercase",letterSpacing:.5}}>{l}</div></div>
          ))}
        </div>
      </div>
      <button onClick={()=>{setCli(null);setTela("boas_vindas");}} style={{background:"#fff",color:C.rd,border:`1.5px solid ${C.rd}33`,borderRadius:13,padding:13,fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Sair da conta</button>
    </>}
    {sub==="reg"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{background:"#fff",borderRadius:15,padding:12,border:`1px solid ${C.bd}`,display:"flex",gap:8}}>
        <div style={{flex:1,background:C.bg,borderRadius:10,padding:8,textAlign:"center"}}><div style={{fontSize:8,color:C.sb,textTransform:"uppercase",fontWeight:800}}>Início</div><div style={{fontWeight:900,fontSize:13,color:C.az}}>{fD(cfg.dataInicio)}</div></div>
        <div style={{flex:1,background:C.bg,borderRadius:10,padding:8,textAlign:"center"}}><div style={{fontSize:8,color:C.sb,textTransform:"uppercase",fontWeight:800}}>Término</div><div style={{fontWeight:900,fontSize:13,color:C.rd}}>{fD(cfg.dataFim)}</div></div>
      </div>
      <div style={{background:"#fff",borderRadius:13,padding:"14px",border:`1px solid ${C.bd}`,maxHeight:500,overflowY:"auto"}}>
        <pre style={{fontSize:11,color:C.tx,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"'Nunito',sans-serif"}}>
          {cfg.regulamento.replace(/{meta}/g,cfg.meta).replace(/{premioNome}/g,cfg.premioMeta.nome).replace(/{minVisita}/g,cfg.minVisita||300).replace(/{minRelampago}/g,cfg.minRelampago||60).replace(/{dataInicio}/g,fD(cfg.dataInicio)).replace(/{dataFim}/g,fD(cfg.dataFim))}
        </pre>
      </div>
    </div>}
  </div>);}

/* ══════════════════════ OVERLAY RELÂMPAGO ══════════════════════ */
function PremioOvl({relamp,setRelamp,cli,wts}){
  const msg=`🌟 *NOVO PRÊMIO RELÂMPAGO!* ⚡\n\nOlá! Acabei de ganhar: *${relamp.nome} ${relamp.emoji||""}*\n\nEstou aguardando a auditoria para receber meu Cupom Digital de retirada. 🎟️🏆\n\nLotérica Central — Cliente Premiado!`;
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20,backdropFilter:"blur(8px)"}}>
    {["⭐","✨","🎉","⚡","🌟","🎊"].map((e,i)=><div key={i} style={{position:"absolute",fontSize:22,top:`${12+i*13}%`,left:`${6+i*16}%`,animation:`pop ${.3+i*.15}s ease both`,opacity:.7}}>{e}</div>)}
    <div style={{background:"#fff",borderRadius:26,padding:"28px 22px",textAlign:"center",maxWidth:340,width:"100%",animation:"priz .5s ease",boxShadow:"0 24px 70px rgba(0,0,0,.45)"}}>
      <div style={{fontSize:72,marginBottom:8,animation:"pop .5s"}}>{relamp.emoji}</div>
      <div style={{fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:2,color:C.rx,marginBottom:8}}>⚡ Prêmio Relâmpago!</div>
      <div style={{fontWeight:900,fontSize:21,color:C.tx,lineHeight:1.2,marginBottom:10}}>{relamp.nome}</div>
      <div style={{fontSize:13,color:C.sb,lineHeight:1.7,marginBottom:22}}>{relamp.desc}</div>
      <a href={`https://wa.me/${wts}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" onClick={()=>setRelamp(null)} style={{display:"block",background:"#25D366",color:"#fff",borderRadius:13,padding:"13px 20px",fontWeight:800,fontSize:14,textDecoration:"none",marginBottom:10,boxShadow:"0 4px 14px rgba(37,211,102,.4)"}}>📲 Avisar a Lotérica pelo WhatsApp</a>
      <button onClick={()=>setRelamp(null)} style={{background:C.bg,color:C.sb,border:"none",borderRadius:11,padding:"11px 20px",fontWeight:700,fontSize:13,cursor:"pointer",width:"100%",fontFamily:"inherit"}}>Fechar</button>
    </div>
  </div>);}

/* ══════════════════════ MICRO ══════════════════════ */
function VoucherCard({p, cli, cfg, onClose}){
  const dVal = p.validade || new Date(new Date(p.data).getTime() + (cfg.validadeDias||30)*86400000).toISOString();
  const msg = `🎟️ *MEU CUPOM DIGITAL DE RETIRADA*\n\nPrêmio: *${p.nome} ${p.emoji||""}*\nCódigo: *${p.id.toUpperCase()}*\n⚠️ *Retire até: ${fD(dVal)}*\n\nLotérica Central — Cliente Premiado! 🏆`;
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function shareImg() {
    setGerando(true);
    try {
      const el = document.getElementById("cupom-certificado-cliente");
      if(!el) return;
      await new Promise(r => setTimeout(r, 400));
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 600, height: 600 });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "cupom.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: "Cupom Lotérica Central", text: msg }); }
          catch (e) { fallbackDownload(blob); }
        } else { fallbackDownload(blob); }
        setGerando(false);
      }, "image/png");
    } catch(e) { console.error(e); setGerando(false); alert("Erro ao gerar imagem."); }
  }

  function fallbackDownload(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cupom.png"; a.click(); URL.revokeObjectURL(url);
    setTimeout(() => { window.open(`https://wa.me/${cfg.wts}?text=${encodeURIComponent(msg)}`); }, 1000);
  }

  function copy() {
    navigator.clipboard.writeText(p.id.toUpperCase());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(5px)"}} onClick={onClose}>
    {/* CAPTURA (ESCONDIDO) */}
    <div style={{position:"fixed", left: "-9999px", top: 0}}>
      <div id="cupom-certificado-cliente" style={{background:"#fff", width: "600px", height: "600px", fontFamily: "'Nunito', sans-serif", textAlign: "center", display: "block", overflow: "hidden"}}>
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
    <div style={{background:"#fff",width:"100%",maxWidth:360,borderRadius:24,overflow:"hidden",boxShadow:"0 30px 60px rgba(0,0,0,.5)",animation:"pop .4s ease"}} onClick={e=>e.stopPropagation()}>
      <div style={{background:`linear-gradient(160deg,${C.az},${C.az2})`,padding:"20px 15px",position:"relative", display: "flex", alignItems:"center", gap:15, justifyContent:"center"}}>
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

      <div style={{background:C.bg,padding:12,textAlign:"center",borderTop:`1px solid ${C.bd}`}}>
        <button onClick={onClose} style={{background:"none",color:C.sb,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",width:"100%",fontFamily:"inherit"}}>Fechar Cupom</button>
      </div>
    </div>
  </div>);}

/* ══════════════════════ MICRO COMPONENTES ══════════════════════ */
function Tit({em,t,s}){return(<div style={{marginBottom:4}}><div style={{fontWeight:900,fontSize:19,color:C.tx}}>{em} {t}</div>{s&&<div style={{fontSize:11,color:C.sb,marginTop:2}}>{s}</div>}</div>);}
function Vz({em,msg}){return(<div style={{padding:"26px 20px",textAlign:"center",color:C.sb}}><div style={{fontSize:40,marginBottom:8,opacity:.4}}>{em}</div><div style={{fontSize:12,lineHeight:1.7}}>{msg}</div></div>);}
function Alerta({msg}){return(<div style={{background:C.rdC,color:C.rd,padding:12,borderRadius:11,fontSize:12,fontWeight:700,textAlign:"center",border:`1px solid ${C.rd}33`}}>{msg}</div>);}
function Cp({label,value,onChange,placeholder,type="text",sub,ativo}){return(<div style={{marginBottom:12}}><label style={{fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:.5}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:12,marginTop:5,borderRadius:11,border:`2px solid ${ativo?C.az:C.bd}`,background:ativo?C.azC:"#fff",fontSize:14,fontFamily:"inherit",outline:"none",color:C.tx}}/>{sub&&<div style={{fontSize:10,color:C.sb,marginTop:4}}>{sub}</div>}</div>);}
function Sp({label}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><span>{label}</span></div>);}
