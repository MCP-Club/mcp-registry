import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { promises as fs } from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import TextEncoder from './encoder.mjs';

dotenv.config();

const fastify = Fastify({ logger: true });
const PORT = process.env.PORT || 3000;
const DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Create a global database pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Add pool error handlers
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Test database connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection test successful');
    client.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit if we can't connect to database
  }
};

testConnection();

const { toEmbedding, toEmbeddingOpenAI } = TextEncoder();
fastify.decorate('toEmbedding', text => toEmbedding(text));
fastify.decorate('toEmbeddingOpenAI', text => toEmbeddingOpenAI(text));

// Register CORS
fastify.register(cors);
// Decorate fastify with our db pool
fastify.decorate('db', pool);

// Load registry from directories recursively
async function scanDirectory(dir, registry = [], prefix = '') {
    try {
        const items = await fs.readdir(dir);
        for (const item of items) {
            // ignore directory starting with '.' and node_modules
            if (item.startsWith('.') || item === 'node_modules') {
                continue;
            }
            const fullPath = path.join(dir, item);
            const mcpJsonPath = path.join(fullPath, 'mcp.json');
            const relativePath = prefix ? path.join(prefix, item) : item;
            
            try {
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory()) {
                    try {
                        const configData = await fs.readFile(mcpJsonPath, 'utf8');
                        const mcpData = JSON.parse(configData);
                        registry.push(mcpData);
                    } catch (err) {
                        // If no mcp.json, continue scanning subdirectories
                        await scanDirectory(fullPath, registry, relativePath);
                    }
                }
            } catch (err) {
                continue;
            }
        }
        return registry;
    } catch (err) {
        console.error(`Error scanning directory ${dir}:`, err);
        return registry;
    }
}

async function loadRegistry() {
    try {
        return await scanDirectory('./servers');
    } catch (err) {
        console.error('Error loading registry:', err);
        return [];
    }
}

// Welcome endpoint
fastify.get('/', async (request, reply) => {
    return { message: 'Welcome to MCP Registry API' };
});

// Get entire registry
fastify.get('/registry', async (request, reply) => {
    try {
        const registry = await loadRegistry();
        return registry;
    } catch (err) {
        reply.code(500);
        return { error: 'Failed to load registry' };
    }
});

// Search registry
fastify.get('/search', async (request, reply) => {
    try {
        const { q } = request.query;
        if (!q) {
            reply.code(400);
            return { error: 'Search query is required' };
        }

        const registry = await loadRegistry();
        const searchTerm = q.toLowerCase();
        
        const results = registry.filter(mcp => {
            return (
                mcp.id.toLowerCase().includes(searchTerm) ||
                mcp.title.toLowerCase().includes(searchTerm) ||
                mcp.description.toLowerCase().includes(searchTerm) ||
                (mcp.tags && mcp.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        });

        return results;
    } catch (err) {
        reply.code(500);
        return { error: 'Search failed' };
    }
});

// Get specific MCP by ID
fastify.get('/registry/:id', async (request, reply) => {
    try {
        const registry = await loadRegistry();
        const mcp = registry.find(m => m.id === request.params.id);
        
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

fastify.get('/recommend', async (request, reply) => {
    try {
        const { description } = request.query;

        if (!description) {
            return reply.status(400).send({ error: 'Description is required' });
        }

        // encode description to vector
        const embedding = await fastify.toEmbedding(description);
        
        // Format the embedding array for PostgreSQL vector type
        const vectorString = `[${Array.from(embedding).join(',')}]`;
        
        try {
            // Search for similar servers using vector similarity
            const { rows } = await pool.query(`
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
            `, [vectorString, 3]);  // limiting to top 3 results

            return rows.map(row => ({
                server_id: row.server_id,
                title: row.title,
                description: row.description,
                github_url: row.github_url,
                similarity: parseFloat(row.similarity.toFixed(4))
            }));
        } catch (dbErr) {
            fastify.log.error('Database error:', dbErr);
            throw dbErr;
        }
    } catch (err) { 
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Recommendation failed' });
    }
});

fastify.get('/recommend/v2', async (request, reply) => {
    try {
        const { description, limit = 10 } = request.query;

        if (!description) {
            return reply.status(400).send({ error: 'Description is required' });
        }

        const embedding = await fastify.toEmbeddingOpenAI(description);
        // Format the embedding array for PostgreSQL vector type
        const vectorStr = `[${embedding.join(',')}]`;
        
        // Search for similar servers combining BM25 and vector similarity
        const query = `
            SELECT id, 
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

        const result = await pool.query(query, [description, vectorStr, limit]);
        
        if (result.rows.length === 0) {
            fastify.log.info("No results found in the database");
            return [];
        }

        return result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            github_url: row.github_url,
            score: row.final_score
        }));
    } catch (err) { 
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Recommendation failed' });
    }
});

// Start the server
const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();