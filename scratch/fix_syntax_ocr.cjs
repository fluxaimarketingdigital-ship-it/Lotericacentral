
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'sistema_cliente.jsx');
let content = fs.readFileSync(file, 'utf8');

// The last regex failed and left a mess. 
// I will clean up the processImage function correctly.
// It starts around line 718 and should end after the catch block.

const lines = content.split('\n');
let start = -1;
let end = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function processImage(file) {')) {
        start = i;
    }
    // The broken code has a catch block followed by a brace on line 802 (approximately)
    if (start !== -1 && lines[i].includes('setErrQR("Falha na leitura da imagem. Tente a digitação manual.");')) {
        // Look for the end of this block
        for (let j = i; j < i + 10; j++) {
            if (lines[j].trim() === '});' || lines[j].trim() === '}') {
                end = j;
                // Check if there's another closing brace right after (for the function)
                if (lines[j+1] && lines[j+1].trim() === '}') end = j+1;
                break;
            }
        }
        break;
    }
}

if (start !== -1 && end !== -1) {
    const newProcessImage = `  function processImage(file) {
    const url = URL.createObjectURL(file);
    setFoto(url);
    setStep("form");
  }`;
    lines.splice(start, end - start + 1, newProcessImage);
    const newContent = lines.join('\n');
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Syntax error fixed and OCR fully removed.");
} else {
    console.log("Could not find the block to fix. Start:", start, "End:", end);
}
