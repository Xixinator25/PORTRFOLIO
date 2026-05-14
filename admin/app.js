let albums = [];
let matches = [];
let statsData = null;
let topAffiches = [];
let agenda = [];
let instaPosts = [];
let clubsData = [];
let editingIndex = -1;
let editingMatchIndex = -1;
let editingAfficheIndex = -1;
let editingAgendaIndex = -1;
let currentTab = 'albums';

const modal = document.getElementById('edit-modal');
const matchModal = document.getElementById('match-modal');
const afficheModal = document.getElementById('affiche-modal');
const agendaModal = document.getElementById('agenda-modal');
const form = document.getElementById('album-form');
const matchForm = document.getElementById('match-form');
const afficheForm = document.getElementById('affiche-form');
const agendaForm = document.getElementById('agenda-form');

// Elements
const listContainer = document.getElementById('albums-list');
const matchesListContainer = document.getElementById('matches-list');
const saveAllBtn = document.getElementById('save-all-btn');
const addAlbumBtn = document.getElementById('add-album-btn');
const addMatchBtn = document.getElementById('add-match-btn');
const addAfficheBtn = document.getElementById('add-affiche-btn');
const addAgendaBtn = document.getElementById('add-agenda-btn');
const closeModalBtn = document.querySelector('.close-modal');
const closeMatchModalBtn = document.querySelector('.close-match-modal');
const deleteAlbumBtn = document.getElementById('delete-album-btn');
const deleteMatchBtn = document.getElementById('delete-match-btn');
const deleteAfficheBtn = document.getElementById('delete-affiche-btn');
const deleteAgendaBtn = document.getElementById('delete-agenda-btn');

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        currentTab = tab;

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
    });
});

// Fetch initial data
async function loadData() {
    try {
        const [albumsRes, matchesRes, statsRes, foldersRes, affichesRes, agendaRes, instaRes, clubsRes] = await Promise.all([
            fetch('/api/albums'),
            fetch('/api/matches'),
            fetch('/api/stats'),
            fetch('/api/scan-folders'),
            fetch('/api/top-affiches'),
            fetch('/api/agenda'),
            fetch('/api/instagram'),
            fetch('/api/clubs')
        ]);
        albums = await albumsRes.json();
        const matchesData = await matchesRes.json();
        matches = matchesData.recentMatches || [];
        statsData = await statsRes.json();
        topAffiches = await affichesRes.json();
        agenda = await agendaRes.json();
        try { instaPosts = await instaRes.json(); } catch (e) { console.warn('No insta posts', e); instaPosts = []; }
        try { clubsData = await clubsRes.json(); } catch (e) { console.warn('No clubs data', e); clubsData = []; }

        try {
            const folders = await foldersRes.json();
            const folderSelect = document.getElementById('album-folder');
            folders.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                folderSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Error loading folders', e);
        }

        renderList();
        renderMatches();
        renderStatsForm();
        renderAffiches();
        renderAgenda();
        renderInsta();
        renderClubs();
    } catch (err) {
        alert('Erreur chargement données: ' + err);
    }
}

// Auto-scan logic
document.getElementById('scan-folder-btn').onclick = async () => {
    const folder = document.getElementById('album-folder').value;
    if (!folder) {
        alert('Veuillez d\'abord sélectionner un dossier.');
        return;
    }

    try {
        const res = await fetch(`/api/scan-images?folder=${encodeURIComponent(folder)}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('album-images').value = data.join('\n');
            alert(`${data.length} images trouvées et ajoutées !`);
        } else {
            alert('Erreur lors du scan: ' + (data.error || 'Erreur inconnue'));
        }
    } catch (err) {
        alert('Erreur réseau lors du scan: ' + err);
    }
};

document.getElementById('set-cover-btn').onclick = () => {
    const imagesRaw = document.getElementById('album-images').value;
    const images = imagesRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (images.length > 0) {
        document.getElementById('album-cover').value = images[0];
    } else {
        alert('Aucune image dans la liste pour définir la couverture.');
    }
};

// Render albums grid
function renderList() {
    listContainer.innerHTML = '';
    albums.forEach((album, index) => {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.onclick = () => openEditModal(index);

        const coverImg = album.cover.startsWith('http') ? album.cover : `../${album.cover}`;

        card.innerHTML = `
            <img src="${coverImg}" class="album-cover" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
            <div class="album-info">
                <span class="album-cat">${album.category}</span>
                <h3 class="album-title">${album.title}</h3>
                <div class="album-count">${album.images.length} photos</div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Render matches grid
function renderMatches() {
    matchesListContainer.innerHTML = '';
    matches.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.onclick = () => openEditMatchModal(index);

        card.innerHTML = `
            <div style="padding: 2rem; background: #1a1a1a; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <img src="../${match.homeLogo}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.style.display='none'">
                    <span style="color: #fff; font-weight: bold;">VS</span>
                    <img src="../${match.awayLogo}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.style.display='none'">
                </div>
                <div style="color: #888; font-size: 0.9rem;">${match.homeTeam} - ${match.awayTeam}</div>
                <div style="color: var(--primary); margin-top: 0.5rem;">${match.competition}</div>
                <div style="color: #666; font-size: 0.8rem; margin-top: 0.5rem;">${match.date}</div>
            </div>
        `;
        matchesListContainer.appendChild(card);
    });
}

// Render Top Affiches
function renderAffiches() {
    const listContainer = document.getElementById('affiches-list');
    listContainer.innerHTML = '';
    topAffiches.forEach((affiche, index) => {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.onclick = () => {
            editingAfficheIndex = index;
            document.getElementById('affiche-modal-title').innerText = "Modifier l'Affiche";
            document.getElementById('affiche-date').value = affiche.date;
            document.getElementById('affiche-home').value = affiche.homeTeam;
            document.getElementById('affiche-away').value = affiche.awayTeam;
            document.getElementById('affiche-home-logo').value = affiche.homeLogo;
            document.getElementById('affiche-away-logo').value = affiche.awayLogo;
            document.getElementById('affiche-competition').value = affiche.competition;
            document.getElementById('affiche-badge').value = affiche.badgeClass;
            deleteAfficheBtn.style.display = 'block';
            afficheModal.classList.add('open');
        };

        card.innerHTML = `
            <div style="padding: 1.5rem; background: #1a1a1a; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; border-top: 3px solid var(--primary);">
                <div style="color: var(--primary); font-family: 'Oswald', sans-serif; margin-bottom: 0.5rem;">${affiche.date}</div>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <img src="../${affiche.homeLogo}" style="width: 30px; height: 30px; object-fit: contain;">
                    <span style="color: #fff; font-weight: bold;">VS</span>
                    <img src="../${affiche.awayLogo}" style="width: 30px; height: 30px; object-fit: contain;">
                </div>
                <div style="color: #888; font-size: 0.9rem;">${affiche.homeTeam} - ${affiche.awayTeam}</div>
                <div style="color: #aaa; margin-top: 0.5rem; font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;">${affiche.competition}</div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Render Agenda
function renderAgenda() {
    const listContainer = document.getElementById('agenda-list');
    listContainer.innerHTML = '';

    // Sort agenda by date descending (closest match first)
    const sortedAgenda = [...agenda].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedAgenda.forEach((ag, sortedIndex) => {
        // Find original index
        const index = agenda.findIndex(x => x.id === ag.id);

        const card = document.createElement('div');
        card.style = `
            background: #1a1a1a; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: pointer; border-left: 4px solid ${ag.photographed ? 'var(--primary)' : '#444'};
        `;

        card.onclick = () => {
            editingAgendaIndex = index;
            document.getElementById('agenda-modal-title').innerText = "Modifier le Match";
            document.getElementById('agenda-date').value = ag.date;
            document.getElementById('agenda-time').value = ag.time || '';
            document.getElementById('agenda-home').value = ag.homeTeam;
            document.getElementById('agenda-away').value = ag.awayTeam;
            document.getElementById('agenda-competition').value = ag.competition;
            document.getElementById('agenda-venue').value = ag.venue || '';
            document.getElementById('agenda-type').value = ag.type || 'autre';
            document.getElementById('agenda-notes').value = ag.notes || '';
            document.getElementById('agenda-photographed').checked = ag.photographed || false;
            deleteAgendaBtn.style.display = 'block';
            agendaModal.classList.add('open');
        };

        const dt = new Date(ag.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:20px;">
                <div style="font-family:'Oswald',sans-serif; color:var(--primary); min-width:90px;">${dt}</div>
                <div>
                    <div style="font-weight:bold; color:#fff;">${ag.homeTeam} <span style="color:#666;">vs</span> ${ag.awayTeam}</div>
                    <div style="font-size:0.8rem; color:#aaa; margin-top:4px;">${ag.competition} ${ag.photographed ? '<i class="fas fa-camera" style="color:var(--primary); margin-left:5px;"></i>' : ''}</div>
                </div>
            </div>
            <div style="color:#666; font-size:0.85rem; text-align:right;">
                ${ag.venue || 'Lieu non défini'}<br>
                ${ag.time || '--:--'}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Render Stats Form
function renderStatsForm() {
    if (!statsData) return;

    // Competition Distribution
    const compValues = statsData.competitionDistribution.values;
    document.getElementById('comp-n1').value = compValues[0];
    document.getElementById('comp-n3').value = compValues[1];
    document.getElementById('comp-cup').value = compValues[2];
    document.getElementById('comp-other').value = compValues[3];

    // Season Evolution
    const monthValues = statsData.seasonEvolution.values;
    document.getElementById('month-aug').value = monthValues[0];
    document.getElementById('month-sep').value = monthValues[1];
    document.getElementById('month-oct').value = monthValues[2];
    document.getElementById('month-nov').value = monthValues[3];
    document.getElementById('month-dec').value = monthValues[4];
    document.getElementById('month-jan').value = monthValues[5];
    document.getElementById('month-feb').value = monthValues[6] || 0;
    document.getElementById('month-mar').value = monthValues[7] || 0;
    document.getElementById('month-apr').value = monthValues[8] || 0;
    document.getElementById('month-may').value = monthValues[9] || 0;

    // Photo Types
    const typeValues = statsData.photoTypes.values;
    document.getElementById('type-action').value = typeValues[0];
    document.getElementById('type-portraits').value = typeValues[1];
    document.getElementById('type-ambiance').value = typeValues[2];
    document.getElementById('type-celebrations').value = typeValues[3];

    // Status
    if (statsData.status && statsData.status.available !== undefined) {
        document.getElementById('status-available').value = statsData.status.available.toString();
    }

    // Impact Numérique
    if (statsData.impactNumerique) {
        const imp = statsData.impactNumerique;
        document.getElementById('insta-followers').value = imp.instaFollowers || 0;
        document.getElementById('insta-likes').value = imp.instaLikes || 0;
        document.getElementById('insta-reach').value = imp.instaReach || 0;
        document.getElementById('tiktok-views').value = imp.tiktokViews || 0;
        document.getElementById('tiktok-likes').value = imp.tiktokLikes || 0;
        document.getElementById('tiktok-record').value = imp.tiktokRecord || 0;
    }
}

// Open Album Modal
function openEditModal(index) {
    editingIndex = index;
    const album = albums[index];

    document.getElementById('modal-title').innerText = "Modifier l'Album";
    document.getElementById('album-title').value = album.title;
    document.getElementById('album-category').value = album.category;
    document.getElementById('album-cover').value = album.cover;
    document.getElementById('album-images').value = album.images.join('\n');

    // Try to guess folder from first image to select it in the dropdown
    if (album.images && album.images.length > 0) {
        const firstImg = album.images[0];
        const match = firstImg.match(/images\/([^\/]+)\//);
        if (match && match[1]) {
            document.getElementById('album-folder').value = match[1];
        }
    } else {
        document.getElementById('album-folder').value = "";
    }

    deleteAlbumBtn.style.display = 'block';
    modal.classList.add('open');
}

// Open Match Modal
function openEditMatchModal(index) {
    editingMatchIndex = index;
    const match = matches[index];

    document.getElementById('match-modal-title').innerText = "Modifier le Match";
    document.getElementById('match-home-team').value = match.homeTeam;
    document.getElementById('match-away-team').value = match.awayTeam;
    document.getElementById('match-date').value = match.date;
    document.getElementById('match-competition').value = match.competition;
    document.getElementById('match-badge').value = match.competitionBadge;
    document.getElementById('match-home-logo').value = match.homeLogo;
    document.getElementById('match-away-logo').value = match.awayLogo;
    document.getElementById('match-album-id').value = match.albumId || '';

    deleteMatchBtn.style.display = 'block';
    matchModal.classList.add('open');
}

// Open Modal for New Album
addAlbumBtn.onclick = () => {
    editingIndex = -1;
    document.getElementById('modal-title').innerText = "Nouvel Album";
    form.reset();

    // Auto-generate today's date + basic title id format
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('album-folder').value = "";
    document.getElementById('album-images').value = "";

    deleteAlbumBtn.style.display = 'none';
    modal.classList.add('open');
};

// Open Modal for New Match
addMatchBtn.onclick = () => {
    editingMatchIndex = -1;
    document.getElementById('match-modal-title').innerText = "Nouveau Match";
    matchForm.reset();
    document.getElementById('match-home-logo').value = "images/logos/fcsm.png";
    deleteMatchBtn.style.display = 'none';
    matchModal.classList.add('open');
};

// Open Modals for Affiches & Agenda
addAfficheBtn.onclick = () => {
    editingAfficheIndex = -1;
    document.getElementById('affiche-modal-title').innerText = "Nouvelle Affiche";
    afficheForm.reset();
    document.getElementById('affiche-home-logo').value = "images/logos/fcsm.png";
    deleteAfficheBtn.style.display = 'none';
    afficheModal.classList.add('open');
};

addAgendaBtn.onclick = () => {
    editingAgendaIndex = -1;
    document.getElementById('agenda-modal-title').innerText = "Nouveau Match";
    agendaForm.reset();
    deleteAgendaBtn.style.display = 'none';

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('agenda-date').value = today;

    agendaModal.classList.add('open');
};

// Close Modals
closeModalBtn.onclick = () => modal.classList.remove('open');
closeMatchModalBtn.onclick = () => matchModal.classList.remove('open');
document.querySelector('.close-affiche-modal').onclick = () => afficheModal.classList.remove('open');
document.querySelector('.close-agenda-modal').onclick = () => agendaModal.classList.remove('open');

window.onclick = (e) => {
    if (e.target == modal) modal.classList.remove('open');
    if (e.target == matchModal) matchModal.classList.remove('open');
    if (e.target == afficheModal) afficheModal.classList.remove('open');
    if (e.target == agendaModal) agendaModal.classList.remove('open');
};

// Form Submit (Albums)
form.onsubmit = (e) => {
    e.preventDefault();

    const title = document.getElementById('album-title').value;
    const category = document.getElementById('album-category').value;
    const cover = document.getElementById('album-cover').value;
    const imagesRaw = document.getElementById('album-images').value;

    const images = imagesRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    // Auto-slugify ID based on title+date if new
    const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newAlbumData = {
        id: editingIndex >= 0 && albums[editingIndex].id ? albums[editingIndex].id : `${new Date().toISOString().split('T')[0]}_${slugify(title)}`,
        title,
        category,
        cover,
        images,
        date: editingIndex >= 0 && albums[editingIndex].date ? albums[editingIndex].date : new Date().toISOString()
    };

    if (editingIndex >= 0) {
        albums[editingIndex] = newAlbumData;
    } else {
        // Enforce chronological sorting (newest first)
        albums.unshift(newAlbumData);
    }
    modal.classList.remove('open');
    renderList();
};

// Sync Matches
document.getElementById('sync-matches-btn').onclick = () => {
    if (!confirm("Voulez-vous écraser la liste par les 3 derniers albums ?")) return;

    const sortedAlbums = [...albums].sort((a, b) => new Date(b.date) - new Date(a.date));
    const topAlbums = sortedAlbums.slice(0, 3);

    matches = topAlbums.map((album, idx) => {
        let homeTeam = "DOMICILE";
        let awayTeam = "EXTERIEUR";
        let cleanTitle = album.title.replace(/^U19\s+/i, '').trim();

        if (cleanTitle.includes(" vs ")) {
            const parts = cleanTitle.split(" vs ");
            homeTeam = parts[0].trim();
            awayTeam = parts[1].trim();
        }

        let competitionBadge = "badge-reg";
        let catUpper = album.category.toUpperCase();
        if (catUpper.includes("NATIONAL 1") || catUpper === "N1") competitionBadge = "badge-n1";
        else if (catUpper.includes("NATIONAL 3") || catUpper === "N3") competitionBadge = "badge-n3";
        else if (catUpper.includes("COUPE")) competitionBadge = "badge-cup";
        else if (catUpper.includes("U19")) competitionBadge = "badge-u19";

        let homeLogo = "";
        let awayLogo = "";

        const removeAccents = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        clubsData.forEach(div => {
            div.clubs.forEach(c => {
                let cNameL = removeAccents(c.name.toLowerCase());
                let hL = removeAccents(homeTeam.toLowerCase());
                let aL = removeAccents(awayTeam.toLowerCase());
                if (hL.includes(cNameL) || cNameL.includes(hL)) homeLogo = c.logo;
                if (aL.includes(cNameL) || cNameL.includes(aL)) awayLogo = c.logo;
            });
        });

        // Try to find the exact date from the cover path or id
        let matchDate = new Date().toISOString().split('T')[0];
        const dateMatch = (album.cover || album.id || "").match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
            matchDate = dateMatch[0];
        } else if (album.date) {
            matchDate = album.date.split('T')[0];
        }

        if (!homeLogo) homeLogo = "images/logos/fcsm.png"; // Fallback home

        return {
            id: Date.now() + idx,
            homeTeam,
            awayTeam,
            date: matchDate,
            competition: album.category,
            competitionBadge,
            homeLogo,
            awayLogo,
            albumId: album.id
        };
    });

    renderMatches();
    alert("Matchs générés avec succès. Vérifiez les logos puis cliquez sur Sauvegarder !");
};

// Form Submit (Matches)
matchForm.onsubmit = (e) => {
    e.preventDefault();

    const newMatchData = {
        id: editingMatchIndex >= 0 ? matches[editingMatchIndex].id : Date.now(),
        homeTeam: document.getElementById('match-home-team').value,
        awayTeam: document.getElementById('match-away-team').value,
        date: document.getElementById('match-date').value,
        competition: document.getElementById('match-competition').value,
        competitionBadge: document.getElementById('match-badge').value,
        homeLogo: document.getElementById('match-home-logo').value,
        awayLogo: document.getElementById('match-away-logo').value,
        albumId: document.getElementById('match-album-id').value || ''
    };

    if (editingMatchIndex >= 0) {
        matches[editingMatchIndex] = newMatchData;
    } else {
        matches.push(newMatchData);
    }
    matchModal.classList.remove('open');
    renderMatches();
};

afficheForm.onsubmit = (e) => {
    e.preventDefault();
    const newData = {
        date: document.getElementById('affiche-date').value,
        homeTeam: document.getElementById('affiche-home').value,
        awayTeam: document.getElementById('affiche-away').value,
        homeLogo: document.getElementById('affiche-home-logo').value,
        awayLogo: document.getElementById('affiche-away-logo').value,
        competition: document.getElementById('affiche-competition').value,
        badgeClass: document.getElementById('affiche-badge').value
    };

    if (editingAfficheIndex >= 0) {
        topAffiches[editingAfficheIndex] = newData;
    } else {
        topAffiches.unshift(newData); // Always put latest at the top
    }
    afficheModal.classList.remove('open');
    renderAffiches();
};

agendaForm.onsubmit = (e) => {
    e.preventDefault();
    const newData = {
        id: editingAgendaIndex >= 0 ? agenda[editingAgendaIndex].id : Date.now().toString(),
        date: document.getElementById('agenda-date').value,
        time: document.getElementById('agenda-time').value,
        homeTeam: document.getElementById('agenda-home').value,
        awayTeam: document.getElementById('agenda-away').value,
        competition: document.getElementById('agenda-competition').value,
        venue: document.getElementById('agenda-venue').value,
        type: document.getElementById('agenda-type').value,
        notes: document.getElementById('agenda-notes').value,
        photographed: document.getElementById('agenda-photographed').checked
    };

    if (editingAgendaIndex >= 0) {
        agenda[editingAgendaIndex] = newData;
    } else {
        agenda.unshift(newData);
    }
    agendaModal.classList.remove('open');
    renderAgenda();
};

// Import from Google Calendar (iCal link)
const importGcalBtn = document.getElementById('import-gcal-btn');
if (importGcalBtn) {
    importGcalBtn.onclick = async () => {
        const url = prompt("Collez le lien de l'adresse secrète iCal de votre agenda Google Calendar (https://...) :");
        if (!url) return;

        showStatus('Importation en cours', 'Téléchargement et analyse de l\'agenda Google...');
        try {
            const res = await fetch('/api/import-ical', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Filter out events that might already be in the agenda to prevent huge duplicates (optional, we'll just append for now but checking dates is good)
                let addedCount = 0;
                data.events.forEach(ev => {
                    // Basic duplicate check by date and homeTeam
                    const isDup = agenda.some(a => a.date === ev.date && a.homeTeam === ev.homeTeam);
                    if (!isDup && ev.date) {
                        agenda.unshift(ev);
                        addedCount++;
                    }
                });
                renderAgenda();
                hideStatus();
                alert(`${addedCount} nouveaux événements importés avec succès ! Pensez à "Sauvegarder Agenda".`);
            } else {
                hideStatus();
                alert('Erreur lors de l\'importation: ' + (data.error || 'Erreur inconnue'));
            }
        } catch (err) {
            hideStatus();
            alert('Erreur réseau: ' + err.message);
        }
    };
}

// Delete Album
deleteAlbumBtn.onclick = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet album ?')) {
        albums.splice(editingIndex, 1);
        modal.classList.remove('open');
        renderList();
    }
};

// Delete Match
deleteMatchBtn.onclick = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
        matches.splice(editingMatchIndex, 1);
        matchModal.classList.remove('open');
        renderMatches();
    }
};

deleteAfficheBtn.onclick = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette affiche ?')) {
        topAffiches.splice(editingAfficheIndex, 1);
        afficheModal.classList.remove('open');
        renderAffiches();
    }
};

deleteAgendaBtn.onclick = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce match de l\'agenda ?')) {
        agenda.splice(editingAgendaIndex, 1);
        agendaModal.classList.remove('open');
        renderAgenda();
    }
};

// Consolidate Save functionality into one button
saveAllBtn.onclick = async () => {
    showStatus('Sauvegarde en cours...', 'Veuillez patienter...');

    // 1. Prepare Stats Data
    if (statsData) {
        statsData.competitionDistribution.values = [
            parseInt(document.getElementById('comp-n1').value) || 0,
            parseInt(document.getElementById('comp-n3').value) || 0,
            parseInt(document.getElementById('comp-cup').value) || 0,
            parseInt(document.getElementById('comp-other').value) || 0
        ];

        statsData.seasonEvolution.values = [
            parseInt(document.getElementById('month-aug').value) || 0,
            parseInt(document.getElementById('month-sep').value) || 0,
            parseInt(document.getElementById('month-oct').value) || 0,
            parseInt(document.getElementById('month-nov').value) || 0,
            parseInt(document.getElementById('month-dec').value) || 0,
            parseInt(document.getElementById('month-jan').value) || 0,
            parseInt(document.getElementById('month-feb').value) || 0,
            parseInt(document.getElementById('month-mar').value) || 0,
            parseInt(document.getElementById('month-apr').value) || 0,
            parseInt(document.getElementById('month-may').value) || 0
        ];

        statsData.photoTypes.values = [
            parseInt(document.getElementById('type-action').value) || 0,
            parseInt(document.getElementById('type-portraits').value) || 0,
            parseInt(document.getElementById('type-ambiance').value) || 0,
            parseInt(document.getElementById('type-celebrations').value) || 0
        ];
        
        // Impact Numérique
        statsData.impactNumerique = {
            instaFollowers: parseInt(document.getElementById('insta-followers').value) || 0,
            instaLikes: parseInt(document.getElementById('insta-likes').value) || 0,
            instaReach: parseInt(document.getElementById('insta-reach').value) || 0,
            tiktokViews: parseInt(document.getElementById('tiktok-views').value) || 0,
            tiktokLikes: parseInt(document.getElementById('tiktok-likes').value) || 0,
            tiktokRecord: parseInt(document.getElementById('tiktok-record').value) || 0
        };

        if (!statsData.status) statsData.status = {};
        statsData.status.available = document.getElementById('status-available').value === 'true';

        const total = statsData.photoTypes.values.reduce((a, b) => a + b, 0);
        if (total !== 100) {
            hideStatus();
            alert(`❌ Le total des types de photos doit = 100% (actuellement ${total}%)`);
            return;
        }
    }

    try {
        const [albumsRes, matchesRes, statsRes, affichesRes, agendaRes, instaRes, clubsRes] = await Promise.all([
            fetch('/api/albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(albums)
            }),
            fetch('/api/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recentMatches: matches })
            }),
            fetch('/api/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statsData)
            }),
            fetch('/api/top-affiches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(topAffiches)
            }),
            fetch('/api/agenda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agenda)
            }),
            fetch('/api/instagram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(instaPosts)
            }),
            fetch('/api/clubs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clubsData)
            })
        ]);

        hideStatus();
        if (albumsRes.ok && matchesRes.ok && statsRes.ok && affichesRes.ok && agendaRes.ok && instaRes.ok && clubsRes.ok) {
            alert('Sauvegardé avec succès !');
        } else {
            alert('Erreur partielle lors de la sauvegarde.');
        }
    } catch (err) {
        hideStatus();
        alert('Erreur réseau: ' + err);
    }
};


// Optimize Images Button
document.getElementById('optimize-btn').onclick = async () => {
    showStatus('Optimisation des images...', 'Veuillez patienter pendant que les images sont optimisées');

    try {
        const res = await fetch('/api/optimize', {
            method: 'POST'
        });

        const data = await res.json();

        if (res.ok && data.success) {
            addLog('✅ Optimisation réussie !', 'success');
            addLog(data.output);

            setTimeout(() => {
                hideStatus();
                alert('Images optimisées avec succès !');
            }, 2000);
        } else {
            addLog('❌ Erreur lors de l\'optimisation', 'error');
            addLog(data.error || 'Erreur inconnue', 'error');

            setTimeout(() => {
                hideStatus();
                alert('Erreur lors de l\'optimisation. Vérifiez les logs.');
            }, 2000);
        }
    } catch (err) {
        addLog('❌ Erreur réseau', 'error');
        addLog(err.message, 'error');

        setTimeout(() => {
            hideStatus();
            alert('Erreur réseau: ' + err.message);
        }, 2000);
    }
};

// Deploy Button
document.getElementById('deploy-btn').onclick = async () => {
    const message = prompt('Message de commit:', 'Mise à jour portfolio via admin');

    if (!message) return;

    showStatus('Déploiement en cours...', 'Git add, commit et push vers GitHub');

    try {
        const res = await fetch('/api/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            addLog('✅ Déploiement réussi !', 'success');
            addLog(data.output);
            addLog('🌍 Vercel va déployer automatiquement dans quelques instants', 'success');

            setTimeout(() => {
                hideStatus();
                alert('Déploiement réussi ! Vercel va déployer dans quelques instants.');
            }, 3000);
        } else {
            addLog('❌ Erreur lors du déploiement', 'error');
            addLog(data.error || 'Erreur inconnue', 'error');
            if (data.stdout) addLog(data.stdout);
            if (data.stderr) addLog(data.stderr, 'error');

            setTimeout(() => {
                hideStatus();
                alert('Erreur lors du déploiement. Vérifiez les logs.');
            }, 2000);
        }
    } catch (err) {
        addLog('❌ Erreur réseau', 'error');
        addLog(err.message, 'error');

        setTimeout(() => {
            hideStatus();
            alert('Erreur réseau: ' + err.message);
        }, 2000);
    }
};

// Status overlay functions
function showStatus(title, message) {
    document.getElementById('status-title').innerText = title;
    document.getElementById('status-message').innerText = message;
    document.getElementById('status-log').innerHTML = '';
    document.getElementById('status-overlay').style.display = 'flex';
}

function hideStatus() {
    document.getElementById('status-overlay').style.display = 'none';
}

function addLog(message, className = '') {
    const log = document.getElementById('status-log');
    const p = document.createElement('p');
    p.textContent = message;
    if (className) p.className = className;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
}


// Export Agenda to Google Calendar CSV
document.getElementById('export-gcal-btn').onclick = () => {
    // Generate CSV data for Google Calendar
    let csvContent = 'Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location,Private\n';

    agenda.forEach(ag => {
        const subject = `${ag.homeTeam} vs ${ag.awayTeam} - ${ag.competition}`;
        // Google Calendar likes MM/DD/YYYY formatted dates
        const dateParts = ag.date.split('-');
        const startDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
        const startTime = ag.time ? ag.time + ':00' : '';
        // Approximate end time (+2 hours)
        let endTime = '';
        if (ag.time) {
            const timeParts = ag.time.split(':');
            let endHour = parseInt(timeParts[0]) + 2;
            if (endHour >= 24) endHour = endHour - 24;
            endTime = `${endHour.toString().padStart(2, '0')}:${timeParts[1]}:00`;
        }
        const allDay = ag.time ? 'False' : 'True';
        const notes = ag.notes ? `"${ag.notes.replace(/"/g, '""')}"` : '';
        const venue = ag.venue ? `"${ag.venue.replace(/"/g, '""')}"` : '';

        csvContent += `"${subject}",${startDate},${startTime},${startDate},${endTime},${allDay},${notes},${venue},True\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "agenda_shootedbyalexis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// === INSTAGRAM LOGIC ===
function renderInsta() {
    const list = document.getElementById('insta-list');
    list.innerHTML = '';
    instaPosts.forEach((post, index) => {
        const div = document.createElement('div');
        div.className = 'album-card';
        div.innerHTML = `
            <img src="../${post.image}" alt="${post.alt}" class="album-cover">
            <div class="card-content">
                <h3>${post.alt}</h3>
                <p style="font-size:0.8rem;word-break:break-all;">${post.url.substring(0, 30)}...</p>
                <div class="card-actions">
                    <button class="btn btn-warning btn-sm" onclick="editInsta(${index})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteInsta(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}
let editingInstaIndex = -1;
document.getElementById('add-insta-btn').onclick = () => {
    editingInstaIndex = -1;
    const url = prompt("URL du post Instagram:");
    if (!url) return;
    const img = prompt("Chemin de l'image (ex: images/...webp):");
    if (!img) return;
    const alt = prompt("Texte alternatif (Equipe A vs Equipe B):");
    instaPosts.unshift({ url, image: img, alt: alt || "Post Instagram" });
    renderInsta();
};
window.editInsta = (index) => {
    editingInstaIndex = index;
    const post = instaPosts[index];
    const url = prompt("URL du post Instagram:", post.url);
    if (!url) return;
    const img = prompt("Chemin de l'image:", post.image);
    if (!img) return;
    const alt = prompt("Texte:", post.alt);
    instaPosts[index] = { url, image: img, alt: alt || "Post Instagram" };
    renderInsta();
};
window.deleteInsta = (index) => {
    if (confirm("Supprimer ce post ?")) {
        instaPosts.splice(index, 1);
        renderInsta();
    }
};

// === CLUBS LOGIC ===
function renderClubs() {
    const list = document.getElementById('clubs-list');
    list.innerHTML = '';
    clubsData.forEach((division, divIndex) => {
        const div = document.createElement('div');
        div.style.marginBottom = '2rem';
        div.style.background = 'var(--surface)';
        div.style.padding = '1rem';
        div.style.borderRadius = '8px';

        let clubsHTML = division.clubs.map((c, cIndex) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid #333;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="../${c.logo}" style="width:30px;height:30px;object-fit:contain;">
                    <span>${c.name}</span>
                </div>
                <div>
                    <button class="btn btn-outline btn-sm" onclick="moveClubUp(${divIndex}, ${cIndex})" ${(cIndex === 0) ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                    <button class="btn btn-outline btn-sm" onclick="moveClubDown(${divIndex}, ${cIndex})" ${(cIndex === division.clubs.length - 1) ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                    <button class="btn btn-warning btn-sm" onclick="promptEditClub(${divIndex}, ${cIndex})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteClub(${divIndex}, ${cIndex})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0;"><img src="../${division.logo}" style="width:20px; vertical-align:middle; margin-right:5px;" onerror="this.style.display='none'">${division.name}</h3>
                <button class="btn btn-outline btn-sm" onclick="addClub(${divIndex})"><i class="fas fa-plus"></i> Ajouter un club</button>
            </div>
            <div>${clubsHTML}</div>
        `;
        list.appendChild(div);
    });
}
window.addClub = (divIndex) => {
    const name = prompt("Nom du club:");
    if (!name) return;
    const logo = prompt("Chemin du logo (ex: images/logos/club.png):");
    if (!logo) return;
    clubsData[divIndex].clubs.push({ name, logo });
    renderClubs();
};
window.promptEditClub = (divIndex, cIndex) => {
    const club = clubsData[divIndex].clubs[cIndex];
    const name = prompt("Nom du club:", club.name);
    if (!name) return;
    const logo = prompt("Chemin du logo:", club.logo);
    if (!logo) return;
    clubsData[divIndex].clubs[cIndex] = { name, logo };
    renderClubs();
};
window.deleteClub = (divIndex, cIndex) => {
    if (confirm("Supprimer ce club ?")) {
        clubsData[divIndex].clubs.splice(cIndex, 1);
        renderClubs();
    }
};
window.moveClubUp = (divIndex, cIndex) => {
    if (cIndex === 0) return;
    const temp = clubsData[divIndex].clubs[cIndex];
    clubsData[divIndex].clubs[cIndex] = clubsData[divIndex].clubs[cIndex - 1];
    clubsData[divIndex].clubs[cIndex - 1] = temp;
    renderClubs();
};
window.moveClubDown = (divIndex, cIndex) => {
    if (cIndex === clubsData[divIndex].clubs.length - 1) return;
    const temp = clubsData[divIndex].clubs[cIndex];
    clubsData[divIndex].clubs[cIndex] = clubsData[divIndex].clubs[cIndex + 1];
    clubsData[divIndex].clubs[cIndex + 1] = temp;
    renderClubs();
};

document.getElementById('restore-backup-btn').onclick = async () => {
    if (!confirm("ATTENTION : Cela va annuler le dernier déploiement et restaurer les données du précédent push. Êtes-vous absolument sûr ?")) return;

    showStatus('Restauration en cours...', 'Annulation du dernier commit et push...');
    try {
        const res = await fetch('/api/restore-backup', { method: 'POST' });
        const result = await res.json();
        if (res.ok && result.success) {
            hideStatus();
            alert("Restauration réussie ! La page va se recharger.");
            location.reload();
        } else {
            hideStatus();
            alert("Erreur lors de la restauration : " + (result.error || 'Inconnue'));
        }
    } catch (err) {
        hideStatus();
        alert("Erreur réseau : " + err);
    }
};

// Init
loadData();
