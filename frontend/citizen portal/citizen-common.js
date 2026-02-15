// Common functionality for all citizen portal pages
// This file handles header, sidebar, and logout functionality

document.addEventListener('DOMContentLoaded', () => {
  setupHeaderAndSidebar();
  setupLogout();
});

function setupHeaderAndSidebar() {
  // Setup menu button
  const menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const layout = document.querySelector('.layout');
      if (layout) {
        layout.classList.toggle('collapsed');
      }
    });
  }

  // Set active sidebar link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'citizen-portal.html';
  const sidebarLinks = document.querySelectorAll('.sidebar a');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href.includes(currentPage)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Set page title in header based on current page
  setPageTitle(currentPage);
}

function setPageTitle(currentPage) {
  const pageTitle = document.querySelector('.page-title');
  if (!pageTitle) return;

  const titles = {
    'citizen-portal.html': 'Dashboard',
    'citizen-complaint.html': 'New Complaint',
    'my-complaints.html': 'My Complaints',
    'track-status.html': 'Track Status',
    'profile.html': 'Profile'
  };

  pageTitle.textContent = titles[currentPage] || 'Smart City';
}

function setupLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear all session/local storage
      localStorage.removeItem('citizenLoggedIn');
      localStorage.removeItem('userData');
      localStorage.removeItem('userAvatar');
      
      // Redirect to login page
      window.location.href = 'citizen-login.html';
    });
  }
}
