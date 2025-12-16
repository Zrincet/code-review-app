<script setup lang="ts">
import { computed } from 'vue';
import type { CodeIssue } from '../types';

const props = defineProps<{
  issue: CodeIssue;
  index: number;
}>();

const emit = defineEmits<{
  'go-to-line': [line: number, column: number];
}>();

const severityConfig = {
  error: { label: '错误', icon: '✕', class: 'severity-error' },
  warning: { label: '警告', icon: '⚠', class: 'severity-warning' },
  info: { label: '信息', icon: 'ℹ', class: 'severity-info' },
  hint: { label: '提示', icon: '💡', class: 'severity-hint' },
};

const typeLabels: Record<string, string> = {
  naming: '命名规范',
  syntax: '语法问题',
  style: '代码风格',
  logic: '逻辑问题',
  performance: '性能问题',
  security: '安全问题',
};

const config = computed(() => severityConfig[props.issue.severity]);
const typeLabel = computed(() => typeLabels[props.issue.type] || props.issue.type);

const handleClick = () => {
  emit('go-to-line', props.issue.line, props.issue.column);
};
</script>

<template>
  <div 
    class="issue-item"
    :class="config.class"
    :style="{ animationDelay: `${index * 30}ms` }"
    @click="handleClick"
  >
    <div class="issue-header">
      <span class="severity-badge" :class="config.class">
        <span class="severity-icon">{{ config.icon }}</span>
        <span class="severity-label">{{ config.label }}</span>
      </span>
      <span class="issue-type">{{ typeLabel }}</span>
      <span class="issue-location">
        行 {{ issue.line }}:{{ issue.column }}
      </span>
    </div>
    
    <div class="issue-message">{{ issue.message }}</div>
    
    <div v-if="issue.suggestion" class="issue-suggestion">
      <span class="suggestion-icon">💡</span>
      <span class="suggestion-text">{{ issue.suggestion }}</span>
    </div>
    
    <div v-if="issue.fixedCode" class="issue-fix">
      <span class="fix-label">建议修改为:</span>
      <code class="fix-code">{{ issue.fixedCode }}</code>
    </div>
    
    <div class="issue-rule">
      <span class="rule-label">规则:</span>
      <code class="rule-name">{{ issue.rule }}</code>
    </div>
  </div>
</template>

<style scoped>
.issue-item {
  padding: var(--space-4);
  background: var(--color-white);
  border-radius: var(--radius-md);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base);
  animation: issueSlideIn 0.3s ease-out forwards;
}

@keyframes issueSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.issue-item:hover {
  background: var(--color-gray-50);
  transform: translateX(4px);
}

.issue-item.severity-error {
  border-left-color: var(--color-error);
}

.issue-item.severity-warning {
  border-left-color: var(--color-warning);
}

.issue-item.severity-info {
  border-left-color: var(--color-primary);
}

.issue-item.severity-hint {
  border-left-color: var(--color-gray-400);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.severity-badge.severity-error {
  background: var(--color-error-light);
  color: var(--color-error);
}

.severity-badge.severity-warning {
  background: var(--color-warning-light);
  color: #b45309;
}

.severity-badge.severity-info {
  background: var(--color-primary-100);
  color: var(--color-primary);
}

.severity-badge.severity-hint {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}

.severity-icon {
  font-size: 10px;
}

.issue-type {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  padding: 2px var(--space-2);
  background: var(--color-gray-100);
  border-radius: var(--radius-sm);
}

.issue-location {
  font-size: var(--text-xs);
  color: var(--color-gray-400);
  font-family: var(--font-mono);
  margin-left: auto;
}

.issue-message {
  font-size: var(--text-sm);
  color: var(--color-gray-800);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-3);
}

.issue-suggestion {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-primary-50);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.suggestion-icon {
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.suggestion-text {
  font-size: var(--text-sm);
  color: var(--color-primary-dark);
  line-height: var(--leading-normal);
}

.issue-fix {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-success-light);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.fix-label {
  font-size: var(--text-xs);
  color: var(--color-success);
  font-weight: var(--font-medium);
}

.fix-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: #065f46;
  background: transparent;
  padding: 0;
}

.issue-rule {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rule-label {
  font-size: var(--text-xs);
  color: var(--color-gray-400);
}

.rule-name {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  background: var(--color-gray-100);
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
}
</style>

