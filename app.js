// 회사 멘탈 체크기 (웹 버전)
// - 분기(상사/업무량/조직/관계) 선택 후 질문 세트가 달라짐
// - 결과: green/yellow/red
// - 기록: localStorage 자동 저장
// - CSV: 버튼으로 내보내기(다운로드)

const ADVICE = [
  "오늘 결론은 '결정'이 아니라 '보호'다.",
  "감정이 큰 날은 판단이 아니라 루틴이 이긴다.",
  "버티는 것과 망가지는 건 다르다.",
  "'못함'이 아니라 '과부하'일 수 있다.",
  "지금 필요한 건 용기가 아니라 데이터다(기록).",
  "대답이 안 나오면, 질문이 너무 큰 거다. 쪼개자.",
  "오늘의 목표는 해결이 아니라 손실 최소화다.",
  "내가 틀린 게 아니라 환경이 독한 걸 수도 있다.",
  "결정은 컨디션이 아니라 구조를 보고 내린다.",
  "마음이 흔들릴수록, 작은 준비가 가장 강하다."
];

const TODO = [
  "오늘은 결론 내리지 말고 '기록'만 하자.",
  "퇴근 후 10분: 포트폴리오 폴더 정리만 하기.",
  "내일의 나를 위해 '할 일 1개'만 적고 끝내기.",
  "오늘은 상사/회사 생각 멈추기: 알림 꺼두기.",
  "이직 준비 1%만: 채용 공고 1개만 저장하기.",
  "몸 회복 우선: 수면 시간 확보하기.",
  "내 감정 보호: 오늘은 회의/대화 최소화하기.",
  "결정 대신 준비: 통장/고정비만 한 번 확인하기.",
  "내가 이상한 게 아니란 증거: 오늘 있었던 일 3줄 기록하기.",
  "오늘은 '나 편' 해주기: 산책/샤워/정리 중 하나만 하기."
];

// 공통 질문 (분기 전에 3개)
const BASE = [
  {
    id: "branch_pick",
    q: "Q1. 지금 회사를 떠올릴 때, 가장 큰 스트레스는 어디에 가까워?",
    a: "A. 상사/리더(태도, 신뢰, 존중)",
    b: "B. 업무량/일정(끝이 없음, 번아웃)",
    // 여기서는 점수 대신 "분기" 선택으로 사용
    type: "branch",
    options: {
      A: "boss",
      B: "workload"
    }
  },
  {
    id: "repeat",
    q: "Q2. 힘든 일이 '특정 사건(오늘만)'이야, '반복 패턴'이야?",
    a: "A. 오늘만의 이슈가 큼",
    b: "B. 비슷한 일이 반복됨",
    score: { A: 0, B: 1 }
  },
  {
    id: "future",
    q: "Q3. 이 회사에서 6개월 뒤 내 모습이 그려져?",
    a: "A. 대충이라도 상상 가능",
    b: "B. 상상 자체가 싫거나 안 됨",
    score: { A: 0, B: 1 }
  }
];

// 추가 분기: Q1에서 A/B로 2갈래(상사 vs 업무량)
// (원하면 나중에 Q1을 4지선다로 늘려서 관계/조직도 분기 가능)
const BRANCH = {
  boss: [
    {
      id: "respect",
      q: "Q4. 상사/조직이 나를 대하는 태도는?",
      a: "A. 일 기준으로 존중받는 편",
      b: "B. 무시·불신·차별 느낌이 잦음",
      score: { A: 0, B: 1 }
    },
    {
      id: "feedback",
      q: "Q5. 피드백/지시가 '명확'한 편이야?",
      a: "A. 기준과 기대치가 비교적 명확",
      b: "B. 말이 자주 바뀌고 책임이 떠넘겨짐",
      score: { A: 0, B: 1 }
    },
    {
      id: "safety",
      q: "Q6. 회의/보고/대화에서 심리적 안전감이 있어?",
      a: "A. 실수해도 공격받진 않음",
      b: "B. 말 한마디가 항상 눈치/리스크",
      score: { A: 0, B: 1 }
    },
    {
      id: "exit_reason",
      q: "Q7. 지금 퇴사를 고민하는 이유는?",
      a: "A. 그냥 쉬고 싶어서",
      b: "B. 여기서는 더 망가질 것 같아서",
      score: { A: 0, B: 1 }
    }
  ],
  workload: [
    {
      id: "load",
      q: "Q4. 업무량/일정은 통제 가능한 수준이야?",
      a: "A. 바쁘지만 끝은 보임",
      b: "B. 끝이 없고 회복이 안 됨",
      score: { A: 0, B: 1 }
    },
    {
      id: "priority",
      q: "Q6. 우선순위/요청이 정리돼 있어?",
      a: "A. 어느 정도 정리돼 있다",
      b: "B. 다 급하고 다 해야 한다",
      score: { A: 0, B: 1 }
    },
    {
      id: "recover",
      q: "Q7. 요즘 회복(수면/식사/휴식)이 되나?",
      a: "A. 어느 정도는 된다",
      b: "B. 계속 무너진다",
      score: { A: 0, B: 1 }
    },
    {
      id: "exit_reason",
      q: "Q8. 지금 퇴사를 고민하는 이유는?",
      a: "A. 그냥 쉬고 싶어서",
      b: "B. 여기서는 더 망가질 것 같아서",
      score: { A: 0, B: 1 }
    }
  ]
};

const RESULTS = {
  green: {
    badge: "🟢",
    title: "감정 과부하 상태 (결정 보류)",
    msg:
      "지금은 회사 문제라기보다 컨디션/상황이 판단을 흐릴 가능성이 큽니다.\n" +
      "오늘은 결정을 내리기보다 수면/정리/회복이 먼저예요.\n\n" +
      "추천: '내일 다시 판단' 규칙을 걸어두기."
  },
  yellow: {
    badge: "🟡",
    title: "누적 피로 경고 (준비 시작)",
    msg:
      "불만이 '오늘의 감정'이 아니라 '반복되는 패턴'으로 쌓이고 있습니다.\n" +
      "바로 퇴사 결정보다, 준비(이력서/포트폴리오/현금흐름)를 시작하는 게 안전해요.\n\n" +
      "추천: 2주 안에 '선택지 2개'를 만들어두기."
  },
  red: {
    badge: "🔴",
    title: "구조적 문제 상태 (이탈 고려)",
    msg:
      "지속될수록 소모되는 구조일 가능성이 큽니다.\n" +
      "이탈(이직/휴식/전환)을 현실 옵션으로 놓고 움직이는 게 안전합니다.\n\n" +
      "추천: '탈출 계획'(기간/자금/포트폴리오)을 문서로 만들기."
  }
};

// 저장 키
const LS_KEY = "companyMentalLogs_v1";

function nowStr() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
}

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(LS_KEY, JSON.stringify(logs));
}

function appendLog(entry) {
  const logs = loadLogs();
  logs.push(entry);
  saveLogs(logs);
  return logs;
}

function clearLogs() {
  localStorage.removeItem(LS_KEY);
}

function toCSV(logs) {
  // date,score,result,branch
  const header = ["date", "score", "result", "branch"].join(",");
  const rows = logs.map(l => [
    escapeCSV(l.date),
    l.score,
    l.result,
    escapeCSV(l.branch)
  ].join(","));
  return [header, ...rows].join("\n");
}

function escapeCSV(value) {
  const s = String(value ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function trendSummary(logs, n = 7) {
  const last = logs.slice(-n);
  const counts = { green: 0, yellow: 0, red: 0 };

  for (const l of last) {
    if (counts[l.result] !== undefined) counts[l.result] += 1;
  }

  const yellowOrMore = counts.yellow + counts.red;

  const line =
    last.length === 0
      ? "기록이 아직 없어요."
      : `최근 ${last.length}회 중 ${yellowOrMore}회가 🟡 이상입니다 (🟢${counts.green} 🟡${counts.yellow} 🔴${counts.red}).`;

  return { counts, yellowOrMore, line };
}

function consecutiveWarning(logs, target = "red", streak = 3) {
  if (!logs.length) return null;

  let run = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].result === target) run += 1;
    else break;
  }

  if (run >= streak) {
    return `⚠️ 연속 ${run}회 🔴 상태입니다. 오늘은 결정을 멈추고 '회복/보호'가 우선이에요.`;
  }
  return null;
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------- UI State ----------------
const $ = (id) => document.getElementById(id);

const screenStart = $("screen-start");
const screenQuiz = $("screen-quiz");
const screenResult = $("screen-result");

const btnStart = $("btn-start");
const btnA = $("btn-a");
const btnB = $("btn-b");
const btnBack = $("btn-back");
const btnReset = $("btn-reset");

const progressBar = $("progress-bar");
const progressText = $("progress-text");
const qTitle = $("q-title");

const resultBadge = $("result-badge");
const resultTitle = $("result-title");
const resultMsg = $("result-msg");
const resultScore = $("result-score");
const resultBranch = $("result-branch");
const resultSaved = $("result-saved");
const adviceText = $("advice-text");
const trendLine = $("trend-line");
const historyList = $("history-list");

const btnAgain = $("btn-again");
const btnTodo = $("btn-todo");
const btnExport = $("btn-export");
const btnClear = $("btn-clear");

let flow = [];              // 실제 질문 흐름(분기 반영된 배열)
let idx = 0;                // 현재 질문 인덱스
let score = 0;              // 점수
let branchKey = "unknown";  // boss / workload
let answers = [];           // {id, pick}

function resetState() {
  flow = [];
  idx = 0;
  score = 0;
  branchKey = "unknown";
  answers = [];
}

function buildFlow() {
  // BASE 3개 + 분기 질문 4개(총 7문항)
  flow = [...BASE];
  // 분기는 첫 문항에서 결정되므로 일단 임시로 넣고, 실제로는 Q1 답 이후에 붙인다.
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function startQuiz() {
  resetState();
  buildFlow();
  hide(screenStart);
  hide(screenResult);
  show(screenQuiz);
  renderQuestion();
}

function renderQuestion() {
  const total = flow.length;
  const current = flow[idx];

  // 진행률 UI
  const progress = total ? ((idx + 1) / total) * 100 : 0;
  progressBar.style.width = `${progress}%`;
  progressBar.style.background = "rgba(34,197,94,0.6)";
  progressText.textContent = `${idx + 1} / ${total}`;

  qTitle.textContent = current.q;
  btnA.textContent = current.a;
  btnB.textContent = current.b;

  btnBack.disabled = idx === 0;
}

function applyAnswer(pick /* "A"|"B" */) {
  const current = flow[idx];

  // 기록
  answers[idx] = { id: current.id, pick };

  // 분기 처리
  if (current.type === "branch") {
    branchKey = current.options[pick];
    // Q1 답한 시점에 분기 질문 세트를 뒤에 붙임
    const branchQuestions = BRANCH[branchKey] || [];
    flow = [...BASE, ...branchQuestions];
  } else {
    const add = current.score?.[pick] ?? 0;
    // 이미 답했던 질문을 바꿀 때 점수 재계산이 필요하므로
    // 여기서는 단순 누적 대신 "재계산 방식"을 사용
  }

  // 점수는 항상 answers 기반으로 재계산(되돌아가기 대응)
  score = recalcScore();

  // 다음으로
  idx += 1;
  if (idx >= flow.length) {
    showResult();
  } else {
    renderQuestion();
  }
}

function recalcScore() {
  let s = 0;
  for (let i = 0; i < answers.length; i++) {
    const a = answers[i];
    if (!a) continue;
    const q = flow[i];
    if (!q || q.type === "branch") continue;
    s += q.score?.[a.pick] ?? 0;
  }
  return s;
}

function goBack() {
  if (idx === 0) return;
  idx -= 1;
  // 되돌아가도 flow는 유지 (분기 선택 바꾸면 Q1에서 다시 결정됨)
  renderQuestion();
}

function scoreToKey(s) {
  // 6점 만점(분기 제외) 기준
  // 0~1 green, 2~4 yellow, 5~6 red
  if (s <= 1) return "green";
  if (s <= 4) return "yellow";
  return "red";
}

function branchLabel(key) {
  if (key === "boss") return "상사/리더 스트레스";
  if (key === "workload") return "업무량/일정 스트레스";
  return "미분류";
}

function randomAdvice() {
  const i = Math.floor(Math.random() * ADVICE.length);
  return ADVICE[i];
}

function showResult() {
  hide(screenQuiz);
  show(screenResult);

  const resultKey = scoreToKey(score);
  const r = RESULTS[resultKey];

  resultBadge.textContent = r.badge;
  resultTitle.textContent = r.title;
  resultMsg.textContent = r.msg;

  const advice = randomAdvice();
  adviceText.textContent = advice;

  const scoreMax = flow.filter(q => q.type !== "branch").length; // 점수 대상 문항 수
  resultScore.textContent = `${score} / ${scoreMax}`;
  resultBranch.textContent = branchLabel(branchKey);

  // 저장
  const entry = {
    date: nowStr(),
    score,
    result: resultKey,
    branch: branchKey,
    advice
  };
  const logs = appendLog(entry);
  resultSaved.textContent = "localStorage 저장됨";

  // 최근 추세 요약
  const t = trendSummary(logs, 7);
  trendLine.textContent = t.line;

  // 🔴 연속 경고(연속 3회 이상)
  const warn = consecutiveWarning(logs, "red", 3);
  if (warn) {
    trendLine.textContent += "\n" + warn;
  }

  renderHistory(logs);
}

function renderHistory(logs) {
  const last = logs.slice(-10).reverse();
  if (!last.length) {
    historyList.textContent = "기록이 없습니다.";
    return;
  }
  historyList.textContent = last.map(l => {
    return `- ${l.date} | score=${l.score} | ${l.result} | ${branchLabel(l.branch)}`;
  }).join("\n");
}

// ---------------- events ----------------
btnStart.addEventListener("click", startQuiz);
btnA.addEventListener("click", () => applyAnswer("A"));
btnB.addEventListener("click", () => applyAnswer("B"));
btnBack.addEventListener("click", goBack);
btnReset.addEventListener("click", () => {
  hide(screenQuiz);
  hide(screenResult);
  show(screenStart);
  resetState();
});

btnAgain.addEventListener("click", startQuiz);

btnTodo.addEventListener("click", () => {
  const i = Math.floor(Math.random() * TODO.length);
  adviceText.textContent = TODO[i];
});

btnExport.addEventListener("click", () => {
  const logs = loadLogs();
  if (!logs.length) {
    alert("내보낼 기록이 없어요.");
    return;
  }
  const csv = toCSV(logs);
  const filename = `company_mental_logs_${new Date().toISOString().slice(0,10)}.csv`;
  download(filename, csv);
});

btnClear.addEventListener("click", () => {
  const ok = confirm("정말 기록을 초기화할까요?");
  if (!ok) return;
  clearLogs();
  renderHistory([]);
  alert("기록이 초기화됐어요.");
});

// 처음 화면에서 기록 미리 표시(선택)
renderHistory(loadLogs());
