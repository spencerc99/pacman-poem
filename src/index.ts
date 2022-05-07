import "./style.css";
import "hammerjs";

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a: any[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PoemHistoryKey = "PacmanPoemHistory";

enum MoveType {
  Left = "Left",
  Right = "Right",
  Down = "Down",
  Up = "Up",
}

const MoveToDisplay: Record<MoveType, string> = {
  [MoveType.Left]: "←",
  [MoveType.Up]: "↑",
  [MoveType.Right]: "→",
  [MoveType.Down]: "↓",
};

interface PoemHistory {
  poem: string[];
  date: Date;
  moves: MoveType[];
}

const grid = document.getElementById("g")!;
const hammer = new Hammer(grid, {
  recognizers: [[Hammer.Swipe, { direction: Hammer.DIRECTION_ALL }]],
});

const currHistory: PoemHistory[] = JSON.parse(
  localStorage.getItem(PoemHistoryKey) || "[]"
) as PoemHistory[];

function renderPoemHistory({ poem, date, moves }: PoemHistory) {
  const newPoemDiv = document.createElement("div");
  newPoemDiv.className = "poemHistory";

  const poemTxt = poem.join(" ");
  const movesTxt = moves.map((m) => MoveToDisplay[m]).join(" ");

  // TODO: add delete button
  newPoemDiv.innerHTML = `
      <b class="date">${date.toLocaleString()}</b>
      <span class="poemText">${poemTxt}</span>
      <details>
        <summary>
          moves
        </summary>
        <span class="moves">${movesTxt}</span>
      </details>`;
  return newPoemDiv;
}

if (currHistory.length) {
  // Populate the history if there are any.
  for (const poemHistory of currHistory) {
    document
      .getElementById("history")!
      .appendChild(renderPoemHistory(poemHistory));
  }
}

const position = [1, 2];
const pacman = document.createElement("div");
let lastPacmanId = `${position[0]}${position[1]}`;
let pacHtml = `<span id="p">❽</span>`;
pacman.innerHTML = pacHtml;
const poem: string[] = [];
const words = {
  article: ["a", "the", "some", "all", "no", "few"],
  n: ["stones", "keys", "move", "cadence", "note", "pieces", "piss", "shard"],
  verb: ["ate", "licked", "pray", "sighs", "sung", "was", "sunk"],
  adj: ["coiled", "tensed", "tender", "retrograde", "citrine", "empty"],
  punctuation: [",", ".", "|", "[", "]", "–"],
};
const choices = ["", "", "/", "/", "/"];
const removeAtRand = (arr: any[]) => {
  const idx = Math.floor(Math.random() * arr.length);
  const a = arr[idx];
  arr.splice(idx, 1);
  return a;
};
const pushRandom = (c: any[], n: number) => {
  for (let i = 0; i < n; i++) {
    choices.push(removeAtRand(c));
  }
};
let hasSavedPoem = false;
const moves: MoveType[] = [];

pushRandom(words["article"], 2);
pushRandom(words["adj"], 2);
pushRandom(words["n"], 2);
pushRandom(words["verb"], 2);
pushRandom(words["punctuation"], 2);
// fill up map with id to boolean of whether it is filled.
const map: Record<string, boolean> = {};
const randomWord = () => removeAtRand(choices);

for (let i = 3; i >= 0; i--) {
  for (let j = 3; j >= 0; j--) {
    let node = document.createElement("span");
    node.id = `${i}${j}`;

    if (position[0] === i && position[1] === j) {
      node.innerHTML = pacHtml;
    } else {
      const randWord = randomWord();
      let text = document.createTextNode(randWord);
      node.appendChild(text);
      map[node.id] = Boolean(randWord);
    }
    grid.appendChild(node);
  }
}

const handleFinishGame = () => {
  if (!hasSavedPoem) {
    const newPoem = {
      poem,
      date: new Date(),
      moves,
    };
    currHistory.push(newPoem);
    document.getElementById("history")!.appendChild(renderPoemHistory(newPoem));
    localStorage.setItem(PoemHistoryKey, JSON.stringify(currHistory));
  }
  hasSavedPoem = true;
  pacHtml += " full!";
  // TODO: add message and give button to restart.
};

const handleMove = () => {
  console.log("handling move");
  document.getElementById(lastPacmanId)!.innerHTML = "";
  const currPos = `${position[0]}${position[1]}`;
  let word = document.getElementById(currPos)!;
  let txt = word.innerText;
  word.innerHTML = pacHtml;
  lastPacmanId = currPos;
  if (!txt) {
    return;
  }
  poem.push(txt === "/" ? "<br/>" : txt);
  let poemTxt = poem.join(" ");
  if (poemTxt.endsWith("<br/>")) {
    poemTxt += "&nbsp;";
  }
  document.getElementById("t")!.innerHTML = poemTxt;
  map[currPos] = false;
  if (Object.values(map).every((v) => !v)) {
    handleFinishGame();
  }
};

function saveMove(direction: MoveType) {
  moves.push(direction);
}

function handleLeft(): boolean {
  if (position[1] === 3) return false;
  position[1]++;
  (pacman.children[0] as HTMLElement).style.transform = "rotate(0deg)";
  saveMove(MoveType.Left);
  return true;
}
function handleDown(): boolean {
  if (position[0] === 0) return false;
  position[0]--;
  (pacman.children[0] as HTMLElement).style.transform = "rotate(90deg)";
  saveMove(MoveType.Down);
  return true;
}
function handleUp(): boolean {
  if (position[0] === 3) return false;
  position[0]++;
  (pacman.children[0] as HTMLElement).style.transform = "rotate(90deg)";
  saveMove(MoveType.Up);
  return true;
}
function handleRight(): boolean {
  if (position[1] === 0) return false;
  position[1]--;
  (pacman.children[0] as HTMLElement).style.transform = "scaleX(-1)";
  saveMove(MoveType.Right);
  return true;
}

document.addEventListener("keydown", (event) => {
  let moved = false;
  switch (event.key) {
    case "ArrowDown":
      moved = handleDown();
      break;
    case "ArrowUp":
      moved = handleUp();
      break;
    case "ArrowRight":
      moved = handleRight();
      break;
    case "ArrowLeft":
      moved = handleLeft();
      break;
    default:
      return;
  }

  if (!moved) {
    return;
  }

  handleMove();
});

// handle mobile swipe
hammer.on("swipeleft", () => {
  if (handleLeft()) {
    handleMove();
  }
});
hammer.on("swiperight", () => {
  if (handleRight()) {
    handleMove();
  }
});
hammer.on("swipedown", () => {
  if (handleDown()) {
    handleMove();
  }
});
hammer.on("swipeup", () => {
  if (handleUp()) {
    handleMove();
  }
});

const TitleStartOptions = shuffle(["❽", "8", "ate"]);
const TitleEndOptions = shuffle(["bite", "bit", "byte"]);
let titleStartIdx = TitleStartOptions.indexOf("❽");
let titleEndIdx = TitleEndOptions.indexOf("bite");
const TitleSwapIntervalsSeconds = [2, 5];
const TitleTextAnimationDurationMs = 500;
const TitleSwapIntervalMultiple =
  TitleSwapIntervalsSeconds[1] - TitleSwapIntervalsSeconds[0];
function generateRandomIntervalSeconds() {
  return (
    (Math.random() * TitleSwapIntervalMultiple + TitleSwapIntervalsSeconds[0]) *
    1000
  );
}
function animateChangeText(querySelector: string, getNextOption: () => string) {
  const ele = document.querySelector(querySelector)!;
  ele.classList.add("pre-animation");
  setTimeout(function () {
    ele.innerHTML = getNextOption();
    ele.classList.remove("pre-animation");
  }, TitleTextAnimationDurationMs);
}
setInterval(
  () =>
    animateChangeText("#titleOne", () => {
      titleStartIdx = (titleStartIdx + 1) % TitleStartOptions.length;
      const nextOption = TitleStartOptions[titleStartIdx];
      return nextOption;
    }),
  generateRandomIntervalSeconds()
);
setInterval(
  () =>
    animateChangeText("#titleTwo", () => {
      titleEndIdx = (titleEndIdx + 1) % TitleEndOptions.length;
      const nextOption = TitleEndOptions[titleEndIdx];
      return nextOption;
    }),
  generateRandomIntervalSeconds()
);
