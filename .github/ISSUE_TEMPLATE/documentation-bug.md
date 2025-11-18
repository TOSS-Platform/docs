---
name: 🐛 Documentation Bug Report
about: Report errors, broken links, or incorrect information
title: 'fix: [Brief description]'
labels: 'documentation, bug'
assignees: ''

---

## 🐛 Bug Description

**What is the issue?**

A clear and concise description of the bug.

## 📍 Location

**Where is the bug located?**

- **Page/Section**: [e.g., `/protocol/contracts/risk/RiskEngine`]
- **Specific line/paragraph**: [if applicable]
- **URL**: [if deployed, e.g., `https://docs.toss.fi/protocol/contracts/risk/RiskEngine`]

## 🔍 Current Behavior

**What is currently happening?**

Describe the incorrect behavior or error.

**Example**:
- Broken link to `/protocol/contracts/core` returns 404
- Incorrect formula: `FI = 0.45×L` should be `FI = 0.45×L + 0.25×B + ...`
- Missing information about slashing threshold

## ✅ Expected Behavior

**What should happen instead?**

Describe the correct behavior or expected content.

**Example**:
- Link should point to `/protocol/contracts/core/TOSS`
- Formula should include all components
- Should explain that slashing triggers at FI ≥ 30

## 🔗 Related Content

**Links to affected pages**:
- [Affected page 1](/path/to/page)
- [Related page 2](/path/to/page)

## 📸 Screenshots (Optional)

If applicable, add screenshots to help explain the problem.

## 🔍 Additional Context

**Any other relevant information**:
- Browser/device (if UI issue)
- Build environment (if build issue)
- Related issues or PRs

---

## 📌 Checklist for Issue Creator

- [ ] Searched existing issues to avoid duplicates
- [ ] Verified bug exists in latest version
- [ ] Provided specific location
- [ ] Described expected vs actual behavior

---

## 📌 Checklist for Fixer

- [ ] Create fix branch: `fix/bug-description`
- [ ] Fix the issue
- [ ] Test locally
- [ ] Verify build passes
- [ ] Create PR with conventional commit format
- [ ] Update CHANGELOG.md with fix entry
- [ ] Link PR to this issue

