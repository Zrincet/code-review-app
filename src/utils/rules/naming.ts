import type { CodeIssue, SupportedLanguage } from '../../types';

// 命名规范模式
const patterns = {
  // camelCase: 首字母小写，后续单词首字母大写
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  // PascalCase: 每个单词首字母大写
  pascalCase: /^[A-Z][a-zA-Z0-9]*$/,
  // snake_case: 小写字母，单词用下划线分隔
  snakeCase: /^[a-z][a-z0-9_]*$/,
  // SCREAMING_SNAKE_CASE: 大写字母，单词用下划线分隔
  screamingSnakeCase: /^[A-Z][A-Z0-9_]*$/,
  // kebab-case: 小写字母，单词用连字符分隔
  kebabCase: /^[a-z][a-z0-9-]*$/,
};

// 语言特定的命名规则
const languageNamingRules: Record<SupportedLanguage, {
  variable: RegExp;
  function: RegExp;
  class: RegExp;
  constant: RegExp;
  variableStyle: string;
  functionStyle: string;
  classStyle: string;
  constantStyle: string;
}> = {
  javascript: {
    variable: patterns.camelCase,
    function: patterns.camelCase,
    class: patterns.pascalCase,
    constant: patterns.screamingSnakeCase,
    variableStyle: 'camelCase',
    functionStyle: 'camelCase',
    classStyle: 'PascalCase',
    constantStyle: 'SCREAMING_SNAKE_CASE',
  },
  typescript: {
    variable: patterns.camelCase,
    function: patterns.camelCase,
    class: patterns.pascalCase,
    constant: patterns.screamingSnakeCase,
    variableStyle: 'camelCase',
    functionStyle: 'camelCase',
    classStyle: 'PascalCase',
    constantStyle: 'SCREAMING_SNAKE_CASE',
  },
  python: {
    variable: patterns.snakeCase,
    function: patterns.snakeCase,
    class: patterns.pascalCase,
    constant: patterns.screamingSnakeCase,
    variableStyle: 'snake_case',
    functionStyle: 'snake_case',
    classStyle: 'PascalCase',
    constantStyle: 'SCREAMING_SNAKE_CASE',
  },
  java: {
    variable: patterns.camelCase,
    function: patterns.camelCase,
    class: patterns.pascalCase,
    constant: patterns.screamingSnakeCase,
    variableStyle: 'camelCase',
    functionStyle: 'camelCase',
    classStyle: 'PascalCase',
    constantStyle: 'SCREAMING_SNAKE_CASE',
  },
  go: {
    variable: patterns.camelCase,
    function: patterns.camelCase,
    class: patterns.pascalCase,
    constant: patterns.pascalCase,
    variableStyle: 'camelCase',
    functionStyle: 'camelCase',
    classStyle: 'PascalCase',
    constantStyle: 'PascalCase',
  },
};

// 提取标识符的正则表达式
const extractors: Record<SupportedLanguage, {
  variable: RegExp;
  function: RegExp;
  class: RegExp;
  constant: RegExp;
}> = {
  javascript: {
    variable: /(?:let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    function: /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{)/g,
    class: /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    constant: /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
  },
  typescript: {
    variable: /(?:let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    function: /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?::\s*[^=]+)?\s*=\s*(?:async\s*)?\()/g,
    class: /(?:class|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    constant: /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
  },
  python: {
    variable: /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm,
    function: /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    class: /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    constant: /^([A-Z][A-Z0-9_]*)\s*=/gm,
  },
  java: {
    variable: /(?:int|String|boolean|char|double|float|long|short|byte|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    function: /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
    class: /(?:class|interface|enum)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    constant: /(?:static\s+)?final\s+[\w<>\[\]]+\s+([A-Z][A-Z0-9_]*)/g,
  },
  go: {
    variable: /(?:var|:=)\s*([a-zA-Z_][a-zA-Z0-9_]*)/g,
    function: /func\s+(?:\([^)]*\)\s*)?([a-zA-Z_][a-zA-Z0-9_]*)/g,
    class: /type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+struct/g,
    constant: /const\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
  },
};

// 生成唯一ID
function generateId(): string {
  return `naming-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// 将标识符转换为建议的格式
function convertToStyle(name: string, style: string): string {
  // 分割标识符为单词
  const words = name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-_]/g, '_')
    .toLowerCase()
    .split('_')
    .filter(w => w);

  switch (style) {
    case 'camelCase':
      return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
    case 'PascalCase':
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    case 'snake_case':
      return words.join('_');
    case 'SCREAMING_SNAKE_CASE':
      return words.join('_').toUpperCase();
    case 'kebab-case':
      return words.join('-');
    default:
      return name;
  }
}

// 检查命名规范
export function checkNaming(code: string, language: SupportedLanguage): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const rules = languageNamingRules[language];
  const extractor = extractors[language];

  // 检查变量命名
  let match;
  const varRegex = new RegExp(extractor.variable.source, extractor.variable.flags);
  while ((match = varRegex.exec(code)) !== null) {
    const name = match[1] || match[2];
    if (name && !rules.variable.test(name) && !rules.constant.test(name)) {
      const line = getLineNumber(code, match.index);
      const column = getColumnNumber(code, match.index);
      const suggestedName = convertToStyle(name, rules.variableStyle);
      
      issues.push({
        id: generateId(),
        line,
        column,
        message: `变量 "${name}" 不符合 ${rules.variableStyle} 命名规范`,
        severity: 'warning',
        type: 'naming',
        rule: 'naming/variable',
        suggestion: `建议将变量名改为 "${suggestedName}"`,
        fixedCode: suggestedName,
      });
    }
  }

  // 检查函数命名
  const funcRegex = new RegExp(extractor.function.source, extractor.function.flags);
  while ((match = funcRegex.exec(code)) !== null) {
    const name = match[1] || match[2] || match[3];
    if (name && !rules.function.test(name)) {
      const line = getLineNumber(code, match.index);
      const column = getColumnNumber(code, match.index);
      const suggestedName = convertToStyle(name, rules.functionStyle);
      
      issues.push({
        id: generateId(),
        line,
        column,
        message: `函数 "${name}" 不符合 ${rules.functionStyle} 命名规范`,
        severity: 'warning',
        type: 'naming',
        rule: 'naming/function',
        suggestion: `建议将函数名改为 "${suggestedName}"`,
        fixedCode: suggestedName,
      });
    }
  }

  // 检查类命名
  const classRegex = new RegExp(extractor.class.source, extractor.class.flags);
  while ((match = classRegex.exec(code)) !== null) {
    const name = match[1];
    if (name && !rules.class.test(name)) {
      const line = getLineNumber(code, match.index);
      const column = getColumnNumber(code, match.index);
      const suggestedName = convertToStyle(name, rules.classStyle);
      
      issues.push({
        id: generateId(),
        line,
        column,
        message: `类 "${name}" 不符合 ${rules.classStyle} 命名规范`,
        severity: 'error',
        type: 'naming',
        rule: 'naming/class',
        suggestion: `建议将类名改为 "${suggestedName}"`,
        fixedCode: suggestedName,
      });
    }
  }

  return issues;
}

