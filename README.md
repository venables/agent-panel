# startkit/typescript

A sane way to start your next TypeScript project. Fast, strict, and minimal.

## What's included

| Tool                                               | Purpose                  |
| -------------------------------------------------- | ------------------------ |
| [Bun](https://bun.sh)                              | Runtime, test runner     |
| [tsdown](https://tsdown.dev)                       | Build (rolldown-based)   |
| [oxlint](https://oxc.rs/docs/guide/usage/linter)   | Linting (type-aware)     |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter) | Formatting               |
| TypeScript 5                                       | Strict mode, all the way |

No ESLint. No Prettier. No slow tooling.

## Getting started

```bash
# Install dependencies
bun install

# Run the app
bun dev

# Build for production
bun run build

# Run the built output
bun start
```

## Scripts

```bash
bun run check        # Run all checks (format, lint, typecheck, test)
bun run fix          # Auto-fix format and lint issues
bun run typecheck    # TypeScript type checking
bun run lint         # Lint with type-aware rules
bun run format       # Format with oxfmt
bun test             # Run tests
bun run outdated     # Interactive dependency updates
bun run clean        # Clean build caches
bun run nuke         # Clean everything including node_modules
```

## Project structure

```
src/
  index.ts           # Entry point
tsconfig.json        # Strict TypeScript config
.oxlintrc.json       # Linter config (correctness: error, perf: warn)
.oxfmtrc.jsonc       # Formatter config (no semis, double quotes)
```

## Conventions

- Strict TypeScript -- no `any`, no `as` casts
- No semicolons, double quotes
- Imports are auto-sorted
- Tests use `bun:test`

## License

MIT
