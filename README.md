# dibs

Call dibs on a name — check availability across domains, social media, package registries, and trademarks in one command.

```
dibs acme
```

dibs checks your name across 16+ platforms simultaneously and tells you what's available and what's taken. Optionally generate variants like `useacme`, `acmehq`, `acmedev` to find the best available version.

## Install

```sh
npm install -g dibs-cli
```

Or run directly:

```sh
npx dibs-cli acme
```

## Quick Start

```sh
# Interactive mode — prompts for everything
dibs

# Check a name on all platforms
dibs acme

# Also check variants (useacme, acmehq, etc.)
dibs acme -v all

# Only check specific variant patterns
dibs acme -v hq,use,app

# Check specific platforms only
dibs acme -o github,npm,domain

# Check specific TLDs only
dibs acme -t com,ai,dev

# Output as JSON
dibs acme -f json

# Export as CSV
dibs acme -f csv > report.csv
```

## What It Checks

| Category | Platforms | Flag IDs |
|---|---|---|
| **Domains** | WHOIS lookup for any TLD | `domain` |
| **Social** | GitHub, X/Twitter, Instagram, LinkedIn, TikTok, YouTube, Reddit | `github`, `twitter`, `instagram`, `linkedin`, `tiktok`, `youtube`, `reddit` |
| **Packages** | npm, PyPI, crates.io, RubyGems, Go (pkg.go.dev), Homebrew, Docker Hub | `npm`, `pypi`, `crates`, `rubygems`, `go`, `homebrew`, `dockerhub` |
| **Legal** | USPTO Trademark | `trademark` |

### Default TLDs

`.com`, `.dev`, `.io`, `.ai`, `.co`, `.app`

All available TLDs: `.com`, `.dev`, `.io`, `.ai`, `.co`, `.app`, `.org`, `.net`, `.sh`, `.so`, `.run`, `.to`, `.me`, `.cc`, `.xyz`, `.tech`, `.tools`, `.design`, `.studio`, `.inc`

## Variants

By default, only the exact name is checked. Use `--variants` / `-v` to also check common alternatives and find the best available version for your brand.

**Prefixes:** `use___`, `get___`, `try___`, `go___`, `hey___`, `my___`, `the___`, `with___`, `on___`, `by___`

**Suffixes:** `___hq`, `___app`, `___dev`, `___io`, `___labs`, `___so`, `___inc`, `___co`, `___team`, `___run`, `___now`, `___ai`, `___sh`, `___cli`, `___api`, `___js`

```sh
# Check all variants
dibs acme -v all

# Check specific patterns only
dibs acme -v hq,use,app
```

With `-v all`, checking `acme` also checks `useacme`, `getacme`, `acmehq`, `acmeapp`, `acmedev`, and 21 more variants. Each is scored and ranked.

## Scoring & Recommendations

Each check result is one of three statuses:

| Status | Meaning |
|---|---|
| `available` | The name is not taken on that platform |
| `taken` | The name is already registered/in use |
| `error` | The check failed (rate limit, timeout, etc.) — does not penalize the score |

Platforms are weighted by importance to a business:

| Weight | Platforms |
|---|---|
| **15×** | `.com` domain |
| **12×** | USPTO Trademark |
| **8×** | X / Twitter |
| **7×** | Instagram, LinkedIn |
| **6×** | GitHub, `.ai` domain |
| **5×** | TikTok, YouTube, `.com`-adjacent domains |
| **4×** | Reddit, `.co`, `.app` domains |
| **2-3×** | Package registries (npm, PyPI, crates.io, etc.) |

The weighted score produces a verdict:

| Score | Verdict |
|---|---|
| ≥ 80% | 🎉 **Great** — widely available, grab it now |
| ≥ 60% | 👍 **Good** — solid choice with minor conflicts |
| ≥ 35% | 🤔 **Fair** — notable gaps, consider a variant |
| < 35% | 👎 **Poor** — largely taken, try a different name |

## Output Formats

### Pretty (default)

Human-readable report with colors, progress bars, and grouped results:

```sh
dibs acme
```

Shows a variant ranking table, detailed per-platform results for the best variant, and a recommendation with actionable details.

### JSON

```sh
dibs acme -f json
```

```json
{
  "recommendation": {
    "verdict": "poor",
    "summary": "\"acme\" is largely taken. Try a different name or variant.",
    "details": [
      "✗ .com domain is taken — consider a variant or alternative TLD",
      "✗ Only 2/7 social handles available — branding will be inconsistent",
      "◐ 5/7 package registries available",
      "⚠ Possible USPTO trademark conflict — consult a lawyer before proceeding"
    ]
  },
  "best": {
    "name": "acme",
    "pattern": "bare",
    "score": 28,
    "available": 10,
    "taken": 12,
    "errors": 0,
    "total": 22,
    "results": [
      { "platform": "Domain acme.com", "status": "taken", "url": "https://acme.com", "message": null },
      { "platform": "GitHub", "status": "taken", "url": "https://github.com/acme", "message": null },
      { "platform": "npm", "status": "available", "url": "https://www.npmjs.com/package/acme", "message": null }
    ]
  },
  "variants": [
    { "name": "acme", "pattern": "bare", "score": 28, "available": 10, "taken": 12, "errors": 0, "total": 22 }
  ]
}
```

Pipe to `jq` for extraction:

```sh
# Get the best variant name
dibs acme -f json | jq -r '.best.name'

# List all available platforms for the best variant
dibs acme -f json | jq '.best.results[] | select(.status == "available") | .platform'

# Get all variant scores
dibs acme -v all -f json | jq '.variants[] | {name, score}'
```

### CSV

```sh
dibs acme -f csv > report.csv
```

```
variant,pattern,platform,status,url,message
acme,bare,Domain acme.com,taken,https://acme.com,
acme,bare,GitHub,taken,https://github.com/acme,
acme,bare,npm,available,https://www.npmjs.com/package/acme,
```

## CLI Reference

```
dibs [OPTIONS] [NAME]
```

| Flag | Short | Description |
|---|---|---|
| `NAME` | | The name to check (omit for interactive mode) |
| `--only` | `-o` | Platforms to check (comma-separated) |
| `--tlds` | `-t` | TLDs to check (comma-separated, e.g. `com,ai,dev`) |
| `--variants` | `-v` | Enable variants: `all` for every pattern, or comma-separated list (e.g. `hq,use,app`) |
| `--format` | `-f` | Output format: `pretty`, `json`, or `csv` (default: `pretty`) |
| `--help` | `-h` | Show help with full documentation |

### Interactive Mode

Run `dibs` with no arguments to enter interactive mode. You'll be prompted to:

1. Enter the name
2. Select which platforms to check
3. Select which TLDs to check
4. Choose whether to generate variants and which patterns to use

### Non-Interactive Mode

Pass the name as a positional argument. All options can be set via flags. This is ideal for scripts, CI, and LLM tool use.

```sh
# Minimal — just check npm and GitHub for one name
dibs myproject -o npm,github -f json

# Full sweep with JSON output
dibs myproject -f json

# Full sweep with variants
dibs myproject -v all -f json

# Narrow check — just domains
dibs myproject -o domain -t com,dev,ai,app -f json
```

## Error Handling

Every platform check is wrapped in error handling. If a check fails (network timeout, rate limit, service down), it returns `{ status: "error" }` with a message instead of crashing. Errors do **not** count against the score — they reduce the total possible score so your recommendation isn't unfairly penalized.

The CLI always exits with code 0 when given valid arguments, regardless of check failures.

## How It Works

1. **Name cleaning** — the input is lowercased and stripped to `[a-z0-9-]`
2. **Variant generation** — prefixes and suffixes are applied to create alternatives (when `-v` is used)
3. **Parallel checking** — all variants × all platforms are checked concurrently
4. **Scoring** — each variant gets a weighted score based on platform importance
5. **Recommendation** — variants are ranked by score, the best is highlighted with a verdict

## Development

```sh
git clone https://github.com/your-username/dibs-cli
cd dibs-cli
npm install

# Run in development
npm run dev

# Type check
npx tsc --noEmit

# Unit tests (79 tests, mocked, fast)
npm test

# Integration tests (34 tests, real network calls)
npm run test:integration

# Build
npm run build

# Link globally for local use
npm link
```

## License

MIT
