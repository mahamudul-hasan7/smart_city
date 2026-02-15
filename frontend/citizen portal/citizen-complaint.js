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
  // Set topbar profile
  setWelcomeName();
  
  const form = document.getElementById("complaintForm");
  const submitBtn = document.querySelector(".submit-btn");
  
  if (!form) {
    console.error("Form not found!");
    return;
  }
  
  if (!submitBtn) {
    console.error("Submit button not found!");
    return;
  }
  
  // Load zones from database
  loadZones();
  
  // Setup form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    submitComplaint(form, submitBtn);
  });
  
  // Setup logout button
  setupLogout();
});

function setWelcomeName() {
  const name = currentUser?.name || 'Citizen';
  const welcome = document.querySelector('.welcome');
  if (welcome) {
    welcome.textContent = `Welcome, ${name}`;
  }

  const avatarText = document.getElementById('topbarAvatarText');
  const avatarImage = document.getElementById('topbarAvatarImage');
  const savedAvatar = localStorage.getItem('userAvatar');

  if (savedAvatar && avatarImage && avatarText) {
    avatarImage.src = savedAvatar;
    avatarImage.style.display = 'block';
    avatarText.style.display = 'none';
  } else if (avatarText) {
    avatarText.textContent = name.charAt(0).toUpperCase();
  }
}

function setupLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('citizenLoggedIn');
      localStorage.removeItem('userData');
      window.location.href = 'citizen-login.html';
    });
  }
}

// Load zones from database
async function loadZones() {
  try {
    const response = await fetch('http://127.0.0.1/Smart_City/backend/get-zones.php');
    const data = await response.json();
    
    if (data.success && data.zones) {
      const zoneSelect = document.getElementById("zone");
      if (zoneSelect) {
        // Clear existing options except the first one
        zoneSelect.innerHTML = '<option value="">Select Zone</option>';
        
        // Add zones from database
        data.zones.forEach(zone => {
          const option = document.createElement('option');
          option.value = zone.name;
          option.textContent = zone.name;
          zoneSelect.appendChild(option);
        });
      }
    }
  } catch (err) {
    console.error('Error loading zones:', err);
    // Keep hardcoded zones as fallback
  }
}

// Submit complaint
async function submitComplaint(form, submitBtn) {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value.trim();
  const zone = document.getElementById("zone").value.trim();
  const streetArea = document.getElementById("location").value.trim();
  const priority = document.getElementById("priority").value.trim();
  
  // Combine zone and street/area for full location
  const location = zone && streetArea ? `${zone}, ${streetArea}` : (zone || streetArea);
  
  if (!title || !description || !category || !location) {
    showErrorNotification("Please fill all required fields");
    return;
  }
  
  // Show loading animation
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.textContent = "Submitting...";
  
  // Show loader
  const loader = document.getElementById('loader');
  const successMsg = document.getElementById('success');
  const submitStatus = document.getElementById('submitStatus');
  
  if (loader) loader.style.display = 'block';
  if (successMsg) successMsg.style.display = 'none';
  if (submitStatus) submitStatus.style.display = 'block';
  
  try {
    const response = await fetch('http://127.0.0.1/Smart_City/backend/submit-complaint.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        title: title,
        description: description,
        category: category,
        location: location,
        priority: priority
      })
    });
    
    // Hide loader
    if (loader) loader.style.display = 'none';
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        if (errorData.errors) {
          const errorList = Object.values(errorData.errors).join(', ');
          errorMessage += ': ' + errorList;
        }
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.textContent = '✓ Complaint Submitted Successfully!';
      }
      
      showSuccessNotification("Complaint submitted successfully!");
      form.reset();
      
      setTimeout(() => {
        window.location.href = 'my-complaints.html';
      }, 2000);
    } else {
      if (submitStatus) submitStatus.style.display = 'none';
      const errorMsg = data.message || data.error || "Failed to submit complaint";
      showErrorNotification(errorMsg);
      console.error('Submit error:', data);
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.textContent = "Submit Complaint";
    }
  } catch (err) {
    // Hide loader on error
    if (loader) loader.style.display = 'none';
    if (submitStatus) submitStatus.style.display = 'none';
    
    const errorMsg = err.message || "Network error occurred";
    showErrorNotification(errorMsg);
    console.error('Submit error:', err);
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.textContent = "Submit Complaint";
  }
}

function showSuccessNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification success';
  notification.innerHTML = '✓ ' + message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function showErrorNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification error';
  notification.innerHTML = '✗ ' + message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
