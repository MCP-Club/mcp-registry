import { FeatureExtractionPipeline, pipeline } from '@xenova/transformers';
import OpenAI from 'openai';

type EmbeddingInput = string;
type EmbeddingOutput = number[];

let model: FeatureExtractionPipeline;
let openai: OpenAI;

const TextEncoder = (): {
  toEmbedding: (text: EmbeddingInput) => Promise<EmbeddingOutput>;
  toEmbeddingOpenAI: (text: EmbeddingInput) => Promise<EmbeddingOutput>;
} => {
  const init = async () => {
    if (!model) {
      model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    if (!openai) {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    if (!openai || !model) {
      throw new Error('Encoder initialization failed');
    }
    console.log('Encoder initialized successfully');
  };

  const toEmbedding = async (text: EmbeddingInput): Promise<EmbeddingOutput> => {
    await init();
    const embeddings = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(embeddings.data);
  };

  const toEmbeddingOpenAI = async (text: EmbeddingInput): Promise<EmbeddingOutput> => {
    await init();
    const response = await openai!.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    
    return response.data[0].embedding;
  };

  return {
    toEmbedding,
    toEmbeddingOpenAI
  };
};

export default TextEncoder;
