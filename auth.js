// CV Builder Suite - Authentication & Persistence Layer (auth.js)
document.addEventListener('DOMContentLoaded', () => {
  // --- AUTHENTICATION & DATA STATE ---
  const STORAGE_USERS_KEY = 'cv_builder_users';
  const STORAGE_SESSION_KEY = 'cv_builder_logged_in_user';
  const STORAGE_CVS_KEY = 'cv_builder_resumes';

  // Helper: Get users database
  function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY)) || {};
  }

  // Helper: Save users database
  function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }

  // Helper: Get logged in user session
  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_SESSION_KEY)) || null;
  }

  // Helper: Set logged in user session
  function setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }

  // Helper: Get all resumes
  function getResumes() {
    return JSON.parse(localStorage.getItem(STORAGE_CVS_KEY)) || [];
  }

  // Helper: Save resumes
  function saveResumes(resumes) {
    localStorage.setItem(STORAGE_CVS_KEY, JSON.stringify(resumes));
  }

  // --- INITIALIZE UI ---
  const userPanel = document.getElementById('user-panel');
  if (!userPanel) return;

  // Insert Modals dynamically into body if they don't exist
  if (!document.getElementById('auth-modal-overlay')) {
    injectAuthModals();
  }

  // Render initial state
  renderUserPanel();

  // Check URL parameters for loading a CV on the editor page
  handleUrlLoadParam();

  // --- RENDER CONTROL PANEL ---
  function renderUserPanel() {
    const user = getCurrentUser();
    
    if (user) {
      // User is logged in
      const isEditorPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || !window.location.pathname.includes('.html');
      const savedCvs = getResumes().filter(cv => cv.userId === user.email);
      
      let cvItemsHtml = '';
      if (savedCvs.length === 0) {
        cvItemsHtml = `<div class="dropdown-no-data">No saved resumes yet</div>`;
      } else {
        savedCvs.forEach(cv => {
          const dateStr = new Date(cv.updatedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          cvItemsHtml += `
            <div class="saved-resume-item" data-id="${cv.id}">
              <div class="resume-info">
                <span class="resume-name" title="${cv.name}">${cv.name}</span>
                <span class="resume-date">Saved on ${dateStr}</span>
              </div>
              <button class="btn-delete-resume" title="Delete Resume" data-id="${cv.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          `;
        });
      }

      userPanel.innerHTML = `
        <div class="user-profile-menu">
          <button class="user-profile-btn" id="user-profile-trigger">
            <div class="user-avatar">
              ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : user.name.charAt(0).toUpperCase()}
            </div>
            <span class="user-name-text">${user.name}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="dropdown-menu" id="user-dropdown">
            <div class="dropdown-header">Logged in as ${user.email}</div>
            
            ${isEditorPage ? `
              <button class="dropdown-item" id="btn-save-current-cv">
                <span>Save Current CV</span>
                <span class="dropdown-item-action">+</span>
              </button>
              <div class="dropdown-divider"></div>
            ` : ''}
            
            <div class="dropdown-header">Saved CVs / Resumes</div>
            <div class="saved-resumes-list">
              ${cvItemsHtml}
            </div>
            
            <div class="dropdown-divider"></div>
            <button class="dropdown-item btn-signout-action" id="btn-signout">
              <span style="color: #ef4444;">Sign Out</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </div>
      `;

      setupLoggedInEventListeners();
    } else {
      // User is not logged in
      userPanel.innerHTML = `
        <button class="btn-signin" id="btn-signin-trigger">Sign In</button>
      `;
      setupLoggedOutEventListeners();
    }
  }

  // --- ATTACH EVENT LISTENERS ---
  function setupLoggedOutEventListeners() {
    const signInTrigger = document.getElementById('btn-signin-trigger');
    if (signInTrigger) {
      signInTrigger.addEventListener('click', showAuthModal);
    }
  }

  function setupLoggedInEventListeners() {
    const trigger = document.getElementById('user-profile-trigger');
    const dropdown = document.getElementById('user-dropdown');
    
    if (trigger && dropdown) {
      // Toggle dropdown
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });
    }

    // Sign out logic
    const signOutBtn = document.getElementById('btn-signout');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        setCurrentUser(null);
        renderUserPanel();
        // Clear editor/preview state or reload to restore default template
        window.location.reload();
      });
    }

    // Save CV Action
    const saveCvBtn = document.getElementById('btn-save-current-cv');
    if (saveCvBtn) {
      saveCvBtn.addEventListener('click', () => {
        if (dropdown) dropdown.classList.remove('show');
        showSaveCvModal();
      });
    }

    // Load CV Action (clicking a resume name)
    const resumeItems = document.querySelectorAll('.saved-resume-item');
    resumeItems.forEach(item => {
      const infoDiv = item.querySelector('.resume-info');
      const cvId = item.getAttribute('data-id');
      
      infoDiv.addEventListener('click', () => {
        if (dropdown) dropdown.classList.remove('show');
        loadSavedCv(cvId);
      });
    });

    // Delete CV Action
    const deleteBtns = document.querySelectorAll('.btn-delete-resume');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cvId = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this saved CV?')) {
          deleteCv(cvId);
        }
      });
    });
  }

  // --- SAVED RESUMES PERSISTENCE OPERATIONS ---
  function saveCurrentCv(name) {
    const user = getCurrentUser();
    if (!user) return;

    if (typeof window.getCurrentCV !== 'function') {
      alert('Error: CV Builder page not fully loaded or active.');
      return;
    }

    const cvData = window.getCurrentCV();
    const resumes = getResumes();
    
    // Add new resume
    const newCv = {
      id: 'cv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: user.email,
      name: name.trim() || `Resume - ${new Date().toLocaleDateString()}`,
      data: cvData,
      updatedAt: Date.now()
    };
    
    resumes.push(newCv);
    saveResumes(resumes);
    
    renderUserPanel();
    alert(`"${newCv.name}" has been successfully saved!`);
  }

  function loadSavedCv(cvId) {
    const isEditorPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || !window.location.pathname.includes('.html');
    
    if (isEditorPage) {
      const cv = getResumes().find(c => c.id === cvId);
      if (cv && typeof window.loadCV === 'function') {
        window.loadCV(cv.data);
      }
    } else {
      // Redirect to index page with load query parameter
      window.location.href = `index.html?load=${cvId}`;
    }
  }

  function deleteCv(cvId) {
    let resumes = getResumes();
    resumes = resumes.filter(c => c.id !== cvId);
    saveResumes(resumes);
    renderUserPanel();
  }

  function handleUrlLoadParam() {
    const params = new URLSearchParams(window.location.search);
    const cvId = params.get('load');
    if (cvId) {
      // Wait for window.loadCV to become active
      const checkInterval = setInterval(() => {
        if (typeof window.loadCV === 'function') {
          clearInterval(checkInterval);
          const cv = getResumes().find(c => c.id === cvId);
          if (cv) {
            window.loadCV(cv.data);
            // Clean up the URL query parameter without reloading
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
          }
        }
      }, 100);
      
      // Safety timeout after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  }

  // --- MODAL INJECTIONS ---
  function injectAuthModals() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'auth-modal-overlay';
    
    overlay.innerHTML = `
      <div class="auth-modal" id="auth-modal-box">
        <div class="auth-header">
          <h3 id="auth-modal-title">Sign In</h3>
          <button class="btn-close-modal" id="btn-close-auth-modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div class="auth-body">
          <!-- Form Tabs -->
          <div class="auth-tabs" id="auth-tabs-container">
            <div class="auth-tab active" data-tab="signin">Sign In</div>
            <div class="auth-tab" data-tab="signup">Register</div>
          </div>

          <!-- OAuth Social buttons -->
          <div class="oauth-container">
            <button class="btn-oauth" id="btn-google-oauth">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
          
          <div class="auth-divider">or use Email</div>
          
          <!-- Registration / Login forms -->
          <form class="auth-form" id="auth-form-el">
            <div class="input-field" id="auth-name-field" style="display: none;">
              <label for="auth-input-name">Full Name</label>
              <input type="text" id="auth-input-name" placeholder="Enter your full name">
            </div>
            
            <div class="input-field">
              <label for="auth-input-email">Email Address</label>
              <input type="email" id="auth-input-email" required placeholder="name@example.com">
            </div>
            
            <div class="input-field">
              <label for="auth-input-password">Password</label>
              <input type="password" id="auth-input-password" required placeholder="••••••••">
            </div>

            <div class="auth-error" id="auth-error-msg">Incorrect credentials</div>

            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;" id="btn-auth-submit">Sign In</button>
          </form>
        </div>
      </div>
    </div>
    `;

    document.body.appendChild(overlay);

    // Inject Save CV modal overlay
    const saveOverlay = document.createElement('div');
    saveOverlay.className = 'modal-overlay';
    saveOverlay.id = 'save-cv-modal-overlay';
    saveOverlay.innerHTML = `
      <div class="auth-modal" style="width: 380px;">
        <div class="auth-header">
          <h3>Save Resume</h3>
          <button class="btn-close-modal" id="btn-close-save-modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="auth-body">
          <div class="input-field">
            <label for="save-cv-name-input">Resume Name</label>
            <input type="text" id="save-cv-name-input" placeholder="e.g. Operations Manager - Google">
          </div>
          <button class="btn btn-primary" id="btn-submit-save-cv" style="margin-top: 0.5rem;">Save Resume</button>
        </div>
      </div>
    `;
    document.body.appendChild(saveOverlay);

    // Inject Google accounts chooser simulator overlay
    const googleOverlay = document.createElement('div');
    googleOverlay.className = 'modal-overlay';
    googleOverlay.id = 'google-modal-overlay';
    googleOverlay.innerHTML = `
      <div class="auth-modal" style="width: 360px; border-radius: 8px; border: 1px solid #dadce0;">
        <div class="google-modal-header" style="padding: 1.5rem; text-align: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" style="margin-bottom: 0.5rem;">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <h2 style="font-family: Roboto, Arial, sans-serif; font-size: 1.25rem; font-weight: 400; color: #202124;">Choose an account</h2>
          <div style="font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; color: #5f6368; margin-top: 0.25rem;">to continue to CV Builder Suite</div>
        </div>
        <div style="max-height: 280px; overflow-y: auto; border-top: 1px solid #dadce0;">
          <div class="google-acc-item" data-email="christoperviardo@gmail.com" data-name="Kevin Christoper L. Viardo" style="display: flex; align-items: center; padding: 0.75rem 1.5rem; cursor: pointer; transition: background-color 0.2s; border-bottom: 1px solid #dadce0;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; margin-right: 0.75rem;">K</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; font-weight: 500; color: #3c4043;">Kevin Christoper L. Viardo</span>
              <span style="font-family: Roboto, Arial, sans-serif; font-size: 0.75rem; color: #5f6368;">christoperviardo@gmail.com</span>
            </div>
          </div>
          <div class="google-acc-item" data-email="guest.user@gmail.com" data-name="Guest User" style="display: flex; align-items: center; padding: 0.75rem 1.5rem; cursor: pointer; transition: background-color 0.2s; border-bottom: 1px solid #dadce0;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; margin-right: 0.75rem;">G</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; font-weight: 500; color: #3c4043;">Guest User</span>
              <span style="font-family: Roboto, Arial, sans-serif; font-size: 0.75rem; color: #5f6368;">guest.user@gmail.com</span>
            </div>
          </div>
          <div class="google-acc-item" id="google-acc-custom-trigger" style="display: flex; align-items: center; padding: 0.75rem 1.5rem; cursor: pointer; transition: background-color 0.2s; border-bottom: 1px solid #dadce0;">
            <div style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #dadce0; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; color: #5f6368;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span style="font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; font-weight: 500; color: #3c4043;">Use another account</span>
          </div>
        </div>
        <div style="padding: 1rem 1.5rem; text-align: center;">
          <button class="btn-close-modal" id="btn-close-google-modal" style="font-family: Roboto, Arial, sans-serif; font-size: 0.875rem; color: #1a73e8; border: none; font-weight: 500; cursor: pointer; background: none;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(googleOverlay);

    setupModalEventListeners();
  }

  function setupModalEventListeners() {
    const authOverlay = document.getElementById('auth-modal-overlay');
    const closeAuthBtn = document.getElementById('btn-close-auth-modal');
    
    // Close modal triggers
    const closeModal = () => {
      authOverlay.classList.remove('show');
    };

    closeAuthBtn.addEventListener('click', closeModal);
    authOverlay.addEventListener('click', (e) => {
      if (e.target === authOverlay) closeModal();
    });

    // Tab switching (Sign In vs Register)
    const tabs = document.querySelectorAll('.auth-tab');
    const nameField = document.getElementById('auth-name-field');
    const submitBtn = document.getElementById('btn-auth-submit');
    const titleEl = document.getElementById('auth-modal-title');
    const errorEl = document.getElementById('auth-error-msg');
    let currentTab = 'signin';

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        currentTab = tab.getAttribute('data-tab');
        errorEl.style.display = 'none';

        if (currentTab === 'signin') {
          nameField.style.display = 'none';
          submitBtn.textContent = 'Sign In';
          titleEl.textContent = 'Sign In';
        } else {
          nameField.style.display = 'flex';
          submitBtn.textContent = 'Create Account';
          titleEl.textContent = 'Create Account';
          const nameInput = document.getElementById('auth-input-name');
          if (nameInput) nameInput.required = true;
        }
      });
    });

    // Form submission (Email auth flow)
    const authForm = document.getElementById('auth-form-el');
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';

      const emailInput = document.getElementById('auth-input-email');
      const passwordInput = document.getElementById('auth-input-password');
      const nameInput = document.getElementById('auth-input-name');

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;
      const users = getUsers();

      if (currentTab === 'signin') {
        // Authenticate
        const existingUser = users[email];
        if (existingUser && existingUser.password === password) {
          setCurrentUser({
            name: existingUser.name,
            email: email,
            avatar: null
          });
          closeModal();
          renderUserPanel();
          authForm.reset();
        } else {
          errorEl.textContent = 'Incorrect email or password.';
          errorEl.style.display = 'block';
        }
      } else {
        // Register new user
        if (users[email]) {
          errorEl.textContent = 'Email address already registered.';
          errorEl.style.display = 'block';
          return;
        }

        const newName = nameInput.value.trim() || 'User';
        users[email] = {
          name: newName,
          password: password
        };
        saveUsers(users);

        setCurrentUser({
          name: newName,
          email: email,
          avatar: null
        });
        closeModal();
        renderUserPanel();
        authForm.reset();
      }
    });

    // Google Sign In trigger
    const googleBtn = document.getElementById('btn-google-oauth');
    const googleOverlay = document.getElementById('google-modal-overlay');
    const closeGoogleBtn = document.getElementById('btn-close-google-modal');

    googleBtn.addEventListener('click', () => {
      closeModal();
      googleOverlay.classList.add('show');
    });

    closeGoogleBtn.addEventListener('click', () => {
      googleOverlay.classList.remove('show');
    });

    googleOverlay.addEventListener('click', (e) => {
      if (e.target === googleOverlay) googleOverlay.classList.remove('show');
    });

    // Handle Google chooser item clicks
    const googleAccItems = document.querySelectorAll('.google-acc-item:not(#google-acc-custom-trigger)');
    googleAccItems.forEach(item => {
      item.addEventListener('click', () => {
        const email = item.getAttribute('data-email');
        const name = item.getAttribute('data-name');
        
        setCurrentUser({
          name: name,
          email: email,
          avatar: null
        });
        googleOverlay.classList.remove('show');
        renderUserPanel();
      });
    });

    // Google Sign In Custom (Use another account)
    const customGoogleTrigger = document.getElementById('google-acc-custom-trigger');
    customGoogleTrigger.addEventListener('click', () => {
      const email = prompt('Enter Google Account Email:', 'developer@google.com');
      if (email && email.trim()) {
        const defaultName = email.split('@')[0].replace('.', ' ');
        const name = prompt('Enter Google Account Full Name:', defaultName.charAt(0).toUpperCase() + defaultName.slice(1)) || defaultName;
        
        setCurrentUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatar: null
        });
        googleOverlay.classList.remove('show');
        renderUserPanel();
      }
    });

    // Save CV Modal Controls
    const saveOverlay = document.getElementById('save-cv-modal-overlay');
    const closeSaveBtn = document.getElementById('btn-close-save-modal');
    const submitSaveBtn = document.getElementById('btn-submit-save-cv');
    const saveInput = document.getElementById('save-cv-name-input');

    const closeSaveModal = () => {
      saveOverlay.classList.remove('show');
    };

    closeSaveBtn.addEventListener('click', closeSaveModal);
    saveOverlay.addEventListener('click', (e) => {
      if (e.target === saveOverlay) closeSaveModal();
    });

    submitSaveBtn.addEventListener('click', () => {
      const cvName = saveInput.value.trim();
      saveCurrentCv(cvName);
      closeSaveModal();
    });
  }

  function showAuthModal() {
    const authOverlay = document.getElementById('auth-modal-overlay');
    authOverlay.classList.add('show');
  }

  function showSaveCvModal() {
    const saveOverlay = document.getElementById('save-cv-modal-overlay');
    const saveInput = document.getElementById('save-cv-name-input');
    
    // Autofill name input with current user CV name if possible
    if (typeof window.getCurrentCV === 'function') {
      const currentData = window.getCurrentCV();
      saveInput.value = currentData.name ? `${currentData.name} Resume` : '';
    } else {
      saveInput.value = '';
    }

    saveOverlay.classList.add('show');
    saveInput.focus();
  }
});
