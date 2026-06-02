# Essential Git Command Reference

## You

Talk about common git operationsExperience AI code assistant

git branch 查看本地所有分支 git status 查看当前状态 git commit 提交 git branch -a 查看所有的分支 git branch -r 查看远程所有分支 git commit -am "init" 提交并且加注释 git remote add origin git@192.168.1.119:ndshow git push origin master 将文件给推到服务器上 git remote show origin 显示远程库origin里的资源 git push origin master:develop git push origin master:hb-dev 将本地库与服务器上的库进行关联 git checkout --track origin/dev 切换到远程dev分支 git branch -D master develop 删除本地库develop git checkout -b dev 建立一个新的本地分支dev git merge origin/dev 将分支dev与当前分支进行合并 git checkout dev 切换到本地dev分支 git remote show 查看远程库 git add . git rm 文件名(包括路径) 从git中删除指定文件 git clone git://github.com/schacon/grit.git 从服务器上将代码给拉下来 git config --list 看所有用户 git ls-files 看已经被提交的 git rm [file name] 删除一个文件 git commit -a 提交当前repos的所有的改变 git add [file name] 添加一个文件到git index git commit -v 当你用－v参数的时候可以看commit的差异 git commit -m "This is the message describing the commit" 添加commit信息 git commit -a -a是代表add，把所有的change加到git index里然后再commit git commit -a -v 一般提交命令 git log 看你commit的日志 git diff 查看尚未暂存的更新 git rm a.a 移除文件(从暂存区和工作区中删除) git rm --cached a.a 移除文件(只从暂存区中删除) git commit -m "remove" 移除文件(从Git中删除) git rm -f a.a 强行移除修改后文件(从暂存区和工作区中删除) git diff --cached 或 $ git diff --staged 查看尚未提交的更新 git stash push 将文件给push到一个临时空间中 git stash pop 将文件从临时空间pop下来 // 我是cv的自取吧
作者：狗头军师66 链接：https://juejin.cn/post/7073869980411887652 来源：稀土掘金 著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

## Claude


# Git Operations - Hiểu Hoàn Toàn Từ Góc Độ Principal Engineer


Xin chào! Tôi sẽ giải thích cho bạn về các thao tác Git phổ biến từ góc độ của một Principal Engineer, từ cơ bản nhất đến chuyên sâu. Chúng ta sẽ đi từ "tại sao Git tồn tại" đến "làm thế nào để master Git trong production environment".


## 🌱 Nguồn Gốc & Motivation: Tại Sao Git TồnẠi?


### Vấn Đề Trước Khi Có Git


Hãy tưởng tượng bạn đang làm việc trong một team 10 developers, mỗi người đang modify cùng một codebase. Trước khi có Git (và các version control systems khác), developers phải:


```
💭 "Ai đó đang edit file UserController.js không? Tôi cũng cần sửa file đó!"
💭 "Làm sao tôi biết được John đã thay đổi gì trong code?"
💭 "Nếu code mới tôi viết break production, làm sao rollback?"
💭 "Làm sao merge code của cả team mà không bị conflict?"
```


**Cách làm cũ (primitive methods):**


1. **File sharing qua email**: "Hey team, đây là version mới nhất của project.zip"
2. **Shared folder**: Tất cả save vào một folder chung, ai làm sau overwrite người trước
3. **Manual backup**: Tự tạo folder "backup_v1", "backup_v2", "backup_final", "backup_final_real"


**Vấn đề của cách cũ:**


- Không track được ai thay đổi gì, khi nào
- Không merge được changes từ nhiều người
- Không rollback được to specific point
- Conflict resolution hoàn toàn manual và error-prone


### Git's Revolutionary Solution


Git được Linus Torvalds tạo ra năm 2005 để manage Linux kernel development - một project với hàng nghìn contributors worldwide. Ông cần một system có thể:


1. **Distributed**: Mỗi developer có complete history locally
2. **Fast**: Operations phải lightning fast
3. **Reliable**: Data integrity là paramount
4. **Branching**: Parallel development streams
5. **Merging**: Intelligent conflict resolution


## 🔬 Bản Chất & Mechanism: Git Hoạt Động Như Thế Nào?


### Git's Core Data Structure: The DAG (Directed Acyclic Graph)


```
💡 Insight: Git không phải là "file versioning system"
   Git là "content-addressable filesystem with VCS built on top"
```


**Git lưu data như thế nào:**


1. **Object Database**: Mọi thứ trong Git đều là objects

Blob objects: File content
Tree objects: Directory structure
Commit objects: Snapshots in time
Tag objects: Named references to commits
2. **SHA-1 Hashing**: Mỗi object có unique 40-character hash
bash# Ví dụ: commit hash
a1b2c3d4e5f6789...
3. **Immutable History**: Sau khi tạo, objects không thể thay đổi


### Memory Model & Storage


```
📁 .git/
├── objects/          # Object database
│   ├── 01/
│   ├── 02/
│   └── ...
├── refs/             # References (branches, tags)
│   ├── heads/        # Local branches
│   └── remotes/      # Remote branches
├── HEAD              # Current branch reference
├── index             # Staging area
└── config            # Repository configuration
```


## ⚙️ Implementation Deep Dive: Các Lệnh Git Phổ Biến


Bây giờ chúng ta sẽ phân tích từng lệnh Git từ list mà bạn cung cấp, hiểu sâu mechanism của từng command:


### 1. git status - Hiểu Hoàn Toàn Staging Area


**🔬 Mechanism Analysis:**


```bash
git status
```


**Điều gì xảy ra khi bạn run command này:**


1. **Index Comparison**: Git so sánh 3 states:

Working Directory: Files trên disk hiện tại
Staging Area (Index): Files đã được git add
HEAD commit: Snapshot cuối cùng
2. **File Status Categories**:
📊 Untracked: Chưa từng được git biết đến
📊 Modified: Đã thay đổi since last commit
📊 Staged: Đã add vào staging area
📊 Deleted: Đã bị xóa


**Deep Understanding - Git's Three Trees:**


```
💭 Principal's Perspective:
Git's "three trees" concept là fundamental để hiểu git workflow:

Working Directory  -->  Staging Area  -->  Repository
      ^                      ^                 ^
   Files on disk      git add index      git commit
```


**Performance Characteristics:**


- `git status` là O(n) operation where n = number of files
- Git uses file modification time + inode info để optimize checking
- Large repos có thể slow nếu có quá nhiều untracked files


### 2. git add - Deep Dive Into Staging Mechanism


**🔬 Core Algorithm:**


```bash
git add .                    # Add all files
git add [file name]          # Add specific file
```


**Step-by-Step Execution:**


1. **File Reading**: Git reads file content từ working directory
2. **Blob Creation**: Content được hash và store as blob object
3. **Index Update**: File path và blob hash được record trong index
4. **No Actual Movement**: File vẫn ở working directory, chỉ có reference trong index


**Memory Model:**


```javascript
// Pseudo-code representation
const index = {
  "src/app.js": {
    hash: "a1b2c3d4...",
    mode: "100644",
    size: 1024
  },
  "package.json": {
    hash: "e5f6g7h8...",
    mode: "100644",
    size: 512
  }
}
```


**💭 Common Misconception:**
Nhiều developers nghĩ `git add` moves files to somewhere. Thực tế, nó chỉ records snapshot của file content tại thời điểm đó.


### 3. git commit - The Heart of Git's Version Control


**🔬 Commit Object Creation Process:**


```bash
git commit -m "This is the message describing the commit"
git commit -a -m "Add all changes and commit"
git commit -v    # Verbose mode showing diff
```


**Deep Mechanism Analysis:**


1. **Tree Object Creation**:
📁 Project Root
├── src/
│   └── app.js (blob: a1b2c3d4...)
└── package.json (blob: e5f6g7h8...)

Tree object records:
- Directory structure
- File permissions
- Blob references
2. **Commit Object Structure**:
tree: f9e8d7c6...        # Root tree hash
parent: b5a4c3d2...      # Previous commit(s)
author: John Doe <john@example.com> 1234567890 +0700
committer: John Doe <john@example.com> 1234567890 +0700

Commit message here
3. **Reference Update**: HEAD và current branch pointer được update


**Performance & Optimization:**


- Commit creation là O(log n) operation
- Git only stores diffs for efficiency (delta compression)
- Identical files across commits share same blob object


**💭 Principal's Deep Thought:**


```
Khi tôi review commits trong production, tôi luôn chú ý:
- Commit message quality (helps with debugging later)
- Commit size (atomic commits vs monster commits)
- Related changes bundled together
- No unrelated changes mixed together
```


### 4. Branch Operations - Advanced Git Branching


**🔬 Branch Mechanism Deep Dive:**


```bash
git branch                    # List local branches
git branch -a                # List all branches (local + remote)
git branch -r                # List remote branches
git checkout -b dev           # Create and switch to new branch
git checkout dev              # Switch to existing branch
git branch -D master develop  # Delete branches forcefully
```


**What is a Branch Really?**


```
💡 Fundamental Understanding:
Branch in Git = just a movable pointer to a specific commit
```


**Data Structure:**


```bash
# In .git/refs/heads/master
a1b2c3d4e5f6789abcdef0123456789abcdef01

# In .git/refs/heads/develop
b2c3d4e5f6789abcdef0123456789abcdef012a
```


**Branch Creation Process:**


1. **Pointer Creation**: New file in `.git/refs/heads/[branch-name]`
2. **Initial Value**: Points to current commit (HEAD)
3. **Checkout Process**:

Update HEAD to point to new branch
Update working directory to match branch state
Update index to match branch state


**Memory & Performance:**


- Branch creation: O(1) - just creating a file with hash
- Branch switching: O(n) where n = number of changed files
- Git uses hard links when possible để optimize file operations


### 5. Remote Operations - Distributed Git Workflow


**🔬 Understanding Remote Repositories:**


```bash
git remote add origin git@192.168.1.119:ndshow
git remote show origin
git remote show
```


**Remote Repository Mental Model:**


```
💭 Think of remotes as:
- Bookmarks to other Git repositories
- Can be on different machines, services
- Each remote has its own set of branches
```


**Remote Configuration:**


```bash
# .git/config
[remote "origin"]
    url = git@192.168.1.119:ndshow
    fetch = +refs/heads/*:refs/remotes/origin/*

[branch "master"]
    remote = origin
    merge = refs/heads/master
```


**Fetch vs Pull Mechanism:**


```bash
git fetch origin    # Download objects, update remote refs
git pull origin     # Fetch + merge in one operation
```


**Step-by-Step Fetch Process:**


1. **Connection**: Establish connection với remote repository
2. **Negotiation**: Compare có objects nào missing
3. **Transfer**: Download missing objects (compressed)
4. **Reference Update**: Update remote branches locally
5. **No Working Directory Change**: Your working files unchanged


### 6. Push Operations - Publishing Changes


**🔬 Push Mechanism Analysis:**


```bash
git push origin master
git push origin master:develop    # Push local master to remote develop
git push origin master:hb-dev     # Push to different remote branch
```


**Deep Push Process:**


1. **Fast-Forward Check**: Remote branch must be ancestor của local branch
2. **Object Transfer**: Push missing commits/objects to remote
3. **Reference Update**: Update remote branch pointer
4. **Hooks Execution**: Pre-receive, update, post-receive hooks


**Push Conflicts & Resolution:**


```
💭 Principal's Experience:
Khi push bị reject, 99% lý do là:
- Someone else đã push changes trước bạn
- Remote branch has diverged from local
- Solution: fetch + merge/rebase + push
```


**Force Push - Dangerous Territory:**


```bash
git push --force origin master    # Overwrites remote history
git push --force-with-lease       # Safer force push
```


**⚠️ Production Safety:**


- Never force push to shared branches
- Use force-with-lease để prevent overwriting others' work
- Configure branch protection rules


### 7. Merge Operations - Combining Development Streams


**🔬 Merge Algorithm Deep Dive:**


```bash
git merge origin/dev              # Merge remote dev into current branch
git checkout --track origin/dev   # Create local tracking branch
```


**Three-Way Merge Process:**


```
A---B---C  (current branch)
    /
   D---E---F     (branch to merge)

Common ancestor: D
Current branch tip: C
Merge branch tip: F

Result: A---B---C---G  (G is merge commit)
               /
          D---E---F
```


**Merge Strategies:**


1. **Fast-Forward**: Simply move pointer (no merge commit)
2. **Three-Way Merge**: Create new merge commit
3. **Octopus Merge**: Merge multiple branches simultaneously


**Conflict Resolution Mechanism:**


```bash
# When conflicts occur
git status  # Shows conflicted files

# Manual resolution in files
<<<<<<< HEAD
current branch content
=======
merging branch content
>>>>>>> branch-name

# After resolution
git add conflicted-file
git commit
```


### 8. Stash Operations - Temporary Storage


**🔬 Stash Mechanism Deep Analysis:**


```bash
git stash push    # Save current work in progress
git stash pop     # Apply and remove latest stash
```


**What Happens During Stash:**


1. **Snapshot Creation**: Git creates commits của current state
2. **Working Directory Reset**: Reset to clean state
3. **Stash Storage**: Store trong `.git/refs/stash`


**Stash Data Structure:**


```
stash@{0}: WIP on master: a1b2c3d fixing bug
stash@{1}: On feature: e5f6g7h8 work in progress
```


**Advanced Stash Operations:**


```bash
git stash list                    # Show all stashes
git stash show stash@{0}         # Show stash contents
git stash apply stash@{1}        # Apply specific stash
git stash drop stash@{0}         # Delete specific stash
git stash pop stash@{1}          # Apply and delete specific stash
```


### 9. Log & History - Understanding Project Evolution


**🔬 Git Log Deep Dive:**


```bash
git log                          # Show commit history
git log --oneline               # Compact format
git log --graph                 # ASCII graph
git log --stat                  # Show file changes
```


**Log Output Anatomy:**


```
commit a1b2c3d4e5f6789abcdef0123456789abcdef01  # SHA-1 hash
Author: John Doe <john@example.com>             # Author info
Date:   Mon Jan 15 10:30:00 2024 +0700        # Timestamp

    Add user authentication feature            # Commit message

    - Implement login/logout functionality
    - Add password hashing
    - Update database schema
```


**Advanced Log Queries:**


```bash
git log --since="2 weeks ago"           # Time-based filtering
git log --author="John Doe"             # Author filtering
git log --grep="bug fix"               # Message filtering
git log --follow -- file.txt          # Track file renames
```


### 10. Diff Operations - Understanding Changes


**🔬 Diff Algorithm Analysis:**


```bash
git diff                        # Working directory vs staging
git diff --cached              # Staging vs last commit
git diff --staged              # Same as --cached
git diff HEAD                  # Working directory vs last commit
```


**Myers Diff Algorithm:**
Git sử dụng Myers algorithm để compute shortest edit distance giữa two text files.


**Diff Output Format:**


```diff
diff --git a/file.txt b/file.txt
index 1234567..abcdefg 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 line 1
-old line 2
+new line 2
+added line 3
 line 3
```


**Understanding Diff Headers:**


- `---` represents old file
- `+++` represents new file
- `@@` shows line number ranges
- `-` lines were removed
- `+` lines were added
- ` ` lines unchanged


## 🏭 Production Reality - Git in Enterprise Environment


### Performance Optimization Strategies


**Large Repository Challenges:**


```
💭 Real FAANG Experience:
Tại Meta, Facebook's main repo có:
- Millions of files
- Decades của history
- Thousands của daily commits
- Global distributed teams
```


**Solutions We Implement:**


1. **Shallow Clones**:
bashgit clone --depth 1 repo-url     # Only latest commit
git clone --depth 10 repo-url    # Last 10 commits
2. **Partial Clones**:
bashgit clone --filter=blob:none repo-url    # No blob objects
git clone --filter=tree:0 repo-url       # No trees/blobs
3. **Sparse Checkout**:
bashgit sparse-checkout init --cone
git sparse-checkout set src/frontend/


### Branching Strategies in Production


**GitFlow vs GitHub Flow vs GitLab Flow:**


```
💭 Principal's Decision Framework:

GitFlow: Complex projects với planned releases
- main, develop, feature/*, release/*, hotfix/*
- Suitable for: Traditional software releases

GitHub Flow: Simple, continuous deployment
- main + feature branches
- Suitable for: Web applications, SaaS

GitLab Flow: Environment-based workflow
- main, pre-production, production
- Suitable for: Multi-environment deployments
```


### Advanced Git Configuration


**Global Configuration Best Practices:**


```bash
# User identity
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Default branch name
git config --global init.defaultBranch main

# Editor configuration
git config --global core.editor "code --wait"

# Merge tool
git config --global merge.tool vimdiff

# Line ending handling
git config --global core.autocrlf input    # Unix/Mac
git config --global core.autocrlf true     # Windows

# Performance optimization
git config --global core.precomposeunicode true
git config --global core.untrackedCache true
```


**Repository-Specific Configuration:**


```bash
# .gitconfig in repository
[core]
    repositoryformatversion = 0
    filemode = true
    bare = false
    logallrefupdates = true

[remote "origin"]
    url = git@github.com:company/repo.git
    fetch = +refs/heads/*:refs/remotes/origin/*

[branch "main"]
    remote = origin
    merge = refs/heads/main
```


### Security & Access Control


**SSH Key Management:**


```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@company.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Test connection
ssh -T git@github.com
```


**GPG Signing:**


```bash
# Configure GPG signing
git config --global user.signingkey [GPG-KEY-ID]
git config --global commit.gpgsign true
git config --global tag.gpgsign true

# Sign specific commit
git commit -S -m "Signed commit"
```


## 💭 Principal's Debugging Mental Model


### Common Git Scenarios & Solutions


**Scenario 1: "I committed to wrong branch"**


```bash
# Solution: Cherry-pick to correct branch
git log --oneline                    # Find commit hash
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1             # Remove from wrong branch
```


**Scenario 2: "I need to undo last commit but keep changes"**


```bash
git reset --soft HEAD~1             # Undo commit, keep staged
git reset --mixed HEAD~1            # Undo commit, unstage changes
git reset --hard HEAD~1             # Undo commit, lose changes
```


**Scenario 3: "Merge conflict resolution"**


```bash
# During merge conflict
git status                          # See conflicted files
# Edit files manually or use merge tool
git mergetool                       # Launch merge tool
git add .                          # Stage resolved files
git commit                         # Complete merge
```


**Scenario 4: "I want to see what changed"**


```bash
git diff HEAD~1 HEAD               # Compare last two commits
git diff --name-only HEAD~1 HEAD   # Just file names
git show <commit-hash>             # Show specific commit changes
git blame file.txt                 # See who changed each line
```


### Git Hooks - Automation in Workflow


**Pre-commit Hook Example:**


```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run tests before commit
npm test
if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi

# Check code formatting
npm run lint
if [ $? -ne 0 ]; then
    echo "Linting failed. Commit aborted."
    exit 1
fi
```


**Post-receive Hook for Deployment:**


```bash
#!/bin/sh
# .git/hooks/post-receive

while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    if [ "main" = "$branch" ]; then
        # Deploy to production
        cd /var/www/production
        git pull origin main
        npm install --production
        npm run build
        systemctl restart app
    fi
done
```


## 🎯 Mastery Verification & Advanced Concepts


### Understanding Git Internals


**Object Storage Deep Dive:**


```bash
# Explore Git objects
git cat-file -p HEAD                # Show commit object
git cat-file -p HEAD^{tree}         # Show tree object
git cat-file -p <blob-hash>         # Show blob content
git cat-file -t <object-hash>       # Show object type
```


**Manual Object Creation:**


```bash
# Create blob object manually
echo "Hello World" | git hash-object -w --stdin

# Create tree object
git mktree

# Create commit object
git commit-tree <tree-hash> -m "Manual commit"
```


### Advanced Rebase Operations


**Interactive Rebase Power:**


```bash
git rebase -i HEAD~3               # Interactive rebase last 3 commits

# Available operations:
pick    # Use commit as is
reword  # Change commit message
edit    # Stop to amend commit
squash  # Combine with previous commit
fixup   # Like squash but discard message
drop    # Remove commit entirely
```


**Rebase vs Merge Philosophy:**


```
💭 Principal's Guideline:

Rebase: Clean linear history
- Use for feature branches before merging
- Never rebase shared/public branches
- Perfect for cleaning up local commits

Merge: Preserve true history
- Use for integrating feature branches
- Shows actual development timeline
- Safer for collaborative work
```


### Git Worktrees - Multiple Working Directories


**Advanced Workflow:**


```bash
# Create new worktree
git worktree add ../hotfix hotfix-branch

# List all worktrees
git worktree list

# Remove worktree
git worktree remove ../hotfix
```


**Use Cases:**


- Work on multiple features simultaneously
- Keep production branch checked out for emergency fixes
- Run tests on different branches in parallel


## 🚀 Next Level Git Mastery


### Git Performance Monitoring


**Repository Health Checks:**


```bash
# Check repository integrity
git fsck --full                    # File system check

# Optimize repository
git gc                            # Garbage collection
git gc --aggressive               # Deep optimization

# Repository statistics
git count-objects -v              # Object count and size
```


**Large File Handling:**


```bash
# Git LFS for large files
git lfs track "*.psd"             # Track Photoshop files
git lfs track "*.zip"             # Track archives
git add .gitattributes            # Commit LFS configuration
```


### Advanced Git Aliases


**Productivity Boosters:**


```bash
# .gitconfig aliases
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk

    # Advanced aliases
    lg = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

    # Find commits that introduced/removed text
    grep-log = log --all --grep

    # Show files changed in commit
    changed = show --pretty="format:" --name-only
```


### Git in CI/CD Pipelines


**Pipeline Configuration Example:**


```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        fetch-depth: 0  # Full history for better analysis

    - name: Get changed files
      run: |
        git diff --name-only ${{ github.event.before }}..${{ github.sha }}

    - name: Run tests on changed files
      run: npm test -- --findRelatedTests $(git diff --name-only ${{ github.event.before }}..${{ github.sha }})
```


## 📊 Git Metrics & Analytics


### Repository Analytics


**Understanding Your Codebase Evolution:**


```bash
# Contributors statistics
git shortlog -sn                   # Commit count by author
git log --format='%aN' | sort -u   # Unique contributors

# Code churn analysis
git log --stat                     # Lines added/removed per commit
git log --numstat                  # Numeric statistics

# Hot spots identification
git log --format=format: --name-only | grep -v '^$' | sort | uniq -c | sort -nr
```


**Time-based Analysis:**


```bash
# Commits by time period
git log --since="1 month ago" --oneline | wc -l

# Activity by hour of day
git log --date=format:'%H' --format='%ad' | sort | uniq -c

# Activity by day of week
git log --date=format:'%w' --format='%ad' | sort | uniq -c
```


## 🔐 Git Security Best Practices


### Preventing Sensitive Data Leaks


**Pre-commit Scanning:**


```bash
# Install git-secrets
git secrets --install
git secrets --register-aws

# Scan for secrets
git secrets --scan
git secrets --scan-history
```


**Removing Sensitive Data:**


```bash
# Remove file from entire history
git filter-branch --force --index-filter \
    'git rm --cached --ignore-unmatch secrets.txt' \
    --prune-empty --tag-name-filter cat -- --all

# Modern approach with git-filter-repo
git filter-repo --path secrets.txt --invert-paths
```


### Access Control & Audit


**Signed Commits Verification:**


```bash
# Verify commit signatures
git log --show-signature

# Verify specific commit
git verify-commit <commit-hash>

# Verify tag signatures
git verify-tag <tag-name>
```


## 🌟 Git Philosophy & Best Practices


### Commit Message Standards


**Conventional Commits Format:**


```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

Examples:
feat(auth): add OAuth2 integration
fix(api): resolve race condition in user creation
docs(readme): update installation instructions
refactor(utils): extract common validation logic
```


**Why Good Commit Messages Matter:**


```
💭 Principal's Perspective:

Good commit messages are:
- Future you debugging at 2 AM
- New team members understanding codebase
- Automated changelog generation
- Code review context
- Incident investigation breadcrumbs
```


### Repository Structure Best Practices


**Directory Organization:**


```
project/
├── .github/                # GitHub specific files
│   ├── workflows/         # CI/CD pipelines
│   └── ISSUE_TEMPLATE/    # Issue templates
├── docs/                  # Documentation
├── src/                   # Source code
├── tests/                 # Test files
├── .gitignore            # Ignore patterns
├── .gitattributes        # Git attributes
├── README.md             # Project documentation
└── CONTRIBUTING.md       # Contribution guidelines
```


**Gitignore Patterns:**


```bash
# .gitignore examples

# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/
*.log

# Environment files
.env
.env.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Language specific
__pycache__/
*.pyc
*.class
```


## 💡 Advanced Problem Solving


### Git Forensics - Debugging Issues


**Finding When Bug Was Introduced:**


```bash
# Binary search for bug introduction
git bisect start
git bisect bad                    # Current commit is bad
git bisect good v1.0             # Known good commit
# Git will check out middle commit
# Test and mark as good/bad
git bisect good                   # or git bisect bad
# Repeat until found
git bisect reset                  # Clean up
```


**Who Changed What When:**


```bash
# Blame with more context
git blame -L 10,20 file.txt      # Lines 10-20
git blame -C file.txt            # Detect moved/copied lines
git blame -w file.txt            # Ignore whitespace

# Follow file through renames
git log --follow --patch -- file.txt
```


**Recovery Operations:**


```bash
# Recover deleted branch
git reflog                       # Find branch commit
git checkout -b recovered-branch <commit-hash>

# Recover deleted commits
git fsck --lost-found           # Find dangling commits
git show <dangling-commit>      # Examine content
git branch recovered <commit-hash>  # Create branch

# Recover from hard reset
git reflog                      # Find reset target
git reset --hard HEAD@{1}      # Go back to before reset
```


## 🎯 Testing Your Git Mastery


### Self-Assessment Questions


**Basic Level:**


1. Explain the difference between `git add`, `git commit`, and `git push`
2. What happens when you run `git checkout -b feature/new-feature`?
3. How do you undo the last commit while keeping your changes?


**Intermediate Level:**


1. Explain the difference between `git merge` and `git rebase`
2. How would you handle a merge conflict?
3. What's the purpose of `git stash` and when would you use it?


**Advanced Level:**


1. Explain Git's object model and how commits are stored
2. How would you recover a deleted branch?
3. Design a branching strategy for a team of 20 developers


**Expert Level:**


1. Explain the internals of `git rebase -i`
2. How would you migrate a large SVN repository to Git?
3. Design a Git workflow for a microservices architecture


## 🚀 Kết Luận: Becoming a Git Master


### The Journey to Git Mastery


```
💭 Principal's Final Thoughts:

Git mastery isn't about memorizing commands.
It's about understanding:

1. The problems Git solves
2. How Git's data model works
3. When to use which approach
4. How to recover when things go wrong
5. How to optimize for team productivity
```


### Progressive Learning Path


**Month 1: Foundation**


- Master basic commands (add, commit, push, pull)
- Understand staging area concept
- Practice branching and merging


**Month 2: Collaboration**


- Remote repositories and workflows
- Conflict resolution
- Pull requests and code review


**Month 3: Advanced Techniques**


- Rebase operations
- Git hooks and automation
- Performance optimization


**Month 4: Mastery**


- Git internals understanding
- Custom workflows design
- Teaching and mentoring others


### Resources for Continued Learning


**Books:**


- "Pro Git" by Scott Chacon
- "Git Internals" by Scott Chacon


**Practice Platforms:**


- Learn Git Branching (interactive tutorial)
- Git exercises on GitHub
- Contribute to open source projects


**Advanced Topics to Explore:**


- Git submodules and subtrees
- Custom merge drivers
- Git server administration
- Large repository optimization


Nhớ rằng, Git is a tool - powerful tool - but ultimately serves your development workflow. Master it to become more productive, but don't let complexity overshadow the simple goal: managing code changes effectively in a team environment.


Happy coding! 🚀
