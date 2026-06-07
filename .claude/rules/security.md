# Security Rules

## Input Validation
- Validate and sanitize all user input at system boundaries
- Never trust data from external sources without validation

## Secrets
- Never hardcode secrets, tokens, or credentials in code
- Use environment variables or a secrets manager
- Do not log sensitive data

## Common Vulnerabilities to Avoid
- SQL injection: use parameterized queries
- XSS: escape output in templates
- CSRF: use tokens for state-changing requests
- Path traversal: validate file paths before use
