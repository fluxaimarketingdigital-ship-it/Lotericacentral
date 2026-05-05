
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update version tag
content = content.replace(/v3\.3-FINAL-BOOST/g, 'v3.4-ULTIMATE');

// 1. Pass customConfirm and customPrompt to AAud
content = content.replace(
  /function AAud\(\{a,c,corS,labelS,opN,brl,fDT,cfg,setCl,cl,pr,setPr,setVoucherVer,checkM\}\)/,
  'function AAud({a,c,corS,labelS,opN,brl,fDT,cfg,setCl,cl,pr,setPr,setVoucherVer,checkM,customConfirm})'
);

content = content.replace(
  /<AAud key=\{a\.id\} a=\{a\} c=\{c\} corS=\{corS\} labelS=\{labelS\} opN=\{opN\} brl=\{brl\} fDT=\{fDT\} cfg=\{cfg\} setCl=\{setCl\} cl=\{cl\} pr=\{pr\} setPr=\{setPr\} setVoucherVer=\{setVoucherVer\} checkM=\{checkM\}\/>/g,
  '<AAud key={a.id} a={a} c={c} corS={corS} labelS={labelS} opN={opN} brl={brl} fDT={fDT} cfg={cfg} setCl={setCl} cl={cl} pr={pr} setPr={setPr} setVoucherVer={setVoucherVer} checkM={checkM} customConfirm={customConfirm}/>'
);

// 2. Pass customConfirm and customPrompt to ACl
content = content.replace(
  /function ACl\(\{cl,setCl,ops,cfg,pr,setPr,bus,setBus,op,checkM\}\)/,
  'function ACl({cl,setCl,ops,cfg,pr,setPr,bus,setBus,op,checkM,customConfirm})'
);

content = content.replace(
  /<ACl cl=\{cl\} setCl=\{setCl\} ops=\{ops\} cfg=\{cfg\} pr=\{pr\} setPr=\{setPr\} bus=\{bus\} setBus=\{setBus\} op=\{opSel\} checkM=\{checkM\}\/>/g,
  '<ACl cl={cl} setCl={setCl} ops={ops} cfg={cfg} pr={pr} setPr={setPr} bus={bus} setBus={setBus} op={opSel} checkM={checkM} customConfirm={customConfirm}/>'
);

// 3. Pass customPrompt and customConfirm to APr
content = content.replace(
  /function APr\(\{pr, cl, cfg, setPr, checkM\}\)/,
  'function APr({pr, cl, cfg, setPr, checkM, customPrompt, customConfirm})'
);

content = content.replace(
  /<APr pr=\{pr\} cl=\{cl\} cfg=\{cfg\} setPr=\{setPr\} checkM=\{checkM\}\/>/g,
  '<APr pr={pr} cl={cl} cfg={cfg} setPr={setPr} checkM={checkM} customPrompt={customPrompt} customConfirm={customConfirm}/>'
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Dependências de Modal adicionadas (customConfirm e customPrompt passados como props)!');
