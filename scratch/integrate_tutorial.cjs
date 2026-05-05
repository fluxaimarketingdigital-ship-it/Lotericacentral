
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Update Painel signature
content = content.replace(
  'function Painel({c,setCli,clients,setCl,premios,setPr,cfg,ops,opQR,setOpQR,relamp,setRelamp,setTela}){',
  'function Painel({c,setCli,clients,setCl,premios,setPr,cfg,ops,opQR,setOpQR,relamp,setRelamp,setTela,setShowTutorial}){',
);

// 2. Pass setShowTutorial to Inicio
content = content.replace(
  '{aba==="ini"&&<Inicio c={c} cfg={cfg} meusPr={meusPr} temPr={temPr} nBadge={nBadge} setAba={setAba} premios={premios} encerrada={encerrada}/>}',
  '{aba==="ini"&&<Inicio c={c} cfg={cfg} meusPr={meusPr} temPr={temPr} nBadge={nBadge} setAba={setAba} premios={premios} encerrada={encerrada} setTuto={setShowTutorial}/>}',
);

// 3. Update Inicio signature and add button
content = content.replace(
  'function Inicio({c,cfg,meusPr,temPr,nBadge,setAba,premios,encerrada}){',
  'function Inicio({c,cfg,meusPr,temPr,nBadge,setAba,premios,encerrada,setTuto}){',
);

const oldInicioButton = '<button onClick={()=>encerrada?alert("🚫 A campanha atual já foi encerrada. Aguarde o início do novo ciclo!"):setAba("reg")}';
const newInicioButton = `
    <div onClick={()=>setTuto(true)} style={{textAlign:"center", marginTop:10, marginBottom:16}}>
      <span style={{fontSize:12, fontWeight:800, color:C.az, cursor:"pointer", textDecoration:"underline", display:"flex", alignItems:"center", justifyContent:"center", gap:5}}>
        ❓ Como funciona o programa? Veja o passo a passo
      </span>
    </div>
    <button onClick={()=>encerrada?alert("🚫 A campanha atual já foi encerrada. Aguarde o início do novo ciclo!"):setAba("reg")}`;

content = content.replace(oldInicioButton, newInicioButton);

// 4. Add PassoAPasso component at the end
const tutorialComponent = `
/* ══════════════════════ PASSO A PASSO ══════════════════════ */
function PassoAPasso({onClose}){
  const [passo, setPasso] = useState(0);
  const passos = [
    {
      t: "1. Vá à Lotérica Central",
      d: "Realize qualquer transação (pagamentos, depósitos ou jogos) e guarde seu comprovante físico.",
      img: "./step1.png"
    },
    {
      t: "2. Escaneie seu Cupom",
      d: "Use a câmera do seu celular para escanear o código ou digite os dados manualmente no app.",
      img: "./step2.png"
    },
    {
      t: "3. Junte Pontos",
      d: "Cada visita válida preenche seu cartão. Fique de olho na meta para ganhar o prêmio principal!",
      img: "./step3.png"
    },
    {
      t: "4. Resgate seu Prêmio",
      d: "Assim que completar a meta ou ganhar um prêmio relâmpago, você recebe o voucher no WhatsApp!",
      img: "./step4.png"
    }
  ];

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"pop .3s"}}>
      <div style={{background:"#fff", borderRadius:24, width:"100%", maxWidth:360, overflow:"hidden", position:"relative", boxShadow:"0 20px 50px rgba(0,0,0,0.5)"}}>
        <button onClick={onClose} style={{position:"absolute", top:15, right:15, background:"rgba(0,0,0,0.3)", color:"#fff", border:"none", borderRadius:"50%", width:30, height:30, fontWeight:900, cursor:"pointer", zIndex:10, display:"flex", alignItems:"center", justifyContent:"center"}}>✕</button>
        
        <div style={{height:240, overflow:"hidden", position:"relative"}}>
          <img src={passos[passo].img} style={{width:"100%", height:"100%", objectFit:"cover"}} alt="passo"/>
          <div style={{position:"absolute", bottom:0, left:0, width:"100%", height:80, background:"linear-gradient(to top, #fff, transparent)"}}/>
        </div>

        <div style={{padding:25, textAlign:"center"}}>
          <div style={{fontWeight:900, fontSize:20, color:C.az, marginBottom:10}}>{passos[passo].t}</div>
          <div style={{fontSize:14, color:C.sb, lineHeight:1.6, minHeight:60}}>{passos[passo].d}</div>
          
          <div style={{display:"flex", gap:6, justifyContent:"center", margin:"20px 0"}}>
            {passos.map((_,i)=><div key={i} style={{width:i===passo?20:8, height:8, borderRadius:4, background:i===passo?C.az:C.bd, transition:"all .3s"}}/>)}
          </div>

          <button onClick={()=>passo<3?setPasso(p=>p+1):onClose()} 
            style={{width:"100%", padding:16, borderRadius:14, border:"none", fontWeight:900, background:C.az, color:"#fff", cursor:"pointer", fontSize:16, boxShadow:"0 4px 15px rgba(0,52,120,0.3)"}}>
            {passo<3 ? "Próximo Passo →" : "Entendi, vamos lá!"}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

content += tutorialComponent;

// 5. Final fix for App render (ensuring PassoAPasso is added)
if (!content.includes('<PassoAPasso')) {
  content = content.replace(
    '{relamp && <PremioOvl relamp={relamp} setRelamp={setRelamp} cli={cliAtual} wts={cfg.wts||CFG0.wts}/>}',
    '{relamp && <PremioOvl relamp={relamp} setRelamp={setRelamp} cli={cliAtual} wts={cfg.wts||CFG0.wts}/>}\n      {showTutorial && <PassoAPasso onClose={()=>setShowTutorial(false)}/>}'
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log("Tutorial integrated successfully.");
