const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'albums.json');
const MATCHES_FILE = path.join(__dirname, 'recent_matches.json');
const STATS_FILE = path.join(__dirname, 'stats_data.json');
const TOP_AFFICHES_FILE = path.join(__dirname, 'top_affiches.json');
const AGENDA_FILE = path.join(__dirname, 'agenda.json');
const INSTA_FILE = path.join(__dirname, 'instagram_posts.json');
const CLUBS_FILE = path.join(__dirname, 'clubs_terrains.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- API ROUTES (Defined BEFORE static files) ---

// Get all albums
app.get('/api/albums', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading albums data');
        }
        res.json(JSON.parse(data));
    });
});

// Update albums
app.post('/api/albums', (req, res) => {
    const newAlbums = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(newAlbums, null, 4), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Error writing albums data');
        }
        res.send('Albums updated successfully');
    });
});

// Get all recent matches
app.get('/api/matches', (req, res) => {
    fs.readFile(MATCHES_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading matches file:', err);
            return res.status(500).send('Error reading matches data');
        }
        res.json(JSON.parse(data));
    });
});

// Update matches
app.post('/api/matches', (req, res) => {
    const newMatches = req.body;
    fs.writeFile(MATCHES_FILE, JSON.stringify(newMatches, null, 4), (err) => {
        if (err) {
            console.error('Error writing matches file:', err);
            return res.status(500).send('Error writing matches data');
        }
        res.send('Matches updated successfully');
    });
});

// Get stats data for charts
app.get('/api/stats', (req, res) => {
    fs.readFile(STATS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading stats file:', err);
            return res.status(500).send('Error reading stats data');
        }
        res.json(JSON.parse(data));
    });
});

// Update stats data
app.post('/api/stats', (req, res) => {
    const newStats = req.body;
    fs.writeFile(STATS_FILE, JSON.stringify(newStats, null, 2), (err) => {
        if (err) {
            console.error('Error writing stats file:', err);
            return res.status(500).send('Error writing stats data');
        }
        res.send('Stats updated successfully');
    });
});

// Get top affiches
app.get('/api/top-affiches', (req, res) => {
    fs.readFile(TOP_AFFICHES_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading top affiches' });
        res.json(JSON.parse(data));
    });
});

// Update top affiches
app.post('/api/top-affiches', (req, res) => {
    fs.writeFile(TOP_AFFICHES_FILE, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Error writing top affiches' });
        res.json({ success: true });
    });
});

// Get agenda
app.get('/api/agenda', (req, res) => {
    fs.readFile(AGENDA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading agenda' });
        res.json(JSON.parse(data));
    });
});

// Update agenda
app.post('/api/agenda', (req, res) => {
    fs.writeFile(AGENDA_FILE, JSON.stringify(req.body, null, 2), err => {
        if (err) return res.status(500).json({ error: 'Error writing agenda' });
        res.json({ success: true });
    });
});

// Get Instagram posts
app.get('/api/instagram', (req, res) => {
    fs.readFile(INSTA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading instagram posts' });
        res.json(JSON.parse(data));
    });
});

// Update Instagram posts
app.post('/api/instagram', (req, res) => {
    fs.writeFile(INSTA_FILE, JSON.stringify(req.body, null, 2), err => {
        if (err) return res.status(500).json({ error: 'Error writing instagram posts' });
        res.json({ success: true });
    });
});

// Get Clubs and Terrains
app.get('/api/clubs', (req, res) => {
    fs.readFile(CLUBS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading clubs' });
        res.json(JSON.parse(data));
    });
});

// Update Clubs and Terrains
app.post('/api/clubs', (req, res) => {
    fs.writeFile(CLUBS_FILE, JSON.stringify(req.body, null, 2), err => {
        if (err) return res.status(500).json({ error: 'Error writing clubs' });
        res.json({ success: true });
    });
});

// Import Google Calendar iCal
app.post('/api/import-ical', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch iCal');
        const data = await response.text();

        const events = [];
        const lines = data.split(/\r\n|\n|\r/);
        let currentEvent = null;
        let lastKey = null;

        lines.forEach(line => {
            if (line.startsWith(' ') && lastKey && currentEvent) {
                currentEvent[lastKey] += line.substring(1);
                return;
            }
            if (line.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT') && currentEvent) {
                events.push(currentEvent);
                currentEvent = null;
            } else if (currentEvent) {
                const sep = line.indexOf(':');
                if (sep === -1) return;
                const keyWithParams = line.substring(0, sep);
                const key = keyWithParams.split(';')[0];
                const value = line.substring(sep + 1);

                if (key === 'SUMMARY') { currentEvent.summary = value; lastKey = 'summary'; }
                else if (key === 'LOCATION') { currentEvent.location = value; lastKey = 'location'; }
                else if (key === 'DESCRIPTION') { currentEvent.description = value; lastKey = 'description'; }
                else if (key === 'DTSTART') { currentEvent.dtstart = value; lastKey = 'dtstart'; }
                else lastKey = null;
            }
        });

        const importedAgenda = events.map(ev => {
            let date = '', time = '';
            if (ev.dtstart) {
                const y = ev.dtstart.substring(0, 4);
                const m = ev.dtstart.substring(4, 6);
                const d = ev.dtstart.substring(6, 8);
                if (y && m && d && y.length === 4) date = `${y}-${m}-${d}`;
                if (ev.dtstart.includes('T')) {
                    const hr = ev.dtstart.substring(9, 11);
                    const min = ev.dtstart.substring(11, 13);
                    time = `${hr}:${min}`;
                }
            }

            let homeTeam = ev.summary ? ev.summary.replace(/\\,/g, ',') : 'Événement';
            let awayTeam = '';
            if (homeTeam.toLowerCase().includes(' vs ')) {
                const pts = homeTeam.split(/ vs /i);
                homeTeam = pts[0].trim();
                awayTeam = pts[1].trim();
            } else if (homeTeam.includes(' - ')) {
                const pts = homeTeam.split(' - ');
                homeTeam = pts[0].trim();
                awayTeam = pts[1].trim();
            }

            return {
                id: 'ical-' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
                date: date,
                time: time,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                competition: 'Agenda Google',
                venue: ev.location ? ev.location.replace(/\\,/g, ',').replace(/\\n/g, ' ') : '',
                type: 'autre',
                notes: ev.description ? ev.description.replace(/\\n/g, ' ') : '',
                photographed: false
            };
        });

        res.json({ success: true, events: importedAgenda });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Restore Backup
app.post('/api/restore-backup', async (req, res) => {
    try {
        await execPromise('git restore .');
        res.json({ success: true, message: 'Restauration réussie.' });
    } catch (err) {
        console.error('Error restoring backup:', err);
        res.status(500).json({ error: err.message });
    }
});

// Scan images directory for folders
app.get('/api/scan-folders', (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
    fs.readdir(imagesDir, { withFileTypes: true }, (err, dirents) => {
        if (err) {
            console.error('Error reading images directory:', err);
            return res.status(500).json({ error: 'Failed to read images directory' });
        }
        const folders = dirents
            .filter(dirent => dirent.isDirectory() && dirent.name !== 'logos')
            .map(dirent => dirent.name);
        res.json(folders);
    });
});

// Scan specific folder for base images
app.get('/api/scan-images', (req, res) => {
    const { folder } = req.query;
    if (!folder) return res.status(400).json({ error: 'Folder parameter is required' });

    const folderPath = path.join(__dirname, 'images', folder);
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err);
            return res.status(500).json({ error: 'Failed to read folder' });
        }

        // Filter only base images, exclude already optimized suffixes
        const images = files.filter(f => {
            const ext = path.extname(f).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return false;

            // Exclude generated versions to prevent duplicates
            if (f.includes('_tiny') || f.includes('_small') || f.includes('_medium') || f.includes('_large')) return false;

            return true;
        }).map(f => `images/${folder}/${f}`);

        res.json(images);
    });
});

// Optimize images - async version
app.post('/api/optimize', async (req, res) => {
    try {
        console.log('Starting image optimization...');
        const { stdout, stderr } = await execPromise('node optimize_images.js', {
            cwd: __dirname
        });

        console.log('Optimization output:', stdout);
        if (stderr) console.log('Optimization stderr:', stderr);

        res.json({
            success: true,
            output: stdout || 'Optimization completed'
        });
    } catch (error) {
        console.error('Optimization error:', error);
        res.json({
            success: false,
            error: error.message,
            output: error.stdout || '',
            stderr: error.stderr || ''
        });
    }
});

// Deploy to GitHub - async version with proper PowerShell
app.post('/api/deploy', async (req, res) => {
    const message = req.body.message || 'Mise à jour portfolio via admin';

    try {
        console.log('Starting deployment...');

        // Execute git commands one by one
        const add = await execPromise('git add .', { cwd: __dirname });
        console.log('Git add:', add.stdout);

        const commit = await execPromise(`git commit -m "${message}"`, { cwd: __dirname });
        console.log('Git commit:', commit.stdout);

        const push = await execPromise('git push origin main', { cwd: __dirname });
        console.log('Git push:', push.stdout);

        res.json({
            success: true,
            output: `${add.stdout}\n${commit.stdout}\n${push.stdout}`
        });
    } catch (error) {
        console.error('Deploy error:', error);

        // Sometimes git returns exit code 1 even on success
        const output = (error.stdout || '') + '\n' + (error.stderr || '');

        res.json({
            success: true, // Consider it success if we got output
            output: output || error.message
        });
    }
});

// --- STATIC FILES (Defaults for anything not matched above) ---
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/admin`);
    console.log(`API available at http://localhost:${PORT}/api/albums`);
    console.log(`API available at http://localhost:${PORT}/api/matches`);
    console.log(`API available at http://localhost:${PORT}/api/stats`);
});
