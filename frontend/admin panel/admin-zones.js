// --- Edit Mode Toggle ---
let editModeActive = false;
const editModeToggle = document.getElementById('editModeToggle');
if (editModeToggle) {
  editModeToggle.addEventListener('click', function() {
    editModeActive = !editModeActive;
    document.body.classList.toggle('edit-mode-active', editModeActive);
    editModeToggle.classList.toggle('active', editModeActive);
    editModeToggle.innerHTML = editModeActive
      ? '<i class="fas fa-xmark"></i> Exit Edit Mode'
      : '<i class="fas fa-pen-to-square"></i> Edit Mode';
  });
}
// --- Delete Modal Logic ---
let pendingDeleteZoneId = null;
let pendingDeleteZoneRow = null;
const deleteZoneOverlay = document.getElementById('deleteZoneModalOverlay');
const deleteZoneName = document.getElementById('deleteZoneName');
const deleteZoneStatusMsg = document.getElementById('deleteZoneStatusMsg');
const closeDeleteZoneModalBtn = document.getElementById('closeDeleteZoneModal');
const cancelDeleteZoneModalBtn = document.getElementById('cancelDeleteZoneModal');
const confirmDeleteZoneBtn = document.getElementById('confirmDeleteZoneBtn');

window.openDeleteZoneModal = function(zoneId, name) {
  pendingDeleteZoneId = zoneId;
  deleteZoneName.textContent = name;
  deleteZoneStatusMsg.textContent = '';
  deleteZoneStatusMsg.className = 'zone-status-msg';
  // Find the row for animation (by matching zoneId in first cell)
  const tbody = document.getElementById('zoneTableBody');
  pendingDeleteZoneRow = null;
  if (tbody) {
    Array.from(tbody.children).forEach(tr => {
      if (tr.children[0] && (tr.children[0].textContent === zoneId || tr.children[0].textContent === String(zoneId))) {
        pendingDeleteZoneRow = tr;
      }
    });
  }
  deleteZoneOverlay.style.display = 'flex';
};

function closeDeleteZoneModal() {
  deleteZoneOverlay.style.display = 'none';
  pendingDeleteZoneId = null;
  pendingDeleteZoneRow = null;
}
if (closeDeleteZoneModalBtn) closeDeleteZoneModalBtn.onclick = closeDeleteZoneModal;
if (cancelDeleteZoneModalBtn) cancelDeleteZoneModalBtn.onclick = closeDeleteZoneModal;
deleteZoneOverlay && deleteZoneOverlay.addEventListener('click', e => { if (e.target === deleteZoneOverlay) closeDeleteZoneModal(); });

if (confirmDeleteZoneBtn) confirmDeleteZoneBtn.onclick = async function () {
  if (!pendingDeleteZoneId) return;
  deleteZoneStatusMsg.textContent = 'Deleting...';
  deleteZoneStatusMsg.className = 'zone-status-msg';
  try {
    const res = await fetch(getApiUrl('delete-zone.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone_id: pendingDeleteZoneId })
    });
    const data = await res.json();
    if (data.success) {
      deleteZoneStatusMsg.textContent = '✓ Deleted!';
      deleteZoneStatusMsg.classList.add('success');
      if (pendingDeleteZoneRow) {
        pendingDeleteZoneRow.classList.add('zone-row-deleting');
        setTimeout(() => { closeDeleteZoneModal(); loadZonesData(); }, 700);
      } else {
        setTimeout(() => { closeDeleteZoneModal(); loadZonesData(); }, 700);
      }
    } else {
      deleteZoneStatusMsg.textContent = data.message || 'Delete failed.';
      deleteZoneStatusMsg.classList.add('error');
    }
  } catch (err) {
    deleteZoneStatusMsg.textContent = 'Network error. Try again.';
    deleteZoneStatusMsg.classList.add('error');
  }
};
// Get API URL helper
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

// Load zones data
async function loadZonesData() {
  try {
    const response = await fetch(getApiUrl('get-zones.php'));
    const result = await response.json();

    if (result.success) {
      const tbody = document.getElementById("zoneTableBody");
      if (tbody) {
        tbody.innerHTML = '';
        
        if (result.zones.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align:center; opacity:0.7;">
                No zones found
              </td>
            </tr>
          `;
        } else {
          result.zones.forEach(zone => {
            const tr = document.createElement("tr");
            const safeName = zone.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            // Extract the real zone_id from the formatted id (e.g., Z-1 => 1)
            const realZoneId = zone.id && zone.id.startsWith('Z-') ? zone.id.substring(2) : zone.id;
            tr.innerHTML = `
              <td>${zone.id}</td>
              <td>${zone.name}</td>
              <td>${zone.city}</td>
              <td>${zone.area}</td>
              <td><button class="btn-delete-row"><i class="fas fa-trash"></i> Delete</button></td>
            `;
            // Attach event listener for delete, pass real integer id
            tr.querySelector('.btn-delete-row').addEventListener('click', function() {
              window.openDeleteZoneModal(realZoneId, zone.name);
            });
            tbody.appendChild(tr);
          });
        }
      }

      // Update stats
      if (result.stats) {
        const totalEl = document.getElementById("totalZones");
        if (totalEl) totalEl.textContent = result.stats.total;
      }
    }
  } catch (error) {
    console.error("Error loading zones:", error);
  }
}

// Logout handler
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
  // Setup menu button toggle
  const menuBtn = document.getElementById('menuBtn');
  const layout = document.getElementById('layout');
  
  if (menuBtn && layout) {
    menuBtn.addEventListener('click', () => {
      layout.classList.toggle('collapsed');
    });
  }
  
  loadZonesData();
});
