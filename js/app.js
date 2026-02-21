const PROBLEMS_URL = "data/problems.json";
const TURTLE_SOUP_URL = "data/turtle-soup.json";
const BOARDGAME_URL = "data/boardgame.json";
const BOARDGAME_TERMS_URL = "data/boardgame-terms.json";
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
  ]);

  const [problemsResult, soupResult, boardGameResult, termsResult] = results;

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

  // 태그 필터 UI를 만들고, 선택된 태그(AND)로 용어를 필터링한다.
  const selectedTags = new Set();
  const allTags = collectGlossaryTags(items);
  if (filters && allTags.length > 0) {
    const allButton = createGlossaryFilterButton("전체", true);
    filters.appendChild(allButton);

    allTags.forEach((tag) => {
      const button = createGlossaryFilterButton(tag, false);
      filters.appendChild(button);
    });

    filters.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }
      const tag = target.dataset.tag || "";
      if (!tag) {
        return;
      }

      if (tag === "전체") {
        selectedTags.clear();
      } else if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }

      // 선택된 태그가 없으면 전체가 활성화되도록 동기화한다.
      updateGlossaryFilterButtons(filters, selectedTags);
      renderGlossaryItems(list, items, selectedTags, boardGameTerms);
    });
  }

  renderGlossaryItems(list, items, selectedTags, boardGameTerms);
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

  const themeNames = {
    common: [
      "미니멀 라이트",
      "클린 그리드",
      "소프트 스택",
      "차분한 스크롤",
      "심플 카드",
      "프레시 여백",
      "밝은 모듈",
      "클라우드 폰트",
      "라이트 루프",
      "가벼운 체크",
      "베이직 리듬",
      "스무스 탭",
      "라이트 뱃지",
      "여백 중심",
      "클린 리스트",
      "바닐라 버튼",
      "노이즈 프리",
      "데일리 플로우",
      "포근한 패널",
      "라이트 스냅",
      "플랫 라이트",
      "정돈된 행간",
      "맑은 알림",
      "심플 네비",
      "젤리 카운트",
      "스위트 토글",
      "클린 텍스트",
      "라이트 포커스",
      "기본 밸런스",
      "클린 큐",
      "화이트 모드",
      "라이트 바운스",
      "스무스 레이아웃",
    ],
    advanced: [
      "실키 모션",
      "프리미엄 레이어",
      "딥화이트",
      "미드나잇 블루",
      "글래스 플로팅",
      "차콜 미스트",
      "에코 라이트",
      "네온 라인",
      "소프트 스테이지",
      "리치 패널",
      "스컬프트 카드",
      "포커스 링",
      "스파클 탭",
      "루미너스 리스트",
      "다이아 버튼",
      "프리즘 라이트",
      "오브제 그리드",
      "블룸 필드",
      "라이트 모노",
      "클래식 프리미엄",
    ],
    rare: ["오로라 플로우", "딥포커스 리추얼", "노바 스펙트럼", "프리즘 스플래시"],
    hero: ["시그니처 오라", "네뷸라 크라운"],
    legend: ["에테르 오리진"],
  };

  const buildThemeCatalog = (configs, namesByGrade) => {
    const allThemes = [];
    const themesByGrade = {};

    configs.forEach((config) => {
      const names = Array.isArray(namesByGrade[config.key])
        ? [...namesByGrade[config.key]]
        : [];
      if (names.length < config.count) {
        for (let i = names.length; i < config.count; i += 1) {
          names.push(`${config.label} 테마 ${String(i + 1).padStart(2, "0")}`);
        }
      }
      const trimmed = names.slice(0, config.count);
      const gradeThemes = trimmed.map((name, index) => {
        return {
          id: `${config.key}-${String(index + 1).padStart(2, "0")}`,
          gradeKey: config.key,
          gradeLabel: config.label,
          name,
        };
      });

      themesByGrade[config.key] = gradeThemes;
      allThemes.push(...gradeThemes);
    });

    return { allThemes, themesByGrade };
  };

  const { allThemes, themesByGrade } = buildThemeCatalog(
    gradeConfigs,
    themeNames
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
    const hue = pickInRange(seed, 0, 360, "h");
    const sat = pickInRange(seed, profile.sat[0], profile.sat[1], "s");
    const bgLight = pickInRange(seed, profile.bgLight[0], profile.bgLight[1], "b");
    const accentSat = pickInRange(
      seed,
      profile.accentSat[0],
      profile.accentSat[1],
      "as"
    );
    const accentLight = pickInRange(
      seed,
      profile.accentLight[0],
      profile.accentLight[1],
      "al"
    );
    const textLight = pickInRange(seed, profile.textLight[0], profile.textLight[1], "t");

    return {
      "--bg": hsl(hue, sat * 0.38, bgLight),
      "--card": hsl(hue + 6, Math.max(6, sat * 0.2), 99),
      "--text": hsl(hue + 4, Math.max(22, sat * 0.58), textLight),
      "--muted": hsl(hue + 4, Math.max(18, sat * 0.5), textLight + 28),
      "--accent": hsl(hue, accentSat, accentLight),
      "--accent-strong": hsl(hue - 6, accentSat + 2, accentLight - 12),
      "--accent-soft": hsl(hue + 8, Math.max(20, accentSat * 0.42), 88),
      "--surface": hsl(hue + 6, Math.max(10, sat * 0.3), 92),
      "--surface-hover": hsl(hue + 6, Math.max(12, sat * 0.34), 88),
      "--surface-border": hsl(hue + 5, Math.max(12, sat * 0.3), 82),
      "--panel": hsl(hue + 5, Math.max(10, sat * 0.26), 94),
      "--pill-bg": hsl(hue + 6, Math.max(10, sat * 0.3), 92),
      "--pill-text": hsl(hue + 3, Math.max(22, sat * 0.58), textLight),
      "--segment-bg": hsl(hue + 4, Math.max(10, sat * 0.24), 85),
      "--dot-bg": hsl(hue + 2, Math.max(10, sat * 0.22), 76),
      "--shadow": `0 24px 66px hsl(${Math.round(hue)} ${Math.round(
        Math.max(20, accentSat * 0.8)
      )}% ${Math.round(Math.max(30, accentLight - 16))}% / ${profile.shadowAlpha})`,
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

function renderGlossaryItems(list, items, selectedTags, boardGameTerms) {
  list.innerHTML = "";

  // 선택된 태그를 모두 포함하는(AND) 용어만 노출한다.
  const filtered = items.filter((item) => {
    if (selectedTags.size === 0) {
      return true;
    }
    if (!Array.isArray(item.tags)) {
      return false;
    }
    return Array.from(selectedTags).every((tag) => item.tags.includes(tag));
  });

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "problem-text";
    empty.textContent =
      boardGameTerms?.filterEmptyMessage ||
      "해당 태그에 해당하는 용어가 없습니다.";
    list.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = createBoardGameTermCard(item);
    list.appendChild(card);
  });
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
