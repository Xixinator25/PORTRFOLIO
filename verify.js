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

const cleanPath = (url) => {
    if (url.startsWith('data:')) return null;
    return url.split('?')[0].split('#')[0];
};

let match;
while ((match = linkRegex.exec(html)) !== null) {
    const val = match[1];
    if (!val.startsWith('http') && !val.startsWith('#') && !val.startsWith('mailto:') && !val.startsWith('tel:')) {
        const cleaned = cleanPath(val);
        if (cleaned) links.push({ original: val, cleaned });
    }
}
while ((match = scriptRegex.exec(html)) !== null) {
    const val = match[1];
    if (!val.startsWith('http')) {
        const cleaned = cleanPath(val);
        if (cleaned) scripts.push({ original: val, cleaned });
    }
}

console.log('Checking local links:');
let hasErrors = false;
links.forEach(l => {
    const fullPath = path.join(baseDir, l.cleaned);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ LINK EXISTS: ${l.original}`);
    } else {
        console.error(`❌ LINK MISSING: ${l.original} (cleaned: ${l.cleaned})`);
        hasErrors = true;
    }
});

console.log('Checking local scripts:');
scripts.forEach(s => {
    const fullPath = path.join(baseDir, s.cleaned);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ SCRIPT EXISTS: ${s.original}`);
    } else {
        console.error(`❌ SCRIPT MISSING: ${s.original} (cleaned: ${s.cleaned})`);
        hasErrors = true;
    }
});

if (hasErrors) {
    process.exit(1);
} else {
    console.log('\n🎉 All local references are valid!');
}

