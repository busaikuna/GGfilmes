const API_BASE_URL = "http://127.0.0.1:5000/api";
let moviesData = [];
let gamesData = [];
let allContent = [];
let filteredContent = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let myList = JSON.parse(localStorage.getItem('myList')) || [];
let userRatings = JSON.parse(localStorage.getItem('userRatings')) || {};

console.log(API_BASE_URL)

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeCarousels();
    initializeSearch();
    initializeFilters();
    initializeModals();
    initializeHeader();
    loadRecommendations();
});

async function loadData() {
    try {
        const [moviesRes, gamesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/movies`),
            fetch(`${API_BASE_URL}/games`)
        ]);

        const [moviesJson, gamesJson] = await Promise.all([
            moviesRes.json(),
            gamesRes.json()
        ]);

        moviesData = moviesJson.map(movie => ({
            id: movie.id,
            title: movie.title || movie.name,
            year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
            genre: (movie.genre_ids && movie.genre_ids[0]) ? movie.genre_ids[0].toString() : "outros",
            rating: movie.vote_average || 0,
            studio: movie.production_companies ? movie.production_companies[0]?.name || "Desconhecido" : "Desconhecido",
            duration: "—",
            description: movie.overview || "Sem descrição.",
            image: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "/placeholder.svg?height=330&width=220",
            trailer: "#",
            type: "movie"
        }));

        gamesData = gamesJson.map(game => ({
            id: game.id,
            title: game.name,
            year: game.released ? game.released.split("-")[0] : "N/A",
            genre: (game.genres && game.genres[0]) ? game.genres[0].slug : "outros",
            rating: game.rating || 0,
            studio: game.developers && game.developers[0] ? game.developers[0].name : "Desconhecido",
            duration: "—",
            description: game.description_raw || game.slug,
            image: game.background_image || "/placeholder.svg?height=330&width=220",
            trailer: game.clip ? game.clip.clip : "#",
            type: "game"
        }));

        allContent = [...moviesData, ...gamesData];
        filteredContent = [...allContent];

        if (moviesData.length > 0) {
            updateHero(moviesData[0]);
        }
    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
    }
}


function initializeHeader() {
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function initializeCarousels() {
    renderCarousel('moviesCarousel', moviesData);
    renderCarousel('gamesCarousel', gamesData);
    renderCarousel('trendingCarousel', [...moviesData, ...gamesData].sort(() => Math.random() - 0.5).slice(0, 6));

    document.querySelectorAll('.carousel-container').forEach(container => {
        const carousel = container.querySelector('.carousel');
        const prevBtn = container.querySelector('.prev');
        const nextBtn = container.querySelector('.next');

        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -carousel.offsetWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: carousel.offsetWidth, behavior: 'smooth' });
        });
    });
}

function renderCarousel(carouselId, data) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    carousel.innerHTML = data.map(item => createCard(item)).join('');

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;

        const id = Number(card.dataset.id);
        const item = allContent.find(i => i.id === id);
        if (item) openDetailModal(item);
    });

}

function createCard(item) {
    const isFavorite = favorites.includes(item.id);
    const inList = myList.includes(item.id);

    return `
        <div class="card" data-id="${item.id}" data-genre="${item.genre}">
            <img src="${item.image}" alt="${item.title}" class="card-image">
            <div class="card-overlay">
                <h3 class="card-title">${item.title}</h3>
                <div class="card-meta">
                    <span class="rating"><i class="fas fa-star"></i> ${item.rating}</span>
                    <span>${item.year}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-icon" onclick="event.stopPropagation(); toggleList(${item.id})">
                        <i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i>
                    </button>
                    <button class="btn btn-icon" onclick="event.stopPropagation(); toggleFavorite(${item.id})">
                        <i class="fas fa-heart ${isFavorite ? 'active' : ''}" style="${isFavorite ? 'color: var(--danger)' : ''}"></i>
                    </button>
                </div>
            </div>
            ${item.type === 'movie' ? '<span class="card-badge">FILME</span>' : '<span class="card-badge" style="background: var(--success)">GAME</span>'}
        </div>
    `;
}

async function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const resultsGrid = document.getElementById('resultsGrid');

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length === 0) {
            searchResults.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            const results = [
                ...(data.movies || []).map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
                    genre: "movie",
                    rating: movie.vote_average || 0,
                    image: movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : "/placeholder.svg?height=330&width=220",
                    description: movie.overview || "",
                    type: "movie"
                })),
                ...(data.games || []).map(game => ({
                    id: game.id,
                    title: game.name,
                    year: game.released ? game.released.split("-")[0] : "N/A",
                    genre: (game.genres && game.genres[0]) ? game.genres[0].slug : "outros",
                    rating: game.rating || 0,
                    image: game.background_image || "/placeholder.svg?height=330&width=220",
                    description: game.description_raw || "",
                    type: "game"
                }))
            ];

            if (results.length > 0) {
                resultsGrid.innerHTML = results.map(item => createCard(item)).join('');
                searchResults.classList.remove('hidden');
            } else {
                resultsGrid.innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum resultado encontrado</p>`;
                searchResults.classList.remove('hidden');
            }
        }, 400);
    });
}


function initializeFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.filter;

            if (filter === 'all') {
                filteredContent = [...allContent];
            } else {
                filteredContent = allContent.filter(item => {
                    if (!item.genre) return false;
                    if (Array.isArray(item.genre)) return item.genre.includes(filter);
                    return item.genre === filter;
                });
            }


            renderCarousel('moviesCarousel', filteredContent.filter(item => item.type === 'movie'));
            renderCarousel('gamesCarousel', filteredContent.filter(item => item.type === 'game'));
        });
    });
}

function initializeModals() {
    const detailModal = document.getElementById('detailModal');
    const loginModal = document.getElementById('loginModal');

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            detailModal.classList.remove('active');
            loginModal.classList.remove('active');
        });
    });

    [detailModal, loginModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        star.addEventListener('click', function () {
            const rating = this.dataset.rating;
            const currentItem = detailModal.dataset.currentItem;

            if (currentItem) {
                userRatings[currentItem] = rating;
                localStorage.setItem('userRatings', JSON.stringify(userRatings));

                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            }
        });

        star.addEventListener('mouseenter', function () {
            const rating = this.dataset.rating;
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = 'var(--accent)';
                } else {
                    s.style.color = 'var(--dark)';
                }
            });
        });
    });

    document.querySelector('.star-rating').addEventListener('mouseleave', () => {
        const currentItem = detailModal.dataset.currentItem;
        const userRating = userRatings[currentItem] || 0;

        stars.forEach((s, index) => {
            if (index < userRating) {
                s.style.color = 'var(--accent)';
            } else {
                s.style.color = 'var(--dark)';
            }
        });
    });
}

function initializeStarRating() {
    const modal = document.getElementById('detailModal');
    const starContainer = modal.querySelector('.star-rating');
    if (!starContainer) return;

    const stars = starContainer.querySelectorAll('i');
    stars.forEach((star, index) => {
        const rating = index + 1;
        star.dataset.rating = rating;

        star.addEventListener('click', () => {
            const currentItem = modal.dataset.currentItem;
            if (currentItem) {
                userRatings[currentItem] = rating;
                localStorage.setItem('userRatings', JSON.stringify(userRatings));
                updateStars(stars, rating);
            }
        });

        star.addEventListener('mouseenter', () => updateStars(stars, rating));
    });

    starContainer.addEventListener('mouseleave', () => {
        const currentItem = modal.dataset.currentItem;
        const rating = userRatings[currentItem] || 0;
        updateStars(stars, rating);
    });
}

function updateStars(stars, rating) {
    stars.forEach((s, i) => {
        if (i < rating) {
            s.classList.add('active');
            s.style.color = 'var(--accent)';
        } else {
            s.classList.remove('active');
            s.style.color = 'var(--dark)';
        }
    });
}


function openDetailModal(item) {
    const modal = document.getElementById('detailModal');
    modal.dataset.currentItem = item.id;

    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalRating').innerHTML = `<i class="fas fa-star"></i> ${item.rating}`;
    document.getElementById('modalYear').textContent = item.year;
    document.getElementById('modalGenre').textContent = item.genre.toUpperCase();
    document.getElementById('modalDescription').textContent = item.description;
    document.getElementById('modalStudio').textContent = item.studio;
    document.getElementById('modalDuration').textContent = item.duration;
    document.getElementById('trailerVideo').src = item.trailer;

    const addToListBtn = document.getElementById('addToListBtn');
    const favoriteBtn = document.getElementById('favoriteBtn');

    addToListBtn.innerHTML = myList.includes(item.id) ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>';
    favoriteBtn.innerHTML = favorites.includes(item.id) ? '<i class="fas fa-heart" style="color: var(--danger)"></i>' : '<i class="fas fa-heart"></i>';

    addToListBtn.onclick = () => toggleList(item.id);
    favoriteBtn.onclick = () => toggleFavorite(item.id);

    initializeStarRating();

    modal.classList.add('active');
}


function toggleList(itemId) {
    const index = myList.indexOf(itemId);
    if (index > -1) {
        myList.splice(index, 1);
    } else {
        myList.push(itemId);
    }
    localStorage.setItem('myList', JSON.stringify(myList));

    initializeCarousels();

    const modal = document.getElementById('detailModal');
    if (modal.classList.contains('active') && modal.dataset.currentItem == itemId) {
        const btn = document.getElementById('addToListBtn');
        btn.innerHTML = myList.includes(itemId) ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>';
    }
}

function toggleFavorite(itemId) {
    const index = favorites.indexOf(itemId);
    if (index > -1) favorites.splice(index, 1);
    else favorites.push(itemId);

    localStorage.setItem('favorites', JSON.stringify(favorites));

    const card = document.querySelector(`.card[data-id="${itemId}"] i.fa-heart`);
    if (card) card.classList.toggle('active', favorites.includes(itemId));

    const modalBtn = document.getElementById('favoriteBtn');
    if (modalBtn && modalBtn.contains(card)) {
        modalBtn.innerHTML = favorites.includes(itemId)
            ? '<i class="fas fa-heart" style="color: var(--danger)"></i>'
            : '<i class="fas fa-heart"></i>';
    }
}

function updateHero(item) {
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-description');
    const heroMetaRating = document.querySelector('.hero .rating');
    const heroMetaYear = document.querySelector('.hero-meta span:nth-child(2)');
    const heroMetaGenre = document.querySelector('.hero-meta span:nth-child(3)');
    const heroBackground = document.querySelector('.hero-background img');

    heroTitle.textContent = item.title;
    heroDesc.textContent = item.description;
    heroMetaRating.innerHTML = `<i class="fas fa-star"></i> ${item.rating}`;
    heroMetaYear.textContent = item.year;
    heroMetaGenre.textContent = item.genre.toUpperCase();
    heroBackground.src = item.image;
}



function loadRecommendations() {
    const userPreferences = [...new Set([...favorites, ...myList])];

    if (userPreferences.length > 0) {
        const userItems = allContent.filter(item => userPreferences.includes(item.id));
        const genres = [...new Set(userItems.map(item => item.genre))];

        const recommended = allContent.filter(item =>
            !userPreferences.includes(item.id) && genres.includes(item.genre)
        ).sort(() => Math.random() - 0.5).slice(0, 6);

        renderCarousel('recommendedCarousel', recommended);
    } else {
        const recommended = [...allContent].sort(() => Math.random() - 0.5).slice(0, 6);
        renderCarousel('recommendedCarousel', recommended);
    }
}

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}