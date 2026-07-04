# {{release_title}}

> **Release tag:** `{{release_tag}}`
> **Target commit:** `{{target_sha_short}}`
> **Changes since:** {{previous_release}}
> **Release generated:** {{release_generated_at}}
> **Release channel:** {{release_channel}}

## 📦 Release Overview

| Release detail    | Value                        |
| ----------------- | ---------------------------- |
| Release tag       | `{{release_tag}}`            |
| Target commit     | `{{target_sha_short}}`       |
| Previous release  | {{previous_release}}         |
| Commits included  | {{commit_count}}             |
| Files changed     | {{changed_file_count}}       |
| Contributors      | {{contributor_count}}        |
| Lines added       | {{lines_added}}              |
| Lines removed     | {{lines_removed}}            |
| Release readiness | {{release_readiness_status}} |

## ✨ What’s New

{{ai_changelog}}

## 🧪 Quality and Test Coverage

| Check         | Status                | Result                 | Evidence                |
| ------------- | --------------------- | ---------------------- | ----------------------- |
| Test coverage | {{coverage_status}}   | {{coverage_summary}}   | {{coverage_evidence}}   |
| Sonar         | {{sonar_status}}      | {{sonar_summary}}      | {{sonar_evidence}}      |
| Codeball      | {{codeball_status}}   | {{codeball_summary}}   | {{codeball_evidence}}   |
| Miticulous    | {{miticulous_status}} | {{miticulous_summary}} | {{miticulous_evidence}} |

## 🔐 Security and Supply Chain

| Check              | Status                        | Result                         | Evidence                        |
| ------------------ | ----------------------------- | ------------------------------ | ------------------------------- |
| Gitleaks           | {{gitleaks_status}}           | {{gitleaks_summary}}           | {{gitleaks_evidence}}           |
| Dependency Review  | {{dependency_review_status}}  | {{dependency_review_summary}}  | {{dependency_review_evidence}}  |
| CodeQL             | {{codeql_status}}             | {{codeql_summary}}             | {{codeql_evidence}}             |
| Container Security | {{container_security_status}} | {{container_security_summary}} | {{container_security_evidence}} |
| Snyk               | {{snyk_status}}               | {{snyk_summary}}               | {{snyk_evidence}}               |
| Dependabot         | {{dependabot_status}}         | {{dependabot_summary}}         | {{dependabot_evidence}}         |

## 📈 Operations and Automated Review

| Check     | Status               | Result                | Evidence               |
| --------- | -------------------- | --------------------- | ---------------------- |
| Datadog   | {{datadog_status}}   | {{datadog_summary}}   | {{datadog_evidence}}   |
| Herculese | {{herculese_status}} | {{herculese_summary}} | {{herculese_evidence}} |

## 🚦 Release Gate Summary

| Area                               | Status                       | Release impact                |
| ---------------------------------- | ---------------------------- | ----------------------------- |
| Build, lint, typecheck, and tests  | {{workspace_checks_status}}  | {{workspace_checks_impact}}   |
| Security scans                     | {{security_scans_status}}    | {{security_scans_impact}}     |
| Dependency and supply-chain review | {{supply_chain_status}}      | {{supply_chain_impact}}       |
| Container image review             | {{container_scans_status}}   | {{container_scans_impact}}    |
| Runtime and observability review   | {{runtime_review_status}}    | {{runtime_review_impact}}     |
| Overall release decision           | {{release_readiness_status}} | {{release_readiness_summary}} |

## 🧭 Scan Status Guide

| Status           | Meaning                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| ✅ Passed        | The scan completed and no release-blocking findings were reported.                     |
| ⚠️ Review needed | The scan completed but produced findings that need human review.                       |
| ❌ Failed        | The scan failed, found release-blocking issues, or could not meet its configured gate. |
| ⏭️ Not run       | The scan was intentionally skipped, unavailable, or not configured for this release.   |
| ℹ️ Informational | The scan completed successfully but is advisory only.                                  |

## 🛡️ Security Review Notes

{{security_review_notes}}

## 🔎 Detailed Release Scan Report

{{scan_report}}

## 🗂️ Complete Change Inventory

<details>
<summary>Show every changed file in this release</summary>

{{changed_file_inventory}}

</details>

## 🧾 Complete Commit List

<details>
<summary>Show every commit included in this release</summary>

{{complete_commit_list}}

</details>

## 🔗 Compare This Release

[View the complete comparison]({{compare_url}})

---

> This release record was generated from GitHub Actions evidence.
>
> The readable release summary was drafted with GitHub Models and refined by Gemini.
>
> Scan results, commit history, changed-file inventory, and attached workflow reports remain the factual source of truth.
