// Extra State (Squares & Cubes)
const state = {
    mode: 'squares', // 'squares' or 'cubes'
    unlockedSquares: parseInt(localStorage.getItem('unlocked_squares')) || 1,
    unlockedCubes: parseInt(localStorage.getItem('unlocked_cubes')) || 1,
    currentRange: 1, // Start/Current unit being learned
    currentScene: 'dashboard',
    quiz: {
        questions: [],
        currentIndex: 0,
        score: 0,
        total: 10
    }
};

// Config
const CONFIG = {
    squares: { max: 50, label: '²', color: '#1cb0f6' },
    cubes: { max: 30, label: '³', color: '#ffc800' }
};

// DOM
const scenes = {
    dashboard: document.getElementById('scene-dashboard'),
    learn: document.getElementById('scene-learn'),
    quiz: document.getElementById('scene-quiz'),
    success: document.getElementById('scene-success')
};
const header = document.getElementById('app-header');
const progressBar = document.getElementById('progress-bar');
const levelsContainer = document.getElementById('levels-container');
const feedbackFooter = document.getElementById('feedback-footer');

// Init
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupTabs();
    setupEventListeners();
});

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.mode = tab.dataset.mode;
            initDashboard();
        });
    });
}

function setupEventListeners() {
    document.getElementById('quit-btn').addEventListener('click', () => {
        goToScene('dashboard');
    });
    document.getElementById('start-practice-btn').addEventListener('click', startQuiz);
    document.getElementById('next-question-btn').addEventListener('click', handleNextQuestion);
    document.getElementById('continue-btn').addEventListener('click', () => goToScene('dashboard'));
}

function goToScene(sceneId) {
    state.currentScene = sceneId;
    Object.values(scenes).forEach(s => s.classList.remove('active'));
    scenes[sceneId].classList.add('active');
    
    const isDashboard = (sceneId === 'dashboard');
    header.style.display = isDashboard ? 'none' : 'flex';
    document.getElementById('back-to-tables').style.display = isDashboard ? 'flex' : 'none';
    
    if (isDashboard) initDashboard();
    feedbackFooter.classList.remove('active');
}

function initDashboard() {
    levelsContainer.innerHTML = '';
    const config = CONFIG[state.mode];
    const unlocked = (state.mode === 'squares') ? state.unlockedSquares : state.unlockedCubes;
    
    // We group levels into blocks of 5 or 10? No, let's keep it simple: individual levels
    for (let i = 1; i <= config.max; i++) {
        const isLocked = i > unlocked;
        const card = document.createElement('div');
        card.className = `level-card ${isLocked ? 'locked' : ''} ${i === unlocked ? 'active' : ''}`;
        card.style.borderColor = isLocked ? '#e5e5e5' : config.color;
        
        card.innerHTML = `
            <div class="level-number">${i}${config.label}</div>
            <div class="level-label">${isLocked ? 'Locked' : 'Learn'}</div>
        `;
        
        if (!isLocked) card.addEventListener('click', () => startLearn(i));
        levelsContainer.appendChild(card);
    }
}

function startLearn(num) {
    state.currentRange = num;
    const config = CONFIG[state.mode];
    document.getElementById('learn-title').innerText = `${state.mode.charAt(0).toUpperCase() + state.mode.slice(1)}: ${num}${config.label}`;
    
    const container = document.getElementById('learn-items-container');
    container.innerHTML = '';
    
    // Show a small range of 5 items starting from 'num'
    for (let i = num; i < num + 5 && i <= config.max; i++) {
        const val = (state.mode === 'squares') ? i*i : i*i*i;
        const item = document.createElement('div');
        item.className = 'table-row';
        item.style.fontSize = '24px';
        item.innerHTML = `${i}${config.label} = <strong>${val}</strong>`;
        container.appendChild(item);
    }
    
    goToScene('learn');
}

function startQuiz() {
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.questions = generateQuestions();
    goToScene('quiz');
    showQuestion();
}

function generateQuestions() {
    const questions = [];
    const config = CONFIG[state.mode];
    const base = state.currentRange;
    
    // Mix questions from current range and previous ones
    for (let i = 0; i < 10; i++) {
        const num = Math.max(1, Math.floor(Math.random() * (base + 4)) % config.max + 1);
        const ans = (state.mode === 'squares') ? num*num : num*num*num;
        questions.push({ num, ans });
    }
    return questions;
}

function showQuestion() {
    const q = state.quiz.questions[state.quiz.currentIndex];
    const config = CONFIG[state.mode];
    document.getElementById('quiz-question').innerText = `${q.num}${config.label} = ?`;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    const options = generateOptions(q.ans);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.addEventListener('click', () => checkAnswer(opt, btn));
        container.appendChild(btn);
    });

    updateProgress((state.quiz.currentIndex / state.quiz.total) * 100);
    feedbackFooter.classList.remove('active');
}

function generateOptions(correct) {
    const opts = new Set([correct]);
    while(opts.size < 4) {
        const off = Math.floor(Math.random() * 20) - 10;
        const fake = correct + off;
        if (fake > 0 && fake !== correct) opts.add(fake);
    }
    return Array.from(opts).sort(() => Math.random() - 0.5);
}

function checkAnswer(sel, btn) {
    const q = state.quiz.questions[state.quiz.currentIndex];
    const isCorrect = sel === q.ans;
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => b.style.pointerEvents = 'none');

    if (isCorrect) {
        state.quiz.score++;
        btn.classList.add('correct');
        showFeedback(true);
    } else {
        btn.classList.add('wrong');
        btns.forEach(b => { if(parseInt(b.innerText) === q.ans) b.classList.add('correct'); });
        showFeedback(false);
    }
}

function showFeedback(isCorrect) {
    const footer = feedbackFooter;
    footer.className = `feedback-footer active ${isCorrect ? 'correct' : 'wrong'}`;
    document.getElementById('feedback-title').innerText = isCorrect ? 'Perfect!' : 'Incorrect';
    const q = state.quiz.questions[state.quiz.currentIndex];
    const config = CONFIG[state.mode];
    document.getElementById('feedback-desc').innerText = `${q.num}${config.label} is ${q.ans}`;
    document.getElementById('feedback-icon').innerHTML = isCorrect ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
}

function handleNextQuestion() {
    state.quiz.currentIndex++;
    if (state.quiz.currentIndex < state.quiz.total) showQuestion();
    else finishQuiz();
}

function finishQuiz() {
    const passed = state.quiz.score >= 9; // High stakes for progress
    if (passed) {
        if (state.mode === 'squares') {
            if (state.currentRange === state.unlockedSquares && state.unlockedSquares < CONFIG.squares.max) {
                state.unlockedSquares++;
                localStorage.setItem('unlocked_squares', state.unlockedSquares);
            }
        } else {
            if (state.currentRange === state.unlockedCubes && state.unlockedCubes < CONFIG.cubes.max) {
                state.unlockedCubes++;
                localStorage.setItem('unlocked_cubes', state.unlockedCubes);
            }
        }
        goToScene('success');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
        alert(`Score: ${state.quiz.score}/10. Review the items again!`);
        startLearn(state.currentRange);
    }
}

function updateProgress(percent) {
    progressBar.style.width = percent + '%';
}
