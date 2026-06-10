// Simple interactivity for KPM dashboard
document.addEventListener('DOMContentLoaded', ()=>{
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggleBtn');
  const searchInput = document.getElementById('searchInput');

  toggleBtn.addEventListener('click', ()=>{
    sidebar.classList.toggle('open');
  });

  // Dummy data
  const data = {
    members: 24,
    programs: 6,
    actions: 12,
    activities: [
      'Rapat evaluasi mutu - 02 Jun 2026',
      'Kunjungan ke prodi Komunikasi - 28 Mei 2026',
      'Pengisian borang akreditasi (draft) - 15 Mei 2026'
    ]
  };

  // Populate KPIs
  const elMembers = document.getElementById('kpi-members');
  const elPrograms = document.getElementById('kpi-programs');
  const elActions = document.getElementById('kpi-actions');
  if(elMembers) elMembers.textContent = data.members;
  if(elPrograms) elPrograms.textContent = data.programs;
  if(elActions) elActions.textContent = data.actions;

  // Activities
  const activityList = document.getElementById('activityList');
  if(activityList){
    data.activities.forEach(a=>{
      const li = document.createElement('li');
      li.textContent = a;
      activityList.appendChild(li);
    })
  }

  // Simple search: highlight matching nav links or activities
  if(searchInput){
    searchInput.addEventListener('input', (e)=>{
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.nav-link').forEach(a=>{
        a.style.display = a.textContent.toLowerCase().includes(q) ? 'block' : 'none';
      });
    });
  }
});
