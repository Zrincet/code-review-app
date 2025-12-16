<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SupportedLanguage, LanguageConfig } from '../types';

const props = defineProps<{
  modelValue: SupportedLanguage;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SupportedLanguage];
}>();

const isOpen = ref(false);

const languages: LanguageConfig[] = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨', monacoLanguage: 'javascript', fileExtension: '.js' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷', monacoLanguage: 'typescript', fileExtension: '.ts' },
  { id: 'python', label: 'Python', icon: '🐍', monacoLanguage: 'python', fileExtension: '.py' },
  { id: 'java', label: 'Java', icon: '☕', monacoLanguage: 'java', fileExtension: '.java' },
  { id: 'go', label: 'Go', icon: '🐹', monacoLanguage: 'go', fileExtension: '.go' },
];

const selectedLanguage = computed(() => {
  return languages.find(l => l.id === props.modelValue) || languages[0];
});

const selectLanguage = (lang: LanguageConfig) => {
  emit('update:modelValue', lang.id);
  isOpen.value = false;
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="language-select" v-click-outside="closeDropdown">
    <button 
      class="select-trigger"
      @click="toggleDropdown"
      :class="{ 'is-open': isOpen }"
    >
      <span class="language-icon">{{ selectedLanguage.icon }}</span>
      <span class="language-label">{{ selectedLanguage.label }}</span>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <button
          v-for="lang in languages"
          :key="lang.id"
          class="dropdown-item"
          :class="{ 'is-selected': lang.id === modelValue }"
          @click="selectLanguage(lang)"
        >
          <span class="language-icon">{{ lang.icon }}</span>
          <span class="language-label">{{ lang.label }}</span>
          <svg 
            v-if="lang.id === modelValue" 
            class="check-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2.5"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.language-select {
  position: relative;
  z-index: 100;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.select-trigger:hover {
  border-color: var(--color-gray-300);
  background: var(--color-gray-50);
}

.select-trigger.is-open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.language-icon {
  font-size: var(--text-base);
  line-height: 1;
}

.language-label {
  min-width: 80px;
  text-align: left;
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--color-gray-400);
  transition: transform var(--transition-base);
}

.select-trigger.is-open .chevron {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 100%;
  background: var(--color-white);
  border: 1px solid var(--color-gray-100);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-gray-700);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-gray-50);
}

.dropdown-item.is-selected {
  background: var(--color-primary-50);
  color: var(--color-primary);
}

.check-icon {
  width: 16px;
  height: 16px;
  margin-left: auto;
  color: var(--color-primary);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-base);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

