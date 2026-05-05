
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Change initial step in FormAuth to "form"
content = content.replace(
  'const[step,  setStep]    = useState(opQR?"form":"qr");',
  'const[step,  setStep]    = useState("form");'
);

// 2. Remove the step==="qr"||step==="cam" block
// It starts around line 891 and ends around 927
const lines = content.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if(step==="qr"||step==="cam")')) {
        start = i;
    }
    if (start !== -1 && lines[i].includes('← Voltar ao Início</button>')) {
        end = i + 1; // including the closing div
        // check if next line is the end of the if block
        if (lines[i+1] && lines[i+1].trim() === '</div>);') {
             end = i + 2;
        }
        break;
    }
}

if (start !== -1 && end !== -1) {
    lines.splice(start, end - start, '  // OCR step removed');
}

// 3. Update tutorial image paths to point to public if needed, 
// but for now let's just make sure they are in the root if that's what Vite expects.
// Actually, I will create a public folder and move them there.
content = content.replace(/'\.\/step1\.png'/g, "'/step1.png'");
content = content.replace(/'\.\/step2\.png'/g, "'/step2.png'");
content = content.replace(/'\.\/step3\.png'/g, "'/step3.png'");
content = content.replace(/'\.\/step4\.png'/g, "'/step4.png'");

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log("FormAuth cleaned up and image paths updated.");
