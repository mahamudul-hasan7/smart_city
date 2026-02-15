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
            
            tr.innerHTML = `
              <td>${zone.id}</td>
              <td>${zone.name}</td>
              <td>${zone.city}</td>
              <td>${zone.area}</td>
            `;
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
