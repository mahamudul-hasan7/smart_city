// Get API URL helper
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

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
              <td colspan="7" style="text-align:center; opacity:0.7;">
                No departments found
              </td>
            </tr>
          `;
        } else {
          result.departments.forEach(dept => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${dept.id}</td>
              <td>${dept.name}</td>
              <td>${dept.email}</td>
              <td>${dept.phone}</td>
              <td>${dept.street}</td>
              <td>${dept.area}</td>
              <td>${dept.city}</td>
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
          <td colspan="7" style="text-align:center; color:#ff4444;">
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
