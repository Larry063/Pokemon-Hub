$(document).ready(function () {
    let allCards = [];
    loadTcgCards();

    // Event listeners for search and filters
    $("#search-input").on("keyup", function() {
        applyFilters();
    });

    $("#type-filter").on("change", function() {
        applyFilters();
    });

    $("#hp-filter").on("change", function() {
        applyFilters();
    });

    $("#clear-filters").on("click", function() {
        $("#search-input").val("");
        $("#type-filter").val("");
        $("#hp-filter").val("");
        applyFilters();
    });
});


async function loadTcgCards() {
    // New API URL for Base Set cards
    const url = "https://www.pokemonpricetracker.com/api/v2/sets"; 
    
    try {
        const response = await fetch(url);
        const json = await response.json();
        
        // The new API structure uses 'json.cards'
        allCards = json.cards; 
        
        applyFilters(); 
    } catch (err) {
        console.error("Failed to fetch Price Tracker cards:", err);
    }
}

function renderTcgCards(cards) {
    let allHTML = '';

    cards.forEach(card => {
        // Use highRes for better quality or lowRes for faster loading
        const imageurl = card.images.highRes || card.images.lowRes;
        
        // Handle types (check if it's an array or single string)
        const types = Array.isArray(card.types) ? card.types : (card.types ? [card.types] : []);
        const typesHTML = types.map(type => 
            `<span class="type-badge type-${type.toLowerCase()}">${type}</span>`
        ).join('');

        allHTML += `
            <div class="pokemon" onclick="showCardDetail('${card.id}')">
                <img src="${imageurl}" style="width: 150px; height: auto;" onerror="this.src='unknown.png'">
                <div class="pokemon-info">
                    <small>${card.number}/${card.set.totalCards}</small><br>
                    <strong>${card.name}</strong><br>
                    <div class="type-container">${typesHTML}</div>
                    <div class="price-info" style="font-size: 0.8em; color: #2ecc71;">
                        Est: $${card.prices?.average || 'N/A'}
                    </div>
                </div>
            </div>`;
    });
    info_container.innerHTML = allHTML;
}

function applyFilters() {
    let query = $("#search-input").val().toLowerCase();
    let typeFilter = $("#type-filter").val();
    let hpFilter = $("#hp-filter").val();

    let filtered = allCards.filter(function(card) {
        // Search filter
        if (query && !card.name.toLowerCase().includes(query)) {
            return false;
        }

        // Type filter
        if (typeFilter) {
            if (!card.types || !card.types.includes(typeFilter)) {
                return false;
            }
        }

        // HP filter
        if (hpFilter) {
            const hp = card.hp ? parseInt(card.hp) : 0;
            let minHp = 0, maxHp = 999;

            switch(hpFilter) {
                case "0-50":
                    minHp = 0;
                    maxHp = 50;
                    break;
                case "50-100":
                    minHp = 50;
                    maxHp = 100;
                    break;
                case "100-150":
                    minHp = 100;
                    maxHp = 150;
                    break;
                case "150+":
                    minHp = 150;
                    maxHp = 999;
                    break;
            }

            if (hp < minHp || hp > maxHp) {
                return false;
            }
        }

        return true;
    });

    displayCards(filtered);
    updateResultsCount(filtered.length);
}



function updateResultsCount(count) {
    if (count === 0) {
        $("#results-count").text("");
    } else {
        $("#results-count").text(`Showing ${count} card${count !== 1 ? 's' : ''}`);
    }
}

$(document).on("click", ".favorite", function () {
    let name = $(this).data("name");
    let favorites = JSON.parse(localStorage.getItem("favoriteCards")) || [];
    
    if (!favorites.includes(name)) {
        favorites.push(name);
    }
    
    localStorage.setItem("favoriteCards", JSON.stringify(favorites));
    
    $(this).text("✓ Added to Favorites").prop("disabled", true);
    setTimeout(() => {
        $(this).text("♥ Add to Favorites").prop("disabled", false);
    }, 2000);
});

function displayCards(cards) {
    renderTcgCards(cards);
}