// Game State
const state = {
    unlockedLevel: parseInt(localStorage.getItem('tables_unlocked')) || 2,
    currentLevel: 2,
    currentScene: 'dashboard',
    settings: {
        unlockAll: localStorage.getItem('tables_unlock_all') === 'true',
        sequentialMode: localStorage.getItem('tables_sequential') === 'true'
    },
    quiz: {
        questions: [],
        currentIndex: 0,
        score: 0,
        total: 10
    }
};

// DOM Elements
const scenes = {
    dashboard: document.getElementById('scene-dashboard'),
    learn: document.getElementById('scene-learn'),
    quiz: document.getElementById('scene-quiz'),
    success: document.getElementById('scene-success')
};

const header = document.getElementById('app-header');
const progressBar = document.getElementById('progress-bar');
const feedbackFooter = document.getElementById('feedback-footer');
const levelsContainer = document.getElementById('levels-container');
const settingsModal = document.getElementById('settings-modal');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initSettingsValues();
    setupEventListeners();
});

function initSettingsValues() {
    document.getElementById('toggle-unlock-all').checked = state.settings.unlockAll;
    document.getElementById('toggle-sequential').checked = state.settings.sequentialMode;
}

function setupEventListeners() {
    // Settings toggles
    document.getElementById('toggle-unlock-all').addEventListener('change', (e) => {
        state.settings.unlockAll = e.target.checked;
        localStorage.setItem('tables_unlock_all', state.settings.unlockAll);
        initDashboard(); // Refresh levels
    });

    document.getElementById('toggle-sequential').addEventListener('change', (e) => {
        state.settings.sequentialMode = e.target.checked;
        localStorage.setItem('tables_sequential', state.settings.sequentialMode);
    });

    // Settings Modal
    document.getElementById('settings-open').addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    document.getElementById('settings-close').addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('active');
    });

    document.getElementById('quit-btn').addEventListener('click', () => {
        if(confirm('Quit current session?')) goToScene('dashboard');
    });

    document.getElementById('start-practice-btn').addEventListener('click', startQuiz);
    
    document.getElementById('next-question-btn').addEventListener('click', handleNextQuestion);
    
    document.getElementById('continue-btn').addEventListener('click', () => {
        goToScene('dashboard');
    });
}

// Navigation
function goToScene(sceneId) {
    state.currentScene = sceneId;
    
    // Hide all scenes
    Object.values(scenes).forEach(s => s.classList.remove('active'));
    
    // Show target scene
    scenes[sceneId].classList.add('active');
    
    // Header management
    if (sceneId === 'dashboard') {
        header.style.display = 'none';
        initDashboard();
    } else {
        header.style.display = 'flex';
        updateProgress(0);
    }

    feedbackFooter.classList.remove('active');
}

function updateProgress(percent) {
    progressBar.style.width = percent + '%';
}

// Dashboard Logic
function initDashboard() {
    levelsContainer.innerHTML = '';
    // Max level 20 as requested
    for (let i = 2; i <= 20; i++) {
        const isLocked = !state.settings.unlockAll && i > state.unlockedLevel;
        const levelCard = document.createElement('div');
        levelCard.className = `level-card ${isLocked ? 'locked' : ''} ${i === state.unlockedLevel ? 'active' : ''}`;
        
        levelCard.innerHTML = `
            <div class="level-number">${i}</div>
            <div class="level-label">${isLocked ? '<i class="fas fa-lock"></i> Locked' : 'Master It'}</div>
        `;
        
        if (!isLocked) {
            levelCard.addEventListener('click', () => startLearn(i));
        }
        
        levelsContainer.appendChild(levelCard);
    }
}

// Learn Logic
function startLearn(level) {
    state.currentLevel = level;
    document.getElementById('learn-title').innerText = `Table of ${level}`;
    const container = document.getElementById('learn-items-container');
    container.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerText = `${level} x ${i} = ${level * i}`;
        container.appendChild(row);
    }
    
    goToScene('learn');
}

// Quiz Logic
function startQuiz() {
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.questions = generateQuestions(state.currentLevel);
    
    goToScene('quiz');
    showQuestion();
}

function generateQuestions(level) {
    const questions = [];
    // Generate 10 questions for the current table
    for (let i = 1; i <= 10; i++) {
        questions.push({
            num1: level,
            num2: i,
            answer: level * i
        });
    }
    // Shuffle if not in sequential mode
    if (!state.settings.sequentialMode) {
        return questions.sort(() => Math.random() - 0.5);
    }
    return questions;
}

function showQuestion() {
    const q = state.quiz.questions[state.quiz.currentIndex];
    const questionEl = document.getElementById('quiz-question');
    questionEl.innerText = `${q.num1} x ${q.num2} = ?`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    const options = generateOptions(q.answer);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.addEventListener('click', () => checkAnswer(opt, btn));
        optionsContainer.appendChild(btn);
    });

    updateProgress((state.quiz.currentIndex / state.quiz.total) * 100);
    feedbackFooter.classList.remove('active');
}

function generateOptions(correct) {
    const options = new Set([correct]);
    while (options.size < 4) {
        // Random options near the correct answer or common mistakes
        const offset = Math.floor(Math.random() * 10) - 5;
        const fake = correct + offset;
        if (fake > 0 && fake !== correct) options.add(fake);
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
}

function checkAnswer(selected, btn) {
    const q = state.quiz.questions[state.quiz.currentIndex];
    const isCorrect = selected === q.answer;
    
    // UI Feedback
    const options = document.querySelectorAll('.option-btn');
    options.forEach(b => b.style.pointerEvents = 'none'); // Disable further clicks

    if (isCorrect) {
        state.quiz.score++;
        btn.classList.add('correct');
        showFeedback(true);
    } else {
        btn.classList.add('wrong');
        // Show correct one
        options.forEach(b => {
            if (parseInt(b.innerText) === q.answer) b.classList.add('correct');
        });
        showFeedback(false);
    }
}

function showFeedback(isCorrect) {
    const footer = feedbackFooter;
    const title = document.getElementById('feedback-title');
    const desc = document.getElementById('feedback-desc');
    const icon = document.getElementById('feedback-icon');
    const nextBtn = document.getElementById('next-question-btn');

    footer.className = `feedback-footer active ${isCorrect ? 'correct' : 'wrong'}`;
    
    if (isCorrect) {
        title.innerText = 'Excellent!';
        desc.innerText = 'You got it absolutely right.';
        icon.innerHTML = '<i class="fas fa-check"></i>';
        nextBtn.innerText = 'Continue';
        nextBtn.className = 'btn btn-primary';
    } else {
        const q = state.quiz.questions[state.quiz.currentIndex];
        title.innerText = 'Correct answer:';
        desc.innerText = `${q.num1} x ${q.num2} = ${q.answer}`;
        icon.innerHTML = '<i class="fas fa-times"></i>';
        nextBtn.innerText = 'Got it';
        nextBtn.className = 'btn btn-secondary';
        // Force the color to match the "wrong" state for the button if needed
        // but secondary (blue) is fine for "Got it"
    }
}

function handleNextQuestion() {
    state.quiz.currentIndex++;
    
    if (state.quiz.currentIndex < state.quiz.total) {
        showQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    updateProgress(100);
    
    const passThreshold = 10; // Must be perfect as requested "ekadam perfectly table Sikh Jana chahie"
    const passed = state.quiz.score >= passThreshold;
    
    if (passed) {
        // Unlock next level
        if (state.currentLevel === state.unlockedLevel && state.unlockedLevel < 20) {
            state.unlockedLevel++;
            localStorage.setItem('tables_unlocked', state.unlockedLevel);
        }
        
        document.getElementById('success-message').innerText = `Amazing! You've mastered the Table of ${state.currentLevel}.`;
        goToScene('success');
        
        // Confetti!
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#58cc02', '#1cb0f6', '#ffc800']
        });
    } else {
        // Failed -> Go back to learn
        alert(`You got ${state.quiz.score}/10. Keep practicing! Let's review the table again.`);
        startLearn(state.currentLevel);
    }
}
