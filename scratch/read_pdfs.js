const fs = require('fs');
const path = require('path');

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  const guidelineDir = path.join(__dirname, '..', 'Guideline');
  const files = fs.readdirSync(guidelineDir).filter(f => f.endsWith('.pdf') && !f.includes('Onboarding'));
  
  const outputDir = path.join(__dirname);
  
  for (const file of files) {
    const data = new Uint8Array(fs.readFileSync(path.join(guidelineDir, file)));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      fullText += text + '\n\n';
    }
    
    const outName = file.replace('.pdf', '.txt');
    fs.writeFileSync(path.join(outputDir, outName), fullText);
    console.log('Written: ' + outName);
  }
}

main().catch(console.error);
