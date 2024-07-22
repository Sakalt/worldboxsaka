document.addEventListener('DOMContentLoaded', () => {
    const speedRange = document.getElementById('speedRange');
    const speedValue = document.getElementById('speedValue');
    const toggleSeason = document.getElementById('toggleSeason');
    const saveGame = document.getElementById('saveGame');
    const loadGame = document.getElementById('loadGame');
    const blockTypeSelect = document.getElementById('blockType');
    const placeBlockButton = document.getElementById('placeBlock');
    const destroyBlockButton = document.getElementById('destroyBlock');
    const characterTypeSelect = document.getElementById('characterType');
    const placeCharacterButton = document.getElementById('placeCharacter');
    const seasonElement = document.getElementById('season');
    const yearElement = document.getElementById('year');
    const worldMap = document.getElementById('worldMap');
    const ctx = worldMap.getContext('2d');

    const seasons = ["春", "夏", "秋", "冬"];
    const kanji = ["山", "川", "田", "海", "空", "風", "光", "花", "森", "星", "雨", "雷", "火", "地", "雪"];
    let currentSeason = 0;
    let year = 1;
    let speed = parseFloat(speedRange.value);
    let time = 0;
    const dayDuration = 0.8; // 1日は0.8秒
    let isPlacingBlock = false;
    let isDestroyingBlock = false;
    let isPlacingCharacter = false;

    worldMap.width = 800;
    worldMap.height = 800;

    const worldData = {
        countries: [],
        people: [],
        resources: [],
        structures: [],
        enemies: []
    };

    const images = {};
    const imageNames = ["grass", "sand", "volcano", "hotspring", "acidvolcano", "person", "zombie", "house", "flag1", "flag2", "flag3", "flag4", "flag5", "flag6", "flag7", "flag8", "flag9", "flag10"];

    function loadImages(callback) {
        let loadedImages = 0;
        const totalImages = imageNames.length;

        imageNames.forEach(name => {
            const img = new Image();
            img.src = `assets/textures/${name}.png`;
            img.onload = () => {
                loadedImages++;
                images[name] = img;
                if (loadedImages === totalImages) {
                    callback();
                }
            };
        });
    }

    function generateCountryName() {
        const prefix = kanji[Math.floor(Math.random() * kanji.length)];
        const suffix = kanji[Math.floor(Math.random() * kanji.length)];
        return prefix + suffix;
    }

    function generateCulture() {
        const chars = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
        let culture = "";
        for (let i = 0; i < 10; i++) {
            culture += chars[Math.floor(Math.random() * chars.length)];
        }
        return culture;
    }

    function generateRandomTerritory() {
        const territory = [];
        const centerX = Math.floor(Math.random() * 50) * 16;
        const centerY = Math.floor(Math.random() * 50) * 16;
        const size = Math.floor(Math.random() * 10) + 5; // ランダムなサイズ

        for (let i = 0; i < size; i++) {
            const x = centerX + (Math.floor(Math.random() * 3) - 1) * 16;
            const y = centerY + (Math.floor(Math.random() * 3) - 1) * 16;
            territory.push({ x, y });
        }

        return territory;
    }

    function initializeCountries() {
        for (let i = 0; i < 10; i++) {
            worldData.countries.push({
                name: generateCountryName(),
                population: Math.floor(Math.random() * 100 + 50),
                culture: generateCulture(),
                territory: generateRandomTerritory(), // 国の領土のデータ
                flag: `flag${i + 1}` // それぞれの国に対応する旗の画像
            });
        }
    }

    function initializePeople() {
        // 初期の人々をランダムに生成
        for (let i = 0; i < 50; i++) {
            worldData.people.push({
                x: Math.random() * worldMap.width,
                y: Math.random() * worldMap.height,
                hp: 100,
                inventory: [],
                country: worldData.countries[Math.floor(Math.random() * worldData.countries.length)].name
            });
        }
    }

    function initializeResources() {
        const resourceTypes = ["grass", "sand", "volcano", "hotspring", "acidvolcano"];
        for (let i = 0; i < 100; i++) {
            worldData.resources.push({
                type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
                x: Math.random() * worldMap.width,
                y: Math.random() * worldMap.height
            });
        }
    }

    function initializeEnemies() {
        for (let i = 0; i < 20; i++) {
            worldData.enemies.push({
                x: Math.random() * worldMap.width,
                y: Math.random() * worldMap.height,
                hp: 50,
                type: "zombie"
            });
        }
    }

    function initializeWorld() {
        initializeCountries();
        initializePeople();
        initializeResources();
        initializeEnemies();
        // 他の初期化ロジック
    }

    function updateAI() {
        worldData.people.forEach(person => {
            // ランダムに移動
            person.x += (Math.random() - 0.5) * 10;
            person.y += (Math.random() - 0.5) * 10;

            // 人が画面外に出ないように
            person.x = Math.max(0, Math.min(worldMap.width, person.x));
            person.y = Math.max(0, Math.min(worldMap.height, person.y));

            // 家を建てるロジック
            if (Math.random() < 0.01 && person.inventory.includes("wood")) {
                worldData.structures.push({
                    type: "house",
                    x: person.x,
                    y: person.y
                });
                person.inventory.splice(person.inventory.indexOf("wood"), 1);
            }

            // 国を建てるロジック
            if (Math.random() < 0.01 && person.inventory.includes("gold")) {
                const newCountry = {
                    name: generateCountryName(),
                    population: 1,
                    culture: generateCulture(),
                    territory: [{ x: person.x, y: person.y }],
                    flag: `flag${worldData.countries.length + 1}`
                };
                worldData.countries.push(newCountry);
                person.country = newCountry.name;
                person.inventory.splice(person.inventory.indexOf("gold"), 1);
            }

            // 敵との戦闘や逃走ロジック
            worldData.enemies.forEach(enemy => {
                const dx = enemy.x - person.x;
                const dy = enemy.y - person.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 20) {
                    if (person.hp > enemy.hp) {
                        // 戦う
                        enemy.hp -= 10;
                        if (enemy.hp <= 0) {
                            // 敵が倒れたら仲間に
                            worldData.people.push({
                                x: enemy.x,
                                y: enemy.y,
                                hp: 100,
                                inventory: [],
                                country: person.country
                            });
                            worldData.enemies = worldData.enemies.filter(e => e !== enemy);
                        }
                    } else {
                        // 逃げる
                        person.x -= dx * 0.1;
                        person.y -= dy * 0.1;
                        person.hp -= 1; // HP減少
                    }
                }
            });

            // 領土の拡大
            const country = worldData.countries.find(c => c.name === person.country);
            if (country) {
                country.territory.push({ x: person.x, y: person.y });
            }
        });

        // 戦争による領土の削減
        worldData.countries.forEach(country => {
            if (Math.random() < 0.01) {
                const enemyCountry = worldData.countries[Math.floor(Math.random() * worldData.countries.length)];
                if (enemyCountry.name !== country.name) {
                    const territoryToRemove = country.territory.pop();
                    if (territoryToRemove) {
                        enemyCountry.territory.push(territoryToRemove);
                    }
                }
            }
        });
    }

    function updateWorld() {
        // 世界の状態を更新するロジック
        // AIの動作、季節の変更、温度の変更などを処理します
        updateAI();
        // 他の更新ロジック
    }

    function renderWorld() {
        ctx.clearRect(0, 0, worldMap.width, worldMap.height);

        // 背景の描画
        ctx.fillStyle = "#87CEEB"; // 海の青
        ctx.fillRect(0, 0, worldMap.width, worldMap.height);

        // 草や砂、火山、温泉、酸火山の描画
        worldData.resources.forEach(resource => {
            ctx.drawImage(images[resource.type], resource.x, resource.y, 16, 16);
        });

        // 人の描画
        worldData.people.forEach(person => {
            ctx.drawImage(images.person, person.x, person.y, 16, 16);
        });

        // 敵の描画
        worldData.enemies.forEach(enemy => {
            ctx.drawImage(images.zombie, enemy.x, enemy.y, 16, 16);
        });

        // 構造物の描画
        worldData.structures.forEach(structure => {
            ctx.drawImage(images[structure.type], structure.x, structure.y, 16, 16);
        });

        // 国の領土と旗の描画
        worldData.countries.forEach(country => {
            ctx.globalAlpha = 0.5; // 透明度50%
            country.territory.forEach(tile => {
                ctx.fillStyle = "#FFFFFF"; // 透明な領土
                ctx.fillRect(tile.x, tile.y, 16, 16);
            });
            ctx.globalAlpha = 1.0;

            // 旗を領土の中心に描画
            const centerX = country.territory.reduce((acc, tile) => acc + tile.x, 0) / country.territory.length;
            const centerY = country.territory.reduce((acc, tile) => acc + tile.y, 0) / country.territory.length;
            ctx.drawImage(images[country.flag], centerX, centerY, 16, 16);
        });

        // 他の描画ロジック
    }

    function changeSeason() {
        currentSeason = (currentSeason + 1) % 4;
        seasonElement.textContent = `季節: ${seasons[currentSeason]}`;
    }

    function saveGameData() {
        localStorage.setItem('worldData', JSON.stringify(worldData));
        localStorage.setItem('currentSeason', currentSeason);
        localStorage.setItem('year', year);
    }

    function loadGameData() {
        const savedWorldData = localStorage.getItem('worldData');
        const savedSeason = localStorage.getItem('currentSeason');
        const savedYear = localStorage.getItem('year');

        if (savedWorldData && savedSeason && savedYear) {
            Object.assign(worldData, JSON.parse(savedWorldData));
            currentSeason = parseInt(savedSeason);
            year = parseInt(savedYear);

            seasonElement.textContent = `季節: ${seasons[currentSeason]}`;
            yearElement.textContent = `年: ${year}`;
            renderWorld();
        } else {
            alert("保存されたゲームデータが見つかりません。");
        }
    }

    function update() {
        time += speed;
        if (time >= dayDuration) {
            time = 0;
            updateWorld();
            renderWorld();
            year++;
            yearElement.textContent = `年: ${year}`;
        }
        requestAnimationFrame(update);
    }

    function getMousePosition(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    function placeBlock(event) {
        if (!isPlacingBlock) return;
        const pos = getMousePosition(worldMap, event);
        const blockType = blockTypeSelect.value;
        worldData.resources.push({
            type: blockType,
            x: Math.floor(pos.x / 16) * 16,
            y: Math.floor(pos.y / 16) * 16
        });
        renderWorld();
    }

    function destroyBlock(event) {
        if (!isDestroyingBlock) return;
        const pos = getMousePosition(worldMap, event);
        const x = Math.floor(pos.x / 16) * 16;
        const y = Math.floor(pos.y / 16) * 16;
        worldData.resources = worldData.resources.filter(resource => resource.x !== x || resource.y !== y);
        renderWorld();
    }

    function placeCharacter(event) {
        if (!isPlacingCharacter) return;
        const pos = getMousePosition(worldMap, event);
        const characterType = characterTypeSelect.value;
        if (characterType === "person") {
            worldData.people.push({
                x: Math.floor(pos.x / 16) * 16,
                y: Math.floor(pos.y / 16) * 16,
                hp: 100,
                inventory: [],
                country: worldData.countries[Math.floor(Math.random() * worldData.countries.length)].name
            });
        } else if (characterType === "zombie") {
            worldData.enemies.push({
                x: Math.floor(pos.x / 16) * 16,
                y: Math.floor(pos.y / 16) * 16,
                hp: 50,
                type: "zombie"
            });
        }
        renderWorld();
    }

    speedRange.addEventListener('input', () => {
        speed = parseFloat(speedRange.value);
        speedValue.textContent = `速度: 1日/${(dayDuration / speed).toFixed(1)}秒`;
    });

    toggleSeason.addEventListener('click', changeSeason);
    saveGame.addEventListener('click', saveGameData);
    loadGame.addEventListener('click', loadGameData);
    placeBlockButton.addEventListener('click', () => {
        isPlacingBlock = true;
        isDestroyingBlock = false;
        isPlacingCharacter = false;
        worldMap.addEventListener('click', placeBlock);
    });
    destroyBlockButton.addEventListener('click', () => {
        isPlacingBlock = false;
        isDestroyingBlock = true;
        isPlacingCharacter = false;
        worldMap.addEventListener('click', destroyBlock);
    });
    placeCharacterButton.addEventListener('click', () => {
        isPlacingBlock = false;
        isDestroyingBlock = false;
        isPlacingCharacter = true;
        worldMap.addEventListener('click', placeCharacter);
    });

    loadImages(() => {
        initializeWorld();
        update();
    });
});
