import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DB } from "./firebase.js";

/* ═══════ CONFIG PADRÃO ═══════ */
const DCFG = {
  meta: 15,
  premioMeta: { nome:"Raspadinha CAIXA", emoji:"\u{1F39F}\uFE0F", desc:"Você completou {meta} visitas e ganhou {premioNome}! Retire no balcão." },
  relampagos: [
    { id:"r1",ativo:true, emoji:"\u{1F39F}\uFE0F",nome:"Raspadinha Bônus", prob:8,  desc:"Raspadinha extra! Retire no balcão hoje." },
    { id:"r2",ativo:true, emoji:"\u{1F3F7}\uFE0F",nome:"Cupom Desconto",   prob:15, desc:"10% de desconto na próxima Raspadinha. Válido 7 dias." },
    { id:"r3",ativo:true, emoji:"\u{1F381}",        nome:"Brinde Surpresa", prob:10, desc:"Brinde especial esperando por você no balcão." },
    { id:"r4",ativo:true, emoji:"\u26A1",            nome:"Dobro de Pontos",prob:12, desc:"Esta visita vale 2 autenticações! Parabéns." },
    { id:"r5",ativo:false,emoji:"\u{1F31F}",         nome:"Sorteio do Mês", prob:5,  desc:"Você entrou no Sorteio do Mês! Resultado dia 01." },
  ],
  regulamento: `REGULAMENTO — CLIENTE FIDELIZADO PREMIADO
Lotérica Central · CNPJ 20.845.956/0001-00 · Alagoinhas-BA

1. PARTICIPAÇÃO
Clientes atendidos com visita validada pelo código do operador de caixa.

2. COMO FUNCIONA
• O operador fornece seu código exclusivo de identificação.
• O cliente digita o código no App para registrar a visita.
• Cada visita validada conta como 1 autenticação.

3. PRÊMIO PRINCIPAL
• A cada {meta} autenticações: 1 {premioNome}.
• Retirada em até 30 dias após notificação via WhatsApp.

4. PRÊMIO RELÂMPAGO
• Ao incluir Jogos na visita, o cliente concorre a prêmios surpresa automáticos.

5. PRÊMIO OPERADORAS
• Todo dia 05: as 2 operadoras com mais auths do mês ganham prêmio.

6. LGPD — Dados usados exclusivamente neste programa.
7. VIGÊNCIA — Permanente, com aviso prévio de 7 dias.`,
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
const oc=i=>C.ops[i%C.ops.length];

/* ═══════ UTILS ═══════ */
const uid=()=>Math.random().toString(36).slice(2,9);
const uidOp=(ops=[])=>{
  let cod,attempts=0;
  do{ cod=String(Math.floor(1000+Math.random()*9000)); attempts++; }
  while(ops.some(o=>o.id===cod)&&attempts<500);
  return cod;
};
const now=()=>new Date().toISOString();
const fD=d=>new Date(d).toLocaleDateString("pt-BR");
const fDT=d=>new Date(d).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const mAno=d=>`${String(new Date(d).getMonth()+1).padStart(2,"0")}/${new Date(d).getFullYear()}`;
const brl=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtDN = v=>{if(!v)return"—";if(v.length!==8)return v;return`${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`;};
const hoje=()=>new Date().toISOString().slice(0,10);
/* DB importado via firebase.js */


/* ═══════ CSS ═══════ */
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{background:#f0f4fb;font-family:'Nunito',sans-serif;}
@keyframes up {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes dt {0%,100%{opacity:.25;transform:scale(.65)}50%{opacity:1;transform:scale(1.2)}}
@keyframes sp {to{transform:rotate(360deg)}}`;

/* ═══════ ESTILOS ═══════ */
const L={fontSize:11,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:.5};
const I={padding:"11px 13px",border:`1.5px solid ${C.bd}`,borderRadius:11,fontSize:13,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff",width:"100%"};
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
  const setOps=d=>{setOps_(d);DB.save("lc-ops",d);};
  const setCl=d=>{setCl_(d);DB.save("lc-cl",d);};
  const setPr=d=>{setPr_(d);DB.save("lc-pr",d);};
  const setCfg=d=>{setCfg_(d);DB.save("lc-cfg",d);};
  useEffect(()=>{(async()=>{
    try{const[o,c,p,f]=await Promise.all([DB.load("lc-ops"),DB.load("lc-cl"),DB.load("lc-pr"),DB.load("lc-cfg")]);
      if(Array.isArray(o))setOps_(o);if(Array.isArray(c))setCl_(c);if(Array.isArray(p))setPr_(p);
      if(f)setCfg_({...DCFG,...f,relampagos:f.relampagos||DCFG.relampagos,premioMeta:f.premioMeta||DCFG.premioMeta,noticias:f.noticias||DCFG.noticias,formulario:{...DCFG.formulario,...(f.formulario||{}),cats:f.formulario?.cats||DCFG.formulario.cats,campos:f.formulario?.campos||DCFG.formulario.campos}});}catch(_){}
    setTimeout(()=>setTela("home"),1400);

    DB.listen?.("lc-ops", val => { if(Array.isArray(val)) setOps_(val); });
    DB.listen?.("lc-cl", val => { if(Array.isArray(val)) setCl_(val); });
    DB.listen?.("lc-pr", val => { if(Array.isArray(val)) setPr_(val); });
    DB.listen?.("lc-cfg", val => { if(val) setCfg_(prev => ({...DCFG,...prev,...val})); });
  })();},[]);
  const ctx={tela,setTela,role,setRole,opSel,setOpSel,ops,setOps,cl,setCl,pr,setPr,cfg,setCfg};
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
  <Pts/>
</div>);}

function Home({ops,cl,setRole,setOpSel,setTela}){
  const[senha,setSenha]=useState("");const[showS,setShowS]=useState(false);const[erroS,setErroS]=useState("");const[showOps,setShowOps]=useState(false);
  const[opLogin,setOpLogin]=useState(null);const[senhaOp,setSenhaOp]=useState("");const[erroOp,setErroOp]=useState("");
  const totalAuths=cl.reduce((s,c)=>s+(c.auths?.length||0),0);
  function entrarAdmin(){if(senha==="central2026"){setRole("admin");setTela("admin");}else setErroS("Senha incorreta.");}
  function entrarOp(){
    if(!opLogin) return;
    if(opLogin.senha === senhaOp || !opLogin.senha) { // if no password, allow (for legacy)
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
      {/* OPERADOR */}
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
            <div style={{display:"flex",gap:7}}>
              <input value={senhaOp} onChange={e=>setSenhaOp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrarOp()} type="password" placeholder="Senha..." autoFocus style={{flex:1,...I}}/>
              <button onClick={entrarOp} style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>ENTRAR</button>
            </div>
            {erroOp && <div style={{marginTop:7,fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {erroOp}</div>}
          </div>}
          <div onClick={()=>setTela("opreg")} style={{padding:"11px 15px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:C.az,fontWeight:800,fontSize:12,borderTop:`1px solid ${C.bd}`}}>
            <span style={{fontSize:17}}>➕</span> Cadastrar Nova Operadora
          </div>
        </div>}
      </div>
      {/* ADMIN */}
      <div style={{background:"#fff",borderRadius:17,border:`1px solid ${C.bd}`,overflow:"hidden"}}>
        <div style={{padding:"13px 15px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:900,fontSize:15,color:C.tx}}>🔒 Administrador / Lotérica</div><div style={{fontSize:11,color:C.sb,marginTop:2}}>Dashboard completo + Configurações</div></div>
          <button onClick={()=>setShowS(!showS)} style={{background:"#374151",color:"#fff",border:"none",borderRadius:9,padding:"8px 13px",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{showS?"Fechar":"Entrar →"}</button>
        </div>
        {showS&&<div style={{padding:"11px 15px",borderTop:`1px solid ${C.bd}`}}>
          <div style={{display:"flex",gap:7,marginBottom:erroS?7:0}}>
            <input value={senha} onChange={e=>{setSenha(e.target.value);setErroS("");}} onKeyDown={e=>e.key==="Enter"&&entrarAdmin()} type="password" placeholder="Senha admin…" style={{flex:1,...I}}/>
            <button onClick={entrarAdmin} style={{background:C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
          </div>
          {erroS&&<div style={{fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {erroS}</div>}
        </div>}
      </div>
      {/* STATS */}
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
  const[nome,setNome]=useState("");const[senha,setSenha]=useState("");const[erro,setErro]=useState("");const[nova,setNova]=useState(null);
  function cad(){const n=(nome||"").trim();const s=(senha||"").trim();if(!n){setErro("Informe o nome.");return;}if(!s){setErro("Defina uma senha.");return;}if(ops.some(o=>o.nome.toLowerCase()===n.toLowerCase())){setErro("Nome já cadastrado.");return;}const op={id:uidOp(ops),nome:n,senha:s,cadastro:now()};setOps([...ops,op]);setNova(op);setNome("");setSenha("");setErro("");}
  if(nova)return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.az},#5b21b6)`,padding:"28px 18px",textAlign:"center"}}>
    <div style={{fontSize:54,animation:"pop .5s",marginBottom:10}}>✅</div>
    <div style={{fontWeight:900,fontSize:22,color:"#fff",marginBottom:6}}>Cadastrada!</div>
    <div style={{fontSize:14,color:"rgba(255,255,255,.8)",marginBottom:16}}><strong style={{color:C.ou}}>{nova.nome}</strong> registrada com sucesso.</div>
    {/* Código 4 dígitos em destaque */}
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
      <input value={senha} onChange={e=>{setSenha(e.target.value);setErro("");}} type="password" placeholder="Mínimo 4 caracteres" style={{...I,marginTop:6,border:`2px solid ${senha?C.az:C.bd}`,background:senha?C.azC:"#fff"}}/>
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

function OpPanel({opSel,setOpSel,ops,setOps,cl,pr,cfg,setTela,setRole}){
  const[aba,setAba]=useState("qr");
  const ABAS=[{id:"qr",emoji:"📱",label:"Meu Código"},{id:"auths",emoji:"✅",label:"Auths"},{id:"clnts",emoji:"👥",label:"Clientes"},{id:"rank",emoji:"🏅",label:"Ranking"}];
  const op = ops.find(o => o.id === opSel?.id) || opSel;
  const idx = ops.findIndex(o => o.id === op?.id);
  const minhas = useMemo(() => {
    const a = [];
    cl.forEach(c => (c.auths || []).forEach(x => {
      if (x.opId === op.id) a.push({ ...x, cn: c.nome });
    }));
    return a.sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [cl, op.id]);
  const hoje_ = minhas.filter(a => a.data?.slice(0, 10) === hoje());
  const meusCl = cl.filter(c => (c.auths || []).some(a => a.opId === op.id));
  const rank = useMemo(() => ops.map((o, i) => {
    let t = 0;
    cl.forEach(c => (c.auths || []).forEach(a => {
      if (a.opId === o.id) t++;
    }));
    return { op: o, t, i };
  }).sort((a, b) => b.t - a.t), [ops, cl]);
  const pos = rank.findIndex(r => r.op.id === op.id) + 1;
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
    <div style={{background:`linear-gradient(135deg,${oc(idx)},${C.az})`,padding:"18px 18px 22px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
      <button onClick={()=>{setRole(null);setOpSel(null);setTela("home");}} style={BV}>← Sair</button>
      <div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>{op.nome}</div>
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
      {aba==="rank" &&<OpRank  rank={rank} opId={op.id}/>}
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
      {lista.map((a,i)=><div key={a.id} style={{padding:"10px 13px",borderBottom:i<lista.length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏪</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{a.cn}</div><div style={{fontSize:10,color:C.sb}}>{fDT(a.data)}{a.total>0?` · ${brl(a.total)}`:""}</div></div>
      </div>)}
    </div>
  </div>);
}

function OpCl({meusCl,cfg}){return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
  <T em="👥" t="Meus Clientes" s={`${meusCl.length} atendidos`}/>
  <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
    {meusCl.length===0&&<V em="👥" msg="Ainda nenhum cliente atendido."/>}
    {meusCl.map((c,i)=>{const prog=(c.auths?.length||0)%cfg.meta;const ganhou=(c.auths?.length||0)>0&&c.auths.length%cfg.meta===0;return(<div key={c.id} style={{padding:"10px 13px",borderBottom:i<meusCl.length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:34,height:34,borderRadius:"50%",background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:C.az,flexShrink:0}}>{c.nome?.[0]?.toUpperCase()||"?"}</div>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{c.nome}</div><div style={{fontSize:10,color:C.sb}}>{c.auths?.length||0} auths · Faltam {cfg.meta-prog}</div></div>
      {ganhou&&<span style={{background:C.vdC,color:C.vd,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>{cfg.premioMeta.emoji} Pronto!</span>}
      {!ganhou&&prog>=cfg.meta-3&&prog>0&&<span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>Faltam {cfg.meta-prog}</span>}
    </div>);})}</div>
</div>);}

function OpRank({rank,opId}){return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
  <T em="🏅" t="Ranking" s="Classificação por autenticações"/>
  <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
    {rank.map((r,i)=>{const eu=r.op.id===opId;return(<div key={r.op.id} style={{padding:"11px 13px",borderBottom:i<rank.length-1?`1px solid ${C.bd}22`:"none",background:eu?C.azC:"transparent",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:i===0?C.ou:i===1?"#cbd5e1":i===2?"#fcd34d":oc(r.i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:i<3?14:11,color:"#fff"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
      <div style={{flex:1}}><div style={{fontWeight:eu?900:700,fontSize:13,color:eu?C.az:C.tx,display:"flex",gap:5,alignItems:"center"}}>{r.op.nome}{eu&&<span style={{background:C.az,color:"#fff",fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:9}}>EU</span>}{i<2&&<span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:9}}>🏆 Dia 05</span>}</div></div>
      <div style={{fontWeight:900,fontSize:16,color:eu?C.az:C.tx}}>{r.t}<span style={{fontSize:10,color:C.sb,fontWeight:400}}> auth</span></div>
    </div>);})}</div>
  <div style={{background:C.ouC,borderRadius:11,padding:"10px 12px",border:`1px solid ${C.ou}44`,fontSize:11,color:C.ou2,lineHeight:1.7}}>🏆 <strong>Todo dia 05:</strong> as 2 operadoras com mais auths do mês ganham prêmio especial!</div>
</div>);}

/* ═══════ ADMIN PANEL ═══════ */
function AdminPanel({ops,setOps,cl,setCl,pr,setPr,cfg,setCfg,setTela,setRole}){
  const[aba,setAba]=useState("dash");
  const ABAS=[{id:"dash",emoji:"📊",label:"Painel"},{id:"ops",emoji:"🏅",label:"Operadoras"},{id:"cl",emoji:"👥",label:"Clientes"},{id:"pr",emoji:"🎁",label:"Prêmios"},{id:"cfg",emoji:"⚙️",label:"Ajustes"}];
  const totA=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.length||0),0),[cl]);
  const hjA=useMemo(()=>{const h=hoje();let n=0;cl.forEach(c=>(c.auths||[]).forEach(a=>{if(a.data?.slice(0,10)===h)n++;}));return n;},[cl]);
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
    <div style={{background:`linear-gradient(135deg,${C.az},${C.az2})`,padding:"18px 18px 22px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:170,height:170,borderRadius:"50%",background:C.ou,opacity:.07}}/>
      <button onClick={()=>{setRole(null);setTela("home");}} style={BV}>← Sair</button>
      <div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>🔒 Administrador</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.55)"}}>Visão completa da lotérica</div>
      <div style={{display:"flex",gap:7,marginTop:13}}>
        {[["👥",cl.length,"Clientes"],["✅",totA,"Auths"],["📅",hjA,"Hoje"],["🎁",pr.length,"Prêmios"]].map(([em,v,l])=>(
          <div key={l} style={{flex:1,background:"rgba(255,255,255,.1)",borderRadius:9,padding:"7px 4px",textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
            <div style={{fontSize:13}}>{em}</div><div style={{fontWeight:900,fontSize:16,color:"#fff",lineHeight:1}}>{v}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:.4,marginTop:1}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{flex:1,padding:"13px 13px 76px",animation:"up .3s"}}>
      {aba==="dash"&&<ADash ops={ops} cl={cl} pr={pr} cfg={cfg}/>}
      {aba==="ops" &&<AOps  ops={ops} setOps={setOps} cl={cl} cfg={cfg}/>}
      {aba==="cl"  &&<ACl   cl={cl} setCl={setCl} ops={ops} cfg={cfg} pr={pr}/>}
      {aba==="pr"  &&<APr   pr={pr} cl={cl} cfg={cfg}/>}
      {aba==="cfg" &&<ACfg  cfg={cfg} setCfg={setCfg} ops={ops} setOps={setOps} cl={cl} pr={pr}/>}
    </div>
    <Nav abas={ABAS} aba={aba} setAba={setAba} cor={C.az}/>
  </div>);
}

function ADash({ops,cl,pr,cfg}){
  const totA=useMemo(()=>cl.reduce((s,c)=>s+(c.auths?.length||0),0),[cl]);
  const prontos=cl.filter(c=>(c.auths?.length||0)>0&&c.auths.length%cfg.meta===0);
  const perto=cl.filter(c=>{const p=(c.auths?.length||0)%cfg.meta;return p>0&&p>=cfg.meta-3&&c.auths.length%cfg.meta!==0;});
  const gr=useMemo(()=>{const m={};cl.forEach(c=>(c.auths||[]).forEach(a=>{const k=mAno(a.data);if(!m[k])m[k]={mes:k,auths:0};m[k].auths++;}));return Object.values(m).sort((a,b)=>a.mes.localeCompare(b.mes)).slice(-8);},[cl]);
  const topOps=useMemo(()=>ops.map((o,i)=>{let t=0;cl.forEach(c=>(c.auths||[]).forEach(a=>{if(a.opId===o.id)t++;}));return{op:o,t,i};}).sort((a,b)=>b.t-a.t).slice(0,5),[ops,cl]);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    <T em="📊" t="Dashboard" s="Visão completa da lotérica"/>
    {prontos.length>0&&<div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`2px solid ${C.ou}55`,boxShadow:`0 4px 14px ${C.ou}22`}}>
      <div style={{background:C.ou,padding:"9px 13px",display:"flex",gap:7,alignItems:"center"}}><span style={{fontSize:16}}>{cfg.premioMeta.emoji}</span><span style={{fontWeight:800,fontSize:12,color:C.az}}>{prontos.length} cliente{prontos.length>1?"s":""} atingiu a meta de {cfg.meta} auths!</span></div>
      {prontos.slice(0,3).map(c=><div key={c.id} style={{padding:"9px 13px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{c.nome}</div><div style={{fontSize:10,color:C.sb}}>{c.auths.length} auths</div></div>
        <a href={`https://wa.me/55${c.whats}?text=${encodeURIComponent(`Olá ${c.nome?.split(" ")[0]}! 🎉 ${cfg.premioMeta.desc.replace("{meta}",cfg.meta).replace("{premioNome}",cfg.premioMeta.nome)}`)}`} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:10,fontWeight:700,textDecoration:"none"}}>📲</a>
      </div>)}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {[["👥","Clientes",cl.length,C.az],[`${cfg.premioMeta.emoji}`,"Prêmios",pr.length,C.ou2],["✅","Auths",totA,C.vd],["⚡","Quase lá",perto.length,C.rx]].map(([em,t,v,cor])=>(
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
      {perto.slice(0,5).map((c,i)=>{const falt=cfg.meta-c.auths.length%cfg.meta;return(<div key={c.id} style={{padding:"9px 13px",borderBottom:i<4?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
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

function AOps({ops,setOps,cl,cfg}){
  const[eId,setEId]=useState(null);const[eN,setEN]=useState("");
  const rank=useMemo(()=>ops.map((o,i)=>{let a=0,cs=new Set();cl.forEach(c=>(c.auths||[]).forEach(x=>{if(x.opId===o.id){a++;cs.add(c.id);}}));return{op:o,i,a,cs:cs.size};}).sort((a,b)=>b.a-a.a),[ops,cl]);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="🏅" t="Operadoras" s={`${ops.length} cadastradas`}/>
    {rank.map((r,i)=><div key={r.op.id} style={{background:"#fff",borderRadius:13,padding:"13px",border:i<2?`2px solid ${C.ou}55`:`1px solid ${C.bd}`}}>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:oc(r.i),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#fff",flexShrink:0}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
        <div style={{flex:1}}>
          {eId===r.op.id?<div style={{display:"flex",gap:5}}><input value={eN} onChange={e=>setEN(e.target.value)} style={{flex:1,...I,padding:"5px 9px",fontSize:12}}/><button onClick={()=>{setOps(ops.map(o=>o.id===r.op.id?{...o,nome:eN}:o));setEId(null);}} style={{background:C.vd,color:"#fff",border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓</button><button onClick={()=>setEId(null)} style={{background:"#f3f4f6",color:C.sb,border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button></div>
          :<div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{fontWeight:800,fontSize:14,color:C.tx}}>{r.op.nome}</div>{i<2&&<span style={{background:C.ouC,color:C.ou2,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>🏆 Dia 05</span>}<button onClick={()=>{setEId(r.op.id);setEN(r.op.nome);}} style={{marginLeft:"auto",background:"none",border:"none",fontSize:14,cursor:"pointer"}}>✏️</button><button onClick={()=>{if(window.confirm(`Remover operadora ${r.op.nome}?`)) setOps(ops.filter(o=>o.id!==r.op.id));}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer"}}>🗑️</button></div>}
          <div style={{fontSize:10,color:C.sb,marginTop:2}}>Desde {fD(r.op.cadastro)}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["✅","Auths",r.a,C.az],["👥","Clientes",r.cs,C.vd]].map(([em,l,v,cor])=><div key={l} style={{background:C.bg,borderRadius:9,padding:"8px",textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:cor}}>{v}</div><div style={{fontSize:9,color:C.sb,textTransform:"uppercase",letterSpacing:.5}}>{em} {l}</div></div>)}</div>
      <div style={{marginTop:8,background:"#f3f4f6",borderRadius:6,height:5,overflow:"hidden"}}><div style={{height:"100%",background:oc(r.i),borderRadius:6,width:(r.a/Math.max(rank[0]?.a||1,1)*100)+"%"}}/></div>
    </div>)}
    {ops.length===0&&<V em="👤" msg="Nenhuma operadora cadastrada."/>}
  </div>);
}

function ACl({cl,setCl,ops,cfg,pr}){
  const[bus,setBus]=useState("");const[exp,setExp]=useState(null);
  const opN=id=>ops.find(o=>o.id===id)?.nome||"—";
  const lista=useMemo(()=>{const q=bus.toLowerCase().trim();return cl.filter(c=>!q||c.nome?.toLowerCase().includes(q)||c.whats?.includes(q)).sort((a,b)=>(b.auths?.length||0)-(a.auths?.length||0));},[cl,bus]);
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="👥" t="Todos os Clientes" s={`${cl.length} cadastrados`}/>
    <input value={bus} onChange={e=>setBus(e.target.value)} placeholder="🔍 Buscar por nome ou WhatsApp…" style={{...I}}/>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {lista.length===0&&<V em="👥" msg="Nenhum cliente encontrado."/>}
      {lista.map((c,i)=>{const prog=(c.auths?.length||0)%cfg.meta;const raspa=Math.floor((c.auths?.length||0)/cfg.meta);const ganhou=(c.auths?.length||0)>0&&c.auths.length%cfg.meta===0;const prCl=pr.filter(p=>p.clientId===c.id);return(<div key={c.id}>
        <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bd}22`,cursor:"pointer",background:exp===c.id?C.azC:"transparent"}} onClick={()=>setExp(exp===c.id?null:c.id)}>
          <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:3}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:C.az,flexShrink:0}}>{c.nome?.[0]?.toUpperCase()||"?"}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx,display:"flex",gap:4,alignItems:"center"}}>{c.nome}{ganhou&&<span style={{background:C.vdC,color:C.vd,fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:8}}>{cfg.premioMeta.emoji}</span>}{prCl.length>0&&<span style={{background:C.rxC,color:C.rx,fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:8}}>⚡{prCl.length}</span>}</div><div style={{fontSize:10,color:C.sb}}>{c.auths?.length||0} auths · Faltam {cfg.meta-prog}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:14,color:C.az}}>{c.auths?.length||0}</div><div style={{fontSize:9,color:C.sb}}>auth</div></div>
          </div>
          <div style={{background:C.bg,borderRadius:3,height:3,overflow:"hidden",marginLeft:41}}><div style={{height:"100%",background:`linear-gradient(90deg,${C.az},${C.ou})`,width:(prog/cfg.meta*100)+"%",borderRadius:3}}/></div>
        </div>
        {exp===c.id&&<div style={{background:"#f4f8ff",padding:"10px 13px",borderBottom:`1px solid ${C.bd}`}}>
          <div style={{fontSize:10,color:C.sb,lineHeight:1.7,marginBottom:10}}>
            📱 {c.whats?.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3")}<br/>
            📅 Nascimento: <strong>{fmtDN(c.nasc)}</strong><br/>
            🗓️ Membro desde {fD(c.cadastro)}
            {c.email&&<><br/>📧 {c.email}</>}
            {raspa>0&&<><br/>{cfg.premioMeta.emoji} {raspa} prêmio{raspa!==1?"s":""}</>}
          </div>
          
          <div style={{fontWeight:800,fontSize:10,color:C.tx,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Histórico de Visitas</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {(c.auths||[]).slice(-5).reverse().map(a => (
              <div key={a.id} style={{background:"#fff",borderRadius:8,padding:8,border:`1px solid ${C.bd}66`,display:"flex",flexDirection:"column",gap:4}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:10,fontWeight:700}}>{fDT(a.data)} <span style={{fontWeight:400,color:C.sb}}>por {opN(a.opId)}</span></div>
                  {a.nota > 0 && <span style={{fontSize:9,fontWeight:800,color:C.ou2}}>⭐ {a.nota}</span>}
                </div>
                {a.obs && <div style={{fontSize:9,color:C.sb,fontStyle:"italic"}}>"{a.obs}"</div>}
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {ganhou&&<a href={`https://wa.me/55${c.whats}?text=${encodeURIComponent(`Olá ${c.nome?.split(" ")[0]}! ${cfg.premioMeta.emoji} ${cfg.premioMeta.desc.replace("{meta}",cfg.meta).replace("{premioNome}",cfg.premioMeta.nome)}`)}`} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",borderRadius:8,padding:"5px 11px",fontSize:10,fontWeight:700,textDecoration:"none"}}>📲 Avisar Prêmio</a>}
            <button onClick={()=>{if(window.confirm(`Remover ${c.nome}?`)){setCl(cl.filter(x=>x.id!==c.id));setExp(null);}}} style={{background:C.rdC,color:C.rd,border:`1px solid ${C.rd}33`,borderRadius:8,padding:"5px 11px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑️ Remover</button>
          </div>
        </div>}
      </div>);})}
    </div>
  </div>);
}

function APr({pr,cl,cfg}){
  const cN=id=>cl.find(c=>c.id===id)?.nome||"—";const cW=id=>cl.find(c=>c.id===id)?.whats||"";
  return(<div style={{display:"flex",flexDirection:"column",gap:11}}><T em="🎁" t="Prêmios Distribuídos" s={`${pr.length} total`}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>{[[`${cfg.premioMeta.emoji}`,"Meta",pr.filter(p=>p.tipo==="raspadinha").length,C.vd],["⚡","Relâmpago",pr.filter(p=>p.tipo==="relampago").length,C.rx]].map(([em,l,v,cor])=>(
      <div key={l} style={{background:"#fff",borderRadius:12,padding:"13px",textAlign:"center",border:`1px solid ${C.bd}`}}><div style={{fontSize:22,marginBottom:4}}>{em}</div><div style={{fontWeight:900,fontSize:24,color:cor}}>{v}</div><div style={{fontSize:10,color:C.sb,fontWeight:700}}>{l}</div></div>
    ))}</div>
    <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:`1px solid ${C.bd}`}}>
      {pr.length===0&&<V em="🎁" msg="Nenhum prêmio ainda."/>}
      {[...pr].reverse().map((p,i)=><div key={p.id} style={{padding:"10px 13px",borderBottom:i<pr.length-1?`1px solid ${C.bd}22`:"none",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:p.tipo==="relampago"?C.ouC:C.vdC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.emoji||cfg.premioMeta.emoji}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:C.tx}}>{p.nome}</div><div style={{fontSize:10,color:C.sb}}>{cN(p.clientId)} · {fDT(p.data)}</div></div>
        {cW(p.clientId)&&<a href={`https://wa.me/55${cW(p.clientId)}?text=${encodeURIComponent(`Olá! Seu ${p.nome} está disponível! Venha retirar na Lotérica Central.`)}`} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",borderRadius:8,padding:"5px 9px",fontSize:10,fontWeight:700,textDecoration:"none",flexShrink:0}}>📲</a>}
      </div>)}
    </div>
  </div>);
}

/* ═══════ CONFIG COMPLETA ═══════ */
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

/* ═══════ CONFIG FORMULÁRIO ═══════ */
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
  const[aba,   setAba]   =useState("campos"); // campos | cats | preview

  const catNome=id=>cats.find(c=>c.id===id)?.nome||id;
  const catCor =id=>cats.find(c=>c.id===id)?.cor||C.az;

  function updCampo(id,k,v){setCampos(l=>l.map(c=>c.id===id?{...c,[k]:v}:c));}
  function removeCampo(id){if(!window.confirm("Remover este campo?"))return;setCampos(l=>l.filter(c=>c.id!==id));setEditId(null);}
  function moverCampo(id,dir){setCampos(l=>{const i=l.findIndex(c=>c.id===id);if(dir===-1&&i===0)return l;if(dir===1&&i===l.length-1)return l;const n=[...l];[n[i],n[i+dir]]=[n[i+dir],n[i]];return n;});}
  function addCampo(){if(!novaC.nome.trim()){setMsg("❌ Informe o nome do campo.");return;}if(!novaC.cat){setMsg("❌ Selecione uma categoria.");return;}const c={...novaC,id:uid(),ativo:true};setCampos(l=>[...l,c]);setNovaC({nome:"",emoji:"📦",cat:cats[0]?.id||"",comValor:true,triggerRelampago:false,obrigatorio:false});setShowNC(false);setMsg("");}
  function addCat(){if(!novaG.nome.trim()){setMsg("❌ Informe o nome da categoria.");return;}setCats(l=>[...l,{id:uid(),nome:novaG.nome.trim(),cor:novaG.cor}]);setNovaG({nome:"",cor:"#003478"});setShowNG(false);setMsg("");}
  function removeCat(id){if(!window.confirm("Remover categoria? Os campos desta categoria ficarão sem categoria."))return;setCats(l=>l.filter(c=>c.id!==id));}

  function salvar(){
    setCfg({...cfg,formulario:{cats,campos}});
    DB.save("lc-cfg",{...cfg,formulario:{cats,campos}});
    setMsg("✅ Formulário salvo! O app do cliente já reflete as mudanças.");
    setTimeout(()=>setMsg(""),4000);
  }

  const abas=[{id:"campos",l:"📋 Campos"},{id:"cats",l:"🏷️ Categorias"},{id:"preview",l:"👁️ Preview"}];

  return(<div style={{display:"flex",flexDirection:"column",gap:11}}>
    {/* info box */}
    <div style={{background:`${C.az}0d`,borderRadius:12,padding:"11px 13px",border:`1px solid ${C.az}22`,fontSize:11,color:C.az,lineHeight:1.8}}>
      📝 <strong>Formulário do Cliente</strong><br/>
      Configure os produtos e serviços que o cliente pode selecionar ao registrar a visita (após o código do operador, o número de controle do comprovante, valor total e avaliação de atendimento). Todos os outros campos são opcionais, servem para histórico da visita. Campos com <strong style={{color:C.rx}}>⚡ Relâmpago</strong> habilitam o sorteio automático.
    </div>

    {/* sub-abas */}
    <div style={{display:"flex",gap:5,background:"#fff",borderRadius:11,padding:4,border:`1px solid ${C.bd}`}}>
      {abas.map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11,background:aba===a.id?C.az:"transparent",color:aba===a.id?"#fff":C.sb,transition:"all .2s"}}>{a.l}</button>)}
    </div>

    {/* ── CAMPOS ── */}
    {aba==="campos"&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {cats.map(cat=>{
        const cc=campos.filter(c=>c.cat===cat.id);
        if(cc.length===0)return null;
        return(<div key={cat.id}>
          <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:7}}>
            <div style={{width:3,height:15,borderRadius:4,background:cat.cor}}/>
            <div style={{fontWeight:800,fontSize:11,color:cat.cor,textTransform:"uppercase",letterSpacing:.5}}>{cat.nome}</div>
            <div style={{fontSize:10,color:C.sb}}>({cc.length} campos)</div>
          </div>
          {cc.map((c,i)=>{
            const gi=campos.findIndex(x=>x.id===c.id);
            return(<div key={c.id} style={{background:"#fff",borderRadius:12,border:`1px solid ${c.ativo?cat.cor+"33":C.bd}`,overflow:"hidden",marginBottom:6}}>
              <div style={{padding:"10px 12px",display:"flex",gap:9,alignItems:"center",cursor:"pointer",borderBottom:editId===c.id?`1px solid ${C.bd}`:"none"}} onClick={()=>setEditId(editId===c.id?null:c.id)}>
                <div style={{width:34,height:34,borderRadius:9,background:c.ativo?`${cat.cor}15`:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,color:c.ativo?C.tx:"#9ca3af",textDecoration:c.ativo?"none":"line-through",display:"flex",gap:5,alignItems:"center"}}>
                    {c.nome}
                    {c.obrigatorio&&<span style={{background:C.rdC,color:C.rd,fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:8}}>Obrigatório</span>}
                    {c.triggerRelampago&&<span style={{background:C.rxC,color:C.rx,fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:8}}>⚡ Relâmpago</span>}
                    {c.comValor&&<span style={{background:C.azC,color:C.az,fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:8}}>R$</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  {/* Reordenar */}
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    <button onClick={e=>{e.stopPropagation();moverCampo(c.id,-1);}} style={{background:"none",border:`1px solid ${C.bd}`,borderRadius:4,width:20,height:16,cursor:"pointer",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:C.sb}}>▲</button>
                    <button onClick={e=>{e.stopPropagation();moverCampo(c.id,1);}} style={{background:"none",border:`1px solid ${C.bd}`,borderRadius:4,width:20,height:16,cursor:"pointer",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:C.sb}}>▼</button>
                  </div>
                  {/* Toggle ativo */}
                  <div onClick={e=>{e.stopPropagation();updCampo(c.id,"ativo",!c.ativo);}} style={{width:36,height:20,borderRadius:10,cursor:"pointer",position:"relative",background:c.ativo?C.vd:"#d1d5db",transition:"background .2s",flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:c.ativo?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
                  </div>
                  <span style={{fontSize:13,color:C.sb}}>{editId===c.id?"▲":"▼"}</span>
                </div>
              </div>
              {editId===c.id&&<div style={{padding:"12px 12px",display:"flex",flexDirection:"column",gap:9,background:"#fafcff"}}>
                <div style={{display:"flex",gap:7}}>
                  <div style={{flex:0}}>
                    <label style={LS}>Emoji</label>
                    <input value={c.emoji} onChange={e=>updCampo(c.id,"emoji",e.target.value)} style={{width:48,marginTop:4,padding:"8px 4px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:18,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
                  </div>
                  <div style={{flex:1}}>
                    <label style={LS}>Nome do campo *</label>
                    <input value={c.nome} onChange={e=>updCampo(c.id,"nome",e.target.value)} style={{width:"100%",marginTop:4,...IS}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:7}}>
                  <div style={{flex:1}}>
                    <label style={LS}>Categoria</label>
                    <select value={c.cat} onChange={e=>updCampo(c.id,"cat",e.target.value)} style={{width:"100%",marginTop:4,...IS}}>
                      {cats.map(g=><option key={g.id} value={g.id}>{g.nome}</option>)}
                    </select>
                  </div>
                </div>
                {/* Opções booleanas */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                  {[["comValor","💰 Campo R$","Exibe input de valor"],["triggerRelampago","⚡ Relâmpago","Selecionar habilita sorteio"],["obrigatorio","❗ Obrigatório","Cliente deve selecionar"]].map(([key,label,hint])=>(
                    <div key={key} style={{background:c[key]?`${cat.cor}10`:C.bg,borderRadius:9,padding:"9px 8px",border:`1.5px solid ${c[key]?cat.cor:C.bd}`,cursor:"pointer",textAlign:"center"}} onClick={()=>updCampo(c.id,key,!c[key])}>
                      <div style={{fontSize:13,marginBottom:3}}>{label.slice(0,2)}</div>
                      <div style={{fontWeight:700,fontSize:9,color:c[key]?cat.cor:C.sb,lineHeight:1.3}}>{label.slice(2)}</div>
                      <div style={{fontSize:8,color:C.sb,marginTop:2,lineHeight:1.3}}>{hint}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>removeCampo(c.id)} style={{background:C.rdC,color:C.rd,border:`1px solid ${C.rd}33`,borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑️ Remover este campo</button>
              </div>}
            </div>);
          })}
        </div>);
      })}

      {/* Adicionar novo campo */}
      {!showNC&&<button onClick={()=>{setShowNC(true);setNovaC({nome:"",emoji:"📦",cat:cats[0]?.id||"",comValor:true,triggerRelampago:false,obrigatorio:false});}} style={{background:C.azC,color:C.az,border:`1.5px dashed ${C.az}55`,borderRadius:12,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>➕ Adicionar Novo Campo</button>}
      {showNC&&<div style={{background:"#fff",borderRadius:14,padding:"15px 14px",border:`2px solid ${C.az}44`}}>
        <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:12}}>➕ Novo Campo</div>
        <div style={{display:"flex",gap:7,marginBottom:10}}>
          <div style={{flex:0}}><label style={LS}>Emoji</label><input value={novaC.emoji} onChange={e=>setNovaC({...novaC,emoji:e.target.value})} style={{width:48,marginTop:4,padding:"8px 4px",border:`1.5px solid ${C.bd}`,borderRadius:9,fontSize:18,textAlign:"center",fontFamily:"inherit",outline:"none"}}/></div>
          <div style={{flex:1}}><label style={LS}>Nome *</label><input value={novaC.nome} onChange={e=>setNovaC({...novaC,nome:e.target.value})} placeholder="Ex: Recarga Celular" style={{width:"100%",marginTop:4,...IS}}/></div>
        </div>
        <div style={{marginBottom:10}}><label style={LS}>Categoria *</label>
          <select value={novaC.cat} onChange={e=>setNovaC({...novaC,cat:e.target.value})} style={{width:"100%",marginTop:4,...IS}}><option value="">Selecione…</option>{cats.map(g=><option key={g.id} value={g.id}>{g.nome}</option>)}</select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
          {[["comValor","💰 R$"],["triggerRelampago","⚡ Relâmpago"],["obrigatorio","❗ Obrigatório"]].map(([k,l])=>(
            <div key={k} style={{background:novaC[k]?C.azC:C.bg,borderRadius:9,padding:"9px 8px",border:`1.5px solid ${novaC[k]?C.az:C.bd}`,cursor:"pointer",textAlign:"center"}} onClick={()=>setNovaC({...novaC,[k]:!novaC[k]})}>
              <div style={{fontSize:14,marginBottom:2}}>{l.slice(0,2)}</div>
              <div style={{fontWeight:700,fontSize:10,color:novaC[k]?C.az:C.sb}}>{l.slice(2)}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={addCampo} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:C.az,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✅ Adicionar</button>
          <button onClick={()=>setShowNC(false)} style={{flex:1,padding:"10px",borderRadius:10,background:"#fff",color:C.sb,border:`1px solid ${C.bd}`,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
        </div>
      </div>}
    </div>)}

    {/* ── CATEGORIAS ── */}
    {aba==="cats"&&(<div style={{display:"flex",flexDirection:"column",gap:9}}>
      {cats.map(g=><div key={g.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:`1px solid ${g.cor}44`,display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:g.cor,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:13,color:C.tx}}>{g.nome}</div>
          <div style={{fontSize:10,color:C.sb}}>{campos.filter(c=>c.cat===g.id).length} campos · {g.cor}</div>
        </div>
        <input type="color" value={g.cor} onChange={e=>setCats(l=>l.map(x=>x.id===g.id?{...x,cor:e.target.value}:x))} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.bd}`,cursor:"pointer",padding:2}}/>
        <button onClick={()=>removeCat(g.id)} style={{background:C.rdC,color:C.rd,border:"none",borderRadius:8,padding:"6px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🗑️</button>
      </div>)}

      {!showNG&&<button onClick={()=>setShowNG(true)} style={{background:C.azC,color:C.az,border:`1.5px dashed ${C.az}55`,borderRadius:12,padding:"12px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>➕ Nova Categoria</button>}
      {showNG&&<div style={{background:"#fff",borderRadius:13,padding:"14px",border:`2px solid ${C.az}44`}}>
        <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:11}}>➕ Nova Categoria</div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input value={novaG.nome} onChange={e=>setNovaG({...novaG,nome:e.target.value})} placeholder="Nome da categoria…" style={{flex:1,...IS}}/>
          <input type="color" value={novaG.cor} onChange={e=>setNovaG({...novaG,cor:e.target.value})} style={{width:44,height:44,borderRadius:9,border:`1px solid ${C.bd}`,cursor:"pointer",padding:3}}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={addCat} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:C.az,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✅ Adicionar</button>
          <button onClick={()=>setShowNG(false)} style={{flex:1,padding:"10px",borderRadius:10,background:"#fff",color:C.sb,border:`1px solid ${C.bd}`,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
        </div>
      </div>}
    </div>)}

    {/* ── PREVIEW ── */}
    {aba==="preview"&&(<div style={{display:"flex",flexDirection:"column",gap:9}}>
      <div style={{background:C.azC,borderRadius:11,padding:"10px 12px",border:`1px solid ${C.bd}`,fontSize:11,color:C.az,lineHeight:1.7}}>
        👁️ Prévia de como o formulário aparecerá para o cliente após escanear o QR do operador. Campos inativos não aparecem.
      </div>
      {cats.map(g=>{
        const cc=campos.filter(c=>c.cat===g.id&&c.ativo);
        if(cc.length===0)return null;
        return(<div key={g.id}>
          <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:7}}>
            <div style={{width:3,height:15,borderRadius:4,background:g.cor}}/>
            <div style={{fontWeight:800,fontSize:11,color:g.cor,textTransform:"uppercase",letterSpacing:.5}}>{g.nome}</div>
            <span style={{fontSize:9,color:C.sb}}>(opcional)</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
            {cc.map(c=><div key={c.id} style={{background:"#fff",borderRadius:11,border:`2px solid ${g.cor}22`,padding:"9px 10px",display:"flex",alignItems:"center",gap:7,opacity:.85}}>
              <span style={{fontSize:16}}>{c.emoji}</span>
              <span style={{fontSize:11,fontWeight:700,color:C.tx,flex:1,lineHeight:1.2}}>{c.nome}</span>
              {c.obrigatorio&&<span style={{width:7,height:7,borderRadius:"50%",background:C.rd,flexShrink:0}}/>}
              {c.triggerRelampago&&<span style={{fontSize:9}}>⚡</span>}
            </div>)}
          </div>
        </div>);
      })}
      <div style={{background:C.rxC,borderRadius:11,padding:"10px 12px",border:`1px solid ${C.rx}22`,fontSize:11,color:C.rx,lineHeight:1.6}}>
        ⚡ <strong>{campos.filter(c=>c.ativo&&c.triggerRelampago).length} campo{campos.filter(c=>c.ativo&&c.triggerRelampago).length!==1?"s":""}</strong> habilitam o sorteio de Prêmio Relâmpago.
        <br/>❗ <strong>{campos.filter(c=>c.ativo&&c.obrigatorio).length} campo{campos.filter(c=>c.ativo&&c.obrigatorio).length!==1?"s":""}</strong> obrigatórios.
      </div>
    </div>)}

    {msg&&<div style={{padding:"10px 12px",borderRadius:10,fontSize:12,fontWeight:700,background:msg.startsWith("✅")?C.vdC:C.rdC,color:msg.startsWith("✅")?C.vd:C.rd}}>{msg}</div>}
    <button onClick={salvar} style={{width:"100%",padding:14,borderRadius:13,border:"none",background:`linear-gradient(135deg,${C.az},${C.az2})`,color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.az}44`}}>
      💾 Salvar Formulário — Publicar para o App do Cliente
    </button>
  </div>);
}

/* ═══════ ESTILOS INTERNOS CONFIG ═══════ */
const LS={fontSize:10,fontWeight:800,color:C.sb,textTransform:"uppercase",letterSpacing:.4};
const IS={padding:"10px 12px",border:`1.5px solid ${C.bd}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff"};

function CfgMeta({cfg,setCfg}){
  const[meta,setMeta]=useState(String(cfg.meta));
  const[emoji,setEmoji]=useState(cfg.premioMeta.emoji);
  const[nome,setNome]=useState(cfg.premioMeta.nome);
  const[desc,setDesc]=useState(cfg.premioMeta.desc);
  const[msg,setMsg]=useState("");
  function salvar(){const m=parseInt(meta,10);if(!m||m<1||m>100){setMsg("❌ Meta deve ser entre 1 e 100.");return;}if(!nome.trim()){setMsg("❌ Informe o nome do prêmio.");return;}setCfg({...cfg,meta:m,premioMeta:{nome:nome.trim(),emoji,desc}});setMsg("✅ Meta salva!");setTimeout(()=>setMsg(""),3000);}
  return(<div style={{background:"#fff",borderRadius:16,padding:18,border:`1px solid ${C.bd}`}}>
    <div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:14}}>🎯 Prêmio a cada N autenticações</div>
    <div style={{marginBottom:14}}>
      <label style={L}>📊 Quantidade de autenticações *</label>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:7}}>
        <button onClick={()=>setMeta(s=>String(Math.max(1,parseInt(s||"1",10)-1)))} style={{width:36,height:36,borderRadius:"50%",border:`1.5px solid ${C.bd}`,background:"#fff",fontSize:18,cursor:"pointer",fontFamily:"inherit",color:C.az}}>−</button>
        <input value={meta} onChange={e=>setMeta(e.target.value.replace(/\D/g,""))} style={{width:72,padding:"10px",border:`2px solid ${C.az}`,borderRadius:11,fontSize:22,fontWeight:900,textAlign:"center",fontFamily:"inherit",outline:"none",color:C.az}}/>
        <button onClick={()=>setMeta(s=>String(Math.min(100,parseInt(s||"1",10)+1)))} style={{width:36,height:36,borderRadius:"50%",border:`1.5px solid ${C.bd}`,background:"#fff",fontSize:18,cursor:"pointer",fontFamily:"inherit",color:C.az}}>+</button>
        <div style={{fontSize:12,color:C.sb}}>visitas para<br/>1 prêmio</div>
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
  const[editId,setEditId]=useState(null);
  const[msg,setMsg]=useState("");
  const totP=lista.filter(r=>r.ativo).reduce((s,r)=>s+(parseFloat(r.prob)||0),0);
  const upd=(id,k,v)=>setLista(l=>l.map(r=>r.id===id?{...r,[k]:v}:r));
  function addNovo(){setLista(l=>[...l,{id:uid(),ativo:true,emoji:"🎁",nome:"Novo Prêmio",prob:5,desc:"Você ganhou um prêmio surpresa! Retire no balcão."}]);}
  function remover(id){if(lista.length<=1){setMsg("❌ Mínimo 1 prêmio.");return;}setLista(l=>l.filter(r=>r.id!==id));}
  function salvar(){const inv=lista.filter(r=>!r.nome.trim()||!(parseFloat(r.prob)>0));if(inv.length){setMsg("❌ Todos precisam de nome e probabilidade > 0.");return;}setCfg({...cfg,relampagos:lista.map(r=>({...r,prob:parseFloat(r.prob)||0}))});setMsg("✅ Prêmios relâmpago salvos!");setTimeout(()=>setMsg(""),3000);}
  return(<div style={{display:"flex",flexDirection:"column",gap:10}}>
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
      {[["👥","Clientes",`${cl.length} registros`,()=>csv([["ID","Nome","WhatsApp","Email","Cadastro","Auths","Prêmios"],...cl.map(c=>[c.id,c.nome,c.whats,c.email||"",fD(c.cadastro),c.auths?.length||0,Math.floor((c.auths?.length||0)/cfg.meta)])],`clientes_${hoje()}.csv`)],
        ["🎁","Prêmios",`${pr.length} registros`,()=>csv([["ID","Cliente","Tipo","Nome","Data"],...pr.map(p=>[p.id,cl.find(c=>c.id===p.clientId)?.nome||"",p.tipo,p.nome,fDT(p.data)])],`premios_${hoje()}.csv`)],
        ["✅","Autenticações","Todas as visitas",()=>{const rows=[["Cliente","Operador","Data","Total","Serviços"]];cl.forEach(c=>(c.auths||[]).forEach(a=>rows.push([c.nome,a.opNome||"",fDT(a.data),a.total||0,(a.servicos||[]).join(";")])));csv(rows,`auths_${hoje()}.csv`);}],
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
function Nav({abas,aba,setAba,cor}){return(<nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"#fff",borderTop:`1px solid ${C.bd}`,display:"flex",boxShadow:"0 -4px 18px rgba(0,52,120,.09)",zIndex:100}}>
  {abas.map(a=><button key={a.id} onClick={()=>setAba(a.id)} style={{flex:1,padding:"9px 3px 11px",border:"none",cursor:"pointer",fontFamily:"inherit",background:aba===a.id?"#f0f4fb":"#fff",borderTop:`2.5px solid ${aba===a.id?cor:"transparent"}`,transition:"all .2s"}}>
    <div style={{fontSize:17,marginBottom:2}}>{a.emoji}</div><div style={{fontSize:9,fontWeight:aba===a.id?800:600,color:aba===a.id?cor:C.sb,lineHeight:1}}>{a.label}</div>
  </button>)}
</nav>);}
