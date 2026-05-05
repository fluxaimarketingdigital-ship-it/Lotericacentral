
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Painel signature (White Screen Fix)
content = content.replace(
  'function Painel({cliente,clients,setCl,premios,setPr,ops,cfg,opQR,setOpQR,setRelamp,setCli,setTela}){',
  'function Painel({cliente,clients,setCl,premios,setPr,ops,cfg,opQR,setOpQR,setRelamp,setCli,setTela,setShowTutorial}){',
);

// 2. Remove OCR logic from FormAuth
// Remove Tesseract call and simplify processImage
const oldProcessImage = /function processImage\(file\) \{[\s\S]*?\}\s*?\}/m;
const newProcessImage = `function processImage(file) {
    const url = URL.createObjectURL(file);
    setFoto(url);
    setStep("form");
  }`;

content = content.replace(oldProcessImage, newProcessImage);

// Remove OCR states from FormAuth
content = content.replace('  const [camAtiva, setCamAtiva] = useState(false);', '');
content = content.replace('  const [scanProg, setScanProg] = useState(0);', '');
content = content.replace('  const [validando, setValidando] = useState(false);', '');

// 3. Update UI labels and instructions
content = content.replace('<div><div style={{fontSize:12,fontWeight:700,marginBottom:3,opacity:.8,color:encerrada?"#fff":C.ou}}>{encerrada?"Campanha Encerrada":"Comprovante em mãos?"}</div><div style={{fontSize:18,fontWeight:900}}>{encerrada?"🔒 Registro Suspenso":"📷 Escanear Comprovante"}</div></div>', 
                         '<div><div style={{fontSize:12,fontWeight:700,marginBottom:3,opacity:.8,color:encerrada?"#fff":C.ou}}>{encerrada?"Campanha Encerrada":"Comprovante em mãos?"}</div><div style={{fontSize:18,fontWeight:900}}>{encerrada?"🔒 Registro Suspenso":"📷 Enviar Foto do Cupom"}</div></div>');

content = content.replace('Use a câmera do seu celular para escanear o código ou digite os dados manualmente no app.', 
                         'Tire uma foto nítida do seu comprovante ou selecione uma imagem da sua galeria.');

content = content.replace('t: "2. Escaneie seu Cupom",', 't: "2. Envie seu Cupom",');

// 4. Remove Tesseract reference in code if any (it was called globally)
// Also remove the "Validando..." overlay if it exists
content = content.replace('{validando && (', '{false && ('); // Disable the overlay

fs.writeFileSync(file, content, 'utf8');
console.log("OCR removed and White Screen fixed.");
