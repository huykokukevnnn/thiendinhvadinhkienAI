// --- Audio System (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const SFX = {
    type: () => playTone(400 + Math.random()*50, 'sine', 0.04, 0.015),
    blip: () => playTone(800, 'sine', 0.1, 0.05),
    warp: () => playTone(300, 'triangle', 0.4, 0.1),
    error: () => playTone(150, 'sawtooth', 0.5, 0.1),
    siren: () => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1);
    }
};

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

// --- STATE 0: Welcome (Dialogue System) ---
const dialogueLines = [
    "Xin chào! Trung tâm cứu hộ vừa nhận được một lứa động vật mới.",
    "Trong đó, có rất nhiều chó Sói hoang dã và chó Husky nhà đang bị trộn lẫn với nhau.",
    "Chúng ta không thể phân loại bằng tay vì số lượng quá lớn.",
    "Bạn hãy giúp tôi huấn luyện Hệ thống AI Phân loại tự động nhé!",
    "Sau khi phân loại, chó Sói sẽ được thả thẳng về rừng tự nhiên, còn Husky sẽ được đem đi nhận nuôi."
];
let currentDialogueIdx = 0;
let isTyping = false;
const dialogueEl = document.getElementById('dialogue-text');
const btnNextDialogue = document.getElementById('btn-next-dialogue');
const btnStart = document.getElementById('btn-start');

async function typeWriter(text, element) {
    isTyping = true;
    element.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text.charAt(i);
        if (i % 2 === 0) SFX.type();
        await new Promise(r => setTimeout(r, 30));
    }
    isTyping = false;
}

function advanceDialogue() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isTyping) return; // Prevent skipping for now to ensure animation finishes
    
    if (currentDialogueIdx < dialogueLines.length) {
        typeWriter(dialogueLines[currentDialogueIdx], dialogueEl);
        currentDialogueIdx++;
        
        if (currentDialogueIdx === dialogueLines.length) {
            btnNextDialogue.classList.add('hidden');
            setTimeout(() => btnStart.classList.remove('hidden'), 500);
        }
    }
}

btnNextDialogue.addEventListener('click', advanceDialogue);
// Initialize first dialogue automatically
setTimeout(advanceDialogue, 500);

btnStart.addEventListener('click', () => {
    SFX.blip();
    
    // Play BGM
    const bgm = document.getElementById('bgm-loop');
    if (bgm) {
        bgm.volume = 0.4;
        bgm.play().catch(e => console.log("BGM play prevented by browser"));
    }
    
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
    
    // Typewriter for state 1 dialogue
    const state1Dialogue = document.getElementById('state-1-dialogue-text');
    if (state1Dialogue) {
        if (roundNumber === 1) {
            typeWriter("Hướng dẫn\nBạn hãy kéo thả hình vào nơi phù hợp\nHusky sẽ được trả về trung tâm bảo tồn\nSói sẽ được thả về tự nhiên", state1Dialogue);
        } else {
            typeWriter("Vòng Huấn Luyện 2\nĐộ khó tăng lên. Hãy cẩn thận với những sinh vật lạ không thuộc về rừng hay trung tâm bảo tồn!", state1Dialogue);
        }
    }
    
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
        div.className = `draggable-item card-stack-item bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden absolute group w-full max-w-[200px] ${isTop ? 'animate-fade-in' : ''}`;
        
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
        
        // Remove draggable constraint on drop so it snaps back if needed
        // but flex container naturally centers it now!
        
        // Store active item and show Save button
        activeDraggedItem = itemEl;
        btnSaveItem.classList.remove('scale-0', 'opacity-0', 'pointer-events-none');
        
        // Update button text and style dynamically
        if (targetZone === 'husky') {
            btnSaveItem.innerHTML = '<i class="ph-bold ph-house"></i> Nhận nuôi';
            btnSaveItem.className = 'w-full py-3 text-white font-bold rounded-xl text-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-2 bg-blue-600 hover:bg-blue-700';
        } else if (targetZone === 'wolf') {
            btnSaveItem.innerHTML = '<i class="ph-bold ph-tree-evergreen"></i> Thả về tự nhiên';
            btnSaveItem.className = 'w-full py-3 text-white font-bold rounded-xl text-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700';
        } else {
            btnSaveItem.innerHTML = '<i class="ph-bold ph-paper-plane-right"></i> Gửi';
            btnSaveItem.className = 'w-full py-3 text-white font-bold rounded-xl text-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-2 bg-amber-500 hover:bg-amber-600';
        }
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
        
        // Start Custom Animation based on zone
        if (typeof SFX !== 'undefined') SFX.warp();
        
        if (activeDraggedItem.parentNode.id === 'husky-container') {
            activeDraggedItem.classList.add('animate-walk-to-house');
        } else if (activeDraggedItem.parentNode.id === 'wolf-container') {
            activeDraggedItem.classList.add('animate-run-to-forest');
        } else {
            activeDraggedItem.classList.add('animate-teleport-suck');
        }
        
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
            
            // Move animation to respective side
            if (data.type === 'Husky') {
                currentItemBox.style.transform = "translateX(-150%) scale(0.2) rotate(-360deg)";
            } else {
                currentItemBox.style.transform = "translateX(150%) scale(0.2) rotate(360deg)";
            }
            currentItemBox.classList.add('opacity-0');
            
            await delay(500);
            // Hide for next item
            currentItemBox.classList.remove('scale-100', 'opacity-100');
            currentItemBox.classList.add('scale-0', 'opacity-0');
            currentItemBox.style.transform = "";
        }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = '100%';
    clearInterval(binaryInterval);
    if (consoleText) consoleText.textContent = "// Hoàn tất phân tích dữ liệu.";
    
    // Auto transition to State 4 after all tests complete successfully
    await delay(1000);
    
    // --- Cinematic Transition ---
    const overlay = document.createElement('div');
    overlay.className = 'cinematic-fade-overlay';
    overlay.innerHTML = '<div class="cinematic-text">2 Tuần Sau...</div>';
    document.body.appendChild(overlay);
    
    // Trigger fade in
    setTimeout(() => overlay.classList.add('active'), 100);
    SFX.warp();
    
    await delay(3000);
    
    gameEngine.currentState = 4;
    showState(4);
    
    // Fade out overlay
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 1500);
    
    showNewsSequence();
}


// --- STATE 4: News Sequence & Trust Meter ---
async function showNewsSequence() {
    const btnLime = document.getElementById('btn-next-lime');
    const article1 = document.getElementById('article-1');
    const article2 = document.getElementById('article-2');
    
    const trustBar = document.getElementById('trust-bar');
    const trustPercentage = document.getElementById('trust-percentage');
    const trustWarning = document.getElementById('trust-warning');
    
    // Stop normal BGM smoothly
    const bgm = document.getElementById('bgm-loop');
    const bgmIntense = document.getElementById('bgm-intense');
    
    if (bgm) {
        let vol = bgm.volume;
        const fadeOut = setInterval(() => {
            if (vol > 0.05) {
                vol -= 0.05;
                bgm.volume = vol;
            } else {
                clearInterval(fadeOut);
                bgm.pause();
            }
        }, 100);
    }
    
    // Reset states
    if (article1) {
        article1.classList.remove('scale-100', 'opacity-100');
        article1.classList.add('scale-0', 'opacity-0');
    }
    if (article2) {
        article2.classList.remove('scale-100', 'opacity-100');
        article2.classList.add('scale-0', 'opacity-0');
    }
    if (btnLime) btnLime.classList.add('hidden');
    
    if (trustBar) {
        trustBar.style.width = '100%';
        trustBar.classList.remove('from-red-700', 'animate-pulse');
        trustBar.classList.add('from-red-500');
    }
    if (trustPercentage) {
        trustPercentage.textContent = '100%';
        trustPercentage.classList.remove('text-red-500');
    }
    if (trustWarning) trustWarning.classList.remove('opacity-100');
    
    // Show first article after 2s
    await delay(2000);
    
    // Play intense BGM
    if (bgmIntense) {
        bgmIntense.volume = 0.5;
        bgmIntense.play().catch(e => console.log('BGM intense prevented'));
    }
    
    if (article1) {
        article1.classList.remove('scale-0', 'opacity-0');
        article1.classList.add('scale-100', 'opacity-100');
    }
    if (typeof SFX !== 'undefined') SFX.error();
    
    // Drop trust to 50%
    if (trustBar) trustBar.style.width = '50%';
    if (trustPercentage) trustPercentage.textContent = '50%';
    document.body.classList.add('animate-shake');
    setTimeout(() => document.body.classList.remove('animate-shake'), 500);
    
    // Show second article after 4s (total 6s from start)
    await delay(4000);
    if (article2) {
        article2.classList.remove('scale-0', 'opacity-0');
        article2.classList.add('scale-100', 'opacity-100');
    }
    if (typeof SFX !== 'undefined') {
        SFX.error();
        SFX.siren();
    }
    
    // Drop trust to CRITICAL
    if (trustBar) {
        trustBar.style.width = '10%';
        trustBar.classList.replace('from-red-500', 'from-red-700');
        trustBar.classList.add('animate-pulse');
    }
    if (trustPercentage) {
        trustPercentage.textContent = '10%';
        trustPercentage.classList.add('text-red-500');
    }
    if (trustWarning) trustWarning.classList.add('opacity-100');
    
    document.body.classList.add('animate-shake');
    setTimeout(() => document.body.classList.remove('animate-shake'), 500);
    
    // Show LIME button
    await delay(1000);
    if (btnLime) {
        btnLime.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        btnLime.classList.add('animate-bounce');
    }
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
