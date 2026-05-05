
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

const tutorialComponent = `
/* ══════════════════════ PASSO A PASSO ══════════════════════ */
function PassoAPasso({onClose}){
  const [passo, setPasso] = useState(0);
  const passos = [
    {
      t: "1. Vá à Lotérica",
      d: "Realize qualquer transação (pagamentos, depósitos ou jogos) e guarde seu comprovante físico.",
      img: "/step1.png"
    },
    {
      t: "2. Envie seu Cupom",
      d: "Tire uma foto nítida do seu comprovante ou selecione uma imagem da sua galeria para registrar.",
      img: "/step2.png"
    },
    {
      t: "3. Junte Pontos",
      d: "Fique de olho na barra de progresso ao preencher! Veja se sua operação atingiu o valor mínimo para pontuar.",
      img: "/step3.png"
    },
    {
      t: "4. Acompanhe o Progresso",
      d: "Consulte seu histórico na aba 'Conta'. Todos os registros são auditados pela nossa equipe para sua segurança.",
      img: "/step4.png"
    },
    {
      t: "5. Prêmios e Resgate",
      d: "Ganhou? O voucher vai para o seu WhatsApp e aba 'Prêmios' após a auditoria. Fique atento ao prazo de validade!",
      img: "/step5.png"
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

          <button onClick={()=>passo < passos.length - 1 ? setPasso(p=>p+1) : onClose()} 
            style={{width:"100%", padding:16, borderRadius:14, border:"none", fontWeight:900, background:C.az, color:"#fff", cursor:"pointer", fontSize:16, boxShadow:"0 4px 15px rgba(0,52,120,0.3)"}}>
            {passo < passos.length - 1 ? "Próximo Passo →" : "Entendi, vamos lá!"}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

// Replace the old PassoAPasso component
const oldStart = content.indexOf('/* ══════════════════════ PASSO A PASSO ══════════════════════ */');
if (oldStart !== -1) {
  content = content.substring(0, oldStart) + tutorialComponent;
}

fs.writeFileSync(file, content, 'utf8');
console.log("Tutorial updated with new images and steps.");
