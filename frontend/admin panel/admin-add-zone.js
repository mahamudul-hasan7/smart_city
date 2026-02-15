const zoneForm = document.getElementById("zoneForm");
const overlay = document.getElementById("overlay");
const spinner = document.getElementById("spinner");
const checkmark = document.getElementById("checkmark");
const saveText = document.getElementById("saveText");

// Get API URL helper
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

// ============ Load Next Zone ID ============
async function loadNextZoneID() {
  try {
    const response = await fetch(getApiUrl('get-next-zone-id.php'));
    const data = await response.json();
    
    if (data.success) {
      const zoneIdInput = document.getElementById('zone_id');
      const nextIdInfo = document.getElementById('nextIdInfo');
      
      zoneIdInput.value = data.next_zone_id;
      nextIdInfo.textContent = `Next Zone ID: ${data.next_zone_id}`;
      
      console.log('Next Zone ID loaded:', data.next_zone_id);
    } else {
      console.error('Failed to load next zone ID:', data.message);
    }
  } catch (error) {
    console.error('Error loading next zone ID:', error);
  }
}

// ============ VALIDATION FUNCTIONS ============
function validateForm() {
  let isValid = true;
  const requiredFields = ['zone_name'];  // zone_id is auto-generated, not required

  // Clear previous errors
  document.querySelectorAll('.form-group.error').forEach(el => {
    el.classList.remove('error');
    el.querySelector('.form-error').classList.remove('show');
  });

  // Validate required fields
  requiredFields.forEach(fieldName => {
    const field = document.getElementById(fieldName);
    const value = field.value.trim();
    const formGroup = field.closest('.form-group');
    const errorEl = formGroup.querySelector('.form-error');

    if (!value) {
      formGroup.classList.add('error');
      errorEl.textContent = 'This field is required';
      errorEl.classList.add('show');
      isValid = false;
    }
  });

  return isValid;
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4444' : '#00d4ff'};
    color: ${type === 'success' ? '#000' : '#fff'};
    border-radius: 10px;
    z-index: 10000;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadNextZoneID();
  
  // Real-time validation on input and select fields
  document.querySelectorAll('.form-group input, .form-group select').forEach(field => {
    field.addEventListener('blur', () => {
      const formGroup = field.closest('.form-group');
      const errorEl = formGroup.querySelector('.form-error');
      formGroup.classList.remove('error');
      errorEl.classList.remove('show');
    });
  });

  // Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminData');
      window.location.href = '../index/index.html';
    });
  }
});

zoneForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  // Validate form first
  if (!validateForm()) {
    showNotification('Please fix the errors above', 'error');
    return;
  }

  overlay.classList.add("show");
  spinner.style.display = "block";
  checkmark.style.display = "none";
  saveText.textContent = "Saving zone...";

  const formData = {
    name: document.getElementById('zone_name').value.trim(),
    city: document.getElementById('zone_city').value.trim(),
    area_description: document.getElementById('zone_area').value.trim()
  };

  try {
    const response = await fetch(getApiUrl('add-zone.php'), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("Invalid response from server");
    }

    if (result.success) {
      spinner.style.display = "none";
      checkmark.style.display = "block";
      saveText.textContent = "Zone added successfully";
      
      setTimeout(() => {
        overlay.classList.remove("show");
        zoneForm.reset();
        window.location.href = "admin-zones.html";
      }, 2000);
    } else {
      spinner.style.display = "none";
      checkmark.style.display = "none";
      saveText.textContent = result.message || "Failed to add zone";
      saveText.style.color = "#ff4444";
      
      setTimeout(() => {
        overlay.classList.remove("show");
        saveText.style.color = "";
      }, 3000);
    }
  } catch (error) {
    spinner.style.display = "none";
    checkmark.style.display = "none";
    saveText.textContent = "Connection error. Check XAMPP is running.";
    saveText.style.color = "#ff4444";
    
    setTimeout(() => {
      overlay.classList.remove("show");
      saveText.style.color = "";
    }, 3000);
    
    console.error("Error:", error);
  }
});
