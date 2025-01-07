import os
import json
import re
import shutil
from glob import glob

SERVERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "servers")

def extract_github_info(github_url):
    match = re.search(r'github\.com/([^/]+)/([^/]+)(?:/tree/[^/]+/src/([^/]+))?', github_url)
    if match:
        owner = match.group(1)
        repo = match.group(3) if match.group(3) else match.group(2)  # Use subproject if available, else main repo
        if repo.endswith('.git'):
            repo = repo[:-4]
        return owner, repo
    return None, None

def process_mcp_json(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        if 'sources' in data and 'github' in data['sources']:
            github_url = data['sources']['github']
            owner, repo = extract_github_info(github_url)
            
            if owner and repo:
                # Create new directory structure
                new_dir = os.path.join(SERVERS_DIR, f"@{owner}", repo)
                os.makedirs(new_dir, exist_ok=True)
                
                # Write the data to new mcp.json
                new_file_path = os.path.join(new_dir, 'mcp.json')
                if not os.path.exists(new_file_path):
                    with open(new_file_path, 'w') as f:
                        json.dump(data, f, indent=2)
                    print(f"Created new mcp.json at {new_file_path}")
                
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")

def main():
    # First collect all mcp.json files
    mcp_files = list(glob(os.path.join(SERVERS_DIR, "**/mcp.json"), recursive=True))
    
    # Then process them after we have the complete list
    for mcp_file in mcp_files:
        process_mcp_json(mcp_file)

if __name__ == "__main__":
    main()