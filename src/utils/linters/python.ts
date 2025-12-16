import type { CodeIssue } from '../../types';

// 生成唯一ID
function generateId(): string {
  return `py-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// Python 检测规则
const rules = [
  // print 语句（可能需要移除）
  {
    pattern: /\bprint\s*\(/g,
    message: () => '发现 print() 语句',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-print',
    suggestion: '生产环境建议使用 logging 模块代替 print',
  },
  // 使用 == True 或 == False
  {
    pattern: /==\s*(True|False)\b/g,
    message: (match: string) => `不必要的布尔值比较: ${match}`,
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'simplify-boolean',
    suggestion: '直接使用变量或 not 操作符',
  },
  // 使用 == None
  {
    pattern: /==\s*None\b/g,
    message: () => '使用 == None 进行比较',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'use-is-none',
    suggestion: '建议使用 is None 代替 == None',
  },
  // 使用 != None
  {
    pattern: /!=\s*None\b/g,
    message: () => '使用 != None 进行比较',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'use-is-not-none',
    suggestion: '建议使用 is not None 代替 != None',
  },
  // except 不带异常类型
  {
    pattern: /except\s*:/g,
    message: () => '捕获了所有异常',
    severity: 'warning' as const,
    type: 'logic' as const,
    rule: 'bare-except',
    suggestion: '建议指定具体的异常类型，至少使用 except Exception:',
  },
  // 使用 eval
  {
    pattern: /\beval\s*\(/g,
    message: () => '使用了 eval() 函数',
    severity: 'error' as const,
    type: 'security' as const,
    rule: 'no-eval',
    suggestion: 'eval 存在安全风险，建议避免使用',
  },
  // 使用 exec
  {
    pattern: /\bexec\s*\(/g,
    message: () => '使用了 exec() 函数',
    severity: 'error' as const,
    type: 'security' as const,
    rule: 'no-exec',
    suggestion: 'exec 存在安全风险，建议避免使用',
  },
  // 行过长（超过79字符，PEP 8）
  {
    pattern: /^.{80,}$/gm,
    message: () => '行长度超过 79 字符',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'line-too-long',
    suggestion: '根据 PEP 8 规范，建议每行不超过 79 字符',
  },
  // 使用 from xxx import *
  {
    pattern: /from\s+\S+\s+import\s+\*/g,
    message: () => '使用了通配符导入',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-wildcard-import',
    suggestion: '建议显式导入所需的名称',
  },
  // 使用可变默认参数
  {
    pattern: /def\s+\w+\s*\([^)]*=\s*(\[\]|\{\})/g,
    message: () => '使用可变对象作为默认参数',
    severity: 'error' as const,
    type: 'logic' as const,
    rule: 'mutable-default-argument',
    suggestion: '建议使用 None 作为默认值，并在函数内部初始化',
  },
  // 类方法缺少 self
  {
    pattern: /def\s+\w+\s*\(\s*\)\s*:/g,
    message: () => '类方法可能缺少 self 参数',
    severity: 'info' as const,
    type: 'syntax' as const,
    rule: 'missing-self',
    suggestion: '如果这是类方法，请添加 self 参数',
  },
  // TODO/FIXME 注释
  {
    pattern: /#\s*(TODO|FIXME|XXX|HACK):/gi,
    message: (match: string) => {
      const tag = match.match(/(TODO|FIXME|XXX|HACK)/i)?.[1];
      return `发现 ${tag?.toUpperCase()} 注释`;
    },
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-todo',
    suggestion: '请处理或跟踪这些待办事项',
  },
  // pass 语句（可能是占位符）
  {
    pattern: /^\s*pass\s*$/gm,
    message: () => '发现 pass 语句',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-pass',
    suggestion: '如果是占位符，请记得实现具体逻辑',
  },
  // 硬编码的密码或密钥模式
  {
    pattern: /(?:password|passwd|pwd|secret|api_key|apikey)\s*=\s*['"]\w+['"]/gi,
    message: () => '可能存在硬编码的敏感信息',
    severity: 'error' as const,
    type: 'security' as const,
    rule: 'hardcoded-secret',
    suggestion: '建议使用环境变量或配置文件存储敏感信息',
  },
  // 空的 if/for/while 体
  {
    pattern: /(?:if|for|while)\s+[^:]+:\s*\n\s*(?:pass|\.\.\.)\s*$/gm,
    message: () => '发现空的控制结构体',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'empty-block',
    suggestion: '请添加具体的实现逻辑',
  },
];

// Python 代码检测
export function lintPython(code: string): CodeIssue[] {
  const issues: CodeIssue[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(code)) !== null) {
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

  // 检查缩进一致性
  const indentIssues = checkIndentation(code);
  issues.push(...indentIssues);

  return issues;
}

// 检查缩进一致性
function checkIndentation(code: string): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = code.split('\n');
  let usesSpaces = false;
  let usesTabs = false;

  lines.forEach((line, index) => {
    const leadingWhitespace = line.match(/^[\t ]*/)?.[0] || '';
    
    if (leadingWhitespace.includes(' ')) usesSpaces = true;
    if (leadingWhitespace.includes('\t')) usesTabs = true;

    // 检测混合缩进
    if (leadingWhitespace.includes(' ') && leadingWhitespace.includes('\t')) {
      issues.push({
        id: generateId(),
        line: index + 1,
        column: 1,
        message: '混合使用了空格和制表符缩进',
        severity: 'error',
        type: 'style',
        rule: 'mixed-indentation',
        suggestion: '建议统一使用 4 个空格进行缩进（PEP 8）',
      });
    }
  });

  // 整体检查是否混用
  if (usesSpaces && usesTabs) {
    issues.push({
      id: generateId(),
      line: 1,
      column: 1,
      message: '文件中同时使用了空格和制表符缩进',
      severity: 'warning',
      type: 'style',
      rule: 'inconsistent-indentation',
      suggestion: '建议统一缩进风格，推荐使用 4 个空格（PEP 8）',
    });
  }

  return issues;
}

