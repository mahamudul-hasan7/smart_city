const form = document.getElementById("adminForm");
const adminId = document.getElementById("adminId");
const adminPass = document.getElementById("adminPass");

/* DEMO ADMIN CREDENTIALS */
const VALID_ADMIN_ID = "admin";
const VALID_ADMIN_PASSWORD = "admin123";

form.addEventListener("submit", function (e) {
  e.preventDefault();
  clearErrors();

  let valid = true;

  if (adminId.value !== VALID_ADMIN_ID) {
    showError(adminId, "Invalid Admin ID");
    valid = false;
  }

  if (adminPass.value !== VALID_ADMIN_PASSWORD) {
    showError(adminPass, "Incorrect password");
    valid = false;
  }

  if (valid) {
    // redirect to admin panel
    window.location.href = "../admin panel/admin-dashboard.html";
  }
});

function showError(input, message) {
  input.parentElement.querySelector("small").textContent = message;
}

function clearErrors() {
  document.querySelectorAll("small").forEach(e => e.textContent = "");
}
