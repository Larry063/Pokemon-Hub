let allSets = []; // store globally so sort can re-render without re-fetching

$(document).ready(function () {
    loadExpansionSets();

    // Re-render when sort changes
    $('#sort-order').on('change', function () {
        sortAndRenderSets();
    });
});

let isLoading = false; // Keep this to prevent multiple clicks from overlapping

function loadExpansionSets() {
    let url = "https://api.pokemontcg.io/v2/sets?pageSize=250";

    $.get(url, function (data) {
        $("#loading-indicator").hide();

        allSets = data.data || [];

        if (allSets.length === 0) {
            $("#expansion-container").html(`
                <div class="col-12">
                    <div class="alert alert-info text-center py-5">
                        <p class="mb-0">No expansion sets available.</p>
                    </div>
                </div>
            `);
            return;
        }

        sortAndRenderSets();
    }).fail(function () {
        $("#loading-indicator").html(`
            <div class="alert alert-danger text-center py-5">
                Failed to load expansion sets.
            </div>
        `);
    });
}

function sortAndRenderSets() {
    const sortBy = $('#sort-order').val() || 'newest';
    let sets = [...allSets];

    sets.sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.releaseDate) - new Date(a.releaseDate);
        } else if (sortBy === 'oldest') {
            return new Date(a.releaseDate) - new Date(b.releaseDate);
        } else if (sortBy === 'name-asc') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'name-desc') {
            return b.name.localeCompare(a.name);
        }
        return 0;
    });

    let selectedSets = JSON.parse(localStorage.getItem("selectedExpansions")) || [];
    $("#expansion-container").empty();

    sets.forEach(function (set) {
        let releaseDate = formatDate(set.releaseDate);
        let cardCount = set.total || "N/A";
        let isSelected = selectedSets.some(s => s.id === set.id);

        let html = `
            <div class="col-md-4 col-lg-3 mb-4">
                <div class="expansion-card">
                    <div class="expansion-logo-container">
                        ${set.images?.logo
                ? `<img src="${set.images.logo}" alt="${set.name}">`
                : '<p class="text-muted">Logo Unavailable</p>'}
                    </div>
                    <div class="expansion-info">
                        <h5 class="expansion-name">${set.name}</h5>
                        ${set.series ? `<p class="expansion-series">Series: ${set.series}</p>` : ""}
                        <div class="expansion-stats">
                            <p><strong>Cards:</strong> ${cardCount}</p>
                            <p><strong>Released:</strong> ${releaseDate}</p>
                        </div>
                        <button class="btn ${isSelected ? "btn-success selected-set" : "btn-explore"} w-100"
                            data-set-id="${set.id}"
                            data-set-name="${set.name}">
                            ${isSelected ? "✓ Selected" : "+ Add to Filter"}
                        </button>
                    </div>
                </div>
            </div>
        `;

        $("#expansion-container").append(html);
    });
}


function formatDate(dateString) {
    if (!dateString) return "Unknown";
    let date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

$(document).on("click", ".btn-explore, .selected-set", function () {
    let setId = $(this).data("set-id");
    let setName = $(this).data("set-name");

    let selectedSets = JSON.parse(localStorage.getItem("selectedExpansions")) || [];
    let index = selectedSets.findIndex(set => set.id === setId);

    if (index !== -1) {
        // --- CASE: REMOVING THE SET ---
        selectedSets.splice(index, 1);
        $(this)
            .text("+ Add to Filter")
            .removeClass("btn-success selected-set")
            .addClass("btn-explore");

        // No Modal code here, so it won't pop up!
    } else {
        // --- CASE: ADDING THE SET ---
        selectedSets.push({ id: setId, name: setName });
        $(this)
            .text("✓ Selected")
            .removeClass("btn-explore")
            .addClass("btn-success selected-set");

        // 1. Setup and Show the Modal ONLY when adding
        $("#modalSetName").text(setName);
        $("#modal-card-grid").empty();
        $("#modal-loading").show();

        let cardModal = new bootstrap.Modal(document.getElementById('setCardsModal'));
        cardModal.show();

        // 2. Fetch cards and display
        fetchCardsBySet(setId, function (cards) {
            displayCardsInModal(cards);
        });
    }

    localStorage.setItem("selectedExpansions", JSON.stringify(selectedSets));
});

function fetchCardsBySet(setId, callback = null) {
    if (isLoading) {
        setTimeout(() => fetchCardsBySet(setId, callback), 300);
        return;
    }

    isLoading = true;
    let page = 1;
    let allCards = [];

    function fetchPage() {
        let url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250&page=${page}`;

        $.get(url, function (data) {
            allCards = allCards.concat(data.data);
            console.log(`Set ${setId} Page ${page}: ${data.data.length}`);

            if (data.data.length === 250) {
                page++;
                fetchPage();
            } else {
                console.log(`✅ Finished ${setId}: ${allCards.length} cards`);
                saveCardsToDatabase(allCards);
                isLoading = false;
                if (callback) callback(allCards);
            }
        }).fail(function () {
            console.error("Error fetching:", setId);
            isLoading = false;
            if (callback) callback();
        });
    }

    fetchPage();
}

function saveCardsToDatabase(cards) {
    try {
        let existingCards = JSON.parse(localStorage.getItem("allImportedCards")) || [];
        let updatedCards = [...existingCards, ...cards];

        // Use Map to ensure unique cards by ID
        const uniqueCards = Array.from(new Map(updatedCards.map(item => [item.id, item])).values());

        localStorage.setItem("allImportedCards", JSON.stringify(uniqueCards));
        console.log(`Successfully saved ${cards.length} cards to Browser Storage.`);
    } catch (e) {
        console.error("Storage limit reached! Cannot save more cards to LocalStorage.");
    }
}

function displayCardsInModal(cards) {
    $("#modal-loading").hide();

    if (!cards || cards.length === 0) {
        $("#modal-card-grid").html('<div class="col-12 text-center">No cards found in this set.</div>');
        return;
    }

    let html = cards.map(card => `
        <div class="col-6 col-md-4 col-lg-3 text-center">
            <div class="card h-100 border-0 shadow-sm p-2">
                <img src="${card.images.small}" class="img-fluid rounded" alt="${card.name}" loading="lazy">
                <p class="small fw-bold mb-0 mt-2 text-truncate">${card.name}</p>
                <p class="text-muted small mb-0">${card.number} / ${card.set.printedTotal}</p>
            </div>
        </div>
    `).join('');

    $("#modal-card-grid").html(html);
}