import type { CodeIssue } from '../../types';

// 生成唯一ID
function generateId(): string {
  return `go-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// Go 检测规则
const rules = [
  // fmt.Println
  {
    pattern: /fmt\.(Println|Printf|Print|Sprintf)\s*\(/g,
    message: (match: string) => `发现 ${match.slice(0, -1)} 调用`,
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-fmt-print',
    suggestion: '生产环境建议使用结构化日志库（如 zap、logrus）',
  },
  // panic
  {
    pattern: /\bpanic\s*\(/g,
    message: () => '发现 panic() 调用',
    severity: 'warning' as const,
    type: 'logic' as const,
    rule: 'no-panic',
    suggestion: '建议返回 error 而不是 panic',
  },
  // 忽略错误返回值
  {
    pattern: /,\s*_\s*:?=\s*\w+\s*\([^)]*\)/g,
    message: () => '可能忽略了错误返回值',
    severity: 'warning' as const,
    type: 'logic' as const,
    rule: 'no-ignored-error',
    suggestion: '请确保正确处理错误',
  },
  // 空的 if err != nil 块
  {
    pattern: /if\s+err\s*!=\s*nil\s*\{\s*\}/g,
    message: () => '发现空的错误处理块',
    severity: 'error' as const,
    type: 'logic' as const,
    rule: 'no-empty-error-handling',
    suggestion: '请添加错误处理逻辑',
  },
  // 使用 new() 而不是 &Type{}
  {
    pattern: /new\s*\(\s*[A-Z][a-zA-Z0-9]*\s*\)/g,
    message: () => '使用 new() 创建结构体',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'prefer-literal',
    suggestion: '建议使用 &Type{} 字面量语法，更加清晰',
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
    pattern: /(?:password|passwd|secret|apiKey|token)\s*:?=\s*"[^"]+"/gi,
    message: () => '可能存在硬编码的敏感信息',
    severity: 'error' as const,
    type: 'security' as const,
    rule: 'hardcoded-secret',
    suggestion: '建议使用环境变量或配置文件存储敏感信息',
  },
  // 导出函数缺少注释
  {
    pattern: /^func\s+([A-Z][a-zA-Z0-9]*)\s*\(/gm,
    message: (match: string) => {
      const funcName = match.match(/func\s+([A-Z][a-zA-Z0-9]*)/)?.[1];
      return `导出函数 ${funcName} 可能缺少文档注释`;
    },
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'exported-function-comment',
    suggestion: '根据 Go 惯例，导出的函数应该有文档注释',
    checkComment: true,
  },
  // 使用 map 字面量但未初始化
  {
    pattern: /var\s+\w+\s+map\[[^\]]+\][^\n]*(?!\s*=)/g,
    message: () => 'map 变量声明但未初始化',
    severity: 'warning' as const,
    type: 'logic' as const,
    rule: 'uninitialized-map',
    suggestion: '使用 make() 初始化 map 或使用字面量语法',
  },
  // 过长的行
  {
    pattern: /^.{120,}$/gm,
    message: () => '行长度超过 120 字符',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'line-too-long',
    suggestion: '建议拆分为多行以提高可读性',
  },
  // 空的 struct
  {
    pattern: /type\s+\w+\s+struct\s*\{\s*\}/g,
    message: () => '发现空的 struct 定义',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'empty-struct',
    suggestion: '如果是占位符，请添加字段或注释',
  },
  // 魔法数字
  {
    pattern: /(?:return|[=<>+\-*/%])\s*([2-9]\d{2,}|\d{4,})(?![a-zA-Z_0-9])/g,
    message: (match: string) => {
      const num = match.match(/\d+/)?.[0];
      return `发现魔法数字 ${num}`;
    },
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'no-magic-numbers',
    suggestion: '建议将魔法数字提取为具名常量',
  },
  // init 函数（可能有副作用）
  {
    pattern: /^func\s+init\s*\(\s*\)/gm,
    message: () => '发现 init() 函数',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'init-function',
    suggestion: 'init() 函数可能导致难以追踪的副作用，请谨慎使用',
  },
  // 未使用的 import（简化检测）
  {
    pattern: /"([a-zA-Z0-9_/.-]+)"/g,
    message: () => '可能存在未使用的 import',
    severity: 'info' as const,
    type: 'style' as const,
    rule: 'unused-import',
    suggestion: '请确认此 import 是否被使用',
    inImportBlock: true,
  },
];

// 检查函数是否有注释
function hasComment(code: string, funcIndex: number): boolean {
  const beforeFunc = code.substring(0, funcIndex);
  const lines = beforeFunc.split('\n');
  const lastLine = lines[lines.length - 1];
  const secondLastLine = lines[lines.length - 2] || '';
  
  return lastLine.trim().startsWith('//') || 
         secondLastLine.trim().startsWith('//') ||
         lastLine.includes('*/');
}

// Go 代码检测
export function lintGo(code: string): CodeIssue[] {
  const issues: CodeIssue[] = [];

  // 检查是否在 import 块中
  const importBlockMatch = code.match(/import\s*\(\s*([\s\S]*?)\s*\)/);
  const importBlockContent = importBlockMatch?.[1] || '';
  const importBlockStart = importBlockMatch?.index || 0;

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(code)) !== null) {
      // 检查导出函数是否有注释
      if (rule.checkComment && hasComment(code, match.index)) {
        continue;
      }

      // 只在 import 块中检测未使用的 import
      if (rule.inImportBlock) {
        if (match.index < importBlockStart || 
            match.index > importBlockStart + (importBlockMatch?.[0]?.length || 0)) {
          continue;
        }
        const importPath = match[1];
        const packageName = importPath.split('/').pop() || '';
        // 简单检查包名是否在代码中使用
        const codeWithoutImports = code.replace(/import\s*\([\s\S]*?\)/, '');
        if (codeWithoutImports.includes(packageName + '.')) {
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

