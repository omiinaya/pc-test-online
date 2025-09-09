<script>
import { availableLocales, changeLocale, getCurrentLocale } from '../i18n';

export default {
  name: 'LanguageSwitcher',
  data() {
    return {
      availableLocales,
      currentLocale: getCurrentLocale(),
      showDropdown: false
    };
  },
  methods: {
    changeLanguage(locale) {
      const success = changeLocale(locale);
      if (success) {
        this.currentLocale = locale;
        this.showDropdown = false;
        // Emit event for parent components if needed
        this.$emit('language-changed', locale);
      }
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    closeDropdown() {
      this.showDropdown = false;
    }
  },
  computed: {
    currentLanguageName() {
      return this.availableLocales[this.currentLocale] || 'English';
    }
  }
};
</script>

<template>
  <div class="language-switcher">
    <button
      class="language-switcher__trigger"
      @click="toggleDropdown"
      :title="`Current language: ${currentLanguageName}`"
    >
      <span class="language-switcher__flag">🌐</span>
    </button>

    <transition name="fade-slide">
      <div v-if="showDropdown" class="language-switcher__dropdown">
        <div
          v-for="(name, code) in availableLocales"
          :key="code"
          class="language-switcher__option"
          :class="{ 'language-switcher__option--active': code === currentLocale }"
          @click="changeLanguage(code)"
        >
          <span class="language-switcher__option-flag">
            {{ code === 'en' ? '🇺🇸' : code === 'es' ? '🇪🇸' : code === 'fr' ? '🇫🇷' : code === 'de' ? '🇩🇪' : code === 'zh' ? '🇨🇳' : code === 'ja' ? '🇯🇵' : code === 'ko' ? '🇰🇷' : code === 'ru' ? '🇷🇺' : code === 'ar' ? '🇸🇦' : '🌐' }}
          </span>
          <span class="language-switcher__option-name">{{ name }}</span>
          <span class="language-switcher__option-code">{{ code.toUpperCase() }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-block;
}

.language-switcher__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-default);
  width: 40px;
  height: 40px;
  min-width: auto;
}

.language-switcher__trigger:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.3);
}

.language-switcher__flag {
  font-size: 1.2rem;
}


.language-switcher__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--surface-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-medium);
  box-shadow: var(--shadow-large);
  min-width: 160px;
  z-index: 1000;
  overflow: hidden;
}

.language-switcher__option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all var(--transition-default);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.language-switcher__option:last-child {
  border-bottom: none;
}

.language-switcher__option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.language-switcher__option--active {
  background: rgba(var(--primary-color-rgb), 0.15);
  color: var(--primary-color);
}

.language-switcher__option--active .language-switcher__option-name,
.language-switcher__option--active .language-switcher__option-code {
  color: var(--primary-color);
}

.language-switcher__option-flag {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.language-switcher__option-name {
  flex: 1;
  font-weight: var(--font-weight-medium);
  text-align: left;
  color: var(--text-primary);
}

.language-switcher__option-code {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-semibold);
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all var(--transition-default);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .language-switcher__trigger {
    padding: 0.375rem;
    width: 36px;
    height: 36px;
    min-width: auto;
  }
  
  .language-switcher__flag {
    font-size: 1.1rem;
  }
  
  .language-switcher__dropdown {
    right: -50%;
    transform-origin: top right;
  }
}

/* Electron specific styling */
.electron-app .language-switcher__trigger {
  background: rgba(255, 255, 255, 0.05);
}

.electron-app .language-switcher__trigger:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>