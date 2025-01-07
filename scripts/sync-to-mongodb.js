const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function main() {
  // Get the file path from command line arguments
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
  }

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

    // Read and parse the MCP JSON file
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const folderId = path.dirname(filePath).split('/').pop();
    
    // Use folder name as id if not present in json
    const documentId = content.id || folderId;
    
    await collection.updateOne(
      { id: documentId },
      { $set: content },
      { upsert: true }
    );
    
    console.log(`Updated/Inserted document for folder: ${folderId}`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
