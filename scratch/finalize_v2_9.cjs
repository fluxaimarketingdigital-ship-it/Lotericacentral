
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update version tag
content = content.replace(/v2\.8-READY/g, 'v2.9-GOLD');

// 1. RE-ENABLE PromptModal system for all actions
// We will replace the native calls with custom modal calls now that we know the path is clear.

// Fix excluirAuthNative to use checkM (which uses the modal)
content = content.replace(/const s = window\.prompt\("Tem certeza que deseja EXCLUIR permanentemente\? Digite a Senha de Alteração:"\);[\s\S]*?if\(s !== \(adminSel\.senhaMestra || "123456"\)\) \{[\s\S]*?if\(s !== null\) alert\("❌ Senha incorreta!"\);[\s\S]*?return;[\s\S]*?\}/, 
`if(!(await checkM("Tem certeza que deseja EXCLUIR esta autenticação permanentemente? Digite sua Senha de Alteração e Exclusão:"))) return;`);

// Fix updateStatusNative to use customConfirm
content = content.replace(/if\(newS==="rejected" && !window\.confirm\("Deseja realmente RECUSAR esta autenticação\?"\)\) return;/, 
`if(newS==="rejected" && !(await customConfirm("Recusar Autenticação", "Deseja realmente RECUSAR esta autenticação?", "❌", "Sim, Recusar"))) return;`);

// 2. Fix the "Alterar Data" (updPrize) in APr component
// We need to find where the "Alterar" button is and make sure it's async and points to the right place.

// First, ensure updPrize uses checkM for "manual" date changes
content = content.replace(/const updPrize = async \(pid, newS\) => \{/, 
`const updPrize = async (pid, newS) => {
    if(newS === "manual" && !(await checkM("Para alterar a data de validade, digite sua Senha de Alteração:"))) return;`);

// 3. Final polish on the Modal visibility (ensuring it's not blocked)
content = content.replace(/zIndex:99999/g, 'zIndex:1000000');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Versão v2.9-GOLD preparada com sucesso!');
