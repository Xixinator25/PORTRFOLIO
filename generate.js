const fs = require('fs');
const path = require('path');

const imagesDir = './images';
const outputFile = './albums.json';

function generateAlbums() {
    const albums = [];

    if (!fs.existsSync(imagesDir)) {
        console.error(`❌ Erreur : Le dossier ${imagesDir} n'existe pas !`);
        return;
    }

    // LISTE DES DOSSIERS À IGNORER
    const ignoredFolders = ['logos', 'icons', 'assets'];

    const folders = fs.readdirSync(imagesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !ignoredFolders.includes(dirent.name))
        .map(dirent => dirent.name);

    console.log(`📂 Dossiers trouvés (Albums) : ${folders.join(', ')}`);

    folders.forEach(folder => {
        const folderPath = path.join(imagesDir, folder);
        const files = fs.readdirSync(folderPath)
            .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

        if (files.length > 0) {
            // VALEURS PAR DÉFAUT
            let date = fs.statSync(folderPath).mtime; 
            let category = "REPORTAGE";
            let title = folder;

            // ANALYSE DU NOM (YYYY-MM-DD - CAT - TITRE)
            const dateMatch = folder.match(/^(\d{4}-\d{2}-\d{2})[-_]\s?(.*)/); // Acccept - or _ separator

            if (dateMatch) {
                date = new Date(dateMatch[1]);
                let rest = dateMatch[2]; // Use let for reassignment

                // Handle underscores in rest of string if used as spacers
                // Example: N1_FCSM_vs_SM_CAEN -> N1 - FCSM vs SM CAEN
                if (rest.includes('_')) {
                     // Try to split by first underscore to find category
                     // Or just separate known prefixes
                     if (rest.startsWith('PREPA_') || rest.startsWith('AMICAL_')) {
                        category = "PRÉPARATION L2";
                        rest = rest.replace(/^(PREPA_|AMICAL_)/, '').replace(/_/g, ' ');
                     }
                     else if (rest.startsWith('L2_')) {
                        category = "LIGUE 2";
                        rest = rest.substring(3).replace(/_/g, ' ');
                     }
                     else if (rest.startsWith('L3_') || rest.startsWith('N1_')) {
                        category = "LIGUE 3";
                        rest = rest.replace(/^(L3_|N1_)/, '').replace(/_/g, ' ');
                     }
                     else if (rest.startsWith('N2_') || rest.startsWith('N3_')) {
                        category = "NATIONAL 2";
                        rest = rest.replace(/^(N2_|N3_)/, '').replace(/_/g, ' ');
                     }
                     else if (rest.startsWith('COUPE_')) {
                        category = "COUPE DE FRANCE";
                        rest = rest.substring(6).replace(/_/g, ' ');
                     }
                     else {
                         // Default fallback: replace all underscores with spaces
                         rest = rest.replace(/_/g, ' ');
                     }
                }

                
                if (rest.includes(' - ')) {
                    const parts = rest.split(' - ');
                    const prefix = parts[0].toUpperCase();
                    
                    if (prefix.includes('N1')) category = "NATIONAL 1";
                    else if (prefix.includes('N3')) category = "NATIONAL 3";
                    else if (prefix.includes('COUPE')) category = "COUPE DE FRANCE";
                    else if (prefix.includes('U19')) category = "FORMATION";
                    else category = prefix;

                    title = parts.slice(1).join(' - ');
                } else if (!title || title === folder) {
                     // If we haven't manually set title from the underscore logic above
                     title = rest;
                }
            }
            
            // FILTER OUT OPTIMIZED IMAGES
            // Keep only files that DO NOT contain _tiny, _small, _medium, _large
            const originalFiles = files.filter(file => 
                !file.includes('_tiny') && 
                !file.includes('_small') && 
                !file.includes('_medium') && 
                !file.includes('_large')
            );
            
            // If no original files found (e.g. only optimized exist), fall back to using result/large as "source"
            // But usually we have originals. Let's assume originals or at least one "main" file exists.
            
            const imagePaths = originalFiles.map(file => `images/${folder}/${file}`);

            albums.push({
                id: folder.replace(/\s+/g, '-').toLowerCase(),
                title: title,
                category: category,
                cover: imagePaths[0],
                images: imagePaths,
                date: date
            });
        }
    });

    // TRI : Du plus récent au plus ancien
    albums.sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(outputFile, JSON.stringify(albums, null, 2));
    console.log(`✅ Succès ! ${albums.length} albums générés (Logos exclus).`);
}

generateAlbums();
