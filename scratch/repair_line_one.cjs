
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. REMOVE THE BROKEN LINE 1 (THE INTRUDER)
// The file should start with "/**" or "import"
if (content.startsWith('if(!(await checkM')) {
    console.log('⚠️ Detectado código intruso na linha 1. Limpando...');
    content = content.substring(content.indexOf('/**'));
}

// 2. UPDATE VERSION
content = content.replace(/v3\.0-FINAL/g, 'v3.2-REPAIRED');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Arquivo sistema_operador.jsx limpo e reparado!');
