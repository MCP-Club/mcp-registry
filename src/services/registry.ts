import { promises as fs } from 'fs';
import path from 'path';
import { MCPConfig } from '../types';

export class RegistryService {
  private static async scanDirectory(dir: string): Promise<MCPConfig[]> {
    const registry: MCPConfig[] = [];
    try {
      // Get all owner directories (@something)
      const owners = await fs.readdir(dir);
      
      for (const owner of owners) {
        if (!owner.startsWith('@')) continue;
        
        const ownerPath = path.join(dir, owner);
        const ownerStat = await fs.stat(ownerPath);
        if (!ownerStat.isDirectory()) continue;
        
        // Get all repos under this owner
        const repos = await fs.readdir(ownerPath);
        for (const repo of repos) {
          const mcpPath = path.join(ownerPath, repo, 'mcp.json');
          try {
            const configData = await fs.readFile(mcpPath, 'utf8');
            const mcpData = JSON.parse(configData) as MCPConfig;
            registry.push(mcpData);
          } catch (err) {
            // Skip if mcp.json doesn't exist or can't be read
            continue;
          }
        }
      }
      
      return registry;
    } catch (err) {
      console.error(`Error scanning directory ${dir}:`, err);
      return registry;
    }
  }

  public static async loadRegistry(): Promise<MCPConfig[]> {
    try {
      return await RegistryService.scanDirectory('./servers');
    } catch (err) {
      console.error('Error loading registry:', err);
      return [];
    }
  }

  public static async searchRegistry(searchTerm: string): Promise<MCPConfig[]> {
    const registry = await RegistryService.loadRegistry();
    const term = searchTerm.toLowerCase();
    
    return registry.filter(mcp => 
      mcp.id.toLowerCase().includes(term) ||
      mcp.title.toLowerCase().includes(term) ||
      mcp.description.toLowerCase().includes(term) ||
      (mcp.tags && mcp.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }

  public static async getMCPById(id: string): Promise<MCPConfig | null> {
    const registry = await RegistryService.loadRegistry();
    return registry.find(m => m.id === id) || null;
  }
}
