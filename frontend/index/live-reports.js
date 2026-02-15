const header = document.getElementById("header");

// Base URL for API calls (pointing to XAMPP backend)
const API_BASE = 'http://localhost/Smart_City/backend';

window.addEventListener("scroll", () => {
  header.style.background =
    window.scrollY > 50
      ? "rgba(2,6,23,.8)"
      : "rgba(2,6,23,.55)";
});

/* OVERVIEW MODE BUTTONS */
const demoButtons = document.querySelectorAll(".demo-btn");

demoButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    demoButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.dataset.mode;
    
    if (mode === "demo") {
      window.location.href = "../index/index.html#analytics";
    }
  });
});

let statusChart, areaChart, weeklyChart, monthlyChart;

/* FETCH LIVE DATA FROM DATABASE */
async function loadLiveReports() {
  try {
    const [statsData, insightsData, complaintsData] = await Promise.all([
      fetchJson(`${API_BASE}/get-dashboard-stats.php`),
      fetchJson(`${API_BASE}/get-overview-insights.php`),
      fetchJson(`${API_BASE}/get-complaints-for-reports.php`)
    ]);

    if (statsData?.success) {
      updateStatsBoxes(statsData.stats);
    } else {
      updateStatsBoxes({ total: 0, pending: 0, resolved: 0, rejected: 0 });
    }

    if (insightsData?.success) {
      updateStatusAndAreaCharts(insightsData);
    }

    if (complaintsData?.success && Array.isArray(complaintsData.complaints)) {
      updateTrendCharts(complaintsData.complaints);
      updateDepartmentPerformance(complaintsData.complaints);
      updateImpactMetrics(complaintsData.complaints, statsData?.stats, insightsData?.metrics);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/* UPDATE STATS BOXES WITH DATABASE DATA */
function updateStatsBoxes(stats) {
  document.getElementById('totalCount').innerText = stats.total || 128;
  document.getElementById('pendingCount').innerText = stats.pending || 34;
  document.getElementById('resolvedCount').innerText = stats.resolved || 67;
  document.getElementById('rejectedCount').innerText = stats.rejected || 27;
}

/* GENERATE CHARTS WITH DATABASE DATA */
function updateStatusAndAreaCharts(insightsData) {
  const breakdown = insightsData.status_breakdown || [];
  const topAreas = insightsData.top_problem_areas || [];
  const statusCounts = buildStatusCounts(breakdown);

  createStatusChart(statusCounts.pending, statusCounts.resolved, statusCounts.rejected);

  const areaLabels = topAreas.map(area => area.zone || 'Unknown');
  const areaCounts = topAreas.map(area => area.complaints || 0);
  if (areaLabels.length > 0) {
    createAreaChart(areaLabels, areaCounts);
  }
}

function buildStatusCounts(breakdown) {
  const counts = { pending: 0, resolved: 0, rejected: 0 };
  breakdown.forEach(item => {
    const status = (item.status || '').toLowerCase();
    const count = Number(item.count || 0);
    if (status === 'resolved') counts.resolved += count;
    else if (status === 'rejected' || status === 'cancelled') counts.rejected += count;
    else if (status === 'pending' || status === 'in progress') counts.pending += count;
  });
  return counts;
}

/* STATUS CHART - DOUGHNUT */
function createStatusChart(pending, resolved, rejected) {
  const statusCtx = document.getElementById("statusChart");
  if (statusChart) statusChart.destroy();
  
  statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Resolved', 'Rejected'],
      datasets: [{
        data: [pending, resolved, rejected],
        backgroundColor: ['#fde047','#4ade80','#f87171']
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "white" } }
      }
    }
  });
}

/* AREA CHART - BAR */
function createAreaChart(labels, data) {
  const areaCtx = document.getElementById("areaChart");
  if (areaChart) areaChart.destroy();
  
  areaChart = new Chart(areaCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Reports',
        data,
        backgroundColor: '#38bdf8'
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "white" } }
      },
      scales: {
        x: { ticks: { color: 'white' } },
        y: { ticks: { color: 'white' } }
      }
    }
  });
}

/* WEEKLY COMPLAINT STATUS LINE CHART */
function createWeeklyChart(labels, pendingData, resolvedData, rejectedData) {
  const weeklyCtx = document.getElementById("weeklyLineChart");
  if (weeklyChart) weeklyChart.destroy();
  
  weeklyChart = new Chart(weeklyCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pending',
          data: pendingData,
          borderColor: '#fde047',
          backgroundColor: 'rgba(253, 224, 71, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Resolved',
          data: resolvedData,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Rejected',
          data: rejectedData,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "white" } }
      },
      scales: {
        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
      }
    }
  });
}

/* MONTHLY RESOLUTION RATE LINE CHART */
function createMonthlyChart(labels, data) {
  const monthlyCtx = document.getElementById("monthlyLineChart");
  if (monthlyChart) monthlyChart.destroy();
  
  monthlyChart = new Chart(monthlyCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Resolution Rate (%)',
        data: data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "white" } }
      },
      scales: {
        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        y: { ticks: { color: 'white' }, min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.1)' } }
      }
    }
  });
}



function updateTrendCharts(complaints) {
  const weekly = buildWeeklyTrends(complaints);
  const monthly = buildMonthlyTrends(complaints);
  createWeeklyChart(weekly.labels, weekly.pending, weekly.resolved, weekly.rejected);
  createMonthlyChart(monthly.labels, monthly.rate);
}

function buildWeeklyTrends(complaints) {
  const weeks = [];
  const weekKeys = [];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const start = getWeekStart(date);
    const key = start.toISOString().slice(0, 10);
    weekKeys.push(key);
    weeks.push(start);
  }

  const pending = new Array(5).fill(0);
  const resolved = new Array(5).fill(0);
  const rejected = new Array(5).fill(0);

  complaints.forEach(item => {
    const date = parseDate(item.submitted_date || item.created_date);
    if (!date) return;
    const key = getWeekStart(date).toISOString().slice(0, 10);
    const index = weekKeys.indexOf(key);
    if (index === -1) return;

    const status = normalizeStatus(item.current_status || item.status);
    if (status === 'resolved') resolved[index] += 1;
    else if (status === 'rejected' || status === 'cancelled') rejected[index] += 1;
    else pending[index] += 1;
  });

  const labels = weeks.map(date => formatShortDate(date));
  return { labels, pending, resolved, rejected };
}

function buildMonthlyTrends(complaints) {
  const months = [];
  const keys = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    keys.push(key);
    months.push(date);
  }

  const totals = new Array(12).fill(0);
  const resolved = new Array(12).fill(0);

  complaints.forEach(item => {
    const date = parseDate(item.submitted_date || item.created_date);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const index = keys.indexOf(key);
    if (index === -1) return;

    totals[index] += 1;
    const status = normalizeStatus(item.current_status || item.status);
    if (status === 'resolved') resolved[index] += 1;
  });

  const rate = totals.map((total, idx) => total ? Math.round((resolved[idx] / total) * 100) : 0);
  const labels = months.map(date => date.toLocaleString('en-US', { month: 'short' }));
  return { labels, rate };
}

function updateDepartmentPerformance(complaints) {
  const container = document.getElementById('departmentList');
  if (!container) return;

  const map = new Map();
  complaints.forEach(item => {
    const name = item.dept_name || item.department || 'Unassigned';
    const key = name.trim() || 'Unassigned';
    const entry = map.get(key) || { name: key, total: 0, resolved: 0 };
    entry.total += 1;
    const status = normalizeStatus(item.current_status || item.status);
    if (status === 'resolved') entry.resolved += 1;
    map.set(key, entry);
  });

  const list = Array.from(map.values())
    .filter(item => item.name.toLowerCase() !== 'unassigned')
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  if (list.length === 0) {
    container.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center;">No department data available</p>';
    return;
  }

  container.innerHTML = list.map(item => {
    const rate = item.total ? Math.round((item.resolved / item.total) * 100) : 0;
    return `
      <div class="dept-card reveal">
        <span>${item.name}</span>
        <div class="progress">
          <div class="progress-bar" data-progress="${rate}"></div>
        </div>
      </div>
    `;
  }).join('');

  animateProgressBars();
}

function updateImpactMetrics(complaints, stats, metrics) {
  const resolvedToday = countResolvedToday(complaints);
  const avgDays = metrics?.avg_resolution_days ?? 0;
  const avgTimeHours = Math.max(0, Math.round(avgDays * 24));
  const fieldOfficers = Number(stats?.total_staff || 0);
  const areasCovered = countUniqueAreas(complaints);

  setCounterValues([resolvedToday, avgTimeHours, fieldOfficers, areasCovered]);
}

function setCounterValues(values) {
  const counters = document.querySelectorAll('.impact-grid .counter');
  counters.forEach((el, index) => {
    const target = Number(values[index] ?? 0);
    animateCounter(el, target);
  });
}

function animateCounter(el, target) {
  const start = Number(el.textContent) || 0;
  const diff = target - start;
  const duration = 800;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(start + diff * progress);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateProgressBars() {
  const bars = document.querySelectorAll('.progress-bar');
  bars.forEach(bar => {
    const value = Number(bar.dataset.progress || 0);
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.width = `${value}%`;
    }, 150);
  });
}

function countResolvedToday(complaints) {
  const today = new Date();
  return complaints.filter(item => {
    const status = normalizeStatus(item.current_status || item.status);
    if (status !== 'resolved') return false;
    const date = parseDate(item.submitted_date || item.created_date);
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  }).length;
}

function countUniqueAreas(complaints) {
  const set = new Set();
  complaints.forEach(item => {
    const area = (item.location || item.area || '').trim();
    if (area) set.add(area.toLowerCase());
  });
  return set.size;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date;
  return null;
}

function normalizeStatus(status) {
  return (status || '').toLowerCase();
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatShortDate(date) {
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${String(date.getDate()).padStart(2, '0')}`;
}



/* SCROLL REVEAL */
const reveals = document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
});

/* LIVE COMPLAINTS FEED */
async function loadLiveComplaints() {
  try {
    const response = await fetch(`${API_BASE}/get-all-complaints.php`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.complaints) {
      const complaints = data.complaints.slice(0, 5);
      const liveList = document.querySelector('.live-list');
      liveList.innerHTML = '';
      
      if (complaints.length === 0) {
        liveList.innerHTML = '<li><p style="color: rgba(255,255,255,0.6); text-align: center;">No complaints to display</p></li>';
        return;
      }
      
      complaints.forEach((complaint, index) => {
        const li = document.createElement('li');
        li.style.animationDelay = `${index * 0.1}s`;
        li.innerHTML = `
          <div class="live-item-header">
            <span class="live-badge">${complaint.status || 'Pending'}</span>
            <span class="live-time">${complaint.location || 'Unknown'}</span>
          </div>
          <p>${complaint.title || complaint.category || 'New Report'}</p>
        `;
        liveList.appendChild(li);
      });
    } else {
      const liveList = document.querySelector('.live-list');
      liveList.innerHTML = '<li><p style="color: rgba(255,255,255,0.6); text-align: center;">Unable to load complaints</p></li>';
    }
  } catch (error) {
    console.error('Error loading complaints:', error);
    const liveList = document.querySelector('.live-list');
    liveList.innerHTML = '<li><p style="color: rgba(255,255,255,0.6); text-align: center;">Error loading complaints</p></li>';
  }
}



/* LOAD REPORTS ON PAGE LOAD */
document.addEventListener('DOMContentLoaded', () => {
  loadLiveReports();
  loadLiveComplaints();
});

/* AUTO-REFRESH EVERY 30 SECONDS */
setInterval(() => {
  loadLiveReports();
  loadLiveComplaints();
}, 30000);

/* ===================== */
/* LEAFLET REAL-TIME MAP */
/* ===================== */
const liveMap = L.map("live-map", {
  scrollWheelZoom: false,
  zoomControl: true,
  attributionControl: true
}).setView([23.8103, 90.4125], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(liveMap);

// Custom marker icon with pulse animation
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: linear-gradient(135deg, #38bdf8, #0ea5e9); width: 30px; height: 30px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.9); box-shadow: 0 4px 12px rgba(56, 189, 248, 0.6); animation: pulse-marker 2s infinite;"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Store markers for dynamic updates
const mapMarkers = [];

// Function to load complaints on map
async function loadComplaintsOnMap() {
  try {
    const response = await fetch(`${API_BASE}/get-all-complaints.php`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.complaints) {
      // Clear existing markers
      mapMarkers.forEach(marker => liveMap.removeLayer(marker));
      mapMarkers.length = 0;

      data.complaints.forEach(complaint => {
        const lat = Number(complaint.latitude ?? complaint.lat);
        const lng = Number(complaint.longitude ?? complaint.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const title = complaint.title || complaint.category || 'Complaint';
        const location = complaint.location || complaint.zone || 'Unknown';

        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(liveMap)
          .bindPopup(`
            <div style="padding: 8px; font-family: 'Inter', sans-serif;">
              <strong style="font-size: 16px; color: #38bdf8;">${title}</strong><br>
              <span style="font-size: 13px; color: rgba(255,255,255,0.8);">${location}</span>
            </div>
          `);

        mapMarkers.push(marker);
      });
    }
  } catch (error) {
    console.error('Error loading map data:', error);
  }
}

// Enable scroll zoom when user clicks on map
const mapElement = document.getElementById('live-map');
const mapOverlay = document.querySelector('.map-scroll-overlay');

let mapActive = false;

if (mapElement && mapOverlay) {
  mapElement.addEventListener('mouseenter', () => {
    if (!mapActive) {
      mapOverlay.classList.add('active');
    }
  });

  mapElement.addEventListener('mouseleave', () => {
    mapOverlay.classList.remove('active');
  });

  const enableScrollZoom = () => {
    mapActive = true;
    liveMap.scrollWheelZoom.enable();
    mapElement.classList.add('scroll-enabled');
    mapOverlay.classList.remove('active');
  };

  mapOverlay.addEventListener('click', enableScrollZoom);
  mapElement.addEventListener('click', enableScrollZoom);

  document.addEventListener('click', (e) => {
    if (!mapElement.contains(e.target)) {
      mapActive = false;
      liveMap.scrollWheelZoom.disable();
      mapElement.classList.remove('scroll-enabled');
    }
  });
}

// Add pulse animation for markers
const mapStyle = document.createElement('style');
mapStyle.textContent = `
  @keyframes pulse-marker {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
`;
document.head.appendChild(mapStyle);

// Load map data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadComplaintsOnMap();
});

// Refresh map data every 30 seconds
setInterval(() => {
  loadComplaintsOnMap();
}, 30000);
