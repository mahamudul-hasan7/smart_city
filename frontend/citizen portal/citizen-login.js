const form = document.getElementById("citizenForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");

const API_URL = "http://127.0.0.1/Smart_City/backend/login.php";

// Password visibility toggle
passwordToggle.addEventListener("click", function (e) {
  e.preventDefault();
  
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  
  const icon = passwordToggle.querySelector("i");
  icon.classList.toggle("fa-eye");
  icon.classList.toggle("fa-eye-slash");
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  clearErrors();

  if (!email.value || !password.value) {
    if (!email.value) showError(email, "Email required");
    if (!password.value) showError(password, "Password required");
    return;
  }

  loginCitizen();
});

// Handle forgot password
function handleForgotPassword(e) {
  e.preventDefault();
  alert("🔒 Password Reset\n\nFor security reasons, please contact the city authority to reset your password.\n\nEmail: support@smartcity.gov");
}

async function loginCitizen() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    });

    const data = await response.json();

    if (data.success) {
      // Store user data
      localStorage.setItem("citizenLoggedIn", "true");
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      // Show success animation
      showLoginSuccessAnimation(data.user.name);
      
      // Redirect after 2.5 seconds
      setTimeout(() => {
        window.location.href = "../citizen portal/citizen-portal.html";
      }, 2500);
    } else {
      if (data.errors) {
        for (let field in data.errors) {
          const input = document.getElementById(field);
          if (input) {
            showError(input, data.errors[field]);
          }
        }
      } else {
        showErrorNotification(data.message || "Login failed");
      }
    }
  } catch (err) {
    showErrorNotification("Network error: " + err.message);
  }
}

function showError(input, message) {
  input.parentElement.querySelector("em").textContent = message;
}

function clearErrors() {
  document.querySelectorAll("em").forEach(e => e.textContent = "");
}

function showSuccessNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification success';
  notification.innerHTML = message;
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

// Enhanced Login Success Animation with Loading Progress
function showLoginSuccessAnimation(userName) {
  const modal = document.getElementById('loginSuccessModal');
  const welcomeName = document.getElementById('welcomeName');
  const progressFill = document.querySelector('.progress-fill');
  const progressGlow = document.querySelector('.progress-glow');
  const loadingText = document.querySelector('.loading-text');
  
  if (welcomeName) {
    welcomeName.textContent = `Welcome back, ${userName}!`;
  }
  
  if (modal) {
    modal.classList.add('active');
    
    // Animate progress bar
    if (progressFill && progressGlow) {
      setTimeout(() => {
        progressFill.style.width = '100%';
        progressGlow.style.width = '100%';
      }, 800);
    }
    
    // Update loading text
    if (loadingText) {
      setTimeout(() => {
        loadingText.textContent = 'Loading your data...';
      }, 1000);
      setTimeout(() => {
        loadingText.textContent = 'Almost ready...';
      }, 1800);
    }
  }
}

// Helper function to adjust color brightness
function adjustColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
    (G<255?G<1?0:G:255)*0x100 +
    (B<255?B<1?0:B:255))
    .toString(16).slice(1);
}

// Helper function to adjust color brightness
function adjustColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
    (G<255?G<1?0:G:255)*0x100 +
    (B<255?B<1?0:B:255))
    .toString(16).slice(1);
}
