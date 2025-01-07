# MCP Registry

A curated list of Model Context Protocol (MCP) servers and tools.

## Contents

- [MCP Registry](#mcp-registry)
  - [Contents](#contents)
  - [Servers](#servers)
    - [Airtable Server](#airtable-server)
    - [Axiom Server](#axiom-server)
    - [Brave Search Server](#brave-search-server)
    - [Cloudflare Server](#cloudflare-server)
    - [Fetch Server](#fetch-server)
    - [Filesystem Server](#filesystem-server)
    - [GitHub Server](#github-server)
    - [Google Drive Server](#google-drive-server)
    - [Google Maps Server](#google-maps-server)
    - [Home Assistant Server](#home-assistant-server)
    - [Memory Server](#memory-server)
    - [MongoDB Server](#mongodb-server)
    - [Playwright Server](#playwright-server)
    - [PostgreSQL Server](#postgresql-server)
    - [Puppeteer Server](#puppeteer-server)
    - [Sequential Thinking Server](#sequential-thinking-server)

## Servers

### Airtable Server

MCP server for managing Airtable bases and tables with comprehensive API support

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-airtable"],
    "type": "stdio"
}
```

### Axiom Server

MCP server for querying data using Axiom Processing Language (APL)

**Details:**
```json
{
    "command": "axiom-mcp",
    "args": ["--config", "config.txt"],
    "type": "stdio"
}
```

### Brave Search Server

MCP server for Brave Search API integration

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "type": "stdio"
}
```

### Cloudflare Server

MCP server for Cloudflare API integration with support for DNS, Workers, and security services

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@cloudflare/mcp-server-cloudflare"],
    "type": "stdio"
}
```

### Fetch Server

HTTP request server for making API calls

**Details:**
```json
{
    "command": "uvx",
    "args": ["mcp-server-fetch"],
    "type": "stdio"
}
```

### Filesystem Server

Node.js server implementing Model Context Protocol (MCP) for filesystem operations

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem"],
    "type": "stdio"
}
```

### GitHub Server

MCP server for using the GitHub API

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "type": "stdio"
}
```

### Google Drive Server

MCP server for Google Drive integration with file management and sharing capabilities

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-gdrive"],
    "type": "stdio"
}
```

### Google Maps Server

MCP server for using the Google Maps API

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-google-maps"],
    "type": "stdio"
}
```

### Home Assistant Server

MCP server for Home Assistant home automation platform integration

**Details:**
```json
{
    "command": "python",
    "args": ["-m", "mcp_server_home_assistant"],
    "type": "stdio"
}
```

### Memory Server

Memory management server for conversation history

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"],
    "type": "stdio"
}
```

### MongoDB Server

MCP server for executing MongoDB queries and managing MongoDB databases

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@pash1986/mcp-server-mongodb"],
    "type": "stdio"
}
```

### Playwright Server

MCP server for browser automation and testing using Playwright

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@automatalabs/mcp-server-playwright"],
    "type": "stdio"
}
```

### PostgreSQL Server

MCP server for PostgreSQL database operations with comprehensive query support

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "type": "stdio"
}
```

### Puppeteer Server

Browser automation server using Puppeteer

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
    "type": "stdio"
}
```

### Sequential Thinking Server

Sequential thinking server for step-by-step reasoning

**Details:**
```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    "type": "stdio"
}
```

---

Last updated: 2024-12-20 08:06:11
