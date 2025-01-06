export interface MCPConfig {
  id: string;
  title: string;
  description: string;
  github_url?: string;
  tags?: string[];
}

export interface DatabaseConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export interface SearchResult extends MCPConfig {
  id: string;
  title: string;
  description: string;
  github_url?: string;
  score: number;
}
