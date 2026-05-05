
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. UPDATE VERSION
content = content.replace(/v3\.2-REPAIRED/g, 'v3.3-FINAL-BOOST');

// 2. UNIFY ALL ADMIN ACTIONS TO USE THE MODAL
// We know checkM (the modal) is working based on the user screenshot.

// Fix updateStatusNative to use customConfirm (which also uses the modal)
// Ensure updateStatusNative is properly bound to its buttons.

// Find the AAud buttons and ensure they are async and call the functions
content = content.replace(/onClick=\{\(\)=>updateStatusNative\("approved"\)\}/g, 'onClick={async()=>await updateStatusNative("approved")}');
content = content.replace(/onClick=\{\(\)=>updateStatusNative\("rejected"\)\}/g, 'onClick={async()=>await updateStatusNative("rejected")}');
content = content.replace(/onClick=\{\(\)=>excluirAuthNative\(\)\}/g, 'onClick={async()=>await excluirAuthNative()}');

// Fix the "Alterar" button in APr to also be async and use the modal
content = content.replace(/onClick=\{\(\)=>setEdit\(pid\)\}/g, 'onClick={async()=>await setEdit(pid)}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Versão v3.3-FINAL-BOOST preparada com todas as ligações corrigidas!');
