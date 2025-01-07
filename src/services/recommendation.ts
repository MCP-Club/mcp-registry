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

  async textSearch(description: string, limit: number): Promise<SearchResult[]> {
    const query = `
      SELECT 
        server_id, 
        title, 
        description,
        github_url,
        ts_rank(tsv_description, plainto_tsquery('english', $1)) AS bm25_score
      FROM mcp_servers
      ORDER BY bm25_score DESC
      LIMIT $2;
    `;

    const result = await this.pool.query(query, [description, limit]);
    
    const items = await result.rows
      .map(row => ({
        id: row.server_id,
        title: row.title,
        description: row.description,
        github_url: row.github_url,
        score: row.bm25_score
      }))
      .filter(item => item.score > 0.1);

    console.log("text search results", items)

    return items
  }

  async vectorSearch(vectorStr: string, limit: number): Promise<SearchResult[]> {
    const query = `
      SELECT 
        server_id,
        title,
        description,
        github_url,
        1 - (embedding_small <=> $1::vector) as similarity_score
      FROM mcp_servers
      ORDER BY embedding_small <=> $1::vector
      LIMIT $2;
    `;

    const result = await this.pool.query(query, [vectorStr, limit]);
    
    const items = result.rows
      .map(row => ({
        id: row.server_id,
        title: row.title,
        description: row.description,
        github_url: row.github_url,
        score: row.similarity_score
      }))
      .filter(item => item.score > 0.1);  // Filter out low similarity matches

    console.log("vector search results", items)

    return items;
  }

  async recommendV2(description: string, embedding: number[], limit = 5): Promise<SearchResult[]> {
    const vectorStr = `[${embedding.join(',')}]`;
    const textSearchResults = await this.textSearch(description, limit*2);
    const vectorSearchResults = await this.vectorSearch(vectorStr, limit*2);

    // Create a map to store combined scores by id
    const combinedScores = new Map<string, { item: SearchResult; score: number }>();

    // Process text search results
    textSearchResults.forEach((item, index) => {
      combinedScores.set(item.id, {
        item,
        score: 1 / (index + 1) // 1/k1
      });
    });

    // Process vector search results and combine scores
    vectorSearchResults.forEach((item, index) => {
      const existing = combinedScores.get(item.id);
      const vectorScore = 1 / (index + 1); // 1/k2
      if (existing) {
        existing.score += vectorScore;
      } else {
        combinedScores.set(item.id, { item, score: vectorScore });
      }
    });

    // Convert to array and sort by combined score
    const results = Array.from(combinedScores.values())
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, limit);

    return results;
  }
}
