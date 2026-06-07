Error: ENOENT: no such file or directory, open '/home/thienngo/application/claude-structure-folder/.agents/skills/nestjs-best-practices/metadata.json'# Claude Project Structure Guide

A reference for the standard Claude Code project layout and the purpose of each file.

---

## Directory Tree

```
your-project/
├── .claude/
│   ├── settings.json
│   ├── settings.local.json
│   ├── CLAUDE.md
│   ├── rules/
│   │   ├── code-style.md
│   │   ├── testing.md
│   │   └── security.md
│   ├── skills/
│   │   └── deploy/
│   │       └── SKILL.md
│   ├── agents/
│   │   └── code-reviewer.md
│   └── commands/
│       └── optimize.md
├── CLAUDE.md
└── .mcp.json
```

---

## Root-Level Files

### `CLAUDE.md`
The main project instruction file. Claude reads this automatically at the start of every conversation in this directory. Use it to describe the project, its architecture, common commands, and behavioral rules for Claude.

**Committed to git** — shared with the whole team.

### `.mcp.json`
Project-scoped MCP (Model Context Protocol) server configuration. Defines external tool servers (databases, APIs, custom tools) that Claude can connect to within this project.

**Committed to git** — shared with the whole team.

---

## `.claude/` Directory

Houses all Claude-specific configuration, instructions, and extensions for the project.

---

### `.claude/settings.json`
Shared project-level settings for Claude Code. Controls permissions (which tools Claude is allowed or denied to use), and other project-wide behaviors.

**Committed to git** — applies to all contributors.

Example:
```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Bash(git *)"],
    "deny": ["Bash(rm -rf *)"]
  }
}
```

---

### `.claude/settings.local.json`
Personal overrides for Claude Code settings. Intended for individual developer preferences that should not be shared with the team.

**Gitignored** — never committed to version control.

---

### `.claude/CLAUDE.md`
An alternative location for project instructions, equivalent to the root `CLAUDE.md`. Useful when you prefer to keep all Claude-related files inside `.claude/`.

Claude merges instructions from both locations if both files exist.

---

### `.claude/rules/`
Modular instruction files that break project rules into focused topics. Claude loads these alongside `CLAUDE.md` to apply scoped guidance.

| File | Purpose |
|------|---------|
| `code-style.md` | Formatting, naming conventions, and style preferences |
| `testing.md` | Test coverage requirements and testing patterns |
| `security.md` | Security rules, input validation, secrets handling |

Splitting rules into separate files keeps each file focused and makes it easy to add or update a single rule category without touching the others.

---

### `.claude/skills/`
Custom skills that extend Claude Code with project-specific slash commands. Each skill lives in its own subdirectory containing a `SKILL.md` file that defines the skill's behavior.

**Structure:**
```
skills/
└── <skill-name>/
    └── SKILL.md
```

**Usage:** Invoke a skill with `/<skill-name>` in the Claude Code chat.

**Example — `skills/deploy/SKILL.md`:**
Defines the `/deploy` command, which automates the deployment workflow: running tests, building, deploying to an environment, and verifying health.

---

### `.claude/agents/`
Custom subagent definitions. Each file describes a specialized agent that Claude can spawn to handle a focused task autonomously, keeping the main conversation context clean.

**Example — `agents/code-reviewer.md`:**
Defines a `code-reviewer` subagent with specific instructions for reviewing code — what to look for, how to categorize feedback, and what tone to use.

---

### `.claude/commands/`
Legacy custom slash commands (predating the `skills/` system). Each `.md` file defines a command that can be invoked with `/<filename>` in Claude Code.

**Example — `commands/optimize.md`:**
Defines the `/optimize` command, which analyzes and improves the selected code for performance and readability without changing behavior.

> **Note:** For new commands, prefer `skills/` over `commands/` as it is the current standard.

---

## How Claude Loads These Files

When you start a conversation, Claude Code automatically reads configuration in this order:

1. Root `CLAUDE.md` — main project instructions
2. `.claude/CLAUDE.md` — supplementary project instructions
3. `.claude/rules/*.md` — modular rule files
4. `.claude/settings.json` — permissions and settings

Skills, agents, and commands are loaded on demand when invoked.

---

## Git Hygiene

Add the following to your `.gitignore`:

```
.claude/settings.local.json
```

Everything else in this structure should be committed and shared with your team.
