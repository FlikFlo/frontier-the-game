// Тажин Тамагочи - Game Logic (Dopamine Edition)

const RECIPES = [
    { id:'chicken_olives', name:'Курица с оливками', icon:'🍋', difficulty:1, cookTime:80, timeLimit:90, baseCoins:50, unlocked:true },
    { id:'kefta_eggs', name:'Кефта с яйцом', icon:'🥚', difficulty:1, cookTime:70, timeLimit:80, baseCoins:60, unlocked:false, levelReq:2 },
    { id:'lamb_prunes', name:'Баранина с черносливом', icon:'🍖', difficulty:2, cookTime:100, timeLimit:110, baseCoins:90, unlocked:false, levelReq:4 },
    { id:'fish_chermoula', name:'Рыба по-марокански', icon:'🐟', difficulty:2, cookTime:90, timeLimit:100, baseCoins:100, unlocked:false, levelReq:6 },
    { id:'veggie_seven', name:'Семь овощей', icon:'🥕', difficulty:3, cookTime:120, timeLimit:130, baseCoins:150, unlocked:false, levelReq:8 }
];

const RANDOM_EVENTS = [
    { icon:'🐱', text:'Кот тянется к еде!', reward:'coins', amount:20 },
    { icon:'💨', text:'Ветер раздул огонь!', effect:'heat', value:25 },
    { icon:'🧂', text:'Торговец специй!', reward:'flavor', amount:30 },
    { icon:'👵', text:'Бабушка заглянула попробовать!', reward:'coins', amount:30 },
    { icon:'💧', text:'Пролили воду!', effect:'moisture', value:-20 },
    { icon:'⭐', text:'Удача! Бонус!', reward:'coins', amount:50 }
];

const LEVEL_UNLOCKS = {
    2: 'Открыт рецепт: Кефта с яйцом 🥚',
    3: 'Комбо х3 теперь доступно!',
    4: 'Открыт рецепт: Баранина 🍖',
    5: 'Бонус к чаевым +20%',
    6: 'Открыт рецепт: Рыба 🐟',
    8: 'Открыт рецепт: Семь овощей 🥕',
    10: 'Все рецепты открыты! 🏆'
};

function xpForLevel(lvl) { return 100 + (lvl - 1) * 80; }

class TajineGame {
    constructor() {
        this.state = { heat:50, moisture:50, flavor:0, doneness:0 };
        this.currentRecipe = null;
        this.gameInterval = null;
        this.elapsed = 0;
        this.timeLeft = 0;
        this.isPlaying = false;
        this.combo = 0;
        this.comboMax = 0;
        this.stirCooldown = false;
        this.currentEvent = null;
        this.eventTimer = 0;
        this.lastEventTime = 0;
        this.sessionEarnings = { coins:0, xp:0, tips:0 };

        this.loadProgress();
        this.updateMenuStats();
        this.showMenu();
    }

    // === Save / Load ===
    loadProgress() {
        const saved = localStorage.getItem('tajine_v2');
        if (saved) { this.progress = JSON.parse(saved); return; }
        this.progress = {
            coins: 100, xp: 0, level: 1,
            totalDishes: 0, totalStars: 0,
            bestScores: {}, achievements: []
        };
    }
    saveProgress() { localStorage.setItem('tajine_v2', JSON.stringify(this.progress)); }

    // === Navigation ===
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }
    showMenu() { this.stopGame(); this.updateMenuStats(); this.showScreen('screen-menu'); }
    showRecipeSelect() { this.renderRecipes(); this.showScreen('screen-recipes'); }
    showCollection() { this.renderCollection(); this.showScreen('screen-collection'); }

    updateMenuStats() {
        document.getElementById('menu-coins').textContent = this.progress.coins;
        document.getElementById('menu-level').textContent = this.progress.level;
    }

    // === Recipes ===
    renderRecipes() {
        const list = document.getElementById('recipes-list');
        list.innerHTML = '';
        RECIPES.forEach((r, i) => {
            const unlocked = r.unlocked || this.progress.level >= (r.levelReq || 0);
            const card = document.createElement('div');
            card.className = `recipe-card ${unlocked ? '' : 'locked'}`;
            if (unlocked) {
                card.onclick = () => this.startGame(i);
                const best = this.progress.bestScores[r.id] || 0;
                card.innerHTML = `
                    <div class="recipe-icon">${r.icon}</div>
                    <div class="recipe-info">
                        <h3>${r.name}</h3>
                        <p class="recipe-desc">⏱ ${r.timeLimit}с · ${'🌶️'.repeat(r.difficulty)} · 🪙 ${r.baseCoins}+</p>
                        <div class="recipe-meta">${best ? '⭐'.repeat(best) : ''}</div>
                    </div>`;
            } else {
                card.innerHTML = `
                    <div class="recipe-icon">🔒</div>
                    <div class="recipe-info">
                        <h3>${r.name}</h3>
                        <p class="recipe-desc">Открой на уровне ${r.levelReq}</p>
                    </div>`;
            }
            list.appendChild(card);
        });
    }

    // === Game Start ===
    startGame(idx) {
        this.currentRecipe = RECIPES[idx];
        this.state = { heat:50, moisture:50, flavor:0, doneness:0 };
        this.elapsed = 0;
        this.timeLeft = this.currentRecipe.timeLimit;
        this.combo = 0; this.comboMax = 0;
        this.lastEventTime = 0;
        this.sessionEarnings = { coins:0, xp:0, tips:0 };
        this.isPlaying = true;

        document.getElementById('current-recipe-name').textContent = this.currentRecipe.name;
        this.updateUI();
        this.updateVisuals();
        this.showScreen('screen-game');
        this.showMessage(`Заказ: ${this.currentRecipe.name} ${this.currentRecipe.icon}`);

        this.gameInterval = setInterval(() => this.tick(), 1000);
    }

    stopGame() {
        if (this.gameInterval) { clearInterval(this.gameInterval); this.gameInterval = null; }
        this.isPlaying = false;
        this.hideEvent();
    }

    // === Main Tick ===
    tick() {
        if (!this.isPlaying) return;
        this.elapsed++;
        this.timeLeft--;

        // Параметры
        this.state.heat = Math.max(0, this.state.heat - 1.5);
        const evap = 0.5 + (this.state.heat / 100) * 1.3;
        this.state.moisture = Math.max(0, this.state.moisture - evap);
        if (this.state.flavor > 65) this.state.flavor = Math.max(0, this.state.flavor - 0.2);

        // Зоны
        const heatOk = this.state.heat >= 35 && this.state.heat <= 65;
        const moistOk = this.state.moisture >= 25 && this.state.moisture <= 60;
        const flavOk = this.state.flavor >= 45 && this.state.flavor <= 75;
        const allOk = heatOk && moistOk && flavOk;

        // Прогресс
        if (heatOk && moistOk) {
            const mult = flavOk ? 1.6 : 1;
            this.state.doneness = Math.min(100, this.state.doneness + (100 / this.currentRecipe.cookTime) * mult);
        } else if (this.state.heat > 20) {
            this.state.doneness = Math.min(100, this.state.doneness + (100 / this.currentRecipe.cookTime) * 0.3);
        }

        // Комбо — растёт когда все 3 параметра в зоне
        if (allOk) {
            this.combo++;
            if (this.combo > this.comboMax) this.comboMax = this.combo;
            if (this.combo === 3 || this.combo === 5 || this.combo === 8 || this.combo === 12) {
                this.spawnFloatText(`КОМБО x${Math.floor(this.combo/3)+1}!`, 50, 35);
                this.shakeScreen();
            }
        } else {
            if (this.combo >= 3) this.showMessage('Комбо сброшено!');
            this.combo = 0;
        }

        // Случайные события (раз в 12-20 секунд)
        if (!this.currentEvent && this.elapsed - this.lastEventTime > 12 && Math.random() < 0.15) {
            this.triggerEvent();
        }

        // Критические предупреждения
        if (this.timeLeft === 15) this.showMessage('⏰ Осталось 15 секунд!');
        if (this.state.heat <= 0) this.showMessage('Огонь погас! 🔥');
        else if (this.state.heat > 85) this.showMessage('Слишком горячо! 😱');

        this.updateUI();
        this.updateVisuals();

        if (this.state.doneness >= 100) { this.finishCooking(true); return; }
        if (this.timeLeft <= 0) { this.finishCooking(false); return; }
    }

    // === Player Actions ===
    addFire() {
        if (!this.isPlaying) return;
        this.state.heat = Math.min(100, this.state.heat + 15);
        this.bump('btn-fire');
        this.updateUI(); this.updateVisuals();
    }
    addWater() {
        if (!this.isPlaying) return;
        this.state.moisture = Math.min(100, this.state.moisture + 22);
        this.bump('btn-water');
        this.updateUI(); this.updateVisuals();
    }
    addSpice() {
        if (!this.isPlaying) return;
        this.state.flavor = Math.min(100, this.state.flavor + 14);
        this.bump('btn-spice');
        this.updateUI();
    }
    stir() {
        if (!this.isPlaying || this.stirCooldown) return;
        if (this.state.heat > 70) this.state.heat -= 6;
        if (this.state.moisture > 60) this.state.moisture -= 4;
        if (this.state.flavor > 80) this.state.flavor -= 5;
        this.state.doneness = Math.min(100, this.state.doneness + 3);
        this.bump('btn-stir');
        this.stirCooldown = true;
        const b = document.getElementById('btn-stir');
        b.classList.add('cooldown');
        setTimeout(() => { this.stirCooldown = false; b.classList.remove('cooldown'); }, 2500);
        this.updateUI();
    }

    // === Events ===
    triggerEvent() {
        const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        this.currentEvent = ev;
        this.lastEventTime = this.elapsed;
        document.getElementById('event-icon').textContent = ev.icon;
        document.getElementById('event-text').textContent = ev.text;
        document.getElementById('event-popup').classList.add('active');
        // Автозакрытие через 4 секунды
        this.eventTimer = setTimeout(() => this.missEvent(), 4000);
    }
    handleEvent() {
        if (!this.currentEvent) return;
        clearTimeout(this.eventTimer);
        const ev = this.currentEvent;
        if (ev.reward === 'coins') {
            this.sessionEarnings.tips += ev.amount;
            this.spawnFloatText(`+${ev.amount} 🪙`, 50, 30);
            this.spawnCoins(ev.amount / 10, 50, 30);
        } else if (ev.reward === 'flavor') {
            this.state.flavor = Math.min(100, this.state.flavor + ev.amount);
            this.spawnFloatText('+Вкус!', 50, 30);
        } else if (ev.effect === 'heat') {
            this.state.heat = Math.min(100, this.state.heat + ev.value);
            this.spawnFloatText('+Огонь', 50, 30);
        } else if (ev.effect === 'moisture') {
            this.state.moisture = Math.max(0, this.state.moisture + ev.value);
            this.spawnFloatText(ev.value > 0 ? '+Вода' : '-Вода', 50, 30);
        }
        this.hideEvent();
        this.shakeScreen();
    }
    missEvent() {
        if (!this.currentEvent) return;
        const ev = this.currentEvent;
        if (ev.effect === 'heat') this.state.heat = Math.min(100, this.state.heat + ev.value);
        if (ev.effect === 'moisture') this.state.moisture = Math.max(0, this.state.moisture + ev.value);
        this.showMessage('Событие пропущено...');
        this.hideEvent();
    }
    hideEvent() {
        this.currentEvent = null;
        document.getElementById('event-popup').classList.remove('active');
    }

    // === UI Updates ===
    updateUI() {
        document.getElementById('bar-heat').style.width = this.state.heat + '%';
        document.getElementById('bar-moisture').style.width = this.state.moisture + '%';
        document.getElementById('bar-flavor').style.width = this.state.flavor + '%';
        document.getElementById('bar-doneness').style.width = this.state.doneness + '%';

        this.updateZone('bar-heat', this.state.heat, 35, 65);
        this.updateZone('bar-moisture', this.state.moisture, 25, 60);
        this.updateZone('bar-flavor', this.state.flavor, 45, 75);

        // Таймер
        const timer = document.getElementById('order-timer');
        const fill = document.getElementById('order-timer-fill');
        const text = document.getElementById('order-timer-text');
        const pct = Math.max(0, this.timeLeft / this.currentRecipe.timeLimit);
        fill.style.height = (pct * 100) + '%';
        text.textContent = this.timeLeft;
        timer.classList.toggle('warn', this.timeLeft <= 30 && this.timeLeft > 15);
        timer.classList.toggle('danger', this.timeLeft <= 15);

        // Комбо
        const cd = document.getElementById('combo-display');
        if (this.combo >= 3) {
            cd.classList.add('visible');
            cd.classList.toggle('super', this.combo >= 8);
            const mult = Math.floor(this.combo / 3) + 1;
            document.getElementById('combo-mult').textContent = 'x' + mult;
            document.getElementById('combo-text').textContent = this.combo >= 8 ? 'СУПЕР!' : 'КОМБО';
        } else {
            cd.classList.remove('visible');
        }
    }
    updateZone(id, v, min, max) {
        const b = document.getElementById(id);
        if (v >= min && v <= max) { b.classList.add('in-zone'); b.classList.remove('danger'); }
        else if (v < min * 0.5 || v > max * 1.3) { b.classList.remove('in-zone'); b.classList.add('danger'); }
        else { b.classList.remove('in-zone', 'danger'); }
    }
    updateVisuals() {
        const fc = document.getElementById('fire-container');
        if (this.state.heat > 60) fc.className = 'fire-container fire-high';
        else if (this.state.heat > 30) fc.className = 'fire-container fire-medium';
        else if (this.state.heat > 10) fc.className = 'fire-container fire-low';
        else fc.className = 'fire-container fire-out';

        document.getElementById('steam-container').classList.toggle('active', this.state.heat > 40 && this.state.moisture > 20);
        document.getElementById('tajine-lid').classList.toggle('shaking', this.state.heat > 70 && this.state.moisture > 50);

        const food = document.getElementById('tajine-food');
        const d = Math.min(100, this.state.doneness);
        food.style.background = `hsl(${30 - d * 0.15}, ${60 + d * 0.3}%, ${50 - d * 0.15}%)`;
    }

    // === Finish ===
    finishCooking(completed) {
        this.stopGame();
        const stars = completed ? this.calcStars() : 1;

        // Награды
        const base = this.currentRecipe.baseCoins;
        const starMult = [0, 0.5, 0.8, 1.0, 1.3, 1.7][stars];
        const comboBonus = Math.floor(this.comboMax / 3) * 15;
        const timeBonus = completed ? Math.max(0, Math.floor(this.timeLeft * 0.5)) : 0;
        const tipBonus = this.sessionEarnings.tips;
        const totalCoins = Math.floor(base * starMult + comboBonus + timeBonus + tipBonus);
        const xpGain = stars * 25 + Math.floor(this.comboMax * 2);

        this.sessionEarnings.coins = totalCoins;
        this.sessionEarnings.xp = xpGain;
        this.sessionEarnings.breakdown = { base: Math.floor(base * starMult), combo: comboBonus, time: timeBonus, tips: tipBonus };

        // Обновляем прогресс
        this.progress.coins += totalCoins;
        this.progress.xp += xpGain;
        this.progress.totalDishes++;
        this.progress.totalStars += stars;
        const rid = this.currentRecipe.id;
        if (!this.progress.bestScores[rid] || stars > this.progress.bestScores[rid]) {
            this.progress.bestScores[rid] = stars;
        }

        // Level up?
        let leveledUp = false;
        while (this.progress.xp >= xpForLevel(this.progress.level)) {
            this.progress.xp -= xpForLevel(this.progress.level);
            this.progress.level++;
            leveledUp = true;
        }

        this.saveProgress();
        this.showResult(stars, completed);

        if (leveledUp) {
            setTimeout(() => this.showLevelUp(), 1800);
        }
    }
    calcStars() {
        const h = this.zoneScore(this.state.heat, 35, 65);
        const m = this.zoneScore(this.state.moisture, 25, 60);
        const f = this.zoneScore(this.state.flavor, 45, 75);
        const avg = (h + m + f) / 3;
        const comboBonus = Math.min(0.15, this.comboMax * 0.01);
        const score = avg + comboBonus;
        if (score >= 0.92) return 5;
        if (score >= 0.78) return 4;
        if (score >= 0.6) return 3;
        if (score >= 0.4) return 2;
        return 1;
    }
    zoneScore(v, min, max) {
        const c = (min + max) / 2, r = (max - min) / 2;
        const d = Math.abs(v - c);
        if (d <= r) return 1;
        if (d <= r * 2) return 0.6;
        return 0.3;
    }

    // === Result Screen ===
    showResult(stars, completed) {
        document.getElementById('result-title').textContent = completed ? 'Блюдо готово!' : 'Время вышло!';
        const sc = document.getElementById('stars-container');
        sc.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const s = document.createElement('span');
            s.className = 'result-star' + (i < stars ? ' earned' : '');
            s.textContent = '⭐';
            s.style.animationDelay = (i * 0.2) + 's';
            sc.appendChild(s);
        }
        const comments = {
            5:'🏆 Шедевр! Клиент в восторге!',
            4:'👨‍🍳 Отлично! Хорошие чаевые!',
            3:'👍 Норм, но можно лучше',
            2:'😅 Съедобно...',
            1:'🍕 Может закажем пиццу?'
        };
        document.getElementById('result-comment').textContent = comments[stars];

        // Rewards showcase
        const rs = document.getElementById('rewards-showcase');
        const b = this.sessionEarnings.breakdown;
        rs.innerHTML = '';
        const rewards = [
            { icon:'🪙', value:'+' + this.sessionEarnings.coins, label:'Монет' },
            { icon:'⚡', value:'+' + this.sessionEarnings.xp, label:'XP' },
        ];
        if (this.comboMax >= 3) rewards.push({ icon:'🔥', value:'x' + this.comboMax, label:'Комбо' });
        rewards.forEach((r, i) => {
            const el = document.createElement('div');
            el.className = 'reward-item';
            el.style.animationDelay = (i * 0.15 + 0.8) + 's';
            el.innerHTML = `<span class="reward-icon-big">${r.icon}</span><span class="reward-value">${r.value}</span><span class="reward-label">${r.label}</span>`;
            rs.appendChild(el);
        });

        // XP bar
        document.getElementById('result-level').textContent = this.progress.level;
        const need = xpForLevel(this.progress.level);
        document.getElementById('result-xp-fill').style.width = '0%';
        document.getElementById('result-xp-text').textContent = `${this.progress.xp}/${need}`;
        setTimeout(() => {
            document.getElementById('result-xp-fill').style.width = Math.min(100, (this.progress.xp / need) * 100) + '%';
        }, 600);

        this.showScreen('screen-result');

        // Спавним монеты!
        setTimeout(() => this.spawnCoins(Math.min(15, Math.floor(this.sessionEarnings.coins / 20)), 50, 50), 1000);
    }

    showLevelUp() {
        document.getElementById('levelup-num').textContent = this.progress.level;
        const unlock = LEVEL_UNLOCKS[this.progress.level] || 'Больше опыта, больше возможностей!';
        document.getElementById('levelup-unlock').textContent = unlock;
        document.getElementById('popup-levelup').classList.add('active');
        this.spawnCoins(20, 50, 50);
    }
    closeLevelUp() {
        document.getElementById('popup-levelup').classList.remove('active');
    }

    // === Collection ===
    renderCollection() {
        const c = document.getElementById('collection-container');
        c.innerHTML = `
            <div class="collection-stats">
                <div class="collection-stat"><span class="stat-number">${this.progress.totalDishes}</span><span class="stat-label">Блюд</span></div>
                <div class="collection-stat"><span class="stat-number">${this.progress.totalStars}</span><span class="stat-label">⭐ Звёзд</span></div>
                <div class="collection-stat"><span class="stat-number">${this.progress.level}</span><span class="stat-label">Уровень</span></div>
                <div class="collection-stat"><span class="stat-number">${this.progress.coins}</span><span class="stat-label">🪙 Монет</span></div>
            </div>`;
    }

    // === Particles / Juice ===
    spawnCoins(n, xPct, yPct) {
        const layer = document.getElementById('particles-layer');
        const rect = layer.getBoundingClientRect();
        const cx = rect.width * xPct / 100;
        const cy = rect.height * yPct / 100;
        for (let i = 0; i < n; i++) {
            const c = document.createElement('div');
            c.className = 'coin-particle';
            c.textContent = '🪙';
            c.style.left = cx + 'px';
            c.style.top = cy + 'px';
            const angle = (Math.PI * 2 * i / n) + Math.random() * 0.5;
            const dist = 60 + Math.random() * 80;
            c.style.setProperty('--dx', (Math.cos(angle) * 20) + 'px');
            c.style.setProperty('--tx', (Math.cos(angle) * dist) + 'px');
            c.style.setProperty('--ty', (Math.sin(angle) * dist - 60) + 'px');
            c.style.animationDelay = (i * 0.05) + 's';
            layer.appendChild(c);
            setTimeout(() => c.remove(), 1500);
        }
    }
    spawnFloatText(text, xPct, yPct) {
        const layer = document.getElementById('particles-layer');
        const rect = layer.getBoundingClientRect();
        const el = document.createElement('div');
        el.className = 'float-text';
        el.textContent = text;
        el.style.left = (rect.width * xPct / 100) + 'px';
        el.style.top = (rect.height * yPct / 100) + 'px';
        el.style.transform = 'translateX(-50%)';
        layer.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }
    shakeScreen() {
        const f = document.querySelector('.phone-frame');
        f.classList.remove('shake');
        void f.offsetWidth;
        f.classList.add('shake');
    }
    bump(id) {
        const b = document.getElementById(id);
        b.classList.add('pressed');
        setTimeout(() => b.classList.remove('pressed'), 200);
    }
    showMessage(text) {
        const c = document.getElementById('message-container');
        document.getElementById('game-message').textContent = text;
        c.classList.add('show');
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => c.classList.remove('show'), 2000);
    }
}

const game = new TajineGame();
