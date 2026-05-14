const fs = require('fs');

const BASE_URL = 'https://shooted-by-alexis.vercel.app';
const ALBUMS_FILE = 'albums.json';
const SITEMAP_FILE = 'sitemap.xml';

try {
    const albumsData = fs.readFileSync(ALBUMS_FILE, 'utf8');
    const albums = JSON.parse(albumsData);

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${BASE_URL}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>`;

    albums.forEach(album => {
        const lastmod = album.date ? new Date(album.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        sitemap += `
    <url>
        <loc>${BASE_URL}/album.html?id=${album.id}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
    });

    sitemap += `
</urlset>`;

    fs.writeFileSync(SITEMAP_FILE, sitemap);
    console.log(`✅ Sitemap generated successfully at ${SITEMAP_FILE} with ${albums.length} albums.`);

} catch (err) {
    console.error('❌ Error generating sitemap:', err);
}
