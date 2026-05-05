
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

// Update labels
content = content.replace('📷 Enviar Foto do Cupom', '📷 Enviar Foto ou Anexar Comprovante');
content = content.replace('📷 Enviar Foto do Cupom', '📷 Enviar Foto ou Anexar Comprovante'); // double check if there are more
content = content.replace('📸 Tirar Foto / Anexar Arquivo', '📸 Tirar Foto ou Anexar Comprovante');

fs.writeFileSync(file, content, 'utf8');
console.log("Labels updated successfully.");
