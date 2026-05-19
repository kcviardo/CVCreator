document.addEventListener('DOMContentLoaded', () => {
  // App State Data
  const state = {
    name: "",
    address: "",
    dob: "",
    email: "",
    linkedin: "",
    summary: "",
    skills: {
      ops: ["", "", ""],
      proc: ["", "", ""],
      tech: ["", "", ""]
    },
    jobs: [],
    education: {
      degree: "",
      school: "",
      year: ""
    },
    trainings: []
  };

  // Select Static DOM Elements
  const body = document.body;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const appContainer = document.querySelector('.app-container');
  const printBtn = document.getElementById('print-btn');
  const photoInput = document.getElementById('input-picture');
  const photoImg = document.getElementById('profile-photo-img');
  const photoPlaceholder = document.getElementById('profile-photo-placeholder');

  // Theme Logic
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark');
    updateThemeIcon(true);
  } else {
    body.classList.remove('dark');
    updateThemeIcon(false);
  }

  themeToggleBtn.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
  });

  function updateThemeIcon(isDark) {
    themeToggleBtn.innerHTML = isDark 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
  }

  // Sidebar Collapse
  toggleSidebarBtn.addEventListener('click', () => {
    const isCollapsed = appContainer.classList.toggle('sidebar-collapsed');
    toggleSidebarBtn.innerHTML = isCollapsed 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>` 
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>`;
  });

  // Color Theme Settings
  const themeBtns = document.querySelectorAll('.theme-btn');
  const savedColorTheme = localStorage.getItem('color-theme') || 'blue';
  document.body.setAttribute('data-theme', savedColorTheme);
  
  themeBtns.forEach(btn => {
    if (btn.getAttribute('data-theme') === savedColorTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.getAttribute('data-theme');
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('color-theme', theme);
    });
  });

  // Image Upload Logic
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        photoImg.src = event.target.result;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
        state.photo = event.target.result; // Save base64 to state
      };
      reader.readAsDataURL(file);
    }
  });

  // Basic Info Inputs Bindings (Name, Address, DoB, Email, LinkedIn, Summary)
  const basicFields = ['name', 'address', 'dob', 'email', 'linkedin', 'summary'];
  basicFields.forEach(field => {
    const input = document.getElementById(`input-${field}`);
    if (input) {
      input.addEventListener('input', (e) => {
        state[field] = e.target.value;
        syncBasicPreview(field);
      });
    }
  });

  function calculateAge(dobString) {
    const birthDate = new Date(dobString);
    if (isNaN(birthDate)) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function syncBasicPreview(field) {
    const targets = document.querySelectorAll(`[data-sync-target="${field}"]`);
    const value = state[field];
    targets.forEach(target => {
      if (target.tagName === 'A' && field === 'email') {
        target.setAttribute('href', `mailto:${value}`);
        target.textContent = value;
      } else if (target.tagName === 'A' && field === 'linkedin') {
        target.setAttribute('href', value);
        target.textContent = value.replace('https://', '').replace('www.', '');
      } else {
        if (!value.trim()) {
          target.innerHTML = `<span style="color: #cbd5e1">[Missing ${field}]</span>`;
        } else {
          if (field === 'dob') {
            const age = calculateAge(value);
            target.innerHTML = age !== null ? `${value} (Age: ${age})` : value;
          } else {
            target.innerHTML = value.replace(/\n/g, '<br>');
          }
        }
      }
    });
  }

  // Render Core Competencies (Editor & Preview)
  const categories = ['ops', 'proc', 'tech'];
  
  function renderSkillsEditor() {
    categories.forEach(cat => {
      const container = document.getElementById(`skills-${cat}-inputs`);
      container.innerHTML = '';
      
      state.skills[cat].forEach((skill, index) => {
        const row = document.createElement('div');
        row.className = 'dynamic-input-row';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = skill;
        input.addEventListener('input', (e) => {
          state.skills[cat][index] = e.target.value;
          renderSkillsPreview(cat);
        });
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
        removeBtn.addEventListener('click', () => {
          state.skills[cat].splice(index, 1);
          renderSkillsEditor();
          renderSkillsPreview(cat);
        });
        
        row.appendChild(input);
        row.appendChild(removeBtn);
        container.appendChild(row);
      });
    });
  }

  function renderSkillsPreview(cat) {
    const previewContainer = document.getElementById(`skills-${cat}-preview`);
    previewContainer.innerHTML = '';
    
    state.skills[cat].forEach(skill => {
      if (skill.trim()) {
        const badge = document.createElement('span');
        badge.className = 'skill-badge';
        badge.textContent = skill;
        previewContainer.appendChild(badge);
      }
    });
  }

  // Skills Add Listeners
  categories.forEach(cat => {
    const btn = document.getElementById(`add-skill-${cat}-btn`);
    btn.addEventListener('click', () => {
      state.skills[cat].push('');
      renderSkillsEditor();
      // Auto-focus the last added input
      const inputs = document.querySelectorAll(`.skills-editor-section #skills-${cat}-inputs input`);
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    });
  });

  // Render Experience (Editor & Preview)
  const expEditorContainer = document.getElementById('experience-editor-container');
  
  function renderJobsEditor() {
    expEditorContainer.innerHTML = '';
    
    state.jobs.forEach((job, jobIndex) => {
      const card = document.createElement('div');
      card.className = 'job-editor-card';
      
      // Card Header
      const header = document.createElement('div');
      header.className = 'job-card-header';
      header.innerHTML = `<span>Job #${jobIndex + 1}</span>`;
      
      const controls = document.createElement('div');
      controls.className = 'job-card-controls';
      controls.style.display = 'flex';
      controls.style.gap = '0.5rem';
      controls.style.alignItems = 'center';

      // Move Up Button
      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'btn btn-secondary btn-sm';
      upBtn.style.padding = '0.15rem 0.35rem';
      upBtn.style.fontSize = '0.65rem';
      upBtn.innerHTML = '▲';
      upBtn.disabled = jobIndex === 0;
      upBtn.addEventListener('click', () => {
        const temp = state.jobs[jobIndex];
        state.jobs[jobIndex] = state.jobs[jobIndex - 1];
        state.jobs[jobIndex - 1] = temp;
        renderJobsEditor();
        renderJobsPreview();
      });

      // Move Down Button
      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'btn btn-secondary btn-sm';
      downBtn.style.padding = '0.15rem 0.35rem';
      downBtn.style.fontSize = '0.65rem';
      downBtn.innerHTML = '▼';
      downBtn.disabled = jobIndex === state.jobs.length - 1;
      downBtn.addEventListener('click', () => {
        const temp = state.jobs[jobIndex];
        state.jobs[jobIndex] = state.jobs[jobIndex + 1];
        state.jobs[jobIndex + 1] = temp;
        renderJobsEditor();
        renderJobsPreview();
      });
      
      const removeJobBtn = document.createElement('button');
      removeJobBtn.type = 'button';
      removeJobBtn.className = 'job-card-remove-btn';
      removeJobBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg> Remove`;
      removeJobBtn.addEventListener('click', () => {
        state.jobs.splice(jobIndex, 1);
        renderJobsEditor();
        renderJobsPreview();
      });

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      controls.appendChild(removeJobBtn);
      header.appendChild(controls);
      card.appendChild(header);
      
      // Title
      card.appendChild(createInputField(`job-title-${jobIndex}`, "Position/Title", job.title, (val) => {
        job.title = val;
        syncJobFieldPreview(jobIndex, 'title', val);
      }));
      
      // Company
      card.appendChild(createInputField(`job-company-${jobIndex}`, "Company", job.company, (val) => {
        job.company = val;
        syncJobFieldPreview(jobIndex, 'company', val);
      }));
      
      // Dates Row (Start / End)
      const datesRow = document.createElement('div');
      datesRow.className = 'job-dates-row';
      
      datesRow.appendChild(createInputField(`job-start-${jobIndex}`, "Start Month/Year", job.start, (val) => {
        job.start = val;
        syncJobDatesPreview(jobIndex);
      }));
      
      datesRow.appendChild(createInputField(`job-end-${jobIndex}`, "End Month/Year", job.end, (val) => {
        job.end = val;
        syncJobDatesPreview(jobIndex);
      }));
      
      card.appendChild(datesRow);
      
      // Location
      card.appendChild(createInputField(`job-loc-${jobIndex}`, "Work Location", job.location, (val) => {
        job.location = val;
        syncJobDatesPreview(jobIndex);
      }));
      
      // Detail Bullets Label & Container
      const bulletsLabel = document.createElement('label');
      bulletsLabel.className = 'skills-group-header';
      bulletsLabel.style.marginTop = '0.35rem';
      bulletsLabel.style.display = 'block';
      bulletsLabel.textContent = "Specific Details / Bullet Points";
      card.appendChild(bulletsLabel);
      
      const bulletsContainer = document.createElement('div');
      bulletsContainer.className = 'dynamic-list-container';
      
      // Default to 3 inputs if details array is empty
      if (job.details.length === 0) {
        job.details = ["", "", ""];
      }
      
      job.details.forEach((detail, detailIndex) => {
        const row = document.createElement('div');
        row.className = 'dynamic-input-row';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = detail;
        input.addEventListener('input', (e) => {
          job.details[detailIndex] = e.target.value;
          renderJobBulletsPreview(jobIndex);
        });
        
        const removeDetailBtn = document.createElement('button');
        removeDetailBtn.type = 'button';
        removeDetailBtn.className = 'remove-btn';
        removeDetailBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
        removeDetailBtn.addEventListener('click', () => {
          job.details.splice(detailIndex, 1);
          renderJobsEditor();
          renderJobBulletsPreview(jobIndex);
        });
        
        row.appendChild(input);
        row.appendChild(removeDetailBtn);
        bulletsContainer.appendChild(row);
      });
      
      card.appendChild(bulletsContainer);
      
      // Add Detail Button
      const addDetailBtn = document.createElement('button');
      addDetailBtn.type = 'button';
      addDetailBtn.className = 'btn btn-secondary btn-sm';
      addDetailBtn.style.marginTop = '0.25rem';
      addDetailBtn.textContent = "+ Add Detail";
      addDetailBtn.addEventListener('click', () => {
        job.details.push('');
        renderJobsEditor();
      });
      card.appendChild(addDetailBtn);
      
      expEditorContainer.appendChild(card);
    });
  }

  function createInputField(id, labelText, value, onInputCallback) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-field';
    
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.value = value;
    input.addEventListener('input', (e) => onInputCallback(e.target.value));
    
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  // Render Experience Preview
  const expPreviewContainer = document.getElementById('experience-preview');
  
  function renderJobsPreview() {
    expPreviewContainer.innerHTML = '';
    
    state.jobs.forEach((job, jobIndex) => {
      const article = document.createElement('article');
      article.className = 'experience-item';
      article.id = `preview-job-item-${jobIndex}`;
      
      // Header Structure: Line 1 (Title left, dates right) + Line 2 (Company)
      const header = document.createElement('div');
      header.className = 'experience-header';
      
      const line1 = document.createElement('div');
      line1.className = 'exp-line-1';
      
      const titleSpan = document.createElement('h4');
      titleSpan.className = 'job-title';
      titleSpan.id = `preview-job-title-${jobIndex}`;
      titleSpan.textContent = job.title || "[Position/Title]";
      
      const coverageSpan = document.createElement('span');
      coverageSpan.className = 'job-coverage';
      coverageSpan.id = `preview-job-coverage-${jobIndex}`;
      coverageSpan.textContent = formatJobCoverage(job);
      
      line1.appendChild(titleSpan);
      line1.appendChild(coverageSpan);
      
      const line2 = document.createElement('div');
      line2.className = 'exp-line-2';
      
      const companySpan = document.createElement('span');
      companySpan.className = 'job-company';
      companySpan.id = `preview-job-company-${jobIndex}`;
      companySpan.textContent = job.company || "[Company]";
      
      line2.appendChild(companySpan);
      
      header.appendChild(line1);
      header.appendChild(line2);
      article.appendChild(header);
      
      // Bullets List
      const bulletsUl = document.createElement('ul');
      bulletsUl.className = 'job-bullets';
      bulletsUl.id = `preview-job-bullets-${jobIndex}`;
      
      article.appendChild(bulletsUl);
      expPreviewContainer.appendChild(article);
      
      renderJobBulletsPreview(jobIndex);
    });
  }

  function formatJobCoverage(job) {
    const dates = [];
    if (job.start) dates.push(job.start);
    if (job.end) dates.push(job.end);
    
    let coverageText = dates.join(' – ');
    if (job.location) {
      if (coverageText) coverageText += ` | ${job.location}`;
      else coverageText = job.location;
    }
    return coverageText || "[Timeline & Location]";
  }

  function syncJobFieldPreview(jobIndex, field, value) {
    if (field === 'title') {
      const el = document.getElementById(`preview-job-title-${jobIndex}`);
      if (el) el.textContent = value || "[Position/Title]";
    } else if (field === 'company') {
      const el = document.getElementById(`preview-job-company-${jobIndex}`);
      if (el) el.textContent = value || "[Company]";
    }
  }

  function syncJobDatesPreview(jobIndex) {
    const el = document.getElementById(`preview-job-coverage-${jobIndex}`);
    if (el) {
      const job = state.jobs[jobIndex];
      el.textContent = formatJobCoverage(job);
    }
  }

  function renderJobBulletsPreview(jobIndex) {
    const bulletsUl = document.getElementById(`preview-job-bullets-${jobIndex}`);
    if (bulletsUl) {
      bulletsUl.innerHTML = '';
      const job = state.jobs[jobIndex];
      
      job.details.forEach(detail => {
        if (detail.trim()) {
          const li = document.createElement('li');
          // Format metrics highlighted (bold text for numbers, percentages, budget signs)
          li.innerHTML = formatBulletMetrics(detail);
          bulletsUl.appendChild(li);
        }
      });
    }
  }

  // Regex highlighting helper for numbers & metrics (e.g. 150+, 98%, $50K, 12 years)
  function formatBulletMetrics(text) {
    // Matches percentages, quantities with plus, currency, or clear BPO metric indicators
    const metricRegex = /(\b\d+%\b|\b\d+\+\b|\b\d+\s+FTEs?\b|\b\d+\s+Team\s+Leaders?\b|\b\d+%\.\d+\b|\b\d+\.\d+%\b|\b\d+-\d+\b)/g;
    
    // Simple custom search for numbers/percentages to highlight them
    return text.replace(metricRegex, '<span class="metric-highlight">$1</span>');
  }

  // Add Job entry button listener
  document.getElementById('add-job-btn').addEventListener('click', () => {
    state.jobs.push({
      title: "",
      company: "",
      start: "",
      end: "",
      location: "",
      details: ["", "", ""]
    });
    renderJobsEditor();
    renderJobsPreview();
    
    // Scroll to the bottom of the editor to show the new card
    const scrollContainer = document.querySelector('.scrollable-editor');
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });

  // ---- EDUCATION ----
  const eduDegreeInput = document.getElementById('input-edu-degree');
  const eduSchoolInput = document.getElementById('input-edu-school');
  const eduYearInput   = document.getElementById('input-edu-year');

  function syncEducationPreview() {
    const preview = document.getElementById('education-preview');
    if (!preview) return;
    preview.innerHTML = `
      <span class="education-degree">${state.education.degree || '[Degree / Program]'}</span>
      <span class="education-school">${state.education.school || '[School / University]'}</span>
      <span class="education-year">${state.education.year   || '[Year Range]'}</span>
    `;
  }

  eduDegreeInput.addEventListener('input', e => { state.education.degree = e.target.value; syncEducationPreview(); });
  eduSchoolInput.addEventListener('input', e => { state.education.school = e.target.value; syncEducationPreview(); });
  eduYearInput.addEventListener('input',   e => { state.education.year   = e.target.value; syncEducationPreview(); });

  // ---- KEY TRAININGS ----
  const trainingsEditorContainer = document.getElementById('trainings-editor-container');

  function renderTrainingsEditor() {
    trainingsEditorContainer.innerHTML = '';
    state.trainings.forEach((training, idx) => {
      const card = document.createElement('div');
      card.className = 'job-editor-card';
      card.style.gap = '0.5rem';

      const header = document.createElement('div');
      header.className = 'job-card-header';
      header.innerHTML = `<span>Training #${idx + 1}</span>`;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'job-card-remove-btn';
      removeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg> Remove`;
      removeBtn.addEventListener('click', () => {
        state.trainings.splice(idx, 1);
        renderTrainingsEditor();
        renderTrainingsPreview();
      });
      header.appendChild(removeBtn);
      card.appendChild(header);

      card.appendChild(createInputField(`training-name-${idx}`, 'Training Name', training.name, val => {
        state.trainings[idx].name = val;
        renderTrainingsPreview();
      }));

      trainingsEditorContainer.appendChild(card);
    });
  }

  function renderTrainingsPreview() {
    const preview = document.getElementById('trainings-preview');
    if (!preview) return;
    preview.innerHTML = '';
    state.trainings.forEach(t => {
      if (!t.name.trim()) return;
      const badge = document.createElement('div');
      badge.className = 'cert-badge';
      badge.innerHTML = `<strong>${t.name}</strong>`;
      preview.appendChild(badge);
    });
  }

  document.getElementById('add-training-btn').addEventListener('click', () => {
    state.trainings.push({ name: '', detail: '' });
    renderTrainingsEditor();
    const scrollContainer = document.querySelector('.scrollable-editor');
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });

  // Print button listener
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // Clear button listener
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all fields and start fresh?')) return;
    window.clearCV();
  });

  // Expose clearCV globally
  window.clearCV = () => {
    // Reset state to blank
    state.name = ''; state.address = ''; state.dob = '';
    state.email = ''; state.linkedin = ''; state.summary = '';
    state.skills = { ops: ['','',''], proc: ['','',''], tech: ['','',''] };
    state.jobs = [];
    state.education = { degree: '', school: '', year: '' };
    state.trainings = [];
    state.photo = null;

    // Reset photo
    photoImg.src = '';
    photoImg.style.display = 'none';
    photoPlaceholder.style.display = 'flex';
    photoInput.value = '';

    // Re-render everything
    init();
  };

  // Expose global functions for auth.js to save/load state
  window.getCurrentCV = () => {
    return {
      ...state,
      photo: photoImg.src.startsWith('data:') ? photoImg.src : null
    };
  };

  window.loadCV = (cvData) => {
    // Deep copy cvData into state
    Object.assign(state, cvData);
    
    // Update basic inputs values
    basicFields.forEach(field => {
      const input = document.getElementById(`input-${field}`);
      if (input) {
        input.value = state[field] || '';
      }
      syncBasicPreview(field);
    });
    
    // Handle profile picture
    if (state.photo) {
      photoImg.src = state.photo;
      photoImg.style.display = 'block';
      photoPlaceholder.style.display = 'none';
    } else {
      photoImg.src = '';
      photoImg.style.display = 'none';
      photoPlaceholder.style.display = 'flex';
    }

    // Restore education input field values
    if (state.education) {
      eduDegreeInput.value = state.education.degree || '';
      eduSchoolInput.value = state.education.school || '';
      eduYearInput.value   = state.education.year   || '';
    }
    
    // Re-run initialization to sync preview and skills/jobs/trainings editors
    init();
  };

  // Initial App Render
  function init() {
    // 1. Sync all basic fields
    basicFields.forEach(field => syncBasicPreview(field));
    
    // 2. Render Skills
    renderSkillsEditor();
    categories.forEach(cat => renderSkillsPreview(cat));
    
    // 3. Render Jobs
    renderJobsEditor();
    renderJobsPreview();

    // 4. Sync Education inputs and preview
    eduDegreeInput.value = state.education.degree;
    eduSchoolInput.value = state.education.school;
    eduYearInput.value   = state.education.year;
    syncEducationPreview();

    // 5. Render Key Trainings
    renderTrainingsEditor();
    renderTrainingsPreview();
  }

  init();
});
