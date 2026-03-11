export interface SQLStatistics {
  totalLines: number;
  totalCharacters: number;
  totalTables: number;
  totalQueries: number;
}

export function calculateSQLStatistics(sql: string): SQLStatistics {
  const lines = sql.split('\n').filter(line => line.trim().length > 0);
  const characters = sql.length;
  
  const tablePattern = /(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z_][a-zA-Z0-9_\.]*)+/gi;
  const queryPattern = /(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/gi;
  
  const tables = new Set<string>();
  let match: RegExpExecArray | null;
  
  while ((match = tablePattern.exec(sql)) !== null) {
    if (match[1]) {
      tables.add(match[1].toLowerCase());
    }
  }
  
  const queries = sql.match(queryPattern) || [];

  return {
    totalLines: lines.length,
    totalCharacters: characters,
    totalTables: tables.size,
    totalQueries: queries.length,
  };
}