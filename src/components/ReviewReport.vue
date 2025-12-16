<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ReviewReport, CodeIssue } from '../types';
import IssueItem from './IssueItem.vue';

const props = defineProps<{
  report: ReviewReport | null;
  isAnalyzing: boolean;
}>();

const emit = defineEmits<{
  'go-to-line': [line: number, column: number];
}>();

// 过滤器
const activeFilter = ref<'all' | 'error' | 'warning' | 'info'>('all');

const filteredIssues = computed(() => {
  if (!props.report) return [];
  if (activeFilter.value === 'all') return props.report.issues;
  return props.report.issues.filter(i => i.severity === activeFilter.value);
});

const setFilter = (filter: 'all' | 'error' | 'warning' | 'info') => {
  activeFilter.value = filter;
};

const handleGoToLine = (line: number, column: number) => {
  emit('go-to-line', line, column);
};

// 格式化时间
const formatTime = (date: Date | string) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
</script>

<template>
  <div class="review-report">
    <!-- 加载状态 -->
    <div v-if="isAnalyzing" class="loading-state">
      <div class="loading-spinner"></div>
      <span class="loading-text">正在分析代码...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!report" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      </div>
      <h3 class="empty-title">准备就绪</h3>
      <p class="empty-desc">粘贴代码后点击"开始检测"按钮</p>
    </div>

    <!-- 报告内容 -->
    <template v-else>
      <!-- 摘要统计 -->
      <div class="report-summary animate-fadeInDown">
        <div class="summary-header">
          <h3 class="summary-title">检测报告</h3>
          <span class="summary-time">{{ formatTime(report.analyzedAt) }}</span>
        </div>
        
        <div class="summary-stats">
          <div 
            class="stat-item" 
            :class="{ 'is-active': activeFilter === 'all' }"
            @click="setFilter('all')"
          >
            <span class="stat-value">{{ report.summary.total }}</span>
            <span class="stat-label">总计</span>
          </div>
          <div 
            class="stat-item stat-error" 
            :class="{ 'is-active': activeFilter === 'error' }"
            @click="setFilter('error')"
          >
            <span class="stat-value">{{ report.summary.errors }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div 
            class="stat-item stat-warning" 
            :class="{ 'is-active': activeFilter === 'warning' }"
            @click="setFilter('warning')"
          >
            <span class="stat-value">{{ report.summary.warnings }}</span>
            <span class="stat-label">警告</span>
          </div>
          <div 
            class="stat-item stat-info" 
            :class="{ 'is-active': activeFilter === 'info' }"
            @click="setFilter('info')"
          >
            <span class="stat-value">{{ report.summary.infos + report.summary.hints }}</span>
            <span class="stat-label">提示</span>
          </div>
        </div>

        <!-- 无问题状态 -->
        <div v-if="report.summary.total === 0" class="success-state">
          <div class="success-icon">✓</div>
          <span class="success-text">代码检测通过，未发现问题</span>
        </div>
      </div>

      <!-- 问题列表 -->
      <div v-if="filteredIssues.length > 0" class="issues-list">
        <div class="issues-header">
          <span class="issues-count">
            {{ filteredIssues.length }} 个
            {{ activeFilter === 'all' ? '问题' : activeFilter === 'error' ? '错误' : activeFilter === 'warning' ? '警告' : '提示' }}
          </span>
        </div>
        
        <div class="issues-content">
          <IssueItem
            v-for="(issue, index) in filteredIssues"
            :key="issue.id"
            :issue="issue"
            :index="index"
            @go-to-line="handleGoToLine"
          />
        </div>
      </div>

      <!-- 过滤后无结果 -->
      <div v-else-if="report.summary.total > 0" class="filter-empty">
        <span class="filter-empty-text">
          没有找到{{ activeFilter === 'error' ? '错误' : activeFilter === 'warning' ? '警告' : '提示' }}类型的问题
        </span>
        <button class="filter-reset" @click="setFilter('all')">
          查看全部问题
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.review-report {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  min-height: 0;
}

/* 加载状态 */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--color-gray-300);
  margin-bottom: var(--space-4);
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.empty-desc {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
}

/* 报告摘要 */
.report-summary {
  padding: var(--space-5);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-100);
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.summary-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-800);
}

.summary-time {
  font-size: var(--text-xs);
  color: var(--color-gray-400);
  font-family: var(--font-mono);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3);
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
}

.stat-item:hover {
  background: var(--color-gray-100);
}

.stat-item.is-active {
  background: var(--color-primary-50);
  border-color: var(--color-primary-200);
}

.stat-item.stat-error .stat-value {
  color: var(--color-error);
}

.stat-item.stat-warning .stat-value {
  color: var(--color-warning);
}

.stat-item.stat-info .stat-value {
  color: var(--color-primary);
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-gray-800);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

/* 成功状态 */
.success-state {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-success-light);
  border-radius: var(--radius-md);
  margin-top: var(--space-4);
}

.success-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
}

.success-text {
  font-size: var(--text-sm);
  color: var(--color-success);
  font-weight: var(--font-medium);
}

/* 问题列表 */
.issues-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.issues-header {
  padding: var(--space-3) var(--space-5);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-100);
}

.issues-count {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  font-weight: var(--font-medium);
}

.issues-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* 过滤后无结果 */
.filter-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-8);
}

.filter-empty-text {
  font-size: var(--text-sm);
  color: var(--color-gray-500);
}

.filter-reset {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.filter-reset:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-200);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

