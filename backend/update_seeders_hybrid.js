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
  let newContent = content.replace(/levels:\s*\[\s*\{\s*level:\s*1,\s*name:\s*'الفرقة الإعدادية',\s*departments:\s*\[\]\s*\}\s*,\s*\{\s*level:\s*2,\s*name:\s*'الفرقة الأولى',\s*departments:\s*\['عام'\]\s*\}\s*\]/g, 
  `departments: ['عام'], levels: [{ level: 1, name: 'الفرقة الإعدادية', hasDepartments: false }, { level: 2, name: 'الفرقة الأولى', hasDepartments: true }]`);
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    updated++;
    console.log('Updated', file);
  }
});
console.log('Total files updated:', updated);
