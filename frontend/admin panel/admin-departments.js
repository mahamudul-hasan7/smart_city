// Get API URL helper
function getApiUrl(endpoint) {
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

/* ── Edit Mode Toggle ── */
let editModeActive = false;

function toggleEditMode() {
  editModeActive = !editModeActive;
  const table = document.querySelector('.table-box table');
  const toggleBtn = document.getElementById('editModeToggle');
  const editModeText = document.getElementById('editModeText');
  if (editModeActive) {
    table && table.classList.add('edit-mode');
    toggleBtn && toggleBtn.classList.add('active');
    if (editModeText) editModeText.textContent = 'Exit Edit Mode';
  } else {
    table && table.classList.remove('edit-mode');
    toggleBtn && toggleBtn.classList.remove('active');
    if (editModeText) editModeText.textContent = 'Edit Mode';
  }
}

document.getElementById('editModeToggle').addEventListener('click', toggleEditMode);

/* ── Delete Modal ── */
let pendingDeleteId = null;
const deleteOverlay = document.getElementById('deleteModalOverlay');

function openDeleteModal(rawId, name) {
  pendingDeleteId = rawId;
  document.getElementById('deleteDeptName').textContent = name;
  document.getElementById('deleteStatusMsg').textContent = '';
  document.getElementById('deleteStatusMsg').className = 'dept-status-msg';
  deleteOverlay.classList.add('show');
}

function closeDeleteModal() {
  deleteOverlay.classList.remove('show');
  pendingDeleteId = null;
}

document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
document.getElementById('cancelDeleteModal').addEventListener('click', closeDeleteModal);
deleteOverlay.addEventListener('click', e => { if (e.target === deleteOverlay) closeDeleteModal(); });

document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {
  if (!pendingDeleteId) return;
  const statusMsg = document.getElementById('deleteStatusMsg');
  statusMsg.textContent = 'Deleting...';
  statusMsg.className = 'dept-status-msg';
  // Find the row for animation
  let row = null;
  const tbody = document.getElementById('deptTable');
  if (tbody) {
    Array.from(tbody.children).forEach(tr => {
      if (tr.querySelector('.btn-delete-row') && tr.querySelector('.btn-delete-row').getAttribute('onclick')?.includes(pendingDeleteId)) {
        row = tr;
      }
    });
  }
  try {
    const res  = await fetch(getApiUrl('delete-department.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dept_id: pendingDeleteId })
    });
    const data = await res.json();
    if (data.success) {
      statusMsg.textContent = '✓ Deleted!';
      statusMsg.classList.add('success');
      if (row) {
        row.classList.add('dept-row-deleting');
        setTimeout(() => { closeDeleteModal(); loadDepartmentsData(); }, 700);
      } else {
        setTimeout(() => { closeDeleteModal(); loadDepartmentsData(); }, 700);
      }
    } else {
      statusMsg.textContent = data.message || 'Delete failed.';
      statusMsg.classList.add('error');
    }
  } catch (err) {
    statusMsg.textContent = 'Network error. Try again.';
    statusMsg.classList.add('error');
  }
});

// Load departments data
async function loadDepartmentsData() {
  try {
    const response = await fetch(getApiUrl('get-departments.php'));
    const result = await response.json();

    if (result.success) {
      // Set total count directly
      const totalElement = document.getElementById('totalDepartments');
      if (totalElement) {
        totalElement.textContent = result.departments.length;
      }
      
      const tbody = document.getElementById("deptTable");
      if (tbody) {
        tbody.innerHTML = '';
        
        if (result.departments.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="8" style="text-align:center; opacity:0.7;">
                No departments found
              </td>
            </tr>
          `;
        } else {
          result.departments.forEach(dept => {
            const tr = document.createElement("tr");
            const safeName = dept.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            tr.innerHTML = `
              <td>${dept.id}</td>
              <td>${dept.name}</td>
              <td>${dept.email}</td>
              <td>${dept.phone}</td>
              <td>${dept.street}</td>
              <td>${dept.area}</td>
              <td>${dept.city}</td>
              <td>
                <button class="btn-delete-row" onclick="openDeleteModal('${dept.rawId}', '${safeName}')"><i class="fas fa-trash"></i> Delete</button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
    }
  } catch (error) {
    console.error("Error loading departments:", error);
    const tbody = document.getElementById("deptTable");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; color:#ff4444;">
            Error loading departments. Check XAMPP is running.
          </td>
        </tr>
      `;
    }
  }
}

// Animate count from 0 to target
function animateCount(target) {
  const element = document.getElementById('totalDepartments');
  if (!element) return;
  
  let current = 0;
  const increment = target / 50;
  const duration = 1500; // 1.5 seconds
  const stepTime = duration / 50;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, stepTime);
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
  loadDepartmentsData();
});

console.log("Admin Departments Loaded");
