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
      <div class="card-action">
        <a href="track-status.html?id=${complaint.id}" class="view-details-btn">
          View Details <i class="fas fa-arrow-right"></i>
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
        <a href="track-status.html?id=${complaint.id}" class="action-link">
          <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
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
