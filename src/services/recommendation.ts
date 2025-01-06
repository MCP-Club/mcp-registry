import { Pool } from 'pg';
import { SearchResult } from '../types';

export class RecommendationService {
  constructor(private readonly pool: Pool) {}

  async recommendV1(description: string, embedding: number[]): Promise<SearchResult[]> {
    const vectorString = `[${embedding.join(',')}]`;
    
    const { rows } = await this.pool.query(`
      SELECT 
        server_id,
        title,
        description,
        github_url,
        1 - (embedding <=> $1::vector) as similarity
      FROM mcp_servers
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `, [vectorString, 3]);

    return rows.map(row => ({
      id: row.server_id,
      title: row.title,
      description: row.description,
      github_url: row.github_url,
      score: parseFloat(row.similarity.toFixed(4))
    }));
  }

  async recommendV2(description: string, embedding: number[], limit = 10): Promise<SearchResult[]> {
    const vectorStr = `[${embedding.join(',')}]`;
    
    const query = `
      SELECT 
        server_id, 
        title, 
        description,
        github_url,
        ts_rank(tsv_description, plainto_tsquery('english', $1)) AS bm25_score,
        1 - (embedding_small <=> $2::vector) AS vector_score,
        COALESCE(0.5 * ts_rank(tsv_description, plainto_tsquery('english', $1)), 0) + 
        0.5 * (1 - (embedding_small <=> $2::vector)) AS final_score
      FROM mcp_servers
      ORDER BY final_score DESC
      LIMIT $3;
    `;

    const result = await this.pool.query(query, [description, vectorStr, limit]);
    
    return result.rows.map(row => ({
      id: row.server_id,
      title: row.title,
      description: row.description,
      github_url: row.github_url,
      score: row.final_score
    }));
  }
}
