
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

// Use contain to avoid losing information in screenshots
content = content.replace(
  'objectFit:"cover", objectPosition:"top"',
  'objectFit:"contain", background:"#f8f9fa"'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Tutorial display updated to 'contain' to preserve all image details.");
