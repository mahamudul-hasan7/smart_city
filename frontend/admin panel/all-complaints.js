// Get API URL helper
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

// Load total complaints count
async function loadTotalComplaints() {
  try {
    const response = await fetch(getApiUrl('get-dashboard-stats.php'));
    const result = await response.json();
    
    if (result.success && result.stats) {
      const totalComplaintsElement = document.getElementById('totalComplaints');
      if (totalComplaintsElement) {
        totalComplaintsElement.textContent = result.stats.total || 0;
      }
    }
  } catch (error) {
    console.error('Error loading total complaints:', error);
  }
}

// Edit Mode functionality
let editModeActive = false;

function toggleEditMode() {
  editModeActive = !editModeActive;
  const body = document.body;
  const toggleBtn = document.getElementById('editModeToggle');
  const editModeText = document.getElementById('editModeText');
  
  if (editModeActive) {
    body.classList.add('edit-mode-active');
    toggleBtn.classList.add('active');
    editModeText.textContent = 'Disable Edit Mode';
  } else {
    body.classList.remove('edit-mode-active');
    toggleBtn.classList.remove('active');
    editModeText.textContent = 'Enable Edit Mode';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTotalComplaints();
  
  // Edit mode toggle
  const editModeToggle = document.getElementById('editModeToggle');
  if (editModeToggle) {
    editModeToggle.addEventListener('click', toggleEditMode);
  }
});

// Load complaints data
async function loadComplaintsData(statusFilter = '') {
  try {
    let url = getApiUrl('get-all-complaints.php');
    if (statusFilter) {
      url += `?status=${encodeURIComponent(statusFilter)}`;
    }
    
    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      const tbody = document.querySelector('.table-box tbody');
      if (tbody) {
        tbody.innerHTML = '';
        
        if (result.complaints.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; opacity:0.7;">No complaints found</td></tr>';
        } else {
          result.complaints.forEach(complaint => {
            const tr = document.createElement('tr');
            const statusClassMap = {
              'Pending': 'pending',
              'Assigned': 'assigned',
              'In Progress': 'progress',
              'Resolved': 'resolved',
              'Rejected': 'rejected',
              'Cancelled': 'cancelled'
            };
            const statusClass = statusClassMap[complaint.status] || 'pending';

            const selectId = `status-${complaint.complaintId}`;
            // Build allowed options; once progressed, 'Pending' is removed
            const baseStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
            const statuses = complaint.status === 'Pending' ? baseStatuses : baseStatuses.filter(s => s !== 'Pending');
            const optionColor = {
              'Pending': '#ffaa00',
              'In Progress': '#0088cc',
              'Resolved': '#00ff88',
              'Rejected': '#ff4444'
            };
            
            const isResolved = complaint.status === 'Resolved';
            const isRejected = complaint.status === 'Rejected';
            
            const statusOptions = statuses
              .map(s => `<option value="${s}" ${s === complaint.status ? 'selected' : ''}>${s}</option>`)
              .join('');
            tr.innerHTML = `
              <td>${complaint.id}</td>
              <td>${complaint.userId ?? 'N/A'}</td>
              <td>${complaint.zone}</td>
              <td class="${statusClass}">${complaint.status}</td>
              <td>${complaint.description || 'N/A'}</td>
              <td>${complaint.date ? new Date(complaint.date).toLocaleDateString() : 'N/A'}</td>
              <td class="action-cell">
                <div class="action-controls">
                  <select class="status-select" id="status-${complaint.complaintId}" data-id="${complaint.complaintId}" ${isResolved || isRejected ? 'disabled' : ''}>
                    ${statusOptions}
                  </select>
                  <button class="btn-update" data-id="${complaint.complaintId}" ${isResolved || isRejected ? 'disabled' : ''}>
                    <i class="fas fa-sync"></i>
                  </button>
                  ${isResolved ? '<span class="locked-note">Locked (Resolved)</span>' : ''}
                  ${isRejected ? '<span class="locked-note locked-rejected">Locked (Rejected)</span>' : ''}
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
          
          // Add event listeners for update buttons
          tbody.querySelectorAll('button.btn-update[data-id]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const compId = parseInt(btn.getAttribute('data-id'), 10);
              const select = document.getElementById(`status-${compId}`);
              if (!select) return;
              const newStatus = select.value;
              
              // Start animation
              btn.classList.add('is-loading');
              const icon = btn.querySelector('i');
              if (icon) { icon.className = 'fas fa-spinner fa-spin'; }

              try {
                const resp = await fetch(getApiUrl('update-complaint-status.php'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ complaint_id: compId, status: newStatus })
                });
                const res = await resp.json();
                if (res.success) {
                  const row = btn.closest('tr');
                  if (row) row.classList.add('row-updated');
                  loadComplaintsData(statusFilter?.value || '');
                } else {
                  alert('Update failed: ' + (res.message || 'Unknown error'));
                }
              } catch (err) {
                console.error('Status update error:', err);
                alert('Network error while updating status');
              } finally {
                btn.classList.remove('is-loading');
                if (icon) { icon.className = 'fas fa-sync'; }
              }
            });
          });
        }
      }
    }
  } catch (error) {
    console.error("Error loading complaints:", error);
  }
}

// Menu toggle
const menuBtn = document.getElementById("menuBtn");
const layout = document.getElementById("layout");

if (menuBtn && layout) {
  menuBtn.addEventListener("click", () => {
    layout.classList.toggle("collapsed");
  });
}

// Setup logout button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminData');
    window.location.href = '../index/index.html';
  });
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadComplaintsData();
  
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const searchBtn = document.querySelector('.btn-search');
  const resetBtn = document.querySelector('.btn-reset');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const status = statusFilter.value;
      loadComplaintsData(status);
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = '';
      loadComplaintsData();
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      const status = statusFilter.value;
      loadComplaintsData(status);
    });
  }
});

console.log("All Complaints page loaded");
