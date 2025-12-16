<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import type { SupportedLanguage, CodeIssue } from '../types';

const props = defineProps<{
  modelValue: string;
  language: SupportedLanguage;
  issues?: CodeIssue[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'cursor-change': [position: { line: number; column: number }];
}>();

const editorContainer = ref<HTMLElement | null>(null);
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const decorations = ref<string[]>([]);

// Monaco 语言映射
const languageMap: Record<SupportedLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  go: 'go',
};

// 自定义编辑器主题
const defineCustomTheme = () => {
  monaco.editor.defineTheme('code-review-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'keyword', foreground: '2563EB', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: 'D97706' },
      { token: 'type', foreground: '7C3AED' },
      { token: 'function', foreground: '0891B2' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#1E293B',
      'editor.lineHighlightBackground': '#F1F5F9',
      'editor.selectionBackground': '#DBEAFE',
      'editor.inactiveSelectionBackground': '#E2E8F0',
      'editorLineNumber.foreground': '#94A3B8',
      'editorLineNumber.activeForeground': '#475569',
      'editorCursor.foreground': '#2563EB',
      'editor.selectionHighlightBackground': '#BFDBFE50',
      'editorBracketMatch.background': '#DBEAFE',
      'editorBracketMatch.border': '#3B82F6',
      'editorGutter.background': '#FAFAFA',
      'editorError.foreground': '#EF4444',
      'editorWarning.foreground': '#F59E0B',
      'editorInfo.foreground': '#3B82F6',
    },
  });
};

// 初始化编辑器
const initEditor = () => {
  if (!editorContainer.value) return;

  defineCustomTheme();

  editor.value = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: languageMap[props.language],
    theme: 'code-review-light',
    fontSize: 14,
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
    fontLigatures: true,
    lineHeight: 22,
    padding: { top: 16, bottom: 16 },
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'all',
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
  });

  // 监听内容变化
  editor.value.onDidChangeModelContent(() => {
    const value = editor.value?.getValue() || '';
    emit('update:modelValue', value);
  });

  // 监听光标位置变化
  editor.value.onDidChangeCursorPosition((e) => {
    emit('cursor-change', {
      line: e.position.lineNumber,
      column: e.position.column,
    });
  });
};

// 更新问题标记
const updateDecorations = () => {
  if (!editor.value || !props.issues) return;

  const model = editor.value.getModel();
  if (!model) return;

  const newDecorations: monaco.editor.IModelDeltaDecoration[] = props.issues.map(issue => {
    const severityClass = {
      error: 'issue-error',
      warning: 'issue-warning',
      info: 'issue-info',
      hint: 'issue-hint',
    }[issue.severity];

    const glyphClass = {
      error: 'glyph-error',
      warning: 'glyph-warning',
      info: 'glyph-info',
      hint: 'glyph-hint',
    }[issue.severity];

    return {
      range: new monaco.Range(
        issue.line,
        issue.column,
        issue.endLine || issue.line,
        issue.endColumn || issue.column + 1
      ),
      options: {
        isWholeLine: false,
        className: severityClass,
        glyphMarginClassName: glyphClass,
        hoverMessage: {
          value: `**${issue.severity.toUpperCase()}**: ${issue.message}\n\n${issue.suggestion || ''}`,
        },
        overviewRuler: {
          color: {
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
            hint: '#64748B',
          }[issue.severity],
          position: monaco.editor.OverviewRulerLane.Right,
        },
      },
    };
  });

  // 添加行高亮
  const lineDecorations: monaco.editor.IModelDeltaDecoration[] = props.issues.map(issue => ({
    range: new monaco.Range(issue.line, 1, issue.line, 1),
    options: {
      isWholeLine: true,
      className: `line-${issue.severity}`,
    },
  }));

  decorations.value = editor.value.deltaDecorations(
    decorations.value,
    [...newDecorations, ...lineDecorations]
  );
};

// 跳转到指定行
const goToLine = (line: number, column: number = 1) => {
  if (!editor.value) return;
  
  editor.value.revealLineInCenter(line);
  editor.value.setPosition({ lineNumber: line, column });
  editor.value.focus();
};

// 暴露方法给父组件
defineExpose({
  goToLine,
  focus: () => editor.value?.focus(),
  getEditor: () => editor.value,
});

// 监听语言变化
watch(() => props.language, (newLang) => {
  if (editor.value) {
    const model = editor.value.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, languageMap[newLang]);
    }
  }
});

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getValue() !== newValue) {
    editor.value.setValue(newValue);
  }
});

// 监听问题变化
watch(() => props.issues, () => {
  updateDecorations();
}, { deep: true });

onMounted(() => {
  initEditor();
});

onUnmounted(() => {
  editor.value?.dispose();
});
</script>

<template>
  <div class="code-editor-wrapper">
    <div ref="editorContainer" class="editor-container"></div>
    <div v-if="!modelValue" class="placeholder">
      {{ placeholder || '在此粘贴或输入代码...' }}
    </div>
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-white);
}

.editor-container {
  width: 100%;
  height: 100%;
}

.placeholder {
  position: absolute;
  top: 16px;
  left: 64px;
  color: var(--color-gray-400);
  font-size: var(--text-sm);
  pointer-events: none;
  font-family: var(--font-mono);
}
</style>

<style>
/* 全局样式 - 问题高亮 */
.issue-error {
  background: rgba(239, 68, 68, 0.15);
  border-bottom: 2px wavy #EF4444;
}

.issue-warning {
  background: rgba(245, 158, 11, 0.1);
  border-bottom: 2px wavy #F59E0B;
}

.issue-info {
  background: rgba(59, 130, 246, 0.08);
  border-bottom: 2px dotted #3B82F6;
}

.issue-hint {
  border-bottom: 1px dotted #94A3B8;
}

/* 行高亮 */
.line-error {
  background: rgba(239, 68, 68, 0.06) !important;
}

.line-warning {
  background: rgba(245, 158, 11, 0.05) !important;
}

.line-info {
  background: rgba(59, 130, 246, 0.04) !important;
}

/* Glyph 图标 */
.glyph-error {
  background: #EF4444;
  border-radius: 50%;
  margin-left: 4px;
  width: 8px !important;
  height: 8px !important;
}

.glyph-warning {
  background: #F59E0B;
  border-radius: 50%;
  margin-left: 4px;
  width: 8px !important;
  height: 8px !important;
}

.glyph-info {
  background: #3B82F6;
  border-radius: 50%;
  margin-left: 4px;
  width: 6px !important;
  height: 6px !important;
}

.glyph-hint {
  background: #94A3B8;
  border-radius: 50%;
  margin-left: 4px;
  width: 6px !important;
  height: 6px !important;
}
</style>

