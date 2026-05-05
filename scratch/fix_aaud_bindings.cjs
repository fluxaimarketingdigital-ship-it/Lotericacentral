
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update version tag
content = content.replace(/v2\.7-FIXED/g, 'v2.8-READY');

// FIX THE BUTTONS IN AAud
const oldButtonBlock = `          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
             {a.valida !== false && s!=="approved" && <button onClick={async ()=>await updateStatus("approved")} style={{flex:1,minWidth:"35%",background:C.vd,color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>✅ Aprovar Autenticação</button>}
             {a.valida !== false && s!=="rejected" && <button onClick={async ()=>await updateStatus("rejected")} style={{flex:1,minWidth:"35%",background:C.rd,color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>❌ Recusar Autenticação</button>}
             <button onClick={async ()=>await excluirAuth()} style={{flex:1,minWidth:"35%",background:"#374151",color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>🗑️ Excluir Autenticação</button>
          </div>`;

const newButtonBlock = `          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {a.valida !== false && s!=="approved" && <button onClick={()=>updateStatusNative("approved")} style={{flex:1,minWidth:"35%",background:C.vd,color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>✅ Aprovar Autenticação</button>}
            {a.valida !== false && s!=="rejected" && <button onClick={()=>updateStatusNative("rejected")} style={{flex:1,minWidth:"35%",background:C.rd,color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>❌ Recusar Autenticação</button>}
            <button onClick={()=>excluirAuthNative()} style={{flex:1,minWidth:"35%",background:"#374151",color:"#fff",border:"none",borderRadius:10,padding:"10px 8px",fontSize:12,fontWeight:800,cursor:"pointer"}}>🗑️ Excluir Autenticação</button>
          </div>`;

// Regex attempt first
if (content.includes('updateStatus("approved")')) {
    content = content.replace(/onClick=\{async \(\)=>await updateStatus\("approved"\)\}/g, 'onClick={()=>updateStatusNative("approved")}');
    content = content.replace(/onClick=\{async \(\)=>await updateStatus\("rejected"\)\}/g, 'onClick={()=>updateStatusNative("rejected")}');
    content = content.replace(/onClick=\{async \(\)=>await excluirAuth\(\)\}/g, 'onClick={()=>excluirAuthNative()}');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Botões de AAud vinculados corretamente via script!');
} else {
    console.log('❌ Não foi possível localizar os botões de AAud.');
}
