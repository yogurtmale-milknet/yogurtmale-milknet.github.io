import os
import time
import subprocess
import requests

FORKS = [
    {"fork": "milknetmirrors/gmusa", "upstream": "milk-net/milk-net.github.io"},
    {"fork": "milknetmirrors/picklerick", "upstream": "milk-net/milk-net.github.io"},
    {"fork": "milknetmirrors/precalculus", "upstream": "milk-net/milk-net.github.io"},
    {"fork": "milknetmirrors/milknetmirrors.github.io", "upstream": "milk-net/milk-net.github.io"},
]
CHECK_INTERVAL = 20 * 60
BASE_DIR = os.getenv("BASE_DIR", "/tmp/clones")

def get_latest_commit(repo):
    """Fetch the latest commit hash from the default branch of a repository."""
    url = f"https://api.github.com/repos/{repo}/commits/main"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()["sha"]
    else:
        print(f"Error fetching commits for {repo}: {response.text}")
        return None

def clone_repo(fork_repo, local_repo):
    """Clone the forked repository if it does not exist."""
    if not os.path.exists(local_repo):
        print(f"Cloning {fork_repo} into {local_repo}...")
        subprocess.run(["git", "clone", f"https://github.com/{fork_repo}.git", local_repo], check=True)
        subprocess.run(["git", "remote", "add", "upstream", f"https://github.com/{FORKS[0]['upstream']}.git"], cwd=local_repo, check=True)

def pull_latest_changes(local_repo):
    """Pull the latest changes from the upstream repository."""
    try:
        subprocess.run(["git", "fetch", "upstream"], cwd=local_repo, check=True)
        subprocess.run(["git", "merge", "upstream/main"], cwd=local_repo, check=True)
        subprocess.run(["git", "push"], cwd=local_repo, check=True)
        print(f"Updated repository: {local_repo}")
    except subprocess.CalledProcessError as e:
        print(f"Error updating {local_repo}: {e}")

if __name__ == "__main__":
    while True:
        for repo in FORKS:
            fork_repo = repo["fork"]
            upstream_repo = repo["upstream"]
            local_repo_path = os.path.join(BASE_DIR, fork_repo.split("/")[1])
            
            print(f"Checking updates for {fork_repo}...")
            clone_repo(fork_repo, local_repo_path)
            upstream_commit = get_latest_commit(upstream_repo)
            fork_commit = get_latest_commit(fork_repo)
            
            if upstream_commit and fork_commit and upstream_commit != fork_commit:
                print(f"New changes detected in {upstream_repo}, updating {fork_repo}...")
                pull_latest_changes(local_repo_path)
            else:
                print(f"No new changes for {fork_repo}.")
        
        print(f"Waiting {CHECK_INTERVAL // 60} minutes before next check...")
        time.sleep(CHECK_INTERVAL)
