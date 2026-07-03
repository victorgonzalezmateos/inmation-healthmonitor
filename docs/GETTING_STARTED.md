# Getting Started — Kanvas + Obsidian

This guide is for **you** (the human). Agents follow `AGENTS.md` and `RULES.md`.

## 1. Open the vault

1. Launch [Obsidian](https://obsidian.md/)
2. **Open folder as vault** → select:
   ```
   C:\Users\GOAKJ\Documents\Cursor Project\inmation-healthmonitor
   ```

## 2. Enable Canvas Watcher

1. **Settings** → **Community plugins**
2. Turn on community plugins if prompted
3. Enable **Canvas Watcher**

The plugin runs on every canvas save. It updates the Errors and Warnings cards, manages blocked (gray) states, and detects dependency issues.

## 3. Open the task board

Open **`Project.canvas`** in Obsidian. You will see:

- **Legend** — color meanings (left side)
- **6 groups** — Discovery Contracts → Post Parity Enhancements
- **14 task cards** — currently all **Purple** (proposed)

## 4. Understand the colors

| Color | Meaning | Who sets it |
|-------|---------|-------------|
| Purple | Proposed — not approved yet | Agent or initial plan |
| Red | To Do — ready to work | **You** |
| Orange | Doing — agent is working | Agent (`start`) |
| Cyan | Ready for your review | Agent (`finish`) |
| Green | Done | **You** |
| Gray | Blocked — waiting on dependencies | Auto (Canvas Watcher) |

## 5. Approve tasks to start work

Before the Cursor agent can work on a task:

1. Review the card in Obsidian
2. Right-click → **Color** → **Red** to approve
3. Save the canvas (`Ctrl + S`)

To reject a proposal, delete the card.

**First task to approve:** **DC-01** — Freeze captured Health Monitor source contracts.

## 6. Start a work session in Cursor

After approving DC-01 (Purple → Red), tell the agent:

> Start DC-01

The agent will:
1. Run `python canvas-tool.py "Project.canvas" start DC-01` (Red → Orange)
2. Do the work (e.g. document source contracts)
3. Run `finish DC-01` (Orange → Cyan)
4. Ask you to review

You then mark the card **Green** in Obsidian when satisfied. Dependent tasks unlock automatically.

## 7. Check board status from terminal

From the project folder:

```powershell
python canvas-tool.py "Project.canvas" status
python canvas-tool.py "Project.canvas" ready
python canvas-tool.py "Project.canvas" show DC-01
```

## 8. Save work to GitHub

```powershell
git add .
git commit -m "Describe your change"
git push
```

## Typical session loop

```
Review board in Obsidian
    → Approve tasks (Purple → Red)
    → Agent starts and finishes work (Red → Orange → Cyan)
    → You verify (Cyan → Green)
    → Next tasks unlock
    → Commit and push
```

## Paths on this machine

| Item | Path |
|------|------|
| Project | `C:\Users\GOAKJ\Documents\Cursor Project\inmation-healthmonitor` |
| Kanvas install | `C:\Users\GOAKJ\Documents\Cursor Project\Kanvas` |
| GitHub | https://github.com/victorgonzalezmateos/inmation-healthmonitor |
