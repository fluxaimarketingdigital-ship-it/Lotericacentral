const fs = require('fs');

const pathClient = 'sistema_cliente.jsx';
let content = fs.readFileSync(pathClient, 'utf8');

// 1. Atualizar o Menu "Inicio"
content = content.replace(
  '<div><div style={{fontSize:12,fontWeight:700,marginBottom:3,opacity:.8}}>Operador gerou seu QR?</div><div style={{fontSize:18,fontWeight:900}}>📱 Registrar Autenticação</div></div>',
  '<div><div style={{fontSize:12,fontWeight:700,marginBottom:3,opacity:.8}}>Comprovante em mãos?</div><div style={{fontSize:18,fontWeight:900}}>📷 Escanear Comprovante</div></div>'
);
content = content.replace(
  '<span style={{fontSize:38}}>🏪</span>',
  '<span style={{fontSize:38}}>📄</span>'
);

// 2. Modificar FormAuth QR GATE
const qrGateOld = `  /* QR GATE */
  if(step==="qr")return(<div style={{display:"flex",flexDirection:"column",gap:12,animation:"up .3s"}}>
    <Tit em="📱" t="Registrar Autenticação" s="Solicite o código à operadora"/>
    <div style={{background:\`linear-gradient(135deg,\${C.az},\${C.az2})\`,borderRadius:18,padding:"22px 18px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:C.ou,opacity:.08}}/>
      <div style={{fontSize:52,marginBottom:10}}>📷</div>
      <div style={{fontWeight:900,fontSize:17,color:"#fff",marginBottom:11}}>Peça o Código à Operadora</div>
      {[["1️⃣","Conclua seus serviços no caixa"],["2️⃣","Peça o código de identificação da operadora"],["3️⃣","Informe o código e os dados do comprovante"],["4️⃣","O formulário será validado instantaneamente"]].map(([n,t])=>(
        <div key={n} style={{display:"flex",gap:9,alignItems:"center",textAlign:"left",marginBottom:8}}>
          <span style={{fontSize:16,flexShrink:0}}>{n}</span>
          <span style={{fontSize:12,color:"rgba(255,255,255,.8)",lineHeight:1.4}}>{t}</span>
        </div>
      ))}
    </div>
    <div style={{background:"#f9fafb",borderRadius:14,padding:"14px",border:\`1px dashed \${C.bd}\`}}>
      <div style={{fontWeight:800,fontSize:12,color:C.tx,marginBottom:5}}>⌨️ Alternativa: código manual</div>
      <div style={{display:"flex",gap:7}}>
        <input value={codM} onChange={e=>{setCodM(e.target.value);setErrQR("");}} onKeyDown={e=>e.key==="Enter"&&validarCod()} placeholder="Código do operador…" style={{flex:1,padding:"10px 12px",border:\`1.5px solid \${C.bd}\`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff"}}/>
        <button onClick={validarCod} disabled={validando}
          style={{background:validando?"#9ca3af":C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:validando?"not-allowed":"pointer",fontFamily:"inherit",minWidth:52}}>
          {validando?"…":"OK"}
        </button>
      </div>
      {errQR&&<div style={{marginTop:7,fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {errQR}</div>}
    </div>
    <button onClick={()=>setAba("ini")} style={{background:"#fff",color:C.sb,border:\`1px solid \${C.bd}\`,borderRadius:12,padding:12,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Voltar ao Início</button>
  </div>);`;

const qrGateNew = `  const [camAtiva, setCamAtiva] = useState(false);

  /* CAM GATE */
  if(step==="qr"||step==="cam")return(<div style={{display:"flex",flexDirection:"column",gap:12,animation:"up .3s"}}>
    <Tit em="📷" t="Escanear Comprovante" s="A IA fará a leitura automaticamente"/>
    
    {!camAtiva&&<div style={{background:\`linear-gradient(135deg,\${C.az},\${C.az2})\`,borderRadius:18,padding:"28px 18px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:C.ou,opacity:.08}}/>
      <div style={{fontSize:56,marginBottom:15}}>📄</div>
      <div style={{fontWeight:900,fontSize:18,color:"#fff",marginBottom:14}}>Comprovante em mãos?</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.8)",lineHeight:1.6,marginBottom:20}}>Para valer a autenticação desta visita, escaneie o cupom fiscal impresso pelo caixa.</div>
      <button onClick={()=>{setCamAtiva(true);setErrQR("");}} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:16,cursor:"pointer",background:\`linear-gradient(135deg,\${C.ou},\${C.ou2})\`,color:C.az,boxShadow:\`0 4px 18px \${C.ou}44\`}}>
        📸 Abrir Câmera
      </button>
    </div>}
    
    {camAtiva&&<div style={{background:"#000",borderRadius:18,height:320,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      {!validando?<>
        <div style={{border:"2px solid rgba(245,168,0,.7)",width:"80%",height:"70%",borderRadius:10,position:"relative"}}>
          <div style={{position:"absolute",top:-10,left:-10,width:20,height:20,borderTop:"3px solid #f5a800",borderLeft:"3px solid #f5a800",borderRadius:"6px 0 0 0"}}/>
          <div style={{position:"absolute",top:-10,right:-10,width:20,height:20,borderTop:"3px solid #f5a800",borderRight:"3px solid #f5a800",borderRadius:"0 6px 0 0"}}/>
          <div style={{position:"absolute",bottom:-10,left:-10,width:20,height:20,borderBottom:"3px solid #f5a800",borderLeft:"3px solid #f5a800",borderRadius:"0 0 0 6px"}}/>
          <div style={{position:"absolute",bottom:-10,right:-10,width:20,height:20,borderBottom:"3px solid #f5a800",borderRight:"3px solid #f5a800",borderRadius:"0 0 6px 0"}}/>
        </div>
        <div style={{color:"#fff",fontSize:12,fontWeight:700,marginTop:20}}>Centralize o comprovante</div>
        <button onClick={()=>{
          setValidando(true);
          setTimeout(()=>{
            setValidando(false);
            setCamAtiva(false);
            const controleRandom=Math.floor(10000+Math.random()*90000).toString();
            // Verifica Duplicidade do Controle globalmente
            const jaUsou = clients.some(cc=>cc.auths?.some(a=>a.opId===controleRandom));
            if(jaUsou){
              setErrQR("Comprovante duplicado! Já registrado.");
              return;
            }
            setOpLoc({id:controleRandom,nome:"Extração por IA"});
            // Preenchimento de IA "falso" para o protótipo:
            const triggerJogo = Math.random() > 0.5;
            const newSel = {"boleto": "50.00"};
            if (triggerJogo) newSel["lotofacil"] = "15.00";
            setSel(newSel); 
            setStep("form");
          }, 2500);
        }} style={{position:"absolute",bottom:20,width:60,height:60,borderRadius:"50%",background:"#fff",border:"none",cursor:"pointer",boxShadow:"0 0 0 4px rgba(255,255,255,.3)"}}/>
        <button onClick={()=>setCamAtiva(false)} style={{position:"absolute",top:15,right:15,background:"none",border:"none",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",padding:10}}>X</button>
      </>:<>
        <div style={{width:50,height:50,borderRadius:"50%",border:\`4px solid \${C.ou}\`,borderTopColor:"transparent",animation:"sp .8s linear infinite"}}/>
        <div style={{color:"#fff",fontWeight:800,marginTop:12}}>Avaliando campanha via IA...</div>
      </>}
    </div>}

    <div style={{background:"#f9fafb",borderRadius:14,padding:"14px",border:\`1px dashed \${C.bd}\`}}>
      <div style={{fontWeight:800,fontSize:12,color:C.tx,marginBottom:5}}>⌨️ Câmera falhou? Insira o Controle manualmente</div>
      <div style={{display:"flex",gap:7}}>
        <input value={codM} onChange={e=>{setCodM(e.target.value.replace(/\\D/g,""));setErrQR("");}} placeholder="Controle impresso" style={{flex:1,padding:"10px 12px",border:\`1.5px solid \${C.bd}\`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff"}}/>
        <button onClick={()=>{
          if(codM.length<4){setErrQR("Controle inválido.");return;}
          const jaUsou = clients.some(cc=>cc.auths?.some(a=>a.opId===codM));
          if(jaUsou){setErrQR("Comprovante já registrado!");return;}
          setOpLoc({id:codM,nome:"Inserção Manual"});
          setSel({});
          setStep("form");
        }} disabled={validando||camAtiva}
          style={{background:(validando||camAtiva)?"#9ca3af":C.az,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:800,fontSize:13,cursor:(validando||camAtiva)?"not-allowed":"pointer",fontFamily:"inherit",minWidth:52}}>
          OK
        </button>
      </div>
      {errQR&&<div style={{marginTop:7,fontSize:11,color:C.rd,fontWeight:700}}>⚠️ {errQR}</div>}
    </div>
    <button onClick={()=>setAba("ini")} style={{background:"#fff",color:C.sb,border:\`1px solid \${C.bd}\`,borderRadius:12,padding:12,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Voltar ao Início</button>
  </div>);`;

content = content.replace(qrGateOld, qrGateNew);

// 3. Atualizar Validação
const headValidadoOld = `    {/* Operador validado */}
    <div style={{background:C.vdC,borderRadius:14,padding:"13px 15px",border:\`1.5px solid \${C.vd}44\`,display:"flex",gap:11,alignItems:"center"}}>
      <div style={{width:42,height:42,borderRadius:12,background:C.vd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✅</div>
      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:12,color:C.vd}}>Código validado!</div><div style={{fontWeight:900,fontSize:14,color:C.tx}}>Operador: {opLoc?.nome||"—"}</div></div>
      <button onClick={()=>{setOpLoc(null);setOpQR(null);setStep("qr");}} style={{background:"none",border:\`1px solid \${C.vd}44\`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.vd,cursor:"pointer",fontFamily:"inherit"}}>Trocar</button>
    </div>`;

const headValidadoNew = `    {/* Comprovante validado */}
    <div style={{background:C.vdC,borderRadius:14,padding:"13px 15px",border:\`1.5px solid \${C.vd}44\`,display:"flex",gap:11,alignItems:"center",animation:"pop .5s ease"}}>
      <div style={{width:42,height:42,borderRadius:12,background:C.vd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📄</div>
      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:12,color:C.vd}}>Cupom Lido com Sucesso!</div><div style={{fontWeight:900,fontSize:14,color:C.tx}}>Controle: {opLoc?.id||"—"}</div></div>
      <button onClick={()=>{setOpLoc(null);setOpQR(null);setStep("cam");}} style={{background:"none",border:\`1px solid \${C.vd}44\`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.vd,cursor:"pointer",fontFamily:"inherit"}}>Repetir</button>
    </div>`;

content = content.replace(headValidadoOld, headValidadoNew);

// 4. Update Instruções Pós-Leitura
const instrucaoOld = `    {/* Instrução */}
    <div style={{background:"#fff",borderRadius:14,padding:"13px 14px",border:\`1px solid \${C.bd}\`}}>
      <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
        <div style={{width:38,height:38,borderRadius:11,background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🛍️</div>
        <div><div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:3}}>O que você fez hoje?</div><div style={{fontSize:11,color:C.sb,lineHeight:1.6}}>Selecione os produtos utilizados (opcional) e avalie o atendimento.</div></div>
      </div>
    </div>`;

const instrucaoNew = `    {/* Instrução Pos Leitura */}
    <div style={{background:"#fff",borderRadius:14,padding:"13px 14px",border:\`1px solid \${C.bd}\`}}>
      <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
        <div style={{width:38,height:38,borderRadius:11,background:C.azC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>✨</div>
        <div><div style={{fontWeight:800,fontSize:13,color:C.tx,marginBottom:3}}>Campanha verificada</div><div style={{fontSize:11,color:C.sb,lineHeight:1.6}}>Abaixo os itens identificados via IA. Você também pode preencher ou corrigir (opcional). Avalie o atendimento abaixo.</div></div>
      </div>
    </div>`;

content = content.replace(instrucaoOld, instrucaoNew);

// Write changes
fs.writeFileSync(pathClient, content, 'utf8');
console.log("sistema_cliente.jsx successfully rewritten via OCR refactoring rules.");
