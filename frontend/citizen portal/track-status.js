// Get current user
function checkLogin() {
  const userData = localStorage.getItem('userData');
  if (!userData) {
    window.location.href = 'citizen-login.html';
    return null;
  }
  return JSON.parse(userData);
}

const currentUser = checkLogin();
let allComplaints = [];
let currentView = 'grid';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  setWelcomeName();
  loadComplaints();
  setupLogout();
});

// Set welcome message
function setWelcomeName() {
  const name = currentUser?.name || 'Citizen';
  const welcome = document.querySelector('.welcome');
  if (welcome) {
    welcome.textContent = `Welcome, ${name}`;
  }
}

// Setup logout
function setupLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userData');
      window.location.href = 'citizen-login.html';
    });
  }
}


// Load complaints from backend
async function loadComplaints() {
  try {
    const response = await fetch(
      `http://127.0.0.1/Smart_City/backend/get-complaints.php?user_id=${currentUser.id}`
    );
    const data = await response.json();

    if (data.success && data.complaints && data.complaints.length > 0) {
      allComplaints = data.complaints;
      updateStatistics();
      displayComplaints(allComplaints);
      document.getElementById('emptyState').style.display = 'none';
    } else {
      allComplaints = [];
      document.getElementById('complaintsList').innerHTML = '';
      document.getElementById('emptyState').style.display = 'flex';
      updateStatistics();
    }
  } catch (err) {
    console.error('Error loading complaints:', err);
    document.getElementById('complaintsList').innerHTML = 
      '<p style="color: #ff4444; text-align: center; padding: 40px; grid-column: 1/-1;">Error loading complaints</p>';
  }
}

// Update statistics
function updateStatistics() {
  const stats = {
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0
  };

  allComplaints.forEach(complaint => {
    const status = (complaint.status || 'Pending').toLowerCase().trim();
    if (status === 'pending') stats.pending++;
    else if (status === 'in progress') stats.inProgress++;
    else if (status === 'resolved') stats.resolved++;
    else if (status === 'rejected') stats.rejected++;
  });

  document.getElementById('pendingCount').textContent = stats.pending;
  document.getElementById('progressCount').textContent = stats.inProgress;
  document.getElementById('resolvedCount').textContent = stats.resolved;
  document.getElementById('rejectedCount').textContent = stats.rejected;
}

// Display complaints
function displayComplaints(complaints) {
  const container = document.getElementById('complaintsList');
  
  if (complaints.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">No complaints match your filters</p>';
    return;
  }

  if (currentView === 'grid') {
    container.classList.remove('list-view');
    container.classList.add('grid-view');
    container.innerHTML = complaints.map(complaint => createComplaintCard(complaint)).join('');
  } else {
    container.classList.remove('grid-view');
    container.classList.add('list-view');
    container.innerHTML = complaints.map(complaint => createComplaintRow(complaint)).join('');
  }
}

// Create complaint card for grid view
function createComplaintCard(complaint) {
  const statusClass = `status-${(complaint.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`;
  const date = formatDate(complaint.created_date || complaint.created_at || complaint.submitted_date);
  const progressPercent = getProgressPercentage(complaint.status);

  return `
    <div class="complaint-card ${statusClass}">
      <div class="card-header">
        <span class="complaint-id">ID #${complaint.id}</span>
        <span class="status-badge ${statusClass}">${complaint.status || 'Pending'}</span>
      </div>
      <h3 class="complaint-title">${escapeHtml(complaint.title || complaint.description || 'No title')}</h3>
      <div class="complaint-meta">
        <div class="meta-row">
          <span class="meta-label">Category:</span>
          <span class="meta-value">${complaint.category || complaint.type || 'Other'}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Priority:</span>
          <span class="meta-value">${complaint.priority || 'Normal'}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Location:</span>
          <span class="meta-value">${complaint.location || complaint.area || 'Not specified'}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date:</span>
          <span class="meta-value">${date}</span>
        </div>
      </div>
      <div class="progress-section">
        <div class="progress-label">
          <span>Progress</span>
          <span>${progressPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
      </div>
      <div class="card-action">
        <a href="#" class="view-details-btn" onclick="viewTimeline(${complaint.id}, event)">
          View Timeline <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
}

// Create complaint row for list view
function createComplaintRow(complaint) {
  const statusClass = `status-${(complaint.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`;
  const date = formatDate(complaint.created_date || complaint.created_at || complaint.submitted_date);

  return `
    <div class="complaint-row ${statusClass}">
      <div class="row-id">ID #${complaint.id}</div>
      <div class="row-title">${escapeHtml(complaint.title || complaint.description || 'No title')}</div>
      <div class="row-status">
        <span class="status-badge ${statusClass}">${complaint.status || 'Pending'}</span>
      </div>
      <div class="row-category">${complaint.category || complaint.type || 'Other'}</div>
      <div class="row-priority">${complaint.priority || 'Normal'}</div>
      <div class="row-date">${date}</div>
      <div class="row-action">
        <a href="#" class="action-link" onclick="viewTimeline(${complaint.id}, event)">
          <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
}

// Get progress percentage
function getProgressPercentage(status) {
  const statusMap = {
    'pending': 25,
    'in progress': 50,
    'resolved': 100,
    'rejected': 0
  };
  return statusMap[(status || '').toLowerCase()] || 25;
}

// View timeline
async function viewTimeline(complaintId, event) {
  event.preventDefault();
  const complaint = allComplaints.find(c => c.id === complaintId);
  if (!complaint) return;

  const statusColors = {
    'pending':      { icon: '⏳', color: '#ffaa00' },
    'submitted':    { icon: '📋', color: '#00d4ff' },
    'under review': { icon: '🔍', color: '#aa88ff' },
    'in progress':  { icon: '⚙️', color: '#0088cc' },
    'resolved':     { icon: '✅', color: '#00ff88' },
    'rejected':     { icon: '❌', color: '#ff4444' }
  };

  const status = (complaint.status || 'pending').toLowerCase();
  const statusInfo = statusColors[status] || { icon: '📋', color: '#aaa' };
  const submittedDateTime = formatDateTime(complaint.created_date || complaint.created_at);

  // Fetch real status history
  let historyItems = [];
  try {
    const res = await fetch(`http://127.0.0.1/Smart_City/backend/get-complaint-status-history.php?complaint_id=${complaintId}`);
    const data = await res.json();
    if (data.success && data.history) historyItems = data.history;
  } catch (e) { /* silent fallback */ }

  // Build a lookup of status name → history entry
  const historyMap = {};
  historyItems.forEach(h => { historyMap[h.status.toLowerCase()] = h; });

  // Determine final step based on current status
  const isFinalRejected = status === 'rejected';
  const finalStep = isFinalRejected
    ? { dbKey: 'rejected',    icon: '❌', label: 'Rejected',    color: '#ff4444' }
    : { dbKey: 'resolved',    icon: '✅', label: 'Resolved',    color: '#00ff88' };

  // Fixed 4 stages — dbKey matches actual DB status_name (lowercase)
  const stages = [
    { dbKey: 'submitted',    icon: '📋', label: 'Submitted',    color: '#00d4ff' },
    { dbKey: 'pending',      icon: '🔍', label: 'Under Review', color: '#aa88ff' },
    { dbKey: 'in progress',  icon: '⚙️', label: 'In Progress',  color: '#0088cc' },
    finalStep
  ];

  // Progression order using actual DB status names
  const order = ['submitted', 'pending', 'in progress', 'resolved', 'rejected'];
  const currentIndex = order.indexOf(status) !== -1 ? order.indexOf(status) : 1;

  function stepReached(dbKey) {
    if (dbKey === 'submitted') return true;
    const idx = order.indexOf(dbKey);
    return idx !== -1 && idx <= currentIndex;
  }

  function stepDateTime(dbKey) {
    if (dbKey === 'submitted') return submittedDateTime;
    const h = historyMap[dbKey];
    return h ? formatDateTime(h.updated_date) : null;
  }

  function stepNotes(dbKey) {
    const h = historyMap[dbKey];
    return h && h.notes ? h.notes : '';
  }

  const timelineSteps = stages.map(stage => {
    const reached = stepReached(stage.dbKey);
    const dotColor  = reached ? stage.color : 'rgba(255,255,255,0.15)';
    const nameColor = reached ? '#fff' : 'rgba(255,255,255,0.3)';
    const dt = stepDateTime(stage.dbKey);
    const notes = stepNotes(stage.dbKey);
    return `
      <div style="margin-bottom: 28px; position: relative;">
        <div style="position: absolute; left: -40px; top: 3px; width: 16px; height: 16px;
          background: ${dotColor}; border: 3px solid rgba(10,20,45,0.97); border-radius: 50%;
          ${reached ? `box-shadow: 0 0 6px ${stage.color}55;` : ''}"></div>
        <div style="font-weight: 600; color: ${nameColor}; margin-bottom: 4px;">${reached ? stage.icon : '○'} ${stage.label}</div>
        ${reached && dt ? `
          <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-bottom: 3px;">
            <i class="fas fa-clock" style="color:#00d4ff; margin-right:5px;"></i>${dt}
          </div>` : ''}
        ${!reached ? `<div style="color: rgba(255,255,255,0.25); font-size: 12px;">Not yet reached</div>` : ''}
        ${notes ? `<div style="color: rgba(255,255,255,0.65); font-size: 13px; margin-top:5px; padding: 7px 10px;
          background: rgba(255,255,255,0.04); border-radius:4px;">${escapeHtml(notes)}</div>` : ''}
      </div>`;
  }).join('');

  const timelineHtml = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 20px;"
      onclick="event.target === this && closeTimeline()">
      <div id="timelineModal" style="
        background: linear-gradient(135deg, rgba(20,30,60,0.97), rgba(10,20,45,0.97));
        border: 2px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 40px;
        max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;
        backdrop-filter: blur(10px);">

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
          <h2 style="margin:0; color:#00d4ff; font-size:24px;">Complaint Timeline</h2>
          <button onclick="closeTimeline()" style="background:transparent; border:none; color:#00d4ff; font-size:24px; cursor:pointer;">✕</button>
        </div>

        <div style="background:rgba(0,212,255,0.05); border-left:3px solid #00d4ff; padding:20px; border-radius:6px; margin-bottom:30px;">
          <div style="color:#00d4ff; font-weight:600; margin-bottom:10px;">ID #${complaint.id}</div>
          <h3 style="margin:0 0 15px 0; color:#fff; font-size:18px;">${escapeHtml(complaint.title || complaint.description || 'No title')}</h3>
          <div style="color:rgba(255,255,255,0.7); font-size:14px; line-height:1.8;">
            <div><strong>Status:</strong> <span style="color:${statusInfo.color};">${statusInfo.icon} ${complaint.status || 'Pending'}</span></div>
            <div><strong>Category:</strong> ${complaint.category || 'Other'}</div>
            <div><strong>Priority:</strong> ${complaint.priority || 'Normal'}</div>
            <div><strong>Location:</strong> ${complaint.location || 'Not specified'}</div>
            <div><strong>Submitted:</strong> <span style="color:rgba(255,255,255,0.9);">${submittedDateTime}</span></div>
          </div>
        </div>

        <div style="margin-bottom:30px;">
          <h4 style="color:#00d4ff; margin-bottom:20px; text-transform:uppercase; font-size:12px; letter-spacing:0.5px;">Status Timeline</h4>
          <div style="position:relative; padding-left:40px; border-left:2px solid rgba(0,212,255,0.25);">
            ${timelineSteps}
          </div>
        </div>

        <button onclick="closeTimeline()" style="
          width:100%; padding:12px 20px;
          background:rgba(0,212,255,0.1); border:2px solid rgba(0,212,255,0.3);
          border-radius:6px; color:#00d4ff; font-weight:600; cursor:pointer; transition:all 0.3s ease;"
          onmouseover="this.style.background='rgba(0,212,255,0.2)'"
          onmouseout="this.style.background='rgba(0,212,255,0.1)'">Close</button>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', timelineHtml);
}

// Close timeline modal
function closeTimeline() {
  const modal = document.getElementById('timelineModal');
  if (modal) {
    modal.parentElement.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      modal.parentElement.remove();
    }, 300);
  }
}

// Filter complaints
function filterComplaints() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;

  const filtered = allComplaints.filter(complaint => {
    const matchesSearch = 
      complaint.id.toString().includes(searchTerm) ||
      (complaint.title || complaint.description || '').toLowerCase().includes(searchTerm) ||
      (complaint.category || complaint.type || '').toLowerCase().includes(searchTerm);

    const matchesStatus = !statusFilter || 
      (complaint.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory = !categoryFilter || 
      (complaint.category || complaint.type || '').toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  displayComplaints(filtered);
}

// Reset filters
function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('categoryFilter').value = '';
  displayComplaints(allComplaints);
}

// Toggle between grid and list view
function toggleView(view) {
  currentView = view;
  
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.view-btn').classList.add('active');
  
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;

  const filtered = allComplaints.filter(complaint => {
    const matchesSearch = 
      complaint.id.toString().includes(searchTerm) ||
      (complaint.title || complaint.description || '').toLowerCase().includes(searchTerm) ||
      (complaint.category || complaint.type || '').toLowerCase().includes(searchTerm);

    const matchesStatus = !statusFilter || 
      (complaint.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory = !categoryFilter || 
      (complaint.category || complaint.type || '').toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  displayComplaints(filtered);
}

// Format date safely
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    return 'N/A';
  }
}

// Format date + time
function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (err) {
    return 'N/A';
  }
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
