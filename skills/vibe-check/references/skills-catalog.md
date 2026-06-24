# vibe-check skills catalog

The roster of skills in this library. **vibe-check appends this list to its completion
message** so the user discovers the whole toolbox after onboarding. This file is the single
source of truth for that roster.

> **Maintenance rule:** whenever a new skill is added to the library, append one line below —
> `- **<skill-name>** — <one-line description>`. One line per skill. That's all it takes for
> vibe-check to start surfacing it.

- **vibe-check** — audit a Next.js repo against the mandatory requirements, fix what's missing, and remember the setup
- **new-vibe** — start a new feature or fix on its own git branch, following the project's branch conventions
- **deep-scout** — deeply analyze the project's structure/folder layout and reorganize it toward a clean, conventional Next.js layout (with permission)
- **safe-deploy** — ship the current branch safely: run the quality gate, open a PR with a preview, and merge to production only on your approval
- **rollback** — production is broken: instantly revert Vercel to the last working deployment, then reconcile the code so the bug doesn't come back
