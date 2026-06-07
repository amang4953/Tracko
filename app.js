/**
 * Classic Gray Habit Tracker - Application Logic
 * Users build their own habits from scratch.
 */

// --- STATE MANAGEMENT ---
let state = {
  year: 2026,
  month: 0, // January (0-indexed)
  habits: [],
  logs: {}
};

// Track which habit is being edited (null = adding new)
let editingHabitId = null;

// Global chart instances
let chartOverallInstance = null;
let chartDailyInstance = null;
let chartWeeklyInstance = null;
let chartMentalInstance = null;

// --- DOM ELEMENTS ---
const elements = {
  yearSelect: document.getElementById('year-select'),
  monthSelect: document.getElementById('month-select'),
  currentMonthSubtitle: document.getElementById('current-month-subtitle'),
  
  // Grid Elements
  gridTable: document.getElementById('habit-grid-table'),
  gridBody: document.getElementById('habit-grid-body'),
  habitTableWrapper: document.getElementById('habit-table-wrapper'),
  emptyNotice: document.getElementById('empty-habits-notice'),
  
  // Mental Grid
  mentalGridTable: document.getElementById('mental-grid-table'),
  mentalRowMood: document.getElementById('mental-row-mood'),
  mentalRowMotivation: document.getElementById('mental-row-motivation'),
  
  // Metrics Counters
  metricGoal: document.getElementById('metric-goal'),
  metricCompleted: document.getElementById('metric-completed'),
  metricLeft: document.getElementById('metric-left'),
  donutPercentageLabel: document.getElementById('donut-percentage-label'),
  
  // Leaderboard
  leaderboardList: document.getElementById('leaderboard-list'),
  
  // Habit Buttons
  btnAddHabit: document.getElementById('btn-add-habit'),
  
  // Modal
  modalOverlay: document.getElementById('habit-modal-overlay'),
  modalTitleText: document.getElementById('modal-title-text'),
  habitNameInput: document.getElementById('habit-name-input'),
  btnModalClose: document.getElementById('btn-modal-close'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalSave: document.getElementById('btn-modal-save'),
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Calendar change listeners
  elements.yearSelect.addEventListener('change', handleCalendarChange);
  elements.monthSelect.addEventListener('change', handleCalendarChange);

  // Habit management listeners
  elements.btnAddHabit.addEventListener('click', openAddHabitModal);
  elements.btnModalClose.addEventListener('click', closeModal);
  elements.btnModalCancel.addEventListener('click', closeModal);
  elements.btnModalSave.addEventListener('click', saveHabit);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });
  elements.habitNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveHabit();
    if (e.key === 'Escape') closeModal();
  });

  // Initialize Theme and Palette from local storage
  const savedTheme = localStorage.getItem('selected_theme') || 'light';
  const savedPalette = localStorage.getItem('selected_palette') || 'indigo';
  
  document.body.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-palette', savedPalette);
  
  // Set active class on the corresponding palette button
  document.querySelectorAll('.palette-btn').forEach(btn => {
    if (btn.getAttribute('data-palette') === savedPalette) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Theme toggle listener
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      // Cyber Neon is locked to dark mode
      const currentPalette = document.body.getAttribute('data-palette');
      if (currentPalette === 'neon') return;

      const currentTheme = document.body.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', newTheme);
      localStorage.setItem('selected_theme', newTheme);
      updateCharts();
    });
  }

  // Palette selector listeners
  document.querySelectorAll('.palette-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const palette = btn.getAttribute('data-palette');
      
      // Cyber Neon is dark-only, so force dark mode
      if (palette === 'neon') {
        document.body.setAttribute('data-theme', 'dark');
      }
      
      document.body.setAttribute('data-palette', palette);
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      localStorage.setItem('selected_palette', palette);
      localStorage.setItem('selected_theme', document.body.getAttribute('data-theme'));
      
      updateCharts();
    });
  });

  // Export & Import event listeners
  const btnExport = document.getElementById('btn-export-data');
  const btnImport = document.getElementById('btn-import-data');
  const fileInput = document.getElementById('import-file-input');

  if (btnExport) {
    btnExport.addEventListener('click', exportData);
  }
  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImportFile);
  }

  // Load from local storage
  loadFromLocalStorage();

  // If no habits saved yet, load defaults
  if (state.habits.length === 0) {
    initializeDefaultHabits();
    saveToLocalStorage();
  }

  // Sync selects with loaded state
  elements.yearSelect.value = String(state.year);
  elements.monthSelect.value = String(state.month);

  // Set Month Subtitle
  updateMonthSubtitle();

  // Build and show tracker grids
  buildCalendarGrid();
  buildMentalGrid();
  updateDashboard();
});

// --- DATE UTILITIES ---
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getDayOfWeekName(year, month, day) {
  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
}

function getMonthYearKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function updateMonthSubtitle() {
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  elements.currentMonthSubtitle.textContent = `--${monthNames[state.month]}--`;
}

// --- CALENDAR CHANGE ---
function handleCalendarChange() {
  state.year = parseInt(elements.yearSelect.value);
  state.month = parseInt(elements.monthSelect.value);
  updateMonthSubtitle();
  saveToLocalStorage();
  buildCalendarGrid();
  buildMentalGrid();
  updateDashboard();
}

// --- HABIT MODAL ---
function openAddHabitModal() {
  editingHabitId = null;
  elements.modalTitleText.textContent = 'ADD NEW HABIT';
  elements.habitNameInput.value = '';
  elements.modalOverlay.style.display = 'flex';
  setTimeout(() => elements.habitNameInput.focus(), 50);
}

function openEditHabitModal(habitId) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  editingHabitId = habitId;
  elements.modalTitleText.textContent = 'EDIT HABIT';
  elements.habitNameInput.value = habit.name;
  elements.modalOverlay.style.display = 'flex';
  setTimeout(() => elements.habitNameInput.focus(), 50);
}

function closeModal() {
  elements.modalOverlay.style.display = 'none';
  editingHabitId = null;
}

function saveHabit() {
  const name = elements.habitNameInput.value.trim();
  if (!name) {
    elements.habitNameInput.focus();
    elements.habitNameInput.style.borderColor = '#dc2626';
    setTimeout(() => { elements.habitNameInput.style.borderColor = ''; }, 1500);
    return;
  }

  if (editingHabitId) {
    // Edit existing habit
    const habit = state.habits.find(h => h.id === editingHabitId);
    if (habit) habit.name = name;
  } else {
    // Add new habit
    const newId = 'h_' + Date.now();
    state.habits.push({ id: newId, name });
  }

  saveToLocalStorage();
  closeModal();
  buildCalendarGrid();
  updateDashboard();
}

function deleteHabit(habitId) {
  if (!confirm('Delete this habit and all its tracked data?')) return;
  state.habits = state.habits.filter(h => h.id !== habitId);
  // Remove logs for this habit across all months
  Object.keys(state.logs).forEach(key => {
    if (state.logs[key].checked && state.logs[key].checked[habitId]) {
      delete state.logs[key].checked[habitId];
    }
  });
  saveToLocalStorage();
  buildCalendarGrid();
  updateDashboard();
}

// --- GRID BUILDER ---
function buildCalendarGrid() {
  const daysInMonth = getDaysInMonth(state.year, state.month);
  const key = getMonthYearKey(state.year, state.month);

  // Ensure storage node exists
  if (!state.logs[key]) {
    state.logs[key] = { checked: {}, mental: {} };
  }
  const checkedLogs = state.logs[key].checked;

  // Show/hide empty notice
  if (state.habits.length === 0) {
    elements.emptyNotice.style.display = 'block';
    elements.habitTableWrapper.style.display = 'none';
    return;
  } else {
    elements.emptyNotice.style.display = 'none';
    elements.habitTableWrapper.style.display = '';
  }

  // Calculate spans for weeks
  let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (d <= 7) w1++;
    else if (d <= 14) w2++;
    else if (d <= 21) w3++;
    else if (d <= 28) w4++;
    else w5++;
  }

  // Row 1: Group Headers (extra colspan=1 for Actions column)
  let headerRow1 = `<tr><th rowspan="2" class="habit-name-header">My Habits</th>`;
  headerRow1 += `<th colspan="${w1}" class="week-header">Week 1</th>`;
  headerRow1 += `<th colspan="${w2}" class="week-header">Week 2</th>`;
  headerRow1 += `<th colspan="${w3}" class="week-header">Week 3</th>`;
  headerRow1 += `<th colspan="${w4}" class="week-header">Week 4</th>`;
  if (w5 > 0) {
    headerRow1 += `<th colspan="${w5}" class="week-header">Week 5</th>`;
  }
  headerRow1 += `<th colspan="5" class="week-header">Analysis</th>`;
  headerRow1 += `<th rowspan="2" class="week-header" style="min-width:55px;">Actions</th>`;
  headerRow1 += `</tr>`;

  // Row 2: Days Header + Analysis Subheaders
  let headerRow2 = '<tr>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dayName = getDayOfWeekName(state.year, state.month, d);
    const isWeekend = (dayName === 'Sa' || dayName === 'Su');
    headerRow2 += `
      <th class="${isWeekend ? 'weekend-header' : ''}">
        ${dayName}
        <span class="day-subheading">${d}</span>
      </th>`;
  }
  headerRow2 += `
    <th style="width: 45px;">GOAL</th>
    <th style="width: 50px;">ACTUAL</th>
    <th style="width: 45px;">LEFT</th>
    <th style="width: 80px;">PROGRESS</th>
    <th style="width: 55px;">%</th>
  </tr>`;

  elements.gridTable.querySelector('thead').innerHTML = headerRow1 + headerRow2;

  // Build Habit Rows
  let tbodyHtml = '';
  state.habits.forEach(habit => {
    if (!checkedLogs[habit.id]) {
      checkedLogs[habit.id] = {};
    }

    let checkedCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (checkedLogs[habit.id][d] === true) checkedCount++;
    }

    const goal = daysInMonth;
    const actual = checkedCount;
    const left = Math.max(0, goal - actual);
    const percentage = goal > 0 ? ((actual / goal) * 100).toFixed(2) : '0.00';

    tbodyHtml += `<tr>`;
    tbodyHtml += `<td class="habit-name-cell" title="${escapeHtml(habit.name)}">${escapeHtml(habit.name)}</td>`;

    // Checkbox cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dayName = getDayOfWeekName(state.year, state.month, d);
      const isWeekend = (dayName === 'Sa' || dayName === 'Su');
      const isChecked = checkedLogs[habit.id][d] || false;

      tbodyHtml += `
        <td class="checkbox-cell ${isWeekend ? 'weekend-cell' : ''}" onclick="toggleGridCell(this, '${habit.id}', ${d})">
          <label class="custom-checkbox" onclick="event.stopPropagation();">
            <input type="checkbox" data-habit-id="${habit.id}" data-day="${d}" ${isChecked ? 'checked' : ''} onchange="handleGridCheckboxChange('${habit.id}', ${d}, this.checked)">
            <span class="checkmark"></span>
          </label>
        </td>`;
    }

    // Analysis Columns
    tbodyHtml += `
      <td class="col-goal">${goal}</td>
      <td class="col-actual">${actual}</td>
      <td class="col-left">${left}</td>
      <td class="col-progress">
        <div class="cell-progress-container">
          <div class="cell-progress-fill" style="width: ${percentage}%"></div>
        </div>
      </td>
      <td class="col-percent">${percentage}%</td>
    `;

    // Actions Column
    tbodyHtml += `
      <td class="habit-action-cell">
        <button class="habit-action-btn btn-edit" title="Edit habit" onclick="openEditHabitModal('${habit.id}')">✏️</button>
        <button class="habit-action-btn btn-delete" title="Delete habit" onclick="deleteHabit('${habit.id}')">🗑️</button>
      </td>
    `;

    tbodyHtml += `</tr>`;
  });

  elements.gridBody.innerHTML = tbodyHtml;
}

// --- MENTAL GRID ---
function buildMentalGrid() {
  const daysInMonth = getDaysInMonth(state.year, state.month);
  const key = getMonthYearKey(state.year, state.month);
  const mentalLogs = state.logs[key]?.mental || {};

  let theadHtml = `<tr><th class="mental-label-cell">Mental State</th>`;
  for (let d = 1; d <= daysInMonth; d++) {
    theadHtml += `<th style="width: 25px; background-color: var(--dark-header-bg);">${d}</th>`;
  }
  theadHtml += `</tr>`;
  elements.mentalGridTable.querySelector('thead').innerHTML = theadHtml;

  // Mood Row
  let moodRowHtml = `<td class="mental-label-cell">Mood</td>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const val = mentalLogs[d]?.mood !== undefined ? mentalLogs[d].mood : '';
    moodRowHtml += `
      <td class="mental-value-cell">
        <input type="number" min="1" max="10" placeholder="-" value="${val}" 
               class="mental-cell-input" onchange="handleMentalCellChange(${d}, 'mood', this.value)">
      </td>`;
  }
  elements.mentalRowMood.innerHTML = moodRowHtml;

  // Motivation Row
  let motivationRowHtml = `<td class="mental-label-cell">Motivation</td>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const val = mentalLogs[d]?.motivation !== undefined ? mentalLogs[d].motivation : '';
    motivationRowHtml += `
      <td class="mental-value-cell">
        <input type="number" min="1" max="10" placeholder="-" value="${val}" 
               class="mental-cell-input" onchange="handleMentalCellChange(${d}, 'motivation', this.value)">
      </td>`;
  }
  elements.mentalRowMotivation.innerHTML = motivationRowHtml;
}

function handleMentalCellChange(day, type, value) {
  const key = getMonthYearKey(state.year, state.month);
  if (!state.logs[key]) state.logs[key] = { checked: {}, mental: {} };
  if (!state.logs[key].mental) state.logs[key].mental = {};

  let valInt = parseInt(value);
  if (isNaN(valInt) || valInt < 1 || valInt > 10) {
    if (value === '') {
      if (state.logs[key].mental[day]) {
        delete state.logs[key].mental[day][type];
      }
    } else {
      alert("Please enter a value between 1 and 10.");
      buildMentalGrid();
      return;
    }
  } else {
    if (!state.logs[key].mental[day]) state.logs[key].mental[day] = {};
    state.logs[key].mental[day][type] = valInt;
  }

  saveToLocalStorage();
  updateCharts();
}

// --- CHECKBOX HANDLERS ---
function toggleGridCell(tdCell, habitId, day) {
  const checkbox = tdCell.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  handleGridCheckboxChange(habitId, day, checkbox.checked);
}

function handleGridCheckboxChange(habitId, day, isChecked) {
  const key = getMonthYearKey(state.year, state.month);
  if (!state.logs[key]) state.logs[key] = { checked: {}, mental: {} };
  if (!state.logs[key].checked[habitId]) state.logs[key].checked[habitId] = {};

  state.logs[key].checked[habitId][day] = isChecked;

  saveToLocalStorage();
  buildCalendarGrid();
  updateDashboard();
}

// --- METRIC AGGREGATIONS ---
function updateDashboard() {
  const daysInMonth = getDaysInMonth(state.year, state.month);
  const key = getMonthYearKey(state.year, state.month);
  const monthLogs = state.logs[key] || { checked: {}, mental: {} };
  const checkedLogs = monthLogs.checked || {};

  const numHabits = state.habits.length;
  const totalGoalChecks = numHabits * daysInMonth;

  let completedChecks = 0;
  state.habits.forEach(habit => {
    const habitChecks = checkedLogs[habit.id] || {};
    for (let d = 1; d <= daysInMonth; d++) {
      if (habitChecks[d] === true) completedChecks++;
    }
  });

  const leftChecks = Math.max(0, totalGoalChecks - completedChecks);

  elements.metricGoal.textContent = totalGoalChecks;
  elements.metricCompleted.textContent = completedChecks;
  elements.metricLeft.textContent = leftChecks;

  const percentComplete = totalGoalChecks > 0
    ? ((completedChecks / totalGoalChecks) * 100).toFixed(1)
    : '0.0';
  elements.donutPercentageLabel.textContent = `${percentComplete}%`;

  updateLeaderboard(daysInMonth, checkedLogs);
  updateCharts();
}

function updateLeaderboard(daysInMonth, checkedLogs) {
  let scores = state.habits.map(habit => {
    const habitChecks = checkedLogs[habit.id] || {};
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (habitChecks[d] === true) count++;
    }
    return { name: habit.name, count };
  });

  scores.sort((a, b) => b.count - a.count);

  let lbHtml = '';
  scores.slice(0, 10).forEach((item, index) => {
    lbHtml += `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${index + 1}</span>
        <span class="leaderboard-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        <span class="leaderboard-score">${item.count}</span>
      </div>`;
  });

  elements.leaderboardList.innerHTML = lbHtml ||
    '<div style="color:var(--text-muted); font-size:0.75rem; padding: 0.5rem; text-align:center;">No habits tracked yet.</div>';
}

// --- CHART GENERATION (CHART.JS) ---
function updateCharts() {
  const daysInMonth = getDaysInMonth(state.year, state.month);
  const key = getMonthYearKey(state.year, state.month);
  const monthLogs = state.logs[key] || { checked: {}, mental: {} };
  const checkedLogs = monthLogs.checked || {};
  const mentalLogs = monthLogs.mental || {};
  const numHabits = state.habits.length;

  const isDark = document.body.getAttribute('data-theme') === 'dark';
  let accentPrimary = getComputedStyle(document.body).getPropertyValue('--accent-primary').trim();
  let accentSecondary = getComputedStyle(document.body).getPropertyValue('--accent-secondary').trim();
  let textMuted = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();

  // Strip !important suffix if present (defense-in-depth)
  if (accentPrimary.includes('!important')) accentPrimary = accentPrimary.split('!important')[0].trim();
  if (accentSecondary.includes('!important')) accentSecondary = accentSecondary.split('!important')[0].trim();
  if (textMuted.includes('!important')) textMuted = textMuted.split('!important')[0].trim();

  const chartColors = {
    bars: accentPrimary || '#6366f1',
    completedSlice: accentPrimary || '#6366f1',
    remainingSlice: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    moodLine: '#ef4444',
    motivationLine: '#d97706',
    gridLines: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    ticks: textMuted || '#64748b',
  };

  // 1. OVERALL STATS CHART (Donut)
  let totalGoal = numHabits * daysInMonth;
  let completed = 0;
  state.habits.forEach(h => {
    const ch = checkedLogs[h.id] || {};
    for (let d = 1; d <= daysInMonth; d++) {
      if (ch[d] === true) completed++;
    }
  });
  let left = Math.max(0, totalGoal - completed);

  const canvasOverall = document.getElementById('chart-overall');
  const ctxOverall = canvasOverall.getContext('2d');

  if (chartOverallInstance) {
    chartOverallInstance.data.datasets[0].data = totalGoal > 0 ? [completed, left] : [0, 1];
    chartOverallInstance.data.datasets[0].backgroundColor = [chartColors.completedSlice, chartColors.remainingSlice];
    chartOverallInstance.data.datasets[0].borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    chartOverallInstance.update();
  } else {
    chartOverallInstance = new Chart(ctxOverall, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Left'],
        datasets: [{
          data: totalGoal > 0 ? [completed, left] : [0, 1],
          backgroundColor: [chartColors.completedSlice, chartColors.remainingSlice],
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });
  }

  // 2. DAILY PROGRESS CHART (Bar)
  const dailyLabels = [];
  const dailyPercentages = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dailyLabels.push(d);
    let checksForDay = 0;
    state.habits.forEach(h => {
      if (checkedLogs[h.id]?.[d] === true) checksForDay++;
    });
    const pct = numHabits > 0 ? Math.round((checksForDay / numHabits) * 100) : 0;
    dailyPercentages.push(pct);
  }

  const canvasDaily = document.getElementById('chart-daily');
  const ctxDaily = canvasDaily.getContext('2d');

  if (chartDailyInstance) {
    chartDailyInstance.data.labels = dailyLabels;
    chartDailyInstance.data.datasets[0].data = dailyPercentages;
    chartDailyInstance.data.datasets[0].backgroundColor = chartColors.bars;
    chartDailyInstance.options.scales.y.grid.color = chartColors.gridLines;
    chartDailyInstance.options.scales.y.ticks.color = chartColors.ticks;
    chartDailyInstance.options.scales.x.ticks.color = chartColors.ticks;
    chartDailyInstance.update();
  } else {
    chartDailyInstance = new Chart(ctxDaily, {
      type: 'bar',
      data: {
        labels: dailyLabels,
        datasets: [{
          label: 'Daily Progress %',
          data: dailyPercentages,
          backgroundColor: chartColors.bars,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#71717a',
          borderWidth: 1,
          barPercentage: 0.75,
          clip: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 6 } },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: chartColors.gridLines },
            ticks: {
              color: chartColors.ticks,
              font: { size: 8 },
              callback: function(value) { return value + '%'; }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: chartColors.ticks, font: { size: 7 }, maxRotation: 0 },
            offset: true
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 3. WEEKLY PROGRESS CHART (Bar)
  const weeklyCompletion = [0, 0, 0, 0, 0];
  const weeklyTargets = [0, 0, 0, 0, 0];

  for (let d = 1; d <= daysInMonth; d++) {
    let weekIdx = 0;
    if (d <= 7) weekIdx = 0;
    else if (d <= 14) weekIdx = 1;
    else if (d <= 21) weekIdx = 2;
    else if (d <= 28) weekIdx = 3;
    else weekIdx = 4;

    state.habits.forEach(h => {
      weeklyTargets[weekIdx]++;
      if (checkedLogs[h.id]?.[d] === true) {
        weeklyCompletion[weekIdx]++;
      }
    });
  }

  const weeklyPercentages = weeklyCompletion.map((completedCount, idx) => {
    const target = weeklyTargets[idx];
    return target > 0 ? Math.round((completedCount / target) * 100) : 0;
  });

  const weeklyLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  if (daysInMonth <= 28) {
    weeklyLabels.pop();
    weeklyPercentages.pop();
  }

  const canvasWeekly = document.getElementById('chart-weekly');
  const ctxWeekly = canvasWeekly.getContext('2d');

  if (chartWeeklyInstance) {
    chartWeeklyInstance.data.labels = weeklyLabels;
    chartWeeklyInstance.data.datasets[0].data = weeklyPercentages;
    chartWeeklyInstance.data.datasets[0].backgroundColor = chartColors.bars;
    chartWeeklyInstance.options.scales.y.grid.color = chartColors.gridLines;
    chartWeeklyInstance.options.scales.y.ticks.color = chartColors.ticks;
    chartWeeklyInstance.options.scales.x.ticks.color = chartColors.ticks;
    chartWeeklyInstance.update();
  } else {
    chartWeeklyInstance = new Chart(ctxWeekly, {
      type: 'bar',
      data: {
        labels: weeklyLabels,
        datasets: [{
          label: 'Weekly Progress %',
          data: weeklyPercentages,
          backgroundColor: chartColors.bars,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#71717a',
          borderWidth: 1,
          barPercentage: 0.55,
          clip: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 6 } },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: chartColors.gridLines },
            ticks: {
              color: chartColors.ticks,
              font: { size: 8 },
              callback: function(value) { return value + '%'; }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: chartColors.ticks, font: { size: 8 } },
            offset: true
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 4. MENTAL STATE CHART (Dual line Area chart)
  const mentalDays = [];
  const moodScores = [];
  const motivationScores = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const log = mentalLogs[d];
    mentalDays.push(d);
    moodScores.push(log && log.mood !== undefined ? log.mood : null);
    motivationScores.push(log && log.motivation !== undefined ? log.motivation : null);
  }

  const mentalData = {
    labels: mentalDays,
    datasets: [
      {
        label: 'Mood',
        data: moodScores,
        borderColor: chartColors.moodLine,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        fill: true,
        tension: 0.4,
        borderWidth: 1.5,
        pointBackgroundColor: chartColors.moodLine,
        pointRadius: 2.5,
        spanGaps: true
      },
      {
        label: 'Motivation',
        data: motivationScores,
        borderColor: chartColors.motivationLine,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 1.5,
        pointBackgroundColor: chartColors.motivationLine,
        pointRadius: 2.5,
        spanGaps: true
      }
    ]
  };

  const canvasMental = document.getElementById('chart-mental');
  const ctxMental = canvasMental.getContext('2d');

  if (chartMentalInstance) {
    chartMentalInstance.data.labels = mentalDays;
    chartMentalInstance.data.datasets[0].data = moodScores;
    chartMentalInstance.data.datasets[0].borderColor = chartColors.moodLine;
    chartMentalInstance.data.datasets[0].pointBackgroundColor = chartColors.moodLine;
    chartMentalInstance.data.datasets[1].data = motivationScores;
    chartMentalInstance.data.datasets[1].borderColor = chartColors.motivationLine;
    chartMentalInstance.data.datasets[1].pointBackgroundColor = chartColors.motivationLine;
    chartMentalInstance.options.scales.y.grid.color = chartColors.gridLines;
    chartMentalInstance.options.scales.y.ticks.color = chartColors.ticks;
    chartMentalInstance.options.scales.x.ticks.color = chartColors.ticks;
    chartMentalInstance.options.plugins.legend.labels.color = chartColors.ticks;
    chartMentalInstance.update();
  } else {
    chartMentalInstance = new Chart(ctxMental, {
      type: 'line',
      data: mentalData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 10,
            grid: { color: chartColors.gridLines },
            ticks: { color: chartColors.ticks, font: { size: 9 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: chartColors.ticks, font: { size: 8 } }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: chartColors.ticks, font: { size: 9, family: 'Inter' } }
          }
        }
      }
    });
  }
}

// --- LOCAL STORAGE PERSISTENCE ---
function saveToLocalStorage() {
  localStorage.setItem('classic_gray_habit_tracker_v2', JSON.stringify(state));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('classic_gray_habit_tracker_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.habits && Array.isArray(parsed.habits)) state.habits = parsed.habits;
      if (parsed.logs) state.logs = parsed.logs;
      
      const validYears = [2024, 2025, 2026, 2027, 2028];
      if (parsed.year && validYears.includes(Number(parsed.year))) {
        state.year = Number(parsed.year);
      } else {
        state.year = 2026;
      }
      
      if (parsed.month !== undefined && Number(parsed.month) >= 0 && Number(parsed.month) <= 11) {
        state.month = Number(parsed.month);
      } else {
        state.month = 0;
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    }
  }
}

// --- DEFAULT HABITS ---
function initializeDefaultHabits() {
  state.habits = [
    { id: 'h1',  name: 'Wake Up at 5:00 AM ⏰' },
    { id: 'h2',  name: 'Cycling & Exercise 🚴' },
    { id: 'h3',  name: '3+ Hours Study Session 1 📚' },
    { id: 'h4',  name: 'No Junk Food 🚫🍔' },
    { id: 'h5',  name: '3+ Hours Study Session 2 📖' },
    { id: 'h6',  name: 'Drink 2+ Liters of Water 💧' },
    { id: 'h7',  name: 'Maintain Healthy Diet 🥗' },
    { id: 'h8',  name: '3+ Hours Study Session 3 🎯' },
    { id: 'h9',  name: 'Social Media < 1 Hour 📵' },
    { id: 'h10', name: '2-Hour Revision Session 🔁' },
    { id: 'h11', name: 'Family & Friends Time > 1H 🤝' },
    { id: 'h12', name: 'Minimum 6 Hours Sleep 😴' },
  ];
}

// --- UTILITY ---
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// --- EXPORT & IMPORT UTILITIES ---
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("download", `habit_tracker_data_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const importedState = JSON.parse(evt.target.result);
      
      // Basic validation
      if (!importedState.habits || !Array.isArray(importedState.habits) || !importedState.logs) {
        throw new Error("Invalid format. Missing required fields.");
      }
      
      // Merge states
      state = importedState;
      
      const validYears = [2024, 2025, 2026, 2027, 2028];
      if (!state.year || !validYears.includes(Number(state.year))) {
        state.year = 2026;
      } else {
        state.year = Number(state.year);
      }
      
      if (state.month === undefined || Number(state.month) < 0 || Number(state.month) > 11) {
        state.month = 0;
      } else {
        state.month = Number(state.month);
      }

      saveToLocalStorage();
      
      // Sync DOM selects
      elements.yearSelect.value = String(state.year);
      elements.monthSelect.value = String(state.month);
      
      // Rebuild and refresh everything
      updateMonthSubtitle();
      buildCalendarGrid();
      buildMentalGrid();
      updateDashboard();
      
      alert("Habit data imported successfully!");
    } catch (err) {
      alert("Error importing file: " + err.message);
    }
  };
  reader.readAsText(file);
}
