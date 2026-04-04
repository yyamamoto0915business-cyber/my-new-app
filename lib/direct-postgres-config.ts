/**
 * SUPABASE_DB_URL / DATABASE_URL から pg クライアント用設定を生成
 * （inbox 直DB・会話メッセージ直DBで共有）
 */
export function getDirectPostgresClientConfig():
  | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      ssl: { rejectUnauthorized: boolean };
    }
  | { connectionString: string; ssl?: { rejectUnauthorized: boolean } } {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("SUPABASE_DB_URL または DATABASE_URL が設定されていません");
  }

  if (dbPassword) {
    try {
      const url = new URL(dbUrl.replace(/^postgres(ql)?:\/\//, "https://"));
      return {
        host: url.hostname,
        port: parseInt(url.port || "6543", 10),
        user: url.username || "postgres",
        password: dbPassword,
        database: url.pathname.slice(1) || "postgres",
        ssl: { rejectUnauthorized: false },
      };
    } catch {
      // fallback below
    }
  }

  return {
    connectionString: dbUrl,
    ssl: dbUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  };
}

export function hasDirectPostgresEnv(): boolean {
  return !!(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);
}
