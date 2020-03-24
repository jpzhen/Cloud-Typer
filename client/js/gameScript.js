let currentUser = sessionStorage.getItem('name');
console.log(sessionStorage.getItem('name'));
const RANDOM_QUOTE_API_URL = 'http://api.quotable.io/random';
const quoteDisplayElement = document.getElementById('quoteDisplay');
const quoteInputElement = document.getElementById('quoteInput');
const pointElement = document.getElementById('point');
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];

span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
} 

let compareQouteArray = null;
let intervalID = null;
let totalScore = 0;
let index = 0;
let lock = true;

quoteInputElement.addEventListener('input', () => {
  startTimer(lock);

  //Get the two array of the 
  const arrayQuote = quoteDisplayElement.querySelectorAll('span');
  const arrayChar = quoteInputElement.value.split('');

  
  // determine the end of the game
  let limit = compareQouteArray.join().length;
  let reach = arrayChar.length;
  
  //compare the word and reward the score
  const arrayWord = quoteInputElement.value.split(' ');
  let compareWord = compareQouteArray[index];
  let word = arrayWord[arrayWord.length - 1];
  console.log(compareWord);
  console.log(word);
  if (compareWord == word) {
    totalScore++;
    index++;
    pointElement.innerHTML = totalScore;
  }

  let correct = true
  arrayQuote.forEach((characterSpan, index) => {
    const character = arrayChar[index];
    if (character == null) {
      characterSpan.classList.remove('correct');
      characterSpan.classList.remove('incorrect');
      correct = false;
    }
    else if (character === characterSpan.innerText) {
      characterSpan.classList.add('correct');
      characterSpan.classList.remove('incorrect');
    }
    else {
      characterSpan.classList.remove('correct');
      characterSpan.classList.add('incorrect');
      correct = false;
    }
  })
  if (correct || limit <= reach) renderNewQuote();
})

function getRandomQuote() {
  return fetch(RANDOM_QUOTE_API_URL)
    .then(response => response.json())
    .then(data => data.content)
}

async function renderNewQuote() {
  const quote = await getRandomQuote();
  compareQouteArray = quote.split(' ');
  index = 0;
  quoteDisplayElement.innerHTML = '';
  quote.split('').forEach(character => {
    const characterSpan = document.createElement('span');
    characterSpan.innerText = character;
    quoteDisplayElement.appendChild(characterSpan);
  })
  quoteInputElement.value = null;
}

const timerElement = document.getElementById('timer');
let startTime;
function startTimer() {
  if (lock) {
    lock = false;
    timerElement.innerText = 0;
    startTime = new Date();
    intervalID = setInterval(() => {
      let currentTime = getTimerTime()
      timer.innerText = currentTime;
      if (currentTime === 60) {
        endGame()
      }
    }, 1000)
  }
}

async function endGame() {
  clearInterval(intervalID);
  document.getElementById("quoteInput").readOnly = true; 
  let modalText = document.getElementById('modalText');
  let points = document.getElementById('point').innerHTML;
  modalText.innerHTML = "You're score is: " + points + " WPM";
  modal.style.display = "block";
  player = {
    email: currentUser,
    score: parseInt(points)
  }
  console.log(player);
  axios.post('http://cloudtype.us-west-2.elasticbeanstalk.com/update/player/score', player)
  .then(res => {
      console.log(res.data);
  })
}

let reloadButton = document.getElementById('reloadButt');
reloadButton.addEventListener('click', () => {
  location.reload();
})

function getTimerTime() {
  return Math.floor((new Date() - startTime) / 1000);
}

renderNewQuote();