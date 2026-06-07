# Deploy Skill

## Description
Handles deployment tasks for the project.

## Usage
`/deploy [environment]`

## Steps
1. Run tests to ensure nothing is broken
2. Build the project for the target environment
3. Deploy to the specified environment (default: staging)
4. Verify deployment health

## Environments
- `staging` — deploy to staging environment
- `production` — deploy to production (requires confirmation)

## Notes
- Always deploy to staging before production
- Check deployment logs after each deploy
