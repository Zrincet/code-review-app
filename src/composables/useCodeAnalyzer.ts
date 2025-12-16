import { ref, computed } from 'vue';
import type { CodeIssue, ReviewReport, SupportedLanguage } from '../types';
import { checkNaming } from '../utils/rules/naming';
import { lintJavaScript, lintTypeScript } from '../utils/linters/javascript';
import { lintPython } from '../utils/linters/python';
import { lintJava } from '../utils/linters/java';
import { lintGo } from '../utils/linters/go';

export function useCodeAnalyzer() {
  const isAnalyzing = ref(false);
  const report = ref<ReviewReport | null>(null);
  const error = ref<string | null>(null);

  // 根据语言选择对应的 linter
  const getLinter = (language: SupportedLanguage) => {
    const linters: Record<SupportedLanguage, (code: string) => CodeIssue[]> = {
      javascript: lintJavaScript,
      typescript: lintTypeScript,
      python: lintPython,
      java: lintJava,
      go: lintGo,
    };
    return linters[language];
  };

  // 分析代码
  const analyzeCode = async (code: string, language: SupportedLanguage): Promise<ReviewReport> => {
    isAnalyzing.value = true;
    error.value = null;

    try {
      // 模拟异步操作（实际中可能是调用 Web Worker）
      await new Promise(resolve => setTimeout(resolve, 300));

      // 获取对应语言的 linter
      const linter = getLinter(language);
      
      // 执行语言特定的检测
      const lintIssues = linter(code);
      
      // 执行命名规范检测
      const namingIssues = checkNaming(code, language);
      
      // 合并所有问题
      const allIssues = [...lintIssues, ...namingIssues];
      
      // 按行号排序
      allIssues.sort((a, b) => a.line - b.line || a.column - b.column);
      
      // 去重（相同位置和消息的问题）
      const uniqueIssues = allIssues.filter((issue, index, arr) => {
        return index === arr.findIndex(i => 
          i.line === issue.line && 
          i.column === issue.column && 
          i.message === issue.message
        );
      });

      // 生成报告
      const summary = {
        errors: uniqueIssues.filter(i => i.severity === 'error').length,
        warnings: uniqueIssues.filter(i => i.severity === 'warning').length,
        infos: uniqueIssues.filter(i => i.severity === 'info').length,
        hints: uniqueIssues.filter(i => i.severity === 'hint').length,
        total: uniqueIssues.length,
      };

      const reviewReport: ReviewReport = {
        issues: uniqueIssues,
        summary,
        analyzedAt: new Date(),
        language,
        codeLines: code.split('\n').length,
      };

      report.value = reviewReport;
      return reviewReport;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '分析过程中发生错误';
      throw err;
    } finally {
      isAnalyzing.value = false;
    }
  };

  // 清除报告
  const clearReport = () => {
    report.value = null;
    error.value = null;
  };

  // 计算属性：是否有问题
  const hasIssues = computed(() => {
    return (report.value?.summary.total || 0) > 0;
  });

  // 计算属性：是否有严重问题
  const hasCriticalIssues = computed(() => {
    return (report.value?.summary.errors || 0) > 0;
  });

  // 计算属性：问题统计
  const issueStats = computed(() => {
    return report.value?.summary || {
      errors: 0,
      warnings: 0,
      infos: 0,
      hints: 0,
      total: 0,
    };
  });

  // 按类型分组问题
  const issuesByType = computed(() => {
    if (!report.value) return {};
    
    const grouped: Record<string, CodeIssue[]> = {};
    for (const issue of report.value.issues) {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    }
    return grouped;
  });

  // 按严重级别分组问题
  const issuesBySeverity = computed(() => {
    if (!report.value) return {};
    
    const grouped: Record<string, CodeIssue[]> = {};
    for (const issue of report.value.issues) {
      if (!grouped[issue.severity]) {
        grouped[issue.severity] = [];
      }
      grouped[issue.severity].push(issue);
    }
    return grouped;
  });

  return {
    // 状态
    isAnalyzing,
    report,
    error,
    
    // 计算属性
    hasIssues,
    hasCriticalIssues,
    issueStats,
    issuesByType,
    issuesBySeverity,
    
    // 方法
    analyzeCode,
    clearReport,
  };
}

