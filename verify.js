const fs = require('fs');
const path = require('path');

const baseDir = process.argv[2] || '.';
const indexHtml = path.join(baseDir, 'index.html');

if (!fs.existsSync(indexHtml)) {
    console.error('index.html not found');
    process.exit(1);
}

const html = fs.readFileSync(indexHtml, 'utf8');
const links = [];
const scripts = [];

const linkRegex = /href=["']([^"']+)["']/g;
const scriptRegex = /src=["']([^"']+)["']/g;

let match;
while ((match = linkRegex.exec(html)) !== null) {
    if (!match[1].startsWith('http') && !match[1].startsWith('#') && !match[1].startsWith('mailto:') && !match[1].startsWith('tel:')) {
        links.push(match[1]);
    }
}
while ((match = scriptRegex.exec(html)) !== null) {
    if (!match[1].startsWith('http')) {
        scripts.push(match[1]);
    }
}

console.log('Checking local links:');
links.forEach(l => {
    const fullPath = path.join(baseDir, l);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ LINK EXISTS: ${l}`);
    } else {
        console.error(`❌ LINK MISSING: ${l}`);
    }
});

console.log('Checking local scripts:');
scripts.forEach(s => {
    const fullPath = path.join(baseDir, s);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ SCRIPT EXISTS: ${s}`);
    } else {
        console.error(`❌ SCRIPT MISSING: ${s}`);
    }
});
