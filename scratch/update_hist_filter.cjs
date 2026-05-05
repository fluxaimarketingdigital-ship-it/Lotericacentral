
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add histFilter state
const normalize = str => str.replace(/\r\n/g, '\n');
content = normalize(content);

content = content.replace(
  'const[logDate,setLogDate]=useState("");\n  const isM = adminSel?.role === "master";',
  'const[logDate,setLogDate]=useState("");\n  const[histFilter,setHistFilter]=useState("");\n  const isM = adminSel?.role === "master";'
);

// 2. Add filter to hist tab
const oldHist = `{aba==="hist" && (
      <div style={{display:"flex",flexDirection:"column",gap:10,animation:"up .3s"}}>
        {campanhas.length === 0 && <V em="📚" msg="Ainda não existem campanhas encerradas no histórico." />}
        {campanhas.map(camp => (`;

const newHist = `{aba==="hist" && (
      <div style={{display:"flex",flexDirection:"column",gap:10,animation:"up .3s"}}>
        <input type="text" placeholder="🔍 Buscar campanha por nome ou data (ex: 04/2026)" value={histFilter} onChange={e=>setHistFilter(e.target.value)} style={{...I, padding:"10px 14px", fontSize:12, borderRadius:12}} />
        {campanhas.filter(c => !histFilter || (c.nome||"").toLowerCase().includes(histFilter.toLowerCase()) || fD(c.inicio).includes(histFilter) || fDT(c.dataFechamento).includes(histFilter)).length === 0 && <V em="📚" msg={campanhas.length === 0 ? "Ainda não existem campanhas encerradas no histórico." : "Nenhuma campanha encontrada com esse filtro."} />}
        {campanhas.filter(c => !histFilter || (c.nome||"").toLowerCase().includes(histFilter.toLowerCase()) || fD(c.inicio).includes(histFilter) || fDT(c.dataFechamento).includes(histFilter)).map(camp => (`;

content = content.replace(oldHist, newHist);

fs.writeFileSync(file, content, 'utf8');
console.log("Hist filter added successfully.");
