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
      updateStatsBoxes({ total: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0 });
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
  const ts = `ts=${Date.now()}`;
  const urlWithTs = url.includes('?') ? `${url}&${ts}` : `${url}?${ts}`;
  const response = await fetch(urlWithTs, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/* UPDATE STATS BOXES WITH DATABASE DATA */
function updateStatsBoxes(stats) {
  const total = stats.total || 128;
  const pending = stats.pending || 34;
  const inProgress = stats.in_progress || 15;
  const resolved = stats.resolved || 67;
  const rejected = stats.rejected || 27;

  document.getElementById('totalCount').innerText = total;
  document.getElementById('pendingCount').innerText = pending;
  document.getElementById('inProgressCount').innerText = inProgress;
  document.getElementById('resolvedCount').innerText = resolved;
  document.getElementById('rejectedCount').innerText = rejected;

  // Animate progress bars
  animateProgressBar('totalProgress', pending + inProgress + resolved + rejected, total);
  animateProgressBar('pendingProgress', pending, Math.max(100, pending * 2));
  animateProgressBar('inProgressProgress', inProgress, Math.max(80, inProgress * 2));
  animateProgressBar('resolvedProgress', resolved, Math.max(100, resolved * 2));
  animateProgressBar('rejectedProgress', rejected, Math.max(50, rejected * 2));
}

function animateProgressBar(elementId, value, max) {
  const progressFill = document.getElementById(elementId);
  if (!progressFill) return;

  const percentage = Math.min((value / max) * 100, 100);
  setTimeout(() => {
    progressFill.style.width = percentage + '%';
  }, 100);
}

/* GENERATE CHARTS WITH DATABASE DATA */
function updateStatusAndAreaCharts(insightsData) {
  const breakdown = insightsData.status_breakdown || [];
  const topAreas = insightsData.top_problem_areas || [];
  const statusCounts = buildStatusCounts(breakdown);

  createStatusChart(statusCounts.pending, statusCounts.inProgress, statusCounts.resolved, statusCounts.rejected);

  const areaLabels = topAreas.map(area => area.zone || 'Unknown');
  const areaCounts = topAreas.map(area => area.complaints || 0);
  if (areaLabels.length > 0) {
    createAreaChart(areaLabels, areaCounts);
  }
}

function buildStatusCounts(breakdown) {
  const counts = { pending: 0, inProgress: 0, resolved: 0, rejected: 0 };
  breakdown.forEach(item => {
    const status = (item.status || '').toLowerCase();
    const count = Number(item.count || 0);
    if (status === 'resolved') counts.resolved += count;
    else if (status === 'rejected' || status === 'cancelled') counts.rejected += count;
    else if (status === 'in progress') counts.inProgress += count;
    else if (status === 'pending') counts.pending += count;
  });
  return counts;
}

/* STATUS CHART - DOUGHNUT */
function createStatusChart(pending, inProgress, resolved, rejected) {
  const statusCtx = document.getElementById("statusChart");
  if (statusChart) statusChart.destroy();
  
  statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      datasets: [{
        data: [pending, inProgress, resolved, rejected],
        backgroundColor: ['#fbbf24','#3b82f6','#4ade80','#ef4444']
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
    const response = await fetch(`${API_BASE}/get-all-complaints.php?ts=${Date.now()}`, {
      cache: 'no-store'
    });
    
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

// Custom marker icons with status-based colors
function getMarkerIcon(status) {
  const statusMap = {
    'pending': { color: '#fbbf24', shadow: 'rgba(251, 191, 36, 0.6)' },
    'in progress': { color: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.6)' },
    'resolved': { color: '#4ade80', shadow: 'rgba(74, 222, 128, 0.6)' },
    'rejected': { color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.6)' },
    'cancelled': { color: '#6b7280', shadow: 'rgba(107, 114, 128, 0.6)' }
  };

  const statusNorm = (status || '').toLowerCase();
  const config = statusMap[statusNorm] || statusMap['pending'];

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position: relative; width: 40px; height: 50px;">
      <svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 12px ${config.shadow}); animation: pulse-marker 2s infinite;">
        <path d="M 20 5 C 11.7 5 5 11.7 5 20 C 5 32 20 45 20 45 C 20 45 35 32 35 20 C 35 11.7 28.3 5 20 5 Z" fill="${config.color}" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
        <circle cx="20" cy="20" r="8" fill="rgba(255,255,255,0.9)"/>
      </svg>
    </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 50]
  });
}

// Store markers for dynamic updates
const mapMarkers = [];

function getFallbackCoords(complaint, order) {
  const center = liveMap.getCenter();
  const seed = String(
    complaint.complaintId ||
    complaint.complaint_id ||
    complaint.id ||
    order
  );
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const ring = (Math.abs(hash) % 5) + 1;
  const step = 0.002;
  const radius = step * ring;
  return {
    lat: center.lat + Math.cos(angle) * radius,
    lng: center.lng + Math.sin(angle) * radius
  };
}

function updateMapStatus(totalPending, withCoords, missingCoords) {
  const container = document.querySelector('.map-container');
  if (!container) return;

  let statusEl = document.getElementById('map-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'map-status';
    statusEl.style.position = 'absolute';
    statusEl.style.left = '12px';
    statusEl.style.bottom = '12px';
    statusEl.style.zIndex = '999';
    statusEl.style.padding = '6px 10px';
    statusEl.style.fontSize = '12px';
    statusEl.style.borderRadius = '8px';
    statusEl.style.background = 'rgba(2, 6, 23, 0.65)';
    statusEl.style.color = 'rgba(255, 255, 255, 0.85)';
    statusEl.style.border = '1px solid rgba(56, 189, 248, 0.2)';
    statusEl.style.backdropFilter = 'blur(6px)';
    container.appendChild(statusEl);
  }

  statusEl.textContent = `Pending: ${totalPending} | On map: ${withCoords} | Missing coords: ${missingCoords}`;
}

// Function to load complaints on map
async function loadComplaintsOnMap() {
  try {
    const response = await fetch(`${API_BASE}/get-all-complaints.php?ts=${Date.now()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.complaints) {
      // Clear existing markers
      mapMarkers.forEach(marker => liveMap.removeLayer(marker));
      mapMarkers.length = 0;

      let totalPending = 0;
      let pendingWithCoords = 0;
      let pendingMissingCoords = 0;

      const coordCounts = new Map();

      data.complaints.forEach(complaint => {
        // Only show pending complaints
        const status = complaint.status || complaint.current_status || 'Pending';
        const statusNorm = String(status).toLowerCase().trim();
        const isPending = !statusNorm || statusNorm.includes('pending') || statusNorm === 'new' || statusNorm === 'open';
        if (!isPending) return;

        totalPending += 1;

        let lat = Number(complaint.latitude ?? complaint.lat);
        let lng = Number(complaint.longitude ?? complaint.lng);
          let isApprox = false;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            pendingMissingCoords += 1;
            const fallback = getFallbackCoords(complaint, pendingMissingCoords);
            lat = fallback.lat;
            lng = fallback.lng;
            isApprox = true;
          }

          pendingWithCoords += 1;

        const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        const count = coordCounts.get(key) || 0;
        coordCounts.set(key, count + 1);
        if (count > 0) {
          const step = 0.0003;
          const ring = Math.floor(count / 8) + 1;
          const angle = (count % 8) * (Math.PI / 4);
          lat += Math.cos(angle) * step * ring;
          lng += Math.sin(angle) * step * ring;
        }

        const title = complaint.title || complaint.category || 'Complaint';
        const location = complaint.location || complaint.zone || 'Unknown';
        const statusColor = getStatusColor(status);
        const statusIcon = getStatusIcon(status);

        const approxNote = isApprox
          ? '<br><span style="font-size: 11px; color: rgba(255,255,255,0.6);">Approx location</span>'
          : '';

        const marker = L.marker([lat, lng], { icon: getMarkerIcon(status) })
          .addTo(liveMap)
          .bindPopup(`
            <div style="padding: 8px; font-family: 'Inter', sans-serif;">
              <strong style="font-size: 16px; color: #38bdf8;">${title}</strong><br>
              <span style="font-size: 13px; color: rgba(255,255,255,0.8);">📍 ${location}</span><br>
              <span style="font-size: 12px; color: ${statusColor}; font-weight: 600;">${statusIcon} ${status}</span>${approxNote}
            </div>
          `);

        mapMarkers.push(marker);
      });

      updateMapStatus(totalPending, pendingWithCoords, pendingMissingCoords);
    }
  } catch (error) {
    console.error('Error loading map data:', error);
  }
}

function getStatusColor(status) {
  const statusMap = {
    'pending': '#fbbf24',
    'in progress': '#3b82f6',
    'resolved': '#4ade80',
    'rejected': '#ef4444',
    'cancelled': '#6b7280'
  };
  return statusMap[(status || '').toLowerCase()] || '#fbbf24';
}

function getStatusIcon(status) {
  const statusMap = {
    'pending': '⏳',
    'in progress': '🔄',
    'resolved': '✅',
    'rejected': '❌',
    'cancelled': '🚫'
  };
  return statusMap[(status || '').toLowerCase()] || '🟡';
}

// Enable scroll zoom when user clicks on map
const mapElement = document.getElementById('live-map');
const mapOverlay = document.querySelector('.map-scroll-overlay');

let mapActive = false;

if (mapElement && mapOverlay) {
  // Show overlay when hovering
  mapElement.addEventListener('mouseenter', () => {
    if (!mapActive) {
      mapOverlay.classList.add('active');
    }
  });

  // Hide overlay when leaving
  mapElement.addEventListener('mouseleave', () => {
    if (!mapActive) {
      mapOverlay.classList.remove('active');
    }
  });

  // Enable zoom on overlay click
  const enableZoom = (e) => {
    if (e.target === mapOverlay || mapOverlay.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      if (!mapActive) {
        mapActive = true;
        liveMap.scrollWheelZoom.enable();
        mapElement.classList.add('scroll-enabled');
        mapOverlay.classList.remove('active');
      }
    }
  };

  mapOverlay.addEventListener('click', enableZoom);

  // Disable zoom when clicking outside map
  document.addEventListener('click', (e) => {
    if (!mapElement.contains(e.target) && !mapOverlay.contains(e.target) && mapActive) {
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
