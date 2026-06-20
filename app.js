// Import GSAP and ScrollTrigger from npm package
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Selected subset of frames to reduce loading size and scroll length (14 frames)
const frameIndices = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 26];
const frameCount = frameIndices.length;
const canvas = document.getElementById('sequence-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const loaderLiquid = document.getElementById('loader-liquid');
const loaderPercentage = document.getElementById('loader-percentage');
const cards = document.querySelectorAll('.story-card');

// Image Cache Array
const images = [];
let loadedImagesCount = 0;

// Mixer DOM Elements
const baseBtns = document.querySelectorAll('.base-btn');
const syrupSlider = document.getElementById('syrup-slider');
const syrupVal = document.getElementById('syrup-val');
const iceToggle = document.getElementById('ice-toggle');
const mintToggle = document.getElementById('mint-toggle');
const stirBtn = document.getElementById('stir-btn');
const drinkLiquid = document.getElementById('drink-liquid');
const stirWave = document.getElementById('stir-wave');
const iceContainer = document.getElementById('ice-container');
const mintContainer = document.getElementById('mint-container');

const recipeName = document.getElementById('recipe-name');
const recipeDesc = document.getElementById('recipe-desc');
const statSweetness = document.getElementById('stat-sweetness');

// Mixer State
let mixerState = {
    base: 'water',
    syrup: 20,
    ice: true,
    mint: false
};

/* ==========================================================================
   1. Image Preloader & Caching
   ========================================================================== */
function preloadImages() {
    frameIndices.forEach((frameNum) => {
        const img = new Image();
        // Generate padded index like 001, 002...
        const paddedIndex = String(frameNum).padStart(3, '0');
        img.src = `./assets/frames/ezgif-frame-${paddedIndex}.jpg`;
        
        img.onload = () => {
            loadedImagesCount++;
            updatePreloader(loadedImagesCount);
            if (loadedImagesCount === frameCount) {
                setTimeout(initApp, 600); // Small buffer for visual flow
            }
        };
        img.onerror = () => {
            console.error(`Failed to load frame: ${img.src}`);
            // Count anyway to not block app loading if one frame fails
            loadedImagesCount++;
            updatePreloader(loadedImagesCount);
            if (loadedImagesCount === frameCount) {
                setTimeout(initApp, 600);
            }
        };
        images.push(img);
    });
}

function updatePreloader(count) {
    const percentage = Math.round((count / frameCount) * 100);
    loaderPercentage.textContent = `${percentage}%`;
    loaderLiquid.style.height = `${percentage}%`;
}

/* ==========================================================================
   2. Canvas Resize & aspect-cover drawing
   ========================================================================== */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Redraw current active frame on resize
    if (images.length === frameCount) {
        renderFrame(currentFrameIndex);
    }
}

let currentFrameIndex = 0;

function renderFrame(index) {
    const img = images[index];
    if (!img) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Call custom drawImageProp to simulate CSS background-size: cover
    drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height);
    
    currentFrameIndex = index;
    updateCards(index);
}

/**
 * Draw image with background-size: cover behavior on canvas
 */
function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const r = Math.min(w / iw, h / ih);
    let nw = iw * r;
    let nh = ih * r;
    let ar = 1;

    if (nw < w) ar = w / nw;                             
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  
    nw *= ar;
    nh *= ar;

    const cw = iw / (nw / w);
    const ch = ih / (nh / h);

    const cx = (iw - cw) * offsetX;
    const cy = (ih - ch) * offsetY;

    ctx.drawImage(img, 
        cx < 0 ? 0 : cx, 
        cy < 0 ? 0 : cy, 
        cw > iw ? iw : cw, 
        ch > ih ? ih : ch,  
        x, y, w, h
    );
}

/* ==========================================================================
   3. Update Overlay Cards based on current frame
   ========================================================================== */
function updateCards(frameIndex) {
    cards.forEach((card, index) => {
        const activeFrame = parseInt(card.getAttribute('data-frame'), 10);
        const nextCard = cards[index + 1];
        const nextFrame = nextCard ? parseInt(nextCard.getAttribute('data-frame'), 10) : frameCount;
        
        if (frameIndex >= activeFrame && frameIndex < nextFrame) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

/* ==========================================================================
   4. Initialize Application & Set up ScrollTrigger
   ========================================================================== */
function initApp() {
    // Hide Preloader
    preloader.classList.add('fade-out');
    
    // Initialize Canvas
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Draw initial frame
    renderFrame(0);
    
    // Playable object for GSAP interpolation
    const bottlePlay = { frame: 0 };
    
    // Setup ScrollTrigger for Canvas Sequence
    gsap.to(bottlePlay, {
        frame: frameCount - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
            trigger: ".sequence-wrapper",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            invalidateOnRefresh: true
        },
        onUpdate: () => {
            renderFrame(bottlePlay.frame);
        }
    });
    
    // Initialize Mixer
    updateMixerUI();
}

/* ==========================================================================
   5. Interactive Mixer Logic
   ========================================================================== */

// Base Liquid selection
baseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        baseBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mixerState.base = btn.getAttribute('data-base');
        updateMixerUI();
    });
});

// Syrup slider input
syrupSlider.addEventListener('input', (e) => {
    mixerState.syrup = parseInt(e.target.value, 10);
    syrupVal.textContent = `${mixerState.syrup}%`;
    updateMixerUI();
});

// Ice Toggle
iceToggle.addEventListener('change', (e) => {
    mixerState.ice = e.target.checked;
    updateMixerUI();
});

// Mint Toggle
mintToggle.addEventListener('change', (e) => {
    mixerState.mint = e.target.checked;
    updateMixerUI();
});

// Stir Button click effect
stirBtn.addEventListener('click', () => {
    // Trigger wave and swirl animation
    stirWave.classList.add('stirring');
    stirBtn.disabled = true;
    
    // Swirl elements temporarily
    const cubes = document.querySelectorAll('.ice-cube');
    const leaves = document.querySelectorAll('.mint-leaf');
    
    cubes.forEach((cube, i) => {
        gsap.to(cube, {
            rotation: i % 2 === 0 ? '+=180' : '-=180',
            x: i % 2 === 0 ? '+=15' : '-=15',
            duration: 1.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
    });
    
    leaves.forEach((leaf, i) => {
        gsap.to(leaf, {
            rotation: i % 2 === 0 ? '+=360' : '-=360',
            x: i % 2 === 0 ? '-=20' : '+=20',
            duration: 1.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
    });
    
    setTimeout(() => {
        stirWave.classList.remove('stirring');
        stirBtn.disabled = false;
    }, 2400);
});

// Function to update the fluid colors and height dynamically
function updateMixerUI() {
    // 1. Update fluid height based on syrup (minimum 45% to maximum 88%)
    const heightPercent = 45 + (mixerState.syrup * 0.43);
    drinkLiquid.style.height = `${heightPercent}%`;
    
    // 2. Color Blending Formula
    let blendedColor = '';
    const t = mixerState.syrup / 100; // factor between 0 and 1
    
    if (mixerState.base === 'water') {
        // Blending from clear water (rgba(215, 235, 245, 0.35)) to deep rich rose red (rgba(180, 10, 50, 0.95))
        const r = Math.round(215 + (180 - 215) * t);
        const g = Math.round(235 + (10 - 235) * t);
        const b = Math.round(245 + (50 - 245) * t);
        const a = 0.35 + (0.95 - 0.35) * t;
        blendedColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
        // Blending from fresh creamy milk (rgba(253, 250, 242, 1)) to rich sweet rose milk (rgba(224, 73, 114, 1))
        const r = Math.round(253 + (224 - 253) * t);
        const g = Math.round(250 + (73 - 250) * t);
        const b = Math.round(242 + (114 - 242) * t);
        blendedColor = `rgba(${r}, ${g}, ${b}, 1)`;
    }
    
    drinkLiquid.style.backgroundColor = blendedColor;
    
    // 3. Update Ice & Mint visibility
    if (mixerState.ice) {
        iceContainer.classList.add('show');
    } else {
        iceContainer.classList.remove('show');
    }
    
    if (mixerState.mint) {
        mintContainer.classList.add('show');
    } else {
        mintContainer.classList.remove('show');
    }
    
    // 4. Recipe Generation
    generateRecipeCard();
}

function generateRecipeCard() {
    let name = '';
    let desc = '';
    let sweetness = '';
    const syrup = mixerState.syrup;
    
    if (mixerState.base === 'water') {
        if (syrup === 0) {
            name = "Pure Spring Water";
            desc = "Crisp, cold spring water. Purely hydrating, but missing the magical touch of rose.";
            sweetness = "None";
        } else if (syrup <= 15) {
            name = "Subtle Rose Cooler";
            desc = "A light, gentle infusion of rose petals. Delivers a mild botanical aroma and refreshing hydration.";
            sweetness = "Low";
        } else if (syrup <= 45) {
            name = "Classic Lal Sherbet";
            desc = "Hakim Majeed's original summer antidote. Perfect balance of sweet, floral rose and cool distillates.";
            sweetness = "Medium";
        } else if (syrup <= 80) {
            name = "Double Strength Cooler";
            desc = "A thick, flavorful cooler with an extra dose of herbal sweetness. Ideal for scorching afternoons.";
            sweetness = "High";
        } else {
            name = "Rooh Elixir";
            desc = "Rich, intense, concentrated rose nectar. A botanical powerhouse that overflows with aromatic sweetness.";
            sweetness = "Intense";
        }
    } else {
        // Milk base
        if (syrup === 0) {
            name = "Chilled Cream Milk";
            desc = "Pure cold farm-fresh milk. Nutritious and smooth, but lacks the pink rose magic.";
            sweetness = "None";
        } else if (syrup <= 15) {
            name = "Soft Blossom Milk";
            desc = "A light pastel-pink milkshake. Mildly floral, providing a delicate and soothing flavor profile.";
            sweetness = "Low";
        } else if (syrup <= 45) {
            name = "Classic Rose Milk";
            desc = "The legendary childhood favorite. Creamy cold milk infused with aromatic rose syrup. Pure nostalgia.";
            sweetness = "Medium";
        } else if (syrup <= 80) {
            name = "Royal Falooda Base";
            desc = "A rich, dessert-style sweet rose milk. Perfect for adding sweet noodles, basil seeds, and ice cream.";
            sweetness = "High";
        } else {
            name = "Hakim's Nectar Shake";
            desc = "An ultra-sweet, rich rose cream dessert beverage. Extremely indulgent, aromatic, and comforting.";
            sweetness = "Intense";
        }
    }
    
    // Update DOM
    recipeName.textContent = name;
    recipeDesc.textContent = desc;
    statSweetness.innerHTML = `<i class="fa-solid fa-cubes"></i> Sweetness: ${sweetness}`;
}

/* ==========================================================================
   6. Start Preloader Trigger
   ========================================================================== */
window.addEventListener('DOMContentLoaded', preloadImages);
