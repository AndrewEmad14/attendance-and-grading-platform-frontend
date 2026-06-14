const fs = require('fs');
const path = require('path');

const mappings = {
  red: 'danger',
  yellow: 'warning',
  amber: 'warning',
  orange: 'warning',
  green: 'success',
  emerald: 'success',
  blue: 'info',
  sky: 'info',
  cyan: 'info'
};

const prefixes = {
  text: '-content',
  fill: '-content',
  stroke: '-content',
  border: '-border',
  bg: ''
};

// Regex to match Tailwind utility classes
const regex = /\b([a-z:-]*hover:|focus:|active:|disabled:)?(text|bg|border|fill|stroke)-(red|yellow|amber|orange|green|emerald|blue|sky|cyan)-\d{2,3}(?:\/\d+)?\b/g;

let modifiedFilesCount = 0;

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.vue') || filePath.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(regex, (match, modifiers, type, color) => {
    const semanticName = mappings[color];
    const suffix = prefixes[type];
    
    let replacement = `${type}-${semanticName}${suffix}`;
    
    // User requirement: let the background be on hover make it bg-danger/90
    if (modifiers && modifiers.includes('hover') && type === 'bg') {
      replacement = `${type}-${semanticName}/90`;
    }
    
    return `${modifiers || ''}${replacement}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFilesCount++;
    console.log(`Modified: ${filePath}`);
  }
}

walkDir('./src');
console.log(`\nRefactoring complete. Modified ${modifiedFilesCount} files.`);
