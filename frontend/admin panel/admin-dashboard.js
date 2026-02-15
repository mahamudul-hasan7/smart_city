// Get API URL helper
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

// Normalize status values
function normalizeStatus(status) {
  if (!status) return 'Pending';
  const s = String(status).toLowerCase().trim();
  
  // Map numeric to text
  const statusMap = {
    '1': 'Pending',
    '2': 'In Progress',
    '3': 'Resolved',
    '4': 'Rejected',
    '5': 'Pending'
  };
  
  if (statusMap[s]) return statusMap[s];
  
  // Capitalize first letter
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Store departments globally for dropdown
let departmentsCache = [];
let staffCache = [];
let assignmentCache = {};

// Persist assignment selections locally so they remain visible after reload
function loadAssignmentCache() {
  try {
    const raw = localStorage.getItem('sc_assignment_cache');
    assignmentCache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    assignmentCache = {};
  }
}

function saveAssignmentCache() {
  localStorage.setItem('sc_assignment_cache', JSON.stringify(assignmentCache));
}

// Load departments for dropdowns
async function loadDepartments() {
  try {
    const response = await fetch(getApiUrl('get-departments-list.php'));
    const result = await response.json();
    
    if (result.success) {
      departmentsCache = result.departments;
    }
  } catch (error) {
    console.error("Error loading departments:", error);
  }
}

// Load staff list for assignment dropdowns
async function loadStaff() {
  try {
    const response = await fetch(getApiUrl('get-staff.php'));
    const result = await response.json();
    if (result.success) {
      staffCache = result.staff || [];
    }
  } catch (error) {
    console.error('Error loading staff:', error);
  }
}

// Handle department assignment change
async function handleAssignmentChange(complaintId, currentDept, deptSelect, staffSelect) {
  const selectedDeptId = deptSelect.value;
  const selectedStaffId = staffSelect ? staffSelect.value : '';
  const numericComplaintId = parseInt(String(complaintId).replace(/[^0-9]/g, ''), 10);
  
  if (!selectedDeptId) {
    deptSelect.value = currentDept;
    return;
  }

  // Show loading state
  deptSelect.disabled = true;
  deptSelect.style.opacity = '0.6';
  if (staffSelect) {
    staffSelect.disabled = true;
    staffSelect.style.opacity = '0.6';
  }

  try {
    const response = await fetch(getApiUrl('update-assignment.php'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        complaint_id: isNaN(numericComplaintId) ? complaintId : numericComplaintId,
        department_id: selectedDeptId,
        staff_id: selectedStaffId || null,
        remarks: 'Department assigned from dashboard'
      })
    });

    const result = await response.json();
    console.log('Assignment response:', result);

    if (result.success) {
      const deptName = getDepartmentName(selectedDeptId);
      showNotification(`✓ Assigned to ${deptName}`, 'success');
      deptSelect.dataset.currentDept = selectedDeptId;
      if (staffSelect && selectedStaffId) {
        staffSelect.dataset.currentStaff = selectedStaffId;
      }

      // persist selection locally
      assignmentCache[complaintId] = {
        dept: selectedDeptId,
        staff: selectedStaffId || ''
      };
      saveAssignmentCache();
    } else {
      showNotification('❌ Error: ' + (result.message || 'Assignment failed'), 'error');
      deptSelect.value = currentDept;
    }
  } catch (error) {
    console.error("Error updating assignment:", error);
    showNotification('❌ Connection error', 'error');
    deptSelect.value = currentDept;
  } finally {
    deptSelect.disabled = false;
    deptSelect.style.opacity = '1';
    if (staffSelect) {
      staffSelect.disabled = false;
      staffSelect.style.opacity = '1';
    }
  }
}

// Get department name by ID
function getDepartmentName(deptId) {
  const dept = departmentsCache.find(d => d.id == deptId);
  return dept ? dept.name : 'Department';
}

// Get staff name by ID
function getStaffName(staffId) {
  const staff = staffCache.find(s => String(s.user_id) === String(staffId));
  return staff ? staff.name : 'Staff';
}

function getStaffForDepartment(deptId) {
  if (!deptId) return [];
  return staffCache.filter(s => String(s.department_id || '') === String(deptId));
}

function populateStaffSelect(deptId, staffSelect, selectedStaffId = '') {
  if (!staffSelect) return;
  const staffList = getStaffForDepartment(deptId);
  staffSelect.innerHTML = '<option value="">Select Staff</option>';
  staffList.forEach(staff => {
    const opt = document.createElement('option');
    opt.value = staff.user_id;
    opt.textContent = `${staff.name} (${staff.designation || 'Staff'})`;
    if (selectedStaffId && String(selectedStaffId) === String(staff.user_id)) {
      opt.selected = true;
    }
    staffSelect.appendChild(opt);
  });
  staffSelect.disabled = staffList.length === 0;
  staffSelect.title = staffList.length === 0 ? 'No staff in this department' : '';
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Load dashboard data
async function loadDashboardData() {
  try {
    console.log('Loading dashboard data...');
    const apiUrl = getApiUrl('get-dashboard-stats.php');
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Result:', result);

    if (result.success) {
      // Update stats with proper IDs
      document.getElementById('totalComplaints').textContent = result.stats.total || 0;
      document.getElementById('resolvedComplaints').textContent = result.stats.resolved || 0;
      document.getElementById('pendingComplaints').textContent = result.stats.pending || 0;
      document.getElementById('rejectedComplaints').textContent = result.stats.rejected || 0;
      
      // Update user stats
      document.getElementById('totalCitizens').textContent = result.stats.total_citizens || 0;
      document.getElementById('totalUsers').textContent = result.stats.total_users || 0;
      document.getElementById('totalStaff').textContent = result.stats.total_staff || 0;

      // Update recent complaints table
      const tbody = document.querySelector('.table-box tbody');
      if (tbody) {
        tbody.innerHTML = '';
        
        if (result.recent_complaints.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; opacity:0.7;">No complaints found</td></tr>';
        } else {
          result.recent_complaints.forEach(complaint => {
            const tr = document.createElement('tr');
            const normalizedStatus = normalizeStatus(complaint.status);
            let statusClass = 'info';
            if (normalizedStatus === 'Pending') statusClass = 'warn';
            else if (normalizedStatus === 'In Progress') statusClass = 'info';
            else if (normalizedStatus === 'Resolved') statusClass = 'ok';
            else if (normalizedStatus === 'Rejected' || normalizedStatus === 'Cancelled') statusClass = 'reject';
            
            // Get assigned dept/staff names for display
            const cachedAssign = assignmentCache[complaint.id] || {};
            const deptId = complaint.dept_id || cachedAssign.dept || '';
            const staffId = complaint.staff_id || cachedAssign.staff || '';
            
            const deptName = deptId ? getDepartmentName(deptId) : 'Not Assigned';
            const staffName = staffId ? getStaffName(staffId) : 'Not Assigned';
            
            tr.innerHTML = `
              <td><strong>${complaint.id}</strong></td>
              <td>${complaint.category}</td>
              <td>${complaint.area}</td>
              <td><span class="status-badge ${statusClass}">${normalizedStatus}</span></td>
              <td><span style="color: ${deptId ? '#00d4ff' : '#888'};">${deptName}</span></td>
              <td><span style="color: ${staffId ? '#fff' : '#888'};">${staffName}</span></td>
            `;
            
            tbody.appendChild(tr);
          });
        }
      }
    }
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showNotification('Failed to load dashboard data', 'error');
  }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
  // load cached assignment selections first
  loadAssignmentCache();
  // Setup menu button toggle
  const menuBtn = document.getElementById('menuBtn');
  const layout = document.getElementById('layout');
  
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      layout.classList.toggle('collapsed');
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
  
  await loadDepartments();
  await loadStaff();
  loadDashboardData();
  
  // Add style for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
  
  // Auto-refresh dashboard every 30 seconds
  setInterval(loadDashboardData, 30000);
});

console.log("Admin dashboard loaded with real-time updates");
