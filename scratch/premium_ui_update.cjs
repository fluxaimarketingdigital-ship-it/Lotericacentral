
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

const updatedPassoAPasso = `
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
    <div style={{position:"fixed", inset:0, background:"rgba(0,10,30,0.92)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)", animation:"pop .4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"}}>
      <div style={{background:"#fff", borderRadius:32, width:"100%", maxWidth:380, overflow:"hidden", position:"relative", boxShadow:"0 30px 70px rgba(0,0,0,0.6)", border:"1px solid rgba(255,255,255,0.1)"}}>
        <button onClick={onClose} style={{position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.9)", color:"#000", border:"none", borderRadius:"50%", width:34, height:34, fontWeight:900, cursor:"pointer", zIndex:20, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 10px rgba(0,0,0,0.2)"}}>✕</button>
        
        <div style={{height:280, overflow:"hidden", position:"relative", background:"#000", display:"flex", alignItems:"center", justifyContent:"center"}}>
          {/* Dynamic Blurred Background per step */}
          <div style={{
            position:"absolute", 
            inset:0, 
            backgroundImage:\`url(\${passos[passo].img})\`, 
            backgroundSize:"cover", 
            backgroundPosition:"center",
            filter:"blur(25px) brightness(0.7)",
            opacity:0.8,
            transform:"scale(1.2)",
            transition:"background-image 0.5s ease"
          }}/>
          
          <img src={passos[passo].img} style={{
            maxWidth:"90%", 
            maxHeight:"85%", 
            objectFit:"contain", 
            position:"relative", 
            zIndex:10,
            borderRadius:12,
            boxShadow:"0 15px 35px rgba(0,0,0,0.4)",
            animation: "fadeIn .5s"
          }} alt="passo"/>
          
          <div style={{position:"absolute", bottom:0, left:0, width:"100%", height:60, background:"linear-gradient(to top, rgba(0,0,0,0.4), transparent)", zIndex:11}}/>
        </div>

        <div style={{padding:30, textAlign:"center", background:"#fff", borderTop:"4px solid " + C.az}}>
          <div style={{fontWeight:900, fontSize:22, color:C.az, marginBottom:12, letterSpacing:"-0.5px"}}>{passos[passo].t}</div>
          <div style={{fontSize:15, color:C.sb, lineHeight:1.7, minHeight:75}}>{passos[passo].d}</div>
          
          <div style={{display:"flex", gap:8, justifyContent:"center", margin:"25px 0"}}>
            {passos.map((_,i)=><div key={i} style={{width:i===passo?24:10, height:10, borderRadius:5, background:i===passo?C.az:C.bd, transition:"all .4s cubic-bezier(0.4, 0, 0.2, 1)"}}/>)}
          </div>

          <button onClick={()=>passo < passos.length - 1 ? setPasso(p=>p+1) : onClose()} 
            style={{width:"100%", padding:18, borderRadius:16, border:"none", fontWeight:900, background:C.az, color:"#fff", cursor:"pointer", fontSize:17, boxShadow:"0 8px 25px rgba(0,52,120,0.4)", transition:"transform .2s", ":active":{transform:"scale(0.98)"}}}>
            {passo < passos.length - 1 ? "Próximo Passo →" : "Entendi, vamos lá!"}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

// Replace component
const startMarker = '/* ══════════════════════ PASSO A PASSO ══════════════════════ */';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf('/* ══════════════════════ INICIO ══════════════════════ */');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + updatedPassoAPasso + "\n\n" + content.substring(endIndex);
}

// Add some global UI improvements (shadows, transitions)
content = content.replace(/boxShadow:"0 1px 3px rgba\(0,0,0,0.1\)"/g, 'boxShadow:"0 8px 20px rgba(0,0,0,0.06)", border:"1px solid rgba(0,0,0,0.03)"');
content = content.replace(/borderRadius:12/g, 'borderRadius:18'); // Smoother corners

fs.writeFileSync(file, content, 'utf8');
console.log("Tutorial and global UI updated with premium aesthetic.");
