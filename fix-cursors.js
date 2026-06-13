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

    // A simple regex to find HTML tags. This is naive but works for standard Vue templates.
    // We look for elements with @click or tag name button or a.
    
    // We'll use a regex that captures a tag opening, its attributes, and closes.
    // e.g. <button class="btn"> or <div @click="...">
    const tagRegex = /<([a-zA-Z0-9_-]+)([^>]*?)>/g;
    
    content = content.replace(tagRegex, (match, tagName, attributes) => {
        // Only target button, a, RouterLink, or elements with @click
        const isInteractive = tagName.toLowerCase() === 'button' || 
                              tagName.toLowerCase() === 'a' || 
                              tagName === 'RouterLink' || 
                              attributes.includes('@click') || 
                              attributes.includes('role="button"');
                              
        if (!isInteractive) return match;
        
        // Check if cursor-pointer is already in there, or cursor-not-allowed, etc.
        if (attributes.includes('cursor-pointer') || 
            attributes.includes('cursor-default') || 
            attributes.includes('cursor-not-allowed') || 
            attributes.includes('cursor-text')) {
            return match;
        }

        // We need to add cursor-pointer to the class attribute.
        // If class exists, append to it.
        // If class doesn't exist, add class="cursor-pointer"
        
        // Match class="..." or class='...' or :class="..."
        // We will try to add it to the static class if it exists.
        const staticClassMatch = attributes.match(/class=(["'])(.*?)\1/);
        if (staticClassMatch) {
            const currentClasses = staticClassMatch[2];
            const newClasses = currentClasses + " cursor-pointer";
            const newAttributes = attributes.replace(staticClassMatch[0], `class=${staticClassMatch[1]}${newClasses}${staticClassMatch[1]}`);
            return `<${tagName}${newAttributes}>`;
        } else {
            // No static class. Just add class="cursor-pointer"
            return `<${tagName} class="cursor-pointer"${attributes}>`;
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedFiles.push(file);
    }
});

console.log("Modified files:");
console.log(modifiedFiles.join('\n'));
