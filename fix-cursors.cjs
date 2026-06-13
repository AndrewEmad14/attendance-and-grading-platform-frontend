const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const vueFiles = [];
walkDir('src', function(filePath) {
    if (filePath.endsWith('.vue')) {
        vueFiles.push(filePath);
    }
});

let modifiedFiles = [];

vueFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    const tagRegex = /<([a-zA-Z0-9_-]+)(?:\s+(?:"[^"]*"|'[^']*'|[^>]+?)+)*\s*>/g;
    
    content = content.replace(tagRegex, (match, tagName) => {
        const lowerTag = tagName.toLowerCase();
        
        if (['template', 'script', 'style', 'slot'].includes(lowerTag)) return match;
        
        const isInteractive = lowerTag === 'button' || 
                              lowerTag === 'a' || 
                              lowerTag === 'routerlink' || 
                              match.includes('@click') || 
                              match.includes('role="button"');
                              
        if (!isInteractive) return match;
        
        // Skip disabled elements explicitly per requirements
        if (match.includes(' disabled') || match.includes(':disabled=')) return match;
        
        if (match.includes('cursor-pointer') || 
            match.includes('cursor-default') || 
            match.includes('cursor-not-allowed') || 
            match.includes('cursor-text') ||
            match.includes('cursor-wait')) {
            return match;
        }

        const staticClassMatch = match.match(/class=(["'])(.*?)\1/);
        if (staticClassMatch) {
            const currentClasses = staticClassMatch[2];
            const newClasses = currentClasses + " cursor-pointer";
            const newAttributes = match.replace(staticClassMatch[0], `class=${staticClassMatch[1]}${newClasses}${staticClassMatch[1]}`);
            return newAttributes;
        } else {
            return `<${tagName} class="cursor-pointer"${match.slice(tagName.length + 1)}`;
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedFiles.push(file);
    }
});

console.log("Modified files:");
console.log(modifiedFiles.join('\n'));
