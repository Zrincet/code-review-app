// 代码问题严重级别
export type IssueSeverity = 'error' | 'warning' | 'info' | 'hint';

// 问题类型
export type IssueType = 
  | 'naming'        // 命名问题
  | 'syntax'        // 语法问题
  | 'style'         // 代码风格
  | 'logic'         // 逻辑问题
  | 'performance'   // 性能问题
  | 'security';     // 安全问题

// 代码问题
export interface CodeIssue {
  id: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity: IssueSeverity;
  type: IssueType;
  rule: string;
  suggestion?: string;
  fixedCode?: string;
}

// 检测报告
export interface ReviewReport {
  issues: CodeIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    hints: number;
    total: number;
  };
  analyzedAt: Date;
  language: SupportedLanguage;
  codeLines: number;
}

// 支持的编程语言
export type SupportedLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go';

// 语言配置
export interface LanguageConfig {
  id: SupportedLanguage;
  label: string;
  icon: string;
  monacoLanguage: string;
  fileExtension: string;
}

// 编辑器状态
export interface EditorState {
  code: string;
  language: SupportedLanguage;
  cursorPosition: {
    line: number;
    column: number;
  };
}

