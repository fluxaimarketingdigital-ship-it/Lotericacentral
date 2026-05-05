
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add niverHoje to ADash
const oldHook = `const prontos=useMemo(() => {
    if(encerrada) return [];
    return cl.filter(c => 
      pr.some(p => p.clientId === c.id && p.tipo === "raspadinha" && p.status === "pending")
    );
  }, [cl, pr, encerrada]);`;

const newHook = `const prontos=useMemo(() => {
    if(encerrada) return [];
    return cl.filter(c => 
      pr.some(p => p.clientId === c.id && p.tipo === "raspadinha" && p.status === "pending")
    );
  }, [cl, pr, encerrada]);
  
  const niverHoje = useMemo(() => {
    const hj = new Date().toLocaleString("pt-BR", {timeZone:"America/Sao_Paulo"}).slice(0,5).replace("/", "");
    return cl.filter(c => c.nasc && c.nasc.slice(0,4) === hj);
  }, [cl]);`;

let normContent = content.replace(/\r\n/g, '\n');
normContent = normContent.replace(oldHook.replace(/\r\n/g, '\n'), newHook.replace(/\r\n/g, '\n'));

// 2. Add niverHoje UI
const oldUi = `      </div>);})}
    </div>}`;

const newUi = `      </div>);})}
    </div>}
    
    {niverHoje.length > 0 && (
      <div style={{background:"#fff",borderRadius:13,overflow:"hidden",border:\`2px solid \${C.rx}55\`,boxShadow:\`0 4px 14px \${C.rx}22\`,marginBottom:11,animation:"pop .4s"}}>
        <div style={{background:C.rx,padding:"9px 13px",display:"flex",gap:7,alignItems:"center"}}><span style={{fontSize:16}}>🎂</span><span style={{fontWeight:800,fontSize:12,color:"#fff"}}>{niverHoje.length} Aniversariante{niverHoje.length>1?"s":""} Hoje!</span></div>
        {niverHoje.map(c => {
          const wMsg = encodeURIComponent(\`Olá \${c.nome}! 🎉\\nA equipe da *Lotérica Central* lhe deseja um Feliz Aniversário! Que seu dia seja cheio de alegrias e muita sorte! 🍀🎂\`);
          const wLink = \`https://wa.me/55\${c.whats}?text=\${wMsg}\`;
          return (
            <div key={c.id} style={{padding:"9px 13px",borderBottom:\`1px solid \${C.bd}\`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:800,fontSize:12,color:C.tx}}>{c.nome}</div><div style={{fontSize:10,color:C.sb}}>{c.whats ? fmtW(c.whats) : "Sem número"}</div></div>
              <a href={wLink} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:10,fontWeight:800,textDecoration:"none",display:"inline-block",boxShadow:"0 2px 5px rgba(37,211,102,.4)"}}>💬 Dar Parabéns</a>
            </div>
          );
        })}
      </div>
    )}`;

normContent = normContent.replace(oldUi.replace(/\r\n/g, '\n'), newUi.replace(/\r\n/g, '\n'));

fs.writeFileSync(file, normContent, 'utf8');
console.log("NiverHoje added successfully.");
