const header = document.getElementById("header");

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
    
    if (mode === "live") {
      window.location.href = "../index/live-reports.html";
    }
  });
});


/* STATUS CHART */
const statusCtx = document.getElementById("statusChart");

new Chart(statusCtx, {
  type: 'doughnut',
  data: {
    labels: ['Pending', 'Resolved', 'Rejected'],
    datasets: [{
      data: [34, 67, 27],
      backgroundColor: ['#fde047','#4ade80','#f87171']
    }]
  },
  options: {
    plugins:{
      legend:{ labels:{ color:"white" } }
    }
  }
});

/* AREA CHART */
const areaCtx = document.getElementById("areaChart");

new Chart(areaCtx, {
  type: 'bar',
  data: {
    labels: ['Mirpur','Dhanmondi','Uttara','Gulshan'],
    datasets: [{
      label: 'Reports',
      data: [42, 31, 28, 19],
      backgroundColor: '#38bdf8'
    }]
  },
  options: {
    plugins:{
      legend:{ labels:{ color:"white" } }
    },
    scales:{
      x:{ ticks:{ color:'white' } },
      y:{ ticks:{ color:'white' } }
    }
  }
});


/* ===================== */
/* SCROLL REVEAL */
/* ===================== */
const reveals = document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
});

/* ===================== */
/* PROGRESS BAR */
/* ===================== */
const bars = document.querySelectorAll(".progress-bar");

bars.forEach(bar => {
  const value = bar.dataset.progress;
  setTimeout(() => {
    bar.style.width = value + "%";
  }, 500);
});

/* ===================== */
/* COUNTER */
/* ===================== */
const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {
  const target = +counter.dataset.target;
  let count = 0;
  const speed = target / 80;

  const update = () => {
    if (count < target) {
      count += speed;
      counter.innerText = Math.ceil(count);
      requestAnimationFrame(update);
    } else {
      counter.innerText = target;
    }
  };
  update();
});

/* ===================== */
/* LEAFLET MAP */
/* ===================== */
const map = L.map("map", {
  scrollWheelZoom: false, // Disable scroll zoom by default
  zoomControl: true,
  attributionControl: true
}).setView([23.8103, 90.4125], 11);

// Normal light themed tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Custom marker icon
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: linear-gradient(135deg, #38bdf8, #0ea5e9); width: 30px; height: 30px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.9); box-shadow: 0 4px 12px rgba(56, 189, 248, 0.6); animation: pulse-marker 2s infinite;"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Add markers
[
  { name: "Mirpur", lat: 23.8041, lng: 90.3667, complaints: 45 },
  { name: "Dhanmondi", lat: 23.7465, lng: 90.3760, complaints: 31 },
  { name: "Uttara", lat: 23.8759, lng: 90.3795, complaints: 28 }
].forEach(area => {
  L.marker([area.lat, area.lng], { icon: customIcon })
    .addTo(map)
    .bindPopup(`
      <div style="padding: 8px; font-family: 'Inter', sans-serif;">
        <strong style="font-size: 16px; color: #38bdf8;">${area.name}</strong><br>
        <span style="font-size: 13px; color: rgba(255,255,255,0.8);">${area.complaints} Active Complaints</span>
      </div>
    `);
});

// Enable scroll zoom when user clicks on map
const mapElement = document.getElementById('map');
const mapOverlay = document.querySelector('.map-scroll-overlay');

let mapActive = false;

if (mapElement && mapOverlay) {
  // Show overlay on mouse enter (when scrolling over map)
  mapElement.addEventListener('mouseenter', () => {
    if (!mapActive) {
      mapOverlay.classList.add('active');
    }
  });

  // Hide overlay on mouse leave
  mapElement.addEventListener('mouseleave', () => {
    mapOverlay.classList.remove('active');
  });

  // Enable scroll zoom when clicking overlay or map
  const enableScrollZoom = () => {
    mapActive = true;
    map.scrollWheelZoom.enable();
    mapElement.classList.add('scroll-enabled');
    mapOverlay.classList.remove('active');
  };

  mapOverlay.addEventListener('click', enableScrollZoom);
  mapElement.addEventListener('click', enableScrollZoom);

  // Disable scroll zoom when clicking outside map
  document.addEventListener('click', (e) => {
    if (!mapElement.contains(e.target)) {
      mapActive = false;
      map.scrollWheelZoom.disable();
      mapElement.classList.remove('scroll-enabled');
    }
  });
}

// Add pulse animation for markers
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);

/* footer*/
const luxFooter = document.querySelector(".lux-footer");

window.addEventListener("scroll", () => {
  const top = luxFooter.getBoundingClientRect().top;
  if (top < window.innerHeight - 120) {
    luxFooter.classList.add("active");
  }
});


/* Live */

const liveList = document.querySelector(".live-list");

setInterval(() => {
  const first = liveList.firstElementChild;

  // exit animation
  first.style.transition = "opacity .6s ease, transform .6s ease";
  first.style.opacity = "0";
  first.style.transform = "translateY(-16px)";

  setTimeout(() => {
    // move to bottom
    liveList.appendChild(first);

    // reset instantly (no animation)
    first.style.transition = "none";
    first.style.opacity = "0";
    first.style.transform = "translateY(16px)";

    // re-enter animation
    requestAnimationFrame(() => {
      first.style.transition = "opacity .6s ease, transform .6s ease";
      first.style.opacity = "1";
      first.style.transform = "translateY(0)";
    });

  }, 650);

}, 3200);



/* LIVE COMPLAINTS DATA */
/* ===================== */
const liveData = [
  { area: "Mohammadpur", issue: "Drainage", status: "Pending", time: "15 " },
  { area: "Mirpur", issue: "Road Damage", status: "Pending", time: "2 " },
  { area: "Dhanmondi", issue: "Garbage Issue", status: "Resolved", time: "6 " },
  { area: "Uttara", issue: "Water Leakage", status: "Pending", time: "9 " },
  { area: "Gulshan", issue: "Street Light", status: "Resolved", time: "12 " },
  { area: "Badda", issue: "Water Supply Disruption", status: "Pending", time: "18 " },
  { area: "Banani", issue: "Traffic Signal Repair", status: "Resolved", time: "22 " },
  { area: "Farmgate", issue: "Illegal Parking", status: "Pending", time: "4 " },
  { area: "Tejgaon", issue: "Power Line Fault", status: "Resolved", time: "30 " },
  { area: "Jatrabari", issue: "Open Manhole", status: "Pending", time: "7 " },
  { area: "Motijheel", issue: "Broken Footpath", status: "Pending", time: "11" },
  { area: "Paltan", issue: "Traffic Congestion", status: "Resolved", time: "25" }
];

const livelist = document.querySelector(".live-list");
const MAX_VISIBLE = 5;
let startIndex = 0;

function renderLiveFeed() {
  liveList.innerHTML = "";

  for (let i = 0; i < MAX_VISIBLE; i++) {
    const dataIndex = (startIndex + i) % liveData.length;
    const item = liveData[dataIndex];

    const row = document.createElement("div");
    row.className = `live-item ${item.status.toLowerCase()}`;

 row.innerHTML = `
  <span>${item.area}</span>
  <span>${item.issue}</span>
  <span class="status">${item.status}</span>
  <span class="time" data-min="${item.time}">
    ${item.time} min ago
  </span>
`;

    liveList.appendChild(row);
  }
}

renderLiveFeed();

/* initial render */
renderLiveFeed();

/* rotate data */
setInterval(() => {
  const first = liveList.firstElementChild;

  /* exit animation */
  first.style.opacity = "0";
  first.style.transform = "translateY(-16px)";

  setTimeout(() => {
    startIndex = (startIndex + 1) % liveData.length;
    renderLiveFeed();
  }, 600);

}, 3200);



/* ===================== */
/* FAKE LIVE DASHBOARD */
/* ===================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ===================== */
  /* DATA SOURCE */
  /* ===================== */
  let dashboardData = {
    total: 128,
    pending: 34,
    resolved: 67,
    rejected: 27,

    liveComplaints: [
      { area: "Mirpur", issue: "Road Damage", status: "Pending", time: 2 },
      { area: "Uttara", issue: "Water Leakage", status: "Pending", time: 9 },
      { area: "Gulshan", issue: "Street Light", status: "Resolved", time: 12 },
      { area: "Dhanmondi", issue: "Garbage Issue", status: "Resolved", time: 6 },
      { area: "Mohammadpur", issue: "Drainage", status: "Pending", time: 15 }
    ]
  };

  /* ===================== */
  /* COUNTERS */
  /* ===================== */
  function updateCounters() {
    document.getElementById("totalCount").innerText = dashboardData.total;
    document.getElementById("pendingCount").innerText = dashboardData.pending;
    document.getElementById("resolvedCount").innerText = dashboardData.resolved;
    document.getElementById("rejectedCount").innerText = dashboardData.rejected;
  }

  /* ===================== */
  /* STATUS CHART */
  /* ===================== */
  const statusCtx = document.getElementById("statusChart");

  const statusChart = new Chart(statusCtx, {
    type: "doughnut",
    data: {
      labels: ["Pending", "Resolved", "Rejected"],
      datasets: [{
        data: [
          dashboardData.pending,
          dashboardData.resolved,
          dashboardData.rejected
        ],
        backgroundColor: ["#fde047", "#4ade80", "#f87171"]
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "white" } }
      }
    }
  });

  function updateStatusChart() {
    statusChart.data.datasets[0].data = [
      dashboardData.pending,
      dashboardData.resolved,
      dashboardData.rejected
    ];
    statusChart.update();
  }

  /* ===================== */
  /* INITIAL RENDER */
  /* ===================== */
  updateCounters();
  updateStatusChart();

  /* ===================== */
  /* FAKE LIVE COUNTER UPDATE */
  /* ===================== */
  setInterval(() => {
    if (dashboardData.pending > 0) {
      dashboardData.pending--;
      dashboardData.resolved++;
    }

    dashboardData.total =
      dashboardData.pending +
      dashboardData.resolved +
      dashboardData.rejected;

    updateCounters();
    updateStatusChart();
  }, 400);

  /* ===================== */
  /* LIVE TIME UPDATE */
  /* ===================== */
  setInterval(() => {
    document.querySelectorAll(".live-item .time").forEach(el => {
      let min = parseInt(el.dataset.min);
      min++;
      el.dataset.min = min;
      el.innerText = `${min}`;
    });
  }, 600);

  /* ===================== */
  /* MAP LIVE MARKERS */
  /* ===================== */
  const markers = [];

  function addMarker(area, lat, lng) {
    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<b>${area}</b><br>New Complaint`);
    markers.push(marker);
  }

  function removeMarker() {
    if (markers.length > 0) {
      map.removeLayer(markers.shift());
    }
  }

  setInterval(() => {
    addMarker(
      "Live Complaint",
      23.8 + Math.random() / 10,
      90.4 + Math.random() / 10
    );

    if (markers.length > 5) {
      removeMarker();
    }
  }, 600);

});




/* ===================== */
/* CHAT WIDGET UPGRADE   */
/* ===================== */
const chatBtn = document.getElementById("chat-btn");
const chatBadge = document.getElementById("chat-badge");
const chatBox = document.getElementById("chat-box");
const chatBody = document.getElementById("chat-body");
const userInput = document.getElementById("user-input");
const typingEl = document.getElementById("typing");
const chips = document.querySelectorAll(".chip");
const chatClose = document.getElementById("chat-close");
const chatMin = document.getElementById("chat-min");

const STORE_KEY = "smartcity_chat_history";
const UNREAD_KEY = "smartcity_chat_unread";

function toggleChat(open) {
  const isOpen = chatBox.classList.contains("show");
  const next = open !== undefined ? open : !isOpen;
  if (next) {
    chatBox.classList.add("show");
    // reset unread
    localStorage.setItem(UNREAD_KEY, "0");
    chatBadge.style.display = "none";
  } else {
    chatBox.classList.remove("show");
  }
}

chatBtn.onclick = (e) => {
  e.stopPropagation();
  toggleChat();
};
chatClose.onclick = (e) => {
  e.stopPropagation();
  toggleChat(false);
};
chatMin.onclick = (e) => {
  e.stopPropagation();
  // collapse to smaller height
  const isMinimized = chatBox.classList.contains("minimized");
  if (isMinimized) {
    chatBox.classList.remove("minimized");
    chatBox.style.maxHeight = "600px";
  } else {
    chatBox.classList.add("minimized");
    chatBox.style.maxHeight = "70px";
  }
};

// History persistence
function saveMessage(role, text) {
  const list = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  list.push({ role, text, t: Date.now() });
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

function renderMessage(role, text) {
  const div = document.createElement("div");
  div.className = role === "user" ? "user-msg" : "bot-msg";
  div.innerText = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function loadHistory() {
  const list = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  if (!list.length) return;
  chatBody.innerHTML = "";
  list.forEach(m => renderMessage(m.role, m.text));
}

function showTyping(show) {
  typingEl.classList.toggle("hidden", !show);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function botReply(userText) {
  // Enhanced intent detection with comprehensive responses
  const text = userText.toLowerCase();
  let reply = "Thanks for reaching out! 👋 I'm here to help with SmartCity questions.";

  if (text.includes("track")) {
    reply = "📍 To track your complaint:\n✓ Citizen Portal → Track Status\n✓ Enter Complaint ID\n✓ View real-time updates";
  } else if (text.includes("submit") || text.includes("complaint")) {
    reply = "📝 To submit:\n✓ Citizen Portal → New Complaint\n✓ Select category\n✓ Add details & photos\n✓ Submit";
  } else if (text.includes("contact") || text.includes("support")) {
    reply = "💬 Support:\n📧 support@smartcity.local\n🏢 Available 24/7\nAverage response: <2 hours";
  } else if (text.includes("department") || text.includes("handles")) {
    reply = "🏢 Departments:\n• Road & Transport\n• Water & Sewerage\n• Waste Management\n• Health";
  } else if (text.includes("priority")) {
    reply = "⚡ Priority:\n🔴 High: Safety/Emergency\n🟡 Medium: Daily impact\n🔵 Low: Minor";
  }

  showTyping(true);
  setTimeout(() => {
    showTyping(false);
    renderMessage("bot", reply);
    saveMessage("bot", reply);
    // bump unread if chat is closed
    if (!chatBox.classList.contains("show")) {
      const unread = parseInt(localStorage.getItem(UNREAD_KEY) || "0") + 1;
      localStorage.setItem(UNREAD_KEY, String(unread));
      chatBadge.textContent = unread;
      chatBadge.style.display = "grid";
    }
  }, 700);
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  renderMessage("user", text);
  saveMessage("user", text);
  userInput.value = "";
  botReply(text);
}

// Enter to send
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Quick reply chips
chips.forEach(ch => ch.addEventListener("click", () => {
  userInput.value = ch.dataset.text || ch.textContent;
  sendMessage();
}));

// Init
loadHistory();

// show unread if any on load when closed
const initialUnread = parseInt(localStorage.getItem(UNREAD_KEY) || "0");
if (initialUnread > 0) {
  chatBadge.textContent = initialUnread;
  chatBadge.style.display = "grid";
}
