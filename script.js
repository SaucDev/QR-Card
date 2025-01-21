import { words as TEXT } from "./data/data.js";

const $standby = document.getElementById("standby-dialog");
const $time = document.querySelector("time");
const $paragraph = document.querySelector("p");
const $results = document.getElementById("results");
const $wpm = document.getElementById("wpm");
const $accuracy = document.getElementById("accuracy");
const $totalWords = document.getElementById("word-totals");
const $typedTotal = document.getElementById("typed-totals");
const $missTypes = document.getElementById("miss-types");

const INITIAL_TIME = 30;
const START_TIME = 3;

let words;
let missTypes = 0;
let typeCount = 0;
let gameInterval;
let resumeInterval;
let gameTime = 0;

function initGame() {
  missTypes = 0;
  typeCount = 0;

  $time.textContent = INITIAL_TIME;
  $standby.textContent = "click to start";

  words = TEXT.toSorted(() => Math.random() - 0.5).slice(0, 50);
  $paragraph.innerHTML = "";
  for (let word of words) {
    let xWord = `<x-word>`;
    for (let letter of word) {
      xWord += `<x-letter>${letter}</x-letter>`;
    }
    xWord += `</x-word>`;
    $paragraph.innerHTML += xWord;
  }

  const $firstWord = $paragraph.querySelector("x-word");
  $firstWord.classList.add("active");
  $firstWord.querySelector("x-letter").classList.add("active");
}

function initEvents() {
  gameTime = INITIAL_TIME;
  $time.textContent = gameTime;
  gameInterval = setInterval(gameCountDown, 1000);
  document.addEventListener("keydown", onKeyDown);
}

function gameCountDown() {
  gameTime--;
  $time.textContent = gameTime;

  if (gameTime === 0) {
    clearInterval(gameInterval);
    gameOver();
  }
}

function onKeyDown(e) {
  const { key } = e;
  const isLetter = key.length === 1 && key !== " ";
  const isSpace = key === " ";
  const isBackSpace = key === "Backspace";

  const $currentWord = $paragraph.querySelector("x-word.active");
  const $nextWord = $currentWord?.nextElementSibling;

  const $currentLetter = $currentWord.querySelector("x-letter.active");
  const $nextLetter = $currentLetter?.nextElementSibling;

  const isExtra = $currentLetter.classList.contains("extra");
  const isFirst = $currentLetter === $currentWord.firstChild;
  const isLast = $currentLetter === $currentWord.lastChild;
  const expected = $currentLetter?.innerText;

  if (isSpace) {
    e.preventDefault();
    $currentWord.classList.remove("active");
    $currentLetter.classList.remove("active");
    const correctWord =
      JSON.stringify($currentWord.querySelectorAll(".correct")) ===
      JSON.stringify($currentWord.childNodes);
    if (!correctWord) {
      $currentWord.classList.add("incorrect");
    }
    const $nextFirstLetter = $nextWord.firstChild;
    $nextWord.className = "active";
    $nextFirstLetter.className = "active";
    return;
  }

  if (isBackSpace) {
    e.preventDefault();
    const $previousWord = $currentWord?.previousElementSibling;
    let $previousLetter = $currentLetter?.previousElementSibling;

    if (isFirst && $previousWord.classList.contains("incorrect")) {
      $currentWord.className = "";
      $currentLetter.className = "";
      $previousWord.className = "active";
      $previousLetter = $previousWord.querySelector(
        ":not(.incorrect,.correct,.extra)"
      );
      if ($previousLetter === null) {
        $previousLetter = $previousWord.lastChild;
        $previousLetter.classList.add("is-last");
      }
      $previousLetter.classList.add("active");
      return;
    }

    if (isExtra) {
      $previousLetter.classList.add("active");
      $currentLetter.remove();
      return;
    }

    if ($currentLetter.classList.contains("is-last")) {
      $currentLetter.className = "active";
      return;
    }

    $previousLetter.className = "active";
    $currentLetter.className = "";
  }

  if (!isLetter) {
    return;
  }
  typeCount++;

  if ($currentLetter.classList.contains("is-last")) {
    missTypes++;
    if ($currentWord.querySelectorAll(".extra").length == 5) {
      return;
    }
    $currentLetter.classList.remove("active");
    $currentWord.insertAdjacentHTML(
      "beforeend",
      `<x-letter class="extra active is-last">${key}</x-letter>`
    );
    return;
  }

  if (key === expected) {
    $currentLetter.classList.add("correct");
  } else {
    $currentLetter.classList.add("incorrect");
    missTypes++;
  }
  if (isLast) {
    $currentLetter.classList.add("is-last");
    return;
  }

  $currentLetter.classList.remove("active");
  $nextLetter.classList.add("active");
}

function standbyCountDown() {
  $standby.textContent = START_TIME;
  let counterTime = START_TIME;
  resumeInterval = setInterval(() => {
    counterTime--;
    $standby.textContent = counterTime;
    if (counterTime === 0) {
      clearInterval(resumeInterval);
      $standby.close();
      initEvents();
    }
  }, 1000);
}

function gameOver() {
  document.removeEventListener("keydown", onKeyDown);
  $results.showModal();
  calculateResults();
}

function calculateResults() {
  let totalWords = 0;
  let correctWords = 0;

  for (let word of $paragraph.childNodes) {
    for (let letter of word.childNodes) {
      if (letter.classList.contains("active")) {
        break;
      }
    }
    if (word.className === "active") {
      if (word.querySelector("x-letter.correct.is-last")) {
        correctWords++;
      }
      break;
    }
    totalWords++;
    correctWords++;
  }

  $wpm.textContent = correctWords > 0 ? correctWords / (INITIAL_TIME / 60) : 0;
  let accuracy = (((typeCount - missTypes) / typeCount) * 100).toFixed(2);
  $accuracy.textContent = (isNaN(accuracy) ? 0 : accuracy) + "%";
  $totalWords.textContent = totalWords;
  $typedTotal.textContent = typeCount;
  $missTypes.textContent = missTypes;
}

const $retryButton = $results.querySelector("button");

$retryButton.addEventListener("click", () => {
  $results.close();
});

$retryButton.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
  }
});

$results.addEventListener("transitionend", (e) => {
  if (e.propertyName === "display") {
    initGame();
    $standby.showModal();
    standbyCountDown();
  }
});

$standby.addEventListener("click", standbyCountDown, { once: true });

initGame();
$standby.showModal();
