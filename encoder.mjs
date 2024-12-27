import { pipeline } from '@xenova/transformers';
import { OpenAI } from 'openai';

let model = null;
let openai = null;

const TextEncoder = () => {
  const init = async () => {
    if (!model) {
      model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    
    if (!openai) {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  };

  const toEmbedding = async (text) => {
    await init();
    
    const input = Array.isArray(text) ? text : [text];
    const embeddings = await model(input, { pooling: 'mean', normalize: true });
    
    return Array.isArray(text) ? embeddings : embeddings[0];
  };



  return {
    toEmbedding
  };
};

export default TextEncoder;