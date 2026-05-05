
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add state in ARels
content = content.replace(
  'const[vis,setVis]=useState(15);\n  const isM = adminSel?.role === "master";',
  'const[vis,setVis]=useState(15);\n  const[logDate,setLogDate]=useState("");\n  const isM = adminSel?.role === "master";'
);
content = content.replace(
  'const[vis,setVis]=useState(15);\r\n  const isM = adminSel?.role === "master";',
  'const[vis,setVis]=useState(15);\r\n  const[logDate,setLogDate]=useState("");\r\n  const isM = adminSel?.role === "master";'
);

// 2. Add filter input to admLog
const oldLog = `<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Auditoria Administrativa</div>
          <button onClick={relAdm} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(adminLogs||[]).slice(0,vis).map(l=>(`;

const newLog = `<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:15}}>
          <div style={L}>Auditoria Administrativa</div>
          <div style={{display:"flex",gap:8}}>
            <input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} style={{...IS,padding:"4px 8px"}}/>
            <button onClick={relAdm} style={{background:C.az,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🖨️ PDF</button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(logDate ? (adminLogs||[]).filter(l => l.data.startsWith(logDate)) : (adminLogs||[])).slice(0,vis).map(l=>(`;

// Normalize strings for replace
const normalize = str => str.replace(/\r\n/g, '\n');
let normContent = normalize(content);
normContent = normContent.replace(normalize(oldLog), normalize(newLog));

// 3. Update VerMais
normContent = normContent.replace(
  '<VerMais total={(adminLogs||[]).length} visiveis={vis} setVisiveis={setVis} />',
  '<VerMais total={(logDate ? (adminLogs||[]).filter(l => l.data.startsWith(logDate)) : (adminLogs||[])).length} visiveis={vis} setVisiveis={setVis} />'
);

// 4. Remove version tag
const oldHeader = `<div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>🔒 Administrador <span style={{fontSize:12,fontWeight:400,opacity:.8}}>({adminSel?.nome})</span> <span style={{fontSize:9,background:C.vd,color:"#fff",padding:"2px 6px",borderRadius:5,marginLeft:5}}>v3.6-WHITE-SCREEN-FIX</span></div>`;
const newHeader = `<div style={{marginTop:11,fontWeight:900,fontSize:20,color:"#fff"}}>🔒 Administrador <span style={{fontSize:12,fontWeight:400,opacity:.8}}>({adminSel?.nome})</span></div>`;
normContent = normContent.replace(oldHeader, newHeader);

fs.writeFileSync(file, normContent, 'utf8');
console.log("Done");
