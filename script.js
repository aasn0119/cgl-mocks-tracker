(() => {
  const STORAGE_KEY = "ssc-cgl-mock-tracker-v1";
  // To add a new platform or student, just add it to these arrays!
  const PLATFORM_ORDER = ["Testbook", "Oliveboard", "TestRanking", "RBE", "Pundits", "ParmarMocks", "MathsMania"];
  const SUBJECTS = ["English", "Reasoning", "Quant", "GK"];
  const STUDENTS = ["Abhi", "Anshika"];
  const DEFAULT_SETTINGS = { theme: "light", targetScore: 160 };

  const state = {
    mocks: [],
    weakAreas: [],
    settings: { ...DEFAULT_SETTINGS },
    filters: {
      student: "all",
      platform: "all",
      startDate: "",
      endDate: "",
      search: "",
    },
    sort: {
      key: "date",
      dir: "desc",
    },
    editingMockId: null,
  };

  const elements = {};
  const charts = {};

  function $(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    [
      "themeToggle",
      "exportJsonBtn",
      "importJsonBtn",
      "exportCsvBtn",
      "importJsonInput",
      "targetScoreInput",
      "saveTargetBtn",
      "targetProgressText",
      "targetProgressFill",
      "targetProgressCaption",
      "totalMocks",
      "averageScore",
      "bestScore",
      "currentScore",
      "averageAccuracy",
      "improvementPercent",
      "subjectAverageCards",
      "searchInput",
      "studentFilter",
      "platformFilter",
      "startDateFilter",
      "endDateFilter",
      "mockForm",
      "mockFormTitle",
      "mockSubmitBtn",
      "cancelMockEdit",
      "mockDate",
      "mockPlatform",
      "mockId",
      "mockStudent",
      "mockTotalScore",
      "mockRank",
      "mockPercentile",
      "mockEnglish",
      "mockReasoning",
      "mockQuant",
      "mockGk",
      "mockAttempted",
      "mockCorrect",
      "mockWrong",
      "mockTimeTaken",
      "mockRemarks",
      "liveAccuracy",
      "liveImprovement",
      "liveOverallAvg",
      "liveBestScore",
      "liveWorstScore",
      "liveLast5Avg",
      "weakForm",
      "weakDate",
      "weakStudent",
      "weakSubject",
      "weakTopic",
      "weakMistakeType",
      "weakNotes",
      "mockTableCount",
      "mockTableBody",
      "mockEmptyState",
      "leaderboardCards",
      "studentSummaryList",
      "mistakeFrequencyList",
      "weakTopicList",
      "strongTopicList",
      "weakTableCount",
      "weeklyReport",
      "monthlyReport",
      "platformDifficulty",
    ].forEach((id) => {
      elements[id] = $(id);
    });
  }

  function populateDropdowns() {
    // Dynamic Population logic for Form Options
    const platformsHtml = `<option value="">Select Platform</option>` + PLATFORM_ORDER.map(p => `<option value="${p}">${p}</option>`).join("");
    const studentsHtml = `<option value="">Select Student</option>` + STUDENTS.map(s => `<option value="${s}">${s}</option>`).join("");
    const subjectsHtml = `<option value="">Select Subject</option>` + SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join("");

    elements.mockPlatform.innerHTML = platformsHtml;
    elements.mockStudent.innerHTML = studentsHtml;
    elements.weakStudent.innerHTML = studentsHtml;
    elements.weakSubject.innerHTML = subjectsHtml;

    // Dynamic Population logic for Filter Dropdowns
    const filterPlatformsHtml = `<option value="all">All Platforms</option>` + PLATFORM_ORDER.map(p => `<option value="${p}">${p}</option>`).join("");
    const filterStudentsHtml = `<option value="all">All Students</option>` + STUDENTS.map(s => `<option value="${s}">${s}</option>`).join("");

    elements.platformFilter.innerHTML = filterPlatformsHtml;
    elements.studentFilter.innerHTML = filterStudentsHtml;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function toTimestamp(dateValue) {
    return new Date(`${dateValue}T00:00:00`).getTime();
  }

  function safeNumber(value) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : 0;
  }

  function safeInteger(value) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? number : 0;
  }

  function average(values) {
    if (!values.length) {
      return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function formatNumber(value, digits = 1) {
    return round(value, digits).toFixed(digits);
  }

  function formatPercent(value, digits = 1) {
    return `${formatNumber(value, digits)}%`;
  }

  function formatSignedNumber(value, digits = 1) {
    const rounded = round(value, digits);
    return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(digits)}`;
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setTheme(theme) {
    state.settings.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.settings.theme);
    if (elements.themeToggle) {
      const isDark = state.settings.theme === "dark";
      elements.themeToggle.setAttribute("aria-pressed", String(isDark));
      elements.themeToggle.textContent = isDark ? "Light Theme" : "Dark Theme";
    }
    saveState();
  }

  function toggleTheme() {
    setTheme(state.settings.theme === "dark" ? "light" : "dark");
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      state.settings = {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
      };
      state.mocks = Array.isArray(parsed.mocks) ? parsed.mocks.map(sanitizeMock).filter(Boolean) : [];
      state.weakAreas = Array.isArray(parsed.weakAreas) ? parsed.weakAreas.map(sanitizeWeakArea).filter(Boolean) : [];
      state.sort = parsed.sort && typeof parsed.sort === "object" ? { ...state.sort, ...parsed.sort } : state.sort;
      state.filters = parsed.filters && typeof parsed.filters === "object" ? { ...state.filters, ...parsed.filters } : state.filters;
      state.editingMockId = null;
    } catch (error) {
      console.warn("Unable to load saved data. Starting fresh.", error);
    }
  }

  function saveState() {
    const payload = {
      version: 1,
      mocks: state.mocks,
      weakAreas: state.weakAreas,
      settings: state.settings,
      sort: state.sort,
      filters: state.filters,
      exportedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function sanitizeMock(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const date = entry.date || todayISO();
    const studentName = STUDENTS.includes(entry.studentName) ? entry.studentName : STUDENTS[0];
    const platform = PLATFORM_ORDER.includes(entry.platform) ? entry.platform : PLATFORM_ORDER[0];

    return {
      id: entry.id || uid(),
      date,
      platform,
      mockId: String(entry.mockId || "").trim(),
      studentName,
      totalScore: safeNumber(entry.totalScore),
      rank: safeInteger(entry.rank),
      percentile: safeNumber(entry.percentile),
      englishScore: safeNumber(entry.englishScore),
      reasoningScore: safeNumber(entry.reasoningScore),
      quantScore: safeNumber(entry.quantScore),
      gkScore: safeNumber(entry.gkScore),
      attemptedQuestions: safeInteger(entry.attemptedQuestions),
      correctQuestions: safeInteger(entry.correctQuestions),
      wrongQuestions: safeInteger(entry.wrongQuestions),
      timeTaken: safeNumber(entry.timeTaken),
      remarks: String(entry.remarks || "").trim(),
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || new Date().toISOString(),
      accuracy: safeNumber(entry.accuracy),
      scoreImprovement: safeNumber(entry.scoreImprovement),
      improvementPercent: safeNumber(entry.improvementPercent),
      previousScore: entry.previousScore ?? null,
    };
  }

  function sanitizeWeakArea(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const student = STUDENTS.includes(entry.student) ? entry.student : STUDENTS[0];
    const subject = SUBJECTS.includes(entry.subject) ? entry.subject : SUBJECTS[0];

    return {
      id: entry.id || uid(),
      date: entry.date || todayISO(),
      student,
      subject,
      topic: String(entry.topic || "").trim(),
      mistakeType: String(entry.mistakeType || "").trim(),
      notes: String(entry.notes || "").trim(),
      createdAt: entry.createdAt || new Date().toISOString(),
    };
  }

  function sortChronologically(entries) {
    return [...entries].sort((left, right) => {
      const dateDelta = toTimestamp(left.date) - toTimestamp(right.date);
      if (dateDelta !== 0) {
        return dateDelta;
      }
      return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
    });
  }

  function recalculateMockMetrics(entries) {
    const sorted = sortChronologically(entries.map(sanitizeMock).filter(Boolean));
    const previousByStudent = new Map();

    sorted.forEach((mock) => {
      const studentHistory = previousByStudent.get(mock.studentName) || [];
      const previous = studentHistory.length ? studentHistory[studentHistory.length - 1] : null;

      mock.accuracy = mock.attemptedQuestions > 0 ? round((mock.correctQuestions / mock.attemptedQuestions) * 100, 2) : 0;
      mock.previousScore = previous ? previous.totalScore : null;
      mock.scoreImprovement = previous ? round(mock.totalScore - previous.totalScore, 2) : 0;
      mock.improvementPercent = previous && previous.totalScore !== 0 ? round(((mock.totalScore - previous.totalScore) / previous.totalScore) * 100, 2) : 0;
      studentHistory.push(mock);
      previousByStudent.set(mock.studentName, studentHistory);
    });

    return sorted;
  }

  function getAllMocks() {
    return state.mocks;
  }

  function getAnalyticsMocks() {
    return filterMocks(getAllMocks(), false);
  }

  function getTableMocks() {
    const analytics = getAnalyticsMocks();
    const search = state.filters.search.trim().toLowerCase();

    if (!search) {
      return analytics;
    }

    return analytics.filter((mock) => {
      const haystack = [
        mock.date,
        mock.platform,
        mock.mockId,
        mock.studentName,
        mock.remarks,
        mock.totalScore,
        mock.rank,
        mock.percentile,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  function getWeakEntries() {
    const studentFilter = state.filters.student;
    const startDate = state.filters.startDate ? toTimestamp(state.filters.startDate) : null;
    const endDate = state.filters.endDate ? toTimestamp(state.filters.endDate) : null;

    return state.weakAreas.filter((entry) => {
      if (studentFilter !== "all" && entry.student !== studentFilter) {
        return false;
      }
      const ts = toTimestamp(entry.date);
      if (startDate !== null && ts < startDate) {
        return false;
      }
      if (endDate !== null && ts > endDate) {
        return false;
      }
      return true;
    });
  }

  function filterMocks(records, includeSearch = true) {
    const studentFilter = state.filters.student;
    const platformFilter = state.filters.platform;
    const startDate = state.filters.startDate ? toTimestamp(state.filters.startDate) : null;
    const endDate = state.filters.endDate ? toTimestamp(state.filters.endDate) : null;
    const search = includeSearch ? state.filters.search.trim().toLowerCase() : "";

    return records.filter((mock) => {
      if (studentFilter !== "all" && mock.studentName !== studentFilter) {
        return false;
      }
      if (platformFilter !== "all" && mock.platform !== platformFilter) {
        return false;
      }
      const ts = toTimestamp(mock.date);
      if (startDate !== null && ts < startDate) {
        return false;
      }
      if (endDate !== null && ts > endDate) {
        return false;
      }
      if (search) {
        const haystack = [mock.date, mock.platform, mock.mockId, mock.studentName, mock.remarks].join(" ").toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  function getLatestMock(records) {
    if (!records.length) {
      return null;
    }
    return sortChronologically(records).at(-1) || null;
  }

  function getScoreValues(records) {
    return records.map((entry) => entry.totalScore);
  }

  function getAverageMetric(records, getter) {
    return average(records.map(getter));
  }

  function getSubjectAverages(records) {
    const map = {};
    SUBJECTS.forEach((subject) => {
      const key = `${subject.toLowerCase()}Score`;
      map[subject] = getAverageMetric(records, (entry) => entry[key]);
    });
    return map;
  }

  function getLastNAverage(records, count, student = null) {
    const filtered = student ? records.filter((entry) => entry.studentName === student) : records;
    const latest = sortChronologically(filtered).slice(-count);
    return average(latest.map((entry) => entry.totalScore));
  }

  function formatMaybeNumber(value, digits = 1) {
    return Number.isFinite(Number(value)) ? formatNumber(value, digits) : "0.0";
  }

  function renderDashboard() {
    const records = getAnalyticsMocks();
    const totals = getScoreValues(records);
    const latest = getLatestMock(records);
    const best = totals.length ? Math.max(...totals) : 0;
    const overallAverage = average(totals);
    const averageAccuracy = average(records.map((entry) => entry.accuracy));
    const improvementPercent = latest ? latest.improvementPercent : 0;
    const currentScore = latest ? latest.totalScore : 0;
    const target = Math.max(safeNumber(state.settings.targetScore), 0);
    const progressValue = target > 0 ? Math.min((currentScore / target) * 100, 999) : 0;
    const progressBarValue = Math.min(progressValue, 100);

    elements.totalMocks.textContent = String(records.length);
    elements.averageScore.textContent = formatNumber(overallAverage, 1);
    elements.bestScore.textContent = String(Math.round(best));
    elements.currentScore.textContent = String(Math.round(currentScore));
    elements.averageAccuracy.textContent = formatPercent(averageAccuracy, 1);
    elements.improvementPercent.textContent = `${formatSignedNumber(improvementPercent, 1)}%`;

    elements.targetProgressText.textContent = `${formatNumber(progressValue, 0)}%`;
    elements.targetProgressFill.style.width = `${progressBarValue}%`;
    if (latest) {
      elements.targetProgressCaption.textContent = `Latest score ${formatNumber(latest.totalScore, 0)} against target ${formatNumber(target, 0)}.`;
    } else {
      elements.targetProgressCaption.textContent = "No mock scores yet.";
    }

    elements.targetScoreInput.value = String(state.settings.targetScore || 160);

    renderSubjectAverages(records);
    renderLiveMetrics();
  }

  function renderSubjectAverages(records) {
    const subjects = getSubjectAverages(records);
    const cards = SUBJECTS.map((subject) => {
      const averageScore = subjects[subject];
      const label = averageScore >= 40 ? "Strong" : averageScore >= 35 ? "Moderate" : "Needs Work";
      return `
        <article class="micro-card">
          <span>${subject}</span>
          <strong>${formatNumber(averageScore, 1)}</strong>
          <small>${label} subject average</small>
        </article>
      `;
    });

    elements.subjectAverageCards.innerHTML = cards.join("");
  }

  function renderLiveMetrics() {
    const formData = readMockForm(false);
    const targetStudent = formData.studentName || null;
    const targetDate = formData.date || todayISO();
    const previousScore = getPreviousScoreForStudent(targetStudent, targetDate, state.editingMockId);
    const accuracy = formData.attemptedQuestions > 0 ? (formData.correctQuestions / formData.attemptedQuestions) * 100 : 0;
    const improvement = previousScore === null ? 0 : formData.totalScore - previousScore;
    const records = getAnalyticsMocks();
    const overallAverage = average(records.map((entry) => entry.totalScore));
    const bestScore = records.length ? Math.max(...records.map((entry) => entry.totalScore)) : 0;
    const worstScore = records.length ? Math.min(...records.map((entry) => entry.totalScore)) : 0;
    const last5Avg = targetStudent ? getLastNAverage(records, 5, targetStudent) : getLastNAverage(records, 5);

    elements.liveAccuracy.textContent = formatPercent(accuracy, 1);
    elements.liveImprovement.textContent = formatSignedNumber(improvement, 1);
    elements.liveOverallAvg.textContent = formatNumber(overallAverage, 1);
    elements.liveBestScore.textContent = formatNumber(bestScore, 1);
    elements.liveWorstScore.textContent = formatNumber(worstScore, 1);
    elements.liveLast5Avg.textContent = formatNumber(last5Avg, 1);
  }

  function renderTable() {
    const tableRecords = sortRecords(getTableMocks());
    elements.mockTableCount.textContent = `${tableRecords.length} record${tableRecords.length === 1 ? "" : "s"}`;
    elements.mockEmptyState.hidden = tableRecords.length > 0;

    if (!tableRecords.length) {
      elements.mockTableBody.innerHTML = "";
      return;
    }

    elements.mockTableBody.innerHTML = tableRecords
      .map((mock) => {
        const scoreClass = scoreClassFor(mock.totalScore);
        const accuracyClass = percentageClassFor(mock.accuracy);
        const improvementClass = numberClassFor(mock.scoreImprovement);
        return `
          <tr>
            <td>${escapeHtml(formatDate(mock.date))}</td>
            <td>${escapeHtml(mock.platform)}</td>
            <td>${escapeHtml(mock.mockId)}</td>
            <td>${escapeHtml(mock.studentName)}</td>
            <td class="table-score ${scoreClass}">${formatNumber(mock.totalScore, 1)}</td>
            <td>${escapeHtml(String(mock.rank))}</td>
            <td class="table-percent ${percentageClassFor(mock.percentile)}">${formatPercent(mock.percentile, 1)}</td>
            <td class="table-percent ${accuracyClass}">${formatPercent(mock.accuracy, 1)}</td>
            <td class="table-score ${improvementClass}">${formatSignedNumber(mock.scoreImprovement, 1)}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn small-btn edit" data-action="edit" data-id="${mock.id}">Edit</button>
                <button type="button" class="btn small-btn delete" data-action="delete" data-id="${mock.id}">Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function sortRecords(records) {
    const { key, dir } = state.sort;
    const multiplier = dir === "asc" ? 1 : -1;

    return [...records].sort((left, right) => {
      const leftValue = sortValue(left, key);
      const rightValue = sortValue(right, key);

      if (leftValue < rightValue) {
        return -1 * multiplier;
      }
      if (leftValue > rightValue) {
        return 1 * multiplier;
      }
      return 0;
    });
  }

  function sortValue(record, key) {
    switch (key) {
      case "date":
        return toTimestamp(record.date);
      case "totalScore":
        return record.totalScore;
      case "rank":
        return record.rank;
      case "percentile":
        return record.percentile;
      case "accuracy":
        return record.accuracy;
      case "improvement":
        return record.scoreImprovement;
      case "platform":
        return PLATFORM_ORDER.indexOf(record.platform);
      default:
        return String(record[key] ?? "").toLowerCase();
    }
  }

  function renderLeaderboard() {
    const allRecords = getAllMocks();
    const cards = STUDENTS.map((student) => {
      const records = allRecords.filter((entry) => entry.studentName === student);
      const scores = getScoreValues(records);
      const avgScore = average(scores);
      const avgAccuracy = average(records.map((entry) => entry.accuracy));
      const bestMock = scores.length ? Math.max(...scores) : 0;
      const totalMocks = records.length;
      const last5Avg = getLastNAverage(allRecords, 5, student);
      const last10Avg = getLastNAverage(allRecords, 10, student);
      const latest = getLatestMock(records);

      return `
        <article class="student-card">
          <h3>${escapeHtml(student)}</h3>
          <div class="metric-row"><span>Average Score</span><strong>${formatNumber(avgScore, 1)}</strong></div>
          <div class="metric-row"><span>Average Accuracy</span><strong>${formatPercent(avgAccuracy, 1)}</strong></div>
          <div class="metric-row"><span>Best Mock</span><strong>${formatNumber(bestMock, 1)}</strong></div>
          <div class="metric-row"><span>Total Mocks</span><strong>${totalMocks}</strong></div>
          <div class="metric-row"><span>Last 5 Avg</span><strong>${formatNumber(last5Avg, 1)}</strong></div>
          <div class="metric-row"><span>Last 10 Avg</span><strong>${formatNumber(last10Avg, 1)}</strong></div>
          <div class="metric-row"><span>Latest Score</span><strong>${latest ? formatNumber(latest.totalScore, 1) : "0.0"}</strong></div>
        </article>
      `;
    });

    elements.leaderboardCards.innerHTML = cards.join("");

    const comparisons = buildComparisonHighlights(allRecords);
    elements.studentSummaryList.innerHTML = comparisons
      .map(
        (item) => `
        <div class="comparison-item">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.body)}</p>
        </div>
      `
      )
      .join("");
  }

  function buildComparisonHighlights(allRecords) {
    const studentStats = STUDENTS.map((student) => {
      const records = allRecords.filter((entry) => entry.studentName === student);
      const scores = getScoreValues(records);
      return {
        student,
        avgScore: average(scores),
        avgAccuracy: average(records.map((entry) => entry.accuracy)),
        bestMock: scores.length ? Math.max(...scores) : 0,
        totalMocks: records.length,
      };
    });

    const leaders = [
      {
        title: "Average Score Leader",
        body: leadText(studentStats, "avgScore", "higher average score"),
      },
      {
        title: "Average Accuracy Leader",
        body: leadText(studentStats, "avgAccuracy", "higher accuracy"),
      },
      {
        title: "Best Mock Leader",
        body: leadText(studentStats, "bestMock", "highest single mock score"),
      },
      {
        title: "Most Mocks",
        body: leadText(studentStats, "totalMocks", "more mocks completed"),
      },
    ];

    return leaders;
  }

  function leadText(stats, key, metricName) {
    const sorted = [...stats].sort((left, right) => right[key] - left[key]);
    const winner = sorted[0];
    const runnerUp = sorted[1];
    if (!winner || !runnerUp || winner[key] === runnerUp[key]) {
      return `It is currently a tie on ${metricName}.`;
    }
    return `${winner.student} leads this metric with ${formatNumber(winner[key], key === "totalMocks" ? 0 : 1)} versus ${runnerUp.student}'s ${formatNumber(runnerUp[key], key === "totalMocks" ? 0 : 1)}.`;
  }

  function renderWeakInsights() {
    const records = getWeakEntries();
    elements.weakTableCount.textContent = `${records.length} record${records.length === 1 ? "" : "s"}`;

    const mistakeCounts = countBy(records, (entry) => entry.mistakeType || "Unspecified mistake");
    const topicCounts = countBy(records, (entry) => entry.topic || "Unspecified topic");
    const weakestTopics = [...topicCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
    const strongestTopics = [...topicCounts.entries()]
      .sort((left, right) => left[1] - right[1])
      .slice(0, 5);

    elements.mistakeFrequencyList.innerHTML = renderFrequencyList(mistakeCounts, "No weak areas yet.");
    elements.weakTopicList.innerHTML = renderTopList(weakestTopics, "No weak topics yet.", "time");
    elements.strongTopicList.innerHTML = renderTopList(strongestTopics, "No strengths recorded yet.", "time");
  }

  function countBy(records, getter) {
    const counts = new Map();
    records.forEach((record) => {
      const key = getter(record);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }

  function renderFrequencyList(countMap, emptyMessage) {
    const items = [...countMap.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5);
    if (!items.length) {
      return `<li><span>${escapeHtml(emptyMessage)}</span><span>0</span></li>`;
    }
    return items
      .map(
        ([label, value]) => `
          <li><span>${escapeHtml(label)}</span><span>${value}</span></li>
        `
      )
      .join("");
  }

  function renderTopList(items, emptyMessage) {
    if (!items.length) {
      return `<li><span>${escapeHtml(emptyMessage)}</span><span>0</span></li>`;
    }
    return items
      .map(
        ([label, value]) => `
          <li><span>${escapeHtml(label)}</span><span>${value} time${value === 1 ? "" : "s"}</span></li>
        `
      )
      .join("");
  }

  function renderReports() {
    const allRecords = getAllMocks();
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const weeklyRecords = allRecords.filter((entry) => new Date(`${entry.date}T00:00:00`) >= weekAgo);
    const monthlyRecords = allRecords.filter((entry) => new Date(`${entry.date}T00:00:00`) >= monthStart);

    renderReportCard(elements.weeklyReport, weeklyRecords);
    renderReportCard(elements.monthlyReport, monthlyRecords);
    renderPlatformDifficulty(elements.platformDifficulty, allRecords);
  }

  function renderReportCard(container, records) {
    const scores = getScoreValues(records);
    const averageScore = average(scores);
    const averageAccuracy = average(records.map((entry) => entry.accuracy));
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const last5Avg = average(records.slice(-5).map((entry) => entry.totalScore));
    const last10Avg = average(records.slice(-10).map((entry) => entry.totalScore));

    container.innerHTML = `
      <div class="report-values">
        <div class="report-line"><span>Mocks</span><strong>${records.length}</strong></div>
        <div class="report-line"><span>Average Score</span><strong>${formatNumber(averageScore, 1)}</strong></div>
        <div class="report-line"><span>Average Accuracy</span><strong>${formatPercent(averageAccuracy, 1)}</strong></div>
        <div class="report-line"><span>Best Score</span><strong>${formatNumber(bestScore, 1)}</strong></div>
        <div class="report-line"><span>Last 5 Avg</span><strong>${formatNumber(last5Avg, 1)}</strong></div>
        <div class="report-line"><span>Last 10 Avg</span><strong>${formatNumber(last10Avg, 1)}</strong></div>
      </div>
    `;
  }

  function renderPlatformDifficulty(container, records) {
    const averages = PLATFORM_ORDER.map((platform) => {
      const platformRecords = records.filter((entry) => entry.platform === platform);
      return {
        platform,
        averageScore: average(platformRecords.map((entry) => entry.totalScore)),
        count: platformRecords.length,
      };
    }).sort((left, right) => left.averageScore - right.averageScore);

    if (!averages.some((entry) => entry.count > 0)) {
      container.innerHTML = `
        <div class="report-values">
          <div class="report-line"><span>Status</span><strong>No platform data yet</strong></div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="report-values">
        ${averages
          .map((entry, index) => {
            const difficulty = index === 0 ? "Hardest" : index === averages.length - 1 ? "Easiest" : "Moderate";
            return `
              <div class="report-line">
                <span>${escapeHtml(entry.platform)} (${difficulty})</span>
                <strong>${formatNumber(entry.averageScore, 1)}</strong>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderCharts() {
    if (!window.Chart) {
      return;
    }
    const records = getAnalyticsMocks();
    const sorted = sortChronologically(records);
    const labels = sorted.map((entry) => formatDate(entry.date));

    ensureCharts();

    updateLineChart(charts.scoreTrend, labels, [
      {
        label: "Total Score",
        data: sorted.map((entry) => entry.totalScore),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.16)",
      },
    ]);

    updateLineChart(charts.accuracyTrend, labels, [
      {
        label: "Accuracy %",
        data: sorted.map((entry) => entry.accuracy),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.16)",
      },
    ]);

    updateLineChart(charts.englishTrend, labels, [
      {
        label: "English",
        data: sorted.map((entry) => entry.englishScore),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.16)",
      },
    ]);

    updateLineChart(charts.reasoningTrend, labels, [
      {
        label: "Reasoning",
        data: sorted.map((entry) => entry.reasoningScore),
        borderColor: "#7c3aed",
        backgroundColor: "rgba(124, 58, 237, 0.16)",
      },
    ]);

    updateLineChart(charts.quantTrend, labels, [
      {
        label: "Quant",
        data: sorted.map((entry) => entry.quantScore),
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.16)",
      },
    ]);

    updateLineChart(charts.gkTrend, labels, [
      {
        label: "GK",
        data: sorted.map((entry) => entry.gkScore),
        borderColor: "#ec4899",
        backgroundColor: "rgba(236, 72, 153, 0.16)",
      },
    ]);

    const platformAverages = PLATFORM_ORDER.map((platform) => {
      const platformRecords = records.filter((entry) => entry.platform === platform);
      return average(platformRecords.map((entry) => entry.totalScore));
    });

    updateBarChart(charts.platformAverage, PLATFORM_ORDER, platformAverages, ["#2563eb", "#0f766e", "#f97316", "#7c3aed", "#14b8a6"]);

    const comparisonLabels = [...new Set(sorted.map((entry) => entry.date))].sort();
    const studentSeries = STUDENTS.map((student) => {
      return comparisonLabels.map((date) => {
        const dayRecords = sorted.filter((entry) => entry.date === date && entry.studentName === student);
        if (!dayRecords.length) {
          return null;
        }
        return average(dayRecords.map((entry) => entry.totalScore));
      });
    });

    updateLineChart(charts.studentComparison, comparisonLabels.map(formatDate), [
      {
        label: STUDENTS[0],
        data: studentSeries[0],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.16)",
      },
      {
        label: STUDENTS[1] || "Student 2",
        data: studentSeries[1],
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.16)",
      },
    ]);
  }

  function ensureCharts() {
    if (Object.keys(charts).length) {
      return;
    }

    charts.scoreTrend = createLineChart("chartScoreTrend");
    charts.accuracyTrend = createLineChart("chartAccuracyTrend");
    charts.englishTrend = createLineChart("chartEnglishTrend");
    charts.reasoningTrend = createLineChart("chartReasoningTrend");
    charts.quantTrend = createLineChart("chartQuantTrend");
    charts.gkTrend = createLineChart("chartGkTrend");
    charts.platformAverage = createBarChart("chartPlatformAverage");
    charts.studentComparison = createLineChart("chartStudentComparison", true);
  }

  function createLineChart(canvasId, multi = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) {
      return null;
    }

    return new window.Chart(canvas, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: chartOptions({
        multi,
        scales: {
          x: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
          y: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
        },
      }),
    });
  }

  function createBarChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) {
      return null;
    }

    return new window.Chart(canvas, {
      type: "bar",
      data: { labels: [], datasets: [] },
      options: chartOptions({
        scales: {
          x: { ticks: { color: getChartTextColor() }, grid: { display: false } },
          y: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
        },
      }),
    });
  }

  function chartOptions({ multi = false, scales = {} } = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: multi,
          labels: {
            color: getChartTextColor(),
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(255,255,255,0.12)",
          borderWidth: 1,
        },
      },
      scales,
    };
  }

  function getChartTextColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#0f172a";
  }

  function getChartGridColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || "rgba(148,163,184,0.2)";
  }

  function updateLineChart(chart, labels, datasets) {
    if (!chart) {
      return;
    }

    chart.data.labels = labels;
    chart.data.datasets = datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.borderColor,
      backgroundColor: dataset.backgroundColor,
      borderWidth: 3,
      pointRadius: 3,
      tension: 0.35,
      fill: true,
      spanGaps: true,
    }));
    chart.options.plugins.legend.display = datasets.length > 1;
    chart.options.scales = {
      x: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
      y: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
    };
    chart.update();
  }

  function updateBarChart(chart, labels, values, colors) {
    if (!chart) {
      return;
    }

    chart.data.labels = labels;
    chart.data.datasets = [
      {
        label: "Average Score",
        data: values,
        backgroundColor: colors,
        borderRadius: 12,
        borderSkipped: false,
      },
    ];
    chart.options.scales = {
      x: { ticks: { color: getChartTextColor() }, grid: { display: false } },
      y: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
    };
    chart.options.plugins.legend.display = false;
    chart.update();
  }

  function scoreClassFor(value) {
    const target = safeNumber(state.settings.targetScore || 160);
    if (value >= target) {
      return "good";
    }
    if (value >= target * 0.75) {
      return "warn";
    }
    return "bad";
  }

  function percentageClassFor(value) {
    if (value >= 80) {
      return "good";
    }
    if (value >= 60) {
      return "warn";
    }
    return "bad";
  }

  function numberClassFor(value) {
    if (value > 0) {
      return "good";
    }
    if (value === 0) {
      return "warn";
    }
    return "bad";
  }

  function readMockForm(complete = true) {
    const data = {
      date: elements.mockDate.value || todayISO(),
      platform: elements.mockPlatform.value,
      mockId: elements.mockId.value.trim(),
      studentName: elements.mockStudent.value,
      totalScore: safeNumber(elements.mockTotalScore.value),
      rank: safeInteger(elements.mockRank.value),
      percentile: safeNumber(elements.mockPercentile.value),
      englishScore: safeNumber(elements.mockEnglish.value),
      reasoningScore: safeNumber(elements.mockReasoning.value),
      quantScore: safeNumber(elements.mockQuant.value),
      gkScore: safeNumber(elements.mockGk.value),
      attemptedQuestions: safeInteger(elements.mockAttempted.value),
      correctQuestions: safeInteger(elements.mockCorrect.value),
      wrongQuestions: safeInteger(elements.mockWrong.value),
      timeTaken: safeNumber(elements.mockTimeTaken.value),
      remarks: elements.mockRemarks.value.trim(),
    };

    if (complete) {
      data.id = state.editingMockId || uid();
      data.createdAt = state.editingMockId
        ? (state.mocks.find((entry) => entry.id === state.editingMockId) || {}).createdAt || new Date().toISOString()
        : new Date().toISOString();
      data.updatedAt = new Date().toISOString();
    }

    return data;
  }

  function getPreviousScoreForStudent(studentName, dateValue, ignoreId = null) {
    if (!studentName) {
      return null;
    }

    const currentTimestamp = toTimestamp(dateValue || todayISO());
    const history = state.mocks
      .filter((entry) => entry.studentName === studentName && entry.id !== ignoreId)
      .sort((left, right) => {
        const dateDelta = toTimestamp(left.date) - toTimestamp(right.date);
        if (dateDelta !== 0) {
          return dateDelta;
        }
        return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
      });

    let previous = null;
    history.forEach((entry) => {
      const timestamp = toTimestamp(entry.date);
      if (timestamp < currentTimestamp || (timestamp === currentTimestamp && entry.createdAt <= (state.mocks.find((mock) => mock.id === ignoreId)?.createdAt || ""))) {
        previous = entry;
      }
    });

    return previous ? previous.totalScore : null;
  }

  function fillMockForm(mock) {
    elements.mockDate.value = mock.date || todayISO();
    elements.mockPlatform.value = mock.platform || "";
    elements.mockId.value = mock.mockId || "";
    elements.mockStudent.value = mock.studentName || "";
    elements.mockTotalScore.value = mock.totalScore ?? "";
    elements.mockRank.value = mock.rank ?? "";
    elements.mockPercentile.value = mock.percentile ?? "";
    elements.mockEnglish.value = mock.englishScore ?? "";
    elements.mockReasoning.value = mock.reasoningScore ?? "";
    elements.mockQuant.value = mock.quantScore ?? "";
    elements.mockGk.value = mock.gkScore ?? "";
    elements.mockAttempted.value = mock.attemptedQuestions ?? "";
    elements.mockCorrect.value = mock.correctQuestions ?? "";
    elements.mockWrong.value = mock.wrongQuestions ?? "";
    elements.mockTimeTaken.value = mock.timeTaken ?? "";
    elements.mockRemarks.value = mock.remarks || "";
  }

  function resetMockForm() {
    state.editingMockId = null;
    elements.mockFormTitle.textContent = "Add Mock Performance";
    elements.mockSubmitBtn.textContent = "Save Mock";
    elements.cancelMockEdit.hidden = true;
    elements.mockForm.reset();
    elements.mockDate.value = todayISO();
  }

  function startMockEdit(id) {
    const mock = state.mocks.find((entry) => entry.id === id);
    if (!mock) {
      return;
    }

    state.editingMockId = id;
    elements.mockFormTitle.textContent = "Edit Mock Performance";
    elements.mockSubmitBtn.textContent = "Update Mock";
    elements.cancelMockEdit.hidden = false;
    fillMockForm(mock);
    elements.mockDate.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteMock(id) {
    const mock = state.mocks.find((entry) => entry.id === id);
    if (!mock) {
      return;
    }

    const confirmed = window.confirm(`Delete mock ${mock.mockId || "entry"} for ${mock.studentName}?`);
    if (!confirmed) {
      return;
    }

    state.mocks = state.mocks.filter((entry) => entry.id !== id);
    state.mocks = recalculateMockMetrics(state.mocks);
    saveState();
    renderAll();
  }

  function handleMockSubmit(event) {
    event.preventDefault();

    if (!elements.mockForm.reportValidity()) {
      return;
    }

    const payload = readMockForm(true);
    const normalized = sanitizeMock(payload);
    if (!normalized) {
      return;
    }

    state.mocks = state.mocks.filter((entry) => entry.id !== normalized.id);
    state.mocks.push(normalized);
    state.mocks = recalculateMockMetrics(state.mocks);
    saveState();
    resetMockForm();
    renderAll();
  }

  function handleWeakSubmit(event) {
    event.preventDefault();

    if (!elements.weakForm.reportValidity()) {
      return;
    }

    const entry = sanitizeWeakArea({
      id: uid(),
      date: elements.weakDate.value || todayISO(),
      student: elements.weakStudent.value,
      subject: elements.weakSubject.value,
      topic: elements.weakTopic.value.trim(),
      mistakeType: elements.weakMistakeType.value.trim(),
      notes: elements.weakNotes.value.trim(),
      createdAt: new Date().toISOString(),
    });

    if (!entry) {
      return;
    }

    state.weakAreas.push(entry);
    saveState();
    elements.weakForm.reset();
    elements.weakDate.value = todayISO();
    renderAll();
  }

  function handleFilterChange() {
    state.filters.student = elements.studentFilter.value;
    state.filters.platform = elements.platformFilter.value;
    state.filters.startDate = elements.startDateFilter.value;
    state.filters.endDate = elements.endDateFilter.value;
    state.filters.search = elements.searchInput.value;
    saveState();
    renderAll();
  }

  function handleSort(columnKey) {
    if (state.sort.key === columnKey) {
      state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
    } else {
      state.sort.key = columnKey;
      state.sort.dir = columnKey === "date" ? "desc" : "asc";
    }
    saveState();
    renderTable();
  }

  function handleTableAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const { action, id } = button.dataset;
    if (action === "edit") {
      startMockEdit(id);
    }
    if (action === "delete") {
      deleteMock(id);
    }
  }

  function exportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      mocks: state.mocks,
      weakAreas: state.weakAreas,
      settings: state.settings,
      sort: state.sort,
      filters: state.filters,
    };
    downloadText(JSON.stringify(payload, null, 2), `ssc-cgl-tracker-backup-${todayISO()}.json`, "application/json");
  }

  function exportCsv() {
    const rows = getTableMocks();
    const header = [
      "Date",
      "Platform",
      "Mock ID",
      "Student Name",
      "Total Score",
      "Rank",
      "Percentile",
      "English Score",
      "Reasoning Score",
      "Quant Score",
      "GK Score",
      "Attempted Questions",
      "Correct Questions",
      "Wrong Questions",
      "Time Taken (minutes)",
      "Accuracy %",
      "Score Improvement",
      "Remarks",
    ];

    const csvRows = [header.join(",")];
    rows.forEach((row) => {
      csvRows.push(
        [
          row.date,
          row.platform,
          row.mockId,
          row.studentName,
          row.totalScore,
          row.rank,
          row.percentile,
          row.englishScore,
          row.reasoningScore,
          row.quantScore,
          row.gkScore,
          row.attemptedQuestions,
          row.correctQuestions,
          row.wrongQuestions,
          row.timeTaken,
          row.accuracy,
          row.scoreImprovement,
          row.remarks,
        ]
          .map(csvEscape)
          .join(",")
      );
    });

    downloadText(csvRows.join("\n"), `ssc-cgl-mock-entries-${todayISO()}.csv`, "text/csv");
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  }

  function downloadText(content, fileName, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        importState(parsed);
      } catch (error) {
        window.alert("The selected file is not a valid JSON backup.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function importState(payload) {
    let imported = payload;
    if (Array.isArray(payload)) {
      imported = { mocks: payload, weakAreas: [], settings: DEFAULT_SETTINGS };
    }

    if (!imported || typeof imported !== "object") {
      window.alert("Unsupported backup format.");
      return;
    }

    state.settings = {
      ...DEFAULT_SETTINGS,
      ...(imported.settings || {}),
    };
    state.mocks = Array.isArray(imported.mocks) ? imported.mocks.map(sanitizeMock).filter(Boolean) : [];
    state.weakAreas = Array.isArray(imported.weakAreas) ? imported.weakAreas.map(sanitizeWeakArea).filter(Boolean) : [];
    state.sort = imported.sort && typeof imported.sort === "object" ? { ...state.sort, ...imported.sort } : state.sort;
    state.filters = imported.filters && typeof imported.filters === "object" ? { ...state.filters, ...imported.filters } : state.filters;
    state.mocks = recalculateMockMetrics(state.mocks);
    saveState();
    syncFilterInputs();
    applyThemeFromState();
    renderAll();
  }

  function syncFilterInputs() {
    elements.studentFilter.value = state.filters.student;
    elements.platformFilter.value = state.filters.platform;
    elements.startDateFilter.value = state.filters.startDate;
    elements.endDateFilter.value = state.filters.endDate;
    elements.searchInput.value = state.filters.search;
    elements.targetScoreInput.value = String(state.settings.targetScore || 160);
  }

  function applyThemeFromState() {
    setTheme(state.settings.theme || "light");
  }

  function saveTargetScore() {
    const targetScore = Math.max(0, safeNumber(elements.targetScoreInput.value));
    state.settings.targetScore = targetScore;
    saveState();
    renderDashboard();
    renderTable();
  }

  function bindEvents() {
    elements.themeToggle.addEventListener("click", toggleTheme);
    elements.exportJsonBtn.addEventListener("click", exportJson);
    elements.importJsonBtn.addEventListener("click", () => elements.importJsonInput.click());
    elements.exportCsvBtn.addEventListener("click", exportCsv);
    elements.importJsonInput.addEventListener("change", handleImportFile);
    elements.saveTargetBtn.addEventListener("click", saveTargetScore);

    [elements.studentFilter, elements.platformFilter, elements.startDateFilter, elements.endDateFilter, elements.searchInput].forEach((input) => {
      input.addEventListener("input", handleFilterChange);
      input.addEventListener("change", handleFilterChange);
    });

    elements.mockForm.addEventListener("submit", handleMockSubmit);
    elements.weakForm.addEventListener("submit", handleWeakSubmit);
    elements.cancelMockEdit.addEventListener("click", resetMockForm);

    [
      elements.mockDate,
      elements.mockPlatform,
      elements.mockId,
      elements.mockStudent,
      elements.mockTotalScore,
      elements.mockRank,
      elements.mockPercentile,
      elements.mockEnglish,
      elements.mockReasoning,
      elements.mockQuant,
      elements.mockGk,
      elements.mockAttempted,
      elements.mockCorrect,
      elements.mockWrong,
      elements.mockTimeTaken,
      elements.mockRemarks,
    ].forEach((input) => {
      input.addEventListener("input", renderLiveMetrics);
      input.addEventListener("change", renderLiveMetrics);
    });

    elements.mockTableBody.addEventListener("click", handleTableAction);
    document.querySelectorAll("th[data-sort]").forEach((header) => {
      header.addEventListener("click", () => handleSort(header.dataset.sort));
    });
  }

  function bindSectionNav() {
    const navLinks = Array.from(document.querySelectorAll('.section-nav a[href^="#"]'));
    if (!navLinks.length) {
      return;
    }

    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) {
      return;
    }

    const setActiveLink = (sectionId) => {
      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${sectionId}`;
        link.classList.toggle('active', isActive);
      });
    };

    const initialSectionId = window.location.hash ? window.location.hash.slice(1) : sections[0].id;
    setActiveLink(initialSectionId);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveLink(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-18% 0px -62% 0px',
        threshold: [0.12, 0.25, 0.4, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function renderAll() {
    renderDashboard();
    renderTable();
    renderLeaderboard();
    renderWeakInsights();
    renderReports();
    renderCharts();
    saveState();
  }

  function initializeDefaults() {
    elements.mockDate.value = todayISO();
    elements.weakDate.value = todayISO();
    if (!state.settings.targetScore) {
      state.settings.targetScore = DEFAULT_SETTINGS.targetScore;
    }
    syncFilterInputs();
    applyThemeFromState();
  }

  function bootstrap() {
    cacheElements();
    populateDropdowns(); // Automatically build <select> HTML elements
    loadState();
    state.mocks = recalculateMockMetrics(state.mocks);
    initializeDefaults();
    resetMockForm();
    bindEvents();
    bindSectionNav();
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();