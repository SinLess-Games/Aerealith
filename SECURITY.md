# Security Policy

## Supported Versions

Aerealith is currently developed from the `master` branch. Until a versioned
release support matrix is published, security fixes are applied to the latest
maintained source on that branch.

| Version or branch                                         | Security support   |
| --------------------------------------------------------- | ------------------ |
| `master`                                                  | :white_check_mark: |
| Release versions explicitly marked as supported           | :white_check_mark: |
| Older commits, feature branches, and unsupported releases | :x:                |

## Reporting a Vulnerability

Please **do not** report suspected vulnerabilities through public GitHub Issues,
Discussions, pull requests, chat channels, or social media.

Use the repository's **Security** tab and select **Report a vulnerability** to
submit a private report. This is the preferred reporting channel.

A helpful report includes:

- A clear description of the issue and its potential impact.
- The affected application, service, library, endpoint, workflow, or file.
- The affected version, branch, commit, or deployment environment.
- Safe, minimal reproduction steps or a proof of concept.
- Any relevant logs, screenshots, or request/response details with secrets,
  personal data, access tokens, and credentials removed or redacted.
- Suggested mitigations, when available.

If you discover an exposed credential or secret, do not use it. Report the
location and a redacted identifier privately so it can be rotated and
investigated.

## What to Expect

We aim to:

1. Acknowledge a valid private report within **5 business days**.
2. Assess the report, severity, and affected scope as quickly as practical.
3. Provide a status update within **10 business days** after triage begins,
   unless active investigation requires a different timeline.
4. Coordinate a fix, mitigation, or documented decision before public
   disclosure.
5. Publish a GitHub Security Advisory and, when appropriate, request a CVE
   after a fix is available.
6. Credit reporters in the advisory when they give permission.

We may close reports that are duplicates, already known, unsupported, or not
reproducible. When possible, we will explain the decision privately.

## Scope

Reports are welcome for vulnerabilities affecting code, configuration, build
and deployment workflows, documentation examples, or official Aerealith-hosted
services that are maintained in this repository.

Please avoid:

- Accessing, modifying, deleting, or exfiltrating data that you do not own.
- Testing against accounts, systems, or users without explicit authorization.
- Denial-of-service testing, high-volume scanning, social engineering, or
  physical attacks.
- Public disclosure before coordinated remediation.

Third-party products and services should be reported to their respective
security teams unless the vulnerability is caused by Aerealith-owned code or
configuration.

## Coordinated Disclosure

Please allow reasonable time for investigation and remediation before sharing
details publicly. We will work in good faith to coordinate disclosure and
protect affected users while a fix is prepared.

Thank you for helping keep Aerealith and its community safer.
