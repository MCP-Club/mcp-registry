import { Pool } from 'pg';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance {
    db: Pool;
    toEmbedding: (text: string) => Promise<number[]>;
    toEmbeddingOpenAI: (text: string) => Promise<number[]>
  }
}
