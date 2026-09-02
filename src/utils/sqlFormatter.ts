import { format } from 'sql-formatter';

export function formatSQL(sql: string, language: string = 'sql'): string {
  try {
    return format(sql, {
      language: language as any,
      keywordCase: 'upper',
      tabWidth: 2,
    });
  } catch (error) {
    console.error('Error formatting SQL:', error);
    return sql;
  }
}

export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
