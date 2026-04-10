// Тажин Тамагочи - Game Logic

const RECIPES = [
    {
        id: 'chicken_olives',
        name: 'Курица с оливками',
        nameAr: 'طاجين الدجاج بالزيتون',
        description: 'Классический марокканский тажин с курицей, оливками и консервированным лимоном',
        ingredients: ['Курица', 'Оливки', 'Лимон', 'Лук', 'Чеснок'],
        spices: ['Куркума', 'Имбирь', 'Кориандр'],
        difficulty: 1,
        cookTime: 120, // секунд игрового времени
        unlocked: true,
        icon: '🍋'
    },
    {
        id: 'lamb_prunes',
        name: 'Баранина с черносливом',
        nameAr: 'طاجين اللحم بالبرقوق',
        description: 'Сладко-солёный тажин с бараниной, черносливом и миндалём',
        ingredients: ['Баранина', 'Чернослив', 'Миндаль', 'Лук', 'Мёд'],
        spices: ['Корица', 'Имбирь', 'Шафран'],
        difficulty: 2,
        cookTime: 180,
        unlocked: false,
        starsToUnlock: 3,
        icon: '🍖'
    },
    {
        id: 'kefta_eggs',
        name: 'Кефта с яйцом',
        nameAr: 'كفتة بالبيض',
        description: 'Пряные мясные шарики в томатном соусе с яйцом',
        ingredients: ['Кефта', 'Томаты', 'Яйца', 'Лук', 'Петрушка'],
        spices: ['Кумин', 'Паприка', 'Кориандр'],
        difficulty: 1,
        cookTime: 100,
        unlocked: false,
        starsToUnlock: 5,
        icon: '🥚'
    },
    {
        id: 'fish_chermoula',
        name: 'Рыба по-марокански',
        nameAr: 'طاجين السمك',
        description: 'Рыба с овощами в пряном соусе чермула',
        ingredients: ['Рыба', 'Перец', 'Томаты', 'Картофель', 'Чеснок'],
        spices: ['Кумин', 'Паприка', 'Чермула'],
        difficulty: 2,
        cookTime: 150,
        unlocked: false,
        starsToUnlock: 8,
        icon: '🐟'
    },
    {
        id: 'veggie_seven',
        name: 'Семь овощей',
        nameAr: 'طاجين سبع خضار',
        description: 'Традиционный овощной тажин с семью видами овощей',
        ingredients: ['Морковь', 'Кабачок', 'Тыква', 'Турнепс', 'Капуста', 'Томаты', 'Нут'],
        spices: ['Рас-эль-ханут', 'Куркума', 'Имбирь'],
        difficulty: 3,
        cookTime: 200,
        unlocked: false,
        starsToUnlock: 12,
        icon: '🥕'
    }
];

const MESSAGES = {
    fire_low: [
        'Огонь угасает! Подбрось углей! 🔥',
        'Тажин остывает... нужно больше жара!',
        'Без огня ничего не сварится!'
    ],
    fire_high: [
        'Слишком жарко! Блюдо подгорает! 😱',
        'Убавь огонь! Тажин не сковородка!',
        'Осторожно! Дно пригорает!'
    ],
    moisture_low: [
        'Блюдо пересыхает! Добавь воды! 💧',
        'Нужна влага, иначе всё пригорит!',
        'Соус выкипает!'
    ],
    moisture_high: [
        'Слишком много воды! Это тажин, не суп! 🥣',
        'Воды многовато... соус слишком жидкий',
        'Подожди, пусть выпарится лишняя влага'
    ],
    flavor_low: [
        'Пресновато... добавь специй! 🌶️',
        'Где вкус? Нужны специи!',
        'Марокканский тажин без специй — это не тажин!'
    ],
    flavor_high: [
        'Ой! Слишком много специй! 🥵',
        'Рот горит! Перебор со специями!',
        'Полегче со специями, шеф!'
    ],
    perfect: [
        'Идеально! Всё в балансе! ✨',
        'Отличная работа! Тажин пахнет изумительно! 😍',
        'Марокканская бабушка бы одобрила! 👵'
    ],
    stir: [
        'Аккуратно перемешиваем... 🥄',
        'Соус равномерно покрывает ингредиенты!',
        'Размешали! Ароматы смешиваются!'
    ],
    almost_done: [
        'Почти готово! Ещё чуть-чуть! ⏰',
        'Запах потрясающий! Скоро будет готово!',
        'Финишная прямая! Держим температуру!'
    ]
};

const ACHIEVEMENTS = [
    { id: 'first_cook', name: 'Первый тажин', desc: 'Приготовь первое блюдо', icon: '👨‍🍳' },
    { id: 'five_stars', name: 'Пять звёзд', desc: 'Получи 5 звёзд за блюдо', icon: '⭐' },
    { id: 'fire_master', name: 'Мастер огня', desc: 'Держи идеальный огонь 30 секунд', icon: '🔥' },
    { id: 'spice_king', name: 'Король специй', desc: 'Используй специи 20 раз за игру', icon: '👑' },
    { id: 'all_recipes', name: 'Шеф-повар', desc: 'Открой все рецепты', icon: '📖' },
    { id: 'ten_dishes', name: 'Опытный повар', desc: 'Приготовь 10 блюд', icon: '🏆' }
];

class TajineGame {
    constructor() {
        this.state = {
            heat: 50,
            moisture: 50,
            flavor: 0,
            doneness: 0
        };
        this.currentRecipe = null;
        this.gameInterval = null;
        this.elapsed = 0;
        this.isPlaying = false;
        this.spiceUses = 0;
        this.perfectFireTime = 0;
        this.stirCooldown = false;

        this.loadProgress();
        this.init();
    }

    init() {
        this.showMenu();
    }

    // === Навигация ===

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    showMenu() {
        this.stopGame();
        this.showScreen('screen-menu');
    }

    showRecipeSelect() {
        this.renderRecipes();
        this.showScreen('screen-recipes');
    }

    showCollection() {
        this.renderCollection();
        this.showScreen('screen-collection');
    }

    // === Рецепты ===

    renderRecipes() {
        const list = document.getElementById('recipes-list');
        list.innerHTML = '';

        RECIPES.forEach((recipe, index) => {
            const isUnlocked = recipe.unlocked || this.progress.totalStars >= (recipe.starsToUnlock || 0);
            const card = document.createElement('div');
            card.className = `recipe-card ${isUnlocked ? '' : 'locked'}`;

            if (isUnlocked) {
                card.onclick = () => this.startGame(index);
                card.innerHTML = `
                    <div class="recipe-icon">${recipe.icon}</div>
                    <div class="recipe-info">
                        <h3>${recipe.name}</h3>
                        <p class="recipe-ar">${recipe.nameAr}</p>
                        <p class="recipe-desc">${recipe.description}</p>
                        <div class="recipe-meta">
                            <span class="difficulty">${'🌶️'.repeat(recipe.difficulty)}</span>
                            <span class="best-stars">${this.getRecipeBestStars(recipe.id)}</span>
                        </div>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="recipe-icon">🔒</div>
                    <div class="recipe-info">
                        <h3>${recipe.name}</h3>
                        <p class="recipe-desc">Нужно ${recipe.starsToUnlock} ⭐ (у тебя: ${this.progress.totalStars})</p>
                    </div>
                `;
            }

            list.appendChild(card);
        });
    }

    getRecipeBestStars(recipeId) {
        const best = this.progress.bestScores[recipeId] || 0;
        if (best === 0) return '';
        return '⭐'.repeat(best);
    }

    // === Игровой процесс ===

    startGame(recipeIndex) {
        this.currentRecipe = RECIPES[recipeIndex];
        this.state = {
            heat: 50,
            moisture: 50,
            flavor: 0,
            doneness: 0
        };
        this.elapsed = 0;
        this.spiceUses = 0;
        this.perfectFireTime = 0;
        this.isPlaying = true;

        document.getElementById('current-recipe-name').textContent = this.currentRecipe.name;
        this.updateUI();
        this.showScreen('screen-game');
        this.showMessage(`Готовим: ${this.currentRecipe.name}! ${this.currentRecipe.icon}`);

        this.gameInterval = setInterval(() => this.gameTick(), 1000);
    }

    stopGame() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        this.isPlaying = false;
    }

    gameTick() {
        if (!this.isPlaying) return;

        this.elapsed++;

        // Огонь медленно угасает
        this.state.heat = Math.max(0, this.state.heat - 1.5);

        // Влага испаряется (быстрее при высоком огне)
        const evapRate = 0.5 + (this.state.heat / 100) * 1.5;
        this.state.moisture = Math.max(0, this.state.moisture - evapRate);

        // Вкус слегка рассеивается если не мешать
        if (this.state.flavor > 60) {
            this.state.flavor = Math.max(0, this.state.flavor - 0.2);
        }

        // Готовность растёт если параметры в норме
        const heatOk = this.state.heat >= 40 && this.state.heat <= 70;
        const moistureOk = this.state.moisture >= 30 && this.state.moisture <= 60;

        if (heatOk && moistureOk) {
            const bonus = (this.state.flavor >= 50 && this.state.flavor <= 80) ? 1.5 : 1;
            this.state.doneness = Math.min(100, this.state.doneness + (100 / this.currentRecipe.cookTime) * bonus);
            this.perfectFireTime++;
        } else if (this.state.heat > 20 && this.state.moisture > 10) {
            this.state.doneness = Math.min(100, this.state.doneness + (100 / this.currentRecipe.cookTime) * 0.3);
        }

        // Проверяем критические состояния
        if (this.state.heat <= 0 && this.state.doneness < 100) {
            this.showMessage(this.getRandomMessage('fire_low'));
        } else if (this.state.heat > 80) {
            this.showMessage(this.getRandomMessage('fire_high'));
        } else if (this.state.moisture < 20 && this.state.moisture > 0) {
            this.showMessage(this.getRandomMessage('moisture_low'));
        } else if (this.state.doneness > 85 && this.state.doneness < 100) {
            this.showMessage(this.getRandomMessage('almost_done'));
        }

        // Обновляем визуал
        this.updateUI();
        this.updateVisuals();

        // Проверяем завершение
        if (this.state.doneness >= 100) {
            this.finishCooking();
        }
    }

    // === Действия игрока ===

    addFire() {
        if (!this.isPlaying) return;
        this.state.heat = Math.min(100, this.state.heat + 15);
        this.animateButton('btn-fire');
        this.updateUI();

        if (this.state.heat > 80) {
            this.showMessage(this.getRandomMessage('fire_high'));
        }
    }

    addWater() {
        if (!this.isPlaying) return;
        this.state.moisture = Math.min(100, this.state.moisture + 20);
        this.animateButton('btn-water');
        this.updateUI();

        if (this.state.moisture > 80) {
            this.showMessage(this.getRandomMessage('moisture_high'));
        }
    }

    addSpice() {
        if (!this.isPlaying) return;
        this.state.flavor = Math.min(100, this.state.flavor + 12);
        this.spiceUses++;
        this.animateButton('btn-spice');
        this.updateUI();

        if (this.state.flavor > 90) {
            this.showMessage(this.getRandomMessage('flavor_high'));
        } else if (this.state.flavor >= 50 && this.state.flavor <= 80) {
            this.showMessage(this.getRandomMessage('perfect'));
        }
    }

    stir() {
        if (!this.isPlaying || this.stirCooldown) return;

        // Перемешивание балансирует параметры
        if (this.state.heat > 70) this.state.heat -= 5;
        if (this.state.moisture > 60) this.state.moisture -= 3;
        if (this.state.flavor > 80) this.state.flavor -= 5;

        // Небольшой бонус к готовности
        this.state.doneness = Math.min(100, this.state.doneness + 2);

        this.animateButton('btn-stir');
        this.showMessage(this.getRandomMessage('stir'));
        this.updateUI();

        // Кулдаун на перемешивание
        this.stirCooldown = true;
        document.getElementById('btn-stir').classList.add('cooldown');
        setTimeout(() => {
            this.stirCooldown = false;
            document.getElementById('btn-stir').classList.remove('cooldown');
        }, 3000);
    }

    // === Визуальные обновления ===

    updateUI() {
        // Обновляем шкалы
        document.getElementById('bar-heat').style.width = this.state.heat + '%';
        document.getElementById('bar-moisture').style.width = this.state.moisture + '%';
        document.getElementById('bar-flavor').style.width = this.state.flavor + '%';
        document.getElementById('bar-doneness').style.width = this.state.doneness + '%';

        // Обновляем числа
        document.getElementById('val-heat').textContent = Math.round(this.state.heat);
        document.getElementById('val-moisture').textContent = Math.round(this.state.moisture);
        document.getElementById('val-flavor').textContent = Math.round(this.state.flavor);
        document.getElementById('val-doneness').textContent = Math.round(this.state.doneness) + '%';

        // Обновляем таймер
        const mins = Math.floor(this.elapsed / 60);
        const secs = this.elapsed % 60;
        document.getElementById('game-timer').textContent =
            `${mins}:${secs.toString().padStart(2, '0')}`;

        // Цвет шкал по состоянию
        this.updateBarColor('bar-heat', this.state.heat, 40, 70);
        this.updateBarColor('bar-moisture', this.state.moisture, 30, 60);
        this.updateBarColor('bar-flavor', this.state.flavor, 50, 80);
    }

    updateBarColor(barId, value, min, max) {
        const bar = document.getElementById(barId);
        if (value >= min && value <= max) {
            bar.classList.add('in-zone');
            bar.classList.remove('danger');
        } else if (value < min * 0.5 || value > max * 1.3) {
            bar.classList.remove('in-zone');
            bar.classList.add('danger');
        } else {
            bar.classList.remove('in-zone', 'danger');
        }
    }

    updateVisuals() {
        // Огонь
        const fireContainer = document.getElementById('fire-container');
        if (this.state.heat > 60) {
            fireContainer.className = 'fire-container fire-high';
        } else if (this.state.heat > 30) {
            fireContainer.className = 'fire-container fire-medium';
        } else if (this.state.heat > 10) {
            fireContainer.className = 'fire-container fire-low';
        } else {
            fireContainer.className = 'fire-container fire-out';
        }

        // Пар
        const steamContainer = document.getElementById('steam-container');
        if (this.state.heat > 40 && this.state.moisture > 20) {
            steamContainer.classList.add('active');
        } else {
            steamContainer.classList.remove('active');
        }

        // Крышка тажина - дрожит при высоком давлении
        const lid = document.getElementById('tajine-lid');
        if (this.state.heat > 70 && this.state.moisture > 50) {
            lid.classList.add('shaking');
        } else {
            lid.classList.remove('shaking');
        }

        // Цвет еды в тажине
        const food = document.getElementById('tajine-food');
        const doneColor = Math.min(100, this.state.doneness);
        food.style.background = `hsl(${30 - doneColor * 0.15}, ${60 + doneColor * 0.3}%, ${50 - doneColor * 0.15}%)`;
    }

    // === Завершение готовки ===

    finishCooking() {
        this.stopGame();

        const score = this.calculateScore();
        const stars = this.calculateStars(score);

        this.saveResult(stars);
        this.showResult(stars, score);
    }

    calculateScore() {
        let score = 0;

        // Оценка по параметрам в момент завершения
        const heatScore = this.getZoneScore(this.state.heat, 40, 70);
        const moistureScore = this.getZoneScore(this.state.moisture, 30, 60);
        const flavorScore = this.getZoneScore(this.state.flavor, 50, 80);

        score = (heatScore + moistureScore + flavorScore) / 3;

        return Math.round(score * 100);
    }

    getZoneScore(value, min, max) {
        const center = (min + max) / 2;
        const range = (max - min) / 2;
        const distance = Math.abs(value - center);

        if (distance <= range) return 1;
        if (distance <= range * 2) return 0.6;
        return 0.3;
    }

    calculateStars(score) {
        if (score >= 90) return 5;
        if (score >= 75) return 4;
        if (score >= 55) return 3;
        if (score >= 35) return 2;
        return 1;
    }

    showResult(stars, score) {
        const container = document.getElementById('stars-container');
        container.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('span');
            star.className = `result-star ${i < stars ? 'earned' : ''}`;
            star.textContent = '⭐';
            star.style.animationDelay = `${i * 0.2}s`;
            container.appendChild(star);
        }

        const comments = {
            5: 'Превосходно! Настоящий марокканский шедевр! 🏆',
            4: 'Очень вкусно! Почти идеально! 👨‍🍳',
            3: 'Неплохо! Есть куда расти! 👍',
            2: 'Ммм... съедобно, но нужно практиковаться 😅',
            1: 'Может, закажем пиццу? 🍕'
        };

        document.getElementById('result-comment').textContent = comments[stars];

        document.getElementById('result-stats').innerHTML = `
            <div class="result-stat">🔥 Огонь: ${Math.round(this.state.heat)}</div>
            <div class="result-stat">💧 Влага: ${Math.round(this.state.moisture)}</div>
            <div class="result-stat">🌶️ Вкус: ${Math.round(this.state.flavor)}</div>
            <div class="result-stat">⏱️ Время: ${Math.floor(this.elapsed / 60)}:${(this.elapsed % 60).toString().padStart(2, '0')}</div>
        `;

        this.showScreen('screen-result');
    }

    // === Утилиты ===

    getRandomMessage(category) {
        const messages = MESSAGES[category];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    showMessage(text) {
        const container = document.getElementById('message-container');
        const msg = document.getElementById('game-message');
        msg.textContent = text;
        container.classList.add('show');
        setTimeout(() => container.classList.remove('show'), 2500);
    }

    animateButton(btnId) {
        const btn = document.getElementById(btnId);
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 200);
    }

    // === Сохранение прогресса ===

    loadProgress() {
        const saved = localStorage.getItem('tajine_progress');
        if (saved) {
            this.progress = JSON.parse(saved);
        } else {
            this.progress = {
                totalStars: 0,
                totalDishes: 0,
                bestScores: {},
                achievements: []
            };
        }
    }

    saveProgress() {
        localStorage.setItem('tajine_progress', JSON.stringify(this.progress));
    }

    saveResult(stars) {
        this.progress.totalDishes++;
        this.progress.totalStars += stars;

        const recipeId = this.currentRecipe.id;
        if (!this.progress.bestScores[recipeId] || stars > this.progress.bestScores[recipeId]) {
            this.progress.bestScores[recipeId] = stars;
        }

        // Проверяем достижения
        this.checkAchievements(stars);
        this.saveProgress();
    }

    checkAchievements(stars) {
        if (this.progress.totalDishes === 1 && !this.progress.achievements.includes('first_cook')) {
            this.progress.achievements.push('first_cook');
        }
        if (stars === 5 && !this.progress.achievements.includes('five_stars')) {
            this.progress.achievements.push('five_stars');
        }
        if (this.spiceUses >= 20 && !this.progress.achievements.includes('spice_king')) {
            this.progress.achievements.push('spice_king');
        }
        if (this.perfectFireTime >= 30 && !this.progress.achievements.includes('fire_master')) {
            this.progress.achievements.push('fire_master');
        }
        if (this.progress.totalDishes >= 10 && !this.progress.achievements.includes('ten_dishes')) {
            this.progress.achievements.push('ten_dishes');
        }

        const allUnlocked = RECIPES.every(r =>
            r.unlocked || this.progress.totalStars >= (r.starsToUnlock || 0)
        );
        if (allUnlocked && !this.progress.achievements.includes('all_recipes')) {
            this.progress.achievements.push('all_recipes');
        }
    }

    // === Коллекция ===

    renderCollection() {
        const container = document.getElementById('collection-container');
        container.innerHTML = `
            <div class="collection-stats">
                <div class="collection-stat">
                    <span class="stat-number">${this.progress.totalDishes}</span>
                    <span class="stat-label">Блюд приготовлено</span>
                </div>
                <div class="collection-stat">
                    <span class="stat-number">${this.progress.totalStars}</span>
                    <span class="stat-label">Звёзд собрано</span>
                </div>
            </div>
            <h3 class="section-title">Достижения</h3>
            <div class="achievements-grid">
                ${ACHIEVEMENTS.map(a => `
                    <div class="achievement ${this.progress.achievements.includes(a.id) ? 'unlocked' : 'locked'}">
                        <span class="achievement-icon">${a.icon}</span>
                        <span class="achievement-name">${a.name}</span>
                        <span class="achievement-desc">${a.desc}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Запускаем игру
const game = new TajineGame();
