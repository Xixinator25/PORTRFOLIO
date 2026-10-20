const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ALBUMS_FILE = 'albums.json';

// Configuration for sizes
const SIZES = [
    { suffix: '_tiny', width: 20 },
    { suffix: '_small', width: 500 },
    { suffix: '_medium', width: 800 },
    { suffix: '_large', width: 1200 }
];

async function optimizeImages() {
    try {
        console.log('📖 Reading albums.json...');
        if (!fs.existsSync(ALBUMS_FILE)) {
            console.error('❌ albums.json not found!');
            return;
        }

        const albumsData = fs.readFileSync(ALBUMS_FILE, 'utf8');
        const albums = JSON.parse(albumsData);

        let totalImages = 0;
        let processedImages = 0;
        let skippedImages = 0;
        let errorImages = 0;
        let processingIndex = 0;

        // Flatten all images
        const allImages = [];
        albums.forEach(album => {
            if (album.cover) allImages.push(album.cover);
            if (album.images) allImages.push(...album.images);
        });

        // Include Instagram posts images as well
        if (fs.existsSync('instagram_posts.json')) {
            try {
                const instaPosts = JSON.parse(fs.readFileSync('instagram_posts.json', 'utf8'));
                instaPosts.forEach(post => {
                    if (post.image) allImages.push(post.image);
                });
            } catch (e) {
                console.warn('⚠️  Could not parse instagram_posts.json:', e.message);
            }
        }

        // Unique images
        const uniqueImages = [...new Set(allImages)];
        totalImages = uniqueImages.length;

        console.log(`🔍 Found ${totalImages} unique images to process.`);

        for (const relativePath of uniqueImages) {
            processingIndex++;
            const inputPath = path.resolve(__dirname, relativePath);

            if (!fs.existsSync(inputPath)) {
                console.warn(`⚠️  Source image missing: ${relativePath}`);
                errorImages++;
                continue;
            }

            const dir = path.dirname(inputPath);
            const ext = path.extname(inputPath);
            const name = path.basename(inputPath, ext);

            // Process each size
            for (const size of SIZES) {
                const outputFilename = `${name}${size.suffix}.webp`;
                const outputPath = path.join(dir, outputFilename);

                if (fs.existsSync(outputPath)) {
                    // console.log(`⏭️  Skipping existing: ${outputFilename}`);
                    skippedImages++;
                    continue;
                }

                try {
                    await sharp(inputPath)
                        .resize({ width: size.width, withoutEnlargement: true })
                        .webp({ quality: 80 })
                        .toFile(outputPath);

                    // console.log(`✅ Generated: ${outputFilename}`);
                    processedImages++;
                } catch (err) {
                    console.error(`❌ Error processing ${relativePath} (${size.suffix}):`, err.message);
                    errorImages++;
                }
            }
            // Optional: Print progress every 10 images
            if (processingIndex % 10 === 0) process.stdout.write('.');
        }

        console.log('\n🎉 Optimization Complete!');
        console.log(`📊 Stats: Processed ${processedImages} | Skipped ${skippedImages} | Errors ${errorImages}`);

    } catch (err) {
        console.error('❌ Critical Error:', err);
    }
}

// Helper for progress logging
let processingIndex = 0;

optimizeImages();
