$(document).ready(function () {
    console.log("Pokémon script loaded.");

    // ==========================================
    // 💾 Block 4: Local Storage (Email Signup)
    // ==========================================

    // 1. Check if email exists in localStorage on page load
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
        // Triggered after a short delay for better user experience
        // setTimeout(() => {
        //     alert(`Welcome back, ${storedEmail}! Ready for more Pokémon news?`);
        // }, 500);
    }

    // 2. Handle form submission
    $('#subscribeForm').on('submit', function (e) {
        e.preventDefault(); // Prevent page refresh

        const email = $('#emailInput').val().trim();
        if (email) {
            // Store in Local Session
            localStorage.setItem('userEmail', email);

            // Show Success Message
            alert(`Thanks for signing up!\nEmail saved to Local Storage: ${email}`);

            // Clear input
            $('#emailInput').val('');
        }
    });

    // ==========================================
    // 🌟 Block 3: Calling RESTful API (PokéAPI)
    // ==========================================

    const API_BASE = "https://pokeapi.co/api/v2/pokemon/";
    const NUMBER_OF_POKEMON = 5;

    // Function to generate a random ID (Generation 1-9, roughly up to 1000)
    const getRandomPokemonId = () => Math.floor(Math.random() * 1000) + 1;

    // Fetch and render Pokemon using jQuery AJAX
    const loadPokemon = async () => {
        try {
            // We can do this in parallel using Promise.all for better performance
            const requests = [];
            for (let i = 0; i < NUMBER_OF_POKEMON; i++) {
                requests.push($.ajax({ url: `${API_BASE}${getRandomPokemonId()}`, method: 'GET' }));
            }

            const results = await Promise.all(requests);

            // Remove placeholders
            $('#pokemon-wrapper').empty();

            // Render each Pokemon
            results.forEach(data => {
                // Formatting Types and Abilities
                const typesHtml = data.types.map(t =>
                    `<span class="badge bg-primary bg-opacity-75 me-1 text-capitalize">${t.type.name}</span>`
                ).join('');

                const abilitiesHtml = data.abilities.map(a =>
                    `<span class="text-capitalize">${a.ability.name}</span>`
                ).join(', ');

                // Get highest res image or fallback
                const imageUrl = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;

                // Create tooltip content
                const tooltipContent = `<div class='text-start p-1'>
                    <strong>Types:</strong><br>${typesHtml}<br>
                    <strong class='mt-2 d-inline-block'>Abilities:</strong><br>${abilitiesHtml}
                </div>`;

                // HTML structure for a single Pokemon box (removed title attribute from here)
                const html = `
                    <div class="col">
                        <div class="pokemon-box h-100 text-center shadow-sm" 
                             data-bs-toggle="tooltip" 
                             data-bs-html="true" 
                             data-bs-placement="top"
                             data-bs-content="${encodeURIComponent(tooltipContent)}">
                            
                            <div class="pokemon-img-container">
                                <img src="${imageUrl}" alt="${data.name}" class="pokemon-img">
                            </div>
                            
                            <div class="pokemon-info">
                                <h6 class="mb-0 fw-bold text-capitalize text-dark">${data.name}</h6>
                                <small class="text-secondary opacity-75">#${data.id.toString().padStart(4, '0')}</small>
                            </div>

                        </div>
                    </div>
                `;

                $('#pokemon-wrapper').append(html);
            });

            // Initialize Bootstrap Tooltips with custom content from the data attribute
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                const encodedContent = tooltipTriggerEl.getAttribute('data-bs-content');
                return new bootstrap.Tooltip(tooltipTriggerEl, {
                    title: decodeURIComponent(encodedContent)
                });
            });

        } catch (error) {
            console.error("Error fetching PokéAPI:", error);
            $('#pokemon-wrapper').html('<div class="col-12 text-center text-danger mt-3 fw-bold">Failed to load Pokémon data from API. Please try refreshing.</div>');
        }
    };

    // ==========================================
    // ==========================================
    // 📰 Block 2: Load News API
    // ==========================================
    let currentNewsPage = 1;
    const newsApiKey = "3cf7bfccecc247d7a29e20f583c15887"; // The user will replace this

    // Helper function to create safe placeholders if missing data
    const getSafeText = (text, maxLength) => {
        if (!text) return "Pokémon News update...";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }

    function loadNewsFromAPI(page = 1, append = false) {
        // Show loading spinner on button if appending
        if (append) {
            $('#load-more-news-btn span').removeClass('d-none');
        }

        // Fetch news via Vercel Proxy
        const newsApiUrl = `/api/gnews?q=pokemon%20tcg&lang=en&max=3&apikey=${newsApiKey}`;

        $.ajax({
            url: newsApiUrl,
            method: "GET",
            success: function (response) {
                console.log(`News API Response (Page ${page}):`, response);

                if (!append) {
                    $('#news-container').empty();
                    $('#carousel-inner-content').empty();
                    $('#carousel-indicators-content').empty();
                }

                if (response.articles && response.articles.length > 0) {
                    // Map GNews 'image' to 'urlToImage' if necessary
                    response.articles = response.articles.map(a => ({
                        ...a,
                        urlToImage: a.image || a.urlToImage
                    }));

                    if (!append) {
                        // --- INITIAL LOAD --- 
                        // First 3 articles go to the Hero Carousel
                        // Next 5 articles go to the Featured News Grid

                        const carouselArticles = response.articles.slice(0, 3);
                        let carouselHtml = '';
                        let indicatorsHtml = '';

                        carouselArticles.forEach((article, index) => {
                            const activeClass = index === 0 ? 'active' : '';
                            const defaultImg = "images/pokopia.png";
                            const imgUrl = article.urlToImage || defaultImg;

                            indicatorsHtml += `
                                <button type="button" data-bs-target="#hero-carousel" data-bs-slide-to="${index}" class="${activeClass}" aria-current="${index === 0 ? 'true' : 'false'}" aria-label="Slide ${index + 1}"></button>
                            `;

                            carouselHtml += `
                                <div class="carousel-item ${activeClass}">
                                    <a href="${article.url}" target="_blank">
                                        <img src="${imgUrl}" class="d-block hero-carousel-img" alt="${getSafeText(article.title, 40)}">
                                        <div class="hero-caption-bg">
                                            <div class="container pb-3">
                                                <h1 class="text-white fw-bold text-shadow d-none d-md-block" style="font-size: 2.5rem;">${getSafeText(article.title, 80)}</h1>
                                                <h3 class="text-white fw-bold text-shadow d-block d-md-none">${getSafeText(article.title, 50)}</h3>
                                                <p class="text-light fs-5 d-none d-lg-block text-shadow mb-0 w-75">${getSafeText(article.description, 150)}</p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            `;
                        });

                        $('#carousel-inner-content').html(carouselHtml);
                        $('#carousel-indicators-content').html(indicatorsHtml);

                        // --- THE GRID (Articles 3 to 7) --- 
                        const gridArticles = response.articles.slice(3, 8);

                        if (gridArticles.length > 0) {
                            // Big Card (First Article of the grid)
                            const firstArticle = gridArticles[0];
                            const defaultBigImg = "images/pokopia.png";
                            const bigImg = firstArticle.urlToImage || defaultBigImg;

                            $('#news-container').append(`
                                <div class="col-md-8">
                                    <a href="${firstArticle.url}" target="_blank" class="text-decoration-none">
                                        <div class="news-card big-card text-white h-100 d-flex flex-column justify-content-end p-4 shadow-sm"
                                            style="background-image: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%), url('${bigImg}'); min-height: 400px; background-size: cover; background-position: center;">
                                            <h2 class="fw-bold text-shadow">${getSafeText(firstArticle.title, 60)}</h2>
                                            <p class="fs-5 text-shadow mb-0">${getSafeText(firstArticle.description, 100)}</p>
                                        </div>
                                    </a>
                                </div>
                            `);

                            // 2 Small Cards on the right
                            let rightColHtml = '<div class="col-md-4 d-flex flex-column gap-3">';
                            for (let i = 1; i <= 2; i++) {
                                if (gridArticles[i]) {
                                    const article = gridArticles[i];
                                    const img = article.urlToImage || 'images/champion.png';
                                    rightColHtml += `
                                        <a href="${article.url}" target="_blank" class="text-decoration-none h-50">
                                            <div class="news-card small-card text-white h-100 d-flex flex-column justify-content-end p-3 shadow-sm"
                                                 style="background-image: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%), url('${img}'); background-size: cover; background-position: center; min-height:192px;">
                                                <h5 class="fw-bold mb-0 text-shadow fs-6">${getSafeText(article.title, 50)}</h5>
                                            </div>
                                        </a>
                                     `;
                                }
                            }
                            rightColHtml += '</div>';
                            $('#news-container').append(rightColHtml);

                            // 2 Cards on the bottom row
                            if (gridArticles.length > 3) {
                                let bottomRowHtml = '<div class="row g-3 mt-1 w-100 append-grid-row">';
                                const bgClasses = ['bg-pkmn-pink', 'bg-pkmn-blue', 'bg-pkmn-orange'];

                                for (let i = 3; i < Math.min(6, gridArticles.length); i++) {
                                    const article = gridArticles[i];
                                    const bgColor = bgClasses[(i - 3) % bgClasses.length];

                                    const hasImage = !!article.urlToImage;
                                    const bgStyle = hasImage
                                        ? `background-image: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%), url('${article.urlToImage}'); background-size: cover; background-position: center;`
                                        : '';
                                    const classAddon = hasImage ? '' : ` ${bgColor}`;

                                    bottomRowHtml += `
                                        <div class="col-md-6">
                                            <a href="${article.url}" target="_blank" class="text-decoration-none">
                                                <div class="news-card bottom-card text-white d-flex align-items-end p-3 shadow-sm${classAddon}" style="${bgStyle} min-height: 160px;">
                                                    <h5 class="fw-bold mb-0 text-shadow fs-6">${getSafeText(article.title, 45)}</h5>
                                                </div>
                                            </a>
                                        </div>
                                     `;
                                }
                                bottomRowHtml += '</div>';
                                $('#news-container').append(bottomRowHtml);
                            }
                        }

                    } else {
                        // --- LOAD MORE (append): Just append normal size cards to the bottom ---
                        let appendHtml = '<div class="row g-3 mt-1 w-100 append-grid-row">';
                        const bgClasses = ['bg-pkmn-brown', 'bg-pkmn-pink', 'bg-pkmn-blue', 'bg-pkmn-orange'];

                        response.articles.forEach((article, index) => {
                            const bgColor = bgClasses[index % bgClasses.length];
                            const hasImage = !!article.urlToImage;
                            const bgStyle = hasImage
                                ? `background-image: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%), url('${article.urlToImage}'); background-size: cover; background-position: center;`
                                : '';
                            const classAddon = hasImage ? '' : ` ${bgColor}`;

                            // Dynamic grid sizing for flexible items (max 8 per load)
                            let colClass = 'col-sm-6 col-md-4 col-lg-3'; // default 4 cols

                            appendHtml += `
                                    <div class="${colClass} mb-2 flex-grow-1">
                                        <a href="${article.url}" target="_blank" class="text-decoration-none">
                                            <div class="news-card bottom-card text-white d-flex align-items-end p-3 shadow-sm${classAddon}" style="${bgStyle} min-height: 160px;">
                                                <h5 class="fw-bold mb-0 text-shadow fs-6">${getSafeText(article.title, 45)}</h5>
                                            </div>
                                        </a>
                                    </div>
                                `;
                        });
                        appendHtml += '</div>';

                        // We append them slowly for a nice effect
                        const $newContent = $(appendHtml).hide();
                        $('#news-container').append($newContent);
                        $newContent.fadeIn(600);
                    }

                    // Show the "Load More" button since we successfully got articles
                    $('#load-more-news-btn').show();

                } else {
                    if (!append) {
                        $('#news-container').html('<div class="col-12 text-center text-muted py-5">No recent Pokémon news found.</div>');
                    } else {
                        // No more articles to load
                        $('#load-more-news-btn').hide();
                        $('#news-container').append('<div class="col-12 text-center text-muted mt-4">No more articles to load.</div>');
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error("Error fetching News API:", error);
                if (!append) {
                    $('#news-container').html(`
                        <div class="col-12 text-center py-5">
                           <h5 class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Could not load News</h5>
                           <p class="text-muted">Please ensure you have placed your valid News API key.</p>
                        </div>
                    `);
                } else {
                    alert("Failed to load more news. Please try again.");
                }
            },
            complete: function () {
                // Always hide spinner when done
                if (append) {
                    $('#load-more-news-btn span').addClass('d-none');
                }
            }
        });
    }

    // Trigger API calls on page load
    loadPokemon();
    loadNewsFromAPI(currentNewsPage, false);

    // Event Listener for Load More button
    $('#load-more-news-btn').on('click', function () {
        currentNewsPage++;
        loadNewsFromAPI(currentNewsPage, true);
    });
});
