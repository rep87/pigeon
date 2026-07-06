import { loadAnimalsConfig } from "./pigeon.js";
import { loadStagesConfig } from "./wave.js";
import { loadWeaponsConfig } from "./weapon.js";
import { loadItemsConfig } from "./item.js";

const FALLBACK_ANIMALS = {
  kinds: {
    dull: { hp: 20, speed: 70, radius: 12, reward: 1, sprite: "assets/pigeon/1001/pigeon_1001_walk.png", behavior: "chase", meta: { cols: 6, rows: 3, sec: 0.18, sw: 1.2, sh: 1.44, bottom: true } },
    adhd: { hp: 45, speed: 189, radius: 13, reward: 1, sprite: "assets/pigeon/1002/pigeon_1002.png", behavior: "adhd", meta: { cols: 6, rows: 3, sec: 0.18, sw: 1, sh: 1, bottom: true }, turnRange: [0.28, 0.65] },
    picky: { hp: 80, speed: 126, radius: 13, reward: 1, sprite: "assets/pigeon/1003/pigeon_1003.png", behavior: "flee", meta: { cols: 6, rows: 3, sec: 0.18, sw: 1, sh: 1, bottom: true } },
    rude: { hp: 90, speed: 175, radius: 13, reward: 1, sprite: "assets/pigeon/1004/pigeon_1004.png", behavior: "dash", meta: { cols: 6, rows: 3, sec: 0.18, sw: 1, sh: 1, bottom: true } },
    shy: { hp: 120, speed: 105, radius: 13, reward: 2, sprite: "assets/pigeon/1005/pigeon_1005.png", behavior: "orbit_escape", meta: { cols: 5, rows: 3, sec: 0.18, sw: 1, sh: 1, bottom: true }, escapeLimit: 8 },
    mom: { hp: 220, speed: 70, radius: 15, reward: 3, sprite: "assets/pigeon/1006/pigeon_1006.png", behavior: "chase", meta: { cols: 5, rows: 3, sec: 0.18, sw: 1, sh: 1, bottom: true } },
    boss: { hp: 50000, speed: 105, radius: 36, reward: 0, sprite: "assets/pigeon/1101/pigeon_1101.png", behavior: "boss", meta: { cols: 5, rows: 3, sec: 0.18, sw: 1, sh: 1, bottom: true } }
  }
};
const FALLBACK_STAGES = {
  stages: [
    { id: "S1", time: 60, targetThumb: 180, dropMultiplier: 1, spawn: { dull: 200, adhd: 20 } },
    { id: "S2", time: 60, targetThumb: 350, dropMultiplier: 1, spawn: { dull: 50, adhd: 150, picky: 50 } },
    { id: "S3", time: 60, targetThumb: 560, dropMultiplier: 1, spawn: { dull: 50, adhd: 60, rude: 200 } },
    { id: "S4", time: 30, targetThumb: 840, dropMultiplier: 2, spawn: { mom: 150 } },
    { id: "S5", time: 90, targetThumb: 1300, dropMultiplier: 1, spawn: { dull: 60, picky: 60, shy: 200 } }
  ],
  bossWave: {
    timeLimit: 90,
    hp: 50000,
    damage: 60,
    reduction: 0.5,
    dirs: [
      { v: { x: 0, y: -1 }, a: "UP" },
      { v: { x: 0, y: 1 }, a: "DOWN" },
      { v: { x: -1, y: 0 }, a: "LEFT" },
      { v: { x: 1, y: 0 }, a: "RIGHT" }
    ],
    dirDotReq: 0.92
  }
};
const FALLBACK_WEAPONS = {
  player: { baseFireInterval: 0.16, baseMoveSpeed: 220, autoRange: 2, viewZoom: 1.6, levels: [10, 30, 60, 100, 150, 210, 280, 360, 450, 550], fatigue: { zone: 1.5, minCount: 3, inc: 22, dec: 18 } }
};
const FALLBACK_ITEMS = {
  drop: { item: 0.15, atom: 0.01, duration: 5, bossItem: 0.05, bossAtom: 0.005 },
  items: { bac: { fireRateMul: 1.3 }, cof: { moveMul: 1.3 }, eng: { hitMul: 1.5 }, atomic: { bossDamageRatio: 0.01 } }
};
async function safeLoad(label, loader, fallback) {
  try { return await loader(); }
  catch (err) { console.error(`[config] ${label} load failed. fallback used:`, err.message || err); return fallback; }
}
const [animalsCfg, stagesCfg, weaponsCfg, itemsCfg] = await Promise.all([
  safeLoad("animals.json", loadAnimalsConfig, FALLBACK_ANIMALS),
  safeLoad("stages.json", loadStagesConfig, FALLBACK_STAGES),
  safeLoad("weapons.json", loadWeaponsConfig, FALLBACK_WEAPONS),
  safeLoad("items.json", loadItemsConfig, FALLBACK_ITEMS)
]);
const $ = id => document.getElementById(id), c = $("game"), x = c.getContext("2d");
const hudHeart = $("hudHeart"), hudLevel = $("hudLevel"), hudCenter = $("hudCenter"), hudTimer = $("hudTimer"), xpText = $("xpText"), xpFill = $("xpFill"), hudStarsFill = $("hudStarsFill"), hudStarsScore = $("hudStarsScore");
const bossHud = $("bossHud"), bossDirEl = $("bossDir"), bossFill = $("bossFill"), bossHpTxt = $("bossHpTxt"), bossTime = $("bossTime");
const titleOv = $("titleOv"), levelOv = $("levelOv"), evoOv = $("evoOv"), msgOv = $("msgOv"), msgText = $("msgText"), statsOv = $("statsOv"), statsBody = $("statsBody"), statsCloseBtn = $("statsCloseBtn"), shopOv = $("shopOv"), charOv = $("charOv");
const titleResult = $("titleResult"), lvTitle = $("lvTitle"), lvSub = $("lvSub"), lvCards = $("lvCards"), evoMsg = $("evoMsg"), buffUi = $("buffUi"), devPanel = $("devPanel"), devBossBtn = $("devBossBtn"), devLv5Btn = $("devLv5Btn"), devLv10Btn = $("devLv10Btn"), devThumb500Btn = $("devThumb500Btn"), devItemCoffeeBtn = $("devItemCoffee"), devItemChiliBtn = $("devItemChili"), devItemRamenBtn = $("devItemRamen"), devItemLunchBtn = $("devItemLunch"), devItemEnergyBtn = $("devItemEnergy"), devItemBacchusBtn = $("devItemBacchus"), devItemAtomicBtn = $("devItemAtomic");
const shopBtn = $("shopBtn"), shopHeart = $("shopHeart"), buySaltyBtn = $("buySaltyBtn"), buySweetBtn = $("buySweetBtn"), shopCloseBtn = $("shopCloseBtn"), charSalarymanBtn = $("charSalarymanBtn"), charCloseBtn = $("charCloseBtn");
const skillDial = $("skillDial"), skillNeedle = $("skillNeedle"), skillTimer = $("skillTimer");
const sBtns = [$("s0"), $("s1")], sTimers = [$("st0"), $("st1")];
const bgmVolumeSliders = [...document.querySelectorAll(".bgmVolumeRange")];
const bgmVolumeLabels = [...document.querySelectorAll(".bgmVolumeValue")];

const DEV_NO_CACHE_ASSETS = new URLSearchParams(location.search).has("nocache");
const ASSET_BUST = DEV_NO_CACHE_ASSETS ? `v=${Date.now()}` : "";
const withCacheBust = (file) => {
  if (!ASSET_BUST) return file;
  const sep = file.includes("?") ? "&" : "?";
  return `${file}${sep}${ASSET_BUST}`;
};
const PLAYER_IDLE_PATH = withCacheBust("assets/player/player_idle.png");
const PLAYER_WALK_PATH = withCacheBust("assets/player/player_walk.png");
const PLAYER_HIT_PATH = withCacheBust("assets/player/player_hit.png");
const PLAYER_ATK_PATH = withCacheBust("assets/player/player_atk.png");
const BOOM_IMAGE_PATH = withCacheBust("assets/ui/boom.webp");
const BOSS_CUT_1_PATH = withCacheBust("assets/ui/boss_1101_cut_1.png");
const BOSS_CUT_2_PATH = withCacheBust("assets/ui/boss_1101_cut_2.png");
const BGM_PATH = withCacheBust("assets/audio/bgm.mp3");
const BOSS_IMPACT_PATH = withCacheBust("assets/audio/boss_1101_impact.mp3");
const BOSS_BGM1_PATH = withCacheBust("assets/audio/boss_1101_bgm1.mp3");
const BOSS_BGM2_PATH = withCacheBust("assets/audio/boss_1101_bgm2.mp3");
const BACKGROUND_IMAGE_PATH = withCacheBust("assets/bg/background.png");
const SPICY_SKILL_ZONE_PATH = withCacheBust("assets/ui/spicy_skill_zone.png");
const SPICY_BULLET_PATH = withCacheBust("assets/weapon/fire_1.png");
const HEART_ICON_PATH = withCacheBust("assets/ui/heart.png");
const THUMB_ICON_PATH = withCacheBust("assets/ui/thumbsup.png");
const HEART_ICON_FALLBACKS = [HEART_ICON_PATH, withCacheBust("assets/ui/heart.png.png")];
const THUMB_ICON_FALLBACKS = [THUMB_ICON_PATH, withCacheBust("assets/ui/thumbsup.png.png")];
const HUD_ICON_SIZE = 16;
const FX_ICON_SIZE = 12;
const BG_TILE_SCALE = .28;
const BIRD_EAT_MIN_SEC = 1;
const BIRD_FULL_DURATION_SCALE = 0.5;
const FULL_HOLD_END_GRACE = 0.07;
const FULL_HOLD_MIN_SEC = 0.22;
const THUMB_SEEK_HOLD_SEC = 0.5;
const THUMB_SEEK_MOVE_DURATION = 1.1;
const BOOM_EFFECT_DURATION = 1;
const BOOM_EFFECT_HOLD_SEC = 0.5;
const BOOM_EFFECT_FADE_SEC = 0.5;
const ATOMIC_FX_DROP_SEC = 0.5;
const ATOMIC_FX_BURST_SEC = 0.95;
const ATOMIC_FX_WAVE_SEC = 0.45;
const ATOMIC_FX_MAX_PARTICLES = 100;
const ATOMIC_FX_MIN_PARTICLES = 50;
const ATOMIC_FX_PARTICLE_HIT_R = 14;
const BOSS_CUT_HOLD_SEC = 1;
const BGM_VOLUME_KEY = "pigeon3_bgm_volume";
const SPICY_SKILL_COOLDOWN = 10;
const SPICY_SKILL_DAMAGE_RATIO = 0.2;
const SPICY_SKILL_TICK_SEC = 0.2;
const SPICY_SKILL_HOLD_SEC = 1.0;
const SPICY_SKILL_DAMAGE_FX_SEC = 0.35;
const BULLET_SCALE_BY_DAMAGE = 1.5;
const PIGEON_SPRITE_BASE_PATH = "";
const SPRITE_PATH_CANDIDATES = ["", "./", "assets/"];
const VIEW_ZOOM = weaponsCfg.player.viewZoom;
const PIGEON_SPRITES = Object.fromEntries(Object.entries(animalsCfg.kinds).map(([k, v]) => [k, typeof v.sprite === "string" ? v.sprite : v.sprite?.walk || ""]));
const PIGEON_SPRITE_PACKS = Object.fromEntries(Object.entries(animalsCfg.kinds).map(([k, v]) => {
    const meta = v.meta || {};
    const base = { cols: meta.cols ?? 4, rows: meta.rows ?? 3, sec: meta.sec ?? .18 };
    const mkState = (state) => {
        const src = typeof v.sprite === "string" ? (state === "walk" ? v.sprite : "") : v.sprite?.[state] ?? "";
        const ani = v.animation?.[state] || {};
        const cols = ani.cols ?? base.cols;
        const rows = ani.rows ?? base.rows;
        const sec = ani.sec ?? base.sec;
        const frames = Number.isFinite(ani.frames) ? Math.floor(ani.frames) : cols * rows;
        return src ? { src, cols, rows, sec, frames, loop: ani.loop !== false } : null;
    };
    return [k, { isMultiState: v.sprite && typeof v.sprite === "object", walk: mkState("walk"), eat: mkState("eat"), full: mkState("full") }];
}));
const W = c.width, H = c.height, MW = W * 3, MH = H * 2;
const MAX_LEVEL = 50;
const LEVELS = (() => { const a = [...weaponsCfg.player.levels]; while (a.length < (MAX_LEVEL - 1)) a.push(Math.round(a[a.length - 1] * 1.1)); return a; })(), AUTO_RANGE = weaponsCfg.player.autoRange, BASE_FIRE = weaponsCfg.player.baseFireInterval, BASE_MS = weaponsCfg.player.baseMoveSpeed;
const ITEM_DROP = itemsCfg.drop.item, ATOM_DROP = itemsCfg.drop.atom, BOSS_ITEM_DROP = itemsCfg.drop.bossItem, BOSS_ATOM_DROP = itemsCfg.drop.bossAtom, ITEM_DUR = itemsCfg.drop.duration, FAT_ZONE = weaponsCfg.player.fatigue.zone, FAT_MIN = weaponsCfg.player.fatigue.minCount, FAT_INC = weaponsCfg.player.fatigue.inc, FAT_DEC = weaponsCfg.player.fatigue.dec, BOSS_TIME = stagesCfg.bossWave.timeLimit, BOSS_REDUCE = stagesCfg.bossWave.reduction, BOSS_BASE_DMG = stagesCfg.bossWave.damage;
const BAC_FIRE_MUL = itemsCfg.items.bac.fireRateMul, COF_MOVE_MUL = itemsCfg.items.cof.moveMul, ENG_HIT_MUL = itemsCfg.items.eng.hitMul, ATOMIC_BOSS_RATIO = itemsCfg.items.atomic.bossDamageRatio;
const DIRS = stagesCfg.bossWave.dirs, DIR_DOT_REQ = stagesCfg.bossWave.dirDotReq;
const STAGES = stagesCfg.stages.map(s => ({ id: s.id, t: s.time, target: s.targetThumb, drop: s.dropMultiplier, sp: s.spawn }));
const game = { mode: "title", si: 0, se: 0, thumb: 0, hearts: 200, shop: { salty: false, sweet: false }, lv: 1, fat: 0, fireCd: 0, spawn: {}, msgAt: 0, msgCb: null, evoAt: 0, atomic: 0, boomT: 0, boss: null, bossIntro: null, shake: 0, debugPickLeft: 0, stars: 0, starLv: 0, trailCd: 0, spicy: { cdLeft: SPICY_SKILL_COOLDOWN, lastFed: null, zones: [], pending: [] } };
        const PLAYER_RADIUS = 14;
        const PLAYER_SCALE = 2.25;
        const BIRD_SCALE = 1.5;
        const cam = { x: 0, y: 0 }, p = { x: MW / 2, y: MH / 2, r: PLAYER_RADIUS * PLAYER_SCALE, fx: 1, fy: 0, stun: 0 }, b = { fr: 1, dm: 1, sm: 1, ag: 1, mv: 1, fm: 1, hr: 1, dr: 1, crit: 0, items: { coffee: 3, chili: 0, ramen: 0, lunch: 0, energy: 0, bacchus: 0 }, coffeeDurBonus: 1.5, bossThumbBonus: 0 };
        const SPR_FRAME_SEC = .15;
        const PLAYER_HIT_HOLD_SEC = 0.35;
        const PLAYER_HIT_MIN_HOLD_SEC = 0.1;
        const PLAYER_SPR_COLS_DEFAULT = 4;
        const PLAYER_SPR_FRAMES = { idle: 8, walk: 8, hit: 8, atk: 8 };
        const PLAYER_SPR_ROWS = { idle: 2, walk: 2, hit: 2, atk: 2 };
        const SPR_ROWS = { down: 0, up: 1, right: 2, left: 3, atk: 4, hit: 5, idle: 6 };
        const ps = { ready: false, frame: 0, t: 0, face: "down", state: "idle", lock: 0, anim: "idle", row: 0, flip: false, atkFace: "right" };
        const playerSprites = {
            idle: { img: new Image(), ready: false, cols: PLAYER_SPR_COLS_DEFAULT, rows: PLAYER_SPR_ROWS.idle, frames: PLAYER_SPR_FRAMES.idle, src: PLAYER_IDLE_PATH },
            walk: { img: new Image(), ready: false, cols: PLAYER_SPR_COLS_DEFAULT, rows: PLAYER_SPR_ROWS.walk, frames: PLAYER_SPR_FRAMES.walk, src: PLAYER_WALK_PATH },
            hit: { img: new Image(), ready: false, cols: PLAYER_SPR_COLS_DEFAULT, rows: PLAYER_SPR_ROWS.hit, frames: PLAYER_SPR_FRAMES.hit, src: PLAYER_HIT_PATH },
            atk: { img: new Image(), ready: false, cols: PLAYER_SPR_COLS_DEFAULT, rows: PLAYER_SPR_ROWS.atk, frames: PLAYER_SPR_FRAMES.atk, src: PLAYER_ATK_PATH }
        };
        const boomImg = { img: new Image(), ready: false };
        const bossCut1Img = { img: new Image(), ready: false };
        const bossCut2Img = { img: new Image(), ready: false };
        const bgmAudio = new Audio(BGM_PATH);
        const bossImpactAudio = new Audio(BOSS_IMPACT_PATH);
        const bossBgm1Audio = new Audio(BOSS_BGM1_PATH);
        const bossBgm2Audio = new Audio(BOSS_BGM2_PATH);
        const bgImg = { img: new Image(), ready: false };
        const heartIcon = { img: new Image(), ready: false };
        const thumbIcon = { img: new Image(), ready: false };
        const spicyZone = { img: new Image(), ready: false, fail: false, try: 0 };
        const spicyBullet = { img: new Image(), ready: false, fail: false, try: 0 };
        let bgmReady = false;
        let bossBgmSequenceArmed = false;
        let bossImpactPlayCount = 0;
        const iconHtml = (type, label = "", size = HUD_ICON_SIZE) => {
            if (type === "heart" && heartIcon.ready) return `<img src="${heartIcon.img.src}" width="${size}" height="${size}" style="vertical-align:middle;margin-right:4px"/>${label}`;
            if (type === "thumb" && thumbIcon.ready) return `<img src="${thumbIcon.img.src}" width="${size}" height="${size}" style="vertical-align:middle;margin-right:4px"/>${label}`;
            const fallback = type === "heart" ? "♥" : "👍";
            return `${fallback} ${label}`;
        };
        const BIRD_SPR_W = 16, BIRD_SPR_H = 16, BIRD_SPR_COLS = 4, BIRD_SPR_FRAME_SEC = .18, BIRD_SPR_ROWS = { move: 0, special: 1, sat: 2 };
        const BIRD_SPR_META = Object.fromEntries(
            Object.entries(animalsCfg.kinds).map(([k, v]) => [k, v.meta || { cols: BIRD_SPR_COLS, rows: 3, sec: BIRD_SPR_FRAME_SEC, sw: 1, sh: 1, bottom: false }])
        );
        const it = { slots: [null, null], active: { coffee: 0, chili: 0, ramen: 0, lunch: 0, energy: 0, bacchus: 0 }, slotT: [null, null] };
        const groundItemColors = { coffee: "#38bdf8", chili: "#ef4444", ramen: "#f59e0b", lunch: "#22c55e", energy: "#a855f7", bacchus: "#0ea5e9", atomic: "#facc15" };
        const keys = new Set(), foods = [], birds = [], fx = [], pickedCards = [], trails = [], groundDrops = []; let last = 0; let birdSeq = 0;
        const atomicFx = {
            active: false,
            phase: "idle",
            t: 0,
            dropSec: ATOMIC_FX_DROP_SEC,
            burstSec: ATOMIC_FX_BURST_SEC,
            x: W * 0.5,
            y: -40,
            startY: -40,
            endY: H * 0.5,
            particleCount: 0,
            waveT: 0,
            waveSec: ATOMIC_FX_WAVE_SEC,
            waveMaxR: 0,
            wavePulse: 0
        };
        const atomicParticles = Array.from({ length: ATOMIC_FX_MAX_PARTICLES }, () => ({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            r: 2,
            c: "#fff7d6"
        }));
        Object.entries(playerSprites).forEach(([, rec]) => loadSpriteWithCandidates(rec, rec.src));
        boomImg.img.src = BOOM_IMAGE_PATH; boomImg.img.onload = () => boomImg.ready = true;
        bossCut1Img.img.src = BOSS_CUT_1_PATH; bossCut1Img.img.onload = () => bossCut1Img.ready = true;
        bossCut2Img.img.src = BOSS_CUT_2_PATH; bossCut2Img.img.onload = () => bossCut2Img.ready = true;
        bgmAudio.loop = true;
        bgmAudio.preload = "auto";
        bgmAudio.volume = readBgmVolume();
        bgmAudio.addEventListener("canplaythrough", () => {
            bgmReady = true;
        });
        bossImpactAudio.loop = false;
        bossImpactAudio.preload = "auto";
        bossBgm1Audio.loop = false;
        bossBgm2Audio.loop = false;
        bossBgm1Audio.preload = "auto";
        bossBgm2Audio.preload = "auto";
        bossBgm1Audio.volume = bgmAudio.volume;
        bossBgm2Audio.volume = bgmAudio.volume;
        bossImpactAudio.volume = bgmAudio.volume;
        bossImpactAudio.addEventListener("ended", () => {
            if (!bossBgmSequenceArmed) return;
            if (bossImpactPlayCount < 2) return;
            playBossBgm1();
        });
        bossBgm1Audio.addEventListener("ended", () => {
            if (!bossBgmSequenceArmed) return;
            playBossBgm2();
        });
        bgImg.img.src = BACKGROUND_IMAGE_PATH; bgImg.img.onload = () => bgImg.ready = true;
        loadSpriteWithCandidates(heartIcon, HEART_ICON_FALLBACKS);
        loadSpriteWithCandidates(thumbIcon, THUMB_ICON_FALLBACKS);
        loadSpriteWithCandidates(spicyZone, [SPICY_SKILL_ZONE_PATH]);
        loadSpriteWithCandidates(spicyBullet, [SPICY_BULLET_PATH]);
        bgmVolumeSliders.forEach((slider, idx) => {
            if (!slider) return;
            const label = bgmVolumeLabels[idx];
            const setFromSlider = () => {
                const v = Number(slider.value) / 100;
                setBgmVolume(v, true, label);
            };
            slider.addEventListener("input", setFromSlider);
            slider.addEventListener("change", setFromSlider);
        });
        syncBgmUi(bgmAudio.volume);
        function stopBossImpact() {
            if (!bossImpactAudio) return;
            bossImpactAudio.pause();
            bossImpactAudio.currentTime = 0;
        }
        function stopBossBgm(resetSequence = true) {
            bossBgm1Audio.pause();
            bossBgm1Audio.currentTime = 0;
            bossBgm2Audio.pause();
            bossBgm2Audio.currentTime = 0;
            if (resetSequence) {
                bossBgmSequenceArmed = false;
                bossImpactPlayCount = 0;
            }
        }
        function playBossBgm1() {
            bossBgm1Audio.currentTime = 0;
            try {
                const p = bossBgm1Audio.play();
                if (p && p.catch) p.catch(() => { });
            } catch (err) {
                console.warn("[boss bgm1] audio play failed", err);
            }
        }
        function playBossBgm2() {
            bossBgm2Audio.currentTime = 0;
            try {
                const p = bossBgm2Audio.play();
                if (p && p.catch) p.catch(() => { });
            } catch (err) {
                console.warn("[boss bgm2] audio play failed", err);
            }
        }
        function startBossAudioSequence() {
            stopBgm();
            stopBossImpact();
            stopBossBgm(false);
            bossBgmSequenceArmed = true;
            bossImpactPlayCount = 1;
            playBossImpact();
        }
        function readBgmVolume() {
            try {
                const raw = localStorage.getItem(BGM_VOLUME_KEY);
                const val = raw === null ? 0.5 : Number(raw);
                return Number.isFinite(val) ? clamp01(val) : 0.5;
            } catch {
                return 0.5;
            }
        }
        function clamp01(v) {
            const n = Number(v);
            if (!Number.isFinite(n)) return 0.5;
            return Math.max(0, Math.min(1, n));
        }
        function syncBgmUi(v) {
            const pct = `${Math.round(clamp01(v) * 100)}%`;
            bgmVolumeSliders.forEach(s => { if (s) s.value = String(Math.round(clamp01(v) * 100)); });
            bgmVolumeLabels.forEach(l => { if (l) l.textContent = pct; });
        }
        function setBgmVolume(v, persist = true, labelEl = null) {
            const vol = clamp01(v);
            bgmAudio.volume = vol;
            bossImpactAudio.volume = vol;
            bossBgm1Audio.volume = vol;
            bossBgm2Audio.volume = vol;
            syncBgmUi(vol);
            if (persist) {
                try { localStorage.setItem(BGM_VOLUME_KEY, String(vol)); } catch { }
            }
            if (labelEl && labelEl.textContent) labelEl.textContent = `${Math.round(vol * 100)}%`;
            return vol;
        }
        function startBgm() {
            if (!bgmAudio) return;
            stopBossImpact();
            stopBossBgm();
            if (!bgmReady) {
                bgmAudio.load();
            }
            try {
                const p = bgmAudio.play();
                if (p && p.catch) p.catch(() => { });
            } catch (err) {
                console.warn("[bgm] play failed", err);
            }
        }
        function stopBgm() {
            if (!bgmAudio) return;
            bgmAudio.pause();
            bgmAudio.currentTime = 0;
        }
        function playBossImpact() {
            if (!bossImpactAudio) return;
            stopBossImpact();
            try {
                const p = bossImpactAudio.play();
                if (p && p.catch) p.catch(() => { });
            } catch (err) {
                console.warn("[boss impact] audio play failed", err);
            }
        }
        const spicySkill = game.spicy;
        const spicyCooldownSec = () => Math.max(1, SPICY_SKILL_COOLDOWN - (Math.max(0, game.lv - 1) / 5));
        const spicyConeScale = () => {
            const t = cl((game.lv - 1) / 19, 0, 1);
            return 4 + t * 6;
        };
        const spicyConeRange = () => ((p.r * 2) * spicyConeScale()) / 3;
        const spicyConeHalfAngle = () => {
            const t = cl((game.lv - 1) / 19, 0, 1);
            const deg = 18 + t * 20;
            return (deg * (Math.PI / 180)) / 3;
        };
        const spicyDamageScale = () => 1 + game.lv / 200;
        const spicyDamageToBird = (b0) => Math.max(1, Math.round((b0.hp * b.dm) * SPICY_SKILL_DAMAGE_RATIO * spicyDamageScale()));
        function setSpicyLastFedBird(b0) { spicySkill.lastFed = { x: b0.x, y: b0.y, at: game.se, id: b0._id }; }
        const spicyConeHit = (x0, y0, z) => {
            const vx = x0 - z.x;
            const vy = y0 - z.y;
            const d = Math.hypot(vx, vy);
            if (d <= z.min || d > z.range) return false;
            const dot = (vx * z.dx + vy * z.dy) / d;
            return dot >= z.cosHalf;
        };
        function spawnSpicyZone() {
            const dm = Math.hypot(p.fx || 0, p.fy || 0) || 1;
            const dx = (p.fx || 1) / dm;
            const dy = (p.fy || 0) / dm;
            const half = spicyConeHalfAngle();
            const range = spicyConeRange();
            const zone = {
                x: p.x,
                y: p.y,
                dx,
                dy,
                min: p.r * 0.3,
                range,
                half,
                cosHalf: Math.cos(half),
                life: SPICY_SKILL_HOLD_SEC,
                dur: SPICY_SKILL_HOLD_SEC,
                nextTick: SPICY_SKILL_TICK_SEC
            };
            spicySkill.zones.push(zone);
        }
        function applySpicyZoneDamage(zone) {
            let hit = 0;
            for (const b0 of birds) {
                if (b0.satDone) continue;
                if (!spicyConeHit(b0.x, b0.y, zone)) continue;
                const dmg = spicyDamageToBird(b0);
                applyFeedSatiety(b0, dmg, b0.x, b0.y, true);
                b0.hitFor = SPICY_SKILL_DAMAGE_FX_SEC;
                if (b0.multiState) startBirdStateAnim(b0, "eat", "walk", BIRD_EAT_MIN_SEC);
                hit++;
            }
            if (hit > 0) {
                const fxX = zone.x + zone.dx * zone.range * 0.55;
                const fxY = zone.y + zone.dy * zone.range * 0.55;
                addFx(fxX, fxY - 12, `+${hit}`, hit, "#ef4444");
            }
        }
        function triggerSpicySkill() {
            spawnSpicyZone();
        }
        function updateSpicySkill(dt) { }
        function updateSpicySkillUi() { if (skillDial) skillDial.style.display = "none"; }
        function stopAtomicFx() {
            atomicFx.active = false;
            atomicFx.phase = "idle";
            atomicFx.t = 0;
            atomicFx.waveT = 0;
            atomicFx.wavePulse = 0;
            for (let i = 0; i < atomicParticles.length; i++) atomicParticles[i].active = false;
        }
        function startAtomicFx() {
            stopAtomicFx();
            atomicFx.active = true;
            atomicFx.phase = "drop";
            atomicFx.t = 0;
            atomicFx.x = W * 0.5;
            atomicFx.y = atomicFx.startY;
            atomicFx.particleCount = Math.floor(R(ATOMIC_FX_MIN_PARTICLES, ATOMIC_FX_MAX_PARTICLES + 1));
        }
        function triggerAtomicBurst() {
            atomicFx.phase = "burst";
            atomicFx.t = 0;
            atomicFx.y = atomicFx.endY;
            const diag = Math.hypot(W, H);
            const baseSpeed = diag / Math.max(0.1, atomicFx.burstSec);
            atomicFx.waveT = 0;
            atomicFx.waveSec = ATOMIC_FX_WAVE_SEC * (0.8 + Math.random() * 0.4);
            atomicFx.waveMaxR = Math.hypot(W, H);
            atomicFx.wavePulse = 1;
            const count = Math.max(1, Math.min(ATOMIC_FX_MAX_PARTICLES, atomicFx.particleCount));
            for (let i = 0; i < count; i++) {
                const p0 = atomicParticles[i];
                const a = R(0, Math.PI * 2);
                const speed = baseSpeed * R(0.6, 1.35);
                p0.active = true;
                p0.x = atomicFx.x;
                p0.y = atomicFx.y;
                p0.vx = Math.cos(a) * speed;
                p0.vy = Math.sin(a) * speed;
                p0.maxLife = atomicFx.burstSec * R(0.75, 1.12);
                p0.life = p0.maxLife;
                p0.r = R(2.1, 4.8);
                p0.c = Math.random() < 0.6 ? "#fffbeb" : "#fde68a";
            }
        }
        function applyAtomicParticleHit(b0) {
            b0.sat = b0.max;
            if (b0.satDone) return;
            awardBirdSatietyThumb(b0, b0.x, b0.y);
            addFx(b0.x, b0.y - b0.r - 12, "♥", 1, "#fda4af");
            b0.satDone = true;
            if (!startFullSatisfyAnim(b0)) startLegacyFullHold(b0);
        }
        function finalizeAtomicFedBirds() {
            for (let i = 0; i < birds.length; i++) {
                const b0 = birds[i];
                if (b0.satDone) continue;
                if (b0.sat < b0.max) continue;
                applyAtomicParticleHit(b0);
            }
        }
        function updateAtomicFx(dt) {
            if (!atomicFx.active) return;
            atomicFx.t += dt;
            if (atomicFx.phase === "drop") {
                const p0 = cl(atomicFx.t / atomicFx.dropSec, 0, 1);
                atomicFx.y = atomicFx.startY + (atomicFx.endY - atomicFx.startY) * p0;
                if (atomicFx.t >= atomicFx.dropSec) triggerAtomicBurst();
                return;
            }
            if (atomicFx.phase !== "burst") return;
            atomicFx.waveT += dt;
            const waveP = cl(atomicFx.waveT / Math.max(0.001, atomicFx.waveSec), 0, 1);
            const waveRadius = atomicFx.waveMaxR * waveP;
            atomicFx.wavePulse = (1 - waveP) * Math.sin(waveP * Math.PI) * 0.7 + 1;
            if (waveP < 0.95 && waveRadius > 0) {
                for (let j = 0; j < birds.length; j++) {
                    const b0 = birds[j];
                    if (b0.satDone) continue;
                    const sp = worldToScreen(b0.x, b0.y);
                    const margin = b0.r * 0.65;
                    if (Math.hypot(sp.x - atomicFx.x, sp.y - atomicFx.y) <= waveRadius + margin) {
                        applyAtomicParticleHit(b0);
                    }
                }
            }
            for (let i = 0; i < atomicParticles.length; i++) {
                const p0 = atomicParticles[i];
                if (!p0.active) continue;
                p0.x += p0.vx * dt;
                p0.y += p0.vy * dt;
                p0.life -= dt;
                if (p0.life <= 0) { p0.active = false; continue; }
                for (let j = 0; j < birds.length; j++) {
                    const b0 = birds[j];
                    if (b0.satDone) continue;
                    const sp = worldToScreen(b0.x, b0.y);
                    const hitR = Math.max(ATOMIC_FX_PARTICLE_HIT_R, b0.r * 0.45, p0.r * 1.4);
                    if (Math.hypot(sp.x - p0.x, sp.y - p0.y) > hitR) continue;
                    applyAtomicParticleHit(b0);
                    p0.active = false;
                    break;
                }
            }
            if (atomicFx.t >= atomicFx.burstSec) {
                finalizeAtomicFedBirds();
                stopAtomicFx();
            }
        }
        function drawAtomicFx() {
            if (!atomicFx.active) return;
            x.save();
            x.setTransform(1, 0, 0, 1, 0, 0);
            const cx = atomicFx.x;
            const cy = atomicFx.y;
            if (atomicFx.phase === "drop") {
                const bob = Math.sin(performance.now() / 100) * 1.5;
                const bx = cx, by = cy + bob;
                x.fillStyle = "#5b422f";
                x.beginPath();
                x.ellipse(bx, by + 11, 14, 17, 0, 0, Math.PI * 2);
                x.fill();
                x.fillStyle = "#7c5a3f";
                x.fillRect(bx - 5, by - 12, 10, 9);
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    const rx = Math.cos(a) * 8;
                    const ry = Math.sin(a) * 10;
                    x.fillStyle = i % 2 ? "#fff7d6" : "#fde68a";
                    x.beginPath();
                    x.arc(bx + rx, by + 8 + ry, 2.2, 0, Math.PI * 2);
                    x.fill();
                }
            }
            if (atomicFx.phase === "burst") {
                const waveP = cl(atomicFx.waveT / Math.max(0.001, atomicFx.waveSec), 0, 1);
                const burstR = atomicFx.waveMaxR * waveP;
                const burstPulse = atomicFx.wavePulse;
                x.globalCompositeOperation = "lighter";
                x.fillStyle = `rgba(255, 236, 164, ${0.26 * (1 - waveP)})`;
                x.beginPath();
                x.arc(cx, cy, burstR * 0.4, 0, Math.PI * 2);
                x.fill();
                x.strokeStyle = `rgba(255, 224, 102, ${0.75 * (1 - waveP)})`;
                x.lineWidth = 8 * burstPulse;
                x.beginPath();
                x.arc(cx, cy, burstR, 0, Math.PI * 2);
                x.stroke();
                x.globalCompositeOperation = "source-over";
            }
            for (let i = 0; i < atomicParticles.length; i++) {
                const p0 = atomicParticles[i];
                if (!p0.active) continue;
                const ttl = cl(p0.life / Math.max(0.001, p0.maxLife), 0, 1);
                const tw = p0.r + (1 - ttl) * 4;
                x.globalAlpha = cl(ttl * 0.9, 0.1, 1);
                x.fillStyle = p0.c;
                x.beginPath();
                x.arc(p0.x, p0.y, tw, 0, Math.PI * 2);
                x.fill();
            }
            x.restore();
        }
        const pigeonImgs = {};
        function loadSpriteWithCandidates(rec, file) {
            if (!file) { rec.ready = false; rec.fail = true; return }
            const files = Array.isArray(file) ? file : [file];
            const cand = [];
            for (const f of files) {
                cand.push(...[`${PIGEON_SPRITE_BASE_PATH}${f}`, ...SPRITE_PATH_CANDIDATES.map(p => `${p}${f}`)]);
            }
            const uniq = [];
            for (const c of cand) {
                const u = withCacheBust(c);
                if (u && !uniq.includes(u)) uniq.push(u);
            }
            rec.try = 0;
            rec.src = uniq[0] || file;
            rec.img.onload = () => { rec.ready = true; rec.fail = false; };
            rec.img.onerror = () => {
                rec.try++;
                if (rec.try < uniq.length) rec.img.src = uniq[rec.try];
                else { rec.ready = false; rec.fail = true; }
            };
            rec.img.src = rec.src;
        }
        function birdSpritePackHasState(kind, state) {
            return !!PIGEON_SPRITE_PACKS[kind]?.[state];
        }
function buildBirdSpritePack(kind) {
            const base = PIGEON_SPRITE_PACKS[kind] || {};
            const pack = { legacy: !base.isMultiState, ready: false };
            if (base.isMultiState) {
                pack.states = {};
                ["walk", "eat", "full"].forEach((state) => {
                    const c = base[state];
                    if (!c?.src) return;
                    const rec = { img: new Image(), ready: false, fail: false, try: 0, src: "", state: state, cols: c.cols, rows: c.rows, frames: c.frames, sec: c.sec, loop: c.loop !== false };
                    loadSpriteWithCandidates(rec, c.src);
                    pack.states[state] = rec;
                });
            } else {
                const f = PIGEON_SPRITES[kind] || "";
                if (f) {
                    const fallback = base.walk || {};
                pack.states = {};
                const rec = { img: new Image(), ready: false, fail: false, try: 0, src: "", cols: fallback.cols || BIRD_SPR_COLS, rows: fallback.rows || 3, frames: fallback.cols || BIRD_SPR_COLS, sec: fallback.sec || BIRD_SPR_FRAME_SEC, loop: true };
                loadSpriteWithCandidates(rec, f);
                pack.states.walk = rec;
            }
        }
            return pack;
        }
        Object.entries(PIGEON_SPRITES).forEach(([k]) => { pigeonImgs[k] = buildBirdSpritePack(k); });
        x.imageSmoothingEnabled = false;
        const R = (a, b) => Math.random() * (b - a) + a, cl = (v, a, b) => Math.max(a, Math.min(b, v));
        const mapW = () => game.mode === "boss" ? W : MW, mapH = () => game.mode === "boss" ? H : MH;
        const viewW = () => W / VIEW_ZOOM, viewH = () => H / VIEW_ZOOM;
        const birdMeta = k => BIRD_SPR_META[k] || { fw: BIRD_SPR_W, fh: BIRD_SPR_H, cols: BIRD_SPR_COLS, rows: 3, sec: BIRD_SPR_FRAME_SEC, sw: 1, sh: 1, bottom: false };
        const thumbGain = (base) => { const r = Math.random(); if (r < 0.05) return base * 3; if (r < 0.25) return base * 2; return base; };
        const stage = () => STAGES[game.si], maxFat = () => 100 * b.fm;
        const fireInt = () => BASE_FIRE / (b.fr * chiliFireMul() * Math.max(1 - game.fat / maxFat(), 0.02));
        const moveSp = () => BASE_MS * b.mv * (it.active.energy > 0 ? 1.5 : 1), hitR = () => 5 * b.hr, aggroR = () => p.r * 2 * AUTO_RANGE * b.ag;
        const spicyProjectileScale = () => BULLET_SCALE_BY_DAMAGE * Math.max(0, b.dm || 1);
        const STAR_BOSS_TARGET = Math.max(1, STAGES[STAGES.length - 1]?.target || 1);
        const ITEM_KR = { coffee: "커피", chili: "청양고추", ramen: "라면", lunch: "도시락", energy: "핫식스", bacchus: "박카스", atomic: "모폭" };
        const ITEM_CARD_BONUS = { coffee: 1.2, chili: 1, ramen: 1, lunch: 1, energy: 1, bacchus: 1 };
        const ITEM_MAX_UI_LV = 5;
        const ITEM_DROP_BASE = 0.01;
        const ITEM_DROP_PER_LV = 0.005;
        const STAGE_LINES = ["밥 왔어요?", "나는 먹기 싫어.", "내 밥 내놔!", "기특하네(하트)", "저...저기...."];
        const itemLevel = (id) => Math.max(0, b.items?.[id] || 0);
        const itemTier = (lv) => lv >= 5 ? 2 : (lv >= 3 ? 1 : 0);
        const itemActiveTier = (id) => itemTier(itemLevel(id));
        const itemEnabled = (id) => itemLevel(id) > 0;
        const itemDropChance = (id) => ITEM_DROP_BASE + ITEM_DROP_PER_LV * itemLevel(id);
        function itemVersionSuffix(id) { return itemTier(itemLevel(id)) === 0 ? "" : (itemTier(itemLevel(id)) === 1 ? "+" : "++"); }
        function itemLabel(itemId) {
            const nm = ITEM_KR[itemId] || itemId;
            return `${nm}${itemVersionSuffix(itemId)}`;
        }
        function unlockedItemPool() {
            return ["coffee", "chili", "ramen", "lunch", "energy", "bacchus"].filter(itemEnabled);
        }
        function popupItemUnlock(itemId, lv) {
            if (!itemId) return;
            if (lv === 1) addFx(p.x, p.y - 38, `${ITEM_KR[itemId]} 해금!`, 1.1, "#38bdf8");
            if (lv === 3) addFx(p.x, p.y - 38, `${ITEM_KR[itemId]}+ 해금!`, 1.1, "#60a5fa");
            if (lv === 5) addFx(p.x, p.y - 38, `${ITEM_KR[itemId]}++ 해금!`, 1.1, "#818cf8");
        }
        function coffeeShotCount() {
            if (!(it.active.coffee > 0)) return 1;
            const lv = itemLevel("coffee");
            if (lv >= 5) return 5;
            if (lv >= 3) return 3;
            return 2;
        }
        function chiliFireMul() {
            if (!(it.active.chili > 0)) return 1;
            const lv = itemLevel("chili");
            if (lv >= 5) return 4;
            if (lv >= 3) return 3;
            return 2;
        }
        function ramenFeedMul() {
            if (!(it.active.ramen > 0)) return 1;
            const lv = itemLevel("ramen");
            if (lv >= 5) return 4;
            if (lv >= 3) return 3;
            return 2;
        }
        function lunchSizeMul() {
            if (!(it.active.lunch > 0)) return 1;
            const lv = itemLevel("lunch");
            if (lv >= 5) return 2.5;
            if (lv >= 3) return 2;
            return 1.5;
        }
        function bacchusPierce() {
            if (!(it.active.bacchus > 0)) return 0;
            const lv = itemLevel("bacchus");
            if (lv >= 5) return 4;
            if (lv >= 3) return 2;
            return 1;
        }
        function energyTrailLife() {
            if (!(it.active.energy > 0)) return 0;
            const lv = itemLevel("energy");
            if (lv >= 5) return 5;
            if (lv >= 3) return 3;
            return 0;
        }
        function applyFeedSatiety(b0, baseGain, wx = b0.x, wy = b0.y, allowCrit = true) {
            let gain = baseGain * ramenFeedMul();
            let crit = false;
            if (allowCrit && b.crit > 0 && Math.random() < b.crit) { gain *= 2; crit = true; }
            b0.sat = cl(b0.sat + gain, 0, b0.max);
            if (crit) addFx(wx, wy - b0.r - 12, "CRIT x2", 1.1, "#f43f5e");
            if (b0.sat >= b0.max && !b0.satDone) {
                awardBirdSatietyThumb(b0, b0.x, b0.y);
                b0.satDone = true;
                if (!startFullSatisfyAnim(b0)) startLegacyFullHold(b0);
            }
            return gain;
        }
        const CARD_POOL = [
            { id: "coffee_A", item: "coffee", top: "커피(A)", mid: "커피 +1", sub: "공속 +5% / 공격력 +5%", mods: { fr: 1.05, dm: 1.05 } },
            { id: "coffee_AS", item: "coffee", top: "커피(AS)", mid: "커피 +1", sub: "공속 +5% / 이속 +5%", mods: { fr: 1.05, mv: 1.05 } },
            { id: "coffee_S", item: "coffee", top: "커피(S)", mid: "커피 +1", sub: "공속 +5% / 사거리 +5%", mods: { fr: 1.05, ag: 1.05 } },
            { id: "chili_A", item: "chili", top: "청양고추(A)", mid: "청양고추 +1", sub: "공속 +8% / 공격력 +5%", mods: { fr: 1.08, dm: 1.05 } },
            { id: "chili_AS", item: "chili", top: "청양고추(AS)", mid: "청양고추 +1", sub: "공속 +8% / 이속 +5%", mods: { fr: 1.08, mv: 1.05 } },
            { id: "chili_S", item: "chili", top: "청양고추(S)", mid: "청양고추 +1", sub: "공속 +8% / 사거리 +5%", mods: { fr: 1.08, ag: 1.05 } },
            { id: "ramen_A", item: "ramen", top: "라면(A)", mid: "라면 +1", sub: "공격력 +8% / 공속 +5%", mods: { dm: 1.08, fr: 1.05 } },
            { id: "ramen_AS", item: "ramen", top: "라면(AS)", mid: "라면 +1", sub: "공격력 +8% / 이속 +5%", mods: { dm: 1.08, mv: 1.05 } },
            { id: "ramen_S", item: "ramen", top: "라면(S)", mid: "라면 +1", sub: "공격력 +8% / 사거리 +5%", mods: { dm: 1.08, ag: 1.05 } },
            { id: "lunch_A", item: "lunch", top: "도시락(A)", mid: "도시락 +1", sub: "모이크기 +8% / 공격력 +3%", mods: { hr: 1.08, dm: 1.03 } },
            { id: "lunch_AS", item: "lunch", top: "도시락(AS)", mid: "도시락 +1", sub: "모이크기 +8% / 공속 +5%", mods: { hr: 1.08, fr: 1.05 } },
            { id: "lunch_S", item: "lunch", top: "도시락(S)", mid: "도시락 +1", sub: "모이크기 +8% / 이속 +5%", mods: { hr: 1.08, mv: 1.05 } },
            { id: "energy_A", item: "energy", top: "핫식스(A)", mid: "핫식스 +1", sub: "이속 +10% / 공격력 +5%", mods: { mv: 1.10, dm: 1.05 } },
            { id: "energy_AS", item: "energy", top: "핫식스(AS)", mid: "핫식스 +1", sub: "이속 +10% / 공속 +5%", mods: { mv: 1.10, fr: 1.05 } },
            { id: "energy_S", item: "energy", top: "핫식스(S)", mid: "핫식스 +1", sub: "이속 +10% / 사거리 +5%", mods: { mv: 1.10, ag: 1.05 } },
            { id: "bacchus_A", item: "bacchus", top: "박카스(A)", mid: "박카스 +1", sub: "사거리 +10% / 공격력 +5%", mods: { ag: 1.10, dm: 1.05 } },
            { id: "bacchus_AS", item: "bacchus", top: "박카스(AS)", mid: "박카스 +1", sub: "사거리 +10% / 공속 +5%", mods: { ag: 1.10, fr: 1.05 } },
            { id: "bacchus_S", item: "bacchus", top: "박카스(S)", mid: "박카스 +1", sub: "사거리 +10% / 이속 +5%", mods: { ag: 1.10, mv: 1.05 } }
        ];
        function pickLevelCards() {
            const byItem = {};
            for (const c0 of CARD_POOL) {
                if (itemLevel(c0.item) >= ITEM_MAX_UI_LV) continue;
                if (!byItem[c0.item]) byItem[c0.item] = [];
                byItem[c0.item].push(c0);
            }
            const items = Object.keys(byItem);
            const pickItems = [];
            while (pickItems.length < 3 && items.length) {
                const total = items.reduce((s, id) => s + (ITEM_CARD_BONUS[id] || 1), 0);
                let r = Math.random() * total;
                let chosen = items[0];
                for (const id of items) { r -= (ITEM_CARD_BONUS[id] || 1); if (r <= 0) { chosen = id; break; } }
                pickItems.push(chosen);
                const idx = items.indexOf(chosen);
                if (idx >= 0) items.splice(idx, 1);
            }
            const out = [];
            for (const item of pickItems) {
                const arr = byItem[item];
                out.push(arr[Math.floor(R(0, arr.length))]);
            }
            return out;
        }
        const calcStars = (thumb) => cl((Math.max(0, thumb) / STAR_BOSS_TARGET) * 4, 0, 5);
        const starComment = (score) => {
            const n = Math.floor(score);
            if (n >= 5) return "신의 손맛 🌟🌟🌟🌟🌟";
            if (n >= 4) return "미슐랭 맛집 🌟🌟🌟🌟";
            if (n === 3) return "맛집 인정! 🌟🌟🌟";
            if (n === 2) return "꽤 맛있었나봐요 🌟🌟";
            if (n === 1) return "그냥 그랬나봐요 🌟";
            return "아직 배가 덜 찼어요";
        };
        function updateStarsFx() {
            const score = calcStars(game.thumb);
            const nextLv = Math.floor(score);
            if (nextLv <= game.starLv) {
                game.stars = score;
                return;
            }
            for (let i = game.starLv + 1; i <= nextLv; i++) {
                addFx(p.x + R(-26, 26), p.y - p.r - 28, `★ ${i}성!`, 1.2, "#fde047");
            }
            game.starLv = nextLv;
            game.stars = score;
        }
        function settleHearts() { const g = Math.floor(game.thumb * 0.01); game.hearts += g; return g; }
        function goTitleWithReward(prefix = "") {
            const g = settleHearts();
            const score = calcStars(game.thumb);
            game.stars = score;
            game.starLv = Math.floor(score);
            game.mode = "title";
            titleOv.hidden = false;
            shopOv.hidden = true;
            const pct = cl(score / 5, 0, 1) * 100;
            titleResult.innerHTML = `${prefix ? `${prefix}<br>` : ""}평점 ${score.toFixed(2)} / 5.00<br><span style="position:relative;display:inline-block;font-size:24px;line-height:1;letter-spacing:2px"><span style="color:#94a3b8">★★★★★</span><span style="position:absolute;left:0;top:0;width:${pct}%;overflow:hidden;white-space:nowrap;color:#facc15">★★★★★</span></span><br>${starComment(score)}<br>${iconHtml("heart", `+${g} (total ${game.hearts})`)}`;
        }
        function refreshShopUi() {
            shopHeart.innerHTML = `${iconHtml("heart", `${game.hearts}`)}`;
            buySaltyBtn.disabled = game.shop.salty || game.hearts < 200;
            buySweetBtn.disabled = game.shop.sweet || game.hearts < 200;
            buySaltyBtn.textContent = game.shop.salty ? "?占쏙옙 吏좊쭧 紐⑥씠 (援щℓ?占쎈즺)" : "?占쏙옙 吏좊쭧 紐⑥씠 (200?占쏙툘)";
            buySweetBtn.textContent = game.shop.sweet ? "?占쏙옙 ?占쎈쭧 紐⑥씠 (援щℓ?占쎈즺)" : "?占쏙옙 ?占쎈쭧 紐⑥씠 (200?占쏙툘)";
        }
        function setupStage(i) {
            game.si = i;
            game.se = 0;
            game.spawn = {};
            foods.length = 0;
            birds.length = 0;
            fx.length = 0;
            trails.length = 0;
            groundDrops.length = 0;
            game.boss = null;
            spicySkill.zones.length = 0;
            const sp = { ...(stage().sp || {}) };
            if (i === 1) {
                if (sp.adhd != null) sp.adhd = Math.round(sp.adhd * 2);
                if (sp.dull != null) sp.dull = Math.max(0, Math.round(sp.dull * 0.5));
            }
            if (i === 4 && sp.shy != null) sp.shy = Math.round(sp.shy * 1.2);
            Object.entries(sp).forEach(([k, n]) => game.spawn[k] = { n, s: 0, next: 0, intv: stage().t / Math.max(1, n) })
        }
        function resetRun() {
            stopBossImpact();
            stopBossBgm();
            game.mode = "playing";
            game.thumb = 0;
            game.stars = 0;
            game.starLv = 0;
            game.trailCd = 0;
            game.lv = 1;
            game.fat = 0;
            game.fireCd = 0;
            game.atomic = 0;
            game.boomT = 0;
            stopAtomicFx();
            game.msgCb = null;
            game.msgAt = 0;
            game.evoAt = 0;
            game.boss = null;
            game.bossIntro = null;
            game.shake = 0;
            game.spicy.cdLeft = spicyCooldownSec();
            game.spicy.lastFed = null;
            game.spicy.zones.length = 0;
            pickedCards.length = 0;
            b.fr = b.dm = b.sm = b.ag = b.mv = b.fm = b.hr = b.dr = 1;
            b.crit = 0;
            b.items = { coffee: 3, chili: 0, ramen: 0, lunch: 0, energy: 0, bacchus: 0 };
            b.coffeeDurBonus = 1.5;
            b.bossThumbBonus = 0;
            it.slots = [null, null];
            it.active = { coffee: 0, chili: 0, ramen: 0, lunch: 0, energy: 0, bacchus: 0 };
            it.slotT = [null, null];
            p.x = MW / 2;
            p.y = MH / 2;
            p.fx = 1;
            p.fy = 0;
            p.stun = 0;
            ps.frame = 0;
            ps.t = 0;
            ps.face = "down";
            ps.state = "idle";
            ps.lock = 0;
            ps.row = 0;
            ps.flip = false;
            ps.atkFace = "right";
            ps.anim = "idle";
            setupStage(0);
            showMsg(STAGE_LINES[0], 1.2, () => { game.mode = "playing"; });
            titleOv.hidden = true;
            charOv.hidden = true;
            shopOv.hidden = true;
            levelOv.hidden = true;
            evoOv.hidden = true;
            msgOv.hidden = true;
            statsOv.hidden = true;
            titleResult.textContent = "";
        }
        function edgePos() { const pad = 18, s = Math.floor(R(0, 8)); if (s === 0) return { x: R(pad, MW - pad), y: pad }; if (s === 1) return { x: MW - pad, y: pad }; if (s === 2) return { x: MW - pad, y: R(pad, MH - pad) }; if (s === 3) return { x: MW - pad, y: MH - pad }; if (s === 4) return { x: R(pad, MW - pad), y: MH - pad }; if (s === 5) return { x: pad, y: MH - pad }; if (s === 6) return { x: pad, y: R(pad, MH - pad) }; return { x: pad, y: pad } }
        function nearPos() { const a = R(0, Math.PI * 2), d = R(220, 380); return { x: cl(p.x + Math.cos(a) * d, 24, MW - 24), y: cl(p.y + Math.sin(a) * d, 24, MH - 24) } }
        function adhdTurn(b0) {
            // Force a big angle change so the ADHD pigeon snaps direction hard.
            const prev = Math.atan2(b0.dy || 0, b0.dx || 1);
            let a = prev, tries = 0;
            while (tries < 8) {
                a = R(0, Math.PI * 2);
                let diff = Math.abs(a - prev);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff >= Math.PI * .6) break;
                tries++;
            }
            b0.dx = Math.cos(a);
            b0.dy = Math.sin(a);
            b0.turn = R(.28, .65);
        }
        function startBirdStateAnim(b0, state, returnState = null, minHoldSec = 0) {
            const pack = pigeonImgs[b0.k];
            if (!pack?.states?.[state]) return false;
            const s = pack.states[state];

            if (b0.multiState && b0.animState === state && b0.animReturn === returnState && (b0.animMinHold || 0) > (b0.animElapsed || 0)) {
                return false;
            }

            b0.multiState = true;
            b0.animState = state;
            b0.animFrame = 0;
            b0.animTime = 0;
            b0.animElapsed = 0;
            b0.animMinHold = Math.max(0, minHoldSec);
            b0.animCols = Math.max(1, s.cols || 1);
            b0.animRows = Math.max(1, s.rows || 1);
            b0.animSec = Math.max(0.0001, s.sec || BIRD_SPR_FRAME_SEC);
            b0.animFrames = Math.max(1, s.frames || b0.animCols * b0.animRows);
            b0.animLoop = s.loop !== false;
            b0.animReturn = returnState;
            return true;
        }
        function mkBird(k) {
            const cfg = animalsCfg.kinds[k] || {};
            const m = birdMeta(k);
            const nearChance = (game.si === 0 && game.se < 10) ? 1 : (birds.length < 25 ? .75 : .45);
            const q = Math.random() < nearChance ? nearPos() : edgePos();
            const a = R(0, Math.PI * 2);
            const o = {
                _id: birdSeq++,
                k,
                x: q.x, y: q.y,
                sat: 0, max: 100,
                reward: cfg.reward ?? 1,
                born: game.se,
                r: (cfg.radius ?? 12) * BIRD_SCALE,
                sp: cfg.speed ?? (2.5 * 35),
                hp: cfg.hp ?? 20,
                dx: Math.cos(a), dy: Math.sin(a),
                turn: R(1, 2),
                ds: "idle", dt: R(1, 2), escape: false, limit: cfg.escapeLimit ?? 8, hitCd: 0, avx: 0, flip: false, af: 0, at: 0, hitFor: 0, satFor: 0, satDone: false,
                acols: m.cols, asec: m.sec,
                multiState: birdSpritePackHasState(k, "walk") || false,
                animState: null, animFrame: 0, animTime: 0, animCols: m.cols, animRows: m.rows, animFrames: 1, animSec: m.sec, animLoop: true, animReturn: null
            };
            if (o.multiState) startBirdStateAnim(o, "walk", null);
            if (k === "adhd") { o.turn = R(.16, .36); o.sp *= 1.55; }
            if (k === "shy") o.limit = R(3, 10);
            birds.push(o);
        }
        function updateSpawn() { Object.entries(game.spawn).forEach(([k, s]) => { while (s.s < s.n && game.se >= s.next) { mkBird(k); s.s++; s.next += s.intv } }) }
        function triggerHitAnim() {
            if (ps.state === "hit") { ps.lock = Math.max(ps.lock, PLAYER_HIT_MIN_HOLD_SEC); return; }
            ps.state = "hit";
            ps.anim = "hit";
            ps.lock = Math.max(PLAYER_HIT_HOLD_SEC, PLAYER_HIT_MIN_HOLD_SEC);
            ps.frame = 0;
            ps.t = 0;
            ps.row = 0;
        }
        function triggerAttackAnim() {
            if (ps.state === "hit") return;
            ps.state = "atk";
            ps.anim = "atk";
            ps.lock = .2;
            ps.frame = 0;
            ps.t = 0;
            ps.row = ps.atkFace === "left" ? 1 : 0;
        }
        function faceFromVec(vx, vy) { if (Math.abs(vx) >= Math.abs(vy)) return vx < 0 ? "left" : "right"; return vy < 0 ? "up" : "down" }
        function updatePlayerAnim(dt, mx, my) {
            if (mx || my) ps.face = faceFromVec(mx, my); else ps.face = faceFromVec(p.fx, p.fy);
            const isAtk = ps.state === "atk";
            const isHit = ps.state === "hit";
            let next = isHit ? "hit" : isAtk ? "atk" : (mx || my ? "walk" : "idle");
            if (ps.anim !== next) { ps.anim = next; ps.frame = 0; ps.t = 0; }

            if (isHit) {
                ps.row = 0;
            } else if (ps.state === "atk") {
                ps.row = ps.atkFace === "left" ? 1 : 0;
            } else if (ps.state === "walk") {
                ps.row = 0;
            } else {
                ps.row = ps.face === "left" ? 1 : 0;
            }
            ps.flip = false;

            const rec = playerSprites[ps.anim] || playerSprites.idle;
            const maxFrame = Math.max(1, rec?.frames || PLAYER_SPR_FRAMES.idle);
            ps.t += dt;
            while (ps.t >= SPR_FRAME_SEC) {
                ps.t -= SPR_FRAME_SEC;
                ps.frame = (ps.frame + 1) % maxFrame;
            }

            if (ps.lock > 0) {
                ps.lock = Math.max(0, ps.lock - dt);
                if (ps.lock <= 0) {
                    ps.state = mx || my ? "walk" : "idle";
                    ps.anim = ps.state;
                    ps.frame = 0;
                    ps.t = 0;
                    ps.row = ps.anim === "walk" ? 0 : (ps.face === "left" ? 1 : 0);
                }
            }
        }
        function shoot(dx, dy) {
            const m = Math.hypot(dx, dy) || 1, nx = dx / m, ny = dy / m;
            p.fx = nx;
            p.fy = ny;
            ps.face = faceFromVec(nx, ny);
            ps.atkFace = dx < 0 ? "left" : "right";
            triggerAttackAnim();
            const s = spicyProjectileScale();
            const sizeMul = lunchSizeMul();
            const rr = hitR() * s * sizeMul;
            const pierce = bacchusPierce();
            const spawnFood = (vx, vy) => {
                foods.push({ x: p.x + vx * (p.r + 6), y: p.y + vy * (p.r + 6), vx: vx * 360, vy: vy * 360, r: rr, life: 1.6, scale: s, hitIds: {}, pierceLeft: pierce });
            };
            if (it.active.coffee > 0) {
                const a = Math.atan2(ny, nx);
                const spread = Math.PI / 4;
                const n = coffeeShotCount();
                const d0 = n === 2 ? [a, a + spread] : (n === 3 ? [a, a - spread, a + spread] : [a, a - spread, a + spread, a - Math.PI * 0.5, a + Math.PI * 0.5]);
                for (const ang of d0) spawnFood(Math.cos(ang), Math.sin(ang));
                return;
            }
            spawnFood(nx, ny);
        }
        function target() { if (game.mode === "boss" && game.boss && !game.boss.done) return game.boss; const md = p.r + aggroR(); let t = null, td = 1e9; for (const b0 of birds) { const d = Math.hypot(b0.x - p.x, b0.y - p.y); if (d <= md && d < td) { t = b0; td = d } } return t }
        function updatePlayer(dt) {
            if (p.stun > 0) { p.stun = Math.max(0, p.stun - dt); updatePlayerAnim(dt, 0, 0); return; }
            let mx = 0, my = 0;
            if (keys.has("arrowleft") || keys.has("a")) mx--;
            if (keys.has("arrowright") || keys.has("d")) mx++;
            if (keys.has("arrowup") || keys.has("w")) my--;
            if (keys.has("arrowdown") || keys.has("s")) my++;
            if (mx || my) {
                const m = Math.hypot(mx, my);
                mx /= m;
                my /= m;
                p.fx = mx;
                p.fy = my;
            }
            const bw = mapW(), bh = mapH();
            p.x = cl(p.x + mx * moveSp() * dt, p.r, bw - p.r);
            p.y = cl(p.y + my * moveSp() * dt, p.r, bh - p.r);
            if ((mx || my) && energyTrailLife() > 0) {
                game.trailCd -= dt;
                if (game.trailCd <= 0) {
                    const life = energyTrailLife();
                    trails.push({ x: p.x, y: p.y, r: p.r * 0.8, life, maxLife: life });
                    game.trailCd = 0.12;
                }
            } else {
                game.trailCd = Math.max(0, game.trailCd - dt);
            }
            updatePlayerAnim(dt, mx, my);
        }
        function updateBirds(dt) {
            for (let i = birds.length - 1; i >= 0; i--) {
                const b0 = birds[i];
                const tx = p.x - b0.x, ty = p.y - b0.y, d = Math.hypot(tx, ty) || 1;
                const px = b0.x, py = b0.y;
                if (b0.satDone) {
                    b0.satFor -= dt;
                    if (b0.satFor <= 0) {
                        killBird(b0, true);
                        birds.splice(i, 1);
                        continue;
                    }
                }
                b0.hitCd = Math.max(0, (b0.hitCd || 0) - dt);
                b0.hitFor = Math.max(0, (b0.hitFor || 0) - dt);
                b0.trailCd = Math.max(0, (b0.trailCd || 0) - dt);
                if (!b0.satDone) {
                    if (b0.k === "dull" || b0.k === "mom") {
                        b0.x += (tx / d) * b0.sp * dt;
                        b0.y += (ty / d) * b0.sp * dt;
                    } else if (b0.k === "adhd") {
                        b0.turn -= dt;
                        if (b0.turn <= 0) adhdTurn(b0);
                        b0.x += b0.dx * b0.sp * dt;
                        b0.y += b0.dy * b0.sp * dt;
                    } else if (b0.k === "picky") {
                        b0.x += ((b0.x - p.x) / d) * b0.sp * dt;
                        b0.y += ((b0.y - p.y) / d) * b0.sp * dt;
                    } else if (b0.k === "rude") {
                        if (b0.ds === "idle") {
                            b0.dt -= dt;
                            if (b0.dt <= 0) {
                                b0.ds = "wind";
                                b0.dt = .5;
                            }
                        } else if (b0.ds === "wind") {
                            b0.dt -= dt;
                            if (b0.dt <= 0) {
                                b0.ddx = tx / d;
                                b0.ddy = ty / d;
                                b0.ds = "dash";
                                b0.df = .48;
                            }
                        }
                        if (b0.ds === "dash") {
                            b0.x += b0.ddx * b0.sp * 3.8 * dt;
                            b0.y += b0.ddy * b0.sp * 3.8 * dt;
                            b0.df -= dt;
                            if (b0.df <= 0) {
                                b0.ds = "idle";
                                b0.dt = R(1, 2);
                            }
                        } else if (b0.ds === "idle") {
                            b0.x += (tx / d) * b0.sp * dt;
                            b0.y += (ty / d) * b0.sp * dt;
                        }
                    } else if (b0.k === "shy") {
                        const age = game.se - b0.born;
                        if (age > b0.limit && b0.sat < b0.max) {
                            birds.splice(i, 1);
                            continue;
                        } else {
                            const des = 180, rad = d > des + 24 ? 1 : (d < des - 24 ? -1 : 0), ox = -ty / d, oy = tx / d;
                            const closeMul = 1 + cl((220 - d) / 220, 0, 1) * 2;
                            b0.x += ((tx / d) * rad + ox * .9) * b0.sp * closeMul * dt;
                            b0.y += ((ty / d) * rad + oy * .9) * b0.sp * closeMul * dt;
                        }
                    }
                    if (b0.k === "rude" && d <= p.r + b0.r && b0.hitCd <= 0) {
                        game.fat = cl(game.fat + 5, 0, maxFat());
                        triggerHitAnim();
                        b0.hitCd = .35;
                    }
                    if (b0.k === "dull" && d <= p.r + b0.r && b0.hitCd <= 0) {
                        game.fat = cl(game.fat + 3, 0, maxFat());
                        b0.hitCd = .35;
                        if (b0.multiState && b0.animState !== "eat") startBirdStateAnim(b0, "eat", "walk", BIRD_EAT_MIN_SEC);
                    }
                    b0.x = cl(b0.x, b0.r, MW - b0.r);
                    b0.y = cl(b0.y, b0.r, MH - b0.r);
                }
                b0.avx = b0.x - px;
                if (Math.abs(b0.avx) > 0.18) b0.flip = b0.avx < 0;
                if (b0.multiState) {
                    b0.animTime += dt;
                    b0.animElapsed = (b0.animElapsed || 0) + dt;
                    while (b0.animTime >= b0.animSec) {
                        b0.animTime -= b0.animSec;
                        b0.animFrame = (b0.animFrame + 1);
                        if (b0.animFrame < b0.animFrames) continue;
                        if (b0.animLoop) {
                            b0.animFrame = 0;
                        } else {
                            b0.animFrame = b0.animFrames - 1;
                            const next = b0.animReturn;
                            const hold = b0.animMinHold || 0;
                            if (!next || (b0.animElapsed || 0) >= hold) {
                                if (next) {
                                    b0.animReturn = null;
                                    startBirdStateAnim(b0, next);
                                }
                            }
                        }
                    }
                } else {
                    b0.at += dt;
                    const sec = b0.asec || BIRD_SPR_FRAME_SEC, cols = b0.acols || BIRD_SPR_COLS;
                    while (b0.at >= sec) {
                        b0.at -= sec;
                        b0.af = (b0.af + 1) % cols;
                    }
                }
            }
        }
        function startBossIntro() {
            game.bossIntro = { phase: 1, t: 0 };
            spicySkill.zones.length = 0;
            birds.length = 0;
            foods.length = 0;
            fx.length = 0;
            trails.length = 0;
            groundDrops.length = 0;
            game.se = 0;
            game.mode = "boss_intro";
            startBossAudioSequence();
        }
        function startBoss() {
            game.bossIntro = null;
            const bc = animalsCfg.kinds.boss || {};
            birds.length = 0;
            foods.length = 0;
            fx.length = 0;
            trails.length = 0;
            groundDrops.length = 0;
            spicySkill.zones.length = 0;
            game.se = 0;
            game.mode = "boss";
            p.x = cl(p.x, p.r, W - p.r);
            p.y = cl(p.y, p.r, H - p.r);
            const d = DIRS[Math.floor(R(0, DIRS.length))];
            game.boss = {
                x: W * .5, y: H * .35, r: (bc.radius ?? 36) * BIRD_SCALE, sp: bc.speed ?? (3 * 35), hp: bc.hp ?? 50000, sat: 0, dx: Math.cos(R(0, Math.PI * 2)), dy: Math.sin(R(0, Math.PI * 2)),
                turnAt: 1, dashS: "idle", dashAt: 2.5, dashFor: 0, teleAt: 1.5, teleS: "idle", teleFor: 0, jumpAt: R(10, 15),
                jumpS: "idle", jumpFor: 0, invulAt: 10, invulFor: 0, invul: false, dir: d, dirBlink: false, dirBlinkAt: 1.25, dirSwapAt: 1.5, blink: false, clearS: "none", clearAt: 0, spray: 0, done: false, af: 0, at: 0, flip: false, avx: 0, nextDropSat: (bc.hp ?? 50000) * 0.02
            };
        }
        function updateBoss(dt) {
            const bo = game.boss;
            if (!bo || bo.done) return;
            if (bo.clearS !== "none") {
                bo.clearAt -= dt;
                if (bo.clearS === "bounce" && bo.clearAt <= 0) {
                    bo.clearS = "spray";
                    bo.clearAt = 1.5;
                    bo.spray = 0;
                } else if (bo.clearS === "spray") {
                    bo.spray += dt;
                    while (bo.spray > .015) {
                        bo.spray -= .015;
                        addFx(cam.x + R(20, W - 20), cam.y + R(40, H - 20), "!");
                    }
                    if (bo.clearAt <= 0) {
                        bo.done = true;
                        game.thumb = Math.floor(game.thumb * (1.2 + (b.bossThumbBonus || 0)));
                        showMsg("Boss Wave Cleared! +" + game.thumb + " thumbs", 3, () => {
                            goTitleWithReward("Boss cleared");
                        });
                    }
                }
                return;
            }

            game.se += dt;
            if (game.se >= BOSS_TIME && bo.sat < bo.hp) {
                showMsg("Boss failed. Time over. Keep trying.", 2, () => { goTitleWithReward(); });
                return;
            }

            bo.dirBlinkAt -= dt;
            bo.dirSwapAt -= dt;
            bo.dirBlink = bo.dirBlinkAt <= 0;
            if (bo.dirSwapAt <= 0) {
                bo.dir = DIRS[Math.floor(R(0, DIRS.length))];
                bo.dirSwapAt = 1.5;
                bo.dirBlinkAt = 1.25;
                bo.dirBlink = false;
            }

            bo.turnAt -= dt;
            if (bo.turnAt <= 0) {
                const ax = bo.x - p.x;
                const ay = bo.y - p.y;
                const ad = Math.hypot(ax, ay) || 1;
                bo.dx = (ax / ad) + R(-.5, .5);
                bo.dy = (ay / ad) + R(-.5, .5);
                const dm = Math.hypot(bo.dx, bo.dy) || 1;
                bo.dx /= dm;
                bo.dy /= dm;
                bo.turnAt = 2;
            }

            bo.dashAt -= dt;
            if (bo.dashS === "idle" && bo.dashAt <= 0) {
                bo.dashS = "wind";
                bo.dashAt = .25;
            } else if (bo.dashS === "wind" && bo.dashAt <= 0) {
                const tx = p.x - bo.x;
                const ty = p.y - bo.y;
                const d = Math.hypot(tx, ty) || 1;
                bo.ddx = tx / d;
                bo.ddy = ty / d;
                bo.dashS = "dash";
                bo.dashFor = .16;
            }

            if (bo.dashS === "dash") {
                bo.x += bo.ddx * bo.sp * 4 * dt;
                bo.y += bo.ddy * bo.sp * 4 * dt;
                bo.dashFor -= dt;
                if (bo.dashFor <= 0) {
                    bo.dashS = "idle";
                    bo.dashAt = 2.5;
                }
            } else if (bo.dashS === "idle") {
                bo.x += bo.dx * bo.sp * dt;
                bo.y += bo.dy * bo.sp * dt;
            }

            const bw = mapW(), bh = mapH();
            if (bo.sat >= bo.hp * .5) {
                bo.teleAt -= dt;
                if (bo.teleS === "idle" && bo.teleAt <= 0) {
                    bo.teleS = "blink";
                    bo.teleFor = .25;
                    bo.blink = true;
                } else if (bo.teleS === "blink") {
                    bo.teleFor -= dt;
                    if (bo.teleFor <= 0) {
                        bo.x = R(80, bw - 80);
                        bo.y = R(80, bh - 80);
                        bo.teleS = "freeze";
                        bo.teleFor = .25;
                        bo.blink = false;
                    }
                } else if (bo.teleS === "freeze") {
                    bo.teleFor -= dt;
                    if (bo.teleFor <= 0) {
                        bo.teleS = "idle";
                        bo.teleAt = 1.5;
                    }
                }
            }

            const phase2 = bo.sat >= bo.hp * .5;
            if (!phase2) {
                if (bo.jumpS === "idle") {
                    bo.jumpAt -= dt;
                    if (bo.jumpAt <= 0) {
                        bo.jumpS = "prep";
                        bo.jumpFor = .35;
                        bo.blink = true;
                    }
                } else if (bo.jumpS === "prep") {
                    bo.jumpFor -= dt;
                    if (bo.jumpFor <= 0) {
                        let nx = bo.x, ny = bo.y;
                        for (let k = 0; k < 8; k++) {
                            nx = R(80, bw - 80);
                            ny = R(80, bh - 80);
                            if (Math.hypot(nx - bo.x, ny - bo.y) > 70) break;
                        }
                        bo.x = nx;
                        bo.y = ny;
                        bo.jumpS = "recover";
                        bo.jumpFor = .35;
                        bo.blink = false;
                        game.shake = .55;
                        p.stun = Math.max(p.stun, .95);
                    }
                } else if (bo.jumpS === "recover") {
                    bo.jumpFor -= dt;
                    if (bo.jumpFor <= 0) {
                        bo.jumpS = "idle";
                        bo.jumpAt = R(10, 15);
                    }
                }
            } else {
                bo.jumpS = "idle";
                bo.jumpFor = 0;
                bo.blink = false;
                bo.invulAt -= dt;
                if (!bo.invul && bo.invulAt <= 0) {
                    bo.invul = true;
                    bo.invulFor = 1;
                    bo.invulAt = 10;
                } else if (bo.invul) {
                    bo.invulFor -= dt;
                    if (bo.invulFor <= 0) bo.invul = false;
                }
            }

            bo.avx = bo.dx;
            bo.at += dt;
            while (bo.at >= BIRD_SPR_FRAME_SEC) {
                bo.at -= BIRD_SPR_FRAME_SEC;
                bo.af = (bo.af + 1) % BIRD_SPR_COLS;
            }
            if (Math.abs(bo.avx) > 0.18) bo.flip = bo.avx < 0;
            bo.x = cl(bo.x, bo.r, bw - bo.r);
            bo.y = cl(bo.y, bo.r, bh - bo.r);
        }
        function updateFire(dt) { game.fireCd -= dt; if (game.fireCd <= 0) { const t = target(); if (t) { shoot(t.x - p.x, t.y - p.y); game.fireCd = fireInt() } } }
        function updateFoods(dt) { for (let i = foods.length - 1; i >= 0; i--) { const f = foods[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; if (f.life <= 0 || f.x < -20 || f.y < -20 || f.x > MW + 20 || f.y > MH + 20) foods.splice(i, 1) } }
        function addGroundDrop(itemId, x0, y0) {
            groundDrops.push({ id: itemId, x: x0, y: y0, r: 13, bob: R(0, Math.PI * 2) });
        }
        function tryCollectGroundDrops() {
            for (let i = groundDrops.length - 1; i >= 0; i--) {
                const d0 = groundDrops[i];
                if (Math.hypot(d0.x - p.x, d0.y - p.y) > p.r + d0.r + 2) continue;
                activateItem(d0.id, d0.x, d0.y);
                groundDrops.splice(i, 1);
            }
        }
        function tryDrop(dropX = p.x, dropY = p.y) {
            if (game.mode !== "playing") return;
            const m = stage().drop || 1;
            const dropMul = Math.max(0, b.dr || 1);
            const pool = unlockedItemPool().sort(() => Math.random() - 0.5);
            if (!pool.length) return;
            for (const id of pool) {
                if (Math.random() < Math.min(1, itemDropChance(id) * m * dropMul)) { addGroundDrop(id, dropX + R(-18, 18), dropY + R(-18, 18)); return; }
            }
        }
        const DEV_ITEMS = ["coffee", "chili", "ramen", "lunch", "energy", "bacchus", "atomic"];
        function grantItemToSlot(itemId = "atomic") {
            const idx = DEV_ITEMS.indexOf(itemId);
            if (idx < 0) return false;
            activateItem(itemId, p.x, p.y);
            return true;
        }
        function grantRandomItem() { return grantItemToSlot(DEV_ITEMS[Math.floor(R(0, DEV_ITEMS.length))]); }
        function tryDropBossHit(dropX = p.x, dropY = p.y) {
            const pool = unlockedItemPool().sort(() => Math.random() - 0.5);
            if (!pool.length) return;
            const id = pool[Math.floor(R(0, pool.length))];
            if (!id) return;
            addGroundDrop(id, dropX + R(-18, 18), dropY + R(-18, 18));
        }
                        function gainScale(g) { if (g >= 10) return 2; return 1 + Math.min(g, 10) / 10 }
        function addFx(x0, y0, t = "??", g = 1, c = "#16a34a", icon = null) {
            const raw = `${t ?? ""}`;
            const txt = icon === "thumb" && (raw.startsWith("+") || /^\d+$/.test(raw)) ? `X${raw.startsWith("+") ? raw.slice(1) : raw}` : raw;
            fx.push({ x: x0, y: y0, life: 1, t: txt, s: gainScale(g), c, icon });
        }
        function awardBirdSatietyThumb(b0, wx, wy) {
            const reward = thumbGain(b0.reward);
            b0.pendingThumb = reward;
            b0.pendingThumbFx = true;
            addThumbSeekFx(wx, wy - 12, `+${reward}`, reward, "#f59e0a", reward);
            return reward;
        }
        function startFullSatisfyAnim(b0) {
            if (!b0.multiState) return false;
            if (!startBirdStateAnim(b0, "full", null)) return false;
            const fullSec = Math.max(0.0001, (b0.animSec || BIRD_SPR_FRAME_SEC) * BIRD_FULL_DURATION_SCALE);
            const fullFrames = Math.max(1, Math.floor(b0.animFrames || BIRD_SPR_COLS));
            b0.animSec = fullSec;
            b0.satFor = Math.max(FULL_HOLD_MIN_SEC, fullSec * fullFrames + FULL_HOLD_END_GRACE);
            return true;
        }
        function startLegacyFullHold(b0) {
            const fullSec = Math.max(0.0001, (b0.asec || BIRD_SPR_FRAME_SEC) * BIRD_FULL_DURATION_SCALE);
            const fullFrames = Math.max(1, Math.floor(b0.acols || BIRD_SPR_COLS));
            b0.satFor = Math.max(FULL_HOLD_MIN_SEC, fullSec * fullFrames + FULL_HOLD_END_GRACE);
        }
        function worldToScreen(wx, wy) { return { x: (wx - cam.x) * VIEW_ZOOM, y: (wy - cam.y) * VIEW_ZOOM }; }
        function thumbTargetPos() {
            const cv = c.getBoundingClientRect();
            const r = hudCenter.getBoundingClientRect();
            if (!cv.width || !cv.height) return { x: W - 68, y: 24 };
            const x = (r.left - cv.left + (r.width || 24) * 0.8) * (c.width / cv.width);
            const y = (r.top - cv.top + (r.height || 20) * 0.5) * (c.height / cv.height);
            return { x, y };
        }
        function addThumbSeekFx(wx, wy, txt = "??", g = 1, c0 = "#f59e0a", thumbCount = 1) {
            const raw = `${txt ?? ""}`;
            const seekText = raw.startsWith("+") ? `X${raw.slice(1)}` : /^\d+$/.test(raw) ? `X${raw}` : raw;
            const from = { x: wx, y: wy };
            const toScreen = thumbTargetPos();
            const to = { x: toScreen.x / VIEW_ZOOM + cam.x, y: toScreen.y / VIEW_ZOOM + cam.y };
            const count = Math.max(1, Math.floor(thumbCount || 1));
            const hold = THUMB_SEEK_HOLD_SEC;
            const moveDur = THUMB_SEEK_MOVE_DURATION;
            const dur = hold + moveDur;
            const dx = from.x - to.x;
            const dy = from.y - to.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            const nx = -dy / len, ny = dx / len;
            const b = R(18, 42);
            fx.push({
                x: from.x,
                y: from.y,
                sx: from.x,
                sy: from.y,
                tx: to.x,
                ty: to.y,
                cx: (from.x + to.x) * 0.5 + nx * R(-1, 1) * b,
                cy: (from.y + to.y) * 0.5 + ny * R(-1, 1) * b,
                life: dur,
                dur,
                t: 0,
                seek: true,
                hold,
                moveDur,
                s: gainScale(g),
                c: c0,
                icon: "thumb",
                text: seekText,
                thumbCount: count,
                iconText: "👍"
            });
        }
        function killBird(b0, give = true) {
            const g = give ? (b0.pendingThumb ?? thumbGain(b0.reward)) : 0;
            if (give && g > 0 && !b0.pendingThumbFx) addThumbSeekFx(b0.x, b0.y - 12, `+${g}`, g, "#f59e0a", g);
            if (give) game.thumb += g;
            b0.pendingThumb = null;
            b0.pendingThumbFx = null;
            tryDrop(b0.x, b0.y);
        }
        function bossHit(f, bo) { if (bo.invul) { const tx = bo.x - f.x, ty = bo.y - f.y, d = Math.hypot(tx, ty) || 1; f.vx = -(tx / d) * 260; f.vy = -(ty / d) * 260; f.life = Math.min(f.life, .25); return false } const m = Math.hypot(f.vx, f.vy) || 1, nx = f.vx / m, ny = f.vy / m, dot = nx * bo.dir.v.x + ny * bo.dir.v.y; if (dot >= DIR_DOT_REQ) { const dmg = Math.max(1, Math.round(BOSS_BASE_DMG * b.sm * b.dm * (1 - BOSS_REDUCE))); bo.sat = cl(bo.sat + dmg, 0, bo.hp); const g = thumbGain(1); game.thumb += g; addFx(bo.x + R(-10, 10), bo.y - bo.r - 18, `${dmg}`, Math.max(1, dmg / 10), "#facc15"); addFx(bo.x + R(-10, 10), bo.y - bo.r - 34, `+${g}`, g, "#f59e0a", "thumb"); const step = bo.hp * 0.02; while (bo.sat >= (bo.nextDropSat || step) && (bo.nextDropSat || step) <= bo.hp) { tryDropBossHit(bo.x, bo.y); bo.nextDropSat = (bo.nextDropSat || step) + step; } if (bo.sat >= bo.hp && bo.clearS === "none") { bo.clearS = "bounce"; bo.clearAt = 1 } return true } const tx = bo.x - f.x, ty = bo.y - f.y, d = Math.hypot(tx, ty) || 1; f.vx = -(tx / d) * 260; f.vy = -(ty / d) * 260; f.life = Math.min(f.life, .4); return false }
        function hitCheck() {
            if (game.mode === "boss" && game.boss) {
                const bo = game.boss;
                for (let j = foods.length - 1; j >= 0; j--) {
                    const f = foods[j], d = Math.hypot(bo.x - f.x, bo.y - f.y);
                    if (d < bo.r + f.r && bossHit(f, bo)) {
                        foods.splice(j, 1);
                    }
                }
                return;
            }

            for (let i = birds.length - 1; i >= 0; i--) {
                const b0 = birds[i];
                if (b0.satDone) continue;

                for (let j = foods.length - 1; j >= 0; j--) {
                    const f = foods[j], d = Math.hypot(b0.x - f.x, b0.y - f.y);
                    if (d >= b0.r + f.r) continue;
                    if (f.hitIds && f.hitIds[b0._id]) continue;

                    if (b0.k === "rude" && b0.ds !== "idle") {
                        foods.splice(j, 1);
                        continue;
                    }
                    const base = b0.hp * b.sm * b.dm;
                    applyFeedSatiety(b0, base, b0.x, b0.y, true);
                    b0.hitFor = .26;
                    if (b0.multiState) startBirdStateAnim(b0, "eat", "walk", BIRD_EAT_MIN_SEC);
                    if (it.active.bacchus > 0 && (f.pierceLeft || 0) > 0) {
                        f.pierceLeft--;
                        if (f.hitIds) f.hitIds[b0._id] = true;
                    } else {
                        foods.splice(j, 1);
                    }
                    if (it.active.ramen > 0) {
                        const splashR = p.r * 3.0;
                        for (let k = 0; k < birds.length; k++) {
                            const o = birds[k];
                            if (o === b0 || o.satDone) continue;
                            if (Math.hypot(o.x - b0.x, o.y - b0.y) > splashR) continue;
                            applyFeedSatiety(o, base * 0.3, o.x, o.y, false);
                            o.hitFor = Math.max(o.hitFor || 0, 0.16);
                        }
                    }
                }
            }
        }
        function applyAtomicFeed() {
            for (const b0 of birds) {
                b0.sat = b0.max;
            }
        }
        function activateItem(id, fxX = p.x, fxY = p.y) {
            if (id === "atomic") {
                applyAtomicFeed();
                startAtomicFx();
                if (game.mode === "boss" && game.boss) {
                    const d = Math.max(1, Math.round(game.boss.hp * ATOMIC_BOSS_RATIO));
                    game.boss.sat = cl(game.boss.sat + d, 0, game.boss.hp);
                    addFx(game.boss.x, game.boss.y - game.boss.r - 16, `모폭-${d}`, Math.max(1, d / 100), "#fb923c");
                }
                addFx(fxX, fxY - 24, "모폭 사용");
                return;
            }
            const dur = ITEM_DUR * (id === "coffee" ? (b.coffeeDurBonus || 1) : 1);
            it.active[id] = (it.active[id] || 0) + dur;
            addFx(fxX, fxY - 24, `${itemLabel(id)} (${it.active[id].toFixed(1)}s)`);
        }
        function useSlot(i) {
            if (game.mode !== "playing" && game.mode !== "boss") return;
            const id = it.slots[i];
            if (!id) return;
            it.slots[i] = null;
            activateItem(id, p.x, p.y);
        }
        function updateFx(dt) {
            for (let i = fx.length - 1; i >= 0; i--) {
                const e = fx[i];
                if (e.seek) {
                    e.t += dt;
                    if (e.t > e.hold) {
                        const pm = cl((e.t - e.hold) / Math.max(0.0001, e.moveDur), 0, 1);
                        const u = 1 - Math.pow(1 - pm, 1.9);
                        const q = 1 - u;
                        e.x = q * q * e.sx + 2 * q * u * e.cx + u * u * e.tx;
                        e.y = q * q * e.sy + 2 * q * u * e.cy + u * u * e.ty;
                    } else {
                        e.x = e.sx;
                        e.y = e.sy;
                    }
                    e.life -= dt;
                    if (e.life <= 0) fx.splice(i, 1);
                    continue;
                }
                e.life -= dt;
                e.y -= 26 * dt;
                if (e.life <= 0) fx.splice(i, 1);
            }
            updateAtomicFx(dt);
            if (game.atomic > 0) game.atomic = Math.max(0, game.atomic - dt);
            if (game.boomT > 0) game.boomT = Math.max(0, game.boomT - dt);
            if (game.shake > 0) game.shake = Math.max(0, game.shake - dt);
        }
        function updateFat(dt) { const z = p.r * FAT_ZONE; let n = 0; for (const b0 of birds) { if (Math.hypot(b0.x - p.x, b0.y - p.y) <= z) n += (b0.k === "rude" ? 2 : 1) } if (n >= FAT_MIN) game.fat = cl(game.fat + FAT_INC * dt, 0, maxFat()); else game.fat = cl(game.fat - FAT_DEC * dt, 0, maxFat()) }
        function updateTrails(dt) {
            for (let i = trails.length - 1; i >= 0; i--) {
                const t = trails[i];
                t.life -= dt;
                if (t.life <= 0) { trails.splice(i, 1); continue; }
            }
            if (energyTrailLife() <= 0) return;
            for (let i = 0; i < birds.length; i++) {
                const b0 = birds[i];
                if (b0.satDone || (b0.trailCd || 0) > 0) continue;
                for (let j = 0; j < trails.length; j++) {
                    const t = trails[j];
                    if (Math.hypot(b0.x - t.x, b0.y - t.y) > b0.r + t.r) continue;
                    applyFeedSatiety(b0, b0.hp * 0.16, b0.x, b0.y, false);
                    b0.trailCd = 0.35;
                    break;
                }
            }
        }
        function updateItems(dt) { ["coffee", "chili", "ramen", "lunch", "energy", "bacchus"].forEach(k => { if (it.active[k] > 0) it.active[k] = Math.max(0, it.active[k] - dt) }); for (let i = 0; i < 2; i++) { const t = it.slotT[i]; if (t) { t.r -= dt; if (t.r <= 0) it.slotT[i] = null } } }
        function camUpdate() {
            const bw = mapW(), bh = mapH();
            const vw = Math.max(10, Number.isFinite(viewW()) ? viewW() : W), vh = Math.max(10, Number.isFinite(viewH()) ? viewH() : H);
            if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) { p.x = W / 2; p.y = H / 2; }
            p.x = cl(p.x, p.r || 1, Math.max(p.r || 1, bw - (p.r || 1)));
            p.y = cl(p.y, p.r || 1, Math.max(p.r || 1, bh - (p.r || 1)));
            cam.x = cl(p.x - vw * .5, 0, Math.max(0, bw - vw));
            cam.y = cl(p.y - vh * .5, 0, Math.max(0, bh - vh));
        }
        function showMsg(t, sec, cb) { msgText.textContent = t; msgOv.hidden = false; game.mode = "message"; game.msgAt = performance.now() + sec * 1000; game.msgCb = cb }
        function nextStage() { if (game.si >= STAGES.length - 1) { showMsg("보스전 시작", 1.2, startBossIntro); return } const ni = game.si + 1; setupStage(ni); showMsg(STAGE_LINES[ni] || `스테이지 ${ni + 1}`, 1.2, () => { game.mode = "playing"; }); }
        function checkStage() { if (game.se < stage().t) return; if (game.thumb >= stage().target) nextStage(); else showMsg("?占쎌돺吏占???媛蹂댁옄~", 2, () => { goTitleWithReward(); }) }
        function rand3(a) { const s = [...a], o = []; while (s.length && o.length < 3) o.push(s.splice(Math.floor(R(0, s.length)), 1)[0]); return o }
        function applyOpt(id) {
            if (id === "boss_thumb_bonus") {
                b.bossThumbBonus = (b.bossThumbBonus || 0) + 0.1;
                addFx(p.x, p.y - 36, `보스 따봉 +${Math.round((b.bossThumbBonus || 0) * 100)}%`, 1.1, "#facc15");
                return;
            }
            const cardData = CARD_POOL.find(v => v.id === id);
            if (!cardData) return;
            pickedCards.push(id);
            b.items[cardData.item] = (b.items[cardData.item] || 0) + 1;
            popupItemUnlock(cardData.item, b.items[cardData.item]);
            b.fr *= cardData.mods.fr || 1;
            b.dm *= cardData.mods.dm || 1;
            b.mv *= cardData.mods.mv || 1;
            b.ag *= cardData.mods.ag || 1;
            b.hr *= cardData.mods.hr || 1;
            activateItem(cardData.item, p.x, p.y);
        }
        function card(o) {
            const bt = document.createElement("button");
            bt.className = "card";
            const nextLv = Math.min(itemLevel(o.item) + 1, ITEM_MAX_UI_LV);
            const main = o.sub.split(" / ")[0].replace(/\s*\+\s*/g, "+");
            const sub = o.sub.split(" / ")[1].replace(/\s*\+\s*/g, "+");
            bt.innerHTML = `<strong>${ITEM_KR[o.item]}</strong><div>${nextLv}/${ITEM_MAX_UI_LV}</div><div style="height:8px"></div><div>${main}</div><small>${sub}</small>`;
            bt.onclick = () => {
                applyOpt(o.id);
                if (game.debugPickLeft > 0) {
                    game.debugPickLeft--;
                    if (game.debugPickLeft > 0) { showLvCards(Math.min(MAX_LEVEL, game.lv - game.debugPickLeft + 1)); return; }
                }
                levelOv.hidden = true;
                game.mode = game.boss ? "boss" : "playing";
            };
            return bt;
        }
        function showLvCards(lv) {
            lvCards.innerHTML = "";
            levelOv.hidden = false;
            game.mode = "levelup";
            lvTitle.textContent = `${lv}레벨 업그레이드`;
            lvSub.textContent = "카드 1장을 선택하세요";
            const options = pickLevelCards();
            if (!options.length) {
                lvCards.appendChild(card({ id: "boss_thumb_bonus", item: "atomic", sub: `보스따봉+10% / 현재+${Math.round((b.bossThumbBonus || 0) * 100)}%` }));
                return;
            }
            options.forEach(o => lvCards.appendChild(card(o)));
        }
        function levelFromThumb(thumb) { let lv = 1; for (let i = 0; i < LEVELS.length; i++) if (thumb >= LEVELS[i]) lv = i + 2; return Math.min(MAX_LEVEL, lv) }
        function applyLevelProgress(force = false) {
            if (!force && game.mode !== "playing" && game.mode !== "boss") return;
            const lv = levelFromThumb(game.thumb);
            if (lv <= game.lv) return;
            const gained = lv - game.lv;
            game.lv = lv;
            game.debugPickLeft += gained;
            if (game.debugPickLeft <= 0) return;
            showLvCards(Math.min(MAX_LEVEL, game.lv - game.debugPickLeft + 1));
        }
        function checkLv() { applyLevelProgress(false); }
        function col(k, s) { if (k === "dull") return "#9ca3af"; if (k === "adhd") return "#fb923c"; if (k === "picky") return "#3b82f6"; if (k === "rude") return s && s !== "idle" ? "#f472b6" : "#a855f7"; if (k === "shy") return "#facc15"; return "#f9a8d4" }
        function cir(x0, y0, r, c0) { x.beginPath(); x.arc(x0, y0, r, 0, Math.PI * 2); x.fillStyle = c0; x.fill() }
        function drawBirdFallback(b0, yOff = 0) { cir(b0.x, b0.y + yOff, b0.r, col(b0.k, b0.ds)); cir(b0.x + 6, b0.y - 3 + yOff, 3.5, "rgba(0,0,0,.25)"); cir(b0.x - 2, b0.y + 1 + yOff, 2, "#111827") }
        function birdAnimRow(b0) { if (b0.satDone) return BIRD_SPR_ROWS.sat; if (b0.k === "rude" && b0.ds === "dash") return BIRD_SPR_ROWS.special; if ((b0.hitFor || 0) > 0) return BIRD_SPR_ROWS.special; return BIRD_SPR_ROWS.move }
        function drawBirdSprite(kind, obj, yOff = 0, forcedRow = null) {
            const pack = pigeonImgs[kind];
            const m = birdMeta(kind);
            if (!pack) return drawBirdFallback(obj, yOff);
            if (pack.legacy) {
                const r = pack.states?.walk;
                if (!r || !r.ready) {
                    if (kind === "boss") { const c0 = game.boss && game.boss.invul ? "#94a3b8" : "#facc15"; cir(obj.x, obj.y + yOff, obj.r, c0); cir(obj.x + 14, obj.y - 8 + yOff, 8, game.boss && game.boss.invul ? "#64748b" : "#b45309"); return }
                    drawBirdFallback(obj, yOff);
                    return;
                }
                const cols = m.cols || 1, rows = m.rows || 1, fw = Math.floor(r.img.width / cols), fh = Math.floor(r.img.height / rows);
                const freezeFirst = (kind === "mom" || kind === "boss");
                const row = freezeFirst ? 0 : (forcedRow == null ? birdAnimRow(obj) : forcedRow), col = freezeFirst ? 0 : ((obj.af || 0) % cols), sx = col * fw, sy = row * fh;
                const base = obj.r * 2, dw = Math.round(base * (m.sw || 1)), dh = Math.round(base * (m.sh || 1)), dx = Math.round(obj.x - dw * .5), dy = Math.round(m.bottom ? (obj.y + yOff + obj.r - dh) : (obj.y - obj.r + yOff));
                if (obj.flip) { x.save(); x.translate(Math.round(obj.x), 0); x.scale(-1, 1); x.drawImage(r.img, sx, sy, fw, fh, Math.round(-dw * .5), dy, dw, dh); x.restore(); return }
                x.drawImage(r.img, sx, sy, fw, fh, dx, dy, dw, dh);
                return;
            }
            const state = obj.animState || "walk";
            const rec = pack.states?.[state] || pack.states?.walk;
            if (!rec || !rec.ready) return drawBirdFallback(obj, yOff);
            const cols = rec.cols || 1;
            const rows = rec.rows || 1;
            const fw = Math.floor(rec.img.width / cols);
            const fh = Math.floor(rec.img.height / rows);
            const frame = Math.max(0, obj.animFrame || 0);
            const frameIdx = Math.min(frame, Math.max(0, cols * rows - 1));
            const sx = (frameIdx % cols) * fw;
            const sy = Math.floor(frameIdx / cols) * fh;
            const base = obj.r * 2, dw = Math.round(base * (m.sw || 1)), dh = Math.round(base * (m.sh || 1));
            const dx = Math.round(obj.x - dw * .5), dy = Math.round(m.bottom ? (obj.y + yOff + obj.r - dh) : (obj.y - obj.r + yOff));
            if (obj.flip) { x.save(); x.translate(Math.round(obj.x), 0); x.scale(-1, 1); x.drawImage(rec.img, sx, sy, fw, fh, Math.round(-dw * .5), dy, dw, dh); x.restore(); return }
            x.drawImage(rec.img, sx, sy, fw, fh, dx, dy, dw, dh);
        }
        function drawFallbackSprite() { const d = p.r * 2, s = d / 16, baseX = p.x - p.r, baseY = p.y - p.r, f = ps.frame, ox = ps.flip ? 16 : 0, k = ps.flip ? -1 : 1, P = (px, py, pw, ph, col) => { x.fillStyle = col; x.fillRect(baseX + (ox + px * k) * s, baseY + py * s, pw * s * k, ph * s) }; P(5, 1, 6, 5, "#f5d0a5"); P(4, 0, 8, 2, "#334155"); P(5, 6, 6, 5, "#e5e7eb"); P(5, 11, 6, 4, "#475569"); P(7, 3, 1, 1, "#111827"); P(9, 3, 1, 1, "#111827"); if (ps.row === SPR_ROWS.atk) P(11, 7, 4, 2, "#f97316"); if (ps.row === SPR_ROWS.hit) P(4, 0, 8, 1, "#ef4444"); if (ps.row === SPR_ROWS.up || ps.row === SPR_ROWS.down || ps.row === SPR_ROWS.right) { const swing = [0, 1, 0, -1][f]; P(3, 7 + swing, 2, 3, "#cbd5e1"); P(11, 7 - swing, 2, 3, "#cbd5e1") } }
        function drawPlayer() {
            const preferred = playerSprites[ps.anim] || playerSprites.idle;
            const rec = preferred?.ready ? preferred : playerSprites.idle;
            if (!rec?.ready) {
                drawFallbackSprite();
                return;
            }
            const sw = rec.img.naturalWidth || rec.img.width || 1;
            const sh = rec.img.naturalHeight || rec.img.height || 1;
            const cols = Math.max(1, rec.cols || PLAYER_SPR_COLS_DEFAULT);
            const rows = Math.max(1, rec.rows || 1);
            const frameW = Math.max(1, Math.floor(sw / cols));
            const frameH = Math.max(1, Math.floor(sh / rows));
            const totalFrames = Math.max(1, rec.frames || cols * rows);
            const frame = Math.max(0, ps.frame % totalFrames);
            const sx = (frame % cols) * frameW;
            const fallbackRow = Math.floor(frame / cols) % rows;
            const explicitRow = Number.isFinite(ps.row) ? Math.round(ps.row) : 0;
            const row = explicitRow >= 0 && explicitRow < rows ? explicitRow : fallbackRow;
            const sy = row * frameH;
            const d = p.r * 2, dx = p.x - p.r, dy = p.y - p.r;
            if (ps.flip) {
                x.save();
                x.translate(p.x, 0);
                x.scale(-1, 1);
                x.drawImage(rec.img, sx, sy, frameW, frameH, -p.r, dy, d, d);
                x.restore();
                return;
            }
            x.drawImage(rec.img, sx, sy, frameW, frameH, dx, dy, d, d);
        }
        function drawBackground(bw, bh) {
            if (!bgImg.ready) return;
            const tw = Math.max(96, bgImg.img.width * BG_TILE_SCALE), th = Math.max(96, bgImg.img.height * BG_TILE_SCALE);
            for (let yy = 0; yy < bh + th; yy += th) for (let xx = 0; xx < bw + tw; xx += tw) x.drawImage(bgImg.img, 0, 0, bgImg.img.width, bgImg.img.height, xx, yy, tw, th);
        }
        function drawSpicyZones() {
            if (!spicySkill.zones.length) return;
            for (const z of spicySkill.zones) {
                const alpha = cl(z.life / z.dur, 0.1, 1);
                x.save();
                x.globalAlpha = alpha;
                const a = Math.atan2(z.dy, z.dx);
                x.beginPath();
                x.moveTo(z.x, z.y);
                x.arc(z.x, z.y, z.range, a - z.half, a + z.half);
                x.closePath();
                x.fillStyle = "rgba(239, 68, 68, 0.28)";
                x.fill();
                x.lineWidth = 2;
                x.strokeStyle = "rgba(254, 226, 226, 0.72)";
                x.stroke();
                x.restore();
            }
        }
        function drawEnergyTrails() {
            if (!trails.length) return;
            for (const t of trails) {
                const a = cl(t.life / Math.max(0.001, t.maxLife), 0.08, 0.45);
                x.fillStyle = `rgba(96,165,250,${a})`;
                x.beginPath();
                x.arc(t.x, t.y, t.r, 0, Math.PI * 2);
                x.fill();
            }
        }
        function drawGroundDrops() {
            for (const d0 of groundDrops) {
                const bob = Math.sin(performance.now() / 220 + d0.bob) * 2;
                x.fillStyle = groundItemColors[d0.id] || "#e2e8f0";
                x.beginPath();
                x.arc(d0.x, d0.y + bob, d0.r, 0, Math.PI * 2);
                x.fill();
                x.strokeStyle = "rgba(15,23,42,.6)";
                x.lineWidth = 2;
                x.stroke();
                x.fillStyle = "#0f172a";
                x.font = "bold 10px 'Segoe UI',sans-serif";
                x.textAlign = "center";
                x.fillText(itemLabel(d0.id), d0.x, d0.y - d0.r - 6 + bob);
            }
            x.textAlign = "start";
        }
        function draw() {
            if (game.mode === "boss_intro") {
                x.setTransform(1, 0, 0, 1, 0, 0);
                x.clearRect(0, 0, W, H);
                const phase = game.bossIntro?.phase || 1;
                const r = phase === 1 ? bossCut1Img : bossCut2Img;
                if (r?.ready && r.img && r.img.naturalWidth > 0 && r.img.naturalHeight > 0) {
                    const iw = r.img.naturalWidth;
                    const ih = r.img.naturalHeight;
                    const s = Math.max(W / iw, H / ih);
                    const dx = (W - iw * s) * 0.5;
                    const dy = (H - ih * s) * 0.5;
                    x.drawImage(r.img, dx, dy, iw * s, ih * s);
                } else {
                    x.fillStyle = "#000";
                    x.fillRect(0, 0, W, H);
                }
                return;
            }
            x.setTransform(1, 0, 0, 1, 0, 0);
            x.clearRect(0, 0, W, H); x.save(); const sx = game.shake > 0 ? R(-8, 8) * game.shake : 0, sy = game.shake > 0 ? R(-8, 8) * game.shake : 0; x.scale(VIEW_ZOOM, VIEW_ZOOM); x.translate(-cam.x + sx / VIEW_ZOOM, -cam.y + sy / VIEW_ZOOM); const bw = mapW(), bh = mapH(); drawBackground(bw, bh); for (let yy = 0; yy <= bh; yy += 80) { x.strokeStyle = "rgba(56,106,63,.08)"; x.beginPath(); x.moveTo(0, yy + .5); x.lineTo(bw, yy + .5); x.stroke() } for (let xx = 0; xx <= bw; xx += 80) { x.strokeStyle = "rgba(56,106,63,.06)"; x.beginPath(); x.moveTo(xx + .5, 0); x.lineTo(xx + .5, bh); x.stroke() } x.strokeStyle = "rgba(14,116,144,.35)"; x.lineWidth = 5; x.strokeRect(0, 0, bw, bh);
            drawEnergyTrails();
            drawSpicyZones();
            drawGroundDrops();
            for (const b0 of birds) { drawBirdSprite(b0.k, b0); const bw = 28, ra = b0.sat / b0.max; if (ra < 1) { x.fillStyle = "rgba(17,24,39,.2)"; x.fillRect(b0.x - bw / 2, b0.y - 20, bw, 4); x.fillStyle = "#f59e0b"; x.fillRect(b0.x - bw / 2, b0.y - 20, bw * ra, 4) } if (b0.k === "shy" && !b0.escape && b0.sat < b0.max) { const l = cl(b0.limit - (game.se - b0.born), 0, b0.limit); x.font = "bold 12px 'Segoe UI',sans-serif"; x.fillStyle = "#111827"; x.fillText(`${l.toFixed(1)}s`, b0.x - 14, b0.y - 26) } }
            if (game.boss) { const bo = game.boss, bob = bo.clearS === "bounce" ? Math.sin(performance.now() / 1000 * 12) * 10 : 0, half = Math.acos(DIR_DOT_REQ), center = Math.atan2(-bo.dir.v.y, -bo.dir.v.x); x.globalAlpha = bo.blink ? .35 : 1; drawBirdSprite("boss", bo, bob, bo.clearS === "bounce" ? BIRD_SPR_ROWS.sat : (bo.invul || bo.dashS === "dash" ? BIRD_SPR_ROWS.special : BIRD_SPR_ROWS.move)); x.beginPath(); x.moveTo(bo.x, bo.y + bob); x.arc(bo.x, bo.y + bob, bo.r + 4, center - half, center + half); x.closePath(); x.fillStyle = "rgba(59,130,246,.35)"; x.fill(); x.globalAlpha = 1; if (!bo.dirBlink || Math.floor(performance.now() / 120) % 2 === 0) { x.font = "bold 30px 'Segoe UI',sans-serif"; x.fillStyle = "#111827"; x.fillText(bo.dir.a, bo.x - 11, bo.y - bo.r - 14 + bob) } }
            for (const f of foods) {
                if (f.skin === "spicy" && spicyBullet.ready && spicyBullet.img && spicyBullet.img.naturalWidth > 0 && spicyBullet.img.naturalHeight > 0) {
                    const fw = spicyBullet.img.naturalWidth || spicyBullet.img.width || 1;
                    const fh = spicyBullet.img.naturalHeight || spicyBullet.img.height || 1;
                    const scale = Math.max(1, f.scale || spicyProjectileScale());
                    const bsz = Math.max(fw, fh) * 0.2 * scale;
                    const angle = Math.atan2(f.vy || 0, f.vx || 1);
                    x.save();
                    x.translate(f.x, f.y);
                    x.rotate(angle);
                    x.drawImage(spicyBullet.img, -bsz * .5, -bsz * .5, bsz, bsz);
                    x.restore();
                } else {
                    cir(f.x, f.y, f.r, "#92400e");
                }
            }
            drawPlayer();
            const fr = cl(game.fat / maxFat(), 0, 1);
            if (game.fat > 0) {
                const pr = p.r * 2;
                x.fillStyle = "#ffffff";
                x.fillRect(p.x - pr / 2, p.y - p.r - 14, pr, 5);
                x.fillStyle = "#ef4444";
                x.fillRect(p.x - pr / 2, p.y - p.r - 14, pr * fr, 5);
            }
                for (const e of fx) {
                x.globalAlpha = Math.max(e.life, 0);
                const sc = e.s || 1;
                const label = e.text ?? e.t;
                const textScale = Math.max(0.5, sc);
                x.textBaseline = "middle";
                x.font = `bold ${Math.round(16 * sc)}px 'Segoe UI',sans-serif`;
                x.fillStyle = e.c || "#16a34a";
                let tx = e.x - 16 * textScale;
            if (e.icon === "thumb") {
                const isz = Math.max(8, Math.round(FX_ICON_SIZE * textScale * 2));
                const rewardText = `${label}`;
                const gap = 2;
                const textW = x.measureText(rewardText).width;
                const ix0 = e.x - (Math.max(1, isz) + gap + textW) * 0.5;
                const iy = e.y - isz * 0.75;
                let iconW = 0;
                const isMoving = e.seek && e.t >= (e.hold || 0);
                x.fillStyle = "#ffffff";
                x.font = `bold ${Math.round(16 * sc * 0.8)}px 'Segoe UI',sans-serif`;
                const iconLoaded = thumbIcon.ready && thumbIcon.img && thumbIcon.img.complete && thumbIcon.img.naturalWidth > 0 && thumbIcon.img.naturalHeight > 0;
                if (iconLoaded) {
                    iconW = Math.max(8, Math.round(isz));
                    x.drawImage(thumbIcon.img, ix0, iy, iconW, iconW);
                } else {
                    const emoji = e.iconText || "👍";
                    x.fillStyle = "#ffffff";
                    const fs = Math.max(9, Math.round(isz * 0.95));
                    x.font = `bold ${fs}px 'Segoe UI',sans-serif`;
                    iconW = Math.max(1, x.measureText(emoji).width);
                    x.fillText(emoji, ix0, e.y + 2);
                    x.font = `bold ${Math.round(16 * sc * 0.8)}px 'Segoe UI',sans-serif`;
                    x.fillStyle = "#ffffff";
                }
                tx = ix0 + iconW + gap;
                if (isMoving) tx = null;
                }
                if (tx !== null) x.fillStyle = "#ffffff";
                if (tx !== null) x.fillText(label, tx, e.y);
                x.globalAlpha = 1;
            }
            x.restore();
            drawAtomicFx();
        }
        function hud() {
            if (game.mode === "boss_intro") {
                bossHud.style.display = "none";
                hudCenter.textContent = "Boss Intro";
                hudTimer.textContent = "";
            } else if (game.mode === "boss" && game.boss) {
                bossHud.style.display = "block";
                const bo = game.boss, left = Math.max(0, BOSS_TIME - game.se), bp = cl(bo.sat / bo.hp, 0, 1);
                hudCenter.textContent = `BOSS | 👍 ${game.thumb}${spriteDebugTxt()}`;
                hudTimer.textContent = `${left.toFixed(1)}s`;
                bossFill.style.width = `${bp * 100}%`;
                bossHpTxt.textContent = `${(bp * 100).toFixed(1)}%`;
                bossDirEl.textContent = bo.dirBlink && Math.floor(performance.now() / 120) % 2 === 1 ? " " : bo.dir.a;
                bossTime.textContent = `${left.toFixed(1)}s`;
            } else {
                bossHud.style.display = "none";
                const s = stage(), left = Math.max(0, s.t - game.se);
                hudCenter.textContent = `${s.id} | 👍 ${game.thumb} / ${s.target}${spriteDebugTxt()}`;
                hudTimer.textContent = `${left.toFixed(1)}s`;
            }
            if (hudStarsFill) hudStarsFill.style.width = `${cl(game.stars / 5, 0, 1) * 100}%`;
            if (hudStarsScore) hudStarsScore.textContent = `${game.stars.toFixed(2)} / 5.00`;
            hudHeart.textContent = `♥ ${game.hearts}`;
            hudLevel.textContent = `LV ${game.lv}`; const prevNeed = game.lv <= 1 ? 0 : LEVELS[Math.min(game.lv - 2, LEVELS.length - 1)], nextNeed = LEVELS[Math.min(game.lv - 1, LEVELS.length - 1)] ?? prevNeed, cur = cl(game.thumb, prevNeed, nextNeed), xpPct = nextNeed > prevNeed ? ((cur - prevNeed) / (nextNeed - prevNeed)) * 100 : 100; xpText.textContent = game.lv >= LEVELS.length + 1 ? "XP MAX" : `XP ${cur} / ${nextNeed}`; xpFill.style.width = `${cl(xpPct, 0, 100)}%`; for (let i = 0; i < 2; i++) { const it0 = it.slots[i], bt = sBtns[i]; if (it0) { bt.classList.remove("empty"); bt.textContent = itemLabel(it0); } else { bt.classList.add("empty"); bt.textContent = "+" } sTimers[i].textContent = "" }
            const buffDesc = (id) => {
                if (id === "coffee") return coffeeShotCount() === 5 ? "멀티샷5" : (coffeeShotCount() === 3 ? "멀티샷3" : "멀티샷2");
                if (id === "chili") return `공속x${chiliFireMul()}`;
                if (id === "ramen") return `포만x${ramenFeedMul()}`;
                if (id === "lunch") return `모이x${lunchSizeMul()}`;
                if (id === "energy") return energyTrailLife() > 0 ? `이속x1.5+추가효과` : "이속x1.5";
                if (id === "bacchus") return `관통${bacchusPierce()}`;
                return "";
            };
            const buffs = [];
            if (it.active.coffee > 0) buffs.push({ t: itemLabel("coffee"), d: buffDesc("coffee"), r: it.active.coffee });
            if (it.active.chili > 0) buffs.push({ t: itemLabel("chili"), d: buffDesc("chili"), r: it.active.chili });
            if (it.active.ramen > 0) buffs.push({ t: itemLabel("ramen"), d: buffDesc("ramen"), r: it.active.ramen });
            if (it.active.energy > 0) buffs.push({ t: itemLabel("energy"), d: buffDesc("energy"), r: it.active.energy });
            if (it.active.bacchus > 0) buffs.push({ t: itemLabel("bacchus"), d: buffDesc("bacchus"), r: it.active.bacchus });
            if (it.active.lunch > 0) buffs.push({ t: itemLabel("lunch"), d: buffDesc("lunch"), r: it.active.lunch });
            buffUi.innerHTML = buffs.map(v => `<div class="buff">${v.t}<br>${v.d}<br>${v.r.toFixed(1)}s</div>`).join("")
        }
        function spriteDebugTxt() { const miss = Object.entries(pigeonImgs).filter(([, v]) => !v?.states?.walk || !v.states.walk.ready).map(([k]) => k); return miss.length ? ` | SPRITE MISS: ${miss.join(",")}` : "" }
        function tick(ts) {
            const dt = Math.min((ts - last) / 1000, .033);
            last = ts;
            const paused = false;
            if (game.mode === "playing") {
                if (!paused) game.se += dt;
                if (!paused) { updateSpawn(); updatePlayer(dt); updateBirds(dt); updateFire(dt); updateFoods(dt); hitCheck(); updateFat(dt); updateSpicySkill(dt); tryCollectGroundDrops(); }
                updateTrails(dt);
                updateItems(dt);
                updateFx(dt);
                updateStarsFx();
                checkLv();
                if (!paused) checkStage();
            } else if (game.mode === "boss") {
                if (!paused) { updatePlayer(dt); updateBoss(dt); updateFire(dt); updateFoods(dt); hitCheck(); updateFat(dt); updateSpicySkill(dt); tryCollectGroundDrops(); }
                updateTrails(dt);
                updateItems(dt);
                updateFx(dt);
                updateStarsFx();
                checkLv();
            } else if (game.mode === "boss_intro") {
                const intro = game.bossIntro || { phase: 1, t: 0 };
                intro.t += dt;
                if (intro.phase === 1 && intro.t >= BOSS_CUT_HOLD_SEC) {
                    intro.phase = 2;
                    intro.t = 0;
                    if (bossBgmSequenceArmed) {
                        bossImpactPlayCount = 2;
                        playBossImpact();
                    }
                } else if (intro.phase === 2 && intro.t >= BOSS_CUT_HOLD_SEC) {
                    startBoss();
                }
                game.bossIntro = intro;
                updateTrails(dt);
                updateItems(dt);
                updateFx(dt);
            } else if (game.mode === "evolution") {
                updateTrails(dt);
                updateItems(dt);
                updateFx(dt);
                if (performance.now() >= game.evoAt) {
                    evoOv.hidden = true;
                    if (game.debugPickLeft > 0) {
                        showLvCards(Math.min(MAX_LEVEL, game.lv - game.debugPickLeft + 1));
                    } else {
                        game.mode = game.boss ? "boss" : "playing";
                    }
                }
            } else if (game.mode === "message") {
                updateTrails(dt);
                updateItems(dt);
                updateFx(dt);
                if (performance.now() >= game.msgAt) {
                    msgOv.hidden = true;
                    const f = game.msgCb;
                    game.msgCb = null;
                    if (f) f();
                }
            } else if (game.mode === "levelup") {
                // Freeze timed effects while choosing level-up options.
            } else {
                updateTrails(dt);
                updateItems(dt);
                updateFx(dt);
            }
            updateSpicySkillUi();
            camUpdate();
            draw();
            hud();
            requestAnimationFrame(tick);
        }
        addEventListener("keydown", e => { const k = e.key.toLowerCase(); keys.add(k); if (k === "c") { if (statsOv.hidden) { const fatPct = (game.fat / maxFat() * 100).toFixed(1), aspd = (Math.max(0, 1 - game.fat / maxFat()) * 100).toFixed(1); statsBody.textContent = `직업: 샐러리맨\n공속 배율: x${b.fr.toFixed(2)}\n공격 배율: x${b.dm.toFixed(2)}\n포만 배율: x${b.sm.toFixed(2)}\n사거리 배율: x${b.ag.toFixed(2)}\n이속 배율: x${b.mv.toFixed(2)}\n피로 최대 배율: x${b.fm.toFixed(2)}\n모이크기 배율: x${b.hr.toFixed(2)}\n치명타 확률: ${(b.crit * 100).toFixed(1)}%\n현재 피로도: ${fatPct}%\n피로 반영 공속: ${aspd}%\n\n아이템 레벨:\n커피 ${itemLevel("coffee")} / 청양고추 ${itemLevel("chili")} / 라면 ${itemLevel("ramen")} / 도시락 ${itemLevel("lunch")} / 핫식스 ${itemLevel("energy")} / 박카스 ${itemLevel("bacchus")}\n\n선택 카드:\n${pickedCards.length ? pickedCards.join(", ") : "없음"}`; statsOv.hidden = false; game.mode = "stats" } else { statsOv.hidden = true; game.mode = game.boss ? "boss" : "playing" } } }); addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
        sBtns[0].onclick = () => useSlot(0); sBtns[1].onclick = () => useSlot(1);
        $("startBtn").onclick = () => { charOv.hidden = false; };
        $("shopBtn").onclick = () => { refreshShopUi(); shopOv.hidden = false; };
        shopCloseBtn.onclick = () => { shopOv.hidden = true; };
        if (charCloseBtn) charCloseBtn.onclick = () => { charOv.hidden = true; };
        if (charSalarymanBtn) charSalarymanBtn.onclick = () => { startBgm(); resetRun(); titleOv.hidden = true; charOv.hidden = true; };
        buySaltyBtn.onclick = () => {
            if (game.shop.salty || game.hearts < 200) return;
            game.hearts -= 200;
            game.shop.salty = true;
            refreshShopUi();
        };
        buySweetBtn.onclick = () => {
            if (game.shop.sweet || game.hearts < 200) return;
            game.hearts -= 200;
            game.shop.sweet = true;
            refreshShopUi();
        };
        $("exitBtn").onclick = () => { if (window.close) window.close(); titleResult.textContent = "釉뚮씪?占쏙옙? ??占쏙옙 ?占쎌븘 醫낅즺?占쎌꽭??" };
        statsCloseBtn.onclick = () => { statsOv.hidden = true; game.mode = game.boss ? "boss" : "playing"; };
        devPanel.querySelectorAll("button[data-stage]").forEach(btn => { btn.onclick = () => { startBgm(); const n = Number(btn.dataset.stage) - 1; setupStage(Math.max(0, Math.min(4, n))); game.mode = "playing"; titleOv.hidden = true; charOv.hidden = true; msgOv.hidden = true; levelOv.hidden = true; evoOv.hidden = true; statsOv.hidden = true; }; });
        devBossBtn.onclick = () => { startBgm(); startBossIntro(); titleOv.hidden = true; charOv.hidden = true; msgOv.hidden = true; levelOv.hidden = true; evoOv.hidden = true; statsOv.hidden = true; };
        const devAddLevels = (n) => {
            if (n <= 0 || game.lv >= MAX_LEVEL) return;
            const nextLv = Math.min(MAX_LEVEL, game.lv + n);
            const gained = nextLv - game.lv;
            if (gained <= 0) return;
            game.lv = nextLv;
            game.debugPickLeft += gained;
            showLvCards(Math.min(MAX_LEVEL, game.lv - game.debugPickLeft + 1));
        };
        if (devLv5Btn) devLv5Btn.onclick = () => { devAddLevels(5); };
        if (devLv10Btn) devLv10Btn.onclick = () => { devAddLevels(10); };
        if (devThumb500Btn) devThumb500Btn.onclick = () => { game.thumb += 500; applyLevelProgress(true); };
        if (devItemCoffeeBtn) devItemCoffeeBtn.onclick = () => { grantItemToSlot("coffee"); };
        if (devItemChiliBtn) devItemChiliBtn.onclick = () => { grantItemToSlot("chili"); };
        if (devItemRamenBtn) devItemRamenBtn.onclick = () => { grantItemToSlot("ramen"); };
        if (devItemLunchBtn) devItemLunchBtn.onclick = () => { grantItemToSlot("lunch"); };
        if (devItemEnergyBtn) devItemEnergyBtn.onclick = () => { grantItemToSlot("energy"); };
        if (devItemBacchusBtn) devItemBacchusBtn.onclick = () => { grantItemToSlot("bacchus"); };
        if (devItemAtomicBtn) devItemAtomicBtn.onclick = () => { grantItemToSlot("atomic"); };
        camUpdate(); draw(); hud(); requestAnimationFrame(ts => { last = ts; tick(ts) });














