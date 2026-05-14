// --- CONFIGURATION ---
const CONFIG = {
    scrollDuration: 1.2,
    loaderMinTime: 800,
    seasonStart: "2025-08-08",
    seasonEnd: "2026-05-15"
};

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initSmoothScroll();
    initLazyLoad(); // Start observer early
    initGallery();

    // Defer non-critical tasks after first paint
    requestAnimationFrame(() => {
        initAnimations();
        initStats();
        initRecentMatches();
        initInteractions();

        // Patch Mobile pour le curseur
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
            initCursorGlow();
        }
    });
});

function initLazyLoad() {
    const imgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                const srcset = img.getAttribute('data-srcset');

                if (src) {
                    img.src = src;
                    img.onload = () => img.classList.add('loaded');
                }
                if (srcset) {
                    img.srcset = srcset;
                }

                observer.unobserve(img);
            }
        });
    }, { rootMargin: "200px 0px" });

    // Expose observer globally or attach to a window property if needed, 
    // but here we can just query all .blur-load images dynamically when adding them.
    window.lazyObserver = imgObserver;
}

// --- LOADER ---
function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    // Check local session to see if we already visited
    const visited = sessionStorage.getItem('visited');

    if (visited) {
        // Fast load (no loader)
        loader.style.display = 'none';
        document.body.classList.add('fast-load');
    } else {
        // First visit in this session
        sessionStorage.setItem('visited', 'true');
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }, CONFIG.loaderMinTime);
    }
}

// --- SMOOTH SCROLL (LENIS) ---
function initSmoothScroll() {
    if (typeof Lenis === 'undefined') return;
    const lenis = new Lenis({
        duration: CONFIG.scrollDuration,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true
    });
    window.lenis = lenis;

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

// --- ANIMATIONS & OBSERVERS ---
function initAnimations() {
    const isMobile = window.innerWidth < 768;

    // Observer générique pour .reveal (one-shot : unobserve après activation pour réduire l'INP)
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: isMobile ? 0.05 : 0.1 });

    document.querySelectorAll('.reveal, .social-dashboard-grid').forEach(el => observer.observe(el));

    // TYPING HERO (Seulement si présent)
    const typeText = document.querySelector(".type-text");
    if (typeText) {
        const words = ["L'INTENSITÉ", "LE MOUVEMENT", "L'ÉMOTION", "LE FOOTBALL"];
        let wordIndex = 0, charIndex = 0, isDeleting = false;
        function type() {
            const currentWord = words[wordIndex];
            if (isDeleting) { typeText.textContent = currentWord.substring(0, charIndex - 1); charIndex--; }
            else { typeText.textContent = currentWord.substring(0, charIndex + 1); charIndex++; }
            if (!isDeleting && charIndex === currentWord.length) { isDeleting = true; setTimeout(type, 2000); }
            else if (isDeleting && charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % words.length; setTimeout(type, 500); }
            else { setTimeout(type, isDeleting ? 50 : 150); }
        }
        type();
    }

    // COMPTEURS STATS (Accueil & Stats Page)
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                if (stat.classList.contains('counted')) return;

                const rawTarget = stat.getAttribute('data-target');
                if (!rawTarget) return;

                const target = +rawTarget;
                let current = 0;
                stat.classList.add('counted');

                // Vitesse adaptée selon le chiffre
                const increment = Math.max(1, Math.ceil(target / 40));

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    stat.innerText = current.toLocaleString();
                }, 30);

                // On arrête d'observer une fois lancé
                statsObserver.unobserve(stat);
            }
        });
    }, { threshold: isMobile ? 0.1 : 0.5 });

    // Cible tous les chiffres animés (classe stat-num et social-num)
    document.querySelectorAll('.stat-num, .social-num').forEach(el => statsObserver.observe(el));
}

// --- INTERACTIONS ---
function initInteractions() {
    // FAQ
    document.querySelectorAll('.faq-question').forEach(item => {
        item.addEventListener('click', () => {
            const parent = item.parentElement;
            const answer = parent.querySelector('.faq-answer');
            document.querySelectorAll('.faq-item').forEach(other => {
                if (other !== parent && other.classList.contains('active')) {
                    other.classList.remove('active');
                    other.querySelector('.faq-answer').style.maxHeight = null;
                    other.querySelector('.faq-answer').classList.remove('open');
                }
            });
            parent.classList.toggle('active');
            answer.classList.toggle('open');
            answer.style.maxHeight = parent.classList.contains('active') ? answer.scrollHeight + "px" : null;
        });
    });
}

function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let currentX = mouseX, currentY = mouseY;
    let isAnimating = false;

    // Initialize position to top-left so transform relative works properly
    glow.style.left = '0px';
    glow.style.top = '0px';
    glow.style.transform = `translate3d(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px), 0)`;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animate);
        }
    }, { passive: true });

    function animate() {
        const dx = mouseX - currentX;
        const dy = mouseY - currentY;

        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
            isAnimating = false;
            return;
        }

        // Lissage (lerp)
        currentX += dx * 0.15;
        currentY += dy * 0.15;

        // Utiliser transform: translate3d pour utiliser l'accélération matérielle
        // Math.round évite le sous-pixel rendering coûteux
        glow.style.transform = `translate3d(calc(-50% + ${Math.round(currentX * 10) / 10}px), calc(-50% + ${Math.round(currentY * 10) / 10}px), 0)`;

        if (isAnimating) {
            requestAnimationFrame(animate);
        }
    }

    isAnimating = true;
    requestAnimationFrame(animate);
}

// --- GALERIE ---
let currentAlbumImages = [];
let currentImageIndex = 0;
let allAlbumsData = []; // Store all albums for filtering

async function initGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    try {
        const response = await fetch('albums.json');
        if (!response.ok) throw new Error("Erreur fetch albums.json");
        allAlbumsData = await response.json();
        if (allAlbumsData.length > 0 && allAlbumsData[0].date) {
            allAlbumsData.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        renderAlbums(allAlbumsData);
        initFilters(); // Initialize filters after data load
    } catch (e) {
        console.warn("Pas d'albums trouvés:", e);
        container.innerHTML = "<p style='text-align:center; color:#888;'>Galerie en cours de mise à jour...</p>";
    }
}

function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter logic
            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                renderAlbums(allAlbumsData);
            } else {
                const filtered = allAlbumsData.filter(album =>
                    album.category.toUpperCase().includes(filter.toUpperCase())
                );
                renderAlbums(filtered);
            }
        });
    });
}

function renderAlbums(albums) {
    const container = document.getElementById('gallery-container');
    container.innerHTML = '';
    const existingNav = document.getElementById('gal-nav');
    if (existingNav) existingNav.remove();

    // Check if empty
    if (albums.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666; width:100%; grid-column: 1/-1;'>Aucun album dans cette catégorie.</p>";
        return;
    }

    albums.forEach((album, idx) => {
        const div = document.createElement('a');
        div.className = 'photo-card tilt-card reveal';
        div.style.transitionDelay = `${(idx + 1) * 0.05}s`;
        div.style.display = 'block';

        // Generate ID for link: favor album.id, fallback to slugified title
        const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const linkId = album.id || slugify(album.title);

        div.href = `album.html?id=${linkId}`;

        const base = album.cover.substring(0, album.cover.lastIndexOf('.'));
        const tiny = `${base}_tiny.webp`;
        const small = `${base}_small.webp`;
        const medium = `${base}_medium.webp`;

        // Check if cover is already .webp (like chateauroux optimized)
        let imgTag = '';
        if (album.cover.endsWith('.webp')) {
            if (idx < 6) {
                imgTag = `<img src="${album.cover}" alt="${album.title}" fetchpriority="high">`;
            } else {
                imgTag = `<img src="${tiny}" data-src="${album.cover}" alt="${album.title}" class="blur-load" loading="lazy">`;
            }
        } else {
            if (idx < 6) {
                imgTag = `<img 
                    src="${album.cover}" 
                    srcset="${small} 500w, ${medium} 800w, ${album.cover} 1200w"
                    sizes="(max-width: 600px) 90vw, (max-width: 900px) 50vw, 33vw"
                    alt="${album.title}"
                    fetchpriority="high">`;
            } else {
                imgTag = `<img 
                    src="${tiny}"
                    data-src="${album.cover}" 
                    data-srcset="${small} 500w, ${medium} 800w, ${album.cover} 1200w"
                    sizes="(max-width: 600px) 90vw, (max-width: 900px) 50vw, 33vw"
                    alt="${album.title}" 
                    class="blur-load"
                    loading="lazy">`;
            }
        }

        div.innerHTML = `
            ${imgTag}
            <div class="card-overlay">
                <span class="card-cat">${album.category}</span>
                <div class="card-title">${album.title}</div>
                <small class="card-count">${album.images.length} photos</small>
            </div>`;
        container.appendChild(div);

        // Observe the new image
        const img = div.querySelector('img');
        if (window.lazyObserver) window.lazyObserver.observe(img);

        setTimeout(() => div.classList.add('active'), 50);
    });
}

function loadAlbumPhotos(album, allAlbums) {
    const container = document.getElementById('gallery-container');
    const header = document.querySelector('#portfolio .section-header');
    currentAlbumImages = album.images;
    container.innerHTML = '';

    const nav = document.createElement('div');
    nav.id = 'gal-nav';
    nav.innerHTML = `<button id="back-btn">← RETOUR</button> <h3>${album.title}</h3>`;
    header.after(nav);

    document.getElementById('back-btn').onclick = () => renderAlbums(allAlbums);

    album.images.forEach((imgSrc, idx) => {
        const div = document.createElement('div');
        div.className = 'photo-card tilt-card reveal';
        div.style.transitionDelay = `${idx * 0.05}s`;
        div.onclick = () => openLightbox(idx);
        const base = imgSrc.substring(0, imgSrc.lastIndexOf('.'));
        const tiny = `${base}_tiny.webp`;
        const small = `${base}_small.webp`;
        const medium = `${base}_medium.webp`;
        const large = `${base}_large.webp`;

        div.innerHTML = `<img 
            src="${tiny}"
            data-src="${imgSrc}" 
            data-srcset="${small} 500w, ${medium} 800w, ${large} 1200w"
            sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 300px"
            alt="Photo ${album.title}" 
            class="blur-load"
            loading="lazy">`;
        container.appendChild(div);

        // Observe the new image
        const img = div.querySelector('img');
        if (window.lazyObserver) window.lazyObserver.observe(img);

        setTimeout(() => div.classList.add('active'), 100);
    });
}

// LIGHTBOX
// LIGHTBOX
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
let scale = 1;
let touchStartX = 0;
let touchEndX = 0;

function openLightbox(index) {
    if (!lightbox) return;
    currentImageIndex = index;
    updateLightboxImage();
    lightbox.classList.add('open');
    scale = 1;
    lightboxImg.style.transform = `scale(${scale})`;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function updateLightboxImage() {
    lightboxImg.src = currentAlbumImages[currentImageIndex];
    scale = 1;
    lightboxImg.style.transform = `scale(${scale})`;
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

function nextImage(e) { if (e) e.stopPropagation(); currentImageIndex = (currentImageIndex + 1) % currentAlbumImages.length; updateLightboxImage(); }
function prevImage(e) { if (e) e.stopPropagation(); currentImageIndex = (currentImageIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length; updateLightboxImage(); }

// Zoom Logic
function handleZoom(e) {
    e.preventDefault();
    scale = scale === 1 ? 2 : 1;
    lightboxImg.style.transition = 'transform 0.3s ease';
    lightboxImg.style.transform = `scale(${scale})`;
    lightboxImg.style.cursor = scale === 1 ? 'zoom-in' : 'zoom-out';
}

if (lightbox) {
    document.getElementById('lightbox-close').onclick = closeLightbox;
    document.getElementById('lb-next').onclick = nextImage;
    document.getElementById('lb-prev').onclick = prevImage;
    lightboxImg.onclick = handleZoom; // Click to zoom

    // Swipe Logic
    lightbox.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        if (scale > 1) return; // Don't swipe if zoomed
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) nextImage();
        if (touchEndX > touchStartX + threshold) prevImage();
    }

    lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });
}

// --- STATS (BARRE SAISON) ---
function initStats() {
    const bar = document.getElementById('season-bar');
    const text = document.getElementById('season-percent-text');
    if (bar && text) {
        const start = new Date(CONFIG.seasonStart).getTime();
        const end = new Date(CONFIG.seasonEnd).getTime();
        const now = new Date().getTime();

        let pct = ((now - start) / (end - start)) * 100;
        pct = Math.max(0, Math.min(100, pct));

        setTimeout(() => {
            bar.style.width = pct + "%";
            let i = 0;
            const counter = setInterval(() => {
                text.innerText = i + "%";
                if (i >= Math.floor(pct)) { clearInterval(counter); text.innerText = pct.toFixed(1) + "%"; }
                i++;
            }, 20);
        }, 500);
    }
}

// --- MODAL MATCHS (GLOBAL) ---
// Fonctions attachées à window pour être appelées depuis le HTML si besoin (onclick)
window.openMatchModal = function () {
    const modal = document.getElementById('match-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (window.lenis) window.lenis.stop();
        setTimeout(() => modal.classList.add('open'), 10);
    }
};

window.closeMatchModal = function (e) {
    const modal = document.getElementById('match-modal');
    // Ferme si l'event est direct (bouton fermer) ou si clic sur le fond
    if (modal && (!e || e.target.id === 'match-modal' || e.target.closest('.close-modal'))) {
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
        }, 300);
    }
};

// --- RECENT MATCHES ---
async function initRecentMatches() {
    const container = document.getElementById('recent-matches-timeline');
    if (!container) return;

    try {
        const response = await fetch(`recent_matches.json?t=${Date.now()}`);
        const data = await response.json();
        const matches = data.recentMatches || [];

        // Sort matches by date (newest first)
        matches.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Limit to 4 most recent matches
        const recentMatches = matches.slice(0, 4);

        recentMatches.forEach(match => {
            const card = createMatchCard(match);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading recent matches:', error);
    }
}

function createMatchCard(match) {
    let card;
    if (match.albumId) {
        card = document.createElement('a');
        card.href = `/album.html?id=${match.albumId}`;
        card.style.textDecoration = 'none';
        card.style.color = 'inherit';
    } else {
        card = document.createElement('div');
    }

    card.className = 'match-card';

    // Format date
    const date = new Date(match.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    card.innerHTML = `
        <div class="match-date">
            <i class="fa-regular fa-calendar"></i>
            ${formattedDate}
        </div>
        <div class="match-teams">
            <div class="match-team">
                <img src="${match.homeLogo}" alt="${match.homeTeam}" class="match-team-logo" onerror="this. style.display='none'">
                <span class="match-team-name">${match.homeTeam}</span>
            </div>
            <span class="match-vs">VS</span>
            <div class="match-team">
                <img src="${match.awayLogo}" alt="${match.awayTeam}" class="match-team-logo" onerror="this.style.display='none'">
                <span class="match-team-name">${match.awayTeam}</span>
            </div>
        </div>
        <span class="match-competition badge ${match.competitionBadge}">${match.competition}</span>
    `;


    return card;
}

// --- DYNAMIC HOME STATS & CONTACT STATUS ---
async function initDynamicStats() {
    try {
        const response = await fetch(`stats_data.json?t=${Date.now()}`);
        const stats = await response.json();

        // Update "Mes Terrains" numbers
        const homeN1 = document.getElementById('hm-n1');
        const homeN3 = document.getElementById('hm-n3');
        const homeCup = document.getElementById('hm-cup');
        const homeOther = document.getElementById('hm-other'); // This one has FCSM - PARIS SG, keeping it or updating?
        // Wait, the user asked to update "le nombre de matchs se mettent aussi a jour"
        if (homeN1 && stats.competitionDistribution) {
            homeN1.innerText = `${stats.competitionDistribution.values[0]} MATCHS`;
        }
        if (homeN3 && stats.competitionDistribution) {
            homeN3.innerText = `${stats.competitionDistribution.values[1]} MATCHS`;
        }
        if (homeCup && stats.competitionDistribution) {
            homeCup.innerText = `${stats.competitionDistribution.values[2]} MATCHS`;
        }

        // Contact Section Status
        const contactText = document.getElementById('contact-status-text');
        const contactDot = document.getElementById('contact-status-dot');
        const contactBadge = document.getElementById('contact-status-badge');

        if (contactText) {
            // Auto update month
            const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            const nextMonth = months[(new Date().getMonth() + 1) % 12];
            const currentMonth = months[new Date().getMonth()];

            // We use current month. If admin status is available, say Dispo, else Complet. Make it dynamic.
            const isAvailable = stats.status ? stats.status.available : true; // Default true
            const statusWord = isAvailable ? "Dispo" : "Complet";
            // We show current month, or the user can choose. We'll show current month by default.
            contactText.innerText = `${statusWord} : ${currentMonth}`;

            if (!isAvailable) {
                contactDot.style.background = '#ff4d4d'; // Red
                contactDot.style.boxShadow = '0 0 10px rgba(255, 77, 77, 0.5)';
                contactBadge.style.border = '1px solid rgba(255, 77, 77, 0.3)';
            } else {
                contactDot.style.background = '#4CAF50'; // Green
                contactDot.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                contactBadge.style.border = '1px solid rgba(76, 175, 80, 0.3)';
            }
        }
    } catch (e) {
        console.error('Error loading dynamic stats:', e);
    }
}

// --- INSTAGRAM ---
async function initInstagram() {
    const container = document.getElementById('insta-container');
    if (!container) return;

    try {
        const response = await fetch(`instagram_posts.json?t=${Date.now()}`);
        const posts = await response.json();

        container.innerHTML = posts.map((post, idx) => `
            <a href="${post.url}" target="_blank" class="insta-card tilt-card reveal" style="transition-delay: ${(idx + 1) * 0.1}s;">
                <img src="${post.image}" alt="${post.alt}" loading="lazy">
                <div class="insta-meta"><span class="insta-user">@shooted.by.alexis</span><i class="fa-brands fa-instagram insta-icon"></i></div>
            </a>
        `).join('');

        // Apply interaction observers
        document.querySelectorAll('#insta-container .reveal').forEach((el, idx) => {
            if (window.observer) window.observer.observe(el);
            // Quick fallback logic for reveal
            setTimeout(() => el.classList.add('active'), 50 + (idx * 100));
        });

    } catch (e) {
        console.error('Error loading instagram posts:', e);
    }
}

// Call on startup
document.addEventListener('DOMContentLoaded', () => {
    initDynamicStats();
    initInstagram();
});
