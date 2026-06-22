<!--
.github/PULL_REQUEST_TEMPLATE/documentation.md

PR title format:
docs(scope): concise description

Examples:
docs(repo): improve local development setup guide
docs(core): document error handling conventions
docs(devportal): add authentication service reference
docs(frontend): explain account settings workflow
-->

# 📚 Documentation Update

## ✨ Summary

<!--
Briefly explain what documentation changed and why.

Examples:
- Add setup instructions for local development.
- Update API contract documentation for user preferences.
- Clarify Cloudflare deployment workflow.
- Improve contribution guidance and repository conventions.
-->

## 🔗 Related issue

<!--
Optional for documentation updates.

Examples:
Closes #123
Related to #456
AER-123
-->

## 🎯 Documentation goal

<!--
What problem does this documentation change solve?

Examples:
- Reduce onboarding friction.
- Explain a confusing workflow.
- Keep docs aligned with implementation.
- Document a new feature or API.
- Correct outdated information.
-->

- [ ] New documentation
- [ ] Documentation correction
- [ ] Documentation expansion
- [ ] Documentation cleanup
- [ ] API or contract reference update
- [ ] Architecture documentation update
- [ ] Developer onboarding improvement
- [ ] Deployment or infrastructure documentation update
- [ ] Contributor documentation update
- [ ] Other

## 🗂 Documentation areas updated

<!-- Select every area affected by this pull request. -->

- [ ] README
- [ ] Contributor documentation
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Developer portal documentation
- [ ] Frontend or user-facing help content
- [ ] Service documentation
- [ ] Database documentation
- [ ] Infrastructure documentation
- [ ] Deployment documentation
- [ ] CI/CD documentation
- [ ] Security documentation
- [ ] Repository tooling documentation
- [ ] Code comments or TSDoc
- [ ] Other

## 🧩 Affected Aerealith areas

<!-- Select every relevant product, service, application, or library area. -->

- [ ] Frontend
- [ ] Documentation
- [ ] Developer portal
- [ ] Core library
- [ ] Database library
- [ ] API library
- [ ] UI library
- [ ] Utility library
- [ ] Configuration library
- [ ] Feature flags
- [ ] Authentication service
- [ ] User service
- [ ] Discord service
- [ ] Infrastructure
- [ ] Cloudflare
- [ ] Nx Cloud
- [ ] Docker
- [ ] CI/CD
- [ ] Repository tooling
- [ ] No code area directly affected

## 📝 Changes made

<!--
Explain what was added, removed, corrected, or reorganized.

Useful details:
- New guides, sections, examples, or diagrams
- Updated commands, paths, configuration names, or environment variables
- Removed outdated instructions
- Updated API contracts or endpoint examples
- Reorganized content for easier discovery
-->

## ✅ Accuracy review

<!--
Confirm the documentation reflects the current state of the repository.
Do not check an item unless you actually reviewed it.
-->

- [ ] Commands, scripts, and package-manager instructions were verified.
- [ ] File paths, library names, app names, and service names were verified.
- [ ] Code examples were reviewed for correctness.
- [ ] API routes, request shapes, response shapes, and error behavior were reviewed where applicable.
- [ ] Environment variables, secrets references, and deployment instructions were reviewed where applicable.
- [ ] Links, references, and external resources were reviewed.
- [ ] Terminology matches the current Aerealith architecture and branding.
- [ ] Obsolete or conflicting documentation was updated or removed.
- [ ] No private URLs, tokens, credentials, or sensitive operational details were added.

## 🧪 Validation performed

<!--
List the commands or checks you actually ran.

Examples:
pnpm lint
pnpm nx run docs:build
pnpm nx build frontend
pnpm prettier --check .
-->

```sh
# Commands run:
```

### Validation checklist

- [ ] I reviewed all modified Markdown, MDX, YAML, and documentation files.
- [ ] I checked formatting and rendered output where applicable.
- [ ] I ran relevant documentation, lint, typecheck, or build commands.
- [ ] I verified internal links and navigation where applicable.
- [ ] I verified code blocks and command examples where applicable.
- [ ] I updated screenshots, diagrams, or visual references where applicable.
- [ ] I confirmed no documentation changes are needed outside this pull request.
- [ ] I did not add secrets, credentials, tokens, private URLs, or sensitive data.

## 📸 Screenshots or rendered previews

<!--
Attach screenshots, rendered documentation previews, or before/after examples
when the documentation has visual layout, UI, diagram, or dev portal changes.

Write "Not applicable" when this pull request only changes plain text content.
-->

## 🚨 Migration or behavior notes

<!--
Document behavior changes, renamed APIs, deprecated commands, migration steps,
or compatibility notes that readers need to understand.

Write "None" when this pull request only improves or corrects documentation.
-->

## 🔄 Follow-up documentation work

<!--
List documentation that should be updated later.

Examples:
- Add service-specific troubleshooting guide.
- Update screenshots after frontend redesign.
- Add API examples once endpoint implementation lands.
- None.
-->

## 📝 Additional notes

<!--
Add reviewer guidance, source references, implementation links, or context that
will help future contributors understand why this documentation changed.
-->
