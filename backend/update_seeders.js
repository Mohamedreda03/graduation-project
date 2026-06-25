const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.js')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const backendDir = 'd:\\work-now\\graduation-project\\backend';
const files = walkSync(path.join(backendDir, 'src', 'seeders')).concat(walkSync(path.join(backendDir, 'tests')));

let updated = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/faculty:\s*['"].*?['"]/g, `levels: [{ level: 1, name: 'الفرقة الإعدادية', departments: [] }, { level: 2, name: 'الفرقة الأولى', departments: ['عام'] }]`);
  // also handle sectionsCount map removal
  newContent = newContent.replace(/,\s*sectionsCount:\s*\{[^\}]*\}/g, "");
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    updated++;
    console.log('Updated', file);
  }
});
console.log('Total files updated:', updated);
