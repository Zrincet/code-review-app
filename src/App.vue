<script setup lang="ts">
import { ref, computed } from 'vue';
import CodeEditor from './components/CodeEditor.vue';
import LanguageSelect from './components/LanguageSelect.vue';
import ReviewReport from './components/ReviewReport.vue';
import { useCodeAnalyzer } from './composables/useCodeAnalyzer';
import type { SupportedLanguage } from './types';

// 编辑器引用
const editorRef = ref<InstanceType<typeof CodeEditor> | null>(null);

// 代码状态
const code = ref('');
const language = ref<SupportedLanguage>('javascript');

// 代码分析器
const { 
  isAnalyzing, 
  report, 
  analyzeCode, 
  clearReport,
  hasIssues 
} = useCodeAnalyzer();

// 示例代码
const sampleCodes: Record<SupportedLanguage, string> = {
  javascript: `// JavaScript 示例代码
function Calculate_Total(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  console.log("Total: " + total);
  if (total == 0) {
    return 0;
  }
  debugger;
  return total * 1000;
}

const unusedVariable = "hello";
const MyClass = class {};
`,
  typescript: `// TypeScript 示例代码
interface user_data {
  name: string;
  age: any;
}

function Process_User(data: any): void {
  var result = data.name;
  console.log(result);
  // @ts-ignore
  const value = data.value!.something;
  if (result == null) {
    return;
  }
}

const API_KEY = "sk-secret-12345";
`,
  python: `# Python 示例代码
def Calculate_Sum(numbers):
    total = 0
    for num in numbers:
        total = total + num
    print(total)
    return total

def processData(items=[]):
    if items == None:
        return
    except:
        pass
    password = "admin123"
    from module import *

class my_class:
    def __init__():
        pass
`,
  java: `// Java 示例代码
public class user_manager {
    public String userName;
    private static final int MAGIC = 12345;
    
    public void Process_Data(String data, int a, int b, int c, int d, int e, int f) {
        System.out.println(data);
        try {
            // some code
        } catch (Exception e) {
        }
        
        String password = "secret123";
        if (data == "hello") {
            new String("world");
        }
    }
    
    public boolean equals(Object obj) {
        return true;
    }
}
`,
  go: `// Go 示例代码
package main

import (
    "fmt"
    "unused/package"
)

var globalMap map[string]int

func Calculate_Total(items []int) int {
    total := 0
    for _, item := range items {
        total = total + item
    }
    fmt.Println(total)
    
    password := "secret123"
    
    if err != nil {
    }
    
    panic("something went wrong")
    
    return total * 10000
}

type empty_struct struct {
}

func init() {
    // initialization
}
`,
};

// 加载示例代码
const loadSampleCode = () => {
  code.value = sampleCodes[language.value];
  clearReport();
};

// 开始检测
const startAnalysis = async () => {
  if (!code.value.trim()) return;
  await analyzeCode(code.value, language.value);
};

// 清空代码
const clearCode = () => {
  code.value = '';
  clearReport();
};

// 跳转到指定行
const handleGoToLine = (line: number, column: number) => {
  editorRef.value?.goToLine(line, column);
};

// 当前问题列表
const currentIssues = computed(() => report.value?.issues || []);

// 按钮禁用状态
const isAnalyzeDisabled = computed(() => !code.value.trim() || isAnalyzing.value);
</script>

<template>
  <div class="app">
    <!-- 头部 -->
    <header class="header animate-fadeInDown">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <svg viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#logoGradient)"/>
              <path d="M10 16L14 20L22 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="logoGradient" x1="2" y1="2" x2="30" y2="30">
                  <stop stop-color="#2563EB"/>
                  <stop offset="1" stop-color="#3B82F6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="brand">
            <h1 class="brand-name">Code Review</h1>
            <span class="brand-desc">代码审查工具</span>
          </div>
        </div>
        
        <div class="header-actions">
          <LanguageSelect v-model="language" />
          
          <button 
            class="btn btn-secondary"
            @click="loadSampleCode"
          >
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
            </svg>
            加载示例
          </button>
          
          <button 
            class="btn btn-secondary"
            @click="clearCode"
            :disabled="!code"
          >
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            清空
          </button>
          
          <button 
            class="btn btn-primary"
            @click="startAnalysis"
            :disabled="isAnalyzeDisabled"
          >
            <svg v-if="isAnalyzing" class="btn-icon animate-spin" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            {{ isAnalyzing ? '检测中...' : '开始检测' }}
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main">
      <div class="content-wrapper">
        <!-- 编辑器区域 -->
        <section class="editor-section card animate-fadeInUp stagger-1">
          <div class="section-header">
            <h2 class="section-title">代码输入</h2>
            <div class="editor-info">
              <span class="line-count">{{ code.split('\n').length }} 行</span>
              <span class="char-count">{{ code.length }} 字符</span>
            </div>
          </div>
          <div class="editor-wrapper">
            <CodeEditor
              ref="editorRef"
              v-model="code"
              :language="language"
              :issues="currentIssues"
              placeholder="在此粘贴或输入代码进行检测..."
            />
          </div>
        </section>

        <!-- 报告区域 -->
        <section class="report-section card animate-fadeInUp stagger-2">
          <div class="section-header">
            <h2 class="section-title">检测结果</h2>
            <div v-if="report" class="report-badge" :class="{ 'has-issues': hasIssues }">
              {{ hasIssues ? `${report.summary.total} 个问题` : '通过' }}
            </div>
          </div>
          <div class="report-wrapper">
            <ReviewReport
              :report="report"
              :is-analyzing="isAnalyzing"
              @go-to-line="handleGoToLine"
            />
          </div>
        </section>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <p class="footer-text">
        Code Review Tool · 支持 JavaScript, TypeScript, Python, Java, Go
      </p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border-bottom: 1px solid var(--color-gray-100);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.logo {
  width: 40px;
  height: 40px;
}

.logo svg {
  width: 100%;
  height: 100%;
}

.brand {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
  line-height: 1.2;
}

.brand-desc {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 主内容 */
.main {
  flex: 1;
  padding: var(--space-6);
}

.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-6);
  height: calc(100vh - 180px);
  min-height: 500px;
}

/* 区域卡片 */
.editor-section,
.report-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-gray-100);
}

.section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-800);
}

.editor-info {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-gray-400);
  font-family: var(--font-mono);
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.report-wrapper {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.report-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  background: var(--color-success-light);
  color: var(--color-success);
}

.report-badge.has-issues {
  background: var(--color-error-light);
  color: var(--color-error);
}

/* 页脚 */
.footer {
  padding: var(--space-4) var(--space-6);
  text-align: center;
  border-top: 1px solid var(--color-gray-100);
  background: rgba(255, 255, 255, 0.5);
}

.footer-text {
  font-size: var(--text-xs);
  color: var(--color-gray-400);
}

/* 响应式 */
@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
    height: auto;
  }
  
  .editor-section,
  .report-section {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .main {
    padding: var(--space-4);
  }
  
  .content-wrapper {
    gap: var(--space-4);
  }
}
</style>
