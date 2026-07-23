/* =============================================
   LOCAL QCM — Client etudiant (page index.html)
   Se connecte au professeur via PeerJS,
   repond aux questions et voit les resultats
   ============================================= */

/* ─── Variables d'etat ─── */
let conn = null
let peer = null
let pseudo = ''
let selectedIndex = -1
let hasAnswered = false
let myPeerId = ''
let totalQuestions = 0

/* ─── References DOM ─── */
const $ = id => document.getElementById(id)
const stepWait = $('stepWait')
const stepPlay = $('stepPlay')
const stepResults = $('stepResults')
const joinForm = $('joinForm')
const pseudoInput = $('pseudo')
const codeInput = $('code')
const joinError = $('joinError')
const heroContent = $('heroContent')
const heroJoin = $('heroJoin')
const studentGame = $('studentGame')
const qCounter = $('qCounter')
const questionText = $('questionText')
const gameAnswers = $('gameAnswers')
const gameFeedback = $('gameFeedback')
const finalScore = $('finalScore')
const finalRank = $('finalRank')
const resultsDetail = $('resultsDetail')

/* ─── Initialisation ─── */

// Pre-remplir le code depuis l'URL (scanne QR)
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.has('code')) {
  codeInput.value = urlParams.get('code')
}

// Intercepter la soumission du formulaire
joinForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const name = pseudoInput.value.trim()
  const code = codeInput.value.trim()
  if (!name || !code) return
  pseudo = name
  connectToHost(code)
})

/* ─── Connexion au professeur (PeerJS) ─── */

function connectToHost(code) {
  joinError.textContent = ''

  peer = new Peer(undefined, { debug: 0 })

  peer.on('open', (id) => {
    myPeerId = id
    conn = peer.connect('localqcm-' + code, {
      reliable: true
    })

    // Timeout de 8s si le prof ne repond pas
    const timeout = setTimeout(() => {
      joinError.textContent = 'Code invalide ou professeur indisponible.'
    }, 8000)

    conn.on('open', () => {
      clearTimeout(timeout)
      conn.send({ type: 'join', name: pseudo })
      // Basculer vers l'interface de jeu
      heroContent.style.display = 'none'
      heroJoin.style.display = 'none'
      studentGame.style.display = 'block'
      showStep(stepWait)
    })

    conn.on('data', (data) => {
      handleMessage(data)
    })

    conn.on('close', () => {
      joinError.textContent = 'Connexion perdue.'
      resetUI()
    })

    conn.on('error', () => {
      clearTimeout(timeout)
      joinError.textContent = 'Erreur de connexion au professeur.'
    })
  })

  peer.on('error', () => {
    joinError.textContent = 'Impossible de se connecter au reseau.'
  })
}

/* ─── Gestionnaire des messages du professeur ─── */

function handleMessage(data) {
  switch (data.type) {
    case 'start':
      totalQuestions = data.total
      showStep(stepPlay)
      break
    case 'question':
      showQuestion(data.question, data.index)
      break
    case 'reveal':
      revealAnswer(data.correctIndex)
      break
    case 'results':
      showResults(data.scores)
      break
  }
}

/* ─── Affichage d'une question ─── */

function showQuestion(question, index) {
  selectedIndex = -1
  hasAnswered = false

  qCounter.textContent = totalQuestions
    ? `Question ${index + 1} / ${totalQuestions}`
    : `Question ${index + 1}`

  questionText.textContent = question.text

  gameAnswers.innerHTML = question.answers.map((a, i) =>
    `<button class="game-answer" data-index="${i}">${String.fromCharCode(65 + i)}. ${a.text}</button>`
  ).join('')

  gameFeedback.textContent = ''

  gameAnswers.querySelectorAll('.game-answer').forEach((btn) => {
    btn.addEventListener('click', () => selectAnswer(btn))
  })
}

/* ─── Envoi de la reponse au professeur ─── */

function selectAnswer(btn) {
  if (hasAnswered) return
  hasAnswered = true
  selectedIndex = parseInt(btn.dataset.index)

  gameAnswers.querySelectorAll('.game-answer').forEach((b) => {
    b.classList.remove('selected')
    b.disabled = true
  })
  btn.classList.add('selected')

  conn.send({ type: 'answer', answerIndex: selectedIndex })
  gameFeedback.textContent = 'Reponse envoyee'
}

/* ─── Revelation de la bonne reponse ─── */

function revealAnswer(correctIndex) {
  gameAnswers.querySelectorAll('.game-answer').forEach((btn, i) => {
    btn.disabled = true
    if (i === correctIndex) {
      btn.classList.add('correct')
    } else if (i === selectedIndex && i !== correctIndex) {
      btn.classList.add('wrong')
    }
  })

  if (selectedIndex === correctIndex) {
    gameFeedback.textContent = 'Bonne reponse !'
    gameFeedback.style.color = '#0da528'
  } else if (selectedIndex === -1) {
    gameFeedback.textContent = 'Temps ecoule'
    gameFeedback.style.color = '#ef4444'
  } else {
    gameFeedback.textContent = 'Mauvaise reponse'
    gameFeedback.style.color = '#ef4444'
  }
}

/* ─── Resultats finaux ─── */

function showResults(scores) {
  const entries = Object.entries(scores)
  const myEntry = entries.find(([id]) => id === myPeerId)
  const myScore = myEntry ? myEntry[1].score : 0
  const myRank = entries.findIndex(([id]) => id === myPeerId) + 1

  finalScore.textContent = `${myScore} pts`
  finalRank.textContent = myRank
    ? `${myRank}e place sur ${entries.length} joueur(s)`
    : ''

  resultsDetail.innerHTML = `
    <table>
      <thead><tr><th>#</th><th>Joueur</th><th>Score</th></tr></thead>
      <tbody>
        ${entries.map(([id, s], i) =>
          `<tr class="${id === myPeerId ? 'me' : ''}">
            <td>${i + 1}</td>
            <td>${s.name}</td>
            <td>${s.score} pts</td>
          </tr>`
        ).join('')}
      </tbody>
    </table>
  `

  showStep(stepResults)
}

/* ─── Utilitaires d'affichage ─── */

function showStep(el) {
  ;[stepWait, stepPlay, stepResults].forEach(s => s.style.display = 'none')
  el.style.display = 'block'
}

function resetUI() {
  studentGame.style.display = 'none'
  heroContent.style.display = ''
  heroJoin.style.display = ''
  stepWait.style.display = 'none'
  stepPlay.style.display = 'none'
  stepResults.style.display = 'none'
}
