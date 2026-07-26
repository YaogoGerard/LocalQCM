/* =============================================
   LOCAL QCM — Serveur de jeu (page lancer.html)
   Cree un salon PeerJS, gere les joueurs,
   diffuse les questions et le classement
   ============================================= */

/* ─── Variables d'etat ─── */
let quizData = null
let gamePIN = ''
let currentQuestion = 0
let scores = {}
let peer = null
let connections = []
let timerInterval = null
let timerSeconds = 15
let questionStartTime = 0

/* ─── References DOM ─── */
const $ = id => document.getElementById(id)
const stepUpload = $('stepUpload')
const stepLobby = $('stepLobby')
const stepPlaying = $('stepPlaying')
const stepResults = $('stepResults')
const uploadZone = $('uploadZone')
const fileInput = $('fileInput')
const qrContainer = $('qrCodeContainer')
const pinCode = $('pinCode')
const playerList = $('playerList')
const playerCount = $('playerCount')
const startGameBtn = $('startGameBtn')
const qCounter = $('qCounter')
const timerDisplay = $('timerDisplay')
const questionText = $('questionText')
const gameAnswers = $('gameAnswers')
const nextBtn = $('nextBtn')
const gameStats = $('gameStats')
const correctCount = $('correctCount')
const podium = $('podium')
const scoreBody = $('scoreBody')
const newGameBtn = $('newGameBtn')

/* ─── Import du fichier JSON ─── */

uploadZone.addEventListener('click', () => fileInput.click())

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  uploadZone.classList.add('dragover')
})

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover')
})

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault()
  uploadZone.classList.remove('dragover')
  const file = e.dataTransfer.files[0]
  if (file) handleFile(file)
})

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) handleFile(file)
})

function handleFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        alert('Format JSON invalide. Le fichier doit contenir un tableau "questions" non vide.')
        return
      }
      quizData = data
      startLobby()
    } catch {
      alert('Fichier JSON invalide.')
    }
  }
  reader.readAsText(file)
}

/* ─── Salon d'attente (lobby) ─── */

function startLobby() {
  gamePIN = Math.floor(1000 + Math.random() * 9000).toString()
  pinCode.textContent = gamePIN
  initPeer()
  generateQR()
  showStep(stepLobby)
}

function generateQR() {
  qrContainer.innerHTML = ''
  const base = window.location.origin
  const url = `${base}/?code=${gamePIN}`
  new QRCode(qrContainer, {
    text: url,
    width: 180,
    height: 180,
    colorDark: '#002e68',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  })
}

/* ─── PeerJS : serveur d'ecoute ─── */

function initPeer() {
  const peerId = 'localqcm-' + gamePIN
  peer = new Peer(peerId, {
    debug: 0
  })

  peer.on('open', () => {
    updatePlayerList()
  })

  peer.on('connection', (conn) => {
    conn.on('data', (data) => {
      handlePlayerMessage(conn, data)
    })
    connections.push(conn)
    updatePlayerList()
  })

  peer.on('error', () => {
    startGameBtn.disabled = false
  })
}

function handlePlayerMessage(conn, data) {
  if (data.type === 'join') {
    scores[conn.peer] = { name: data.name, score: 0, answers: [] }
    updatePlayerList()
  }

  if (data.type === 'answer') {
    if (scores[conn.peer]) {
      const elapsed = Date.now() - questionStartTime
      const maxTime = timerSeconds * 1000
      const raw = Math.round(10 * (1 - elapsed / maxTime))
      const pts = Math.max(0, Math.min(10, raw))

      scores[conn.peer].answers[currentQuestion] = {
        questionIndex: currentQuestion,
        answerIndex: data.answerIndex,
        responseTime: elapsed,
        points: pts
      }

      const q = quizData.questions[currentQuestion]
      const correct = q.answers.findIndex(a => a.correct) === data.answerIndex
      let totalScore = 0
      let correctCount = 0
      for (let i = 0; i < quizData.questions.length; i++) {
        const a = scores[conn.peer].answers[i]
        if (a) {
          const qq = quizData.questions[i]
          const isCorrect = qq.answers.findIndex(x => x.correct) === a.answerIndex
          const earned = isCorrect ? a.points : 0
          totalScore += earned
          if (isCorrect) correctCount++
        }
      }
      scores[conn.peer].score = totalScore
      scores[conn.peer].correctCount = correctCount
    }
  }
}

function broadcast(data) {
  connections.forEach(conn => {
    try { conn.send(data) } catch {}
  })
}

function updatePlayerList() {
  const names = Object.values(scores).map(s => s.name)
  playerList.innerHTML = names.length
    ? names.map(n => `<li>${n}</li>`).join('')
    : '<li class="player-empty">En attente de joueurs...</li>'
  playerCount.textContent = names.length
  startGameBtn.disabled = names.length < 1
}

/* ─── Deroulement de la partie ─── */

startGameBtn.addEventListener('click', () => {
  currentQuestion = 0
  broadcast({ type: 'start', total: quizData.questions.length })
  showQuestion()
  showStep(stepPlaying)
})

function showQuestion() {
  const q = quizData.questions[currentQuestion]
  qCounter.textContent = `Question ${currentQuestion + 1} / ${quizData.questions.length}`
  questionText.textContent = q.text

  gameAnswers.innerHTML = q.answers.map((a, i) =>
    `<button class="game-answer" data-index="${i}">${String.fromCharCode(65 + i)}. ${a.text}</button>`
  ).join('')

  nextBtn.style.display = 'none'
  gameStats.style.display = 'none'
  questionStartTime = Date.now()

  broadcast({ type: 'question', question: q, index: currentQuestion })

  startTimer(15)
}

function startTimer(seconds) {
  clearInterval(timerInterval)
  timerSeconds = seconds
  timerDisplay.textContent = `${seconds}s`
  timerDisplay.classList.remove('warning')

  timerInterval = setInterval(() => {
    timerSeconds--
    timerDisplay.textContent = `${timerSeconds}s`
    if (timerSeconds <= 5) timerDisplay.classList.add('warning')
    if (timerSeconds <= 0) {
      clearInterval(timerInterval)
      revealAnswer()
    }
  }, 1000)
}

function revealAnswer() {
  clearInterval(timerInterval)

  const q = quizData.questions[currentQuestion]
  const correctIndex = q.answers.findIndex(a => a.correct)

  const buttons = gameAnswers.querySelectorAll('.game-answer')
  buttons.forEach((btn, i) => {
    btn.disabled = true
    if (i === correctIndex) btn.classList.add('reveal-correct')
  })

  nextBtn.style.display = 'inline-flex'
  broadcast({ type: 'reveal', correctIndex })

  const total = Object.keys(scores).length
  const corrects = Object.values(scores).filter(s => {
    const a = s.answers[currentQuestion]
    if (!a) return false
    const qq = quizData.questions[currentQuestion]
    return qq.answers.findIndex(x => x.correct) === a.answerIndex
  }).length

  correctCount.textContent = corrects
  gameStats.style.display = 'block'
}

nextBtn.addEventListener('click', () => {
  currentQuestion++
  if (currentQuestion < quizData.questions.length) {
    showQuestion()
  } else {
    showResults()
  }
})

/* ─── Resultats finaux ─── */

function showResults() {
  clearInterval(timerInterval)
  showStep(stepResults)

  const withAvg = Object.entries(scores).map(([id, s]) => {
    const correctAnswers = quizData.questions.map((q, i) => {
      const a = s.answers[i]
      if (!a) return null
      const isCorrect = q.answers.findIndex(x => x.correct) === a.answerIndex
      return isCorrect ? a.responseTime : null
    }).filter(t => t !== null)
    const avgTime = correctAnswers.length
      ? correctAnswers.reduce((sum, t) => sum + t, 0) / correctAnswers.length
      : Infinity
    return { id, ...s, avgTime }
  })

  const sorted = withAvg.sort((a, b) =>
    b.score - a.score || a.avgTime - b.avgTime
  )

  podium.innerHTML = sorted.slice(0, 3).map((s, i) => {
    const cls = ['gold', 'silver', 'bronze'][i] || ''
    const medal = ['1er', '2e', '3e'][i] || ''
    return `
      <div class="podium-item ${cls}">
        <div class="rank">${medal}</div>
        <div class="name">${s.name}</div>
        <div class="score">${s.score} pts</div>
      </div>
    `
  }).join('')

  scoreBody.innerHTML = sorted.map((s, i) =>
    `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.score} pts</td></tr>`
  ).join('')

  broadcast({ type: 'results', scores: Object.fromEntries(sorted.map(s => [s.id, { name: s.name, score: s.score }])) })
}

newGameBtn.addEventListener('click', () => {
  if (peer) peer.destroy()
  peer = null
  connections = []
  scores = {}
  currentQuestion = 0
  clearInterval(timerInterval)
  showStep(stepUpload)
})

/* ─── Utilitaires ─── */

function showStep(el) {
  ;[stepUpload, stepLobby, stepPlaying, stepResults].forEach(s => s.style.display = 'none')
  el.style.display = 'block'
}
