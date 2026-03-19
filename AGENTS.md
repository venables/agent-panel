# AGENTS.md

## Commands

```bash
bun install     # Install dependencies
bun dev         # Run application
bun run build   # Build for production
bun test        # Run tests (bun:test)

bun check       # Run all checks (format, lint, typecheck, test)
bun fix         # Auto-fix format and lint issues
bun typecheck   # TypeScript type checking
bun lint        # Run oxlint with type-aware rules
bun format      # Run oxfmt formatter
```

## Coding Rules

- Use `bun` instead of `npm` or `pnpm`
- ALWAYS use strict TypeScript
- Use `bun:test` for testing
- ALWAYS document methods using TSDoc format with one newline after the
  description before the params
- ALWAYS colocate tests with source
- ALWAYS validate user input using `zod`
- ALWAYS create new objects, never mutate. Immutability is important.
- PREFER thin input layers (route handlers, input handler) which validate and
  delegate to services.
- NEVER use `any`
- AVOID mocking in tests.
- AVOID inline type casting with `as`, use `zod` instead.
- AVOID unnecessary try/catch
- AVOID large files. Use many small files with high cohesion, low coupling,
  organized by feature/domain not by type.

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] No secrets
- [ ] No mutation (immutable patterns used)
