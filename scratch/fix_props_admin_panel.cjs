
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The ultimate fix for the props passing inside AdminPanel
content = content.replace(
  /\{aba==="cl"\s*&&\s*<ACl[^>]+checkM=\{checkM\}\s*\/>\}/g,
  '{aba==="cl"  && <ACl cl={cl} setCl={setCl} ops={ops} cfg={cfg} pr={pr} setPr={setPr} bus={bus} setBus={setBus} op={null} checkM={checkM} customConfirm={customConfirm} />}'
);

content = content.replace(
  /\{aba==="pr"\s*&&\s*<APr[^>]+checkM=\{checkM\}\s*\/>\}/g,
  '{aba==="pr"  && <APr pr={pr} cl={cl} cfg={cfg} setPr={setPr} checkM={checkM} customConfirm={customConfirm} customPrompt={customPrompt} />}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Props inseridas com sucesso no AdminPanel!');
