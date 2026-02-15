// Helper: API URL
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

let departmentsCache = [];
let staffCache = [];
let assignmentCache = {};
let allPendingComplaints = []; // Store all pending for filtering

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

async function loadDepartments() {
  try {
    const res = await fetch(getApiUrl('get-departments-list.php'));
    const data = await res.json();
    if (data.success) departmentsCache = data.departments;
  } catch (e) {
    console.error('Departments load error', e);
  }
}

async function loadStaff() {
  try {
    const res = await fetch(getApiUrl('get-staff.php'));
    const data = await res.json();
    if (data.success) staffCache = data.staff || [];
  } catch (e) {
    console.error('Staff load error', e);
  }
}

function getDepartmentName(id) {
  const d = departmentsCache.find(x => String(x.id) === String(id));
  return d ? d.name : 'Department';
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
    if (selectedStaffId && String(selectedStaffId) === String(staff.user_id)) opt.selected = true;
    staffSelect.appendChild(opt);
  });
  staffSelect.disabled = staffList.length === 0;
  staffSelect.title = staffList.length === 0 ? 'No staff in this department' : '';
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

function showNotification(message, type = 'info') {
  const notif = document.getElementById('notification');
  const text = document.getElementById('notificationText');
  if (!notif || !text) {
    // Fallback to old method if elements don't exist
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:20px;right:20px;padding:14px 18px;border-radius:6px;color:#fff;z-index:10000;background:${type==='success'?'#27ae60':type==='error'?'#e74c3c':'#2980b9'};box-shadow:0 8px 20px rgba(0,0,0,0.25);`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(()=>{el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(()=>el.remove(),300);},2500);
    return;
  }
  
  text.textContent = message;
  notif.className = 'notification';
  if (type === 'error') notif.classList.add('error');
  
  setTimeout(() => notif.classList.add('hidden'), 3000);
}

async function handleAssignmentChange(complaintId, deptSelect, staffSelect) {
  const deptId = deptSelect.value;
  const staffId = staffSelect ? staffSelect.value : '';
  if (!deptId) return;

  // loading state
  deptSelect.disabled = true;
  deptSelect.style.opacity = '0.6';
  if (staffSelect) { staffSelect.disabled = true; staffSelect.style.opacity = '0.6'; }

  try {
    const resp = await fetch(getApiUrl('update-assignment.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint_id: complaintId,
        department_id: deptId,
        staff_id: staffId || null,
        remarks: 'Assigned from Assign page'
      })
    });
    const data = await resp.json();
    if (data.success) {
      showNotification('Assigned successfully', 'success');
      assignmentCache[complaintId] = { dept: deptId, staff: staffId || '' };
      saveAssignmentCache();
    } else {
      showNotification(data.message || 'Failed to assign', 'error');
    }
  } catch (e) {
    console.error('Assign error', e);
    showNotification('Connection error', 'error');
  } finally {
    deptSelect.disabled = false;
    deptSelect.style.opacity = '1';
    if (staffSelect) { staffSelect.disabled = false; staffSelect.style.opacity = '1'; }
  }
}

function renderRows(rows, tbody) {
  if (!tbody) return;
  if (!rows || rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; opacity:0.7;">No complaints found</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  rows.forEach(c => {
    const tr = document.createElement('tr');
    const normalizedStatus = normalizeStatus(c.status);
    let statusClass = 'info';
    if (normalizedStatus === 'Pending') statusClass = 'warn';
    else if (normalizedStatus === 'In Progress') statusClass = 'info';
    else if (normalizedStatus === 'Resolved') statusClass = 'ok';
    else if (normalizedStatus === 'Rejected' || normalizedStatus === 'Cancelled') statusClass = 'reject';
    
    // Highlight unassigned rows
    const isUnassigned = !c.dept_id || c.dept_id === '';
    if (isUnassigned) {
      tr.classList.add('unassigned');
    }
    const cached = assignmentCache[c.id] || {};
    const deptId = c.dept_id || cached.dept || '';
    const staffId = c.staff_id || cached.staff || '';
    const isResolved = normalizedStatus.toLowerCase() === 'resolved';

    tr.innerHTML = `
      <td><strong>${c.id}</strong></td>
      <td>${c.category || 'N/A'}</td>
      <td>${c.area || c.zone || 'N/A'}</td>
      <td><span class="status-badge ${statusClass}">${normalizedStatus}</span></td>
      <td>
        <select class="dept-select" data-id="${c.id}" ${isResolved ? 'disabled' : ''} style="${isResolved ? 'opacity:0.6;cursor:not-allowed;' : ''}" title="${isResolved ? 'Cannot modify resolved complaints' : ''}">
          <option value="">Select Dept</option>
          ${departmentsCache.map(d => `<option value="${d.id}" ${deptId == d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="staff-select" data-id="${c.id}" ${isResolved ? 'disabled' : ''} style="${isResolved ? 'opacity:0.6;cursor:not-allowed;' : ''}" title="${isResolved ? 'Cannot modify resolved complaints' : ''}">
          <option value="">Select Staff</option>
        </select>
      </td>
    `;

    const deptSelect = tr.querySelector('.dept-select');
    const staffSelect = tr.querySelector('.staff-select');

    populateStaffSelect(deptId, staffSelect, staffId);

    if (!isResolved) {
      deptSelect.addEventListener('change', () => {
        populateStaffSelect(deptSelect.value, staffSelect, '');
        const numId = String(c.id).replace('SC-', '');
        handleAssignmentChange(numId, deptSelect, staffSelect);
      });
      staffSelect.addEventListener('change', () => {
        const numId = String(c.id).replace('SC-', '');
        handleAssignmentChange(numId, deptSelect, staffSelect);
      });
    }

    tbody.appendChild(tr);
  });
}

async function loadPending() {
  const tbody = document.getElementById('pendingTableBody');
  try {
    const res = await fetch(getApiUrl('get-all-complaints.php?status=Pending'));
    const data = await res.json();
    if (data.success) {
      allPendingComplaints = (data.complaints || []).map(c => ({
        id: c.id,
        complaintId: c.complaintId,
        category: c.category,
        area: c.zone,
        status: c.status,
        dept_id: c.dept_id || '',
        staff_id: c.staff_id || ''
      }));
      
      // Update total pending count
      const totalPendingElement = document.getElementById('totalPending');
      if (totalPendingElement) {
        totalPendingElement.textContent = allPendingComplaints.length;
      }
      
      renderRows(allPendingComplaints, tbody);
    } else {
      throw new Error(data.message || 'Failed to load pending');
    }
  } catch (e) {
    console.error(e);
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${e.message}</td></tr>`;
  }
}

// Filter Functions
function applyFilters() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('categoryFilter')?.value || '';
  const statusFilter = document.getElementById('statusFilter')?.value || '';
  
  let filtered = allPendingComplaints.filter(c => {
    // Search filter
    const matchesSearch = !searchTerm || 
      c.complaintId.toLowerCase().includes(searchTerm) ||
      c.category.toLowerCase().includes(searchTerm) ||
      c.area.toLowerCase().includes(searchTerm);
    
    // Category filter
    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    
    // Status filter (assigned/unassigned)
    let matchesStatus = true;
    if (statusFilter === 'unassigned') {
      matchesStatus = !c.dept_id || c.dept_id === '';
    } else if (statusFilter === 'assigned') {
      matchesStatus = c.dept_id && c.dept_id !== '';
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  const tbody = document.getElementById('pendingTableBody');
  renderRows(filtered, tbody);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('statusFilter').value = '';
  const tbody = document.getElementById('pendingTableBody');
  renderRows(allPendingComplaints, tbody);
}

// Make functions globally accessible
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;

// Menu toggle + logout
function setupShell() {
  const menuBtn = document.getElementById('menuBtn');
  const layout = document.getElementById('layout');
  if (menuBtn && layout) {
    menuBtn.addEventListener('click', () => layout.classList.toggle('collapsed'));
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminData');
      window.location.href = '../index/index.html';
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  setupShell();
  loadAssignmentCache();
  await Promise.all([loadDepartments(), loadStaff()]);
  await loadPending();
});
