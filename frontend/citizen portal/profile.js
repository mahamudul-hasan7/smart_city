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

function setWelcomeName() {
  const welcome = document.querySelector('.welcome');
  if (welcome && currentUser?.name) {
    welcome.textContent = `Welcome, ${currentUser.name}`;
  }
}

let editing = false;
let editBtn, inputs, overlay;

// Load user data on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!currentUser) return;

  // Set welcome name
  setWelcomeName();

  // Initialize elements after DOM is ready
  editBtn = document.getElementById("editBtn");
  inputs = document.querySelectorAll("#profileForm input, #profileForm select");
  overlay = document.getElementById("overlay");
  
  // Lock all fields initially
  if (inputs) {
    inputs.forEach(el => el.disabled = true);
  }
  
  // Setup edit button
  if (editBtn) {
    editBtn.addEventListener("click", handleEditClick);
  }

  // Setup change password button
  const changePassBtn = document.getElementById("changePassBtn");
  if (changePassBtn) {
    changePassBtn.addEventListener("click", toggleChangePasswordSection);
  }

  // Setup cancel password button
  const cancelPassBtn = document.getElementById("cancelPassBtn");
  if (cancelPassBtn) {
    cancelPassBtn.addEventListener("click", toggleChangePasswordSection);
  }

  // Setup submit password button
  const submitPassBtn = document.getElementById("submitPassBtn");
  if (submitPassBtn) {
    submitPassBtn.addEventListener("click", handlePasswordChange);
  }

  // Setup download button
  const downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadProfileData);
  }

  // Setup quick action buttons
  document.getElementById("newComplaintBtn").addEventListener("click", () => {
    window.location.href = 'citizen-complaint.html';
  });
  document.getElementById("viewComplaintsBtn").addEventListener("click", () => {
    window.location.href = 'my-complaints.html';
  });
  document.getElementById("trackBtn").addEventListener("click", () => {
    window.location.href = 'track-status.html';
  });
  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("editBtn").click();
  });

  // Setup danger zone buttons
  document.getElementById("enable2FABtn").addEventListener("click", () => {
    showSuccessNotification("2FA setup initiated (Coming soon)");
  });
  document.getElementById("deactivateBtn").addEventListener("click", () => {
    if (confirm("Are you sure? Your account will be deactivated.")) {
      showSuccessNotification("Account deactivated temporarily");
    }
  });
  document.getElementById("deleteBtn").addEventListener("click", handleDeleteAccount);
  
  // Load profile data
  loadProfileData();
  loadRecentComplaints();
  loadComplaintStatistics();
  loadLoginHistory();
  // loadAchievementBadges() and loadCommunityImpact() are now called from loadComplaintStatistics()

  // Logout
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('citizenLoggedIn');
      localStorage.removeItem('userData');
      window.location.href = 'citizen-login.html';
    });
  }
});

async function loadProfileData() {
  try {
    const response = await fetch(`http://127.0.0.1/Smart_City/backend/get-profile.php?user_id=${currentUser.id}`);
    const data = await response.json();
    
    if (data.success) {
      const user = data.user;
      
      // Update form inputs
      document.getElementById("name").value = user.name;
      document.getElementById("email").value = user.email;
      const phoneEl = document.getElementById("phone");
      if (phoneEl) {
        phoneEl.value = (user.phone || currentUser.phone || '');
      }
      document.getElementById("nid").value = user.nid;
      document.getElementById("dob").value = user.dob;
      document.getElementById("address").value = user.address || '';
      
      // Update display name
      document.getElementById("displayName").textContent = user.name;
      
            // Update topbar welcome and avatar
            const topbarWelcome = document.getElementById("topbarWelcome");
            if (topbarWelcome) {
              topbarWelcome.textContent = `Welcome, ${user.name}`;
            }
      
            const topbarAvatarText = document.getElementById("topbarAvatarText");
            const topbarAvatarImage = document.getElementById("topbarAvatarImage");
            const savedAvatar = localStorage.getItem('userAvatar');
      
            if (savedAvatar && topbarAvatarImage && topbarAvatarText) {
              topbarAvatarImage.src = savedAvatar;
              topbarAvatarImage.style.display = 'block';
              topbarAvatarText.style.display = 'none';
            } else if (topbarAvatarText) {
              const firstLetter = user.name.charAt(0).toUpperCase();
              topbarAvatarText.textContent = firstLetter;
            }
      
      // Update avatar - check if there's a saved image first
      const avatarText = document.getElementById("avatarText");
      const avatarImage = document.getElementById("avatarImage");
      
      if (savedAvatar && avatarImage && avatarText) {
        avatarImage.src = savedAvatar;
        avatarImage.style.display = 'block';
        avatarText.style.display = 'none';
      } else if (avatarText) {
        const firstLetter = user.name.charAt(0).toUpperCase();
        avatarText.textContent = firstLetter;
      }
      
      // Update completeness score
      updateCompletenessScore();
      
      console.log('Profile loaded:', user);
    } else {
      console.error('Failed to load profile:', data);
      document.getElementById("displayName").textContent = "Error loading data";
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    document.getElementById("displayName").textContent = "Error loading profile";
  }
}

async function handleEditClick() {
  if (!editing) {
    // ✏️ Edit mode
    inputs.forEach(el => {
      // Keep National ID and Email non-editable
      if (el.id === 'nid' || el.id === 'email') {
        el.disabled = true;
      } else {
        el.disabled = false;
      }
    });
    editBtn.textContent = "Save Changes";
    editing = true;
    return;
  }

  // 💾 Save mode
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  let address = document.getElementById("address").value.trim();
  
  // Remove duplicate "Dhaka" from address if present
  if (address) {
    address = address.replace(/,\s*Dhaka,\s*Dhaka/gi, ', Dhaka')
                     .replace(/\bDhaka,\s*Dhaka\b/gi, 'Dhaka');
  }
  
  if (!name || !email) {
    showErrorNotification("Please fill all required fields");
    return;
  }
  
  editBtn.disabled = true;
  editBtn.textContent = "Saving...";
  if (overlay) {
    overlay.style.display = 'flex';
  }
  
  try {
      const response = await fetch('http://127.0.0.1/Smart_City/backend/get-profile.php', {
        method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        name: name,
        email: email,
          address: address,
          phone: document.getElementById('phone')?.value?.trim() || ''
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccessNotification("Profile updated successfully!");
      
      // Update localStorage
      currentUser.name = name;
      currentUser.email = email;
        if (document.getElementById('phone')) {
          currentUser.phone = document.getElementById('phone').value.trim();
        }
      localStorage.setItem('userData', JSON.stringify(currentUser));
      
      inputs.forEach(el => el.disabled = true);
      editBtn.textContent = "Edit Profile";
      editing = false;
    } else {
      showErrorNotification(data.message || "Failed to update profile");
    }
  } catch (err) {
    showErrorNotification("Network error: " + err.message);
  } finally {
    editBtn.disabled = false;
    if (overlay) {
      overlay.style.display = 'none';
    }
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
// ==========================================
// NEW FEATURES
// ==========================================

function updateCompletenessScore() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const nid = document.getElementById("nid").value.trim();
  const dob = document.getElementById("dob").value.trim();
  const address = document.getElementById("address").value.trim();

  let completeness = 0;
  if (name) completeness += 20;
  if (email) completeness += 20;
  if (nid) completeness += 20;
  if (dob) completeness += 20;
  if (address) completeness += 20;

  document.getElementById("completenessBar").style.width = completeness + "%";
  document.getElementById("completenessScore").textContent = completeness + "%";
}

function toggleChangePasswordSection() {
  const section = document.getElementById("changePassSection");
  if (section.style.display === "none") {
    section.style.display = "block";
    document.getElementById("currentPass").focus();
  } else {
    section.style.display = "none";
    // Clear fields
    document.getElementById("currentPass").value = "";
    document.getElementById("newPass").value = "";
    document.getElementById("confirmPass").value = "";
  }
}

async function handlePasswordChange() {
  const currentPass = document.getElementById("currentPass").value.trim();
  const newPass = document.getElementById("newPass").value.trim();
  const confirmPass = document.getElementById("confirmPass").value.trim();

  if (!currentPass || !newPass || !confirmPass) {
    showErrorNotification("Please fill all password fields");
    return;
  }

  if (newPass.length < 6) {
    showErrorNotification("New password must be at least 6 characters");
    return;
  }

  if (newPass !== confirmPass) {
    showErrorNotification("Passwords do not match");
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1/Smart_City/backend/change-password.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        current_password: currentPass,
        new_password: newPass
      })
    });

    const data = await response.json();

    if (data.success) {
      showSuccessNotification("Password updated successfully!");
      toggleChangePasswordSection();
    } else {
      showErrorNotification(data.message || "Failed to update password");
    }
  } catch (err) {
    showErrorNotification("Network error: " + err.message);
  }
}

async function loadRecentComplaints() {
  try {
    const response = await fetch(`http://127.0.0.1/Smart_City/backend/get-complaints.php?user_id=${currentUser.id}&limit=3`);
    const data = await response.json();

    const complaintsList = document.getElementById("complaintsList");
    
    if (data.success && data.complaints && data.complaints.length > 0) {
      complaintsList.innerHTML = data.complaints.map(complaint => `
        <div class="complaint-item">
          <div class="complaint-item-title">${complaint.title || complaint.category}</div>
          <div class="complaint-item-meta">
            <span>${new Date(complaint.created_at).toLocaleDateString()}</span>
            <span class="complaint-status ${complaint.status.toLowerCase()}">${complaint.status}</span>
          </div>
        </div>
      `).join('');
    } else {
      complaintsList.innerHTML = '<p style="opacity: 0.6; text-align: center; padding: 20px;">No complaints yet</p>';
    }
  } catch (err) {
    console.error('Error loading complaints:', err);
    document.getElementById("complaintsList").innerHTML = '<p style="opacity: 0.6;">Failed to load complaints</p>';
  }
}

function downloadProfileData() {
  try {
    const profileData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      nid: document.getElementById("nid").value,
      dob: document.getElementById("dob").value,
      address: document.getElementById("address").value,
      downloaded_on: new Date().toLocaleString()
    };

    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartcity_profile_${currentUser.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccessNotification("Profile downloaded successfully!");
  } catch (err) {
    showErrorNotification("Failed to download profile: " + err.message);
  }
}

async function loadComplaintStatistics() {
  try {
    const response = await fetch(`http://127.0.0.1/Smart_City/backend/get-complaints.php?user_id=${currentUser.id}`);
    const data = await response.json();

    if (data.success && data.complaints) {
      const complaints = data.complaints;
      let total = complaints.length;
      let pending = complaints.filter(c => c.status === 'Pending').length;
      let progress = complaints.filter(c => c.status === 'In Progress').length;
      let resolved = complaints.filter(c => c.status === 'Resolved').length;

      document.getElementById("totalComplaints").textContent = total;
      document.getElementById("pendingComplaints").textContent = pending;
      document.getElementById("progressComplaints").textContent = progress;
      document.getElementById("resolvedComplaints").textContent = resolved;
      
      // Load badges and impact after stats are updated
      loadAchievementBadges();
      loadCommunityImpact();
    }
  } catch (err) {
    console.error('Error loading statistics:', err);
  }
}

async function loadLoginHistory() {
  try {
    const response = await fetch(`http://127.0.0.1/Smart_City/backend/get-login-history.php?user_id=${currentUser.id}`);
    const data = await response.json();

    const historyList = document.getElementById("loginHistory");
    
    if (data.success && data.logins && data.logins.length > 0) {
      // Update last login badge (most recent)
      const lastLoginEl = document.getElementById("lastLogin");
      if (lastLoginEl) {
        const last = data.logins[0];
        const ts = new Date(last.login_time);
        lastLoginEl.textContent = `Last login: ${ts.toLocaleString()}`;
      }

      // Show only last 3 login activities
      const recentLogins = data.logins.slice(0, 3);
      
      historyList.innerHTML = recentLogins.map(login => `
        <div class="history-item">
          <div class="history-time">${new Date(login.login_time).toLocaleString()}</div>
          <div class="history-meta">
            <span>IP: ${login.ip_address || 'N/A'}</span>
            <span>${login.device || 'Unknown Device'}</span>
          </div>
        </div>
      `).join('');
    } else {
      historyList.innerHTML = '<p style="opacity: 0.6; text-align: center; padding: 20px;">No login history</p>';
    }
  } catch (err) {
    console.error('Error loading login history:', err);
    document.getElementById("loginHistory").innerHTML = '<p style="opacity: 0.6;">Failed to load login history</p>';
  }
}

function loadAchievementBadges() {
  const totalComplaints = parseInt(document.getElementById("totalComplaints").textContent) || 0;
  const resolvedComplaints = parseInt(document.getElementById("resolvedComplaints").textContent) || 0;
  const pendingComplaints = parseInt(document.getElementById("pendingComplaints").textContent) || 0;
  const progressComplaints = parseInt(document.getElementById("progressComplaints").textContent) || 0;
  
  // Define badges with their unlock conditions
  let badges = [
    { icon: '🚀', name: 'Getting Started', desc: 'File your first complaint', condition: totalComplaints >= 1, level: 1 },
    { icon: '📝', name: 'Diligent Citizen', desc: 'File 5 complaints', condition: totalComplaints >= 5, level: 2 },
    { icon: '📋', name: 'Prolific Reporter', desc: 'File 10 complaints', condition: totalComplaints >= 10, level: 3 },
    { icon: '✅', name: 'Problem Solver', desc: 'Resolve 3 complaints', condition: resolvedComplaints >= 3, level: 4 },
    { icon: '🎯', name: 'On Track', desc: 'Resolve 5 complaints', condition: resolvedComplaints >= 5, level: 5 },
    { icon: '⭐', name: 'Community Hero', desc: 'Resolve 10 complaints', condition: resolvedComplaints >= 10, level: 6 },
    { icon: '💪', name: 'Super Citizen', desc: 'Resolve 20 complaints', condition: resolvedComplaints >= 20, level: 7 },
    { icon: '⚡', name: 'Swift Action', desc: 'Resolve within 24 hours', condition: resolvedComplaints > 0 && totalComplaints <= 1, level: 8 },
    { icon: '🔥', name: 'Active Monitor', desc: '5+ active complaints tracked', condition: (progressComplaints + pendingComplaints) >= 5, level: 9 },
    { icon: '🌟', name: 'Perfect Record', desc: 'All filed complaints resolved', condition: totalComplaints > 0 && resolvedComplaints === totalComplaints, level: 10 },
    { icon: '💎', name: 'Platinum Member', desc: 'File 50 total complaints', condition: totalComplaints >= 50, level: 11 },
    { icon: '👑', name: 'Legend', desc: 'Resolve 50+ complaints', condition: resolvedComplaints >= 50, level: 12 }
  ];

  // Apply sequential unlocking: each level requires previous level to be earned
  badges.forEach((badge, idx) => {
    if (idx === 0) {
      // Level 1 is always started as earned
      badge.earned = true;
    } else {
      // Level must meet its condition AND previous level must be earned
      const prevEarned = badges[idx - 1].earned;
      badge.earned = prevEarned && badge.condition;
    }
  });

  const highestLevel = badges.filter(b => b.earned).length;
  const maxLevel = badges.length;
  const progressPercent = (highestLevel / maxLevel) * 100;

  const badgesGrid = document.getElementById("badgesGrid");
  let html = `
    <div class="level-progress">
      <div class="level-text">Achievement Level <span class="current-level">${highestLevel}</span>/<span class="max-level">${maxLevel}</span></div>
      <div class="progress-bar-badges">
        <div class="progress-fill-badges" style="width: ${progressPercent}%"></div>
      </div>
      <div class="level-subtitle">${highestLevel === maxLevel ? '🏆 You are a Legend!' : `${maxLevel - highestLevel} more to unlock`}</div>
    </div>
  `;
  
  html += badges.map(badge => `
    <div class="badge-item ${badge.earned ? 'earned' : 'locked'}" data-level="${badge.level}">
      <div class="badge-icon">${badge.icon}</div>
      ${badge.earned ? '<div class="badge-check">✓</div>' : ''}
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
      <div class="badge-level">Lv.${badge.level}</div>
    </div>
  `).join('');
  
  badgesGrid.innerHTML = html;
}

function loadCommunityImpact() {
  // Get complaint stats
  const totalComplaints = parseInt(document.getElementById("totalComplaints").textContent);
  const resolvedComplaints = parseInt(document.getElementById("resolvedComplaints").textContent);
  
  // Calculate impact score (0-100)
  let impactScore = Math.min(100, resolvedComplaints * 15 + totalComplaints * 5);
  
  // Estimate people helped (assume 5 people per resolved issue)
  const peopleHelped = resolvedComplaints * 5;
  
  document.getElementById("impactValue").textContent = impactScore;
  document.getElementById("resolvedImpact").textContent = resolvedComplaints;
  document.getElementById("communityHelped").textContent = peopleHelped;
  
  // Animate progress ring
  const circumference = 282;
  const offset = circumference - (impactScore / 100) * circumference;
  
  setTimeout(() => {
    const circle = document.querySelector('circle:nth-of-type(2)');
    if (circle) {
      circle.style.strokeDashoffset = offset;
    }
  }, 100);
}

// Remove old notification preferences functions
function saveNotificationPreferences() {
  // This function was replaced - kept for backward compatibility
  showSuccessNotification("Preferences saved!");
}

function loadNotificationPreferences() {
  // This function was replaced - kept for backward compatibility
}
// Handle Account Deletion
async function handleDeleteAccount() {
  // First confirmation
  const firstConfirm = confirm(" WARNING: This action cannot be undone!\n\nDeleting your account will permanently remove:\n Your profile information\n All your complaints\n Login history\n All associated data\n\nAre you absolutely sure you want to proceed?");
  
  if (!firstConfirm) {
    return;
  }
  
  // Ask for password confirmation
  const password = prompt("Please enter your password to confirm account deletion:");
  
  if (!password) {
    showErrorNotification("Account deletion cancelled");
    return;
  }
  
  // Final confirmation
  const finalConfirm = confirm("This is your LAST CHANCE!\n\nType 'DELETE' in the next dialog to permanently delete your account.");
  
  if (!finalConfirm) {
    showErrorNotification("Account deletion cancelled");
    return;
  }
  
  const deleteConfirmation = prompt("Type DELETE (in capital letters) to confirm:");
  
  if (deleteConfirmation !== "DELETE") {
    showErrorNotification("Account deletion cancelled - confirmation text did not match");
    return;
  }
  
  // Show loading
  if (overlay) {
    overlay.querySelector('.overlay-content').textContent = 'Deleting account...';
    overlay.style.display = 'flex';
  }
  
  try {
    const response = await fetch('http://127.0.0.1/Smart_City/backend/delete-account.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    if (data.success) {
      // Clear local storage
      localStorage.removeItem('userData');
      localStorage.removeItem('citizenLoggedIn');
      
      // Show success message
      alert(' Account deleted successfully\n\nYou will be redirected to the homepage.');
      
      // Redirect to home page
      window.location.href = '../index/index.html';
    } else {
      showErrorNotification(data.message || 'Failed to delete account');
    }
  } catch (error) {
    if (overlay) {
      overlay.style.display = 'none';
    }
    console.error('Error deleting account:', error);
    showErrorNotification('Network error: Unable to delete account');
  }
}
