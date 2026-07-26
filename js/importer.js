/* =============================================
   LOCAL QCM — Import / Edition de quiz (page importer.html)
   Permet d'importer un fichier JSON, de le modifier
   et de l'exporter
   ============================================= */

/* ─── Donnees du quiz importe ─── */
let quizData = null

/* ─── References DOM ─── */
const uploadZone = document.getElementById('uploadZone')
const fileInput = document.getElementById('fileInput')
const editorSection = document.getElementById('editorSection')
const questionsList = document.getElementById('questionsList')
const quizTitle = document.getElementById('quizTitle')
const quizAuthor = document.getElementById('quizAuthor')
const addQuestionBtn = document.getElementById('addQuestionBtn')
const exportBtn = document.getElementById('exportBtn')

/* ─── Gestion du drag & drop ─── */

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

/* ─── Import du fichier JSON ─── */

function handleFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (!data.questions || !Array.isArray(data.questions)) {
        alert('Format JSON invalide. Le fichier doit contenir un tableau "questions".')
        return
      }
      quizData = data
      loadQuiz(data)
    } catch {
      alert('Fichier JSON invalide.')
    }
  }
  reader.readAsText(file)
}

function loadQuiz(data) {
  quizTitle.value = data.title || ''
  quizAuthor.value = data.author || ''
  renderQuestions(data.questions)
  uploadZone.style.display = 'none'
  editorSection.style.display = 'block'
}

/* ─── Utilitaires ─── */

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/* ─── Affichage des questions ─── */

function renderQuestions(questions) {
  questionsList.innerHTML = ''
  questions.forEach((q, i) => {
    const card = document.createElement('div')
    card.className = 'question-card'
    card.dataset.index = i
    card.innerHTML = `
      <div class="question-card-header">
        <span class="q-num">Question ${i + 1}</span>
        <div class="q-actions">
          <button class="btn-icon" onclick="deleteQuestion(${i})" title="Supprimer">X</button>
        </div>
      </div>
      <div class="input-group">
        <input type="text" class="q-text" value="${escapeHtml(q.text)}" placeholder="Intitulé de la question" onchange="updateQuestion(${i})">
      </div>
      <div class="answers-group" data-q="${i}">
        ${q.answers.map((a, j) => `
          <div class="answer-row">
            <div class="radio-marker ${a.correct ? 'correct' : ''}" data-q="${i}" data-a="${j}" onclick="toggleCorrect(${i}, ${j})">${a.correct ? '●' : ''}</div>
            <input type="text" value="${escapeHtml(a.text)}" placeholder="Réponse ${String.fromCharCode(65 + j)}" onchange="updateAnswer(${i}, ${j}, this.value)">
            <button class="btn-icon" onclick="deleteAnswer(${i}, ${j})" title="Supprimer">X</button>
          </div>
        `).join('')}
        <button class="add-answer-btn" onclick="addAnswer(${i})">+ Ajouter une réponse</button>
      </div>
    `
    questionsList.appendChild(card)
  })
}

/* ─── Sauvegarde des donnees ─── */

function saveCurrentData() {
  if (!quizData) return
  quizData.title = quizTitle.value
  quizData.author = quizAuthor.value
  const cards = questionsList.querySelectorAll('.question-card')
  cards.forEach((card, i) => {
    const textInput = card.querySelector('.q-text')
    if (textInput) quizData.questions[i].text = textInput.value
  })
}

function updateQuestion(index) {
  saveCurrentData()
}

/* ─── Gestion des reponses ─── */

function updateAnswer(qIndex, aIndex, value) {
  quizData.questions[qIndex].answers[aIndex].text = value
}

function toggleCorrect(qIndex, aIndex) {
  const answers = quizData.questions[qIndex].answers
  answers.forEach((a, i) => a.correct = i === aIndex)
  const card = questionsList.querySelectorAll('.question-card')[qIndex]
  const markers = card.querySelectorAll('.radio-marker')
  markers.forEach((m, i) => {
    m.classList.toggle('correct', i === aIndex)
    m.textContent = i === aIndex ? '●' : ''
  })
}

function deleteQuestion(index) {
  if (!confirm('Supprimer cette question ?')) return
  quizData.questions.splice(index, 1)
  renderQuestions(quizData.questions)
}

function addAnswer(qIndex) {
  quizData.questions[qIndex].answers.push({ text: '', correct: false })
  renderQuestions(quizData.questions)
}

function deleteAnswer(qIndex, aIndex) {
  const answers = quizData.questions[qIndex].answers
  if (answers.length <= 2) {
    alert('Une question doit avoir au moins 2 réponses.')
    return
  }
  answers.splice(aIndex, 1)
  renderQuestions(quizData.questions)
}

/* ─── Evenements ─── */

addQuestionBtn.addEventListener('click', () => {
  quizData.questions.push({
    text: '',
    answers: [
      { text: '', correct: true },
      { text: '', correct: false },
      { text: '', correct: false },
      { text: '', correct: false }
    ]
  })
  renderQuestions(quizData.questions)
})

exportBtn.addEventListener('click', () => {
  saveCurrentData()
  const blob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const fileName = (quizData.title || 'quiz').trim().replace(/ /g, '_')
  a.download = `${fileName}.json`
  a.click()
  URL.revokeObjectURL(url)
})
