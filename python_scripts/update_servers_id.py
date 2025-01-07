import os
import json
import re

SERVERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "servers")

def extract_github_info(github_url):
    # Extract owner and repo from GitHub URL
    # Handle both full URLs and tree paths
    match = re.search(r'github\.com/([^/]+)/([^/]+)(?:/tree/[^/]+/src/([^/]+))?', github_url)
    if match:
        owner = match.group(1)
        repo = match.group(3) if match.group(3) else match.group(2)  # Use subproject if available, else main repo
        if repo.endswith('.git'):
            repo = repo[:-4]
        return f"@{owner}/{repo}"
    return None

def process_mcp_json(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Check if sources and github URL exists
        if 'sources' in data and 'github' in data['sources']:
            github_url = data['sources']['github']
            new_id = extract_github_info(github_url)
            
            if new_id and data.get('id') != new_id:
                data['id'] = new_id
                # Write back the updated JSON
                with open(file_path, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"Updated {file_path} with new ID: {new_id}")
                
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")

def main():
    from glob import glob
    
    # Find all mcp.json files using glob
    mcp_files = list(glob(os.path.join(SERVERS_DIR, "**/mcp.json"), recursive=True))
    
    # Process each mcp.json file
    for mcp_file in mcp_files:
        process_mcp_json(mcp_file)

if __name__ == "__main__":
    main()