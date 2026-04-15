/**
 * Issue Tracker Application Logic
 * Vanilla JS, no dependencies.
 */

// --- AI MANAGEMENT ---
const AIManager = {
  getApiKey() {
    let key = localStorage.getItem('gemini_api_key');
    if (!key) {
      key = window.prompt("Gemini AI integration requires an API Key.\n\nPlease enter your API Key (it will be saved locally in your browser):");
      if (key) {
        localStorage.setItem('gemini_api_key', key);
      }
    }
    return key;
  },

  async generateDescription(title) {
    const key = this.getApiKey();
    if (!key) return null;

    try {
      const module = await import("https://esm.run/@google/generative-ai");
      const GoogleGenerativeAI = module.GoogleGenerativeAI;
      
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are an expert product manager assistant. Based on the issue title: "${title}", write a very brief but professional issue description. Include a short context, and a markdown checklist of 3-4 acceptance criteria. Keep it concise.`;
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Please check if your API key is valid or try again.");
      if (e.message && e.message.includes('API key not valid')) {
        localStorage.removeItem('gemini_api_key');
      }
      return null;
    }
  }
};

// --- THEME MANAGEMENT ---
const ThemeManager = {
  themeBase: 'dark',
  STORAGE_KEY: 'antigravity_issue_tracker_theme',

  init() {
    this.btn = document.getElementById('theme-toggle-btn');
    if (!this.btn) return;
    this.sunIcon = this.btn.querySelector('.sun-icon');
    this.moonIcon = this.btn.querySelector('.moon-icon');
    
    // Load from storage
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme) {
      this.themeBase = savedTheme;
    }
    
    this.applyTheme();
    this.bindEvents();
  },

  bindEvents() {
    this.btn.addEventListener('click', () => {
      this.themeBase = this.themeBase === 'dark' ? 'light' : 'dark';
      this.applyTheme();
      localStorage.setItem(this.STORAGE_KEY, this.themeBase);
    });
  },

  applyTheme() {
    if (this.themeBase === 'light') {
      document.documentElement.classList.add('light-theme');
      // In light mode, show moon icon (click to go dark)
      this.sunIcon.classList.add('hidden');
      this.moonIcon.classList.remove('hidden');
    } else {
      document.documentElement.classList.remove('light-theme');
      // In dark mode, show sun icon (click to go light)
      this.moonIcon.classList.add('hidden');
      this.sunIcon.classList.remove('hidden');
    }
  }
};

// --- PROFILE MANAGEMENT ---
const ProfileManager = {
  init() {
    this.btn = document.getElementById('profile-btn');
    if (!this.btn) return;
    
    // Load from storage
    const savedName = localStorage.getItem('issue_tracker_profile_name') || 'Guest User';
    this.updateAvatar(savedName);
    
    this.btn.addEventListener('click', () => this.openSettings());
  },

  openSettings() {
    const currentName = localStorage.getItem('issue_tracker_profile_name') || 'Guest User';
    const promptText = "Settings:\n\n1. Enter your new Profile Name below.\n2. Or type 'reset key' to clear your Gemini API Key.";
    const input = window.prompt(promptText, currentName);
    
    if (input !== null) {
      if (input.trim().toLowerCase() === 'reset key') {
        localStorage.removeItem('gemini_api_key');
        alert("Gemini API Key has been cleanly removed.");
      } else if (input.trim()) {
        const newName = input.trim();
        localStorage.setItem('issue_tracker_profile_name', newName);
        this.updateAvatar(newName);
      }
    }
  },

  updateAvatar(name) {
    if (this.btn) {
      const encodedName = encodeURIComponent(name);
      this.btn.src = `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff`;
      this.btn.alt = name;
    }
  }
};

// --- STATE MANAGEMENT ---
const State = {
  issues: [],
  
  // Storage Key
  STORAGE_KEY: 'antigravity_issue_tracker_data',

  // Initialize state from local storage
  init() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        this.issues = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse issues from local storage", e);
        this.issues = [];
      }
    } else {
      // Load some initial stub data if empty
      this.issues = [
        {
          id: this.generateId(),
          title: "Setup Project Repository",
          description: "Initialize git repository and add basic folder structure.",
          status: "completed",
          createdAt: Date.now() - 100000
        },
        {
          id: this.generateId(),
          title: "Implement UI Design",
          description: "Create HTML layout and write custom CSS for a premium dark mode aesthetic.",
          status: "todo",
          createdAt: Date.now() - 50000
        }
      ];
      this.save();
    }
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.issues));
  },

  addIssue(title, description) {
    const newIssue = {
      id: this.generateId(),
      title,
      description,
      status: 'todo', // Default status
      createdAt: Date.now()
    };
    this.issues.push(newIssue);
    this.save();
    return newIssue;
  },

  deleteIssue(id) {
    this.issues = this.issues.filter(issue => issue.id !== id);
    this.save();
  },

  updateIssueStatus(id, newStatus) {
    const issue = this.issues.find(issue => issue.id === id);
    if (issue) {
      issue.status = newStatus;
      this.save();
    }
  },

  getIssuesByStatus(status) {
    return this.issues
      .filter(issue => issue.status === status)
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first
  },

  generateId() {
    return 'ISSUE-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  }
};


// --- UI LAYER ---
const UI = {
  // DOM Elements
  columns: document.querySelectorAll('.column-body'),
  columnContainers: document.querySelectorAll('.column'),
  addBtn: document.getElementById('add-issue-btn'),
  modal: document.getElementById('issue-modal'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  cancelBtn: document.getElementById('cancel-issue-btn'),
  form: document.getElementById('issue-form'),
  
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Modal controls
    this.addBtn.addEventListener('click', () => this.openModal());
    this.closeModalBtn.addEventListener('click', () => this.closeModal());
    this.cancelBtn.addEventListener('click', () => this.closeModal());
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Close on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Drag and Drop (Columns setup)
    this.columnContainers.forEach(column => {
      column.addEventListener('dragover', this.handleDragOver.bind(this));
      column.addEventListener('dragenter', this.handleDragEnter.bind(this));
      column.addEventListener('dragleave', this.handleDragLeave.bind(this));
      column.addEventListener('drop', this.handleDrop.bind(this));
    });

    // AI Generate Logic
    this.aiGenerateBtn = document.getElementById('ai-generate-btn');
    if (this.aiGenerateBtn) {
      this.aiGenerateBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('issue-title');
        const descInput = document.getElementById('issue-desc');
        
        if (!titleInput.value.trim()) {
          alert('Please enter a title first so the AI knows what to generate!');
          titleInput.focus();
          return;
        }

        this.aiGenerateBtn.disabled = true;
        const originalText = this.aiGenerateBtn.textContent;
        this.aiGenerateBtn.textContent = '⏳ Generating...';
        
        const generated = await AIManager.generateDescription(titleInput.value.trim());
        if (generated) {
          descInput.value = generated;
        }
        
        this.aiGenerateBtn.disabled = false;
        this.aiGenerateBtn.textContent = originalText;
      });
    }
  },

  openModal() {
    this.modal.classList.remove('hidden');
    document.getElementById('issue-title').focus();
  },

  closeModal() {
    this.modal.classList.add('hidden');
    this.form.reset();
  },

  handleFormSubmit() {
    const title = document.getElementById('issue-title').value.trim();
    const desc = document.getElementById('issue-desc').value.trim();
    
    if (title && desc) {
      State.addIssue(title, desc);
      this.closeModal();
      this.render();
    }
  },

  handleDelete(id) {
    if (confirm('Are you sure you want to delete this issue?')) {
      State.deleteIssue(id);
      this.render();
    }
  },

  // Drag and Drop Handlers
  handleDragStart(e) {
    if(!e.target.classList || !e.target.classList.contains('issue-card')) return;
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  },

  handleDragEnd(e) {
    if(e.target.classList) {
        e.target.classList.remove('dragging');
    }
    // Clean up drag-over classes
    this.columnContainers.forEach(col => col.classList.remove('drag-over'));
  },

  handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  },

  handleDragEnter(e) {
    e.preventDefault();
    const column = e.target.closest('.column');
    if (column) {
      column.classList.add('drag-over');
    }
  },

  handleDragLeave(e) {
    const column = e.target.closest('.column');
    // We only remove if we are actually leaving the column element (not entering a child)
    if (column && e.relatedTarget && !column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  },

  handleDrop(e) {
    e.preventDefault();
    const column = e.target.closest('.column');
    if (column) {
      column.classList.remove('drag-over');
      const issueId = e.dataTransfer.getData('text/plain');
      const newStatus = column.dataset.status;
      
      if (issueId && newStatus) {
        State.updateIssueStatus(issueId, newStatus);
        this.render();
      }
    }
  },

  // Rendering
  render() {
    const statuses = ['todo', 'in-progress', 'completed'];

    statuses.forEach(status => {
      const columnBody = document.getElementById(`list-${status}`);
      const countEl = document.getElementById(`count-${status}`);
      
      const issues = State.getIssuesByStatus(status);
      countEl.textContent = issues.length;
      
      // Clear current content
      columnBody.innerHTML = '';

      // Populate issues
      issues.forEach(issue => {
        const card = this.createIssueCard(issue);
        columnBody.appendChild(card);
      });
    });
  },

  createIssueCard(issue) {
    const div = document.createElement('div');
    div.className = 'issue-card';
    div.draggable = true;
    div.dataset.id = issue.id;

    // Date formatting
    const dateStr = new Date(issue.createdAt).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });

    div.innerHTML = `
      <div class="issue-header">
        <h3>${this.escapeHTML(issue.title)}</h3>
        <button class="icon-btn delete-btn" title="Delete Issue">&times;</button>
      </div>
      <p class="issue-desc">${this.escapeHTML(issue.description)}</p>
      <div class="issue-meta">
        <span class="issue-id">${issue.id}</span>
        <span class="issue-date">${dateStr}</span>
      </div>
    `;

    // Bind specific events to the card
    div.addEventListener('dragstart', this.handleDragStart.bind(this));
    div.addEventListener('dragend', this.handleDragEnd.bind(this));
    
    // Bind delete event
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent drag execution or active states
      this.handleDelete(issue.id);
    });

    return div;
  },

  // Utility to prevent XSS in purely vanilla usage
  escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
  }
};

// --- NAVIGATION MANAGEMENT ---
const NavigationManager = {
  init() {
    this.homeBtn = document.getElementById('nav-home-btn');
    this.settingsBtn = document.getElementById('nav-settings-btn');
    this.toggleBtn = document.getElementById('sidebar-toggle');
    this.layout = document.getElementById('app-layout');
    
    if (this.homeBtn) {
      this.homeBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        UI.render();
      });
    }
    
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => {
        ProfileManager.openSettings();
      });
    }

    if (this.toggleBtn && this.layout) {
      this.toggleBtn.addEventListener('click', () => this.toggleSidebar());
      
      // Load persisted state
      const isCollapsed = localStorage.getItem('issue_tracker_sidebar_collapsed') === 'true';
      if (isCollapsed) {
        this.layout.classList.add('collapsed');
      }
    }
  },

  toggleSidebar() {
    if (this.layout) {
      const isCollapsed = this.layout.classList.toggle('collapsed');
      localStorage.setItem('issue_tracker_sidebar_collapsed', isCollapsed);
    }
  }
};

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  ProfileManager.init();
  NavigationManager.init();
  State.init();
  UI.init();
});
