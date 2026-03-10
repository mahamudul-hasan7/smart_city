// Get API URL helper
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

let cachedDepartments = [];
let cachedZones = [];

function getStatusClass(status) {
  if (status === 'Active') return 'ok';
  if (status === 'On Duty') return 'info';
  return 'warn';
}

async function fetchDepartments() {
  if (cachedDepartments.length) return cachedDepartments;
  try {
    const response = await fetch(getApiUrl('get-departments-list.php'));
    if (!response.ok) throw new Error('Failed to fetch departments');
    const result = await response.json();
    if (result.success && result.departments) {
      cachedDepartments = result.departments;
      console.log('Departments loaded:', cachedDepartments);
    } else {
      console.warn('No departments in response:', result);
    }
  } catch (err) {
    console.error('Error fetching departments:', err);
  }
  return cachedDepartments;
}

async function fetchZones() {
  if (cachedZones.length) return cachedZones;
  try {
    const response = await fetch(getApiUrl('get-zones.php'));
    if (!response.ok) throw new Error('Failed to fetch zones');
    const result = await response.json();
    if (result.success && result.zones) {
      cachedZones = result.zones;
      console.log('Zones loaded:', cachedZones);
    } else {
      console.warn('No zones in response:', result);
    }
  } catch (err) {
    console.error('Error fetching zones:', err);
  }
  return cachedZones;
}

function buildDepartmentOptions(selectedId, departments = cachedDepartments) {
  const defaultOption = '<option value="">Select department</option>';
  if (!departments || departments.length === 0) {
    console.warn('No departments available for dropdown');
    return defaultOption;
  }
  const options = departments.map(dept => {
    const selected = selectedId && Number(selectedId) === Number(dept.id) ? 'selected' : '';
    return `<option value="${dept.id}" ${selected}>${dept.name}</option>`;
  }).join('');
  return defaultOption + options;
}

function buildZoneOptions(selectedId, zones = cachedZones) {
  const defaultOption = '<option value="">Select zone</option>';
  if (!zones || zones.length === 0) {
    console.warn('No zones available for dropdown');
    return defaultOption;
  }
  const options = zones.map(zone => {
    const selected = selectedId && Number(selectedId) === Number(zone.id.split('-')[1]) ? 'selected' : '';
    return `<option value="${zone.id.split('-')[1]}" ${selected}>${zone.name}</option>`;
  }).join('');
  return defaultOption + options;
}

async function updateStaffDepartment(userId, deptId, selectEl) {
  if (!userId || !deptId) return;
  selectEl?.classList.add('saving');
  selectEl.disabled = true;
  try {
    const response = await fetch(getApiUrl('update-staff-department.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, dept_id: deptId })
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Update failed');
    }
    if (selectEl) {
      selectEl.dataset.originalValue = String(deptId);
      selectEl.classList.add('saved');
      setTimeout(() => selectEl.classList.remove('saved'), 800);
    }
  } catch (err) {
    console.error('Failed to update department:', err);
    if (selectEl && selectEl.dataset.originalValue) {
      selectEl.value = selectEl.dataset.originalValue;
    }
    alert('Could not update department. Please try again.');
  } finally {
    if (selectEl) {
      selectEl.disabled = false;
      selectEl.classList.remove('saving');
    }
  }
}

async function updateStaffZone(userId, zoneId, selectEl) {
  if (!userId || !zoneId) return;
  selectEl?.classList.add('saving');
  selectEl.disabled = true;
  try {
    const response = await fetch(getApiUrl('update-staff-zone.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, zone_id: zoneId })
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Update failed');
    }
    if (selectEl) {
      selectEl.dataset.originalValue = String(zoneId);
      selectEl.classList.add('saved');
      setTimeout(() => selectEl.classList.remove('saved'), 800);
    }
  } catch (err) {
    console.error('Failed to update zone:', err);
    if (selectEl && selectEl.dataset.originalValue) {
      selectEl.value = selectEl.dataset.originalValue;
    }
    alert('Could not update zone. Please try again.');
  } finally {
    if (selectEl) {
      selectEl.disabled = false;
      selectEl.classList.remove('saving');
    }
  }
}

async function updateStaffStatus(userId, status, selectEl) {
  if (!userId || !status) return;
  selectEl?.classList.add('saving');
  selectEl.disabled = true;
  try {
    const response = await fetch(getApiUrl('update-staff-status.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, status: status })
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Update failed');
    }
    if (selectEl) {
      selectEl.dataset.originalValue = String(status);
      selectEl.classList.add('saved');
      setTimeout(() => selectEl.classList.remove('saved'), 800);
    }
    // Reload staff data to update stats
    loadStaffData();
  } catch (err) {
    console.error('Failed to update status:', err);
    if (selectEl && selectEl.dataset.originalValue) {
      selectEl.value = selectEl.dataset.originalValue;
    }
    alert('Could not update status. Please try again.');
  } finally {
    if (selectEl) {
      selectEl.disabled = false;
      selectEl.classList.remove('saving');
    }
  }
}

function renderStaffTable(staffList, departments = cachedDepartments, zones = cachedZones) {
  const tbody = document.querySelector('.table-box tbody');
  if (!tbody) return;

  if (!staffList.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; opacity:0.7;">No staff found</td></tr>';
    return;
  }

  const rows = staffList.map(staff => {
    const deptOptions = buildDepartmentOptions(staff.department_id, departments);
    const zoneOptions = buildZoneOptions(staff.zone_id, zones);
    const assignedCount = staff.assigned_complaints || 0;
    const statusOptions = `
      <option value="Active" ${staff.status === 'Active' ? 'selected' : ''}>Active</option>
      <option value="On Duty" ${staff.status === 'On Duty' ? 'selected' : ''}>On Duty</option>
      <option value="On Leave" ${staff.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
    `;
    return `
      <tr>
        <td>${staff.staff_id}</td>
        <td>${staff.name}</td>
        <td>${staff.designation}</td>
        <td>
          <select class="dept-select" data-user-id="${staff.user_id}" data-original-value="${staff.department_id || ''}">
            ${deptOptions}
          </select>
        </td>
        <td>
          <select class="zone-select" data-user-id="${staff.user_id}" data-original-value="${staff.zone_id || ''}">
            ${zoneOptions}
          </select>
        </td>
        <td>${assignedCount}</td>
        <td>
          <select class="status-select" data-user-id="${staff.user_id}" data-original-value="${staff.status}">
            ${statusOptions}
          </select>
        </td>
        <td class="contact-cell">
          <span class="contact-icon"><i class="fas fa-phone"></i></span> ${staff.phone}<br>
          <span class="contact-icon"><i class="fas fa-envelope"></i></span> ${staff.email}
        </td>
        <td>
          <button class="delete-staff-btn" data-user-id="${staff.user_id}" title="Delete Staff"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows;
  // Modal elements
  const modal = document.getElementById('deleteConfirmModal');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  let pendingDeleteUserId = null;

  tbody.querySelectorAll('.delete-staff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.userId;
      if (!userId) return;
      pendingDeleteUserId = userId;
      // Store the row element for animation
      const row = btn.closest('tr');
      if (row) row.classList.remove('staff-row-deleting');
      btn._rowRef = row;
      if (modal) modal.style.display = 'flex';
    });
  });

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (modal) modal.style.display = 'none';
      pendingDeleteUserId = null;
    };
  }

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      if (!pendingDeleteUserId) return;
      // Find the row for animation
      let row = null;
      tbody.querySelectorAll('.delete-staff-btn').forEach(btn => {
        if (btn.dataset.userId == pendingDeleteUserId && btn._rowRef) row = btn._rowRef;
      });
      try {
        const response = await fetch(getApiUrl('delete-staff.php'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: pendingDeleteUserId })
        });
        const result = await response.json();
        if (result.success) {
          if (row) {
            row.classList.add('staff-row-deleting');
            setTimeout(() => {
              if (modal) modal.style.display = 'none';
              loadStaffData();
            }, 700);
          } else {
            if (modal) modal.style.display = 'none';
            loadStaffData();
          }
        } else {
          alert(result.message || 'Failed to delete staff.');
          if (modal) modal.style.display = 'none';
        }
      } catch (err) {
        alert('Error deleting staff.');
        console.error(err);
        if (modal) modal.style.display = 'none';
      }
      pendingDeleteUserId = null;
    };
  }

  // Department select listeners
  tbody.querySelectorAll('.dept-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const userId = Number(select.dataset.userId);
      const deptId = Number(select.value);
      if (!deptId) {
        select.value = select.dataset.originalValue || '';
        return;
      }
      updateStaffDepartment(userId, deptId, select);
    });
  });

  // Zone select listeners
  tbody.querySelectorAll('.zone-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const userId = Number(select.dataset.userId);
      const zoneId = Number(select.value);
      if (!zoneId) {
        select.value = select.dataset.originalValue || '';
        return;
      }
      updateStaffZone(userId, zoneId, select);
    });
  });

  // Status select listeners
  tbody.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const userId = Number(select.dataset.userId);
      const status = select.value;
      if (!status) {
        select.value = select.dataset.originalValue || '';
        return;
      }
      updateStaffStatus(userId, status, select);
    });
  });
}

async function loadStaffData() {
  try {
    await fetchDepartments();
    await fetchZones();
    const response = await fetch(getApiUrl('get-staff.php'));
    if (!response.ok) throw new Error('Failed to fetch staff');
    const result = await response.json();

    if (result.success) {
      const total = result.count;
      
      // Update total staff count in stat card
      const totalStaffElement = document.getElementById('totalStaff');
      if (totalStaffElement) {
        totalStaffElement.textContent = total;
      }

      // Parse zone_id from zone name if available
      const staffWithZoneId = result.staff.map(s => ({
        ...s,
        zone_id: extractZoneId(s.zone)
      }));

      renderStaffTable(staffWithZoneId || [], cachedDepartments, cachedZones);
    }
  } catch (error) {
    console.error('Error loading staff:', error);
  }
}

function extractZoneId(zoneName) {
  // Try to find zone ID from cached zones
  if (!zoneName) return null;
  const zone = cachedZones.find(z => z.name === zoneName);
  return zone ? Number(zone.id.split('-')[1]) : null;
}

// Edit Mode Toggle
const editModeToggle = document.getElementById('editModeToggle');
if (editModeToggle) {
  editModeToggle.addEventListener('click', function() {
    document.body.classList.toggle('edit-mode-active');
    this.classList.toggle('active');
    
    if (document.body.classList.contains('edit-mode-active')) {
      this.innerHTML = '<i class="fas fa-times"></i> Disable Edit';
    } else {
      this.innerHTML = '<i class="fas fa-edit"></i> Edit Mode';
    }
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminData');
    window.location.href = '../index/index.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Setup menu button toggle
  const menuBtn = document.getElementById('menuBtn');
  const layout = document.getElementById('layout');
  
  if (menuBtn && layout) {
    menuBtn.addEventListener('click', () => {
      layout.classList.toggle('collapsed');
    });
  }
  
  loadStaffData();
});
