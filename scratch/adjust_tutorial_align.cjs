
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

// Adjust image alignment in PassoAPasso
content = content.replace(
  'style={{width:"100%", height:"100%", objectFit:"cover"}}',
  'style={{width:"100%", height:"100%", objectFit:"cover", objectPosition:"top"}}'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Image alignment updated to show the top of the screenshot.");
