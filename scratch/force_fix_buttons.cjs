
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Arquivo lido. Tamanho:', content.length);

if (content.includes('onClick={()=>updateStatus("rejected")}') ) {
   content = content.split('onClick={()=>updateStatus("approved")}').join('onClick={async ()=>await updateStatus("approved")}');
   content = content.split('onClick={()=>updateStatus("rejected")}').join('onClick={async ()=>await updateStatus("rejected")}');
   content = content.split('onClick={excluirAuth}').join('onClick={async ()=>await excluirAuth()}');
   fs.writeFileSync(filePath, content, 'utf8');
   console.log('✅ Botões corrigidos via substituição de string!');
} else {
   console.log('❌ Não foi possível localizar o código dos botões no arquivo original.');
}
