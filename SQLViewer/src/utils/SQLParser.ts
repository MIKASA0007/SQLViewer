import { SQLStatement, SQLTable, Column } from '../types';

export class SQLParser {
  static parse(content: string): SQLStatement[] {
    const statements: SQLStatement[] = [];
    
    // Split by semicolon and clean up
    const rawStatements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let lastCreateTable: SQLStatement | null = null;
    
    for (const stmt of rawStatements) {
      const parsed = this.parseStatement(stmt);
      if (parsed) {
        if (parsed.type === 'CREATE_TABLE') {
          lastCreateTable = parsed;
          statements.push(parsed);
        } else if (parsed.type === 'INSERT' && lastCreateTable) {
          // Try to parse INSERT data and add to the last CREATE TABLE
          const insertData = this.parseInsert(stmt, lastCreateTable.table!.name);
          if (insertData && lastCreateTable.table) {
            if (!lastCreateTable.table.rows) {
              lastCreateTable.table.rows = [];
            }
            lastCreateTable.table.rows.push(...insertData);
          }
          statements.push(parsed);
        } else {
          statements.push(parsed);
        }
      }
    }

    return statements;
  }

  private static parseStatement(sql: string): SQLStatement | null {
    const upperSql = sql.toUpperCase();
    
    // Remove comments
    const cleanedSql = this.removeComments(sql);

    // Detect statement type
    if (upperSql.startsWith('CREATE TABLE')) {
      return this.parseCreateTable(cleanedSql);
    } else if (upperSql.startsWith('SELECT')) {
      return { type: 'SELECT', original: cleanedSql };
    } else if (upperSql.startsWith('INSERT')) {
      return { type: 'INSERT', original: cleanedSql };
    } else if (upperSql.startsWith('UPDATE')) {
      return { type: 'UPDATE', original: cleanedSql };
    } else if (upperSql.startsWith('DELETE')) {
      return { type: 'DELETE', original: cleanedSql };
    } else if (upperSql.startsWith('DROP TABLE')) {
      return { type: 'DROP', original: cleanedSql };
    } else if (upperSql.startsWith('ALTER TABLE')) {
      return { type: 'ALTER', original: cleanedSql };
    } else {
      return { type: 'OTHER', original: cleanedSql };
    }
  }

  private static parseCreateTable(sql: string): SQLStatement {
    const upperSql = sql.toUpperCase();
    
    let tableName = 'unknown';
    const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/i);
    if (tableMatch) {
      tableName = tableMatch[1];
    }

    const columns: Column[] = [];
    
    // Extract column definitions between parentheses
    const parenMatch = sql.match(/\(([\s\S]+)\)/);
    if (parenMatch) {
      const columnDefs = this.splitColumnDefinitions(parenMatch[1]);
      
      for (const colDef of columnDefs) {
        const trimmed = colDef.trim();
        if (trimmed && !trimmed.startsWith('PRIMARY KEY') && !trimmed.startsWith('FOREIGN KEY') && !trimmed.startsWith('UNIQUE') && !trimmed.startsWith('CHECK') && !trimmed.startsWith('CONSTRAINT')) {
          const column = this.parseColumn(trimmed);
          if (column) {
            columns.push(column);
          }
        }
      }
    }

    return {
      type: 'CREATE_TABLE',
      original: sql,
      table: { name: tableName, columns }
    };
  }

  private static splitColumnDefinitions(defs: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < defs.length; i++) {
      const char = defs[i];
      
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === ',' && depth === 0) {
        result.push(current);
        current = '';
        continue;
      }
      
      current += char;
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  private static parseColumn(def: string): Column | null {
    // Remove trailing comma
    const trimmed = def.replace(/,/g, '').trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return null;

    const name = parts[0].replace(/[`"']/g, '');
    const type = parts.slice(1).join(' ').replace(/,$/, '').toUpperCase();
    
    let nullable = !type.includes('NOT NULL');
    let primaryKey = type.includes('PRIMARY KEY');

    return {
      name,
      type: type.replace(/\s+(NOT NULL|PRIMARY KEY|AUTO_INCREMENT|DEFAULT.*)/gi, '').trim(),
      nullable,
      primaryKey
    };
  }

  private static removeComments(sql: string): string {
    // Remove single-line comments (--)
    let result = sql.replace(/--.*$/gm, '');
    // Remove multi-line comments (/* */)
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    return result.trim();
  }

  public static hasCreateTable(statements: SQLStatement[]): boolean {
    return statements.some(s => s.type === 'CREATE_TABLE');
  }

  private static parseInsert(sql: string, tableName: string): string[][] | null {
    const upperSql = sql.toUpperCase();
    if (!upperSql.startsWith('INSERT')) return null;

    // Basic INSERT parsing for INSERT INTO table VALUES (val1, val2), (val3, val4)
    const valuesMatch = sql.match(/VALUES?\s*\((.*)\)/i);
    if (!valuesMatch) return null;
    
    const allValues = valuesMatch[1];
    const rowValues: string[][] = [];
    
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < allValues.length; i++) {
      const char = allValues[i];
      const nextChar = i + 1 < allValues.length ? allValues[i + 1] : '';
      
      if (!inString && (char === '\'' || char === '"' || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        const escaped = i > 0 && allValues[i - 1] === '\\';
        if (!escaped) {
          inString = false;
          stringChar = '';
        }
      } else if (!inString && char === '(') {
        depth++;
        if (depth === 1) {
          current = '';
          continue;
        }
      } else if (!inString && char === ')') {
        depth--;
        if (depth === 0) {
          const parsedCurrent = this.parseRowValues(current);
          if (parsedCurrent) {
            rowValues.push(parsedCurrent);
          }
          current = '';
          continue;
        }
      } else if (!inString && char === ',' && depth === 0) {
        // Skip, next row
        continue;
      }
      
      current += char;
    }
    
    const parsedValues = this.parseRowValues(allValues);
    return parsedValues ? [parsedValues] : rowValues;
  }
  
  private static parseRowValues(valueStr: string): string[] | null {
    const values: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < valueStr.length; i++) {
      const char = valueStr[i];
      const nextChar = i + 1 < valueStr.length ? valueStr[i + 1] : '';
      
      if (!inString && (char === '\'' || char === '"' || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        const escaped = i > 0 && valueStr[i - 1] === '\\';
        if (!escaped) {
          inString = false;
          stringChar = '';
        }
      } else if (!inString && char === ',') {
        values.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      values.push(current.trim());
    }
    
    return values.length > 0 ? values : null;
  }
}
