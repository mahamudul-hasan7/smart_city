const staffForm = document.getElementById("staffForm");
const overlay = document.getElementById("overlay");
const spinner = document.getElementById("spinner");
const checkmark = document.getElementById("checkmark");
const saveText = document.getElementById("saveText");

// Zone dropdown
const zoneSelect = document.getElementById("zone");

// ============ API URL Helper ============
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}
  

// ============ Load Next Staff ID ============
async function loadNextStaffID() {
  try {
    const response = await fetch(getApiUrl('get-next-staff-id.php'));
    const data = await response.json();
    
    if (data.success) {
      const staffIdInput = document.getElementById('staff_id');
      const nextIdInfo = document.getElementById('nextIdInfo');
      
      staffIdInput.value = data.next_staff_id;
      nextIdInfo.textContent = `Next Staff ID: ${data.next_staff_id}`;
      
      console.log('Next Staff ID loaded:', data.next_staff_id);
    } else {
      console.error('Failed to load next staff ID:', data.message);
    }
  } catch (error) {
    console.error('Error loading next staff ID:', error);
  }
}

// ============ Load Zones from Database ============
async function loadZones() {
  try {
    const response = await fetch(getApiUrl('get-zones.php'));
    const data = await response.json();
    
    if (data.success && data.zones) {
      // Clear existing options except the first default one
      zoneSelect.innerHTML = '<option value="">Select Zone</option>';
      
      // Add zones from database
      data.zones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone.name;
        option.textContent = zone.name;
        zoneSelect.appendChild(option);
      });
      
      console.log(`Loaded ${data.zones.length} zones from database`);
    } else {
      console.error('Failed to load zones:', data.message);
    }
  } catch (error) {
    console.error('Error loading zones:', error);
  }
}

// ============ Initialize - Load Zones on Page Load ============
// ============ VALIDATION FUNCTIONS ============
function validateStaffID(value) {
  return value && value.trim().length > 0;
}

function validateEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^(?:\+88)?01[3-9]\d{8}$/;
  return phoneRegex.test(phone);
}

function validateForm() {
  let isValid = true;
  const fields = ['full_name', 'designation', 'zone'];  // staff_id is auto-generated, not required

  // Clear previous errors
  document.querySelectorAll('.form-group.error').forEach(el => {
    el.classList.remove('error');
    el.querySelector('.form-error').classList.remove('show');
  });

  // Validate each field
  fields.forEach(fieldName => {
    const field = document.getElementById(fieldName);
    if (!field) {
      return;
    }
    const value = field.value.trim();
    const formGroup = field.closest('.form-group');
    const errorEl = formGroup.querySelector('.form-error');

    if (!value) {
      formGroup.classList.add('error');
      errorEl.textContent = `${fieldName.replace(/_/g, ' ')} is required`;
      errorEl.classList.add('show');
      isValid = false;
    }
  });

  // Validate email if provided
  const emailField = document.getElementById('email');
  if (emailField.value && !validateEmail(emailField.value)) {
    const formGroup = emailField.closest('.form-group');
    const errorEl = formGroup.querySelector('.form-error');
    formGroup.classList.add('error');
    errorEl.textContent = 'Invalid email address';
    errorEl.classList.add('show');
    isValid = false;
  }

  // Validate phone if provided
  const phoneField = document.getElementById('phone');
  if (phoneField.value && !validatePhone(phoneField.value)) {
    const formGroup = phoneField.closest('.form-group');
    const errorEl = formGroup.querySelector('.form-error');
    formGroup.classList.add('error');
    errorEl.textContent = 'Invalid phone number (01XXXXXXXXX)';
    errorEl.classList.add('show');
    isValid = false;
  }

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
  loadNextStaffID();
  loadZones();

  // Real-time validation on input
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

staffForm.addEventListener("submit", async e => {
  e.preventDefault();

  // Validate form first
  if (!validateForm()) {
    showNotification('Please fix the errors above', 'error');
    return;
  }

  overlay.classList.add("show");
  spinner.style.display = "block";
  checkmark.style.display = "none";
  saveText.textContent = "Saving staff...";

  // Get form data
  const formData = {
    staff_id: document.getElementById("staff_id").value.trim(),
    full_name: document.getElementById("full_name").value.trim(),
    designation: document.getElementById("designation").value.trim(),
    zone: document.getElementById("zone").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim()
  };

  try {
    const apiUrl = getApiUrl('add-staff.php');
    
    console.log("Sending request to:", apiUrl);
    console.log("Form Data:", formData);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    // Get response text first to check if it's valid JSON
    const responseText = await response.text();
    console.log("Raw Response:", responseText);
    
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Full Response Text:", responseText);
      
      // Try to extract error message from HTML if it's a PHP error
      let errorMsg = "Invalid response from server";
      if (responseText.includes('Fatal error') || responseText.includes('Warning') || responseText.includes('Notice')) {
        // Extract PHP error message
        const errorMatch = responseText.match(/(Fatal error|Warning|Notice|Parse error)[^<]*/i);
        if (errorMatch) {
          errorMsg = "PHP Error: " + errorMatch[0].substring(0, 200);
        }
      } else if (responseText.trim().length > 0) {
        errorMsg = "Server response: " + responseText.substring(0, 200);
      }
      
      throw new Error(errorMsg);
    }

    // Check if response is ok
    if (!response.ok) {
      // If we got a JSON response with error message, use it
      if (result && result.message) {
        let errorMsg = `Error ${response.status}: ${result.message}`;
        if (response.status === 405) {
          errorMsg += "\n\nPossible fixes:";
          errorMsg += "\n1. Check if PHP file exists";
          errorMsg += "\n2. Check Apache mod_rewrite is enabled";
          errorMsg += "\n3. Check .htaccess file in backend folder";
        }
        throw new Error(errorMsg);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (result.success) {
      // Success
      spinner.style.display = "none";
      checkmark.style.display = "block";
      saveText.textContent = "Staff added successfully";
      
      // Auto close and reset form
      setTimeout(() => {
        overlay.classList.remove("show");
        staffForm.reset();
        saveText.style.color = "";
        // Reload next staff ID to avoid duplicate
        loadNextStaffID();
      }, 2000);
    } else {
      // Error
      spinner.style.display = "none";
      checkmark.style.display = "none";
      saveText.textContent = result.message || "Failed to add staff";
      saveText.style.color = "#ff4444";
      
      // Show error for 3 seconds
      setTimeout(() => {
        overlay.classList.remove("show");
        saveText.style.color = "";
      }, 3000);
    }
  } catch (error) {
    // Network or other error
    spinner.style.display = "none";
    checkmark.style.display = "none";
    
    // Show specific error message
    let errorMsg = "Connection error!\n\n";
    
    // Check if using Live Server
    const currentPort = window.location.port;
    if (currentPort === '5501' || currentPort === '5500') {
      errorMsg += "⚠️ IMPORTANT: You are using Live Server (port " + currentPort + ")\n";
      errorMsg += "Live Server cannot execute PHP files!\n\n";
      errorMsg += "✅ SOLUTION:\n";
      errorMsg += "1. Open XAMPP Control Panel\n";
      errorMsg += "2. Start Apache server\n";
      errorMsg += "3. Open browser and go to:\n";
      errorMsg += "   http://localhost/Smart_City/frontend/admin panel/admin-add-staff.html\n";
      errorMsg += "4. Close Live Server\n\n";
    } else {
      errorMsg += "Please check:\n";
      errorMsg += "1. XAMPP Apache is running\n";
      errorMsg += "2. Database is connected\n";
      errorMsg += "3. PHP file path is correct\n";
    }
    
    saveText.textContent = error.message || errorMsg;
    saveText.style.color = "#ff4444";
    saveText.style.whiteSpace = "pre-line";
    
    setTimeout(() => {
      overlay.classList.remove("show");
      saveText.style.color = "";
      saveText.style.whiteSpace = "";
    }, 4000);
    
    console.error("Error Details:", error);
    console.error("Form Data:", formData);
  }
});

// Sidebar toggle for fixed sidebar (menu button)
const menuBtn = document.getElementById("menuBtn");
const layout = document.getElementById("layout");
if (menuBtn && layout) {
  menuBtn.addEventListener("click", () => {
    layout.classList.toggle("collapsed");
  });
}
