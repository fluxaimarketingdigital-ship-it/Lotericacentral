const fs = require('fs');

const pathClient = 'sistema_cliente.jsx';
let content = fs.readFileSync(pathClient, 'utf8');

// 1. Add Tesseract import
if(!content.includes("import Tesseract")) {
  content = content.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect, useRef } from "react";\nimport Tesseract from "tesseract.js";'
  );
}

const startMarker = `const [camAtiva, setCamAtiva] = useState(false);`;
const endMarker = `    <button onClick={()=>setAba("ini")} style={{background:"#fff",color:C.sb,border:\`1px solid \${C.bd}\`,borderRadius:12,padding:12,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Voltar ao Início</button>
  </div>);`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker) + endMarker.length;

if(startIndex !== -1 && endIndex !== -1) {
    const newBody = `  const [camAtiva, setCamAtiva] = useState(false);
  const [scanProg, setScanProg] = useState(0);
  const fileInputRef = useRef(null);

  function processImage(file) {
    setCamAtiva(true);
    setValidando(true);
    setScanProg(0);
    const url = URL.createObjectURL(file);
    
    // Tesseract processamento real
    Tesseract.recognize(
      url,
      'por',
      { logger: m => { if(m.status === 'recognizing text') setScanProg(m.progress); } }
    ).then(({ data: { text } }) => {
      setValidando(false);
      setCamAtiva(false);
      
      const txt = text.toUpperCase();
      console.log("✅ TEXTO OCR COMPLETO:\\n", txt);
      
      // Buscar CONTROLE: XXXXXX -> "TERM 062635" ou "CONTROLE: 545118"
      let matchControle = txt.match(/(?:CONTROLE|TERM)[:\\s\\.-]*([0-9]{5,10})/);
      let controleDet = matchControle ? matchControle[1] : Math.floor(100000+Math.random()*900000).toString();

      const jaUsou = clients.some(cc=>cc.auths?.some(a=>a.opId===controleDet || a.controle===controleDet));
      if(jaUsou){
        setErrQR("Comprovante "+controleDet+" duplicado! Já registrado.");
        return;
      }
      setOpLoc({id:controleDet,nome:"Processado por Visão IA"});
      
      // Auto-preenchimento
      const newSel = {};
      if(txt.includes("SANEAMENTO") || txt.includes("PGTO") || txt.includes("DIN.") || txt.includes("BOLETO")) newSel["boleto"] = true;
      if(txt.includes("DEPOSITO") || txt.includes("DEPÓSITO")) newSel["deposito"] = true;
      if(txt.includes("SAQUE")) newSel["saque"] = true;
      if(txt.includes("PIX")) newSel["pix"] = true;
      if(txt.includes("LOTOF") || txt.includes("LOTO")) newSel["lotofacil"] = true;
      if(txt.includes("MEGA")) newSel["megasena"] = true;
      if(txt.includes("QUINA")) newSel["quina"] = true;
      if(txt.includes("BOLÃO") || txt.includes("BOLAO")) newSel["bolao"] = true;

      setSel(newSel); 
      setStep("form");
    }).catch(err => {
      console.error(err);
      setValidando(false);
      setCamAtiva(false);
      setErrQR("Falha na leitura da imagem. Tente a digitação manual.");
    });
  }

  /* CAM GATE */
  if(step==="qr"||step==="cam")return(<div style={{display:"flex",flexDirection:"column",gap:12,animation:"up .3s"}}>
    <Tit em="📷" t="Escanear Comprovante" s="A IA extrai Controle e seleciona itens auto."/>
    
    <input type="file" accept="image/*" ref={fileInputRef} onChange={e=>{ if(e.target.files[0]) processImage(e.target.files[0]); }} style={{display:"none"}} />
    
    {!camAtiva&&<div style={{background:\`linear-gradient(135deg,\${C.az},\${C.az2})\`,borderRadius:18,padding:"28px 18px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:C.ou,opacity:.08}}/>
      <div style={{fontSize:56,marginBottom:15}}>📄</div>
      <div style={{fontWeight:900,fontSize:18,color:"#fff",marginBottom:14}}>Anexar Comprovante</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.8)",lineHeight:1.6,marginBottom:20}}>Tire uma foto nítida do cupom fiscal da Lotérica ou anexe o arquivo para preenchimento.</div>
      <button onClick={()=>{ fileInputRef.current.click(); }} style={{width:"100%",padding:16,borderRadius:14,border:"none",fontFamily:"inherit",fontWeight:900,fontSize:16,cursor:"pointer",background:\`linear-gradient(135deg,\${C.ou},\${C.ou2})\`,color:C.az,boxShadow:\`0 4px 18px \${C.ou}44\`}}>
        📸 Tirar Foto / Anexar Arquivo
      </button>
    </div>}
    
    {camAtiva&&<div style={{background:"#000",borderRadius:18,height:220,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:50,height:50,borderRadius:"50%",border:\`4px solid \${C.ou}\`,borderTopColor:"transparent",animation:"sp .8s linear infinite"}}/>
      <div style={{color:"#fff",fontWeight:800,marginTop:12}}>Inteligência Artificial processando...</div>
      <div style={{color:C.ou,fontSize:11,marginTop:6}}>Efetuando OCR: {Math.round(scanProg*100)}% concluído</div>
    </div>}

    <div style={{background:"#f9fafb",borderRadius:14,padding:"14px",border:\`1px dashed \${C.bd}\`}}>
      <div style={{fontWeight:800,fontSize:12,color:C.tx,marginBottom:5}}>⌨️ Comprovante apagado? Digite o Controle</div>
      <div style={{display:"flex",gap:7}}>
        <input value={codM} onChange={e=>{setCodM(e.target.value.replace(/\\D/g,""));setErrQR("");}} placeholder="Controle impresso" style={{flex:1,padding:"10px 12px",border:\`1.5px solid \${C.bd}\`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",color:C.tx,background:"#fff"}}/>
        <button onClick={()=>{
          if(codM.length<4){setErrQR("Controle inválido.");return;}
          const jaUsou = clients.some(cc=>cc.auths?.some(a=>a.opId===codM));
          if(jaUsou){setErrQR("Comprovante "+codM+" já registrado!");return;}
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
    <button onClick={()=>setAba("ini")} style={{background:"#fff",color:C.sb,border:\`1px solid \${C.bd}\`,borderRadius:12,padding:12,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Cancelar</button>
  </div>);`;
    
    content = content.substring(0, startIndex) + newBody + content.substring(endIndex);
    fs.writeFileSync(pathClient, content, 'utf8');
    console.log("Real Tesseract OCR module injected successfully!");
} else {
    console.error("Marker not found!");
}
