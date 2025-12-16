import type { CodeIssue } from '../../types';

// 生成唯一ID
function generateId(): string {
  return `js-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 获取行号
function getLineNumber(code: string, index: number): number {
  return code.substring(0, index).split('\n').length;
}

// 获取列号
function getColumnNumber(code: string, index: number): number {
  const lines = code.substring(0, index).split('\n');
  return (lines[lines.length - 1]?.length || 0) + 1;
}

// 检测规则
const rules = [
  // console 语句检测
  {
    pattern: /console\.(log|warn|error|info|debug)\s*\(/g,
    message: (match: string) => `发现 ${match.slice(0, -1)} 语句，生产环境应移除`,
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-console',
    suggestion: '建议在生产环境中移除 console 语句，或使用专门的日志库',
  },
  // debugger 语句
  {
    pattern: /\bdebugger\b/g,
    message: () => '发现 debugger 语句',
    severity: 'error' as const,
    type: 'style' as const,
    rule: 'no-debugger',
    suggestion: '请移除 debugger 语句',
  },
  // 使用 var 声明
  {
    pattern: /\bvar\s+[a-zA-Z_$]/g,
    message: () => '使用 var 声明变量',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-var',
    suggestion: '建议使用 let 或 const 代替 var',
  },
  // 使用 == 或 != 进行比较
  {
    pattern: /[^=!<>]==[^=]|[^=!]!=[^=]/g,
    message: () => '使用 == 或 != 进行比较',
    severity: 'warning' as const,
    type: 'logic' as const,
    rule: 'eqeqeq',
    suggestion: '建议使用 === 或 !== 进行严格比较',
  },
  // 魔法数字
  {
    pattern: /(?<![a-zA-Z_$0-9])(?:return|[=<>+\-*/%&|^])\s*([2-9]\d{2,}|\d{4,})(?![a-zA-Z_$0-9])/g,
    message: (match: string) => {
      const num = match.match(/\d+/)?.[0];
      return `发现魔法数字 ${num}`;
    },
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-magic-numbers',
    suggestion: '建议将魔法数字提取为具名常量',
  },
  // alert 语句
  {
    pattern: /\balert\s*\(/g,
    message: () => '发现 alert() 调用',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-alert',
    suggestion: '建议使用自定义模态框代替 alert',
  },
  // eval 使用
  {
    pattern: /\beval\s*\(/g,
    message: () => '发现 eval() 调用',
    severity: 'error' as const,
    type: 'security' as const,
    rule: 'no-eval',
    suggestion: 'eval 存在安全风险，建议避免使用',
  },
  // with 语句
  {
    pattern: /\bwith\s*\(/g,
    message: () => '发现 with 语句',
    severity: 'error' as const,
    type: 'syntax' as const,
    rule: 'no-with',
    suggestion: 'with 语句已被弃用，建议避免使用',
  },
  // 空函数体
  {
    pattern: /(?:function[^{]*|=>)\s*\{\s*\}/g,
    message: () => '发现空函数体',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-empty-function',
    suggestion: '如果函数确实不需要实现，建议添加注释说明',
  },
  // 重复的 if-else 分支
  {
    pattern: /if\s*\([^)]+\)\s*\{([^{}]*)\}\s*else\s*\{\s*\1\s*\}/g,
    message: () => '发现重复的 if-else 分支',
    severity: 'warning' as const,
    type: 'logic' as const,
    rule: 'no-duplicate-branch',
    suggestion: '两个分支代码相同，可以简化逻辑',
  },
  // 未使用的变量声明（简化检测）
  {
    pattern: /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*[^;]+;\s*$/gm,
    message: (match: string) => {
      const varName = match.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)?.[1];
      return `变量 "${varName}" 可能未被使用`;
    },
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-unused-vars',
    suggestion: '如果变量确实未使用，建议移除',
    checkUnused: true,
  },
  // 箭头函数体可以简化
  {
    pattern: /=>\s*\{\s*return\s+([^;{}]+);\s*\}/g,
    message: () => '箭头函数体可以简化',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'arrow-body-style',
    suggestion: '可以移除花括号和 return 关键字',
  },
  // 多余的分号
  {
    pattern: /;{2,}/g,
    message: () => '发现多余的分号',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-extra-semi',
    suggestion: '移除多余的分号',
  },
  // 字符串使用双引号（建议单引号）
  {
    pattern: /"[^"\\]*(?:\\.[^"\\]*)*"/g,
    message: () => '字符串使用了双引号',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'quotes',
    suggestion: '建议统一使用单引号',
  },
];

// 检查未使用变量的辅助函数
function isVariableUsed(code: string, varName: string, declarationIndex: number): boolean {
  const afterDeclaration = code.substring(declarationIndex);
  const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
  const matches = afterDeclaration.match(usagePattern);
  // 如果只出现一次（即声明本身），则认为未使用
  return (matches?.length || 0) > 1;
}

// JavaScript/TypeScript 代码检测
export function lintJavaScript(code: string): CodeIssue[] {
  const issues: CodeIssue[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(code)) !== null) {
      // 对于未使用变量的检查，需要额外验证
      if (rule.checkUnused) {
        const varName = match[0].match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)?.[1];
        if (varName && isVariableUsed(code, varName, match.index)) {
          continue;
        }
      }

      const line = getLineNumber(code, match.index);
      const column = getColumnNumber(code, match.index);

      issues.push({
        id: generateId(),
        line,
        column,
        endLine: line,
        endColumn: column + match[0].length,
        message: rule.message(match[0]),
        severity: rule.severity,
        type: rule.type,
        rule: rule.rule,
        suggestion: rule.suggestion,
      });
    }
  }

  return issues;
}

// TypeScript 特定检测（基于 JavaScript 规则扩展）
export function lintTypeScript(code: string): CodeIssue[] {
  const issues = lintJavaScript(code);

  // TypeScript 特定规则
  const tsRules = [
    // 使用 any 类型
    {
      pattern: /:\s*any\b/g,
      message: () => '使用了 any 类型',
      severity: 'warning' as const,
      type: 'style' as const,
      rule: 'no-explicit-any',
      suggestion: '建议使用更具体的类型定义',
    },
    // 非空断言
    {
      pattern: /!\./g,
      message: () => '使用了非空断言操作符 (!.)',
      severity: 'info' as const,
      type: 'style' as const,
      rule: 'no-non-null-assertion',
      suggestion: '建议使用可选链 (?.) 或进行空值检查',
    },
    // @ts-ignore
    {
      pattern: /@ts-ignore/g,
      message: () => '使用了 @ts-ignore',
      severity: 'warning' as const,
      type: 'style' as const,
      rule: 'no-ts-ignore',
      suggestion: '建议修复类型错误而不是忽略它',
    },
    // 类型断言使用 as any
    {
      pattern: /as\s+any\b/g,
      message: () => '使用了 as any 类型断言',
      severity: 'warning' as const,
      type: 'style' as const,
      rule: 'no-as-any',
      suggestion: '建议使用更具体的类型断言',
    },
  ];

  for (const rule of tsRules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(code)) !== null) {
      const line = getLineNumber(code, match.index);
      const column = getColumnNumber(code, match.index);

      issues.push({
        id: generateId(),
        line,
        column,
        message: rule.message(),
        severity: rule.severity,
        type: rule.type,
        rule: rule.rule,
        suggestion: rule.suggestion,
      });
    }
  }

  return issues;
}

