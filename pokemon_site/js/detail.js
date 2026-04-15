const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const pokemon_name = urlParams.get('name');
const is_gmax = urlParams.get('gmax');
const is_shiny = urlParams.get('shiny');
const picture = document.getElementById('picture_container')
const race_data = document.getElementById('race_data')
const description = document.getElementById('description')
const ability = document.getElementById('ability')
const evolution_container = document.getElementById('evolution')
const card_container = document.getElementById('card_container')
const title = document.getElementById('title')
const left = document.getElementById('go_left')
const right = document.getElementById('go_right')
const itemsDiv = document.querySelector('.select-items');
const selectedDiv = document.querySelector('.select-selected');
const leftBtn = document.getElementById('card_left');
const rightBtn = document.getElementById('card_right');

let imageUrl = " ";
let myChart = null; // Used to store the chart instance to avoid duplicate rendering
let pokemon;
let id = null

const tcgdex = new TCGdex('en');

function formatName(str) {
    return str.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}


async function searchAndShowAll(name) {

    card_container.innerHTML = `<p style="color: white;">Loading ${name} cards...</p>;`

    try {
        const allCards = await tcgdex.fetch('cards');
        let baseName = name;
        const parts = name.toLowerCase().split('-')
        if (parts.includes('mega') || parts.includes('gmax')) {
            baseName = name.split('-')[0];
        }
        let matches = allCards.filter(card =>
            card.name.toLowerCase().includes(baseName.toLowerCase())
        );
        if (matches.length == 0) {
            baseName = name.split('-')[0];
            matches = allCards.filter(card =>
                card.name.toLowerCase().includes(baseName.toLowerCase())
            );
        }

        if (matches.length > 0) {
            card_container.innerHTML = matches
                .filter(card => card.image !== undefined && card.image !== null)
                .map(card =>
                    `
                    <div class="card-item">
                        <img src="${card.image}/low.png" alt="${card.name}" loading="lazy">
                        <div class="card-name">${card.name}</div>
                        <div style="color: #888; font-size: 11px;">${card.id}</div>
                    </div>
                `).join('');
        } else {
            card_container.innerHTML = `
        <div style="width: 100%; display: flex; justify-content: center; align-items: center; min-height: 150px;">
            <p style="color: #ff4444; font-size: 16px; background: rgba(255,0,0,0.1); padding: 10px 20px; border-radius: 8px;">
                ⚠️ No cards found for this Pokémon.
            </p>
        </div>
    `;
        }
    } catch (error) {
        console.error("Search error:", error);
        card_container.innerHTML = `
        <div style="width: 100%; display: flex; justify-content: center; align-items: center; min-height: 150px;">
            <p style="color: #ff4444; font-size: 16px; background: rgba(255,0,0,0.1); padding: 10px 20px; border-radius: 8px;">
                Search failed. Please check network.
            </p>
        </div>
    `;
    }
}
leftBtn.addEventListener('click', () => {
    card_container.scrollBy({ left: -300, behavior: 'smooth' });
})


rightBtn.addEventListener('click', () => {
    card_container.scrollBy({ left: 300, behavior: 'smooth' });
})

window.onload = async function () {
    let typesHTML = '';
    let types_list = [];
    let evolutionHTML = '';
    const data = await fetch_data(pokemon_name);
    id = data.id.toString().padStart(3, '0');
    if (is_shiny) {
        imageUrl = data.sprites.other['official-artwork'].front_shiny ||
            data.sprites.other.home.front_shiny ||
            data.sprites.front_shiny;
    } else {
        if (parseInt(data.id) > 1000) {
            imageUrl = data.sprites.other['official-artwork'].front_default ||
                data.sprites.other.home.front_default ||
                data.sprites.front_default;
        } else {
            imageUrl = `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${id}.png`;
        }
    }
    if (!imageUrl) imageUrl = data.sprites.front_default;
    picture.style.backgroundImage = `url('${imageUrl}')`;

    // Clear old data and generate HTML using map
    if (title) {
        // Display name and ID separately
        title.innerHTML = `
        <div class="name-text">${pokemon_name}</div>
        <div class="id-number">NO. ${id}</div>
    `;
    }
    const statsHTML = data.stats.map(s => {
        return `
            <div class="stat-row">
                <span class="stat-name">${s.stat.name.toUpperCase()}:</span>
                <span class="stat-value">${s.base_stat}</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${(s.base_stat / 255) * 100}%"></div>
                </div>
            </div>
        `;
    }).join('');
    race_data.innerHTML = `
            <h3 style="color: white; text-align: center; margin-bottom: 15px;">Base Stats</h3>
            
            <div class="stats-chart-side">
                <canvas id="pokemonStatChart"></canvas>
            </div>

            <div class="stats-text-side">
                ${statsHTML}
            </div>
        `;
    initChart(data.stats);
    const desp = await getPokemonDescription(data.id)
    description.innerText = desp

    data.types.forEach(t => {
        typesHTML += `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
        types_list.push(t.type.name)
    })
    ability.innerHTML = typesHTML
    getWeaknessAndRestraint(types_list)
    const evolution = await getPokemonEvolution(pokemon_name)

    evolution.forEach((stage, i) => {
        const paddedId = stage.id.toString().padStart(3, '0');
        const arrowHTML = (i < evolution.length - 1)
            ? `<div class="evo_arrow">➔</div>`
            : '';
        evolutionHTML += `
        <div class="evolution_stage">
            <div class="evo_card" onclick=handleFormChange('${stage.name}')>
                <div class="evo_picture">
                    <img src="${`https://assets.pokemon.com/assets/cms2/img/pokedex/full/${paddedId}.png`}" alt="${pokemon.name}">
                </div>
                <div class="evo_name">${stage.name}</div>
            </div>
            ${arrowHTML}
        </div>
    `;
    })
    evolution_container.innerHTML = evolutionHTML
    const species = await getspecies(pokemon_name);
    renderPokemonStats(data, species)
    check_mega_giant(pokemon_name)
    searchAndShowAll(pokemon_name);
};

left.addEventListener('click', async () => {
    const now_id = await fetch_data(pokemon_name);
    if (now_id.id === 1) {
        Swal.fire({
            icon: 'info',
            title: 'This is the first pokemon id',
            timer: 1500,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
        });
        return
    }
    const go_to = await fetch_data(now_id.id - 1);
    window.location.href = `detail.html?name=${go_to.name}`;
})

right.addEventListener('click', async () => {
    const now_id = await fetch_data(pokemon_name);
    const go_to = await fetch_data(now_id.id + 1);
    window.location.href = `detail.html?name=${go_to.name}`;
})


const renderPokemonStats = (pokemonData, speciesData) => {
    // 1. Numerical conversion
    const height = (pokemonData.height / 10).toFixed(1); // Decimeters to meters
    const weight = (pokemonData.weight / 10).toFixed(1); // Hectograms to kilograms

    // 2. Extract Category (Genus)
    const category = speciesData.genera.find(g => g.language.name === 'en').genus;

    // 3. Extract Abilities
    const abilities = pokemonData.abilities
        .map(a => `<span class="ability-name">${a.ability.name.replace('-', ' ')}</span>`)
        .join(', ');

    // 4. Calculate Gender Ratio
    const genderRate = speciesData.gender_rate;
    let genderHTML = '';

    if (genderRate === -1) {
        genderHTML = '<span class="value">Genderless</span>';
    } else {
        const femalePercent = (genderRate / 8) * 100;
        const malePercent = 100 - femalePercent;
        genderHTML = `
            <div class="gender-wrapper">
                <span class="male">♂ ${malePercent}%</span>
                <span class="female">♀ ${femalePercent}%</span>
            </div>
        `;
    }

    // 5. Render to container
    const statsContainer = document.getElementById('pokemon_ability');
    statsContainer.innerHTML = `
        <div class="info_item">
            <span class="label">Category</span>
            <span class="value">${category}</span>
        </div>
        <div class="info_item">
            <span class="label">Height</span>
            <span class="value">${height} m</span>
        </div>
        <div class="info_item">
            <span class="label">Weight</span>
            <span class="value">${weight} kg</span>
        </div>
        <div class="info_item">
            <span class="label">Abilities</span>
            <span class="value">${abilities}</span>
        </div>
        <div class="info_item">
            <span class="label">Gender</span>
            <span class="value">${genderHTML}</span>
        </div>
    `;
};

async function check_mega_giant(pokemon) {
    try {
        const inputName = pokemon.toLowerCase();
        let speciesData;
        let baseName = ""; // Base name used for filtering components

        // 1. Fetch species data (Handling cases where Mega names enter directly)
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${inputName}`);

        if (!response.ok) {
            // If species 404s, it might be a form name; fetch pokemon endpoint first to get species name
            const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${inputName}`);
            if (!pokemonRes.ok) return;
            const pokemonData = await pokemonRes.json();
            baseName = pokemonData.species.name;
            const finalRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${baseName}`);
            speciesData = await finalRes.json();
        } else {
            speciesData = await response.json();
            baseName = speciesData.name;
        }

        const varieties = speciesData.varieties;

        // 2. Organize variety list
        const result = {
            baseForm: varieties.find(v => v.is_default)?.pokemon.name,
            megaForms: varieties.filter(v => v.pokemon.name.includes('-mega')).map(v => v.pokemon.name),
            gmaxForms: varieties.filter(v => v.pokemon.name.includes('-gmax')).map(v => v.pokemon.name)
        };

        let hideHTML = '';
        let currentLabel = 'Default';

        // 3. Prepare all display varieties
        const allAllowedForms = [result.baseForm, ...result.megaForms, ...result.gmaxForms].filter(Boolean);

        allAllowedForms.forEach(formName => {
            // Format display name: remove base name, convert dashes to spaces (e.g., charizard-mega-y -> mega y)
            let btnText = formName.replace(baseName, '').replace(/-/g, ' ').trim() || 'Default';

            // [Core Logic] Check if variety matches current page; if so, update Label
            if (formName === inputName) {
                currentLabel = btnText;
            }

            // Concatenate HTML, ensuring correct quotes for onclick
            hideHTML += `<div onclick="handleFormChange('${formName}', '${btnText}')">${btnText}</div>`;
        });

        // 4. Render UI
        const selectContainer = document.querySelector('.custom-select');
        // Only show selection if Mega or Gmax varieties exist
        if (result.megaForms.length > 0 || result.gmaxForms.length > 0) {
            itemsDiv.innerHTML = hideHTML;
            // Place current variety name in the Selected box
            selectedDiv.innerHTML = `${currentLabel}`;
            selectContainer.style.display = 'block';
            selectedDiv.style.pointerEvents = "block";
        } else {
            selectedDiv.style.display = "none"
            selectedDiv.style.pointerEvents = "none";
        }

    } catch (error) {
        console.error("Error checking varieties:", error);
    }
}



async function getWeaknessAndRestraint(types_list) {
    let multiplier = {};
    for (let typeName of types_list) {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
        const typeData = await response.json();
        const relations = typeData.damage_relations;


        relations.double_damage_from.forEach(t => {
            multiplier[t.name] = (multiplier[t.name] || 1) * 2;
        });

        relations.half_damage_from.forEach(t => {
            multiplier[t.name] = (multiplier[t.name] || 1) * 2;
        });

        relations.no_damage_from.forEach(t => {
            multiplier[t.name] = 0;
        });
    }
    let weaknessHTML = '';
    let restraintHTML = '';

    for (let t in multiplier) {
        let val = multiplier[t];
        let badge = `<span class="type-badge type-${t}">${t} ${val}x</span>`;

        if (val > 1) {
            weaknessHTML += badge;
        } else if (val < 1) {
            restraintHTML += badge;
        }
    }

    document.getElementById('weekness').innerHTML = weaknessHTML || 'None';
    document.getElementById('restraint').innerHTML = restraintHTML || 'None';
}

const initChart = (stats) => {
    const ctx = document.getElementById('pokemonStatChart').getContext('2d');

    // If chart exists, destroy it first to prevent old data flicker on hover
    if (myChart) {
        myChart.destroy();
    }

    const labels = stats.map(s => s.stat.name.toUpperCase());
    const values = stats.map(s => s.base_stat);

    myChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Base Stats',
                data: values,
                backgroundColor: 'rgba(255, 204, 0, 0.4)', // Fill color
                borderColor: '#FFCC00',                  // Line color
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#FFCC00',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 200, // Stat cap
                    ticks: { display: false }, // Hide coordinate numbers
                    grid: { color: 'rgba(255, 255, 255, 0.2)' }, // Grid color
                    angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                    pointLabels: { color: '#fff', font: { size: 12 } } // Label color
                }
            },
            plugins: {
                legend: { display: false } // Hide legend
            }
        }
    });
};

async function getPokemonDescription(idOrName) {
    try {
        // 1. Fetch data from pokemon endpoint (supports 10000+ IDs)
        const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
        if (!pokemonRes.ok) return "Pokemon not found.";
        const pokemonData = await pokemonRes.json();

        const speciesName = pokemonData.species.name;

        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesName}`);
        if (!speciesRes.ok) return "No description available.";
        const data = await speciesRes.json();

        const descriptionEntry = data.flavor_text_entries.find(
            (entry) => entry.language.name === 'en'
        );

        return descriptionEntry
            ? descriptionEntry.flavor_text.replace(/[\f\n\r]/gm, ' ')
            : "No description available.";

    } catch (error) {
        console.error("Error fetching description:", error);
        return "Error loading description.";
    }
}

const fetch_data = async function (pokemon_name) {
    try {
        if (typeof pokemon_name === 'string') { pokemon = pokemon_name.toLowerCase(); }
        else {
            pokemon = pokemon_name
        }

        let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
        if (res.ok) return await res.json();

        // 2. If direct fetch fails (404), try to find default variety name from species
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon}`);
        if (speciesRes.ok) {
            const speciesData = await speciesRes.json();

            // Find variety marked as is_default, or the first variety
            const defaultVariety = speciesData.varieties.find(v => v.is_default) || speciesData.varieties[0];
            const realName = defaultVariety.pokemon.name;

            // Fetch again using the corrected name
            const finalRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${realName}`);
            if (finalRes.ok) return await finalRes.json();
        }
    } catch (err) {
        console.error("fetchPokemon failed:", err);
    }

}

const getspecies = async (pokemon) => {
    let response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.toLowerCase()}`);

    if (!response.ok) {
        const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.toLowerCase()}`);
        if (!pokemonRes.ok) throw new Error('Pokemon data not found');
        const pokemonData = await pokemonRes.json();
        response = await fetch(pokemonData.species.url);
    }

    return await response.json();
}

selectedDiv.addEventListener("click", function (e) {
    e.stopPropagation(); // Prevent event bubbling
    itemsDiv.classList.toggle("select-hide");
    this.classList.toggle("active"); // Used to control arrow rotation
});


document.addEventListener("click", () => itemsDiv.classList.add("select-hide"));

function handleFormChange(formName, btnText) {
    window.location.href = `detail.html?name=${formName}`;
}


const getPokemonEvolution = async (pokemonIdOrName) => {
    try {
        let nameToFetch = pokemonIdOrName.toString().toLowerCase();

        // 1. [New: Handle Mega/Gmax names]
        // If variety name (e.g., charizard-mega-y) is passed, fetch pokemon endpoint to get species name first
        let speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${nameToFetch}`;

        const initialCheck = await fetch(speciesUrl);
        if (!initialCheck.ok) {
            // If species 404s, this might be a variety ID or name
            const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameToFetch}`);
            if (!pokemonRes.ok) throw new Error('Pokemon data not found');
            const pokemonData = await pokemonRes.json();

            // Correction: point to base species URL (e.g., redirect from mega back to charizard)
            speciesUrl = pokemonData.species.url;
        }

        const speciesRes = await fetch(speciesUrl);
        const speciesData = await speciesRes.json();

        // 2. Fetch evolution chain URL (ensures consistent story regardless of current variety)
        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();

        // 3. Extract names from evolution chain (maintains original logic)
        let names = [];
        const extractNames = (chain) => {
            names.push(chain.species.name);
            chain.evolves_to.forEach(evo => extractNames(evo));
        };
        extractNames(evoData.chain);

        // 4. Concurrent data fetching (handling special forms like Pumpkaboo)
        const promises = names.map(async (name) => {
            try {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
                if (res.ok) return await res.json();

                // Remediation: if species name cannot be used directly as pokemon name
                const sRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
                const sData = await sRes.json();
                const realName = sData.varieties.find(v => v.is_default).pokemon.name;
                const fRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${realName}`);
                return await fRes.json();
            } catch (err) {
                return null;
            }
        });

        const results = await Promise.all(promises);
        return results.filter(data => data !== null);

    } catch (error) {
        console.error("Evolution chain fetch failed: ", error.message);
        return [];
    }
};
