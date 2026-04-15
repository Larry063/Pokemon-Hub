const searchBtn = document.getElementById('search-btn'); // search button
const inputField = document.getElementById('name-input'); // search field input
const nameScreen = document.getElementById('name-screen'); //name-screen
const imageScreen = document.getElementById('main-screen'); // image screen
const aboutScreen = document.getElementById('about-screen'); // about-text screen
const typeScreen = document.getElementById('type-screen'); // type screen
const idScreen = document.getElementById('id-screen'); // spices screen
const selected = document.querySelector(".select-selected");
const items = document.querySelector(".select-items");
const info_container = document.getElementById('show_container');
const random = document.getElementById('random_select');
const shiny = document.getElementById('show_shiny')
const mega = document.getElementById('mega_evolve')
const more = document.getElementById('show_more')
const giant = document.getElementById('giantmax')
const favorite_btn = document.querySelector(".favourite-btn");
const detail = document.querySelector(".yellow-button");


const btnsToHide = [more, shiny, mega, random, giant];
let typesHTML = '';
let shiny_mode = false;
let giant_mode = false;
let mega_mode = false;
let fav_mode = false;
is_error = false;
let allpokemonsData = [];
let backevolve = [];
let count = 20;

const getPokemonData = async (pokemon) => {
    if (typeof pokemon !== 'string') return;

    try {
        const data = await fetchPokemonSafely(pokemon);
        if (!data) {
            is_error = true;
            imageScreen.style.backgroundImage = "url('images/unknown.png')";
            nameScreen.innerHTML = 'unknown';
            typeScreen.innerHTML = 'unknown';
            idScreen.innerHTML = 'unknown';
            aboutScreen.innerHTML = 'unknown';
            return;
        } // Safety check: stop if no data fetched
        is_error = false;
        let id = data.id.toString().padStart(3, '0');
        let imageUrl = "";

        // --- Core image logic ---
        if (shiny_mode) {
            // Shiny priority: Official Artwork > Home > Sprite
            imageUrl = data.sprites.other['official-artwork'].front_shiny ||
                data.sprites.other.home.front_shiny ||
                data.sprites.front_shiny;
        } else {
            // Normal mode: for Mega or special forms (ID > 1000)
            if (parseInt(data.id) > 1000) {
                imageUrl = data.sprites.other['official-artwork'].front_default ||
                    data.sprites.other.home.front_default ||
                    data.sprites.front_default;
            } else {
                // Normal Pokemon use Pokedex official image
                imageUrl = `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${id}.png`;
            }
        }

        // Final fallback: fetch basic sprite if all above are clear
        if (!imageUrl) imageUrl = data.sprites.front_default;

        // --- UI Update ---
        imageScreen.style.backgroundImage = `url('${imageUrl}')`;
        nameScreen.innerHTML = data.name;
        typeScreen.innerHTML = data.types[0].type.name;
        idScreen.innerHTML = `#${data.id}`;
        aboutScreen.innerHTML = `Height: ${data.height * 10}cm Weight: ${data.weight / 10}kg`;
        if (typeof inputField !== 'undefined') inputField.value = '';

    } catch (err) {
        console.error("getPokemonData rendering failed:", err);
    }
};

const fetchPokemonSafely = async (name) => {
    // Execute only when name is a non-empty string, otherwise skip
    if (typeof name === 'string' && name.trim() !== '') {
        try {
            const pokemonName = name.toLowerCase();

            // 1. Try fetching directly (suitable for most pokemon and correct names)
            let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
            if (res.ok) return await res.json();

            // 2. If fetch fails (404), try seeking default form name from species
            const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
            if (speciesRes.ok) {
                const speciesData = await speciesRes.json();

                // Find variety mapped as is_default, or the first form
                const defaultVariety = speciesData.varieties.find(v => v.is_default) || speciesData.varieties[0];
                const realName = defaultVariety.pokemon.name;

                // Fetch again with corrected name
                const finalRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${realName}`);
                if (finalRes.ok) return await finalRes.json();
            }
        } catch (err) {
            console.error("fetchPokemonSafely fetch failed:", err);
        }
    }
    // If not a string or all attempts fail, return nothing (undefined)
};

const getPokemonEvolution = async (pokemon) => {
    try {
        info_container.innerHTML = '';

        // 1. [Core change] Fetch Species first, avoids Pumpkaboo not found
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.toLowerCase()}`);
        if (!speciesRes.ok) throw new Error('Species not found');
        const speciesData = await speciesRes.json();

        // 2. Auto-fetch correct entity name (e.g. pumpkaboo to pumpkaboo-average)
        const defaultName = speciesData.varieties[0].pokemon.name;
        const pokemon_name = speciesData.name; // This is the displayed name

        // 3. Fetch entity details (type, image, etc.)
        const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${defaultName}`);
        const pokemonData = await pokemonRes.json();

        // 4. Fetch evolution chain (using url provided by species)
        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();

        // 5. Extract all names in evolution chain (original logic)
        let names = [];
        if (evoData.chain) {
            names.push(evoData.chain.species.name);
            evoData.chain.evolves_to.forEach(evo => {
                names.push(evo.species.name);
                evo.evolves_to.forEach(subEvo => {
                    names.push(subEvo.species.name);
                });
            });
        }

        // 6. Concurrently fetch details of all members in evolution chain
        const promises = names.map(async (name) => {
            try {
                // 1. Try to fetch directly first (fastest)
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);

                if (res.ok) {
                    return await res.json();
                } else {
                    // 2. If 404, implies it's a pokemon like pumpkaboo needing corrected name
                    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
                    const speciesData = await speciesRes.json();

                    // Getting the correct default form name (e.g. pumpkaboo-average)
                    const realName = speciesData.varieties[0].pokemon.name;

                    const finalRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${realName}`);
                    return await finalRes.json();
                }
            }
            catch (err) {
                console.error(`Fetch ${name} failed`, err);
                return null; // Or return default object avoiding Promise.all crash
            }
        });

        const results = await Promise.all(promises);
        allpokemonsData = results.filter(data => data !== null);
        // 7. Render view
        renderPokemon(allpokemonsData);
        // Expose pokemon name here if you want to export current search name
        console.log("Now showing:", pokemon_name);

    } catch (error) {
        console.error("Error cause:", error.message);
        info_container.innerHTML = `<span style="color: white;">Error occurred:${error.message}</span>`;
    }
};

const getfavouritePokemon = (pokemonlist) => {
    if (!pokemonlist || pokemonlist.length === 0) {
        info_container.innerHTML = '<span style="color: white;">No favourite pokemon currently</span>';
        return;
    }
    info_container.innerHTML = '';
    const promises = pokemonlist.map(data =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${data}`)
            .then(res => res.json())
    );
    Promise.all(promises)
        .then(results => {
            favourite = results;
            renderPokemon(favourite);
        })
        .catch(error => {
            console.log("Error cause:", error.message);
            info_container.innerHTML = '<span style="color: white;">This may be mega pokemon</span>';
        });
};

window.onload = async function () {
    const promises = [];
    localStorage.removeItem('favourite');
    for (let i = 1; i <= 20; i++) {
        promises.push(
            fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json())
        );
    }
    allpokemonsData = await Promise.all(promises);
    renderPokemon(allpokemonsData);
};

function renderPokemon(dataArray) {
    let allHTML = '';

    dataArray.forEach(data => {
        let id = data.id.toString().padStart(3, '0');
        let typesHTML = data.types.map(t =>
            `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
        ).join('');

        let imageurl;
        if (shiny_mode) {
            imageurl = data.sprites.other['official-artwork'].front_shiny || data.sprites.front_shiny;
        } else {
            imageurl = data.sprites.other['official-artwork'].front_default;
        }
        // Extra styling for Mega form (optional: make Mega look cooler)
        const isMega = data.name.includes('-mega');
        const rawData = localStorage.getItem('favourite');
        let favouriteList = rawData ? JSON.parse(rawData) : [];
        let icon_name = favouriteList.includes(data.name) ? "heart" : "heart-outline";
        allHTML += `
            <div class="pokemon${isMega ? ' mega-card' : ''}" onclick="getPokemonData('${data.name}')" style="position: relative;">
                <span class="mega">${isMega ? 'MEGA' : ''}</span>
                <span class="favourite" onclick="toggleFavourite(event, '${data.name}')">
                    <ion-icon name="${icon_name}" id="icon-${data.name}"></ion-icon>
                </span>
                <img src="${imageurl}" style="width: 150px; height: 150px;">
                <div class="pokemon-info">
                    <small>#${id}</small><br>
                    <strong style="text-transform: capitalize;">${data.name.replace('-', ' ')}</strong><br>
                    <div class="type-container">${typesHTML}</div>
                </div>
            </div>`;
    });
    info_container.innerHTML = allHTML;
}

function toggleFavourite(event, name) {
    event.stopPropagation();
    let favouriteList = JSON.parse(localStorage.getItem('favourite')) || [];
    const icon = event.currentTarget.querySelector('ion-icon')
    if (favouriteList.includes(name)) {
        icon.setAttribute('name', 'heart-outline');
        favouriteList = favouriteList.filter(item => item !== name);
    }
    else {
        icon.setAttribute('name', 'heart');
        favouriteList.push(name);
    }
    localStorage.setItem('favourite', JSON.stringify(favouriteList));
}

function sortAndRender(type) {
    let sorted = [...allpokemonsData];

    if (type === "A-Z") {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    else if (type === "Z-A") {
        sorted.sort((a, b) => b.name.localeCompare(a.name));
    }
    else if (type === "Lowest Number (First)") {
        sorted.sort((a, b) => a.id - b.id);
    }
    else if (type === "Highest Number (First)") {
        sorted.sort((a, b) => b.id - a.id);
    }
    renderPokemon(sorted);
}

random.addEventListener("click", async function () {
    let promises = [];
    allpokemonsData = '';
    mega_mode = false;
    mega.classList.remove('active');
    giant.classList.remove('disabled-btn');
    for (let i = 1; i <= 20; i++) {
        let randomID = Math.floor(Math.random() * 1025) + 1;
        promises.push(
            fetch(`https://pokeapi.co/api/v2/pokemon/${randomID}`).then(res => res.json())
        );
    }
    allpokemonsData = await Promise.all(promises);
    getPokemonData(allpokemonsData[0].name)
    renderPokemon(allpokemonsData);
})

selected.addEventListener("click", function () {
    items.classList.toggle("select-hide");
    // For arrow rotation effect, toggle CSS class here
});

// Update text after clicking option
items.querySelectorAll("div").forEach(item => {
    item.addEventListener("click", function () {
        // Update display box text (keep icon)
        const text = this.innerText;
        sortAndRender(text);
        selected.childNodes[2].nodeValue = " " + text;
        items.classList.add("select-hide");
    });
});

inputField.addEventListener(
    'keydown',
    (event) => event.key === 'Enter' && searchBtn.click()
);

shiny.addEventListener('click', () => {
    shiny_mode = !shiny_mode;
    const currentName = nameScreen.innerHTML.toLowerCase();
    if (shiny_mode) {
        shiny.classList.add('active');
    }
    else {
        shiny.classList.remove('active');
    }
    renderPokemon(allpokemonsData)
    getPokemonData(currentName)
});

mega.addEventListener('click', async () => {
    let count = 0
    if (!mega_mode) {
        try {
            giant.classList.add('disabled-btn');
            // 1. Fetch data and check Mega potential
            const results = await Promise.all(allpokemonsData.map(async (pokemon) => {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.name}`);
                if (!res.ok) {
                    // 2. If 404, implies it's a pokemon like pumpkaboo needing corrected name
                    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`);
                    const speciesData = await speciesRes.json();

                    const realName = speciesData.species.name;

                    const finalRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${realName}`);
                    return await finalRes.json();
                }
                const speciesData = await res.json();
                const megaVarieties = speciesData.varieties.filter(v => v.pokemon.name.includes('-mega'));

                if (megaVarieties.length > 0) {
                    count += 1;
                    const details = await Promise.all(megaVarieties.map(v => fetch(v.pokemon.url).then(r => r.json())));
                    return { replace: true, originalName: pokemon.name, megaData: details };
                }
                return { replace: false, originalData: pokemon };
            }));
            if (count == 0) {
                mega_mode = false;
                mega.classList.remove('active');
                Swal.fire({
                    icon: 'info',
                    title: 'These pokemon cant Mega evolve !',
                    timer: 1500,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false
                });
                giant.classList.remove('disabled-btn');
                return
            }
            const currentNameOnScreen = nameScreen.innerHTML.toLowerCase();
            const currentCanMega = results.find(item => item.replace && item.originalName.toLowerCase() === currentNameOnScreen);

            // Function to update data
            const updateToMegaData = () => {
                mega_mode = true;
                mega.classList.add('active');
                backevolve = [...allpokemonsData];

                let newDisplayList = [];
                results.forEach(item => {
                    if (item.replace) {
                        newDisplayList.push(...item.megaData);
                        if (item.originalName.toLowerCase() === currentNameOnScreen) {
                            const randomIndex = Math.floor(Math.random() * item.megaData.length);
                            getPokemonData(item.megaData[randomIndex].name);
                        }
                    } else {
                        newDisplayList.push(item.originalData);
                    }
                });
                allpokemonsData = newDisplayList;
                renderPokemon(allpokemonsData);
            };

            // 3. Handle animation and display
            if (currentCanMega) {
                const overlay = document.getElementById('evolution-overlay');
                const evoSprite = document.getElementById('evo-sprite');
                const megaIcon = document.getElementById('mega-icon');

                // --- 1. Pre-select form and check data ---
                const randomIndex = Math.floor(Math.random() * currentCanMega.megaData.length);
                const selectedMega = currentCanMega.megaData[randomIndex];

                if (!selectedMega) return; // Exit if no data, prevent error

                // --- 2. Decide image to show during evolution (including shiny check) ---
                let finalEvoImage;
                if (shiny_mode) {
                    finalEvoImage = selectedMega.sprites.front_shiny || selectedMega.sprites.front_default;
                } else {
                    finalEvoImage = selectedMega.sprites.front_default;
                }

                // Initial state
                megaIcon.classList.remove('show', 'dissolve');
                overlay.classList.add('active');

                // Display silhouette of current large screen image
                let currentImg = imageScreen.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                evoSprite.src = currentImg;

                // --- 3. Animation process ---
                setTimeout(() => {
                    // Avoid 404 triggered by empty finalEvoImage
                    if (finalEvoImage) {
                        evoSprite.src = finalEvoImage;
                    }

                    setTimeout(() => {
                        megaIcon.classList.add('show');

                        // Update backend data and large screen (getPokemonData renders HD image based on shiny_mode)
                        updateToMegaData(randomIndex);
                        getPokemonData(selectedMega.name);

                        setTimeout(() => {
                            megaIcon.classList.add('dissolve');
                            setTimeout(() => {
                                overlay.classList.remove('active');
                            }, 1500);
                        }, 1500);
                    }, 500);
                }, 500);
            } else {
                updateToMegaData();
            }

        } catch (error) {
            console.error("Mega Error:", error);
            Swal.fire({
                icon: 'info',
                title: 'These pokemon cant Mega evolve !',
                timer: 1500,
                toast: true,
                position: 'top-end',
                showConfirmButton: false
            });
        }
    } else {
        // --- Devolution logic ---
        giant.classList.remove('disabled-btn');
        mega_mode = false;
        mega.classList.remove('active');
        if (backevolve && backevolve.length > 0) {
            allpokemonsData = [...backevolve];
            renderPokemon(allpokemonsData);
            getPokemonData(allpokemonsData[0].name);
        }
    }
});

const fetchGmaxDataList = async (pokemonArray) => {
    try {
        // 1. Process all pokemon in array concurrently
        const results = await Promise.all(pokemonArray.map(async (pokemon) => {
            // Handle given param as object or string
            const name = typeof pokemon === 'string' ? pokemon : pokemon.name;
            if (!name) return null;

            try {
                // Step 1: Fetch species data
                let res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name.toLowerCase()}`);

                // Fix logic: If 404, try correcting name (handle pumpkaboo, etc)
                if (!res.ok) {
                    const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
                    if (!pokemonRes.ok) return null;
                    const pokemonData = await pokemonRes.json();
                    const realName = pokemonData.species.name;
                    res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${realName}`);
                }

                if (!res.ok) return null;
                const speciesData = await res.json();

                // Step 2: Seek forms including "-gmax"
                const gmaxVariety = speciesData.varieties.find(v => v.pokemon.name.includes('-gmax'));

                if (gmaxVariety) {
                    // Step 3: Fetch detail data of the form
                    const detailRes = await fetch(gmaxVariety.pokemon.url);
                    const gmaxData = await detailRes.json();

                    return {
                        replace: true,
                        originalName: name,
                        gmaxData: gmaxData
                    };
                }
            } catch (e) {
                console.warn(`Skip ${name}, cannot fetch data`);
            }
            return { replace: false, originalName: name };
        }));

        // Filter out null and return result
        return results.filter(r => r !== null);

    } catch (err) {
        console.error("Fetch Gmax list failed:", err);
    }
};

more.addEventListener('click', async () => {
    const promises = [];
    count = count + 12;
    for (let i = 1; i <= count; i++) {
        promises.push(
            fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json())
        );
    }
    allpokemonsData = await Promise.all(promises);
    renderPokemon(allpokemonsData);
});

searchBtn.addEventListener('click', () => {
    typesHTML = '';
    imageScreen.style.filter = "brightness(2)";
    setTimeout(() => {
        imageScreen.style.filter = "brightness(1)";
    }, 150);
    getPokemonData(inputField.value)
    getPokemonEvolution(inputField.value)
    allpokemonsData = '';
    mega_mode = false;
    // backevolve = '';
    mega.classList.remove('active');
});

favorite_btn.addEventListener('click', () => {
    typesHTML = '';
    giant.classList.remove('active')
    giant_mode = false;
    favorite_btn.toggleAttribute('active')
    if (favorite_btn.hasAttribute('active')) {
        btnsToHide.forEach(btn => btn?.classList.add('disabled-btn'));
        giant.classList.add('disabled-btn');
        fav_mode = true;
        imageScreen.style.filter = "brightness(2)";
        setTimeout(() => {
            imageScreen.style.filter = "brightness(1)";
        }, 150);
        let favouriteList = JSON.parse(localStorage.getItem('favourite')) || [];
        if (favouriteList.length > 0) {
            getPokemonData(favouriteList[0])
        }
        console.log(favouriteList[1])
        getfavouritePokemon(favouriteList)
    }
    else {
        fav_mode = false;

        btnsToHide.forEach(btn => btn?.classList.remove('disabled-btn'));
        giant.classList.remove('disabled-btn');
        mega.classList.remove('disabled-btn');
        if (mega.hasAttribute('active') || mega.classList.contains('active')) {
            giant.classList.add('disabled-btn');
        }
        renderPokemon(allpokemonsData);
    }
});

giant.addEventListener('click', async () => {
    giant.classList.toggle('active')
    giant_mode = !giant_mode
    if (giant_mode) {
        mega.classList.add('disabled-btn');
        shiny.classList.add('disabled-btn');
        giant_mode = true;
        imageScreen.style.filter = "brightness(2)";
        setTimeout(() => {
            imageScreen.style.filter = "brightness(1)";
        }, 150);
        const gmaxresult = await fetchGmaxDataList(allpokemonsData)
        const gmax_only = gmaxresult.filter(item => item.replace).map(item => item.gmaxData)
        if (gmax_only.length > 0) {
            renderPokemon(gmax_only)
            getPokemonData(gmax_only[0].name)
        }
        else {
            mega.classList.remove('disabled-btn');
            shiny.classList.remove('disabled-btn');
            giant_mode = false;
            giant.classList.toggle('active')
            renderPokemon(allpokemonsData);
            getPokemonData(allpokemonsData[0].name)
            Swal.fire({
                icon: 'info',
                title: 'These pokemon cant Giantmax!',
                timer: 1500,
                toast: true,
                position: 'top-end',
                showConfirmButton: false
            });
        }
    }
    else {
        mega.classList.remove('disabled-btn');
        shiny.classList.remove('disabled-btn');
        getPokemonData(allpokemonsData[0].name)
        renderPokemon(allpokemonsData);
    }
});

detail.addEventListener('click', () => {
    if (!is_error) {
        const is_gmax = giant_mode ? '&giant=true' : '';
        const is_shiny = shiny_mode ? '&shiny=true' : '';
        window.location.href = `detail.html?name=${nameScreen.innerHTML}${is_gmax}${is_shiny}`;
    }
})