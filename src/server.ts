import Fastify from 'fastify';
import cors from '@fastify/cors';
import { pool, testConnection } from './config/database';
import { RegistryService } from './services/registry';
import { RecommendationService } from './services/recommendation';
import TextEncoder from './utils/encoder';

const PORT = process.env.PORT || 3000;
const fastify = Fastify({ logger: true });
const recommendationService = new RecommendationService(pool);
const {toEmbedding, toEmbeddingOpenAI} = TextEncoder();

// Test database connection
testConnection();

// Register plugins
fastify.register(cors);

// Decorate fastify instance
fastify.decorate('db', pool);
fastify.decorate('toEmbedding', async (text: string) => toEmbedding(text));
fastify.decorate('toEmbeddingOpenAI', async (text: string) => toEmbeddingOpenAI(text));

// Welcome endpoint
fastify.get('/', async () => {
  return { message: 'Welcome to MCP Registry API' };
});

// Get entire registry
fastify.get('/registry', async (request, reply) => {
  try {
    const registry = await RegistryService.loadRegistry();
    return registry;
  } catch (err) {
    reply.code(500);
    return { error: 'Failed to load registry' };
  }
});

// Search registry
fastify.get('/search', async (request, reply) => {
  const { q } = request.query as { q?: string };
  
  if (!q) {
    reply.code(400);
    return { error: 'Search query is required' };
  }

  try {
    const results = await RegistryService.searchRegistry(q);
    return results;
  } catch (err) {
    reply.code(500);
    return { error: 'Search failed' };
  }
});

// Get specific MCP by ID
fastify.get('/registry/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  
  try {
    // Decode the ID since it will be URL encoded in requests
    const decodedId = decodeURIComponent(id);
    const mcp = await RegistryService.getMCPById(decodedId);
    if (!mcp) {
      reply.code(404);
      return { error: 'MCP not found' };
    }
    return mcp;
  } catch (err) {
    reply.code(500);
    return { error: 'Failed to get MCP' };
  }
});

// Test database connection
fastify.get('/db-test', async (request, reply) => {
  try {
    const { rows } = await fastify.db.query('SELECT NOW()');
    return { success: true, timestamp: rows[0].now };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Database connection failed' });
  }
});

// Recommendation endpoints
fastify.get('/recommend', async (request, reply) => {
  const { description } = request.query as { description?: string };

  if (!description) {
    return reply.status(400).send({ error: 'Description is required' });
  }

  try {
    const embedding = await fastify.toEmbedding(description);
    return await recommendationService.recommendV1(description, Array.from(embedding));
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Recommendation failed' });
  }
});

fastify.get('/recommend/v2', async (request, reply) => {
  const { description, limit } = request.query as { description?: string; limit?: string };

  if (!description) {
    return reply.status(400).send({ error: 'Description is required' });
  }

  try {
    const embedding = await fastify.toEmbeddingOpenAI(description);
    return await recommendationService.recommendV2(
      description,
      embedding,
      limit ? parseInt(limit) : undefined
    );
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Recommendation failed' });
  }
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: PORT as number, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
