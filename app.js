// State Tracking Object (As requested)
const gameEngine = {
    currentState: 0,
    droppedCount: 0,
    trainingData: [
        { id: 1, type: "Husky", src: "1.jpeg", round: 1 },
        { id: 6, type: "Wolf", src: "6.jpeg", round: 1 },
        { id: 2, type: "Husky", src: "2.jpg", round: 1 },
        { id: 7, type: "Wolf", src: "7.jpg", round: 2 },
        { id: 3, type: "Husky", src: "3.jpeg", round: 2 },
        { id: 8, type: "Wolf", src: "8.jpg", round: 2 },
        { id: 13, type: "Other", src: "13.jpg", round: 2 },
        { id: 15, type: "Other", src: "15.jpg", round: 2 }
    ],
    testData: [
        { id: 4, type: "Husky", aiGuess: "Chó Husky", correct: true, src: "4.jpg" },
        { id: 9, type: "Wolf", aiGuess: "Chó Sói", correct: true, src: "9.avif" },
        { id: 5, type: "Husky", aiGuess: "Chó Husky", correct: true, src: "5.jpg" },
        { id: 10, type: "Wolf", aiGuess: "Chó Sói", correct: true, src: "10.jpg" },
        { id: 11, type: "Wolf", aiGuess: "Chó Sói", correct: true, src: "11.jpg" } // AI thinks this Husky is a Wolf
    ]
};

// DOM Elements
const states = {
    0: document.getElementById('state-0'),
    training: document.getElementById('state-training'),
    3: document.getElementById('state-3'),
    4: document.getElementById('state-4'),
    5: document.getElementById('state-5')
};
const btnNextStage = document.getElementById('btn-next-stage');
const progressIndicator = document.getElementById('progress-indicator');
const progressText = document.getElementById('progress-text');

// State Management
function hideAllStates() {
    Object.values(states).forEach(el => {
        if (el) el.classList.add('hidden');
    });
    btnNextStage.classList.add('scale-0', 'opacity-0');
}

function showState(id, updateProgress = true) {
    hideAllStates();
    if (id === 1 || id === 2) {
        states.training.classList.remove('hidden');
    } else {
        states[id].classList.remove('hidden');
    }
    
    if (updateProgress && id > 0) {
        progressIndicator.classList.remove('hidden');
        progressText.textContent = `Giai đoạn ${id}/5`;
    }
}

// --- STATE 0: Welcome ---
document.getElementById('btn-start').addEventListener('click', () => {
    gameEngine.currentState = 1;
    setupTrainingRound(1);
    showState(1);
});

// --- STATES 1 & 2: Training Rounds ---
let currentRoundData = [];
let currentTrainingItemIndex = 0;
let activeDraggedItem = null;
const btnSaveItem = document.getElementById('btn-save-item');
let hasGuidedRound1 = false;
let hasGuidedOther = false;
let totalHuskyDropped = 0;
let totalWolfDropped = 0;

function setupTrainingRound(roundNumber) {
    gameEngine.droppedCount = 0;
    currentTrainingItemIndex = 0;
    activeDraggedItem = null;
    document.getElementById('training-title').textContent = `Vòng Huấn Luyện ${roundNumber}`;
    
    document.getElementById('draggable-items-container').innerHTML = '';
    document.getElementById('husky-container').innerHTML = '';
    document.getElementById('wolf-container').innerHTML = '';
    document.getElementById('husky-counter').textContent = '0';
    document.getElementById('wolf-counter').textContent = '0';
    const otherCounter = document.getElementById('other-counter');
    if (otherCounter) otherCounter.textContent = '0';
    
    // Toggle 3rd dropzone for Round 2
    const dropzoneOther = document.getElementById('dropzone-other');
    const guideOther = document.getElementById('guide-other');
    if (dropzoneOther) {
        document.getElementById('other-container').innerHTML = '';
        if (roundNumber === 2) {
            dropzoneOther.classList.remove('hidden');
            if(guideOther) guideOther.classList.remove('hidden');
        } else {
            dropzoneOther.classList.add('hidden');
            if(guideOther) guideOther.classList.add('hidden');
        }
    }
    
    btnNextStage.classList.add('scale-0', 'opacity-0');
    if(btnSaveItem) btnSaveItem.classList.add('scale-0', 'opacity-0', 'pointer-events-none');

    currentRoundData = gameEngine.trainingData.filter(d => d.round === roundNumber);
    if (roundNumber === 2) {
        // Shuffle currentRoundData using Fisher-Yates
        for (let i = currentRoundData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentRoundData[i], currentRoundData[j]] = [currentRoundData[j], currentRoundData[i]];
        }
    }
    renderNextTrainingItem();
}

function renderNextTrainingItem() {
    const container = document.getElementById('draggable-items-container');
    container.innerHTML = '';
    
    // Render the whole stack
    currentRoundData.forEach((item, index) => {
        if (index < currentTrainingItemIndex) return; // already processed
        
        const div = document.createElement('div');
        const isTop = index === currentTrainingItemIndex;
        div.className = `draggable-item card-stack-item bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative group w-full max-w-[200px] ${isTop ? 'animate-fade-in' : ''}`;
        
        div.draggable = isTop; // Only top item is draggable
        div.dataset.id = item.id;
        div.dataset.type = item.type;
        
        // Stack visual styling
        const reverseIndex = currentRoundData.length - index;
        div.style.zIndex = reverseIndex;
        if (!isTop) {
            const rotation = (Math.random() * 14 - 7) + 'deg';
            const offset = (Math.random() * 10 - 5) + 'px';
            div.style.transform = `rotate(${rotation}) translate(${offset}, ${offset}) scale(0.95)`;
            div.style.pointerEvents = 'none'; // Only interact with top
        } else {
            div.style.transform = `rotate(0deg) translate(0, 0) scale(1)`;
        }
        
        div.innerHTML = `
            <img src="${item.src}" alt="Image" class="w-full h-40 md:h-48 object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300">
            <div class="scan-laser absolute inset-x-0 h-1 bg-teal-400 shadow-[0_0_15px_3px_rgba(45,212,191,0.8)] z-10 hidden"></div>
            <div class="scan-overlay absolute inset-0 bg-black/80 hidden flex-col items-center justify-center z-0 overflow-hidden">
                <i class="ph-duotone ph-cpu text-3xl text-teal-400 animate-pulse mb-1 relative z-10"></i>
                <span class="text-teal-400 font-mono text-xs font-bold animate-pulse text-center relative z-10">Đang mã hóa...</span>
            </div>
        `;
        
        div.addEventListener('dragstart', (e) => {
            if(!div.draggable) return;
            e.dataTransfer.setData('text/plain', item.id);
            setTimeout(() => div.classList.add('opacity-50'), 0);
        });
        
        div.addEventListener('dragend', () => {
            div.classList.remove('opacity-50');
        });
        
        container.appendChild(div);
    });
    
    // Tutorial Overlays (for the top item)
    if (currentTrainingItemIndex < currentRoundData.length) {
        const item = currentRoundData[currentTrainingItemIndex];
        const tutorialHand = document.getElementById('tutorial-hand');
        const tutorialOther = document.getElementById('tutorial-other');
        
        if (tutorialHand) {
            tutorialHand.classList.add('hidden');
            tutorialHand.classList.remove('animate-tutorial-left', 'animate-tutorial-right');
        }
        if (tutorialOther) tutorialOther.classList.add('hidden');
        
        if (!hasGuidedRound1 && gameEngine.currentState === 1 && currentTrainingItemIndex === 0) {
            if (tutorialHand) {
                tutorialHand.classList.remove('hidden');
                if (item.type === 'Husky') tutorialHand.classList.add('animate-tutorial-left');
                else tutorialHand.classList.add('animate-tutorial-right');
            }
        }
        
        if (!hasGuidedOther && gameEngine.currentState === 2 && item.type === 'Other') {
            if (tutorialOther) tutorialOther.classList.remove('hidden');
        }
    }
}

// Dropzone setup
const dropzones = [
    { el: document.getElementById('dropzone-husky'), targetContainer: document.getElementById('husky-container'), expectedType: 'Husky' },
    { el: document.getElementById('dropzone-wolf'), targetContainer: document.getElementById('wolf-container'), expectedType: 'Wolf' },
    { el: document.getElementById('dropzone-other'), targetContainer: document.getElementById('other-container'), expectedType: 'Other' }
];

dropzones.forEach(zone => {
    zone.el.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.el.classList.add('dropzone-active');
    });
    
    zone.el.addEventListener('dragleave', () => {
        zone.el.classList.remove('dropzone-active');
    });
    
    zone.el.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.el.classList.remove('dropzone-active');
        
        const id = e.dataTransfer.getData('text/plain');
        const itemEl = document.querySelector(`.draggable-item[data-id="${id}"]`);
        
        if (!itemEl) return;
        
        const itemType = itemEl.dataset.type;
        
        // Enforce warning for 'Other' dropped in 'Husky'/'Wolf'
        if (itemType === 'Other' && (zone.expectedType === 'Husky' || zone.expectedType === 'Wolf')) {
            const warningModal = document.getElementById('warning-modal');
            const modalContent = document.getElementById('warning-modal-content');
            
            warningModal.classList.remove('hidden');
            setTimeout(() => {
                warningModal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }, 10);
            
            // Reject drop
            itemEl.classList.add('animate-pulse', 'bg-red-50', 'border-red-500');
            setTimeout(() => {
                itemEl.classList.remove('animate-pulse', 'bg-red-50', 'border-red-500');
            }, 800);
            return;
        }

        // Tutorial Enforcement
        let isEnforcing = false;
        if (!hasGuidedRound1 && gameEngine.currentState === 1 && currentTrainingItemIndex === 0) {
            isEnforcing = true;
        }
        if (!hasGuidedOther && gameEngine.currentState === 2 && itemType === 'Other') {
            isEnforcing = true;
        }
        
        if (isEnforcing && itemType !== zone.expectedType) {
            // Incorrect placement during tutorial - Reject
            itemEl.classList.add('animate-pulse', 'bg-red-50', 'border-red-500');
            setTimeout(() => {
                itemEl.classList.remove('animate-pulse', 'bg-red-50', 'border-red-500');
            }, 800);
            return;
        }
        
        // Clear guides if dropped correctly
        if (!hasGuidedRound1 && gameEngine.currentState === 1 && currentTrainingItemIndex === 0) {
            hasGuidedRound1 = true;
            document.getElementById('tutorial-hand')?.classList.add('hidden');
        }
        if (!hasGuidedOther && gameEngine.currentState === 2 && itemType === 'Other') {
            hasGuidedOther = true;
            document.getElementById('tutorial-other')?.classList.add('hidden');
        }
        
        // Unconditional placement
        zone.targetContainer.appendChild(itemEl);
        // Do not remove draggable-item so user can change mind
        itemEl.classList.add('scale-100');
        
        // Store active item and show Save button
        activeDraggedItem = itemEl;
        btnSaveItem.classList.remove('scale-0', 'opacity-0', 'pointer-events-none');
    });
});

if (btnSaveItem) {
    btnSaveItem.addEventListener('click', () => {
        if (!activeDraggedItem) return;
        
        // Lock the item permanently
        activeDraggedItem.draggable = false;
        activeDraggedItem.classList.remove('draggable-item');
        activeDraggedItem.classList.add('cursor-default');
        
        // Hide button
        btnSaveItem.classList.add('scale-0', 'opacity-0', 'pointer-events-none');
        
        // Track stats for anti-cheat
        if (activeDraggedItem.parentNode.id === 'husky-container') {
            totalHuskyDropped++;
        } else if (activeDraggedItem.parentNode.id === 'wolf-container') {
            totalWolfDropped++;
        }
        
        // Start Teleport Suck Animation
        activeDraggedItem.classList.add('animate-teleport-suck');
        
        const consoleText = document.getElementById('coding-console-text');
        
        // Binary animation on the console
        const binaryInterval = setInterval(() => {
            if (consoleText) {
                let randomBinary = '';
                for (let i = 0; i < 200; i++) {
                    randomBinary += Math.round(Math.random()) + ' ';
                }
                consoleText.textContent = randomBinary;
            }
        }, 50);
        
        setTimeout(() => {
            clearInterval(binaryInterval);
            if (consoleText) consoleText.textContent = "// Đã nạp thành công vào hệ thống.";
            
            // Increment counters
            if (activeDraggedItem.parentNode.id === 'husky-container') {
                const counter = document.getElementById('husky-counter');
                if(counter) counter.textContent = parseInt(counter.textContent) + 1;
            } else if (activeDraggedItem.parentNode.id === 'wolf-container') {
                const counter = document.getElementById('wolf-counter');
                if(counter) counter.textContent = parseInt(counter.textContent) + 1;
            } else if (activeDraggedItem.parentNode.id === 'other-container') {
                const counter = document.getElementById('other-counter');
                if(counter) counter.textContent = parseInt(counter.textContent) + 1;
            }
            
            // Remove item completely
            activeDraggedItem.remove();
            activeDraggedItem = null;
            
            gameEngine.droppedCount++;
            currentTrainingItemIndex++;
            
            if (gameEngine.droppedCount === currentRoundData.length) {
                btnNextStage.classList.remove('scale-0', 'opacity-0');
            } else {
                // Reveal the next item in the stack
                renderNextTrainingItem();
            }
        }, 600); // matching teleport-suck duration
    });
}

// Warning modal close
const btnWarningClose = document.getElementById('btn-warning-close');
const warningModal = document.getElementById('warning-modal');
const modalContent = document.getElementById('warning-modal-content');

if (btnWarningClose) {
    btnWarningClose.addEventListener('click', () => {
        warningModal.classList.add('opacity-0');
        if (modalContent) {
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
        }
        setTimeout(() => {
            warningModal.classList.add('hidden');
        }, 300);
    });
}

// Next Stage Button Logic
btnNextStage.addEventListener('click', () => {
    if (gameEngine.currentState === 1) {
        gameEngine.currentState = 2;
        setupTrainingRound(2);
        showState(2);
    } else if (gameEngine.currentState === 2) {
        // Anti-cheat check
        if (totalWolfDropped === 0) {
            showSystemError("Lỗi không nhận diện được bất kỳ cá thể chó Sói nào!");
            return;
        }
        if (totalHuskyDropped === 0) {
            showSystemError("Lỗi không nhận diện được bất kỳ cá thể chó Husky nào!");
            return;
        }
        
        gameEngine.currentState = 3;
        showState(3);
        startAutoRun();
    } else if (gameEngine.currentState === 3) {
        gameEngine.currentState = 4;
        showState(4);
        showNewsSequence();
    }
});

// System Error Modal Logic
const systemErrorModal = document.getElementById('system-error-modal');
const systemErrorText = document.getElementById('system-error-text');
const btnSystemErrorRestart = document.getElementById('btn-system-error-restart');

function showSystemError(message) {
    if(systemErrorText) systemErrorText.textContent = message;
    if(systemErrorModal) {
        systemErrorModal.classList.remove('hidden');
        setTimeout(() => {
            systemErrorModal.classList.remove('opacity-0');
            const content = document.getElementById('system-error-content');
            if(content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        }, 10);
    }
}

if (btnSystemErrorRestart) {
    btnSystemErrorRestart.addEventListener('click', () => {
        // Hide modal
        if(systemErrorModal) {
            systemErrorModal.classList.add('opacity-0');
            const content = document.getElementById('system-error-content');
            if(content) {
                content.classList.remove('scale-100');
                content.classList.add('scale-95');
            }
            setTimeout(() => {
                systemErrorModal.classList.add('hidden');
            }, 300);
        }
        
        // Restart back to Round 1
        totalHuskyDropped = 0;
        totalWolfDropped = 0;
        gameEngine.currentState = 1;
        setupTrainingRound(1);
        showState(1);
    });
}


// --- STATE 3: AI Auto-Run ---
async function startAutoRun() {
    btnNextStage.classList.add('scale-0', 'opacity-0');
    let huskyCount = 0;
    let wolfCount = 0;
    const huskyCountEl = document.getElementById('ai-count-husky');
    const wolfCountEl = document.getElementById('ai-count-wolf');
    
    const currentItemBox = document.getElementById('ai-current-item');
    const currentImg = currentItemBox.querySelector('img');
    const badge = document.getElementById('ai-prediction-badge');
    const laser = document.getElementById('ai-scanner-laser');
    const errorOverlay = document.getElementById('ai-error-overlay');
    
    const progressBar = document.getElementById('ai-progress-bar');
    const progressText = document.getElementById('ai-progress-text');
    const consoleText = document.getElementById('ai-console-text');
    const aiCoreIcon = document.getElementById('ai-core-icon');
    
    // Reset visuals
    huskyCountEl.textContent = '0';
    wolfCountEl.textContent = '0';
    errorOverlay.classList.add('hidden');
    
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    if (aiCoreIcon) aiCoreIcon.classList.add('animate-core-pulse');
    
    const binaryInterval = setInterval(() => {
        if (consoleText) {
            let randomBinary = '';
            for (let i = 0; i < 200; i++) {
                randomBinary += Math.round(Math.random()) + ' ';
            }
            consoleText.textContent = randomBinary;
        }
    }, 50);
    
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < gameEngine.testData.length; i++) {
        const data = gameEngine.testData[i];
        
        // Show item
        currentImg.src = data.src;
        currentItemBox.classList.remove('scale-0', 'opacity-0');
        currentItemBox.classList.add('scale-100', 'opacity-100');
        badge.classList.add('hidden');
        currentItemBox.className = "relative z-10 w-48 h-48 rounded-2xl bg-white shadow-xl border-4 border-transparent overflow-hidden transform transition-all duration-500 flex-shrink-0 flex flex-col scale-100 opacity-100";
        
        const currentProgress = Math.round((i / gameEngine.testData.length) * 100);
        if (progressBar) progressBar.style.width = `${currentProgress}%`;
        if (progressText) progressText.textContent = `${currentProgress}%`;

        
        await delay(500);
        
        // Scan animation
        laser.classList.remove('hidden');
        laser.style.animation = 'scan 1.5s linear forwards';
        
        await delay(1500);
        
        // Stop scan
        laser.classList.add('hidden');
        laser.style.animation = 'none';
        
        // Show prediction badge
        badge.textContent = data.aiGuess;
        badge.classList.remove('hidden', 'bg-blue-500', 'bg-slate-700', 'bg-red-600');
        
        if (data.correct) {
            if (data.type === 'Husky') {
                badge.classList.add('bg-blue-500');
                huskyCount++;
                huskyCountEl.textContent = huskyCount;
                currentItemBox.classList.add('border-blue-400');
            } else {
                badge.classList.add('bg-slate-700');
                wolfCount++;
                wolfCountEl.textContent = wolfCount;
                currentItemBox.classList.add('border-slate-400');
            }
            await delay(1000);
            // Hide for next item
            currentItemBox.classList.remove('scale-100', 'opacity-100');
            currentItemBox.classList.add('scale-0', 'opacity-0');
            await delay(300);
        }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = '100%';
    clearInterval(binaryInterval);
    if (consoleText) consoleText.textContent = "// Hoàn tất phân tích dữ liệu.";
    const aiCoreIcon = document.getElementById('ai-core-icon');
    if (aiCoreIcon) aiCoreIcon.classList.remove('animate-core-pulse');

    // Set data for LIME (State 5) using the misclassified image
    document.getElementById('lime-base-img').src = "11.jpg";

    // Auto transition to State 4 after all tests complete successfully
    await delay(1000);
    gameEngine.currentState = 4;
    showState(4);
    showNewsSequence();
}


// --- STATE 4: News Sequence ---
async function showNewsSequence() {
    const btnLime = document.getElementById('btn-next-lime');
    const article1 = document.getElementById('article-1');
    const article2 = document.getElementById('article-2');
    
    btnLime.classList.add('hidden', 'opacity-0', 'pointer-events-none');
    if(article1) article1.classList.add('scale-0', 'opacity-0');
    if(article2) article2.classList.add('scale-0', 'opacity-0');
    
    // Article 1 appears after 2 seconds
    setTimeout(() => {
        if(article1) article1.classList.remove('scale-0', 'opacity-0');
    }, 2000);
    
    // Article 2 appears after 4 more seconds (6s total)
    setTimeout(() => {
        if(article2) article2.classList.remove('scale-0', 'opacity-0');
    }, 6000);
    
    // Show the button after Article 2
    setTimeout(() => {
        btnLime.classList.remove('hidden');
        setTimeout(() => {
            btnLime.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
        }, 50);
    }, 8000);
}

document.getElementById('btn-next-lime').addEventListener('click', () => {
    gameEngine.currentState = 5;
    showState(5);
    // Reset LIME
    document.getElementById('lime-slider').value = 0;
    updateLime(0);
    document.getElementById('lime-conclusion').classList.remove('opacity-100', 'translate-x-0');
    document.getElementById('lime-conclusion').classList.add('opacity-0', 'translate-x-8');
});


// --- STATE 5: LIME Slider ---
const limeSlider = document.getElementById('lime-slider');
const limeHeatmap = document.getElementById('lime-heatmap');
const limeFocusBox = document.getElementById('lime-focus-box');
const limeConclusion = document.getElementById('lime-conclusion');

function updateLime(value) {
    // value goes from 0 to 100
    const opacity = value / 100;
    limeHeatmap.style.opacity = opacity;
    limeFocusBox.style.opacity = opacity > 0.3 ? opacity : 0;
    
    if (value > 80) {
        limeConclusion.classList.remove('opacity-0', 'translate-x-8');
        limeConclusion.classList.add('opacity-100', 'translate-x-0');
    }
}

limeSlider.addEventListener('input', (e) => {
    updateLime(e.target.value);
});

// Restart Game
document.getElementById('btn-restart').addEventListener('click', () => {
    totalHuskyDropped = 0;
    totalWolfDropped = 0;
    gameEngine.currentState = 0;
    showState(0, false);
    progressIndicator.classList.add('hidden');
});

// True Meaning Modal Logic
const btnShowMeaning = document.getElementById('btn-show-meaning');
const btnCloseMeaning = document.getElementById('btn-close-meaning');
const trueMeaningModal = document.getElementById('true-meaning-modal');
const trueMeaningContent = document.getElementById('true-meaning-content');
const btnRestart = document.getElementById('btn-restart');

if (btnShowMeaning) {
    btnShowMeaning.addEventListener('click', () => {
        trueMeaningModal.classList.remove('hidden');
        setTimeout(() => {
            trueMeaningModal.classList.remove('opacity-0');
            trueMeaningContent.classList.remove('scale-95');
            trueMeaningContent.classList.add('scale-100');
        }, 10);
    });
}

if (btnCloseMeaning) {
    btnCloseMeaning.addEventListener('click', () => {
        trueMeaningModal.classList.add('opacity-0');
        trueMeaningContent.classList.remove('scale-100');
        trueMeaningContent.classList.add('scale-95');
        setTimeout(() => {
            trueMeaningModal.classList.add('hidden');
        }, 300);
        
        // Unlock restart button
        if (btnRestart) {
            btnRestart.classList.remove('opacity-50', 'pointer-events-none');
        }
    });
}
