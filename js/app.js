// ---------- عناصر الصفحة ----------
const habitsListEl = document.getElementById("habits-list");
const totalEl = document.getElementById("total-habits");
const doneTodayEl = document.getElementById("done-today");
const streakEl = document.getElementById("streak");
const weeklyRateEl = document.getElementById("weekly-rate");
const themeToggle = document.getElementById("theme-toggle");

// ---------- تحميل الحالة من localStorage ----------
const STORAGE_KEY = "habits-state";

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      habitsData.habits = parsed.habits || habitsData.habits;
    } catch (e) {
      console.warn("تعذر قراءة البيانات المحفوظة");
    }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits: habitsData.habits }));
}

// ---------- عرض قائمة العادات ----------
function renderHabits() {
  habitsListEl.innerHTML = "";
  habitsData.habits.forEach((habit) => {
    const li = document.createElement("li");
    if (habit.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = habit.done;
    checkbox.addEventListener("change", () => {
      habit.done = checkbox.checked;
      saveState();
      renderHabits();
      updateStats();
      updateCharts();
    });

    const span = document.createElement("span");
    span.textContent = habit.name;

    const tag = document.createElement("small");
    tag.textContent = habit.category;
    tag.style.marginRight = "auto";
    tag.style.color = "var(--muted)";

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(tag);
    habitsListEl.appendChild(li);
  });
}

// ---------- حساب الإحصائيات ----------
function updateStats() {
  const total = habitsData.habits.length;
  const done = habitsData.habits.filter((h) => h.done).length;

  totalEl.textContent = total;
  doneTodayEl.textContent = done;

  // نسبة الالتزام الأسبوعية (من بيانات weeklyProgress)
  const sum = habitsData.weeklyProgress.reduce((a, b) => a + b, 0);
  const max = habitsData.weeklyProgress.length * total || 1;
  weeklyRateEl.textContent = Math.round((sum / max) * 100) + "%";

  // أطول سلسلة: نعتمد على عدد الأيام المتتالية بقيمة >= نصف عدد العادات
  let streak = 0;
  let best = 0;
  const threshold = Math.ceil(total / 2);
  habitsData.weeklyProgress.forEach((v) => {
    if (v >= threshold) {
      streak++;
      best = Math.max(best, streak);
    } else {
      streak = 0;
    }
  });
  streakEl.textContent = best;
}

// ---------- الرسوم البيانية ----------
let weeklyChart = null;
let categoryChart = null;

function updateCharts() {
  const textColor = getComputedStyle(document.body).getPropertyValue("--text").trim();

  // الرسم العمودي
  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(document.getElementById("weeklyChart"), {
    type: "bar",
    data: {
      labels: habitsData.days,
      datasets: [{
        label: "العادات المنجزة",
        data: habitsData.weeklyProgress,
        backgroundColor: "#6366f1",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });

  // الرسم الدائري (توزيع التصنيفات)
  const categories = {};
  habitsData.habits.forEach((h) => {
    categories[h.category] = (categories[h.category] || 0) + 1;
  });

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: textColor } } }
    }
  });
}

// ---------- الوضع الليلي ----------
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.body.classList.add("dark");
  updateToggleLabel();
}

function updateToggleLabel() {
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "☀️ الوضع النهاري"
    : "🌙 الوضع الليلي";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  updateToggleLabel();
  updateCharts(); // إعادة رسم الرسوم لتحديث ألوان النصوص
});

// ---------- التشغيل ----------
loadState();
initTheme();
renderHabits();
updateStats();
updateCharts();
