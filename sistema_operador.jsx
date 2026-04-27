import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DB } from "./firebase.js";

/* ═══════ CONFIG PADRÃO ═══════ */
const DCFG = {
  meta: 15,
  minVisita: 300,
  minRelampago: 60,
  premioMeta: { nome:"Raspadinha CAIXA", emoji:"🎟️", desc:"Você completou {meta} visitas e ganhou {premioNome}! Retire no balcão." },
  relampagos: [
    { id:"r1",ativo:true, emoji:"🎟️",nome:"Raspadinha Bônus", prob:8,  desc:"Raspadinha extra! Retire no balcão hoje." },
    { id:"r2",ativo:true, emoji:"🏷️",nome:"Cupom Desconto",   prob:15, desc:"10% de desconto na próxima Raspadinha. Válido 7 dias." },
    { id:"r3",ativo:true, emoji:"🎁",        nome:"Brinde Surpresa", prob:10, desc:"Brinde especial esperando por você no balcão." },
    { id:"r4",ativo:true, emoji:"⚡",            nome:"Dobro de Pontos",prob:12, desc:"Esta visita vale 2 autenticações! Parabéns." },
    { id:"r5",ativo:false,emoji:"🌟",         nome:"Sorteio do Mês", prob:5,  desc:"Você entrou no Sorteio do Mês! Resultado dia 01." },
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
• VIGÊNCIA: Campanha válida de {dataInicio} a {dataFim}. Visitas fora deste prazo ou registradas após 7 dias não serão validados.`,
  appUrl:"", wts:"5575999990000",
  noticias: [
    { id:"ng1", tipo:"geral",   ativo:true,  emoji:"🎰", titulo:"Mega-Sena Acumulada!",             corpo:"Prêmio estimado em R$ 120 milhões! Aposte agora na lotérica.",                                         data:"2026-04-15" },
    { id:"ng2", tipo:"geral",   ativo:true,  emoji:"🕐", titulo:"Horário de Funcionamento",          corpo:"Seg–Sex: 09h às 17h\nSábado: 09h às 13h\nDomingo e Feriados: Fechado",                                data:"2026-04-01" },
    { id:"nv1", tipo:"vip",     ativo:true,  emoji:"🌟", titulo:"Sorteio VIP — Exclusivo Premiados", corpo:"Você foi selecionado para o Sorteio VIP de Maio! Prêmio: R$ 500 em Raspadinhas. Resultado dia 31/05.", data:"" },
    { id:"nv2", tipo:"vip",     ativo:true,  emoji:"🎁", titulo:"Bônus para clientes premiados",     corpo:"Mencione que é premiado na próxima visita e ganhe desconto em Bolões. Válido até 30/04.",              data:"" },
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
const now=()=>new Date().toISOString();
const fD=d=>new Date(d + (d?.includes("T") ? "" : "T12:00:00")).toLocaleDateString("pt-BR");
const fDT=d=>new Date(d).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const mAno=d=>{
  if(!d || d === "2000-01-01") return "Início";
  const dt = new Date(d + (d.includes("T") ? "" : "T12:00:00"));
  return `${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
};
const brl=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtDN = v=>{if(!v)return"—";if(v.length!==8)return v;return`${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`;};
const hoje=()=>new Date().toISOString().slice(0,10);

/* ═══════ CSS ═══════ */
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{background:#f0f4fb;font-family:'Nunito',sans-serif;}
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

/* ═══════ APP ROOT ═══════ */
export default function App(){
  const[tela,setTela]=useState("splash");
  const[role,setRole]=useState(null);
  const[opSel,setOpSel]=useState(null);
  const[ops,setOps_]=useState([]);
  const[cl,setCl_]=useState([]);
  const[pr,setPr_]=useState([]);
  const[cfg,setCfg_]=useState(DCFG);
  const[opPrizes,setOpPrizes_]=useState([]);
  const setOps=d=>{setOps_(d); return DB.save("lc-ops",d);};
  const setCl=d=>{setCl_(d); return DB.save("lc-cl",d);};
  const setPr=d=>{setPr_(d); return DB.save("lc-pr",d);};
  const setCfg=d=>{setCfg_(d); return DB.save("lc-cfg",d);};
  const setOpPrizes=d=>{setOpPrizes_(d); return DB.save("lc-op-prizes",d);};
  useEffect(()=>{(async()=>{
    try{const[o,c,p,f,opp]=await Promise.all([DB.load("lc-ops"),DB.load("lc-cl"),DB.load("lc-pr"),DB.load("lc-cfg"),DB.load("lc-op-prizes")]);
      if(Array.isArray(o))setOps_(o);if(Array.isArray(c))setCl_(c);if(Array.isArray(p))setPr_(p);if(Array.isArray(opp))setOpPrizes_(opp);
      if(f)setCfg_({...DCFG,...f,relampagos:f.relampagos||DCFG.relampagos,premioMeta:f.premioMeta||DCFG.premioMeta,noticias:f.noticias||DCFG.noticias,formulario:{...DCFG.formulario,...(f.formulario||{}),cats:f.formulario?.cats||DCFG.formulario.cats,campos:f.formulario?.campos||DCFG.formulario.campos}});}catch(_){}
    setTimeout(()=>setTela("home"),1400);

    DB.listen?.("lc-ops", val => { if(Array.isArray(val)) setOps_(val); });
    DB.listen?.("lc-cl", val => { if(Array.isArray(val)) setCl_(val); });
    DB.listen?.("lc-pr", val => { if(Array.isArray(val)) setPr_(val); });
    DB.listen?.("lc-op-prizes", val => { if(Array.isArray(val)) setOpPrizes_(val); });
    DB.listen?.("lc-cfg", val => { if(val) setCfg_(prev => ({...DCFG,...prev,...val})); });
  })();},[]);
  const ctx={tela,setTela,role,setRole,opSel,setOpSel,ops,setOps,cl,setCl,pr,setPr,cfg,setCfg,opPrizes,setOpPrizes};
  return(<><style>{CSS}</style>
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",maxWidth:520,margin:"0 auto",fontSize:13,color:C.tx}}>
      {tela==="splash"&&<Splash/>}{tela==="home"&&<Home{...ctx}/>}{tela==="opreg"&&<OpReg{...ctx}/>}
      {tela==="op"&&<OpPanel{...ctx}/>}{tela==="admin"&&<AdminPanel{...ctx}/>}
    </div>
  </>);
}

function Splash(){return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},${C.az2})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:C.ou,opacity:.07}}/>
  <div style={{fontSize:68,animation:"pop .5s",filter:"drop-shadow(0 6px 18px rgba(245,168,0,.5))",zIndex:1}}>🏆</div>
  <div style={{textAlign:"center",zIndex:1}}><div style={{fontWeight:900,fontSize:26,color:"#fff"}}>Lotérica Central</div><div style={{fontWeight:700,fontSize:11,color:C.ou,marginTop:6,letterSpacing:3,textTransform:"uppercase"}}>Sistema de Gestão</div></div>
</div>);}

function Home({ops,cl,setRole,setOpSel,setTela}){
  const[senha,setSenha]=useState("");const[showS,setShowS]=useState(false);const[erroS,setErroS]=useState("");const[showOps,setShowOps]=useState(false);
  const[opLogin,setOpLogin]=useState(null);const[senhaOp,setSenhaOp]=useState("");const[erroOp,setErroOp]=useState("");
  const[vis,setVis]=useState({adm:false,op:false});
  const totalAuths=cl.reduce((s,c)=>s+(c.auths?.length||0),0);
  function entrarAdmin(){if(senha==="central2026"){setRole("admin");setTela("admin");}else setErroS("Senha incorreta.");}
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
      <div style={{fontSize:52,animation:"pop .5s",marginBottom:10}}>🏆</div>
      <div style={{fontWeight:900,fontSize:22,color:"#fff"}}>Lotérica Central</div>
      <div style={{fontSize:10,color:C.ou,fontWeight:700,marginTop:5,letterSpacing:3,textTransform:"uppercase"}}>Sistema de Gestão</div>
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
          {opLogin && <div style={{padding:"11px 15px",background:C.azC,borderTop:`1px solid ${C.bd}`}}>
            <div style={{fontSize:11,fontWeight:800,color:C.az,marginBottom:8}}>SENHA DE {opLogin.nome.toUpperCase()}</div>
            <div style={{display:"flex",gap:7,position:"relative"}}>
              <input value={senhaOp} onChange={e=>setSenhaOp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrarOp()} type={vis.op?"text":"password"} placeholder="Senha..." autoFocus style={{flex:1,...I,paddingRight:42}}/>
              <button onClick={()=>setVis({...vis,op:!vis.op})} style={{position:"absolute",right:105,top:"50%",transform:"translateY(-50%)",background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"2px 5px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.op?"Ocultar":"Ver"}</button>
              <button onClick={entrarOp} style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>ENTRAR</button>
            </div>
            {erroOp && <div style={{marginTop:7,fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {erroOp}</div>}
          </div>}
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
        {showS&&<div style={{padding:"11px 15px",borderTop:`1px solid ${C.bd}`}}>
          <div style={{display:"flex",gap:7,marginBottom:erroS?7:0,position:"relative"}}>
            <input value={senha} onChange={e=>{setSenha(e.target.value);setErroS("");}} onKeyDown={e=>e.key==="Enter"&&entrarAdmin()} type={vis.adm?"text":"password"} placeholder="Senha admin…" style={{flex:1,...I,paddingRight:42}}/>
            <button onClick={()=>setVis({...vis,adm:!vis.adm})} style={{position:"absolute",right:65,top:"50%",transform:"translateY(-50%)",background:C.bg,border:`1px solid ${C.bd}`,borderRadius:6,padding:"2px 5px",fontSize:9,fontWeight:800,cursor:"pointer",color:C.sb}}>{vis.adm?"Ocultar":"Ver"}</button>
            <button onClick={entrarAdmin} style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
          </div>
          {erroS&&<div style={{fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {erroS}</div>}
        </div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[["🏅",ops.length,"Operadoras"],["👥",cl.length,"Clientes"],["✅",totalAuths,"Auths"]].map(([em,v,l])=>(
          <div key={l} style={{background:"#fff",borderRadius:12,padding:"11px 8px",textAlign:"center",border:`1px solid ${C.bd}`}}>
            <div style={{fontSize:16}}>{em}</div><div style={{fontWeight:900,fontSize:20,color:C.az}}>{v}</div>
            <div style={{fontSize:9,color:C.sb,textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

function OpReg({ops,setOps,setOpSel,setRole,setTela}){
  const[nome,setNome]=useState("");const[senha,setSenha]=useState("1234");const[erro,setErro]=useState("");const[nova,setNova]=useState(null);const[v,setV]=useState(false);
  function cad(){const n=(nome||"").trim();const s=(senha||"").trim();if(!n){setErro("Informe o nome.");return;}if(!s){setErro("Defina uma senha.");return;}if(ops.some(o=>o.nome.toLowerCase()===n.toLowerCase())){setErro("Nome já cadastrado.");return;}const op={id:uidOp(ops),nome:n,senha:s,cadastro:now()};setOps([...ops,op]);setNova(op);setNome("");setSenha("");setErro("");}
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

function OpPanel({opSel,setOpSel,ops,setOps,cl,pr,setPr,cfg,setTela,setRole}){
  const[aba,setAba]=useState("qr");const[showAlt,setShowAlt]=useState(false);const[altS,setAltS]=useState({a:"",n:"",c:""});const[msgS,setMsgS]=useState("");const[vis,setVis]=useState({a:false,n:false,c:false});
  const ABAS=[{id:"qr",emoji:"📲",label:"Código"},{id:"auths",emoji:"✅",label:"Auths"},{id:"clnts",emoji:"👥",label:"Clientes"},{id:"voucher",emoji:"🎟️",label:"Voucher"},{id:"rank",emoji:"🏅",label:"Rank"}];
  const op = ops.find(o => o.id === opSel?.id) || opSel;
  const idx = Math.max(0, ops.findIndex(o => o.id === op?.id));
  const lastReset = cfg.lastReset || "2000-01-01";
  const minhas = useMemo(() => {
    let all = [];
    cl.forEach(c => {
      (c.auths || []).forEach(a => {
        if (a.opId === op?.id) all.push({ ...a, cn: c.nome, cid: c.id });
      });
    });
    return all.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [cl, op]);

  const hoje_ = useMemo(() => minhas.filter(a => a.data?.slice(0, 10) === hoje() && a.valida !== false), [minhas]);
  const meusCl = cl.filter(c => (c.auths || []).some(a => a.opId === op.id));
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
  const pos = rank.findIndex(r => r.op.id === op.id) + 1;
  const isDefault = !op.senha || String(op.senha) === "1234";

  function mudarS(){if(altS.n.length<4){setMsgS("❌ Mínimo 4 caracteres.");return;}if(altS.n!==altS.c){setMsgS("❌ Senhas não conferem.");return;}if(!isDefault && String(altS.a)!==String(op.senha)){setMsgS("❌ Senha atual incorreta.");return;}setOps(ops.map(o=>o.id===op.id?{...o,senha:altS.n}:o));setMsgS("✅ Senha alterada!");setTimeout(()=>{setShowAlt(false);setMsgS("");setAltS({a:"",n:"",c:""});},2000);}

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
      <div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>{op.nome} <span style={{fontSize:9,opacity:.5,fontWeight:400}}>v1.2</span></div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:1}}>Operador de Caixa · {fD(op.cadastro)}</div>
      <div style={{display:"flex",gap:7,marginTop:13}}>
        {[["✅",minhas.length,"Total"],["📅",hoje_.length,"Hoje"],["👥",meusCl.length,"Clientes"],[`${pos}º`,"","Ranking"]].map(([v,,l],ki)=>(
          <div key={l+ki} style={{flex:1,background:"rgba(255,255,255,.12)",borderRadius:9,padding:"7px 4px",textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
            <div style={{fontWeight:900,fontSize:16,color:"#fff",lineHeight:1}}>{v}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.55)",textTransform:"uppercase",letterSpacing:.4,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{flex:1,padding:"13px 13px 76px",animation:"up .3s"}}>
      {aba==="qr"   &&<OpQR    op={op} cfg={cfg} minhas={minhas} hoje_={hoje_} ops={ops}/>}
      {aba==="auths"&&<OpAuths minhas={minhas} hoje_={hoje_}/>}
      {aba==="clnts"&&<OpCl    meusCl={meusCl} cfg={cfg}/>}
      {aba==="voucher"&&<OpVoucher pr={pr} setPr={setPr} cl={cl} op={op} cfg={cfg}/>}
      {aba==="rank" && <OpRank rank={rank} op={op} pos={pos}/>}
      {aba==="reg"  && <OpRegulamento cfg={cfg}/>}
    </div>
    <Nav abas={ABAS} aba={aba} setAba={setAba} cor={oc(idx)}/>
  </div>);
}

function OpQR({op,cfg,minhas,hoje_}){
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {[["📅",hoje_.length,"Auths Hoje",C.az],["✅",minhas.length,"Total Auths",C.vd]].map(([em,v,l,cor])=>(
        <div key={l} style={{background:"#fff",borderRadius:12,padding:"13px",textAlign:"center",border:`1px solid ${C.bd}`}}>
          <div style={{fontSize:20,marginBottom:4}}>{em}</div><div style={{fontWeight:900,fontSize:26,color:cor}}>{v}</div>
          <div style={{fontSize:10,color:C.sb,fontWeight:700}}>{l}</div>
        </div>
      ))}
    </div>
    {hoje_.length>0&&<div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bd}`,fontWeight:800,fontSize:12,color:C.tx}}>📋 Auths de Hoje ({hoje_.length})</div>
      {hoje_.slice(0,5).map((a,i)=><div key={a.id} style={{padding:"9px 13px",borderBottom:i<4?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:30,height:30,borderRadius:8,background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🏪</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{a.cn}</div><div style={{fontSize:10,color:C.sb}}>{fDT(a.data)}{a.total>0?` · ${brl(a.total)}`:""}</div></div>
      </div>)}
    </div>}
  </div>);
}

function OpAuths({minhas,hoje_}){
  const[f,setF]=useState("all");const lista=f==="hj"?hoje_:minhas;
  const gr=useMemo(()=>{const m={};minhas.forEach(a=>{const k=mAno(a.data);if(!m[k])m[k]={mes:k,auths:0};m[k].auths++;});return Object.values(m).sort((a,b)=>a.mes.localeCompare(b.mes)).slice(-6);},[minhas]);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="✅" t="Minhas Autenticações"/>
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
    <div style={{display:"flex",gap:7}}>{[["all","Todas",minhas.length],["hj","Hoje",hoje_.length]].map(([v,l,n])=>(
      <button key={v} onClick={()=>setF(v)} style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${f===v?C.az:C.bd}`,background:f===v?C.az:"#fff",color:f===v?"#fff":C.sb,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{l} ({n})</button>
    ))}</div>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {lista.length===0&&<V em="✅" msg="Nenhuma autenticação neste período."/>}
      {lista.map((a,i)=>{const v=a.valida!==false;return(<div key={a.id} style={{padding:"10px 13px",borderBottom:i<lista.length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:v?C.azC:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{v?"✅":"⏳"}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:v?C.tx:C.sb}}>{a.cn} · {v?"Ponto":"Histórico"}</div><div style={{fontSize:10,color:C.sb}}>{fDT(a.data)}{a.total>0?` · ${brl(a.total)}`:""}</div></div>
      </div>);})}
    </div>
  </div>);
}

function OpCl({meusCl,cfg}){return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
  <T em="👥" t="Meus Clientes" s={`${meusCl.length} atendidos`}/>
  <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
    {meusCl.length===0&&<V em="👥" msg="Ainda nenhum cliente atendido."/>}
    {meusCl.map((c,i)=>{
      const vs=c.auths?.filter(a=>a.valida!==false)||[];
      const prog=vs.length%cfg.meta;const ganhou=vs.length>0&&vs.length%cfg.meta===0;
      return(<div key={c.id} style={{padding:"10px 13px",borderBottom:i<meusCl.length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:34,height:34,borderRadius:"50%",background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:C.az,flexShrink:0}}>{c.nome?.[0]?.toUpperCase()||"?"}</div>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{c.nome}</div><div style={{fontSize:10,color:C.sb}}>{vs.length} pts / {c.auths?.length||0} total</div></div>
      {ganhou&&<span style={{background:C.vdC,color:C.vd,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>{cfg.premioMeta.emoji} Pronto!</span>}
      {!ganhou&&prog>=cfg.meta-3&&prog>0&&<span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>Faltam {cfg.meta-prog}</span>}
    </div>);})}</div>
</div>);}

function OpVoucher({pr, setPr, cl, op, cfg}){
  const [cod, setCod] = useState("");
  const [res, setRes] = useState(null);
  
  function buscar(){
    const v = pr.find(p=>p.id.toUpperCase()===cod.toUpperCase().trim());
    if(!v){ setRes({erro:"Voucher não encontrado."}); return; }
    const c = cl.find(x=>x.id===v.clientId);
    setRes({pr: v, c: c});
  }

  function validar(p){
    if(!window.confirm("Confirmar a retirada deste prêmio no balcão?")) return;
    setPr(pr.map(x=>x.id===p.id?{...x, status:"redeemed", redeemedAt:new Date().toISOString(), opRedeemed:op.nome}:x));
    setRes({...res, pr:{...p, status:"redeemed"}});
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

        {res.pr.status === "approved" && (
           <button onClick={()=>validar(res.pr)} style={{width:"100%",background:C.vd,color:"#fff",border:"none",borderRadius:12,padding:14,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.vd}44`}}>✅ Registrar Retirada no Balcão</button>
        )}
        {res.pr.status === "redeemed" && (
           <div style={{background:C.vdC,color:C.vd,padding:14,borderRadius:12,fontWeight:800,textAlign:"center",border:`1px solid ${C.vd}44`}}>
             ✅ Prêmio já retirado em {fDT(res.pr.redeemedAt||res.pr.data)}
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
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="🏅" t="Ranking de Operadores" s="Competição mensal"/>
    <div style={{background:C.az,borderRadius:18,padding:22,textAlign:"center",color:"#fff",boxShadow:`0 8px 25px ${C.az}44`,marginBottom:10,animation:"pop .5s"}}>
      <div style={{fontSize:11,textTransform:"uppercase",fontWeight:800,letterSpacing:2,opacity:.7,marginBottom:6}}>Sua Posição</div>
      <div style={{fontSize:52,fontWeight:900,lineHeight:1}}>#{pos}</div>
      <div style={{fontSize:12,fontWeight:700,marginTop:10,background:"rgba(255,255,255,.15)",padding:"5px 12px",borderRadius:20,display:"inline-block"}}>Você está no top {Math.round((pos/rank.length)*100)}%</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rank.map((r,i)=><div key={r.op.id} style={{background:r.op.id===op.id?C.azC:"#fff",borderRadius:13,padding:"13px 15px",display:"flex",alignItems:"center",gap:12,border:`1.5px solid ${r.op.id===op.id?C.az:C.bd+"66"}`,animation:`up .4s ${i*0.05}s both`}}>
        <div style={{width:28,height:28,borderRadius:8,background:i===0?C.ou:i===1?"#cbd5e1":i===2?"#d97706":C.bg,color:i<3?"#fff":C.sb,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14}}>{i+1}</div>
        <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.tx}}>{r.op.nome}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:C.az}}>{r.t}</div><div style={{fontSize:9,color:C.sb,fontWeight:700,textTransform:"uppercase"}}>Pontos</div></div>
      </div>)}
    </div>
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

/* ═══════ ADMIN PANEL ═══════ */
function AdminPanel({ops,setOps,cl,setCl,pr,setPr,cfg,setCfg,setTela,setRole,opPrizes,setOpPrizes}){
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
  const pendsG = useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.filter(a=>a.status==="pending").length||0),0),[cl]);
  const ABAS=[{id:"dash",emoji:"📊",label:"Painel"},{id:"ops",emoji:"🏅",label:"Operadoras"},{id:"cl",emoji:"👥",label:"Clientes",badge:pendsG},{id:"pr",emoji:"🎁",label:"Prêmios"},{id:"cfg",emoji:"⚙️",label:"Ajustes"}];
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
    <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,padding:"18px 18px 22px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:170,height:170,borderRadius:"50%",background:C.ou,opacity:.07}}/>
      <button onClick={()=>{setRole(null);setTela("home");}} style={BV}>← Sair</button>
      <div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>🔒 Administrador</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.55)"}}>Visão completa da lotérica</div>
      <div style={{display:"flex",gap:7,marginTop:13}}>
        {[["👥",cl.length,"Clientes"],["✅",totPoints,"Pontos"],["🏪",totA,"Visitas"],["🎁",pr.length,"Prêmios"]].map(([em,v,l])=>(
          <div key={l} style={{flex:1,background:"rgba(255,255,255,.1)",borderRadius:9,padding:"7px 4px",textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
            <div style={{fontSize:13}}>{em}</div><div style={{fontWeight:900,fontSize:16,color:"#fff",lineHeight:1}}>{v}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.4,marginTop:1}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{flex:1,padding:"13px 13px 76px",animation:"up .3s"}}>
      {aba==="dash"&&<ADash ops={ops} cl={cl} pr={pr} cfg={cfg} setAba={setAba} setBus={setBus}/>}
      {aba==="ops" &&<AOps  ops={ops} setOps={setOps} cl={cl} cfg={cfg} setCfg={setCfg} opPrizes={opPrizes} setOpPrizes={setOpPrizes}/>}
      {aba==="cl"  &&<ACl   cl={cl} setCl={setCl} ops={ops} cfg={cfg} pr={pr} setPr={setPr} bus={bus} setBus={setBus}/>}
      {aba==="pr"  &&<APr   pr={pr} setPr={setPr} cl={cl} cfg={cfg}/>}
      {aba==="cfg" &&<ACfg  cfg={cfg} setCfg={setCfg} ops={ops} setOps={setOps} cl={cl} pr={pr}/>}
    </div>
    <Nav abas={ABAS} aba={aba} setAba={setAba} cor={C.az}/>
  </div>);
}

function ADash({ops,cl,pr,cfg,setAba,setBus}){
  const totA=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.length||0),0),[cl]);
  const totP=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.filter(a=>a.valida!==false).length||0),0),[cl]);
  const prontos=useMemo(() => {
    return cl.filter(c => 
      pr.some(p => p.clientId === c.id && p.tipo === "raspadinha" && p.status === "pending")
    );
  }, [cl, pr]);
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
    {pr.filter(p=>p.tipo==="relampago" && p.status==="pending").length > 0 && (
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
      {[["👥","Clientes",cl.length,C.az],[cfg.premioMeta.emoji,"Prêmios",pr.length,C.ou2],["✅","Pontos",totP,C.vd],["🏪","Visitas",totA,C.rx]].map(([em,t,v,cor])=>(
        <div key={t} style={{background:"#fff",borderRadius:12,padding:"12px",border:`1px solid ${C.bd}`}}>
          <div style={{fontSize:20,marginBottom:4}}>{em}</div><div style={{fontWeight:900,fontSize:24,color:cor,lineHeight:1}}>{v}</div>
          <div style={{fontWeight:800,fontSize:10,color:C.tx,marginTop:2}}>{t}</div>
        </div>
      ))}
    </div>
    {gr.length>0&&<div style={{background:"#fff",borderRadius:13,padding:"12px 11px",border:`1px solid ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:12,color:C.tx,marginBottom:10}}>📈 Auths por Mês</div>
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

function AOps({ops,setOps,cl,cfg,setCfg,opPrizes,setOpPrizes}){
  const[eId,setEId]=useState(null);const[eN,setEN]=useState("");
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
        <button onClick={encerrarCiclo} style={{background:C.ou,color:C.az,border:"none",borderRadius:9,padding:"8px 14px",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🏆 Encerrar Ciclo</button>
      </div>
    )}

    {rank.map((r,i)=><div key={r.op.id} style={{background:"#fff",borderRadius:13,padding:"13px",border:i<2?`2px solid ${C.ou}55`:`1px solid ${C.bd}`}}>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:oc(r.i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#fff",flexShrink:0}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
        <div style={{flex:1}}>
          {eId===r.op.id?<div style={{display:"flex",gap:5}}><input value={eN} onChange={e=>setEN(e.target.value)} style={{flex:1,...I,padding:"5px 9px",fontSize:12}}/><button onClick={()=>{setOps(ops.map(o=>o.id===r.op.id?{...o,nome:eN}:o));setEId(null);}} style={{background:C.vd,color:"#fff",border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓</button><button onClick={()=>setEId(null)} style={{background:"#f3f4f6",color:C.sb,border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button></div>
          :<div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{fontWeight:800,fontSize:14,color:C.tx}}>{r.op.nome}</div>{i<2&&<span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>🏆 Dia 05</span>}<div style={{marginLeft:"auto",display:"flex",gap:10}}><div style={{fontSize:11,fontFamily:"monospace",fontWeight:800,color:C.az,background:C.azC,padding:"2px 6px",borderRadius:6,border:`1px solid ${C.bd}`}} title="Senha atual">{r.op.senha||"1234"}</div><button onClick={()=>{if(window.confirm(`Resetar senha de ${r.op.nome} para 1234?`)) setOps(ops.map(o=>o.id===r.op.id?{...o,senha:"1234"}:o));}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer"}} title="Resetar para 1234">🔄</button><button onClick={()=>{setEId(r.op.id);setEN(r.op.nome);}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer"}}>✏️</button><button onClick={()=>{if(window.confirm(`Remover operadora ${r.op.nome}?`)) setOps(ops.filter(o=>o.id!==r.op.id));}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer"}}>🗑️</button></div></div>}
          <div style={{fontSize:10,color:C.sb,marginTop:2}}>Desde {fD(r.op.cadastro)}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["✅","Auths",r.a,C.az],["👥","Clientes",r.cs,C.vd]].map(([em,l,v,cor])=><div key={l} style={{background:C.bg,borderRadius:9,padding:"8px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:cor}}>{v}</div><div style={{fontSize:9,color:C.sb,textTransform:"uppercase",letterSpacing:.5}}>{em} {l}</div></div>)}</div>
      <div style={{marginTop:8,background:"#f3f4f6",borderRadius:6,height:5,overflow:"hidden"}}><div style={{height:"100%",background:oc(r.i),borderRadius:6,width:(r.a/Math.max(rank[0]?.a||1,1)*100)+"%"}}/></div>
    </div>)}
    {ops.length===0&&<V em="👤" msg="Nenhuma operadora cadastrada."/>}

    {opPrizes && opPrizes.length > 0 && (
      <div style={{marginTop:20}}>
        <T em="🎁" t="Histórico de Prêmios" s="Controle de pagamentos das operadoras"/>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:10}}>
          {opPrizes.map(p => (
            <div key={p.id} style={{background:"#fff",borderRadius:13,padding:14,border:`1px solid ${p.status==="paid"?C.vd+"33":C.bd}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontWeight:800,fontSize:13,color:C.tx}}>Ciclo {p.periodo}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{background:p.status==="paid"?C.vdC:C.ouC,color:p.status==="paid"?C.vd:C.ou2,fontSize:9,fontWeight:900,padding:"2px 8px",borderRadius:20}}>{p.status==="paid"?"✅ PAGO":"⏳ PENDENTE"}</div>
                  <button onClick={()=>{if(window.confirm("Remover este registro do histórico?")) setOpPrizes(opPrizes.filter(x=>x.id!==p.id));}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:.6}}>🗑️</button>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {p.vencedores.map(v => (
                  <div key={v.opId} style={{display:"flex",justifyContent:"space-between",fontSize:12,alignItems:"center",background:C.bg,padding:"6px 10px",borderRadius:8}}>
                    <span style={{fontWeight:700}}>{v.rank}º {v.opNome}</span>
                    <span style={{fontWeight:800,color:C.az}}>{v.auths} auths</span>
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
        </div>
      </div>
    )}
  </div>);
}

function AAud({a,c,corS,labelS,opN,brl,fDT,cfg,setCl,cl,pr,setPr,setVoucherVer}){
  const [expA, setExpA] = useState(false);
  const s = a.status || (a.valida?"approved":"rejected");
  const updateStatus = (newS) => {
    if(newS==="rejected" && !window.confirm("Recusar este registro?")) return;
    const newAuths = c.auths.map(x=>x.id===a.id?{...x, status:newS, obsAdmin:newS==="rejected"?"Recusado":""}:x);
    setCl(cl.map(x=>x.id===c.id?{...x, auths:newAuths}:x));
    setPr(pr.map(p=>p.authId===a.id?{...p, status:newS==="approved"?"approved":"pending"}:p));
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
  return(
    <div style={{background:"#fff",borderRadius:10,border:`1px solid ${expA?C.az:C.bd+"66"}`,overflow:"hidden"}}>
      <div onClick={()=>setExpA(!expA)} style={{padding:10,display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:expA?C.azC:"#fff"}}>
        <div style={{width:24,height:24,borderRadius:6,background:`${corS}15`,color:corS,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{s==="approved"?"✅":s==="pending"?"⏳":"❌"}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:800,color:C.tx}}>{fDT(a.data)} <span style={{fontWeight:400,color:C.sb}}>por {opN(a.opId)}</span></div>
          <div style={{fontSize:10,color:C.sb}}>{brl(a.total)} · {labelS}</div>
        </div>
        <div style={{fontSize:12,color:C.sb}}>{expA?"▲":"▼"}</div>
      </div>
      {expA && <div style={{padding:12,borderTop:`1px solid ${C.bd}33`,background:"#fafafa"}}>
         <div style={{fontSize:11,display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
            {Object.entries(a.detalhes||{}).map(([fid, val]) => {
              const f = cfg.formulario.campos.find(x=>x.id===fid);
              if(!f || !val) return null;
              return <div key={fid} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}11`,paddingBottom:2}}>
                <span>{f.emoji} {f.nome}</span>
                <strong style={{color:C.tx}}>{f.comValor?brl(val):"Sim"}</strong>
              </div>
            })}
         </div>
         {a.foto ? <img src={a.foto} style={{width:"100%",borderRadius:8,marginBottom:12,cursor:"pointer"}} onClick={()=>window.open(a.foto)} alt="comprovante"/> : <div style={{marginBottom:12,padding:12,border:`1px dashed ${C.bd}`,textAlign:"center",fontSize:10,color:C.sb}}>⚠️ Sem comprovante</div>}
         {pr.filter(px=>px.authId===a.id).map(px=>(
            <div key={px.id} style={{marginBottom:12,padding:10,background:px.status==="pending"?C.ouC:C.vdC,borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20}}>{px.emoji||"🎁"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:800}}>{px.nome}</div>
                <div style={{display:"flex",gap:5,marginTop:5}}>
                  {px.status!=="pending" && <button onClick={()=>setVoucherVer(px)} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 10px",fontSize:10,fontWeight:800,cursor:"pointer"}}>🎫 Ver Cupom</button>}
                  {px.status!=="pending" && c.whats && <a href={`https://wa.me/55${c.whats}?text=${encodeURIComponent(`🎉 *CUPOM DE RETIRADA*\n\nParabéns, ${c.nome?.split(" ")[0]}!\n\nVocê ganhou: *${px.nome} ${px.emoji||""}*\n\nSeu código: *${px.id.toUpperCase()}*\n\nApresente na Lotérica Central! 🏆`)}`} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",borderRadius:8,padding:"6px 10px",fontSize:10,fontWeight:700,textDecoration:"none"}}>📲 WhatsApp c/ Texto</a>}
                </div>
              </div>
            </div>
         ))}
         <div style={{display:"flex",gap:6}}>
            {s==="pending" && <button onClick={()=>updateStatus("approved")} style={{flex:1,background:C.vd,color:"#fff",border:"none",borderRadius:8,padding:8,fontSize:10,fontWeight:800,cursor:"pointer"}}>Aprovar</button>}
            {s==="pending" && <button onClick={()=>updateStatus("rejected")} style={{flex:1,background:C.rd,color:"#fff",border:"none",borderRadius:8,padding:8,fontSize:10,fontWeight:800,cursor:"pointer"}}>Recusar</button>}
         </div>
      </div>}
    </div>
  );
}

function ACl({cl,setCl,ops,cfg,pr,setPr,bus,setBus}){
  const[exp,setExp]=useState(null);
  const[voucherVer,setVoucherVer]=useState(null);
  const opN=id=>ops.find(o=>o.id===id)?.nome||"—";
  const lista=useMemo(()=>{const q=bus.toLowerCase().trim();return cl.filter(c=>!q||c.nome?.toLowerCase().includes(q)||c.whats?.includes(q)).sort((a,b)=>(b.auths?.length||0)-(a.auths?.length||0));},[cl,bus]);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="👥" t="Todos os Clientes" s={`${cl.length} cadastrados`}/>
    <input value={bus} onChange={e=>setBus(e.target.value)} placeholder="🔍 Buscar por nome ou WhatsApp…" style={{...I}}/>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {lista.length===0&&<V em="👥" msg="Nenhum cliente encontrado."/>}
      {lista.map(c=>(<div key={c.id} style={{borderBottom:`1px solid ${C.bd}22`}}>
        <div onClick={()=>setExp(exp===c.id?null:c.id)} style={{padding:12,display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:exp===c.id?C.bg:"#fff"}}>
          <div style={{width:34,height:34,borderRadius:10,background:C.azC,color:C.az,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14}}>{c.nome?.charAt(0)}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:12,color:C.tx,display:"flex",alignItems:"center",gap:6}}>{c.nome} {c.auths?.filter(a=>a.status==="pending").length>0&&<span style={{background:C.ouC,color:C.ou2,fontSize:8,padding:"1px 4px",borderRadius:5}}>⏳ {c.auths.filter(a=>a.status==="pending").length} pendente</span>}</div>
            <div style={{fontSize:10,color:C.sb}}>{c.auths?.length||0} auths · Faltam {cfg.meta - ((c.auths?.filter(a=>a.valida!==false && a.status==="approved").length||0)%cfg.meta)}</div>
          </div>
        </div>
        {exp===c.id&&<div style={{padding:"12px 13px",background:"#fcfdfe",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:10,color:C.sb,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>📞 {c.whats||"—"}</div>
            <div>🎂 Nascimento: {fmtDN(c.nasc)}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {c.auths?.slice().reverse().map(a=>{
               const s = a.status || (a.valida===false?"rejected":"approved");
               const corS = s==="approved"?C.vd:s==="pending"?C.ou:C.rd;
               const labelS = s==="approved"?"Aprovada":s==="pending"?"Aguardando Auditoria":"Recusada";
               return <AAud key={a.id} a={a} c={c} corS={corS} labelS={labelS} opN={opN} brl={brl} fDT={fDT} cfg={cfg} setCl={setCl} cl={cl} pr={pr} setPr={setPr} setVoucherVer={setVoucherVer}/>;
            })}
          </div>
        </div>}
      </div>))}
    </div>
    {voucherVer && <OpVoucherCard p={voucherVer} cli={cl.find(c=>c.id===voucherVer.clientId)} cfg={cfg} onClose={()=>setVoucherVer(null)} />}
  </div>);
}

function APr({pr, cl, cfg, setPr}){
  const [voucherVer, setVoucherVer] = useState(null);
  const cN=id=>cl.find(c=>c.id===id)?.nome||"—";
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="🎁" t="Prêmios Distribuídos" s={`${pr.length} total`}/>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {[...pr].reverse().map((p,i)=>{
        const cli=cl.find(c=>c.id===p.clientId);
        const isP = p.status==="pending";
        const isR = p.status==="redeemed";
        return(<div key={p.id} style={{padding:"12px 13px",borderBottom:i<pr.length-1?`1px solid ${C.bd}22`:"none",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:p.tipo==="relampago"?(isP?C.ouC:C.rxC):(isP?C.ouC:C.vdC),display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{p.emoji||cfg.premioMeta.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:13,color:C.tx}}>{p.nome}</div>
              <div style={{fontSize:10,color:C.sb}}><strong style={{color:C.az}}>{cli?.nome}</strong></div>
            </div>
            {isP && <span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:6}}>PENDENTE</span>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {!isR && <button onClick={()=>setVoucherVer(p)} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontSize:10,fontWeight:800,cursor:"pointer",flex:1,fontFamily:"inherit"}}>🎫 Ver Cupom</button>}
            {!isR && cli?.whats && <a href={`https://wa.me/55${cli.whats}?text=${encodeURIComponent(`🎉 *CUPOM DE RETIRADA*\n\nParabéns, ${cli.nome?.split(" ")[0]}!\n\nVocê ganhou: *${p.nome} ${p.emoji||""}*\n\nSeu código: *${p.id.toUpperCase()}*\n\nApresente na Lotérica Central! 🏆`)}`} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontSize:10,fontWeight:800,textDecoration:"none",flex:1,textAlign:"center",fontFamily:"inherit"}}>📲 WhatsApp c/ Texto</a>}
            {isR && <div style={{background:C.bg,color:C.sb,borderRadius:8,padding:"8px 12px",fontSize:10,fontWeight:800,textAlign:"center",flex:1}}>✅ Retirado</div>}
          </div>
        </div>);
      })}
    </div>
    {voucherVer && <OpVoucherCard p={voucherVer} cli={cl.find(c=>c.id===voucherVer.clientId)} cfg={cfg} onClose={()=>setVoucherVer(null)} />}
  </div>);
}

function OpVoucherCard({p, cli, cfg, onClose}){
  const dVal = p.validade || new Date(new Date(p.data).getTime() + (cfg.validadeDias||30)*86400000).toISOString();
  const msg = `🎉 *CUPOM DE RETIRADA*\n\nParabéns, *${cli?.nome?.split(" ")[0]}*!\n\nVocê ganhou: *${p.nome} ${p.emoji||""}*\n\nSeu código: *${p.id.toUpperCase()}*\n\nValidade de retirada do prêmio: *${fD(dVal)}*\n\nApresente na Lotérica Central para resgatar! 🏆`;
  
  async function shareImg() {
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#003478"; ctx.fillRect(0,0,800,1000);
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 60px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("CLIENTE PREMIADO", 400, 150);
    ctx.fillStyle = "#ffffff"; ctx.font = "50px sans-serif";
    ctx.fillText(cli?.nome || "Cliente", 400, 250);
    ctx.font = "bold 120px sans-serif"; ctx.fillText(p.emoji || "🎁", 400, 450);
    ctx.font = "bold 70px sans-serif"; ctx.fillText(p.nome, 400, 580);
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 90px monospace"; ctx.fillText(p.id.toUpperCase(), 400, 750);
    ctx.fillStyle = "#ffffff"; ctx.font = "35px sans-serif"; ctx.fillText("Validade de Retirada do Prêmio: "+fD(dVal), 400, 850);
    ctx.font = "bold 40px sans-serif"; ctx.fillText("LOTÉRICA CENTRAL", 400, 950);
    
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "cupom.png", { type: "image/png" });
      if (navigator.share) {
        try { await navigator.share({ files: [file], title: "Cupom Lotérica Central", text: msg }); } catch (e) { window.open(`https://wa.me/55${cli?.whats}?text=${encodeURIComponent(msg)}`); }
      } else { window.open(`https://wa.me/55${cli?.whats}?text=${encodeURIComponent(msg)}`); }
    });
  }

  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(5px)"}} onClick={onClose}>
    <div style={{background:"#fff",width:"100%",maxWidth:360,borderRadius:24,overflow:"hidden",boxShadow:"0 30px 60px rgba(0,0,0,.5)",animation:"pop .4s ease"}} onClick={e=>e.stopPropagation()}>
      <div style={{background:`linear-gradient(160deg,${C.az},${C.az2})`,padding:25,textAlign:"center",position:"relative"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:C.ou,opacity:.1}}/>
        <div style={{background:"#fff",width:80,height:80,borderRadius:18,margin:"0 auto 15px",display:"flex",alignItems:"center",justifyContent:"center",padding:8,boxShadow:"0 8px 20px rgba(0,0,0,.2)"}}>
          <div style={{fontWeight:900,fontSize:10,color:C.az,textAlign:"center"}}>LOTÉRICA<br/>CENTRAL</div>
        </div>
        <div style={{color:C.ou,fontSize:10,fontWeight:800,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Certificado de Premiação</div>
        <div style={{color:"#fff",fontSize:22,fontWeight:900}}>Cliente Premiado</div>
      </div>
      <div style={{padding:"25px 22px",textAlign:"center"}}>
        <div style={{fontSize:18,fontWeight:900,color:C.tx,marginBottom:20}}>{cli?.nome}</div>
        <div style={{background:C.bg,borderRadius:18,padding:18,marginBottom:20,border:`1px solid ${C.bd}`}}>
          <div style={{fontSize:36,marginBottom:6}}>{p.emoji||cfg.premioMeta.emoji}</div>
          <div style={{fontSize:18,fontWeight:900,color:C.az}}>{p.nome}</div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <div style={{flex:1,background:C.ouC,borderRadius:12,padding:10,border:`1px solid ${C.ou}33`}}>
            <div style={{fontSize:9,fontWeight:800,color:C.ou2,textTransform:"uppercase"}}>Código Voucher</div>
            <div style={{fontSize:18,fontWeight:900,color:C.tx,fontFamily:"monospace",letterSpacing:1}}>{p.id.toUpperCase()}</div>
          </div>
          <div style={{flex:1,background:C.rdC,borderRadius:12,padding:10,border:`1px solid ${C.rd}33`}}>
            <div style={{fontSize:9,fontWeight:800,color:C.rd,textTransform:"uppercase"}}>Validade de Retirada do Prêmio</div>
            <div style={{fontSize:15,fontWeight:900,color:C.tx}}>{fD(dVal)}</div>
          </div>
        </div>
        <button onClick={shareImg} style={{width:"100%",background:"#25D366",color:"#fff",borderRadius:12,padding:14,fontWeight:900,fontSize:14,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,justifyContent:"center",boxShadow:"0 10px 20px rgba(37,211,102,.3)",fontFamily:"inherit"}}>
          📲 Enviar Imagem p/ WhatsApp
        </button>
      </div>
      <div style={{background:C.bg,padding:15,textAlign:"center",borderTop:`1px solid ${C.bd}`}}>
        <button onClick={onClose} style={{background:"none",color:C.sb,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",width:"100%",fontFamily:"inherit"}}>Fechar</button>
      </div>
    </div>
  </div>);}

function ACfg({cfg,setCfg,ops,setOps,cl,pr}){
  const[sub,setSub]=useState("meta");
  const SUBS=[{id:"meta",l:"🎯 Meta"},{id:"rl",l:"⚡ Relâmpago"},{id:"form",l:"📝 Formulário"},{id:"reg",l:"📋 Regulamento"},{id:"not",l:"📰 Notícias"},{id:"sis",l:"🔧 Sistema"}];
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="⚙️" t="Configurações" s="Edite prêmios, formulário, notícias e sistema"/>
    <div style={{display:"flex",gap:5,background:"#fff",borderRadius:12,padding:4,border:`1px solid ${C.bd}`,flexWrap:"wrap"}}>
      {SUBS.map(s=><button key={s.id} onClick={()=>setSub(s.id)} style={{flex:1,minWidth:58,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:10,background:sub===s.id?C.az:"transparent",color:sub===s.id?"#fff":C.sb,transition:"all .2s"}}>{s.l}</button>)}
    </div>
    {sub==="meta"&&<CfgMeta cfg={cfg} setCfg={setCfg}/>}
    {sub==="rl"  &&<CfgRl   cfg={cfg} setCfg={setCfg}/>}
    {sub==="form"&&<CfgForm cfg={cfg} setCfg={setCfg}/>}
    {sub==="reg" &&<CfgReg  cfg={cfg} setCfg={setCfg}/>}
    {sub==="not" &&<CfgNoticias cfg={cfg} setCfg={setCfg}/>}
    {sub==="sis" &&<CfgSis  cfg={cfg} setCfg={setCfg} ops={ops} setOps={setOps} cl={cl} pr={pr}/>}
  </div>);
}

function CfgForm({cfg,setCfg}){
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
  const salvar=()=>{ setCfg({...cfg,formulario:{cats,campos}}); DB.save("lc-cfg",{...cfg,formulario:{cats,campos}}); setMsg("✅ Salvo!"); setTimeout(()=>setMsg(""),4000); }
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

function CfgMeta({cfg,setCfg}){
  const[meta,setMeta]=useState(String(cfg.meta));
  const[minV,setMinV]=useState(cfg.minVisita||300);
  const[valDias,setValDias]=useState(cfg.validadeDias||30);
  const[emoji,setEmoji]=useState(cfg.premioMeta.emoji);
  const[nome,setNome]=useState(cfg.premioMeta.nome);
  const[desc,setDesc]=useState(cfg.premioMeta.desc);
  const[msg,setMsg]=useState("");
  function salvar(){const m=parseInt(meta,10);if(!m||m<1||m>100){setMsg("❌ Meta deve ser entre 1 e 100.");return;}if(!nome.trim()){setMsg("❌ Informe o nome do prêmio.");return;}setCfg({...cfg,meta:m,minVisita:parseFloat(minV),validadeDias:parseInt(valDias)||30,premioMeta:{nome:nome.trim(),emoji,desc}});setMsg("✅ Meta salva!");setTimeout(()=>setMsg(""),3000);}
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

function CfgRl({cfg,setCfg}){
  const[lista,setLista]=useState(cfg.relampagos.map(r=>({...r})));
  const[minR,setMinR]=useState(cfg.minRelampago||60);
  const[editId,setEditId]=useState(null);
  const[msg,setMsg]=useState("");
  const totP=lista.filter(r=>r.ativo).reduce((s,r)=>s+(parseFloat(r.prob)||0),0);
  const upd=(id,k,v)=>setLista(l=>l.map(r=>r.id===id?{...r,[k]:v}:r));
  function addNovo(){setLista(l=>[...l,{id:uid(),ativo:true,emoji:"🎁",nome:"Novo Prêmio",prob:5,desc:"Você ganhou um prêmio surpresa! Retire no balcão."}]);}
  function remover(id){if(lista.length<=1){setMsg("❌ Mínimo 1 prêmio.");return;}setLista(l=>l.filter(r=>r.id!==id));}
  function salvar(){const inv=lista.filter(r=>!r.nome.trim()||!(parseFloat(r.prob)>0));if(inv.length){setMsg("❌ Todos precisam de nome e probabilidade > 0.");return;}setCfg({...cfg,minRelampago:parseFloat(minR),relampagos:lista.map(r=>({...r,prob:parseFloat(r.prob)||0}))});setMsg("✅ Prêmios relâmpago salvos!");setTimeout(()=>setMsg(""),3000);}
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
        <button onClick={()=>remover(r.id)} style={{background:C.rdC,color:C.rd,border:`1px solid ${C.rd}33`,borderRadius:9,padding:"8px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑️ Remover este prêmio</button>
      </div>}
    </div>)}
    <button onClick={addNovo} style={{background:C.rxC,color:C.rx,border:`1.5px dashed ${C.rx}55`,borderRadius:12,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>➕ Adicionar Novo Prêmio Relâmpago</button>
    {msg&&<div style={{padding:"9px 12px",borderRadius:9,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd}}>{msg}</div>}
    <button onClick={salvar} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.rx},#5b21b6)`,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.rx}44`}}>💾 Salvar Prêmios Relâmpago</button>
  </div>);
}

function CfgReg({cfg,setCfg}){
  const[txt,setTxt]=useState(cfg.regulamento);
  const[ini,setIni]=useState(cfg.dataInicio||"2026-04-01");
  const[fim,setFim]=useState(cfg.dataFim||"2026-12-31");
  const[msg,setMsg]=useState("");
  function salvar(){
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

function CfgSis({cfg,setCfg,ops,setOps,cl,pr}){
  const[url,setUrl]=useState(cfg.appUrl||"");const[wts,setWts]=useState(cfg.wts||"");const[msg,setMsg]=useState("");
  function salvar(){setCfg({...cfg,appUrl:url.trim(),wts:wts.trim()});setMsg("✅ Salvo!");setTimeout(()=>setMsg(""),3000);}
  function csv(rows,name){const d=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(d);a.download=name;a.click();}
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <div style={{background:"#fff",borderRadius:14,padding:"15px",border:`1px solid ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:10}}>🌐 URL do Aplicativo Cliente</div>
      <div style={{fontSize:11,color:C.sb,marginBottom:8,lineHeight:1.7}}>URL pública do portal do cliente (ex: <code>https://meuapp.vercel.app</code>). Necessária para os QR Codes funcionarem no celular.</div>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://meuapp.vercel.app" style={{...I,marginBottom:12}}/>
      <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:8}}>📱 WhatsApp da Lotérica</div>
      <input value={wts} onChange={e=>setWts(e.target.value)} placeholder="5575999990000" style={{...I,marginBottom:12}}/>
      {msg&&<div style={{padding:"9px 12px",borderRadius:9,marginBottom:10,fontSize:12,fontWeight:700,background:C.vdC,color:C.vd}}>{msg}</div>}
      <button onClick={salvar} style={{width:"100%",padding:13,borderRadius:11,border:"none",background:`linear-gradient(135deg,${C.vd},#059669)`,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✅ Salvar</button>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:"15px",border:`1px solid ${C.bd}`}}>
      <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:12}}>💾 Exportar Dados</div>
        {[["👥","Clientes",`${cl.length} registros`,()=>csv([["ID","Nome","WhatsApp","Email","Cadastro","Visitas","Pontos","Prêmios"],...cl.map(c=>{const vs=c.auths?.filter(a=>a.valida!==false)||[];return[c.id,c.nome,c.whats,c.email||"",fD(c.cadastro),c.auths?.length||0,vs.length,Math.floor(vs.length/cfg.meta)];})],`clientes_${hoje()}.csv`)],
        ["🎁","Prêmios",`${pr.length} registros`,()=>csv([["ID","Cliente","Tipo","Nome","Data"],...pr.map(p=>[p.id,cl.find(c=>c.id===p.clientId)?.nome||"",p.tipo,p.nome,fDT(p.data)])],`premios_${hoje()}.csv`)],
        ["✅","Autenticações","Todas as visitas",()=>{const rows=[["Cliente","Operador","Data","Total","Status","Serviços"]];cl.forEach(c=>(c.auths||[]).forEach(a=>rows.push([c.nome,a.opNome||"",fDT(a.data),a.total||0,a.valida!==false?"PONTO":"HISTORICO",(a.selecionados||[]).join(";")])));csv(rows,`auths_${hoje()}.csv`);}],
      ].map(([ic,t,s,fn])=><div key={t} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.bd}`,marginBottom:7}}><span style={{fontSize:22}}>{ic}</span><div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{t}</div><div style={{fontSize:10,color:C.sb}}>{s}</div></div><button onClick={fn} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⬇️ CSV</button></div>)}
    </div>
  </div>);
}

/* ═══════ CONFIG NOTÍCIAS ═══════ */
function CfgNoticias({cfg,setCfg}){
  const nots0 = cfg.noticias||DCFG.noticias;
  const[lista,  setLista]  = useState(nots0.map(n=>({...n})));
  const[editId, setEditId] = useState(null);
  const[nova,   setNova]   = useState({tipo:"geral",emoji:"📢",titulo:"",corpo:"",data:""});
  const[showNew,setShowNew]= useState(false);
  const[msg,    setMsg]    = useState("");
  const[filtro, setFiltro] = useState("todos"); // todos | geral | vip

  const uid2=()=>Math.random().toString(36).slice(2,9);

  function upd(id,k,v){ setLista(l=>l.map(n=>n.id===id?{...n,[k]:v}:n)); }
  function remover(id){ if(!window.confirm("Remover esta notícia?"))return; setLista(l=>l.filter(n=>n.id!==id)); setEditId(null); }
  function addNova(){
    if(!nova.titulo.trim()){setMsg("❌ Informe o título da notícia.");return;}
    if(!nova.corpo.trim()) {setMsg("❌ Informe o conteúdo da notícia.");return;}
    setLista(l=>[...l,{...nova,id:uid2(),ativo:true}]);
    setNova({tipo:"geral",emoji:"📢",titulo:"",corpo:"",data:""});
    setShowNew(false);setMsg("");
  }
  function salvar(){
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
function Nav({abas,aba,setAba,cor}){return(<nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"#fff",borderTop:`1px solid ${C.bd}`,display:"flex",boxShadow:"0 -4px 20px rgba(0,0,0,.08)",zIndex:100}}>
  {abas.map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{flex:1,padding:"8px 2px 10px",border:"none",cursor:"pointer",fontFamily:"inherit",background:aba===a.id?"#f0f4fb":"#fff",borderTop:`2.5px solid ${aba===a.id?cor:"transparent"}`,transition:"all .2s",position:"relative"}}>
    {a.badge>0 && <div style={{position:"absolute",top:3,right:"15%",background:C.rd,color:"#fff",fontSize:8,fontWeight:900,padding:"1px 4px",borderRadius:10}}>{a.badge}</div>}
    <div style={{fontSize:16,marginBottom:2}}>{a.emoji}</div><div style={{fontSize:8,fontWeight:aba===a.id?800:600,color:aba===a.id?cor:C.sb,lineHeight:1}}>{a.label}</div>
  </button>)}
</nav>);}
