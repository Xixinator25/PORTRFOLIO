// --- CHARGEMENT AUTOMATIQUE ---
let albumsData = [];
let currentAlbumPhotos = [];
let currentPhotoIndex = 0;

async function loadAlbums() {
    try {
        const response = await fetch('albums.json');
        if (!response.ok) throw new Error("Fichier albums.json non trouvé");
        albumsData = await response.json();
        generateFilters(); // Add filters
        showAlbums(albumsData);
    } catch (e) {
        console.error("Erreur chargement albums:", e);
        const container = document.getElementById('gallery-container');
        container.innerHTML = "<p style='text-align:center; width:100%; color:#fff;'>Lancer le script 'node generate.js' pour voir les albums.</p>";
    }
}

// --- FILTERS ---
function generateFilters() {
    const categories = ['TOUS', ...new Set(albumsData.map(album => album.category))];
    const container = document.getElementById('filter-container');
    if (!container) return; // Should be added in HTML

    container.innerHTML = categories.map(cat =>
        `<button class="filter-btn ${cat === 'TOUS' ? 'active' : ''}" onclick="filterAlbums('${cat}')">${cat}</button>`
    ).join('');
}

function filterAlbums(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === category);
    });

    if (category === 'TOUS') {
        showAlbums(albumsData);
    } else {
        const filtered = albumsData.filter(album => album.category === category);
        showAlbums(filtered);
    }
}

// --- SMOOTH SCROLL ---
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true
});
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- LOADER ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => { loader.style.opacity = '0'; loader.style.visibility = 'hidden'; }, 2500);
});

const heroBg = document.querySelector('.hero::before');
const gearIcons = document.querySelectorAll('.js-rotate');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) heroBg.style.transform = `translateY(${scrollY * 0.5}px) translateZ(0)`;
    gearIcons.forEach(icon => icon.style.transform = `rotate(${scrollY * 0.2}deg)`);
});

// --- INTERACTION PIONS MAGNETIQUES (VERSION FIXÉE) ---
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.player-token').forEach(token => {
        const shiftValue = 20;
        const moveX = (e.clientX - window.innerWidth / 2) * -0.02;
        const moveY = (e.clientY - window.innerHeight / 2) * -0.02;
        token.style.transform = `translate(${moveX * shiftValue}px, ${moveY * shiftValue}px)`;
    });
});

// --- FAQ ---
document.querySelectorAll('.faq-question').forEach(item => {
    item.addEventListener('click', () => {
        const parent = item.parentElement;
        const answer = parent.querySelector('.faq-answer');

        document.querySelectorAll('.faq-item').forEach(otherItem => {
            if (otherItem !== parent && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
                const otherAnswer = otherItem.querySelector('.faq-answer');
                otherAnswer.style.maxHeight = null;
                otherAnswer.classList.remove('open');
            }
        });

        parent.classList.toggle('active');
        answer.classList.toggle('open');

        if (parent.classList.contains('active')) {
            answer.style.maxHeight = answer.scrollHeight + "px";
        } else {
            answer.style.maxHeight = null;
        }
    });
});

// --- TYPING ---
const textElement = document.querySelector(".type-text");
const words = ["L'INTENSITÉ", "LE MOUVEMENT", "L'ÉMOTION", "LE FOOTBALL"];
let wordIndex = 0, charIndex = 0, isDeleting = false;
function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) { textElement.textContent = currentWord.substring(0, charIndex - 1); charIndex--; }
    else { textElement.textContent = currentWord.substring(0, charIndex + 1); charIndex++; }
    if (!isDeleting && charIndex === currentWord.length) { isDeleting = true; setTimeout(type, 2000); }
    else if (isDeleting && charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % words.length; setTimeout(type, 500); }
    else { setTimeout(type, isDeleting ? 50 : 150); }
}
type();

// --- CURSOR ---
const glow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', (e) => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// --- STATS ---
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stat = entry.target;
            if (stat.classList.contains('counted')) return;
            const target = +stat.getAttribute('data-target');
            if (target === 0) { stat.innerText = "0"; stat.classList.add('counted'); return; }
            const duration = 2000;
            const stepTime = Math.max(Math.floor(duration / target), 50);
            let current = 0;
            stat.classList.add('counted');
            const timer = setInterval(() => {
                current++; stat.innerText = current;
                if (current >= target) clearInterval(timer);
            }, stepTime);
            statsObserver.unobserve(stat);
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => statsObserver.observe(el));

// --- MOBILE OBSERVER ---
const mobileObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('scroll-active');
        } else {
            entry.target.classList.remove('scroll-active');
        }
    });
}, { threshold: 0.6, rootMargin: "-10% 0px -10% 0px" });

if (window.innerWidth < 768) {
    const elementsToAnimate = document.querySelectorAll('.tilt-card, .stat-card, .gear-item, .insta-card, .review-card, .section-header h2, .zone-badge');
    elementsToAnimate.forEach(el => mobileObserver.observe(el));
}

// --- GALERIE ---
const container = document.getElementById('gallery-container');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

function showAlbums(data) {
    container.innerHTML = '';

    // Hide filter container if showing detail view of an album, show it otherwise
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) filterContainer.style.display = 'flex';

    const nav = document.getElementById('gal-nav'); if (nav) nav.remove();

    data.forEach((album, idx) => {
        const div = document.createElement('div'); div.className = 'photo-card tilt-card reveal';
        div.style.transitionDelay = `${(idx + 1) * 0.1}s`;
        div.onclick = () => showPhotos(album);
        const total = album.images.length;
        div.innerHTML = `
            <img src="${album.cover}" alt="Couverture album ${album.title}" loading="lazy">
            <div class="card-overlay">
                <span class="card-cat">${album.category}</span>
                <div class="card-title">${album.title}</div>
                <small class="card-count">${total} photos</small>
            </div>`;
        container.appendChild(div);
        setTimeout(() => div.classList.add('active'), 100);
        if (window.innerWidth < 768 && typeof mobileObserver !== 'undefined') mobileObserver.observe(div);
    });
}

function showPhotos(album) {
    container.innerHTML = '';

    // Hide filter container in detail view
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) filterContainer.style.display = 'none';

    const header = document.querySelector('#portfolio .section-header');
    if (!document.getElementById('gal-nav')) {
        const nav = document.createElement('div'); nav.id = 'gal-nav';
        nav.innerHTML = `<button onclick="loadAlbums()">← RETOUR</button> <h3>${album.title}</h3>`;
        header.after(nav);
    }

    currentAlbumPhotos = album.images; // Store for lightbox nav

    album.images.forEach((imgSrc, idx) => {
        const div = document.createElement('div'); div.className = 'photo-card tilt-card reveal';
        div.style.transitionDelay = `${idx * 0.05}s`;
        div.onclick = () => openLightbox(imgSrc, idx);
        div.innerHTML = `<img src="${imgSrc}" alt="Photo de l'album ${album.title}" loading="lazy">`;
        container.appendChild(div);
        setTimeout(() => div.classList.add('active'), 100);
        if (window.innerWidth < 768 && typeof mobileObserver !== 'undefined') mobileObserver.observe(div);
    });
}

function openLightbox(src, index = null) {
    lightboxImg.src = src;
    lightbox.classList.add('open');

    if (index !== null) {
        currentPhotoIndex = index;
    } else {
        // Fallback if opened without index
        currentPhotoIndex = currentAlbumPhotos.indexOf(src);
    }
}

function closeLightbox() {
    lightbox.classList.remove('open');
}

// Lightbox Navigation Logic
function nextPhoto(e) {
    if (e) e.stopPropagation();
    if (currentAlbumPhotos.length <= 1) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % currentAlbumPhotos.length;
    updateLightboxImage();
}

function prevPhoto(e) {
    if (e) e.stopPropagation();
    if (currentAlbumPhotos.length <= 1) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + currentAlbumPhotos.length) % currentAlbumPhotos.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const src = currentAlbumPhotos[currentPhotoIndex];

    // Tiny fade effect
    lightboxImg.style.opacity = 0.8;
    setTimeout(() => {
        lightboxImg.src = src;
        lightboxImg.style.opacity = 1;
    }, 150);
}


lightboxClose.onclick = closeLightbox;
lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); }

// Add event listeners for lightbox keys and clicks
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
});

// Setup Lightbox HTML controls if they exist (will be added in HTML)
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');
if (prevBtn) prevBtn.onclick = prevPhoto;
if (nextBtn) nextBtn.onclick = nextPhoto;


// Démarrage automatique
loadAlbums();

// Make scope global for HTML onlick handlers
window.filterAlbums = filterAlbums;
window.showAlbums = showAlbums;
window.loadAlbums = loadAlbums;
