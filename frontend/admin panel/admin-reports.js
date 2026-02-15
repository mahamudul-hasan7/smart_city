// Get API URL helper
function getApiUrl(endpoint) {
  // Always use absolute http:// URL for proper CORS handling
  return `http://localhost/Smart_City/backend/${endpoint}`;
}

let allComplaints = [];
let dateRangeFilter = { start: null, end: null };

// Load all complaints from database
async function loadAllComplaints() {
  try {
    const response = await fetch(getApiUrl('get-complaints-for-reports.php'));
    const result = await response.json();
    
    if (result.success) {
      allComplaints = result.complaints;
      console.log('Complaints loaded:', allComplaints.length);
      loadOverviewData();
      renderReports();
      updateStats();
    } else {
      console.error('Error:', result.message);
      showNotification('Failed to load complaints: ' + result.message, 'error');
    }
  } catch (error) {
    console.error("Error loading complaints:", error);
    showNotification('Failed to load complaints', 'error');
  }
}

// Load Overview Data with Insights
async function loadOverviewData() {
  try {
    const response = await fetch(getApiUrl('get-overview-insights.php'));
    const result = await response.json();
    
    if (result.success) {
      const metrics = result.metrics;
      
      // Update quick stats (new layout)
      if (document.getElementById('quickTotal')) {
        document.getElementById('quickTotal').textContent = metrics.total;
        document.getElementById('quickResolved').textContent = metrics.resolved;
        document.getElementById('quickPending').textContent = metrics.pending;
        document.getElementById('quickRate').textContent = metrics.resolution_rate + '%';
      }
      
      // Update legacy overview section (if exists)
      if (document.getElementById('overviewTotal')) {
        document.getElementById('overviewTotal').textContent = metrics.total;
        document.getElementById('overviewResolved').textContent = metrics.resolved;
        document.getElementById('overviewPending').textContent = metrics.pending;
        document.getElementById('overviewRate').textContent = metrics.resolution_rate + '%';
      }
      
      // Load Chart.js if not already loaded
      if (!window.Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
          renderStatusChart(result.status_breakdown);
          renderTopAreas(result.top_problem_areas);
          renderTopCategories(result.top_categories);
          renderComplaintAging(allComplaints);
          renderDepartmentPerformance(allComplaints);
          renderStaffPerformance(allComplaints);
          renderCategoryChart(allComplaints);
          renderResponseTimeChart(allComplaints);
          renderPriorityDistributionChart(allComplaints);
          renderOverdueAlerts(allComplaints);
          renderKeyInsights(metrics, result.top_problem_areas);
        };
        document.head.appendChild(script);
      } else {
        renderStatusChart(result.status_breakdown);
        renderTopAreas(result.top_problem_areas);
        renderTopCategories(result.top_categories);
        renderComplaintAging(allComplaints);
        renderDepartmentPerformance(allComplaints);
        renderStaffPerformance(allComplaints);
        renderCategoryChart(allComplaints);
        renderResponseTimeChart(allComplaints);
        renderPriorityDistributionChart(allComplaints);
        renderOverdueAlerts(allComplaints);
        renderKeyInsights(metrics, result.top_problem_areas);
      }
    }
  } catch (error) {
    console.error("Error loading overview insights:", error);
  }
}

// Render Status Chart
function renderStatusChart(statusData) {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  if (window.statusChartInstance) {
    window.statusChartInstance.destroy();
  }
  
  const colors = {
    'Pending': '#ffaa00',
    'In Progress': '#8b5cf6',
    'Resolved': '#00ff88',
    'On Hold': '#ec4899',
    'Rejected': '#ff4444',
    'Cancelled': '#ff6600'
  };
  
  window.statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statusData.map(s => s.status),
      datasets: [{
        data: statusData.map(s => s.count),
        backgroundColor: statusData.map(s => colors[s.status] || '#00d4ff'),
        borderColor: '#1a2332',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#aaa',
            padding: 15,
            font: { size: 12 }
          }
        }
      }
    }
  });
}

// Render Top Problem Areas
function renderTopAreas(topAreas) {
  const container = document.getElementById('topAreasContent');
  if (!container) return;
  
  // Show only top 3 areas
  const top3Areas = topAreas.slice(0, 3);
  
  container.innerHTML = top3Areas.map(area => `
    <div class="problem-area">
      <div class="problem-area-name">
        <strong>${area.zone}</strong>
        <small>${area.complaints} total complaints</small>
      </div>
      <div class="problem-area-stats">
        <div class="problem-area-stat">
          <label>Resolved</label>
          <strong class="ok">${area.resolved}</strong>
        </div>
        <div class="problem-area-stat">
          <label>Pending</label>
          <strong class="warn">${area.pending}</strong>
        </div>
        <div class="problem-area-stat">
          <label>Rate</label>
          <strong>${area.resolution_rate}%</strong>
        </div>
      </div>
    </div>
  `).join('');
}

// Render Top Categories
function renderTopCategories(topCategories) {
  const container = document.getElementById('topCategoriesContent');
  if (!container) return;
  
  const maxCount = Math.max(...topCategories.map(c => c.count), 1);
  
  container.innerHTML = topCategories.map((cat, idx) => {
    const percentage = (cat.count / maxCount) * 100;
    return `
      <div class="category-item">
        <div class="category-name">${cat.category}</div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="category-count">&nbsp;${cat.count}</div>
      </div>
    `;
  }).join('');
}

// Render Key Insights
function renderKeyInsights(metrics, topAreas) {
  const container = document.getElementById('keyInsights');
  if (!container) return;
  
  const topProblem = topAreas[0];
  
  // Calculate critical overdue complaints (30+ days old and not resolved)
  const today = new Date();
  const criticalOverdue = allComplaints.filter(c => {
    if (!c.submitted_date || c.current_status === 'Resolved') return false;
    const submitted = new Date(c.submitted_date);
    const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
    return ageInDays >= 30;
  }).length;
  
  const insights = [
    {
      label: 'Resolution Rate',
      value: `${metrics.resolution_rate}%`,
      desc: `${metrics.resolved} out of ${metrics.total} complaints resolved`
    },
    {
      label: 'Critical Overdue',
      value: criticalOverdue,
      desc: `Complaints pending for 30+ days (require immediate attention)`,
      color: criticalOverdue === 0 ? '#00ff88' : criticalOverdue <= 2 ? '#ffaa00' : '#ff4444'
    },
    {
      label: 'Highest Problem Area',
      value: topProblem.zone,
      desc: `${topProblem.complaints} complaints with ${topProblem.resolution_rate}% resolution rate`
    },
    {
      label: 'Pending Action',
      value: metrics.pending,
      desc: 'Complaints awaiting attention',
      color: metrics.pending > 10 ? '#ff4444' : '#ffaa00'
    }
  ];
  
  container.innerHTML = insights.map(insight => `
    <div class="insight-item" ${insight.color ? `style="border-left-color: ${insight.color};"` : ''}>
      <strong>${insight.label}:</strong> ${insight.value}
      <p>${insight.desc}</p>
    </div>
  `).join('');
}

// Render Complaint Aging - Groups complaints by age
function renderComplaintAging(complaints) {
  const container = document.getElementById('complaintAgingContent');
  if (!container) return;
  
  const today = new Date();
  let aging = {
    veryFresh: 0,     // 0-3 days
    fresh: 0,         // 4-7 days
    active: 0,        // 8-14 days
    processing: 0,    // 15-21 days
    extended: 0,      // 22-30 days
    aging: 0,         // 31-45 days
    overdue: 0,       // 46-60 days
    critical: 0       // 60+ days
  };
  
  complaints.forEach(complaint => {
    if (!complaint.submitted_date) return;
    
    const submitted = new Date(complaint.submitted_date);
    const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
    
    if (ageInDays <= 3) aging.veryFresh++;
    else if (ageInDays <= 7) aging.fresh++;
    else if (ageInDays <= 14) aging.active++;
    else if (ageInDays <= 21) aging.processing++;
    else if (ageInDays <= 30) aging.extended++;
    else if (ageInDays <= 45) aging.aging++;
    else if (ageInDays <= 60) aging.overdue++;
    else aging.critical++;
  });
  
  const total = complaints.length || 1;
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
      <div style="padding: 0.6rem; background: rgba(0, 255, 136, 0.15); border-left: 3px solid #00ff88; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">0-3 days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #00ff88;">${aging.veryFresh}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.veryFresh/total)*100).toFixed(1)}%</div>
      </div>
      <div style="padding: 0.6rem; background: rgba(0, 255, 170, 0.1); border-left: 3px solid #00ffaa; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">4-7 days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #00ffaa;">${aging.fresh}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.fresh/total)*100).toFixed(1)}%</div>
      </div>
      <div style="padding: 0.6rem; background: rgba(0, 212, 255, 0.1); border-left: 3px solid #00d4ff; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">8-14 days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #00d4ff;">${aging.active}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.active/total)*100).toFixed(1)}%</div>
      </div>
      <div style="padding: 0.6rem; background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">15-21 days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #8b5cf6;">${aging.processing}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.processing/total)*100).toFixed(1)}%</div>
      </div>
      <div style="padding: 0.6rem; background: rgba(236, 72, 153, 0.1); border-left: 3px solid #ec4899; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">22-30 days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #ec4899;">${aging.extended}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.extended/total)*100).toFixed(1)}%</div>
      </div>
      <div style="padding: 0.6rem; background: rgba(255, 170, 0, 0.1); border-left: 3px solid #ffaa00; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">31-45 days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #ffaa00;">${aging.aging}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.aging/total)*100).toFixed(1)}%</div>
      </div>
      <div style="padding: 0.6rem; background: rgba(255, 102, 0, 0.1); border-left: 3px solid #ff6600; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">46-60 days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #ff6600;">${aging.overdue}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.overdue/total)*100).toFixed(1)}%</div>
      </div>
      <div style="padding: 0.6rem; background: rgba(255, 68, 68, 0.1); border-left: 3px solid #ff4444; border-radius: 4px;">
        <div style="font-size: 0.75rem; opacity: 0.7;">60+ days</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: #ff4444;">${aging.critical}</div>
        <div style="font-size: 0.7rem; opacity: 0.6;">${((aging.critical/total)*100).toFixed(1)}%</div>
      </div>
    </div>
  `;
}

// Render Department Performance - Top performing departments
function renderDepartmentPerformance(complaints) {
  const container = document.getElementById('deptPerformanceContent');
  if (!container) return;
  
  const deptStats = {};
  
  complaints.forEach(complaint => {
    const dept = complaint.dept_name || complaint.department || 'Unassigned';
    if (!deptStats[dept]) {
      deptStats[dept] = { total: 0, resolved: 0 };
    }
    deptStats[dept].total++;
    const status = (complaint.current_status || complaint.status || '').toLowerCase();
    if (status === 'resolved') {
      deptStats[dept].resolved++;
    }
  });
  
  const performance = Object.entries(deptStats)
    .map(([dept, stats]) => ({
      name: dept,
      total: stats.total,
      resolved: stats.resolved,
      rate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);
  
  const maxRate = Math.max(...performance.map(p => p.rate), 1);
  
  container.innerHTML = performance.map(dept => `
    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <strong style="color: #00d4ff;">${dept.name}</strong>
        <span style="font-weight: bold; color: ${dept.rate >= 80 ? '#00ff88' : dept.rate >= 50 ? '#ffaa00' : '#ff4444'};">${dept.rate}%</span>
      </div>
      <div style="background: rgba(0, 212, 255, 0.1); height: 6px; border-radius: 3px; overflow: hidden;">
        <div style="height: 100%; background: linear-gradient(90deg, #00d4ff, #00ff88); width: ${(dept.rate/maxRate)*100}%; border-radius: 3px;"></div>
      </div>
      <div style="font-size: 0.75rem; color: #aaa; margin-top: 0.25rem;">${dept.resolved}/${dept.total} resolved</div>
    </div>
  `).join('');
}

// Render Overdue Alerts - Complaints exceeding SLA
function renderOverdueAlerts(complaints) {
  const container = document.getElementById('overdueAlertContent');
  if (!container) return;
  
  const today = new Date();
  const overdue = complaints.filter(complaint => {
    if (!complaint.submitted_date || complaint.current_status === 'Resolved') return false;
    const submitted = new Date(complaint.submitted_date);
    const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
    return ageInDays > 30; // SLA threshold: 30 days
  });
  
  const critical = overdue.filter(c => {
    const submitted = new Date(c.submitted_date);
    const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
    return ageInDays > 60;
  });
  
  if (overdue.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem;">
        <i class="fas fa-check-circle" style="font-size: 2rem; color: #00ff88; margin-bottom: 0.5rem;"></i>
        <div style="color: #00ff88; font-weight: bold;">No Overdue Complaints</div>
        <div style="font-size: 0.85rem; color: #aaa; margin-top: 0.5rem;">All complaints are within SLA</div>
      </div>
    `;
    return;
  }
  
  const deptCritical = {};
  critical.forEach(c => {
    const dept = c.dept_name || 'Unassigned';
    deptCritical[dept] = (deptCritical[dept] || 0) + 1;
  });
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
      <div style="padding: 1rem; background: rgba(255, 170, 0, 0.1); border-left: 3px solid #ffaa00; border-radius: 4px;">
        <div style="font-size: 0.85rem; opacity: 0.7;">SLA Breached (30+ days)</div>
        <div style="font-size: 1.8rem; font-weight: bold; color: #ffaa00;">${overdue.length}</div>
      </div>
      <div style="padding: 1rem; background: rgba(255, 68, 68, 0.1); border-left: 3px solid #ff4444; border-radius: 4px;">
        <div style="font-size: 0.85rem; opacity: 0.7;">Critical (60+ days)</div>
        <div style="font-size: 1.8rem; font-weight: bold; color: #ff4444;">${critical.length}</div>
      </div>
    </div>
    <div style="border-top: 1px solid rgba(0, 212, 255, 0.1); padding-top: 1rem;">
      <div style="font-size: 0.9rem; font-weight: 600; color: #ffaa00; margin-bottom: 0.5rem;">Critical Department Alert:</div>
      ${Object.entries(deptCritical).map(([dept, count]) => `
        <div style="padding: 0.5rem; background: rgba(255, 68, 68, 0.05); margin-bottom: 0.5rem; border-radius: 4px;">
          <div style="font-size: 0.85rem;">${dept}: <strong style="color: #ff4444;">${count}</strong> critical overdue</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Filter and render reports based on selections
function generateReport() {
  renderReports();
  updateStats();
  showNotification('Report generated successfully', 'success');
}

// Current filter values
function getFilters() {
  const deptFilter = document.getElementById('deptFilter');
  const statusFilter = document.getElementById('statusFilter');
  const dateFilter = document.getElementById('dateFilter');
  
  return {
    dept: deptFilter ? deptFilter.value : '',
    status: statusFilter ? statusFilter.value : '',
    date: dateFilter ? dateFilter.value : ''
  };
}

// Render filtered complaints
function renderReports() {
  const tbody = document.getElementById('reportTable');
  
  // Skip if table doesn't exist (only in old layout)
  if (!tbody) {
    // Old table structure removed, this function is deprecated
    return;
  }
  
  const { dept, status, date } = getFilters();
  
  let filtered = allComplaints;
  
  if (dept) filtered = filtered.filter(c => c.dept_id == dept);
  if (status) filtered = filtered.filter(c => c.current_status === status);
  if (date) filtered = filtered.filter(c => c.submitted_date && c.submitted_date.startsWith(date));
  
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; opacity: 0.7; padding: 20px;">No complaints found</td></tr>';
    return;
  }
  
  filtered.forEach(complaint => {
    const statusClass = complaint.current_status === 'Pending' ? 'warn' : 
                       complaint.current_status === 'In Progress' ? 'info' :
                       complaint.current_status === 'Resolved' ? 'ok' :
                       complaint.current_status === 'On Hold' ? 'hold' : 'reject';
    
    const priorityClass = complaint.type === 'Road' ? 'high' :
                          complaint.type === 'Water' ? 'medium' : 'low';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>SC-${complaint.complaint_id}</strong></td>
      <td>${complaint.dept_name || 'Unassigned'}</td>
      <td>${complaint.type || 'Other'}</td>
      <td>${complaint.area || 'N/A'}</td>
      <td><span class="status-badge ${statusClass}">${complaint.current_status}</span></td>
      <td>${complaint.submitted_date ? new Date(complaint.submitted_date).toLocaleDateString() : 'N/A'}</td>
      <td><span class="priority-badge ${priorityClass}">${complaint.type || 'Other'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Complaints Table Data
function renderComplaintsTableData() {
  const deptFilter = document.getElementById('complaintsDeptFilter')?.value || '';
  const statusFilter = document.getElementById('complaintsStatusFilter')?.value || '';
  const dateFilter = document.getElementById('complaintsDateFilter')?.value || '';
  
  let filtered = allComplaints;
  if (deptFilter) filtered = filtered.filter(c => c.dept_id == deptFilter);
  if (statusFilter) filtered = filtered.filter(c => (c.current_status || c.status) === statusFilter);
  if (dateFilter) filtered = filtered.filter(c => c.submitted_date && c.submitted_date.startsWith(dateFilter));
  
  const tbody = document.getElementById('complaintsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  filtered.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>SC-${c.complaint_id}</td>
      <td>${c.type || 'Other'}</td>
      <td>${c.area || 'N/A'}</td>
      <td><span style="background: ${getStatusColor(c.current_status || c.status)}; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">${c.current_status || c.status || 'Pending'}</span></td>
      <td>${c.submitted_date || 'N/A'}</td>
      <td>${c.dept_name || 'Unassigned'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function getStatusColor(status) {
  const colors = {
    'Resolved': 'rgba(76, 175, 80, 0.3)',
    'Pending': 'rgba(255, 170, 0, 0.3)',
    'In Progress': 'rgba(0, 212, 255, 0.3)',
    'On Hold': 'rgba(255, 0, 255, 0.3)',
    'Rejected': 'rgba(255, 68, 68, 0.3)'
  };
  return colors[status] || 'rgba(0, 212, 255, 0.2)';
}

// Update statistics
function updateStats() {
  const { dept, status, date } = getFilters();
  
  let filtered = allComplaints;
  if (dept) filtered = filtered.filter(c => c.dept_id == dept);
  if (status) filtered = filtered.filter(c => c.current_status === status);
  if (date) filtered = filtered.filter(c => c.submitted_date && c.submitted_date.startsWith(date));
  
  const total = filtered.length;
  const resolved = filtered.filter(c => c.current_status === 'Resolved').length;
  const pending = filtered.filter(c => c.current_status === 'Pending').length;
  
  // Safe update - check if elements exist
  if (document.getElementById('totalReports')) document.getElementById('totalReports').textContent = total;
  if (document.getElementById('resolvedReports')) document.getElementById('resolvedReports').textContent = resolved;
  if (document.getElementById('pendingReports')) document.getElementById('pendingReports').textContent = pending;
}

// Export CSV
function exportComplaintsCSV() {
  const { dept, status, date } = getFilters();
  let filtered = allComplaints;
  if (dept) filtered = filtered.filter(c => c.dept_id == dept);
  if (status) filtered = filtered.filter(c => c.current_status === status);
  if (date) filtered = filtered.filter(c => c.submitted_date && c.submitted_date.startsWith(date));

  const headers = ['Complaint ID','Department','Category','Zone','Status','Submitted Date','Priority'];
  const rows = filtered.map(c => [
    `SC-${c.complaint_id}`,
    c.dept_name || 'Unassigned',
    c.type || 'Other',
    c.area || 'N/A',
    c.current_status,
    c.submitted_date || '',
    c.type || 'Other'
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => '"' + String(v).replace('"','""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `complaints-report-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification('CSV exported successfully', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Load Department Report Data
async function loadDepartmentData() {
  try {
    const response = await fetch(getApiUrl('report-departments.php'));
    const result = await response.json();
    
    if (result.success) {
      const tbody = document.getElementById('departmentTable');
      tbody.innerHTML = '';
      
      if (result.departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; opacity: 0.7; padding: 20px;">No department data</td></tr>';
        return;
      }
      
      result.departments.forEach(dept => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${dept.name || 'Unassigned'}</strong></td>
          <td>${dept.total}</td>
          <td><span class="badge ok">${dept.resolved}</span></td>
          <td><span class="badge warn">${dept.pending}</span></td>
          <td><span class="badge info">${dept.in_progress}</span></td>
          <td><span class="badge reject">${dept.rejected}</span></td>
          <td>${dept.avg_days || 'N/A'} days</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Error loading department data:", error);
    showNotification('Failed to load department data', 'error');
  }
}

// Load Zone Report Data
async function loadZoneData() {
  try {
    const response = await fetch(getApiUrl('report-zones.php'));
    const result = await response.json();
    
    if (result.success) {
      const tbody = document.getElementById('zoneTable');
      tbody.innerHTML = '';
      
      if (result.zones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; opacity: 0.7; padding: 20px;">No zone data</td></tr>';
        return;
      }
      
      result.zones.forEach(zone => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${zone.name || 'Unassigned'}</strong></td>
          <td>${zone.total}</td>
          <td><span class="badge ok">${zone.resolved}</span></td>
          <td><span class="badge warn">${zone.pending}</span></td>
          <td><span class="badge info">${zone.in_progress}</span></td>
          <td><span class="badge reject">${zone.rejected}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Error loading zone data:", error);
    showNotification('Failed to load zone data', 'error');
  }
}

// Load Staff Report Data
async function loadStaffData() {
  try {
    const response = await fetch(getApiUrl('report-staff.php'));
    const result = await response.json();
    
    if (result.success) {
      const tbody = document.getElementById('staffTable');
      tbody.innerHTML = '';
      
      if (result.staff.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; opacity: 0.7; padding: 20px;">No staff data</td></tr>';
        return;
      }
      
      result.staff.forEach(staff => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${staff.name || 'N/A'}</strong></td>
          <td>${staff.designation || 'N/A'}</td>
          <td><span class="badge info">${staff.assigned}</span></td>
          <td><span class="badge ok">${staff.resolved}</span></td>
          <td><span class="badge">${staff.in_progress}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Error loading staff data:", error);
    showNotification('Failed to load staff data', 'error');
  }
}

// Load SLA Report Data
async function loadSLAData() {
  try {
    const response = await fetch(getApiUrl('report-sla.php'));
    const result = await response.json();
    
    if (result.success) {
      // Update SLA cards (if elements exist)
      if (result.overall) {
        const slaTotal = document.getElementById('slaTotal');
        const slaAvgDays = document.getElementById('slaAvgDays');
        const slaMaxDays = document.getElementById('slaMaxDays');
        const slaBreached = document.getElementById('slaBreached');
        
        if (slaTotal) slaTotal.textContent = result.overall.total_complaints || 0;
        if (slaAvgDays) slaAvgDays.textContent = Math.round(result.overall.avg_response_days) || 0;
        if (slaMaxDays) slaMaxDays.textContent = result.overall.max_days_pending || 0;
        if (slaBreached) slaBreached.textContent = result.overall.sla_breached || 0;
      }
      
      // Populate SLA table
      const tbody = document.getElementById('slaTableBody');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      if (result.by_department.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; opacity: 0.7; padding: 20px;">No SLA data</td></tr>';
        return;
      }
      
      result.by_department.forEach(dept => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${dept.department || 'Unassigned'}</strong></td>
          <td>${Math.round(dept.avg_time_days)} days</td>
          <td><span class="badge ok">${dept.resolved}</span></td>
          <td><span class="badge reject">${dept.overdue}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Error loading SLA data:", error);
    showNotification('Failed to load SLA data', 'error');
  }
}

// Load Rejected/Cancelled Report Data
async function loadRejectedData() {
  try {
    const response = await fetch(getApiUrl('report-rejected.php'));
    const result = await response.json();
    
    if (result.success) {
      const tbody = document.getElementById('rejectedTable');
      tbody.innerHTML = '';
      
      if (result.rejected_cancelled.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; opacity: 0.7; padding: 20px;">No rejected or cancelled complaints</td></tr>';
        return;
      }
      
      result.rejected_cancelled.forEach(complaint => {
        const statusClass = complaint.status === 'Rejected' ? 'reject' : 'hold';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${complaint.id}</strong></td>
          <td>${complaint.citizen || 'Anonymous'}</td>
          <td>${complaint.category || 'Other'}</td>
          <td>${complaint.zone || 'N/A'}</td>
          <td><span class="badge ${statusClass}">${complaint.status}</span></td>
          <td>${complaint.date ? new Date(complaint.date).toLocaleDateString() : 'N/A'}</td>
          <td><small>${complaint.reason || 'No reason provided'}</small></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Error loading rejected data:", error);
    showNotification('Failed to load rejected data', 'error');
  }
}

// Menu toggle
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

if (menuBtn && sidebar) {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("hide");
  });
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

// Get Filtered Complaints based on Date Range
function getFilteredComplaints() {
  let filtered = allComplaints;
  
  if (dateRangeFilter.start) {
    const startDate = new Date(dateRangeFilter.start);
    filtered = filtered.filter(c => new Date(c.submitted_date) >= startDate);
  }
  
  if (dateRangeFilter.end) {
    const endDate = new Date(dateRangeFilter.end);
    endDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(c => new Date(c.submitted_date) <= endDate);
  }
  
  return filtered;
}

// Apply Date Range Filter
function applyDateRangeFilter() {
  const startEl = document.getElementById('dateRangeStart');
  const endEl = document.getElementById('dateRangeEnd');
  
  if (!startEl.value || !endEl.value) {
    showNotification('Please select both start and end dates', 'warn');
    return;
  }
  
  if (new Date(startEl.value) > new Date(endEl.value)) {
    showNotification('Start date must be before end date', 'warn');
    return;
  }
  
  dateRangeFilter.start = startEl.value;
  dateRangeFilter.end = endEl.value;
  
  // Re-render all overview sections with filtered data
  const filtered = getFilteredComplaints();
  renderComplaintAging(filtered);
  renderDepartmentPerformance(filtered);
  renderStaffPerformance(filtered);
  renderCategoryChart(filtered);
  renderOverdueAlerts(filtered);
  
  showNotification(`Filtered ${filtered.length} complaints from ${startEl.value} to ${endEl.value}`, 'success');
}

// Reset Date Range Filter
function resetDateRangeFilter() {
  document.getElementById('dateRangeStart').value = '';
  document.getElementById('dateRangeEnd').value = '';
  dateRangeFilter = { start: null, end: null };
  
  // Re-render with all data
  renderComplaintAging(allComplaints);
  renderDepartmentPerformance(allComplaints);
  renderStaffPerformance(allComplaints);
  renderCategoryChart(allComplaints);
  renderOverdueAlerts(allComplaints);
  
  showNotification('Date filter reset', 'success');
}

// Render Staff Performance Ranking
function renderStaffPerformance(complaints) {
  const container = document.getElementById('staffPerformanceContent');
  if (!container) return;
  
  // Fetch staff performance data from database
  fetch(getApiUrl('report-staff.php'))
    .then(response => response.json())
    .then(data => {
      if (!data.success || !data.staff || data.staff.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #aaa;">No staff data available</div>';
        return;
      }
      
      // Calculate performance metrics for each staff
      const staffPerformance = data.staff
        .filter(staff => staff.assigned > 0)
        .map(staff => ({
          ...staff,
          resolution_rate: staff.assigned > 0 ? Math.round((staff.resolved / staff.assigned) * 100) : 0,
          pending: staff.assigned - staff.resolved - staff.in_progress,
          score: (staff.resolved * 2) - (staff.assigned - staff.resolved - staff.in_progress)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Show only top 3 staff
      
      if (staffPerformance.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #aaa;">No staff with assignments</div>';
        return;
      }
      
      const maxScore = Math.max(...staffPerformance.map(s => s.score), 1);
      
      container.innerHTML = staffPerformance.map((staff, idx) => `
        <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="background: linear-gradient(135deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; font-size: 1.2rem;">#${idx + 1}</span>
              <div>
                <strong style="color: #00d4ff;">${staff.name}</strong>
                <div style="font-size: 0.8rem; color: #aaa;">${staff.designation}</div>
              </div>
            </div>
            <span style="font-weight: bold; color: ${staff.resolution_rate >= 80 ? '#00ff88' : staff.resolution_rate >= 50 ? '#ffaa00' : '#ff4444'};">${staff.resolution_rate}%</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.5rem; font-size: 0.85rem;">
            <div>
              <div style="color: #aaa;">Assigned</div>
              <strong style="color: #00d4ff;">${staff.assigned}</strong>
            </div>
            <div>
              <div style="color: #aaa;">Resolved</div>
              <strong style="color: #00ff88;">${staff.resolved}</strong>
            </div>
            <div>
              <div style="color: #aaa;">In Progress</div>
              <strong style="color: #ffaa00;">${staff.in_progress}</strong>
            </div>
          </div>
          <div style="background: rgba(0, 212, 255, 0.1); height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; background: linear-gradient(90deg, #00d4ff, #00ff88); width: ${(staff.score/maxScore)*100}%; border-radius: 3px;"></div>
          </div>
        </div>
      `).join('');
    })
    .catch(error => {
      console.error('Error fetching staff performance:', error);
      container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #ff6b6b;">Failed to load staff data</div>';
    });
}

// Render Category Chart
function renderCategoryChart(complaints) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  if (window.categoryChartInstance) {
    window.categoryChartInstance.destroy();
  }
  
  const categoryStats = {};
  
  complaints.forEach(complaint => {
    const category = complaint.type || 'Other';
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });
  
  const categoryData = Object.entries(categoryStats)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  
  const colors = ['#00d4ff', '#00ff88', '#ffaa00', '#ff4444', '#ff00ff', '#00ffaa', '#ffff00', '#ff6600', '#8b5cf6', '#ec4899'];
  
  window.categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categoryData.map(c => c.category),
      datasets: [{
        data: categoryData.map(c => c.count),
        backgroundColor: categoryData.map((c, idx) => colors[idx % colors.length]),
        borderColor: '#1a2332',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#aaa',
            padding: 15,
            font: { size: 12 }
          }
        }
      }
    }
  });
}

// Render Response Time Analysis Chart
function renderResponseTimeChart(complaints) {
  const ctx = document.getElementById('responseTimeChart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  if (window.responseTimeChartInstance) {
    window.responseTimeChartInstance.destroy();
  }
  
  // Calculate response times by status
  const today = new Date();
  const statusTimes = {
    'Pending': [],
    'In Progress': [],
    'Resolved': [],
    'Rejected': []
  };
  
  complaints.forEach(complaint => {
    if (!complaint.submitted_date) return;
    
    const submitted = new Date(complaint.submitted_date);
    const status = complaint.current_status || complaint.status || 'Pending';
    
    let responseTime;
    if (status.toLowerCase() === 'resolved' && complaint.updated_date) {
      const updated = new Date(complaint.updated_date);
      responseTime = Math.floor((updated - submitted) / (1000 * 60 * 60 * 24));
    } else {
      responseTime = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
    }
    
    if (statusTimes[status]) {
      statusTimes[status].push(responseTime);
    }
  });
  
  // Calculate average response time for each status
  const avgTimes = {};
  Object.keys(statusTimes).forEach(status => {
    const times = statusTimes[status];
    if (times.length > 0) {
      avgTimes[status] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    } else {
      avgTimes[status] = 0;
    }
  });
  
  const statuses = Object.keys(avgTimes);
  const colors = {
    'Pending': '#ffaa00',
    'In Progress': '#00d4ff',
    'Resolved': '#00ff88',
    'Rejected': '#ff4444'
  };
  
  window.responseTimeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: statuses,
      datasets: [{
        label: 'Avg Response Time (Days)',
        data: statuses.map(s => avgTimes[s]),
        backgroundColor: statuses.map(s => colors[s] || '#00d4ff'),
        borderColor: statuses.map(s => colors[s] || '#00d4ff'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.parsed.y} days average`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            color: '#aaa',
            callback: function(value) {
              return value + ' days';
            }
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          title: {
            display: true,
            text: 'Average Days',
            color: '#aaa',
            font: { size: 11 }
          }
        },
        x: {
          ticks: { 
            color: '#aaa',
            font: { size: 11 }
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

// Render Priority Distribution Chart
function renderPriorityDistributionChart(complaints) {
  const ctx = document.getElementById('priorityDistributionChart');
  if (!ctx) return;
  
  // Destroy existing chart if any
  if (window.priorityDistributionChartInstance) {
    window.priorityDistributionChartInstance.destroy();
  }
  
  // Assign priorities based on complaint age and status
  const priorityData = {
    'High': { total: 0, resolved: 0, pending: 0 },
    'Medium': { total: 0, resolved: 0, pending: 0 },
    'Low': { total: 0, resolved: 0, pending: 0 }
  };
  
  const today = new Date();
  
  complaints.forEach(complaint => {
    const status = (complaint.current_status || complaint.status || '').toLowerCase();
    let priority = 'Medium';
    
    // Calculate priority based on age and status
    if (complaint.submitted_date) {
      const submitted = new Date(complaint.submitted_date);
      const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
      
      if (ageInDays > 30 && status !== 'resolved') {
        priority = 'High';
      } else if (ageInDays <= 7) {
        priority = 'Low';
      } else if (status === 'pending' && ageInDays > 15) {
        priority = 'High';
      }
    }
    
    priorityData[priority].total++;
    if (status === 'resolved') {
      priorityData[priority].resolved++;
    } else if (status === 'pending') {
      priorityData[priority].pending++;
    }
  });
  
  const priorities = ['High', 'Medium', 'Low'];
  
  window.priorityDistributionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: priorities,
      datasets: [
        {
          label: 'Total',
          data: priorities.map(p => priorityData[p].total),
          backgroundColor: '#ff4444',
          borderColor: '#ff4444',
          borderWidth: 1
        },
        {
          label: 'Resolved',
          data: priorities.map(p => priorityData[p].resolved),
          backgroundColor: '#00ff88',
          borderColor: '#00ff88',
          borderWidth: 1
        },
        {
          label: 'Pending',
          data: priorities.map(p => priorityData[p].pending),
          backgroundColor: '#8b5cf6',
          borderColor: '#8b5cf6',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#aaa',
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const priority = context.label;
              const total = priorityData[priority].total;
              const percentage = total > 0 ? Math.round((context.raw / total) * 100) : 0;
              if (context.dataset.label === 'Total') {
                return `${total} complaints`;
              }
              return `${percentage}% of ${total} total`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            color: '#aaa',
            stepSize: 1
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          title: {
            display: true,
            text: 'Number of Complaints',
            color: '#aaa',
            font: { size: 11 }
          }
        },
        x: {
          ticks: { 
            color: '#aaa',
            font: { size: 11 }
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

// ========== COMPLAINTS INSIGHTS ==========
function renderComplaintsInsights(complaints) {
  // Status Chart
  const statusStats = {};
  complaints.forEach(c => {
    const status = c.current_status || c.status || 'Pending';
    statusStats[status] = (statusStats[status] || 0) + 1;
  });
  
  const ctx = document.getElementById('complaintsStatusChart');
  if (ctx && window.Chart) {
    if (window.complaintsStatusChartInstance) {
      window.complaintsStatusChartInstance.destroy();
    }
    
    const statusColors = {
      'Resolved': '#4CAF50',
      'Pending': '#ffaa00',
      'In Progress': '#00d4ff',
      'On Hold': '#ff00ff',
      'Rejected': '#ff4444'
    };
    
    window.complaintsStatusChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(statusStats),
        datasets: [{
          label: 'Count',
          data: Object.values(statusStats),
          backgroundColor: Object.keys(statusStats).map(s => statusColors[s] || '#00d4ff'),
          borderColor: '#1a2332',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { labels: { color: '#aaa' } }
        },
        scales: {
          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' } },
          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' } }
        }
      }
    });
  }
  
  // Top Categories
  const categoryStats = {};
  complaints.forEach(c => {
    const cat = c.type || 'Other';
    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
  });
  
  if (Object.keys(categoryStats).length === 0) return; // No data, exit early
  
  const topCats = Object.entries(categoryStats)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const catContainer = document.getElementById('complaintsCategoriesContent');
  if (catContainer) {
    catContainer.innerHTML = topCats.map(c => `
      <div class="problem-area">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-weight: 600; margin-right: 15px;">${c.cat}</span>
          <span style="color: #00d4ff; white-space: nowrap;">${c.count}</span>
        </div>
        <div style="background: rgba(0,212,255,0.1); height: 5px; border-radius: 2px; overflow: hidden;">
          <div style="background: #00d4ff; height: 100%; width: ${(c.count / topCats[0].count) * 100}%;"></div>
        </div>
      </div>
    `).join('');
  }
  
  // Top Zones
  const zoneStats = {};
  complaints.forEach(c => {
    const zone = c.area || c.zone || 'Unknown';
    zoneStats[zone] = (zoneStats[zone] || 0) + 1;
  });
  
  const topZones = Object.entries(zoneStats)
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const zoneContainer = document.getElementById('complaintsZonesContent');
  if (zoneContainer) {
    zoneContainer.innerHTML = topZones.map(z => `
      <div class="problem-area">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-weight: 600; margin-right: 15px;">${z.zone}</span>
          <span style="color: #00ff88; white-space: nowrap;">${z.count}</span>
        </div>
        <div style="background: rgba(0,255,136,0.1); height: 5px; border-radius: 2px; overflow: hidden;">
          <div style="background: #00ff88; height: 100%; width: ${(z.count / topZones[0].count) * 100}%;"></div>
        </div>
      </div>
    `).join('');
  }
  
  // Category Chart
  const catCtx = document.getElementById('complaintsCategoryChart');
  if (catCtx && window.Chart) {
    if (window.complaintsCategoryChartInstance) {
      window.complaintsCategoryChartInstance.destroy();
    }
    
    const catData = Object.entries(categoryStats)
      .map(([c, count]) => ({ c, count }))
      .sort((a, b) => b.count - a.count);
    
    const colors = ['#00d4ff', '#00ff88', '#ffaa00', '#ff4444', '#ff00ff'];
    
    window.complaintsCategoryChartInstance = new Chart(catCtx, {
      type: 'pie',
      data: {
        labels: catData.map(c => c.c),
        datasets: [{
          data: catData.map(c => c.count),
          backgroundColor: catData.map((c, idx) => colors[idx % colors.length]),
          borderColor: '#1a2332',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#aaa', padding: 15, font: { size: 12 } }
          }
        }
      }
    });
  }
  
  // Populate complaints table
  renderComplaintsTableData();
}

// ========== DEPARTMENT INSIGHTS ==========
function renderDeptInsights(complaints) {
  // Group by department
  const deptStats = {};
  complaints.forEach(c => {
    const dept = c.dept_name || c.department;
    // Skip unassigned complaints
    if (!dept) return;
    
    if (!deptStats[dept]) {
      deptStats[dept] = { total: 0, resolved: 0, pending: 0, inProgress: 0, rejected: 0 };
    }
    deptStats[dept].total++;
    const status = c.current_status || c.status || 'Pending';
    if (status === 'Resolved') deptStats[dept].resolved++;
    else if (status === 'Pending') deptStats[dept].pending++;
    else if (status === 'In Progress') deptStats[dept].inProgress++;
    else if (status === 'Rejected') deptStats[dept].rejected++;
  });
  
  // Department Performance Chart
  const ctx = document.getElementById('deptPerformanceChart');
  if (ctx && window.Chart) {
    if (window.deptPerformanceChartInstance) {
      window.deptPerformanceChartInstance.destroy();
    }
    
    const depts = Object.keys(deptStats);
    const resolutionRates = depts.map(d => {
      const rate = deptStats[d].total > 0 ? (deptStats[d].resolved / deptStats[d].total * 100).toFixed(1) : 0;
      return rate;
    });
    
    window.deptPerformanceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: depts,
        datasets: [{
          label: 'Resolution Rate %',
          data: resolutionRates,
          backgroundColor: '#00d4ff',
          borderColor: '#1a2332',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { labels: { color: '#aaa' } }
        },
        scales: {
          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' }, max: 100 },
          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' } }
        }
      }
    });
  }
  
  // Resolution Time - Calculate real average time from complaint data
  const resContainer = document.getElementById('deptResolutionContent');
  if (resContainer) {
    const today = new Date();
    const deptTimes = Object.entries(deptStats).map(([dept, stats]) => {
      // Get all complaints for this department
      const deptComplaints = complaints.filter(c => 
        (c.dept_name || c.department) === dept && c.submitted_date
      );
      
      // Calculate average age of complaints
      let totalDays = 0;
      deptComplaints.forEach(c => {
        const submitted = new Date(c.submitted_date);
        const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
        totalDays += ageInDays;
      });
      
      const avgTime = deptComplaints.length > 0 
        ? Math.round(totalDays / deptComplaints.length) 
        : 0;
      
      return { dept, avgTime };
    }).sort((a, b) => a.avgTime - b.avgTime);
    
    resContainer.innerHTML = deptTimes.slice(0, 5).map(d => `
      <div class="problem-area">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="margin-right: 10px;">${d.dept}</span>
          <span style="color: #00ff88;">${d.avgTime} days</span>
        </div>
      </div>
    `).join('');
  }
  
  // Top Departments
  const topDepts = Object.entries(deptStats)
    .map(([dept, stats]) => ({
      dept,
      resolved: stats.resolved,
      total: stats.total,
      rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);
  
  const topDeptContainer = document.getElementById('topDeptContent');
  if (topDeptContainer) {
    topDeptContainer.innerHTML = topDepts.map((d, idx) => `
      <div class="problem-area">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
          <span style="background: #00d4ff; color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">${idx + 1}</span>
          <span style="font-weight: 600; flex: 1; margin-right: 10px;">${d.dept}</span>
          <span style="color: #00ff88; white-space: nowrap;">${d.rate}%</span>
        </div>
        <div style="background: rgba(0,255,136,0.1); height: 5px; border-radius: 2px; overflow: hidden;">
          <div style="background: #00ff88; height: 100%; width: ${d.rate}%;"></div>
        </div>
      </div>
    `).join('');
  }
  
  // Status Chart
  const statusCtx = document.getElementById('deptStatusChart');
  if (statusCtx && window.Chart) {
    if (window.deptStatusChartInstance) {
      window.deptStatusChartInstance.destroy();
    }
    
    const resolved = Object.values(deptStats).reduce((sum, s) => sum + s.resolved, 0);
    const pending = Object.values(deptStats).reduce((sum, s) => sum + s.pending, 0);
    const inProgress = Object.values(deptStats).reduce((sum, s) => sum + s.inProgress, 0);
    const rejected = Object.values(deptStats).reduce((sum, s) => sum + s.rejected, 0);
    
    window.deptStatusChartInstance = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Resolved', 'Pending', 'In Progress', 'Rejected'],
        datasets: [{
          data: [resolved, pending, inProgress, rejected],
          backgroundColor: ['#4CAF50', '#ffaa00', '#00d4ff', '#ff4444'],
          borderColor: '#1a2332',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#aaa', padding: 15, font: { size: 12 } }
          }
        }
      }
    });
  }
  
  // Populate department table
  const deptTableBody = document.getElementById('departmentTableBody');
  if (deptTableBody) {
    deptTableBody.innerHTML = '';
    const today = new Date();
    
    Object.entries(deptStats).forEach(([dept, stats]) => {
      // Calculate average days
      const deptComplaints = complaints.filter(c => (c.dept_name || c.department) === dept && c.submitted_date);
      let totalDays = 0;
      deptComplaints.forEach(c => {
        const submitted = new Date(c.submitted_date);
        const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
        totalDays += ageInDays;
      });
      const avgDays = deptComplaints.length > 0 ? Math.round(totalDays / deptComplaints.length) : 0;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${dept}</strong></td>
        <td>${stats.total}</td>
        <td><span style="color: #4CAF50;">${stats.resolved}</span></td>
        <td><span style="color: #ffaa00;">${stats.pending}</span></td>
        <td><span style="color: #00d4ff;">${stats.inProgress}</span></td>
        <td>${avgDays} days</td>
      `;
      deptTableBody.appendChild(tr);
    });
  }
}

// ========== ZONE INSIGHTS ==========
function renderZoneInsights(complaints) {
  // Group by zone
  const zoneStats = {};
  complaints.forEach(c => {
    const zone = c.area || c.zone || 'Unknown';
    if (!zoneStats[zone]) {
      zoneStats[zone] = { total: 0, resolved: 0, pending: 0, inProgress: 0, rejected: 0 };
    }
    zoneStats[zone].total++;
    const status = c.current_status || c.status || 'Pending';
    if (status === 'Resolved') zoneStats[zone].resolved++;
    else if (status === 'Pending') zoneStats[zone].pending++;
    else if (status === 'In Progress') zoneStats[zone].inProgress++;
    else if (status === 'Rejected') zoneStats[zone].rejected++;
  });
  
  // Summary
  const summaryContainer = document.getElementById('zonesSummaryContent');
  if (summaryContainer) {
    const zones = Object.entries(zoneStats)
      .map(([zone, stats]) => ({
        zone,
        total: stats.total,
        rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    summaryContainer.innerHTML = zones.map(z => `
      <div class="problem-area">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-weight: 600; margin-right: 15px;">${z.zone}</span>
          <span style="color: #ffaa00; white-space: nowrap;">${z.total} complaints</span>
        </div>
        <div style="background: rgba(255,170,0,0.1); height: 5px; border-radius: 2px; overflow: hidden;">
          <div style="background: #ffaa00; height: 100%; width: ${z.rate}%;"></div>
        </div>
      </div>
    `).join('');
  }
  
  // Distribution Chart
  const distCtx = document.getElementById('zoneDistributionChart');
  if (distCtx && window.Chart) {
    if (window.zoneDistributionChartInstance) {
      window.zoneDistributionChartInstance.destroy();
    }
    
    const zones = Object.keys(zoneStats);
    const counts = zones.map(z => zoneStats[z].total);
    const colors = ['#00d4ff', '#00ff88', '#ffaa00', '#ff4444', '#ff00ff'];
    
    window.zoneDistributionChartInstance = new Chart(distCtx, {
      type: 'pie',
      data: {
        labels: zones,
        datasets: [{
          data: counts,
          backgroundColor: zones.map((z, idx) => colors[idx % colors.length]),
          borderColor: '#1a2332',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#aaa', padding: 15, font: { size: 12 } }
          }
        }
      }
    });
  }
  
  // Problem Areas
  const problemContainer = document.getElementById('zoneProblemAreasContent');
  if (problemContainer) {
    const problemZones = Object.entries(zoneStats)
      .map(([zone, stats]) => ({
        zone,
        pending: stats.pending + stats.inProgress,
        total: stats.total
      }))
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 5);
    
    problemContainer.innerHTML = problemZones.map(z => `
      <div class="problem-area">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="margin-right: 15px;">${z.zone}</span>
          <span style="color: #ff4444; white-space: nowrap;">${z.pending} pending</span>
        </div>
        <div style="background: rgba(255,68,68,0.1); height: 5px; border-radius: 2px; overflow: hidden;">
          <div style="background: #ff4444; height: 100%; width: ${(z.pending / z.total) * 100}%;"></div>
        </div>
      </div>
    `).join('');
  }
  
  // Status Chart
  const statusCtx = document.getElementById('zoneStatusChart');
  if (statusCtx && window.Chart) {
    if (window.zoneStatusChartInstance) {
      window.zoneStatusChartInstance.destroy();
    }
    
    const zones = Object.keys(zoneStats);
    const resolved = zones.map(z => zoneStats[z].resolved);
    const pending = zones.map(z => zoneStats[z].pending);
    
    window.zoneStatusChartInstance = new Chart(statusCtx, {
      type: 'bar',
      data: {
        labels: zones,
        datasets: [
          {
            label: 'Resolved',
            data: resolved,
            backgroundColor: '#4CAF50',
            borderColor: '#1a2332',
            borderWidth: 1
          },
          {
            label: 'Pending',
            data: pending,
            backgroundColor: '#ffaa00',
            borderColor: '#1a2332',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { labels: { color: '#aaa' } }
        },
        scales: {
          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' }, stacked: true },
          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' }, stacked: true }
        }
      }
    });
  }
  
  // Populate zone table
  const zoneTableBody = document.getElementById('zoneTableBody');
  if (zoneTableBody) {
    zoneTableBody.innerHTML = '';
    
    Object.entries(zoneStats)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([zone, stats]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${zone}</strong></td>
          <td>${stats.total}</td>
          <td><span style="color: #4CAF50;">${stats.resolved}</span></td>
          <td><span style="color: #ffaa00;">${stats.pending}</span></td>
          <td><span style="color: #00d4ff;">${stats.inProgress}</span></td>
        `;
        zoneTableBody.appendChild(tr);
      });
  }
}

// ========== STAFF INSIGHTS ==========
function renderStaffInsights(complaints) {
  // Group by assigned staff
  const staffStats = {};
  complaints.forEach(c => {
    const staff = c.assigned_to;
    // Skip if no staff assigned
    if (!staff || staff === 'Unassigned') return;
    
    if (!staffStats[staff]) {
      staffStats[staff] = { total: 0, resolved: 0, inProgress: 0 };
    }
    staffStats[staff].total++;
    const status = c.current_status || c.status || 'Pending';
    if (status === 'Resolved') staffStats[staff].resolved++;
    else if (status === 'In Progress') staffStats[staff].inProgress++;
  });
  
  // Workload Chart
  const workCtx = document.getElementById('staffWorkloadChart');
  if (workCtx && window.Chart) {
    if (window.staffWorkloadChartInstance) {
      window.staffWorkloadChartInstance.destroy();
    }
    
    const staffList = Object.keys(staffStats);
    const workload = staffList.map(s => staffStats[s].total);
    
    window.staffWorkloadChartInstance = new Chart(workCtx, {
      type: 'bar',
      data: {
        labels: staffList,
        datasets: [{
          label: 'Complaints Assigned',
          data: workload,
          backgroundColor: '#00d4ff',
          borderColor: '#1a2332',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { labels: { color: '#aaa' } }
        },
        scales: {
          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' } },
          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' } }
        }
      }
    });
  }
  
  // Top Performers
  const topStaffContainer = document.getElementById('topStaffContent');
  if (topStaffContainer) {
    const topPerformers = Object.entries(staffStats)
      .map(([staff, stats]) => ({
        staff,
        resolved: stats.resolved,
        rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
    
    topStaffContainer.innerHTML = topPerformers.map((s, idx) => `
      <div class="problem-area">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
          <span style="background: #00ff88; color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">${idx + 1}</span>
          <span style="flex: 1; margin-right: 10px;">${s.staff}</span>
          <span style="color: #00ff88; white-space: nowrap;">${s.rate}%</span>
        </div>
      </div>
    `).join('');
  }
  
  // Resolution Rate Chart
  const resCtx = document.getElementById('staffResolutionChart');
  if (resCtx && window.Chart) {
    if (window.staffResolutionChartInstance) {
      window.staffResolutionChartInstance.destroy();
    }
    
    const staffList = Object.keys(staffStats);
    const resRates = staffList.map(s => {
      const total = staffStats[s].total;
      return total > 0 ? ((staffStats[s].resolved / total) * 100).toFixed(1) : 0;
    });
    
    window.staffResolutionChartInstance = new Chart(resCtx, {
      type: 'bar',
      data: {
        labels: staffList,
        datasets: [{
          label: 'Resolution Rate %',
          data: resRates,
          backgroundColor: '#00ff88',
          borderColor: '#1a2332',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { labels: { color: '#aaa' } }
        },
        scales: {
          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' }, max: 100 },
          y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(0,212,255,0.1)' } }
        }
      }
    });
  }
  
  // Average Time - Calculate real average handling time per staff
  const timeContainer = document.getElementById('staffTimeContent');
  if (timeContainer) {
    const today = new Date();
    const staffTime = Object.entries(staffStats).map(([staff, stats]) => {
      // Get complaints for this staff
      const staffComplaints = complaints.filter(c => c.assigned_to === staff && c.submitted_date);
      
      // Calculate average age
      let totalDays = 0;
      staffComplaints.forEach(c => {
        const submitted = new Date(c.submitted_date);
        const ageInDays = Math.floor((today - submitted) / (1000 * 60 * 60 * 24));
        totalDays += ageInDays;
      });
      
      const avgTime = staffComplaints.length > 0 ? Math.round(totalDays / staffComplaints.length) : 0;
      
      return { staff, avgTime };
    }).sort((a, b) => a.avgTime - b.avgTime).slice(0, 5);
    
    timeContainer.innerHTML = staffTime.map(s => `
      <div class="problem-area">
        <div style="display: flex; justify-content: space-between;">
          <span style="margin-right: 15px;">${s.staff}</span>
          <span style="color: #00d4ff; white-space: nowrap;">${s.avgTime} days</span>
        </div>
      </div>
    `).join('');
  }
  
  // Populate staff table
  const staffTableBody = document.getElementById('staffTableBody');
  if (staffTableBody) {
    staffTableBody.innerHTML = '';
    
    Object.entries(staffStats)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([staff, stats]) => {
        const resolutionRate = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${staff}</strong></td>
          <td>${stats.total}</td>
          <td><span style="color: #4CAF50;">${stats.resolved}</span></td>
          <td><span style="color: #00d4ff;">${stats.inProgress}</span></td>
          <td><span style="color: #00ff88;">${resolutionRate}%</span></td>
        `;
        staffTableBody.appendChild(tr);
      });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Restore scroll position on page load
  const savedScrollPos = sessionStorage.getItem('reportsScrollPos');
  if (savedScrollPos) {
    window.scrollTo(0, parseInt(savedScrollPos));
  }
  
  // Restore active tab on page load
  const savedTab = sessionStorage.getItem('activeReportTab');
  
  loadAllComplaints();

  // Panel switching with data loading
  const navBtns = document.querySelectorAll('.report-nav-btn');
  const panels = document.querySelectorAll('.report-panel');
  
  // Restore active tab if saved
  if (savedTab) {
    navBtns.forEach(btn => {
      if (btn.getAttribute('data-target') === savedTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    panels.forEach(panel => {
      if (panel.id === savedTab) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
    
    // Load data for saved tab
    if (savedTab === 'complaints-panel') {
      setTimeout(() => renderComplaintsInsights(allComplaints), 500);
    } else if (savedTab === 'department-panel') {
      setTimeout(() => renderDeptInsights(allComplaints), 500);
    } else if (savedTab === 'zone-panel') {
      setTimeout(() => renderZoneInsights(allComplaints), 500);
    } else if (savedTab === 'staff-panel') {
      setTimeout(() => renderStaffInsights(allComplaints), 500);
    } else if (savedTab === 'sla-panel') {
      setTimeout(() => loadSLAData(), 500);
    }
  }
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      
      // Save active tab to sessionStorage
      sessionStorage.setItem('activeReportTab', target);
      
      // Update active button
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active panel
      panels.forEach(panel => {
        if (panel.id === target) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
      
      // Load data based on panel
      if (target === 'complaints-panel') {
        renderComplaintsInsights(allComplaints);
      } else if (target === 'department-panel') {
        renderDeptInsights(allComplaints);
      } else if (target === 'zone-panel') {
        renderZoneInsights(allComplaints);
      } else if (target === 'staff-panel') {
        renderStaffInsights(allComplaints);
      } else if (target === 'sla-panel') {
        loadSLAData();
      }
    });
  });
  
  // Save scroll position before page unload
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('reportsScrollPos', window.scrollY);
  });

  // Complaints panel filters
  const complaintsDeptFilter = document.getElementById('complaintsDeptFilter');
  const complaintsStatusFilter = document.getElementById('complaintsStatusFilter');
  const complaintsDateFilter = document.getElementById('complaintsDateFilter');
  
  [complaintsDeptFilter, complaintsStatusFilter, complaintsDateFilter].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        renderComplaintsTableData();
      });
    }
  });

  // Export buttons
  const exportComplaintsBtn = document.getElementById('exportComplaintsBtn');
  if (exportComplaintsBtn) {
    exportComplaintsBtn.addEventListener('click', exportComplaintsCSV);
  }

  // Menu toggle
  const menuBtn = document.querySelector('.menu-btn');
  const layout = document.querySelector('.layout');
  if (menuBtn && layout) {
    menuBtn.addEventListener('click', () => layout.classList.toggle('collapsed'));
  }
});

