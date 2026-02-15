const form = document.getElementById("signupForm");

const nameF = document.getElementById("name");
const nid   = document.getElementById("nid");
const dob   = document.getElementById("dob");
const email = document.getElementById("email");
const pass  = document.getElementById("password");
const conf  = document.getElementById("confirm");

// Use relative URL or absolute path based on XAMPP location
const API_URL = "http://127.0.0.1/Smart_City/backend/register.php";

form.addEventListener("submit", e => {
  e.preventDefault();
  clear();

  let ok = true;

  if(nameF.value.trim().length < 3){
    error(nameF,"Enter full name");
    ok = false;
  }

  if(nid.value.length < 6){
    error(nid,"Invalid ID");
    ok = false;
  }

  if(dob.value === ""){
    error(dob,"Date of birth required");
    ok = false;
  }

  if(!email.value.includes("@")){
    error(email,"Valid email required");
    ok = false;
  }

  if(pass.value.length < 6){
    error(pass,"Minimum 6 characters");
    ok = false;
  }

  if(pass.value !== conf.value){
    error(conf,"Passwords do not match");
    ok = false;
  }

  if(ok){
    registerCitizen();
  }
});

async function registerCitizen(){
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        name: nameF.value.trim(),
        nid: nid.value.trim(),
        dob: dob.value,
        email: email.value.trim(),
        password: pass.value,
        confirm: conf.value
      })
    });

    const data = await response.json();

    if(data.success){
      // Auto-login after signup - store user data
      const userData = {
        id: data.user_id,
        name: nameF.value.trim(),
        email: email.value.trim()
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('citizenLoggedIn', 'true');
      
      form.reset();
      
      // Show professional success animation
      showSuccessAnimation();
      
      // Redirect to dashboard after 2.5 seconds
      setTimeout(() => {
        window.location.href = "../citizen portal/citizen-portal.html";
      }, 2500);
    } else {
      if(data.errors){
        // Show field-specific errors
        for(let field in data.errors){
          const input = document.getElementById(field);
          if(input){
            error(input, data.errors[field]);
          }
        }
      } else {
        showErrorNotification(data.message || "Registration failed");
      }
    }
  } catch(err) {
    showErrorNotification("Network error: " + err.message);
  }
}

function error(input,msg){
  input.parentElement.querySelector("small").textContent = msg;
}

function clear(){
  document.querySelectorAll("small").forEach(s=>s.textContent="");
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

// Professional Success Animation
function showSuccessAnimation() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.add('active');
  }
  launchConfetti();
}

// Confetti Animation with Realistic Physics & Trails
function launchConfetti() {
  const canvas = document.getElementById('confetti');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 100;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Create particles with advanced physics
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const velocity = Math.random() * 14 + 5;
    
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 3,
      size: Math.random() * 7 + 2,
      color: ['#00d4ff', '#00ff88', '#fbbf24', '#ff6b6b', '#a78bfa', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 7)],
      rotation: Math.random() * Math.PI * 2,
      rotationVel: (Math.random() - 0.5) * 0.7,
      life: 1,
      mass: Math.random() * 0.6 + 0.4,
      shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)],
      trail: []
    });
  }
  
  // Physics simulation
  const gravity = 0.35;
  const airResistance = 0.985;
  const bounce = 0.65;
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let activeParticles = 0;
    
    particles.forEach((p, idx) => {
      if (p.life > 0) {
        activeParticles++;
        
        // Store trail for particles
        if (Math.random() < 0.3 && p.trail.length < 8) {
          p.trail.push({
            x: p.x,
            y: p.y,
            life: 0.6
          });
        }
        
        // Apply physics
        p.vy += gravity * p.mass;
        p.vx *= airResistance;
        p.vy *= airResistance;
        
        // Wind effect
        p.vx += (Math.sin(Date.now() * 0.001 + idx) * 0.05) * p.mass;
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Bounce off floor
        if (p.y + p.size > canvas.height) {
          p.y = canvas.height - p.size;
          p.vy *= -bounce;
          p.life *= 0.93;
        }
        
        // Bounce off sides
        if (p.x - p.size < 0) {
          p.x = p.size;
          p.vx *= -bounce;
        }
        if (p.x + p.size > canvas.width) {
          p.x = canvas.width - p.size;
          p.vx *= -bounce;
        }
        
        p.rotation += p.rotationVel;
        p.life -= 0.007;
        
        // Draw trail
        p.trail.forEach((t, ti) => {
          t.life -= 0.08;
          ctx.save();
          ctx.globalAlpha = t.life * 0.3;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        
        p.trail = p.trail.filter(t => t.life > 0);
        
        // Draw particle
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        if (p.shape === 'circle') {
          // Circle with glow
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          // Square with gradient
          const gradient = ctx.createLinearGradient(-p.size/2, -p.size/2, p.size/2, p.size/2);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(1, adjustColor(p.color, 50));
          ctx.fillStyle = gradient;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          // Triangle
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
      }
    });
    
    if (activeParticles > 0) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
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
