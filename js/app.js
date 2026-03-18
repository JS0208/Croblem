const PROBLEMS_URL = "data/problems.json";
const TURTLE_SOUP_URL = "data/turtle-soup.json";
const BOARDGAME_URL = "data/boardgame.json";
const BOARDGAME_TERMS_URL = "data/boardgame-terms.json";
const FOOD_URL = "data/restaurant.txt";
const MOVIE_URL = "data/movie.json";
const CLUB_TMI_URL = "data/club-tmi.json";
const OPEN_PROFILE_URL = "https://open.kakao.com/o/sxsinFuf";

document.addEventListener("DOMContentLoaded", () => {
  setOpenProfileLink();
  setRankingToggle();
  setTabs();
  setSlotMachine();
  loadProblems();
});

async function loadProblems() {
  // 분리된 JSON 데이터를 동시에 요청하고, 섹션별로 안전하게 렌더링한다.
  const results = await Promise.allSettled([
    fetchJson(PROBLEMS_URL),
    fetchJson(TURTLE_SOUP_URL),
    fetchJson(BOARDGAME_URL),
    fetchJson(BOARDGAME_TERMS_URL),
    fetchText(FOOD_URL),
    fetchJson(MOVIE_URL),
    fetchJson(CLUB_TMI_URL),
  ]);

  const [
    problemsResult,
    soupResult,
    boardGameResult,
    termsResult,
    foodResult,
    movieResult,
    clubTmiResult,
  ] = results;

  if (problemsResult.status === "fulfilled") {
    const problems = normalizeProblems(problemsResult.value);
    renderProblems(problems);
    renderRanking(problems);
  } else {
    renderProblems([]);
    renderRanking([]);
    renderSectionError("problem-list", problemsResult.reason, "문제 데이터를 불러오지 못했습니다.");
  }

  if (soupResult.status === "fulfilled") {
    const turtleSoup = normalizeSectionData(soupResult.value, "turtleSoup");
    renderTurtleSoup(turtleSoup);
  } else {
    renderSectionError(
      "soup-list",
      soupResult.reason,
      "바다거북스프 데이터를 불러오지 못했습니다."
    );
  }

  if (boardGameResult.status === "fulfilled") {
    const boardGame = normalizeSectionData(boardGameResult.value, "boardGame");
    renderBoardGame(boardGame);
  } else {
    renderSectionError(
      "boardgame-list",
      boardGameResult.reason,
      "추천 보드게임 데이터를 불러오지 못했습니다."
    );
  }

  if (termsResult.status === "fulfilled") {
    const boardGameTerms = normalizeSectionData(
      termsResult.value,
      "boardGameTerms"
    );
    renderBoardGameTerms(boardGameTerms);
  } else {
    renderSectionError(
      "boardgame-terms-list",
      termsResult.reason,
      "보드게임 용어 데이터를 불러오지 못했습니다."
    );
  }

  if (foodResult.status === "fulfilled") {
    const food = parseRestaurantText(foodResult.value);
    renderFood(food);
  } else {
    renderSectionError("food-list", foodResult.reason, "맛집 데이터를 불러오지 못했습니다.");
  }

  if (movieResult.status === "fulfilled") {
    const movie = normalizeSectionData(movieResult.value, "movie");
    renderMovie(movie);
  } else {
    renderSectionError("movie-list", movieResult.reason, "영화 데이터를 불러오지 못했습니다.");
  }

  if (clubTmiResult.status === "fulfilled") {
    const clubTmi = normalizeSectionData(clubTmiResult.value, "clubTmi");
    renderClubTmi(clubTmi);
  } else {
    renderSectionError(
      "club-tmi-list",
      clubTmiResult.reason,
      "동아리 TMI 데이터를 불러오지 못했습니다."
    );
  }
}

async function fetchJson(url) {
  try {
    // JSON 파일을 fetch로 읽고, 실패 시 XHR로 재시도한다.
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("데이터를 불러오지 못했습니다.");
    }
    return await response.json();
  } catch (error) {
    if (window.location.protocol === "file:") {
      // 로컬 파일 실행 시 일부 브라우저가 fetch를 차단하므로 XHR로 재시도
      return await tryLoadWithXhr(url);
    }
    throw error;
  }
}

async function fetchText(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("데이터를 불러오지 못했습니다.");
    }
    return await response.text();
  } catch (error) {
    if (window.location.protocol === "file:") {
      // 로컬 파일 실행 시 텍스트 파일도 XHR로 재시도한다.
      return await tryLoadTextWithXhr(url);
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

function tryLoadTextWithXhr(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.overrideMimeType("text/plain; charset=utf-8");
    xhr.onload = () => {
      const ok = xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300);
      if (!ok) {
        reject(new Error("데이터를 불러오지 못했습니다."));
        return;
      }
      resolve(xhr.responseText || "");
    };
    xhr.onerror = () => {
      reject(new Error("데이터를 불러오지 못했습니다."));
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
  const filters = document.getElementById("boardgame-filters");
  if (!list) {
    return;
  }
  list.innerHTML = "";
  if (filters) {
    filters.innerHTML = "";
  }

  const games = Array.isArray(boardGame?.games) ? boardGame.games : [];
  if (games.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      boardGame?.emptyMessage || "추천 보드게임 데이터가 준비 중입니다.";
    list.appendChild(empty);
    return;
  }

  const state = {
    query: "",
    bestPlayers: new Set(),
    playtime: new Set(),
    weight: new Set(),
  };

  if (filters) {
    createBoardGameFilters(filters, state, boardGame, games, () => {
      renderBoardGameItems(list, games, state, boardGame);
    });
  }

  renderBoardGameItems(list, games, state, boardGame);
}

function renderBoardGameTerms(boardGameTerms) {
  const list = document.getElementById("boardgame-terms-list");
  const filters = document.getElementById("boardgame-terms-filters");
  if (!list) {
    return;
  }
  list.innerHTML = "";
  if (filters) {
    filters.innerHTML = "";
  }

  const items = Array.isArray(boardGameTerms?.items)
    ? boardGameTerms.items
    : [];
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      boardGameTerms?.emptyMessage || "보드게임 용어 데이터가 준비 중입니다.";
    list.appendChild(empty);
    return;
  }

  const state = {
    query: "",
    selectedTags: new Set(),
  };

  if (filters) {
    createGlossaryFilters(filters, state, boardGameTerms, items, () => {
      renderGlossaryItems(list, items, state, boardGameTerms);
    });
  }

  renderGlossaryItems(list, items, state, boardGameTerms);
}

function renderFood(food) {
  const list = document.getElementById("food-list");
  if (!list) {
    return;
  }
  list.innerHTML = "";

  const items = Array.isArray(food?.items) ? food.items : [];
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent = food?.emptyMessage || "맛집 데이터가 준비 중입니다.";
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    list.appendChild(createRestaurantCard(item));
  });
}

function parseRestaurantText(text) {
  // 빈 줄 기준으로 식당 정보를 묶어, 이름/분류/링크를 카드 데이터로 변환한다.
  const blocks = String(text || "")
    .split(/\r?\n\s*\r?\n/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .filter((lines) => lines.length > 0);

  const items = blocks
    .map((lines, index) => {
      const titleLine = lines[0] || "";
      const urlLine = lines.find((line) => /^https?:\/\//i.test(line)) || "";
      const [namePart, categoryPart] = titleLine
        .split("/")
        .map((part) => part.trim());

      return {
        id: index + 1,
        name: namePart || `추천 식당 ${index + 1}`,
        menu: categoryPart || "메뉴 정보 준비 중",
        url: urlLine,
      };
    })
    .filter((item) => item.name);

  return {
    emptyMessage: "맛집 데이터가 준비 중입니다.",
    items,
  };
}

function createRestaurantCard(item) {
  const card = document.createElement("article");
  card.className = "food-card";

  const header = document.createElement("div");
  header.className = "food-card-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "food-card-title-group";

  const title = document.createElement("h3");
  title.className = "food-card-title";
  title.textContent = item.name || "추천 식당";

  const category = document.createElement("span");
  category.className = "food-card-category";
  category.textContent = item.menu || "메뉴 정보 준비 중";

  titleGroup.appendChild(title);
  titleGroup.appendChild(category);
  header.appendChild(titleGroup);
  card.appendChild(header);

  const description = document.createElement("p");
  description.className = "food-card-description";
  description.textContent =
    "네이버 지도에서 매장 페이지를 열고 길찾기를 이어서 확인할 수 있습니다.";
  card.appendChild(description);

  if (item.url) {
    const actions = document.createElement("div");
    actions.className = "food-card-actions";

    const link = document.createElement("a");
    link.className = "button button-primary food-card-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = getRestaurantLinkLabel(item.url);
    link.setAttribute("aria-label", `${item.name || "식당"} 네이버 지도 열기`);

    actions.appendChild(link);
    card.appendChild(actions);
  }

  return card;
}

function getRestaurantLinkLabel(url) {
  const value = String(url || "").toLowerCase();
  if (value.includes("/directions") || value.includes("route/")) {
    return "길찾기 열기";
  }
  return "네이버 지도 열기";
}

function renderMovie(movie) {
  const list = document.getElementById("movie-list");
  if (!list) {
    return;
  }
  list.innerHTML = "";

  const items = Array.isArray(movie?.items) ? movie.items : [];
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent = movie?.emptyMessage || "영화 데이터가 준비 중입니다.";
    list.appendChild(empty);
    return;
  }

  const section = document.createElement("section");
  section.className = "movie-grid";
  section.setAttribute("aria-label", "개봉 예정 영화 목록");

  // 영화 데이터는 JSON 기준으로 카드 UI를 만들고, 날짜 정보가 가장 먼저 보이도록 배치한다.
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "movie-card";

    const header = document.createElement("div");
    header.className = "movie-card-header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "movie-card-title-group";

    const status = document.createElement("span");
    status.className = "movie-card-status";
    status.textContent = item.status || "개봉 예정";

    const title = document.createElement("h3");
    title.className = "movie-card-title";
    title.textContent = item.title || "제목 미정";

    titleGroup.appendChild(status);
    titleGroup.appendChild(title);

    const date = document.createElement("p");
    date.className = "movie-card-date";
    date.textContent = item.releaseDate || "개봉일 미정";

    header.appendChild(titleGroup);
    header.appendChild(date);
    card.appendChild(header);
    section.appendChild(card);
  });

  list.appendChild(section);
}

function renderClubTmi(clubTmi) {
  const list = document.getElementById("club-tmi-list");
  if (!list) {
    return;
  }
  list.innerHTML = "";

  const columns = Array.isArray(clubTmi?.columns) ? clubTmi.columns : [];
  const items = Array.isArray(clubTmi?.items) ? clubTmi.items : [];

  if (columns.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      clubTmi?.emptyMessage || "동아리 TMI 데이터가 준비 중입니다.";
    list.appendChild(empty);
    return;
  }

  // 컬럼과 행을 모두 JSON 기준으로 렌더링해 이후 데이터 수정만으로 표를 갱신할 수 있게 한다.
  const tableWrap = document.createElement("div");
  tableWrap.className = "club-tmi-table-wrap";

  const table = document.createElement("table");
  table.className = "club-tmi-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.classList.add(`club-tmi-col-${column.key}`);
    cell.textContent = column.label || "";
    headRow.appendChild(cell);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  if (items.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = columns.length;
    emptyCell.className = "club-tmi-empty";
    emptyCell.textContent =
      clubTmi?.emptyMessage || "동아리 TMI 데이터가 준비 중입니다.";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    items.forEach((item) => {
      const row = document.createElement("tr");
      columns.forEach((column) => {
        const cell = document.createElement("td");
        cell.classList.add(`club-tmi-col-${column.key}`);
        const value = item?.[column.key];
        cell.textContent = value ? String(value) : "-";
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  list.appendChild(tableWrap);
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

function renderSectionError(listId, error, fallbackMessage) {
  const list = document.getElementById(listId);
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
    fallbackMessage ||
    (error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
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

function setSlotMachine() {
  const display = document.getElementById("slot-display");
  const button = document.getElementById("slot-spin-button");
  if (!display || !button) {
    return;
  }

  const gradeConfigs = [
    {
      key: "common",
      label: "일반",
      probability: 0.55,
      count: 33,
      bgClass: "theme-bg-common",
    },
    {
      key: "advanced",
      label: "고급",
      probability: 0.33,
      count: 20,
      bgClass: "theme-bg-advanced",
    },
    {
      key: "rare",
      label: "희귀",
      probability: 0.066,
      count: 4,
      bgClass: "theme-bg-rare",
    },
    {
      key: "hero",
      label: "영웅",
      probability: 0.033,
      count: 2,
      bgClass: "theme-bg-hero",
    },
    {
      key: "legend",
      label: "전설",
      probability: 0.021,
      count: 1,
      bgClass: "theme-bg-legend",
    },
  ];

  const themeNameGenerators = {
    common: {
      adjectives: [
        "안개빛",
        "포근한",
        "고요한",
        "잔잔한",
        "담백한",
        "스무스",
        "은은한",
        "차분한",
        "부드러운",
        "맑은",
        "소프트",
      ],
      nouns: [
        "모노",
        "페이퍼",
        "린넨",
        "데스크",
        "카드",
        "브리즈",
        "노트",
        "아카이브",
        "리본",
        "그리드",
        "하모니",
      ],
      hueBases: [210, 196, 182, 224, 168, 236, 198],
      chaos: 0.12,
      modes: ["calm", "airy", "cool"],
    },
    advanced: {
      adjectives: [
        "벨벳",
        "글래스",
        "루미나",
        "실키",
        "모던",
        "프리미엄",
        "오팔",
        "새틴",
        "스펙트럼",
      ],
      nouns: [
        "웨이브",
        "라운지",
        "미스트",
        "레이어",
        "스튜디오",
        "플럭스",
        "패널",
        "오브제",
        "시퀀스",
      ],
      hueBases: [172, 200, 256, 188, 160, 275, 214],
      chaos: 0.24,
      modes: ["balanced", "glow", "cool-pop"],
    },
    rare: {
      adjectives: ["오로라", "프리즘", "노바", "펄스", "크리스탈", "루나"],
      nouns: ["스파크", "블룸", "리츄얼", "스펙트럼", "스톰", "베일"],
      hueBases: [286, 320, 42, 178, 226, 12],
      chaos: 0.45,
      modes: ["vivid", "neon", "contrast"],
    },
    hero: {
      adjectives: ["볼캐닉", "플라즈마", "코스믹", "크림슨", "아스트라"],
      nouns: ["임팩트", "퀘이크", "퓨전", "라이즈", "블레이즈"],
      hueBases: [14, 336, 272, 188, 44],
      chaos: 0.68,
      modes: ["neon", "dark-pop", "extreme"],
    },
    legend: {
      adjectives: ["아포칼립스", "인피니트", "카오스", "트랜센던트", "제로포인트"],
      nouns: ["오버드라이브", "코어", "패러독스", "익스플로전", "레조넌스"],
      hueBases: [278, 16, 186, 332, 52, 140],
      chaos: 0.9,
      modes: ["extreme", "neon", "dark-pop"],
    },
  };

  const buildThemeName = (generator, index) => {
    const adjective =
      generator.adjectives[index % generator.adjectives.length] || "테마";
    const noun =
      generator.nouns[
        Math.floor(index / generator.adjectives.length) % generator.nouns.length
      ] || "스타일";
    return `${adjective} ${noun}`;
  };

  const buildThemeCatalog = (configs, generators) => {
    const allThemes = [];
    const themesByGrade = {};

    configs.forEach((config) => {
      const generator = generators[config.key] || generators.common;
      const gradeThemes = Array.from({ length: config.count }, (_, index) => {
        const hueBase = generator.hueBases[index % generator.hueBases.length] || 200;
        const hueJitter = ((index * 37 + config.count * 11) % 44) - 22;
        const mode = generator.modes[index % generator.modes.length] || "balanced";

        return {
          id: `${config.key}-${String(index + 1).padStart(2, "0")}`,
          gradeKey: config.key,
          gradeLabel: config.label,
          name: buildThemeName(generator, index),
          style: {
            hue: (hueBase + hueJitter + 360) % 360,
            chaos: Math.min(1, generator.chaos + ((index % 5) * 0.06)),
            mode,
          },
        };
      });

      themesByGrade[config.key] = gradeThemes;
      allThemes.push(...gradeThemes);
    });

    return { allThemes, themesByGrade };
  };

  const { allThemes, themesByGrade } = buildThemeCatalog(
    gradeConfigs,
    themeNameGenerators
  );

  const themeClassList = gradeConfigs.map((config) => config.bgClass);
  const gradeClassMap = gradeConfigs.reduce((acc, config) => {
    acc[config.key] = config.bgClass;
    return acc;
  }, {});

  const themeVarKeys = [
    "--bg",
    "--card",
    "--text",
    "--muted",
    "--accent",
    "--accent-strong",
    "--accent-soft",
    "--surface",
    "--surface-hover",
    "--surface-border",
    "--panel",
    "--pill-bg",
    "--pill-text",
    "--segment-bg",
    "--dot-bg",
    "--shadow",
  ];

  const variantProfiles = {
    common: {
      sat: [8, 18],
      bgLight: [95, 97],
      accentSat: [22, 34],
      accentLight: [43, 50],
      textLight: [16, 20],
      shadowAlpha: 0.12,
    },
    advanced: {
      sat: [18, 34],
      bgLight: [93, 96],
      accentSat: [45, 58],
      accentLight: [42, 48],
      textLight: [15, 19],
      shadowAlpha: 0.16,
    },
    rare: {
      sat: [38, 56],
      bgLight: [92, 95],
      accentSat: [62, 78],
      accentLight: [46, 54],
      textLight: [14, 18],
      shadowAlpha: 0.22,
    },
    hero: {
      sat: [52, 68],
      bgLight: [91, 94],
      accentSat: [78, 90],
      accentLight: [47, 55],
      textLight: [13, 17],
      shadowAlpha: 0.28,
    },
    legend: {
      sat: [60, 76],
      bgLight: [90, 94],
      accentSat: [84, 98],
      accentLight: [48, 56],
      textLight: [12, 16],
      shadowAlpha: 0.34,
    },
  };

  let isSpinning = false;
  let lastSpinIndex = -1;

  const updateDisplay = (theme) => {
    display.innerHTML = "";
    display.dataset.grade = theme.gradeKey || "common";

    const gradeSpan = document.createElement("span");
    gradeSpan.className = "slot-grade";
    gradeSpan.textContent = theme.gradeLabel || "일반";

    const nameSpan = document.createElement("span");
    nameSpan.className = "slot-name";
    nameSpan.textContent = theme.name || "테마 대기";

    display.appendChild(gradeSpan);
    display.appendChild(nameSpan);
  };

  const pickSpinTheme = () => {
    if (allThemes.length <= 1) {
      return (
        allThemes[0] || {
          gradeKey: "common",
          gradeLabel: "일반",
          name: "테마 대기",
        }
      );
    }
    let nextIndex = 0;
    do {
      nextIndex = Math.floor(Math.random() * allThemes.length);
    } while (nextIndex === lastSpinIndex);
    lastSpinIndex = nextIndex;
    return allThemes[nextIndex];
  };

  const pickWeightedGrade = () => {
    const total = gradeConfigs.reduce(
      (sum, config) => sum + config.probability,
      0
    );
    const roll = Math.random() * total;
    let acc = 0;
    for (const config of gradeConfigs) {
      acc += config.probability;
      if (roll <= acc) {
        return config;
      }
    }
    return gradeConfigs[gradeConfigs.length - 1];
  };

  const pickFinalTheme = () => {
    const grade = pickWeightedGrade();
    const candidates = themesByGrade[grade.key] || allThemes;
    if (candidates.length === 0) {
      return pickSpinTheme();
    }
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  };

  const hashSeed = (value) => {
    const source = String(value || "");
    let hash = 2166136261;
    for (let i = 0; i < source.length; i += 1) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const pickInRange = (seed, min, max, salt) => {
    const mixed = hashSeed(`${seed}-${salt}`) / 4294967295;
    return min + (max - min) * mixed;
  };

  const hsl = (h, sValue, lValue) => {
    const hue = Math.round((h % 360 + 360) % 360);
    const sat = Math.max(0, Math.min(100, Math.round(sValue)));
    const light = Math.max(0, Math.min(100, Math.round(lValue)));
    return `hsl(${hue} ${sat}% ${light}%)`;
  };

  const buildThemeVariant = (theme) => {
    const profile = variantProfiles[theme.gradeKey] || variantProfiles.common;
    const seed = hashSeed(theme.id || theme.name || theme.gradeKey);
    const style = theme.style || {};
    const chaos = Math.max(0, Math.min(1, style.chaos || 0));

    const hue =
      typeof style.hue === "number"
        ? style.hue
        : pickInRange(seed, 0, 360, "h");
    const satBase = pickInRange(seed, profile.sat[0], profile.sat[1], "s");
    const sat = satBase + chaos * 18;
    const bgLight =
      pickInRange(seed, profile.bgLight[0], profile.bgLight[1], "b") - chaos * 1.4;
    let accentSat =
      pickInRange(seed, profile.accentSat[0], profile.accentSat[1], "as") + chaos * 18;
    let accentLight =
      pickInRange(seed, profile.accentLight[0], profile.accentLight[1], "al") + chaos * 3;
    const textLight = pickInRange(
      seed,
      profile.textLight[0],
      profile.textLight[1],
      "t"
    );

    if (style.mode === "neon") {
      accentSat += 10;
      accentLight += 3;
    } else if (style.mode === "dark-pop") {
      accentSat += 8;
      accentLight -= 5;
    } else if (style.mode === "extreme") {
      accentSat += 14;
      accentLight += 1;
    }

    return {
      "--bg": hsl(hue, sat * 0.45, bgLight),
      "--card": hsl(hue + 6, Math.max(8, sat * 0.24), 99 - chaos * 2),
      "--text": hsl(hue + 4, Math.max(20, sat * 0.62), textLight),
      "--muted": hsl(hue + 4, Math.max(18, sat * 0.54), textLight + 28 - chaos * 4),
      "--accent": hsl(hue, accentSat, accentLight),
      "--accent-strong": hsl(hue - 8, accentSat + 4, accentLight - 14),
      "--accent-soft": hsl(hue + 10, Math.max(20, accentSat * 0.4), 87 - chaos * 5),
      "--surface": hsl(hue + 6, Math.max(10, sat * 0.35), 92 - chaos * 3),
      "--surface-hover": hsl(hue + 6, Math.max(12, sat * 0.4), 88 - chaos * 4),
      "--surface-border": hsl(hue + 5, Math.max(12, sat * 0.36), 82 - chaos * 5),
      "--panel": hsl(hue + 5, Math.max(10, sat * 0.3), 94 - chaos * 3),
      "--pill-bg": hsl(hue + 6, Math.max(10, sat * 0.35), 92 - chaos * 3),
      "--pill-text": hsl(hue + 3, Math.max(22, sat * 0.6), textLight),
      "--segment-bg": hsl(hue + 4, Math.max(10, sat * 0.3), 85 - chaos * 5),
      "--dot-bg": hsl(hue + 2, Math.max(10, sat * 0.26), 76 - chaos * 6),
      "--shadow": `0 ${Math.round(22 + chaos * 12)}px ${Math.round(
        62 + chaos * 20
      )}px hsl(${Math.round(hue)} ${Math.round(
        Math.max(24, accentSat * 0.84)
      )}% ${Math.round(Math.max(28, accentLight - 18))}% / ${Math.min(
        0.42,
        profile.shadowAlpha + chaos * 0.1
      )})`,
    };
  };

  const clearThemeVariant = () => {
    themeVarKeys.forEach((key) => document.body.style.removeProperty(key));
  };

  const applyThemeBackground = (theme) => {
    const gradeKey = theme?.gradeKey || "common";
    document.body.classList.remove(...themeClassList);
    const className = gradeClassMap[gradeKey];
    if (className) {
      document.body.classList.add(className);
    }

    if (!theme?.id) {
      clearThemeVariant();
      return;
    }

    const variant = buildThemeVariant(theme);
    Object.entries(variant).forEach(([key, value]) => {
      document.body.style.setProperty(key, value);
    });
  };

  updateDisplay({
    gradeKey: "common",
    gradeLabel: "일반",
    name: "테마 대기",
  });
  applyThemeBackground({ gradeKey: "common" });

  // 첫 화면 렌더링이 끝난 뒤 1초 후 슬롯을 한 번 자동 실행한다.
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      button.click();
    }, 300);
  });

  button.addEventListener("click", () => {
    if (isSpinning) {
      return;
    }
    isSpinning = true;
    button.disabled = true;
    button.textContent = "테마 결정 중...";
    button.classList.add("is-spinning");
    display.classList.remove("is-final");
    display.classList.add("is-spinning");
    document.body.classList.add("is-slot-spinning");
    document.body.classList.remove("is-slot-result");

    const spinDuration = 2400;
    const minInterval = 45;
    const maxInterval = 220;
    const startTime = performance.now();

    const spin = () => {
      updateDisplay(pickSpinTheme());
      const elapsed = performance.now() - startTime;
      if (elapsed < spinDuration) {
        const progress = Math.min(elapsed / spinDuration, 1);
        const eased = progress * progress;
        const interval = Math.round(
          minInterval + (maxInterval - minInterval) * eased
        );
        window.setTimeout(spin, interval);
        return;
      }

      const finalTheme = pickFinalTheme();
      updateDisplay(finalTheme);
      applyThemeBackground(finalTheme);
      display.classList.remove("is-spinning");
      display.classList.add("is-final");
      button.classList.remove("is-spinning");
      document.body.classList.remove("is-slot-spinning");
      document.body.classList.add("is-slot-result");
      window.setTimeout(() => {
        display.classList.remove("is-final");
        document.body.classList.remove("is-slot-result");
      }, 900);
      button.disabled = false;
      button.textContent = "슬롯 돌리기";
      isSpinning = false;
    };

    window.setTimeout(spin, minInterval);
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

function createParagraphFragment(contentText, className) {
  const fragment = document.createDocumentFragment();
  const lines = String(contentText).split("\n").filter(Boolean);

  lines.forEach((line) => {
    const paragraph = document.createElement("p");
    paragraph.className = className;
    paragraph.textContent = line.trim();
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
  if (solverCount === 0) {
    return { label: "최상", filled: 5 };
  }
  if (solverCount === 1) {
    return { label: "상", filled: 4 };
  }
  if (solverCount === 2) {
    return { label: "중", filled: 3 };
  }
  if (solverCount === 3) {
    return { label: "하", filled: 2 };
  }
  return { label: "최하", filled: 1 };
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

  for (let i = 0; i < 5; i += 1) {
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
  if (solverCount === 0) {
    return "is-very-hard";
  }
  if (solverCount === 1) {
    return "is-hard";
  }
  if (solverCount === 2) {
    return "is-medium";
  }
  if (solverCount === 3) {
    return "is-easy";
  }
  return "is-very-easy";
}

function createBoardGameFilters(container, state, boardGame, games, onChange) {
  const playerOptions = collectBoardGamePlayers(games);
  const playtimeOptions = [15, 30, 45, 60, 90, 120, 150, 180, 240];
  const weightOptions = buildWeightRanges();
  const searchWrap = document.createElement("section");
  searchWrap.className = "boardgame-filter-group";

  const searchTitle = document.createElement("h3");
  searchTitle.className = "boardgame-filter-title";
  searchTitle.textContent = "이름 검색";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "boardgame-search-input";
  searchInput.placeholder =
    boardGame?.searchPlaceholder || "보드게임 이름으로 검색";
  searchInput.setAttribute("aria-label", "보드게임 이름 검색");
  searchInput.autocomplete = "off";
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    onChange();
  });

  searchWrap.appendChild(searchTitle);
  searchWrap.appendChild(searchInput);

  const playerGroup = createBoardGameFilterGroup("베스트 인원 수", "players", playerOptions, state, onChange, (value) => `${value}인`);
  const playtimeGroup = createBoardGameFilterGroup("플레이타임", "playtime", playtimeOptions, state, onChange, (value) =>
    value === 240 ? "240+" : `${value}분`
  );
  const weightGroup = createBoardGameFilterGroup(
    "웨이트",
    "weight",
    weightOptions,
    state,
    onChange,
    (option) => option.label,
    (option) => option.id
  );

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "button button-secondary boardgame-filter-reset";
  resetButton.textContent = "필터 초기화";
  resetButton.addEventListener("click", () => {
    state.query = "";
    state.bestPlayers.clear();
    state.playtime.clear();
    state.weight.clear();
    searchInput.value = "";
    updateBoardGameFilterButtons(container, state);
    onChange();
  });

  container.appendChild(searchWrap);
  container.appendChild(playerGroup);
  container.appendChild(playtimeGroup);
  container.appendChild(weightGroup);
  container.appendChild(resetButton);

  updateBoardGameFilterButtons(container, state);
}

function createBoardGameFilterGroup(
  label,
  key,
  options,
  state,
  onChange,
  formatLabel,
  getOptionValue
) {
  const wrap = document.createElement("section");
  wrap.className = "boardgame-filter-group";

  const title = document.createElement("h3");
  title.className = "boardgame-filter-title";
  title.textContent = label;

  const chips = document.createElement("div");
  chips.className = "boardgame-filter-chips";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "boardgame-filter-button";
  allButton.dataset.filterKey = key;
  allButton.dataset.filterValue = "all";
  allButton.textContent = "전체";
  chips.appendChild(allButton);

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "boardgame-filter-button";
    button.dataset.filterKey = key;
    const optionValue = getOptionValue ? getOptionValue(option) : option;
    button.dataset.filterValue = String(optionValue);
    button.textContent = formatLabel(option);
    chips.appendChild(button);
  });

  chips.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const selectedKey = target.dataset.filterKey || "";
    const selectedValue = target.dataset.filterValue || "all";
    if (!selectedKey) {
      return;
    }

    const selectedSet = getBoardGameFilterSet(state, selectedKey);
    if (!selectedSet) {
      return;
    }

    if (selectedValue === "all") {
      selectedSet.clear();
    } else if (selectedSet.has(selectedValue)) {
      selectedSet.delete(selectedValue);
    } else {
      selectedSet.add(selectedValue);
    }

    const root = chips.closest("#boardgame-filters");
    if (root instanceof HTMLElement) {
      updateBoardGameFilterButtons(root, state);
    }
    onChange();
  });

  wrap.appendChild(title);
  wrap.appendChild(chips);
  return wrap;
}

function updateBoardGameFilterButtons(container, state) {
  const buttons = container.querySelectorAll(".boardgame-filter-button");
  buttons.forEach((button) => {
    const key = button.dataset.filterKey || "";
    const value = button.dataset.filterValue || "all";
    const selectedSet = getBoardGameFilterSet(state, key);
    let selected = false;

    if (!selectedSet) {
      return;
    }

    if (value === "all") {
      selected = selectedSet.size === 0;
    } else {
      selected = selectedSet.has(value);
    }

    button.classList.toggle("is-active", selected);
  });
}

function renderBoardGameItems(list, games, state, boardGame) {
  list.innerHTML = "";

  const filtered = games.filter((game) => {
    if (!matchesBoardGameQuery(game, state.query)) {
      return false;
    }

    if (
      state.bestPlayers.size > 0 &&
      !getGameBestPlayers(game).some((player) =>
        state.bestPlayers.has(String(player))
      )
    ) {
      return false;
    }

    if (state.playtime.size > 0) {
      const playtime = getGamePlaytimeRange(game);
      const matchesPlaytime = Array.from(state.playtime).some((selected) => {
        const selectedPlaytime = Number(selected);
        if (selectedPlaytime === 240) {
          return playtime.max >= 240;
        }
        return playtime.min <= selectedPlaytime && playtime.max >= selectedPlaytime;
      });
      if (!matchesPlaytime) {
        return false;
      }
    }

    if (state.weight.size > 0) {
      const weight = Number(game.weight);
      const matchedWeight = Array.from(state.weight).some((rangeId) =>
        isWeightInRange(weight, rangeId)
      );
      if (!matchedWeight) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => {
    const weightDiff = Number(b.weight || 0) - Number(a.weight || 0);
    if (weightDiff !== 0) {
      return weightDiff;
    }
    return String(a.name || "").localeCompare(String(b.name || ""), "ko");
  });

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      boardGame?.filterEmptyMessage ||
      "선택한 조건에 맞는 게임이 없습니다. 필터를 조금 넓혀보세요.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach((game) => {
    list.appendChild(createBoardGameCard(game));
  });
}

function getBoardGameFilterSet(state, key) {
  if (key === "players") {
    return state.bestPlayers;
  }
  if (key === "playtime") {
    return state.playtime;
  }
  if (key === "weight") {
    return state.weight;
  }
  return null;
}

function collectBoardGamePlayers(games) {
  const players = new Set();
  games.forEach((game) => {
    getGameBestPlayers(game).forEach((player) => {
      players.add(player);
    });
  });
  return Array.from(players).sort((a, b) => a - b);
}

function getGameBestPlayers(game) {
  if (Array.isArray(game?.bestPlayers)) {
    return game.bestPlayers
      .map((player) => Number(player))
      .filter((player) => Number.isFinite(player) && player > 0);
  }

  const bestPlayers = Number(game?.bestPlayers);
  return Number.isFinite(bestPlayers) && bestPlayers > 0 ? [bestPlayers] : [];
}

function getGamePlaytimeRange(game) {
  const min = Number(game?.playtime?.min ?? game?.playtime);
  const max = Number(game?.playtime?.max ?? game?.playtime);
  if (!Number.isFinite(min) && !Number.isFinite(max)) {
    return { min: 0, max: 0 };
  }
  if (!Number.isFinite(max)) {
    return { min, max: min };
  }
  if (!Number.isFinite(min)) {
    return { min: max, max };
  }
  return { min, max };
}

function matchesBoardGameQuery(game, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return String(game?.name || "").toLowerCase().includes(normalizedQuery);
}

function formatBoardGamePlayers(game) {
  if (game?.bestPlayersText) {
    return game.bestPlayersText;
  }

  const bestPlayers = getGameBestPlayers(game);
  return bestPlayers.length > 0
    ? bestPlayers.map((player) => `${player}인`).join(", ")
    : "-";
}

function formatBoardGamePlaytime(game) {
  if (game?.playtimeText) {
    return game.playtimeText;
  }

  const { min, max } = getGamePlaytimeRange(game);
  if (min === 0 && max === 0) {
    return "-";
  }
  return min === max ? `${min}분` : `${min}-${max}분`;
}

const WEIGHT_RANGES = Array.from({ length: 8 }, (_, index) => {
  const min = Number((1 + index * 0.5).toFixed(1));
  const max = min === 4.5 ? 5.0 : Number((min + 0.49).toFixed(2));
  return {
    id: `${min.toFixed(1)}-${max.toFixed(2)}`,
    min,
    max,
    label: `${min.toFixed(1)}~${max.toFixed(2)}`,
  };
});

function buildWeightRanges() {
  return WEIGHT_RANGES;
}

function isWeightInRange(weight, rangeId) {
  const target = WEIGHT_RANGES.find((range) => range.id === rangeId);
  if (!target) {
    return false;
  }
  return weight >= target.min && weight <= target.max;
}

function createBoardGameCard(game) {
  const card = document.createElement("article");
  card.className = "boardgame-card";

  const title = document.createElement("h3");
  title.className = "boardgame-card-title";
  title.textContent = game.name || "이름 미정";

  const description = document.createElement("p");
  description.className = "boardgame-card-description";
  description.textContent = game.description || "";

  const metaList = document.createElement("ul");
  metaList.className = "boardgame-game-list";

  const bestPlayers = document.createElement("li");
  bestPlayers.className = "boardgame-game";
  bestPlayers.textContent = `베스트 인원: ${formatBoardGamePlayers(game)}`;

  const playtime = document.createElement("li");
  playtime.className = "boardgame-game";
  playtime.textContent = `플레이타임: ${formatBoardGamePlaytime(game)}`;

  const weight = document.createElement("li");
  weight.className = "boardgame-game";
  weight.textContent = `웨이트: ${Number(game.weight || 0).toFixed(1)}`;

  metaList.appendChild(bestPlayers);
  metaList.appendChild(playtime);
  metaList.appendChild(weight);

  card.appendChild(title);
  if (description.textContent) {
    card.appendChild(description);
  }
  card.appendChild(metaList);

  return card;
}

function createBoardGameTermCard(item) {
  const card = document.createElement("article");
  card.className = "glossary-card";

  const term = document.createElement("h3");
  term.className = "glossary-term";
  term.textContent = item.term || "용어";

  const content = document.createElement("div");
  content.className = "glossary-content";
  content.appendChild(
    createParagraphFragment(item.definition || "", "glossary-text")
  );

  if (item.example) {
    const example = document.createElement("p");
    example.className = "glossary-example";
    example.textContent = `예시: ${item.example}`;
    content.appendChild(example);
  }

  card.appendChild(term);
  card.appendChild(content);

  if (Array.isArray(item.tags) && item.tags.length > 0) {
    const tagList = document.createElement("ul");
    tagList.className = "glossary-tags";
    item.tags.forEach((tag) => {
      const tagItem = document.createElement("li");
      tagItem.className = "glossary-tag";
      tagItem.textContent = tag;
      tagList.appendChild(tagItem);
    });
    card.appendChild(tagList);
  }

  return card;
}

function collectGlossaryTags(items) {
  const tags = new Set();
  items.forEach((item) => {
    if (!Array.isArray(item.tags)) {
      return;
    }
    item.tags.forEach((tag) => {
      const normalized = String(tag || "").trim();
      if (normalized) {
        tags.add(normalized);
      }
    });
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b, "ko"));
}

function createGlossaryFilterButton(tag, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "glossary-filter-button";
  if (isActive) {
    button.classList.add("is-active");
  }
  button.textContent = tag;
  button.dataset.tag = tag;
  return button;
}

function createGlossaryFilters(container, state, boardGameTerms, items, onChange) {
  const searchWrap = document.createElement("section");
  searchWrap.className = "glossary-filter-group";

  const searchTitle = document.createElement("h3");
  searchTitle.className = "boardgame-filter-title";
  searchTitle.textContent = "이름 검색";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "boardgame-search-input";
  searchInput.placeholder =
    boardGameTerms?.searchPlaceholder || "보드게임 용어 이름으로 검색";
  searchInput.setAttribute("aria-label", "보드게임 용어 이름 검색");
  searchInput.autocomplete = "off";
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    onChange();
  });

  searchWrap.appendChild(searchTitle);
  searchWrap.appendChild(searchInput);
  container.appendChild(searchWrap);

  const allTags = collectGlossaryTags(items);
  if (allTags.length === 0) {
    return;
  }

  const tagWrap = document.createElement("section");
  tagWrap.className = "glossary-filter-group";

  const tagTitle = document.createElement("h3");
  tagTitle.className = "boardgame-filter-title";
  tagTitle.textContent = "태그 필터";

  const chips = document.createElement("div");
  chips.className = "glossary-filter-chips";

  const allButton = createGlossaryFilterButton("전체", true);
  chips.appendChild(allButton);

  allTags.forEach((tag) => {
    const button = createGlossaryFilterButton(tag, false);
    chips.appendChild(button);
  });

  chips.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const tag = target.dataset.tag || "";
    if (!tag) {
      return;
    }

    if (tag === "전체") {
      state.selectedTags.clear();
    } else if (state.selectedTags.has(tag)) {
      state.selectedTags.delete(tag);
    } else {
      state.selectedTags.add(tag);
    }

    // 선택된 태그가 없으면 전체가 활성화되도록 동기화한다.
    updateGlossaryFilterButtons(chips, state.selectedTags);
    onChange();
  });

  tagWrap.appendChild(tagTitle);
  tagWrap.appendChild(chips);
  container.appendChild(tagWrap);
}

function updateGlossaryFilterButtons(container, selectedTags) {
  const buttons = Array.from(
    container.querySelectorAll(".glossary-filter-button")
  );
  buttons.forEach((button) => {
    const tag = button.dataset.tag || "";
    if (tag === "전체") {
      button.classList.toggle("is-active", selectedTags.size === 0);
      return;
    }
    button.classList.toggle("is-active", selectedTags.has(tag));
  });
}

function renderGlossaryItems(list, items, state, boardGameTerms) {
  list.innerHTML = "";

  // 이름 검색과 태그 조건을 모두 만족하는 용어만 노출한다.
  const filtered = items.filter((item) => {
    if (!matchesGlossaryQuery(item, state.query)) {
      return false;
    }

    if (state.selectedTags.size === 0) {
      return true;
    }
    if (!Array.isArray(item.tags)) {
      return false;
    }
    return Array.from(state.selectedTags).every((tag) => item.tags.includes(tag));
  });

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      boardGameTerms?.filterEmptyMessage ||
      "검색어나 태그에 해당하는 용어가 없습니다.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = createBoardGameTermCard(item);
    list.appendChild(card);
  });
}

function matchesGlossaryQuery(item, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return String(item?.term || "").toLowerCase().includes(normalizedQuery);
}

function normalizeProblems(data) {
  if (Array.isArray(data)) {
    return data;
  }
  return Array.isArray(data?.problems) ? data.problems : [];
}

function normalizeSectionData(data, key) {
  if (!data) {
    return null;
  }
  if (key && data[key]) {
    return data[key];
  }
  return data;
}
