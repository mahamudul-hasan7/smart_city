// Check if user is logged in
function checkLogin() {
  const userData = localStorage.getItem('userData');
  if (!userData) {
    window.location.href = 'citizen-login.html';
    return null;
  }
  return JSON.parse(userData);
}

const currentUser = checkLogin();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Load user complaints data
  loadUserData();
  loadRecentComplaints();
});

async function loadUserData() {
  try {
    if (!currentUser?.id) return;
    
    const response = await fetch(`http://localhost/Smart_City/backend/get-complaints.php?user_id=${currentUser.id}`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.complaints)) {
      const complaints = data.complaints;
      
      // Calculate statistics
      const total = complaints.length;
      const pending = complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
      const inProgress = complaints.filter(c => {
        const status = (c.status || '').toLowerCase();
        return status === 'in progress' || status === 'in_progress' || status === 'in-progress';
      }).length;
      const resolved = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
      
      // Update stats on page
      document.getElementById('totalCount').textContent = total;
      document.getElementById('pendingCount').textContent = pending;
      document.getElementById('progressCount').textContent = inProgress;
      document.getElementById('resolvedCount').textContent = resolved;
    }
  } catch (err) {
    console.error('Error loading user data:', err);
  }
}

async function loadRecentComplaints() {
  const container = document.getElementById('recentComplaintsContainer');
  
  try {
    if (!currentUser?.id) return;
    
    const response = await fetch(`http://localhost/Smart_City/backend/get-complaints.php?user_id=${currentUser.id}`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.complaints)) {
      const complaints = data.complaints;
      
      if (complaints.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-title">No Complaints Yet</div>
            <div class="empty-text">You haven't submitted any complaints yet.</div>
          </div>
        `;
        return;
      }
      
      // Show latest 5 complaints
      const recentComplaints = complaints.slice(0, 5);
      
      let tableHTML = `
        <table class="complaints-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      recentComplaints.forEach(complaint => {
        const statusClass = `status-${(complaint.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`;
        const date = new Date(complaint.created_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        tableHTML += `
          <tr>
            <td class="complaint-id">#${escapeHtml(complaint.id)}</td>
            <td>${escapeHtml(complaint.title || '')}</td>
            <td>${escapeHtml(complaint.category || 'General')}</td>
            <td>${escapeHtml(complaint.location || 'Not specified')}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(complaint.status || 'Pending')}</span></td>
            <td>${date}</td>
          </tr>
        `;
      });
      
      tableHTML += `
          </tbody>
        </table>
      `;
      
      container.innerHTML = tableHTML;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Error Loading Complaints</div>
          <div class="empty-text">${data.message || 'Unable to load complaints at this moment'}</div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading recent complaints:', err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">Error Loading Complaints</div>
        <div class="empty-text">An error occurred while loading your complaints</div>
      </div>
    `;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
