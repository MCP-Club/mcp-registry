const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('mcp-registry');
    const collection = db.collection('mcp-files');

    // Delete all existing documents
    await collection.deleteMany({});
    console.log('Cleared existing documents');

    // Find all mcp.json files
    const files = glob.sync('**/mcp.json', {
      ignore: ['node_modules/**', '.git/**']
    });

    console.log(`Found ${files.length} mcp.json files`);

    // Process each file
    for (const filePath of files) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const folderId = path.dirname(filePath).split('/').pop();
        const documentId = content.id || folderId;

        await collection.insertOne({
          id: documentId,
          ...content
        });
        
        console.log(`Inserted document for folder: ${folderId}`);
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
      }
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
