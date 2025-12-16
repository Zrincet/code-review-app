import type { CodeIssue } from '../../types';

// 生成唯一ID
function generateId(): string {
  return `java-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// Java 检测规则
const rules = [
  // System.out.println
  {
    pattern: /System\.(out|err)\.(println|print|printf)\s*\(/g,
    message: (match: string) => `发现 ${match.slice(0, -1)} 语句`,
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-sysout',
    suggestion: '生产环境建议使用 Logger 代替 System.out',
  },
  // e.printStackTrace()
  {
    pattern: /\.printStackTrace\s*\(\s*\)/g,
    message: () => '发现 printStackTrace() 调用',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-printstacktrace',
    suggestion: '建议使用 Logger 记录异常信息',
  },
  // 空的 catch 块
  {
    pattern: /catch\s*\([^)]+\)\s*\{\s*\}/g,
    message: () => '发现空的 catch 块',
    severity: 'error' as const,
    type: 'logic' as const,
    rule: 'no-empty-catch',
    suggestion: '至少应该记录异常或重新抛出',
  },
  // 使用 == 比较字符串
  {
    pattern: /String\s+\w+[^;]*==\s*"[^"]*"/g,
    message: () => '使用 == 比较字符串',
    severity: 'error' as const,
    type: 'logic' as const,
    rule: 'string-comparison',
    suggestion: '应该使用 .equals() 方法比较字符串',
  },
  // 魔法数字
  {
    pattern: /(?:return|[=<>+\-*/%])\s*([2-9]\d{2,}|\d{4,})(?![a-zA-Z_0-9LlFfDd])/g,
    message: (match: string) => {
      const num = match.match(/\d+/)?.[0];
      return `发现魔法数字 ${num}`;
    },
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-magic-numbers',
    suggestion: '建议将魔法数字提取为具名常量',
  },
  // 缺少 @Override 注解
  {
    pattern: /(?<!@Override\s*\n\s*)public\s+\w+\s+(equals|hashCode|toString|clone|compareTo)\s*\(/g,
    message: (match: string) => {
      const method = match.match(/(equals|hashCode|toString|clone|compareTo)/)?.[1];
      return `${method}() 方法可能缺少 @Override 注解`;
    },
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'missing-override',
    suggestion: '重写父类方法时应添加 @Override 注解',
  },
  // 使用 new 创建 String
  {
    pattern: /new\s+String\s*\(/g,
    message: () => '使用 new String() 创建字符串',
    severity: 'warning' as const,
    type: 'performance' as const,
    rule: 'avoid-new-string',
    suggestion: '直接使用字符串字面量更高效',
  },
  // 使用 new Boolean/Integer 等
  {
    pattern: /new\s+(Boolean|Integer|Long|Double|Float|Short|Byte|Character)\s*\(/g,
    message: (match: string) => {
      const type = match.match(/new\s+(\w+)/)?.[1];
      return `使用 new ${type}() 创建包装类`;
    },
    severity: 'warning' as const,
    type: 'performance' as const,
    rule: 'avoid-new-wrapper',
    suggestion: '建议使用 valueOf() 方法或自动装箱',
  },
  // TODO/FIXME 注释
  {
    pattern: /\/\/\s*(TODO|FIXME|XXX|HACK):/gi,
    message: (match: string) => {
      const tag = match.match(/(TODO|FIXME|XXX|HACK)/i)?.[1];
      return `发现 ${tag?.toUpperCase()} 注释`;
    },
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-todo',
    suggestion: '请处理或跟踪这些待办事项',
  },
  // 硬编码的密码
  {
    pattern: /(?:password|passwd|pwd|secret|apiKey)\s*=\s*"[^"]+"/gi,
    message: () => '可能存在硬编码的敏感信息',
    severity: 'error' as const,
    type: 'security' as const,
    rule: 'hardcoded-secret',
    suggestion: '建议使用配置文件或环境变量存储敏感信息',
  },
  // 未使用的 import（简化检测）
  {
    pattern: /^import\s+([\w.]+);?\s*$/gm,
    message: () => '可能存在未使用的 import',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'unused-import',
    suggestion: '请确认此 import 是否被使用',
    checkUnused: true,
  },
  // public 字段
  {
    pattern: /public\s+(?!static\s+final|class|interface|enum|abstract)[A-Za-z<>\[\]]+\s+[a-z][a-zA-Z0-9]*\s*[;=]/g,
    message: () => '发现 public 实例字段',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'no-public-field',
    suggestion: '建议使用 private 字段配合 getter/setter',
  },
  // 过长的方法参数列表
  {
    pattern: /\([^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]+\)/g,
    message: () => '方法参数过多',
    severity: 'warning' as const,
    type: 'style' as const,
    rule: 'too-many-parameters',
    suggestion: '建议使用对象封装参数或重构方法',
  },
  // catch Exception
  {
    pattern: /catch\s*\(\s*Exception\s+\w+\s*\)/g,
    message: () => '捕获了通用 Exception',
    severity: 'warning' as const,
    type: 'logic' as const,
    rule: 'catch-generic-exception',
    suggestion: '建议捕获更具体的异常类型',
  },
];

// 检查 import 是否被使用
function isImportUsed(code: string, importPath: string): boolean {
  const className = importPath.split('.').pop() || '';
  // 排除 import 语句本身
  const codeWithoutImports = code.replace(/^import\s+[\w.]+;?\s*$/gm, '');
  return codeWithoutImports.includes(className);
}

// Java 代码检测
export function lintJava(code: string): CodeIssue[] {
  const issues: CodeIssue[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(code)) !== null) {
      // 对于未使用 import 的检查
      if (rule.checkUnused) {
        const importPath = match[1];
        if (importPath && isImportUsed(code, importPath)) {
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

