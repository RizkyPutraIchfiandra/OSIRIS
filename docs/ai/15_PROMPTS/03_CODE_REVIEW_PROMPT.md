# Prompt — Review Changes

Review the current git diff as a cautious senior engineer. Do not modify files during the first review pass.

Check:
- Does the implementation meet the task and acceptance criteria?
- Does it fit existing architecture and conventions?
- Are error, loading, empty, stale, and partial-data states handled?
- Are inputs and external payloads validated?
- Are secrets protected?
- Are timestamps, timezone rules, coordinates, and units handled correctly?
- Are source provenance and attribution preserved?
- Are accessibility and responsive behavior considered?
- Are tests meaningful and deterministic?
- Are there unrelated changes, duplicated helpers, unnecessary dependencies, or dead code?
- Does documentation match actual behavior?

Return findings ordered by severity with file/line references where possible. Separate confirmed defects from suggestions. If asked to fix findings, fix only confirmed issues and rerun relevant checks.
