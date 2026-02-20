const PROBLEMS_URL = "data/problems.json";
const OPEN_PROFILE_URL = "https://open.kakao.com/o/sxsinFuf";

document.addEventListener("DOMContentLoaded", () => {
  setOpenProfileLink();
  setRankingToggle();
  setTabs();
  loadProblems();
});

async function loadProblems() {
  try {
    const data = await fetchProblems();
    const normalized = normalizeProblemData(data);
    renderProblems(normalized.problems);
    renderRanking(normalized.problems);
    renderTurtleSoup(normalized.turtleSoup);
    renderBoardGame(normalized.boardGame);
  } catch (error) {
    renderError(error);
  }
}

async function fetchProblems() {
  try {
    // 문제 데이터를 JSON에서 불러와 화면에 렌더링한다.
    const response = await fetch(PROBLEMS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("문제 데이터를 불러오지 못했습니다.");
    }
    return await response.json();
  } catch (error) {
    if (window.location.protocol === "file:") {
      // 로컬 파일 실행 시 일부 브라우저가 fetch를 차단하므로 XHR로 재시도
      return await tryLoadWithXhr(PROBLEMS_URL);
    }
    throw error;
  }
}

function tryLoadWithXhr(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.overrideMimeType("application/json");
    xhr.onload = () => {
      const ok = xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300);
      if (!ok || !xhr.responseText) {
        reject(new Error("문제 데이터를 불러오지 못했습니다."));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch (parseError) {
        reject(new Error("문제 데이터를 해석할 수 없습니다."));
      }
    };
    xhr.onerror = () => {
      reject(new Error("문제 데이터를 불러오지 못했습니다."));
    };
    xhr.send();
  });
}

function renderProblems(problems) {
  const list = document.getElementById("problem-list");
  if (!list) {
    return;
  }
  list.innerHTML = "";

  problems.forEach((problem) => {
    const card = createProblemCard(problem);
    list.appendChild(card);
  });
}

function renderTurtleSoup(turtleSoup) {
  const list = document.getElementById("soup-list");
  if (!list) {
    return;
  }
  list.innerHTML = "";

  const items = Array.isArray(turtleSoup?.items) ? turtleSoup.items : [];
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      turtleSoup?.emptyMessage || "바다거북스프 문제 데이터가 준비 중입니다.";
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const card = createSoupCard(item, turtleSoup);
    list.appendChild(card);
  });
}

function renderBoardGame(boardGame) {
  const list = document.getElementById("boardgame-list");
  if (!list) {
    return;
  }
  list.innerHTML = "";

  const weights = Array.isArray(boardGame?.weights) ? boardGame.weights : [];
  if (weights.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      boardGame?.emptyMessage || "추천 보드게임 데이터가 준비 중입니다.";
    list.appendChild(empty);
    return;
  }

  weights.forEach((weightInfo) => {
    const card = createBoardGameCard(weightInfo, boardGame);
    list.appendChild(card);
  });
}

function renderRanking(problems) {
  const list = document.getElementById("ranking-list");
  const total = document.getElementById("ranking-total");
  const panel = document.getElementById("ranking-panel");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  const counts = getSolverCounts(problems);
  const entries = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"));

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent = "아직 정답자가 없습니다.";
    list.appendChild(empty);
    if (total) {
      total.textContent = "";
    }
    return;
  }

  const maxCount = entries[0].count;
  const totalSolved = entries.reduce((sum, entry) => sum + entry.count, 0);
  const segmentCount = 10;

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "ranking-item";

    const row = document.createElement("div");
    row.className = "ranking-row";

    const name = document.createElement("span");
    name.className = "ranking-name";
    name.textContent = entry.name;

    const count = document.createElement("span");
    count.className = "ranking-count";
    count.textContent = `${entry.count}문제`;

    row.appendChild(name);
    row.appendChild(count);

    const bar = document.createElement("div");
    bar.className = "ranking-bar";

    const activeSegments =
      maxCount > 0
        ? Math.max(1, Math.round((entry.count / maxCount) * segmentCount))
        : 0;

    for (let i = 0; i < segmentCount; i += 1) {
      const segment = document.createElement("span");
      segment.className = "ranking-segment";
      if (i < activeSegments) {
        segment.classList.add("is-active");
      }
      bar.appendChild(segment);
    }

    item.appendChild(row);
    item.appendChild(bar);

    list.appendChild(item);
  });

  if (total) {
    total.textContent = `총 풀이 횟수 ${totalSolved}회`;
  }

  if (panel && panel.classList.contains("is-open")) {
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  }
}

function renderError(error) {
  const list = document.getElementById("problem-list");
  if (!list) {
    return;
  }
  list.innerHTML = "";
  const title = document.createElement("p");
  title.className = "problem-text";

  if (window.location.protocol === "file:") {
    title.textContent =
      "로컬 파일로 열면 브라우저가 JSON 요청을 차단할 수 있습니다.";
    const hint = document.createElement("p");
    hint.className = "problem-text";
    hint.textContent =
      "예시) 프로젝트 폴더에서 python -m http.server 실행 후 접속";
    list.appendChild(title);
    list.appendChild(hint);
    return;
  }

  title.textContent =
    error instanceof Error ? error.message : "문제를 불러오지 못했습니다.";
  list.appendChild(title);
}

function getSolverCounts(problems) {
  const counts = {};
  problems.forEach((problem) => {
    if (!Array.isArray(problem.solvers)) {
      return;
    }
    problem.solvers.forEach((solver) => {
      const name = String(solver || "").trim();
      if (!name) {
        return;
      }
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return counts;
}

function setOpenProfileLink() {
  const link = document.getElementById("open-profile-link");
  if (!link) {
    return;
  }
  // 상단 제출 링크에 오픈 프로필 주소를 연결한다.
  link.href = OPEN_PROFILE_URL;
}

function setRankingToggle() {
  const panel = document.getElementById("ranking-panel");
  const button = document.getElementById("ranking-toggle");
  if (!panel || !button) {
    return;
  }
  button.addEventListener("click", () => {
    // 랭킹 목록을 펼치거나 접는다.
    toggleAccordion(panel, button, "랭킹 펼치기", "랭킹 접기");
  });
}

function setTabs() {
  const tabButtons = Array.from(document.querySelectorAll("[data-tab-target]"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));
  if (tabButtons.length === 0 || panels.length === 0) {
    return;
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-tab-target");
      if (!targetId) {
        return;
      }

      // 탭 전환 시 노출 영역과 접근성 상태를 동기화한다.
      panels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
        panel.setAttribute("aria-hidden", String(!isActive));
      });

      tabButtons.forEach((tab) => {
        const isActive = tab === button;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });
    });
  });
}

function createProblemCard(problem) {
  const card = document.createElement("article");
  card.className = "problem-card";
  card.dataset.problemId = String(problem.id);

  const solverCount = getSolverCount(problem);
  card.dataset.solverCount = String(solverCount);
  card.classList.add(getDifficultyClass(solverCount));

  const header = document.createElement("div");
  header.className = "problem-header";

  const metaRow = document.createElement("div");
  metaRow.className = "problem-meta-row";

  const metaInfo = document.createElement("div");
  metaInfo.className = "problem-meta-info";

  const id = document.createElement("span");
  id.className = "problem-id";
  id.textContent = `문제 ${problem.id}`;

  const solverCountText = document.createElement("span");
  solverCountText.className = "problem-solver-count";
  solverCountText.textContent = `풀이 ${solverCount}명`;

  const difficultyInfo = getDifficultyInfo(solverCount);
  const difficultyBadge = createDifficultyBadge(difficultyInfo);

  metaInfo.appendChild(solverCountText);
  metaInfo.appendChild(difficultyBadge);

  metaRow.appendChild(id);
  metaRow.appendChild(metaInfo);

  const titleRow = document.createElement("div");
  titleRow.className = "problem-title-row";

  const title = document.createElement("h2");
  title.className = "problem-title";
  title.textContent = problem.title;

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "button button-secondary problem-toggle";
  toggleButton.textContent = "문제 펼치기";

  const panelId = `problem-panel-${problem.id}`;
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-controls", panelId);

  titleRow.appendChild(title);
  titleRow.appendChild(toggleButton);

  header.appendChild(metaRow);
  header.appendChild(titleRow);

  const panel = document.createElement("div");
  panel.className = "problem-panel";
  panel.id = panelId;
  panel.setAttribute("aria-hidden", "true");

  const panelInner = document.createElement("div");
  panelInner.className = "problem-panel-inner";

  const content = document.createElement("div");
  content.className = "problem-content";
  content.appendChild(createContentFragment(problem.content));

  panelInner.appendChild(content);

  if (Array.isArray(problem.conditions) && problem.conditions.length > 0) {
    const conditions = document.createElement("ul");
    conditions.className = "problem-conditions";
    problem.conditions.forEach((condition) => {
      const item = document.createElement("li");
      item.className = "problem-condition";
      item.textContent = condition;
      conditions.appendChild(item);
    });
    panelInner.appendChild(conditions);
  }

  const solverSection = document.createElement("div");
  solverSection.className = "solver-section";

  const solverTitle = document.createElement("p");
  solverTitle.className = "solver-title";
  solverTitle.textContent = "정답자";

  const solverList = document.createElement("ul");
  solverList.className = "solver-list";

  if (Array.isArray(problem.solvers) && problem.solvers.length > 0) {
    problem.solvers.forEach((solver) => {
      const item = document.createElement("li");
      item.className = "solver-item";
      item.textContent = solver;
      solverList.appendChild(item);
    });
  } else {
    const emptyItem = document.createElement("li");
    emptyItem.className = "solver-item";
    emptyItem.textContent = "아직 정답자가 없습니다.";
    solverList.appendChild(emptyItem);
  }

  solverSection.appendChild(solverTitle);
  solverSection.appendChild(solverList);

  panelInner.appendChild(solverSection);
  panel.appendChild(panelInner);

  toggleButton.addEventListener("click", () => {
    // 문제 내용을 펼치거나 접는다.
    toggleAccordion(panel, toggleButton);
  });

  card.appendChild(header);
  card.appendChild(panel);

  return card;
}

function createSoupCard(item, turtleSoup) {
  const card = document.createElement("article");
  card.className = "problem-card";
  card.dataset.soupId = String(item.id);

  const header = document.createElement("div");
  header.className = "problem-header";

  const metaRow = document.createElement("div");
  metaRow.className = "problem-meta-row";

  const label = document.createElement("span");
  label.className = "problem-id";
  label.textContent = item.label || `바다거북스프 ${item.id}`;
  metaRow.appendChild(label);

  const titleRow = document.createElement("div");
  titleRow.className = "problem-title-row";

  const title = document.createElement("h2");
  title.className = "problem-title";
  title.textContent = item.title;

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "button button-secondary problem-toggle";
  toggleButton.textContent = "문제 펼치기";

  const panelId = `soup-panel-${item.id}`;
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-controls", panelId);

  titleRow.appendChild(title);
  titleRow.appendChild(toggleButton);

  header.appendChild(metaRow);
  header.appendChild(titleRow);

  const panel = document.createElement("div");
  panel.className = "problem-panel";
  panel.id = panelId;
  panel.setAttribute("aria-hidden", "true");

  const panelInner = document.createElement("div");
  panelInner.className = "problem-panel-inner";

  const content = document.createElement("div");
  content.className = "problem-content";
  content.appendChild(createContentFragment(item.content));

  panelInner.appendChild(content);

  if (Array.isArray(item.conditions) && item.conditions.length > 0) {
    const conditions = document.createElement("ul");
    conditions.className = "problem-conditions";
    item.conditions.forEach((condition) => {
      const conditionItem = document.createElement("li");
      conditionItem.className = "problem-condition";
      conditionItem.textContent = condition;
      conditions.appendChild(conditionItem);
    });
    panelInner.appendChild(conditions);
  }

  const answerSection = document.createElement("div");
  answerSection.className = "soup-answer";

  const answerTitle = document.createElement("p");
  answerTitle.className = "soup-answer-title";
  answerTitle.textContent = turtleSoup?.answerTitle || "정답";

  const answerText = document.createElement("p");
  answerText.className = "problem-text";
  answerText.textContent = item.answer;

  answerSection.appendChild(answerTitle);
  answerSection.appendChild(answerText);

  const answerButton = document.createElement("button");
  answerButton.type = "button";
  answerButton.className = "button button-secondary soup-answer-button";
  answerButton.textContent = turtleSoup?.answerButtonLabel || "정답 보기";

  answerButton.addEventListener("click", () => {
    if (answerSection.classList.contains("is-open")) {
      return;
    }
    // 정답 보기 버튼은 비밀번호 검증 후에만 정답 영역을 노출한다.
    const promptText =
      turtleSoup?.passwordPrompt || "비밀번호를 입력하세요.";
    const input = window.prompt(promptText);
    if (input === null) {
      return;
    }
    const password = String(turtleSoup?.password || "");
    if (String(input).trim() === password && password.length > 0) {
      answerSection.classList.add("is-open");
      answerButton.disabled = true;
      answerButton.textContent =
        turtleSoup?.answerButtonSuccessLabel || "정답 공개됨";
      if (panel.classList.contains("is-open")) {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
      return;
    }
    window.alert(
      turtleSoup?.passwordFailMessage || "비밀번호가 일치하지 않습니다."
    );
  });

  panelInner.appendChild(answerButton);
  panelInner.appendChild(answerSection);
  panel.appendChild(panelInner);

  toggleButton.addEventListener("click", () => {
    // 바다거북스프 문제를 펼치거나 접는다.
    toggleAccordion(panel, toggleButton);
  });

  card.appendChild(header);
  card.appendChild(panel);

  return card;
}

function createContentFragment(contentText) {
  const fragment = document.createDocumentFragment();
  const lines = String(contentText).split("\n").filter(Boolean);

  lines.forEach((line) => {
    const text = line.trim();
    const paragraph = document.createElement("p");
    paragraph.classList.add("problem-text");

    if (text.startsWith("도입:")) {
      paragraph.classList.add("problem-intro");
    }
    if (text.startsWith("질문:")) {
      paragraph.classList.add("problem-question");
    }

    paragraph.textContent = text;
    fragment.appendChild(paragraph);
  });

  return fragment;
}

function toggleAccordion(panel, button, openText, closeText) {
  const isOpen = panel.classList.contains("is-open");
  const openLabel = openText || "문제 펼치기";
  const closeLabel = closeText || "문제 접기";

  if (isOpen) {
    panel.style.maxHeight = "0px";
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.textContent = openLabel;
    }
    return;
  }

  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  panel.style.maxHeight = `${panel.scrollHeight}px`;
  if (button) {
    button.setAttribute("aria-expanded", "true");
    button.textContent = closeLabel;
  }
}

function getSolverCount(problem) {
  return Array.isArray(problem.solvers) ? problem.solvers.length : 0;
}

function getDifficultyInfo(solverCount) {
  // 풀이자 수를 기준으로 난이도 라벨과 표시 강도를 결정한다.
  if (solverCount <= 1) {
    return { label: "상", filled: 3 };
  }
  if (solverCount <= 3) {
    return { label: "중", filled: 2 };
  }
  return { label: "하", filled: 1 };
}

function createDifficultyBadge(info) {
  const container = document.createElement("div");
  container.className = "problem-difficulty";

  const label = document.createElement("span");
  label.className = "problem-difficulty-label";
  label.textContent = `난이도 ${info.label}`;

  const meter = document.createElement("div");
  meter.className = "difficulty-meter";
  meter.setAttribute("aria-hidden", "true");

  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement("span");
    dot.className = "difficulty-dot";
    if (i < info.filled) {
      dot.classList.add("is-active");
    }
    meter.appendChild(dot);
  }

  container.appendChild(label);
  container.appendChild(meter);

  return container;
}

function getDifficultyClass(solverCount) {
  // 정답자 수가 적을수록 난도가 높아 보이도록 시각적 강도를 조정한다.
  if (solverCount <= 1) {
    return "is-hard";
  }
  if (solverCount <= 3) {
    return "is-medium";
  }
  return "is-easy";
}

function createBoardGameCard(weightInfo, boardGame) {
  const card = document.createElement("article");
  card.className = "boardgame-card";

  const title = document.createElement("h3");
  title.className = "boardgame-card-title";
  title.textContent = weightInfo.weight;

  const description = document.createElement("p");
  description.className = "boardgame-card-description";
  description.textContent = weightInfo.description || "";

  card.appendChild(title);
  if (description.textContent) {
    card.appendChild(description);
  }

  const groups = Array.isArray(weightInfo.groups) ? weightInfo.groups : [];
  if (groups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      weightInfo.emptyMessage ||
      boardGame?.groupEmptyMessage ||
      "추천 데이터가 아직 없습니다.";
    card.appendChild(empty);
    return card;
  }

  groups.forEach((group) => {
    const groupWrap = document.createElement("div");
    groupWrap.className = "boardgame-group";

    const groupTitle = document.createElement("span");
    groupTitle.className = "boardgame-group-title";
    groupTitle.textContent = group.players;
    groupWrap.appendChild(groupTitle);

    const gameList = document.createElement("ul");
    gameList.className = "boardgame-game-list";

    const games = Array.isArray(group.games) ? group.games : [];
    if (games.length > 0) {
      games.forEach((game) => {
        const gameItem = document.createElement("li");
        gameItem.className = "boardgame-game";
        gameItem.textContent = game;
        gameList.appendChild(gameItem);
      });
    } else if (group.note) {
      const gameItem = document.createElement("li");
      gameItem.className = "boardgame-game";
      gameItem.textContent = group.note;
      gameList.appendChild(gameItem);
    }

    groupWrap.appendChild(gameList);
    card.appendChild(groupWrap);
  });

  return card;
}

function normalizeProblemData(data) {
  if (Array.isArray(data)) {
    return {
      problems: data,
      turtleSoup: null,
      boardGame: null,
    };
  }
  return {
    problems: Array.isArray(data?.problems) ? data.problems : [],
    turtleSoup: data?.turtleSoup || null,
    boardGame: data?.boardGame || null,
  };
}
