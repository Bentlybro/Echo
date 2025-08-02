class SettingsManager {
  constructor() {
    this.settingsModal = document.getElementById('settings-modal');
    this.settingsBtn = document.getElementById('settings-btn');
    this.closeSettingsBtn = document.getElementById('close-settings-btn');
    this.resetSettingsBtn = document.getElementById('reset-settings-btn');
    this.settingsModalClose = document.getElementById('settings-modal-close');
    
    this.defaultTheme = {
      primaryBg: '#000000',
      secondaryBg: '#0a0a0a',
      tertiaryBg: '#1a1a1a',
      primaryText: '#ffffff',
      secondaryText: '#888888',
      accentColor: '#667eea',
      borderColor: '#333333',
      borderLight: '#666666',
      hoverBg: '#2a2a2a',
      successColor: '#48bb78',
      errorColor: '#ff4444',
      warningColor: '#ed8936'
    };
    
    this.themes = {
      default: this.defaultTheme,
      'dark-blue': {
        primaryBg: '#0f172a',
        secondaryBg: '#1e293b',
        tertiaryBg: '#334155',
        primaryText: '#f8fafc',
        secondaryText: '#94a3b8',
        accentColor: '#3b82f6',
        borderColor: '#475569',
        borderLight: '#64748b',
        hoverBg: '#293548',
        successColor: '#10b981',
        errorColor: '#ef4444',
        warningColor: '#f59e0b'
      },
      purple: {
        primaryBg: '#1a0b2e',
        secondaryBg: '#16213e',
        tertiaryBg: '#533483',
        primaryText: '#edf2f7',
        secondaryText: '#a0aec0',
        accentColor: '#9f7aea',
        borderColor: '#553c9a',
        borderLight: '#7c3aed',
        hoverBg: '#2d1b69',
        successColor: '#68d391',
        errorColor: '#fc8181',
        warningColor: '#f6ad55'
      },
      green: {
        primaryBg: '#0c1618',
        secondaryBg: '#1a202c',
        tertiaryBg: '#2d3748',
        primaryText: '#f7fafc',
        secondaryText: '#a0aec0',
        accentColor: '#48bb78',
        borderColor: '#4a5568',
        borderLight: '#68d391',
        hoverBg: '#2d4739',
        successColor: '#68d391',
        errorColor: '#fc8181',
        warningColor: '#f6ad55'
      },
      red: {
        primaryBg: '#1a0e0e',
        secondaryBg: '#2d1b1b',
        tertiaryBg: '#4a2c2c',
        primaryText: '#fed7d7',
        secondaryText: '#feb2b2',
        accentColor: '#f56565',
        borderColor: '#742a2a',
        borderLight: '#9b2c2c',
        hoverBg: '#3d2020',
        successColor: '#68d391',
        errorColor: '#fc8181',
        warningColor: '#f6ad55'
      }
    };
    
    this.currentTheme = { ...this.defaultTheme };
    this.bindEvents();
    this.initializeColorInputs();
    this.loadSettings();
  }

  bindEvents() {
    // Modal controls
    this.settingsBtn.addEventListener('click', () => this.showSettings());
    this.closeSettingsBtn.addEventListener('click', () => this.hideSettings());
    this.resetSettingsBtn.addEventListener('click', () => this.resetToDefault());
    this.settingsModalClose.addEventListener('click', () => this.hideSettings());
    
    // Tab switching
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Preset theme buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.applyPresetTheme(e.target.dataset.theme));
    });
    
    // Modal outside click
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.hideSettings();
      }
    });
  }

  initializeColorInputs() {
    // Color picker and text input synchronization
    const colorInputs = [
      { color: 'primary-bg-color', text: 'primary-bg-text', property: 'primaryBg' },
      { color: 'accent-color-picker', text: 'accent-color-text', property: 'accentColor' },
      { color: 'text-color-picker', text: 'text-color-text', property: 'primaryText' },
      { color: 'border-color-picker', text: 'border-color-text', property: 'borderColor' }
    ];

    colorInputs.forEach(({ color, text, property }) => {
      const colorInput = document.getElementById(color);
      const textInput = document.getElementById(text);
      
      if (colorInput && textInput) {
        colorInput.addEventListener('input', (e) => {
          const value = e.target.value;
          textInput.value = value;
          this.updateThemeProperty(property, value);
        });
        
        textInput.addEventListener('input', (e) => {
          const value = e.target.value;
          if (this.isValidHexColor(value)) {
            colorInput.value = value;
            this.updateThemeProperty(property, value);
          }
        });
      }
    });
  }

  isValidHexColor(hex) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }

  updateThemeProperty(property, value) {
    this.currentTheme[property] = value;
    this.applyTheme(this.currentTheme);
    this.saveSettings();
  }

  applyTheme(theme) {
    const root = document.documentElement;
    
    root.style.setProperty('--primary-bg', theme.primaryBg);
    root.style.setProperty('--secondary-bg', theme.secondaryBg);
    root.style.setProperty('--tertiary-bg', theme.tertiaryBg);
    root.style.setProperty('--primary-text', theme.primaryText);
    root.style.setProperty('--secondary-text', theme.secondaryText);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-hover', this.adjustBrightness(theme.accentColor, -10));
    root.style.setProperty('--border-color', theme.borderColor);
    root.style.setProperty('--border-light', theme.borderLight);
    root.style.setProperty('--hover-bg', theme.hoverBg);
    root.style.setProperty('--success-color', theme.successColor);
    root.style.setProperty('--error-color', theme.errorColor);
    root.style.setProperty('--warning-color', theme.warningColor);
    
    // Update derived colors
    root.style.setProperty('--progress-fill', theme.accentColor);
    root.style.setProperty('--slider-thumb', theme.accentColor);
  }

  adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  applyPresetTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = { ...this.themes[themeName] };
      this.applyTheme(this.currentTheme);
      this.updateColorInputsFromTheme();
      this.saveSettings();
    }
  }

  updateColorInputsFromTheme() {
    document.getElementById('primary-bg-color').value = this.currentTheme.primaryBg;
    document.getElementById('primary-bg-text').value = this.currentTheme.primaryBg;
    document.getElementById('accent-color-picker').value = this.currentTheme.accentColor;
    document.getElementById('accent-color-text').value = this.currentTheme.accentColor;
    document.getElementById('text-color-picker').value = this.currentTheme.primaryText;
    document.getElementById('text-color-text').value = this.currentTheme.primaryText;
    document.getElementById('border-color-picker').value = this.currentTheme.borderColor;
    document.getElementById('border-color-text').value = this.currentTheme.borderColor;
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.settings-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.querySelector(`[data-tab-content="${tabName}"]`).classList.add('active');
  }

  showSettings() {
    this.settingsModal.classList.add('active');
    // Initialize Lucide icons for the new elements
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  hideSettings() {
    this.settingsModal.classList.remove('active');
  }

  resetToDefault() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.currentTheme = { ...this.defaultTheme };
      this.applyTheme(this.currentTheme);
      this.updateColorInputsFromTheme();
      this.saveSettings();
    }
  }

  saveSettings() {
    const settings = {
      theme: this.currentTheme,
      version: '1.0.0'
    };
    localStorage.setItem('music-player-settings', JSON.stringify(settings));
  }

  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('music-player-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.theme) {
          this.currentTheme = { ...this.defaultTheme, ...settings.theme };
          this.applyTheme(this.currentTheme);
          this.updateColorInputsFromTheme();
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
} else {
  window.SettingsManager = SettingsManager;
}