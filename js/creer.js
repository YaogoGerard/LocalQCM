/* =============================================
   LOCAL QCM — Éditeur de quiz (page creer.html)
   Permet de creer un questionnaire de zero
   ============================================= */

/* ─── Donnees du quiz ─── */
const quizData = {
  title: '',
  author: '',
  questions: [
    {
      text: '',
      answers: [
        { text: '', correct: true },
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false }
      ]
    }
  ]
}

/* ─── References DOM ─── */
const quizTitle = document.getElementById('quizTitle')
const quizAuthor = document.getElementById('quizAuthor')
const questionsList = document.getElementById('questionsList')
const addQuestionBtn = document.getElementById('addQuestionBtn')
const exportBtn = document.getElementById('exportBtn')

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
        <input type="text" class="q-text" value="${escapeHtml(q.text)}" placeholder="Intitulé de la question" onchange="saveCurrentData()">
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

/* ─── Sauvegarde des donnees du formulaire ─── */

function saveCurrentData() {
  quizData.title = quizTitle.value
  quizData.author = quizAuthor.value
  const cards = questionsList.querySelectorAll('.question-card')
  cards.forEach((card, i) => {
    const textInput = card.querySelector('.q-text')
    if (textInput && quizData.questions[i]) quizData.questions[i].text = textInput.value
  })
}

/* ─── Gestion des reponses ─── */

function updateAnswer(qIndex, aIndex, value) {
  if (quizData.questions[qIndex]) quizData.questions[qIndex].answers[aIndex].text = value
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
  if (quizData.questions.length <= 1) {
    alert('Il doit y avoir au moins une question.')
    return
  }
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

/* ─── Initialisation ─── */
renderQuestions(quizData.questions)
