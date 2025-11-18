# Changelog

All notable changes to TOSS Protocol Documentation will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial changelog documentation

## [1.0.0] - 2024-XX-XX

### Added
- Complete protocol documentation
- MCP integration for AI assistance
- Development workflow guidelines
- Changelog tracking system

### Changed
- 

### Deprecated
- 

### Removed
- 

### Fixed
- 

### Security
- 

---

## Changelog Guidelines

### When to Add Entries

**Add an entry for**:
- New documentation sections or pages
- Significant content updates
- New features added to documentation
- Breaking changes in documentation structure
- Security-related documentation updates
- Major reorganization of documentation

**Don't add entries for**:
- Minor typo fixes
- Formatting changes
- Internal refactoring without user impact

### Entry Format

Each change should include:

```markdown
### [Category]

- **Description**: Brief description of change
- **Reason**: Why this change was made
- **Issue**: Link to GitHub issue (if applicable)
- **Date**: YYYY-MM-DD
- **Author**: Name or GitHub username
```

**Categories**:
- `Added`: New features, pages, sections
- `Changed`: Updates to existing content
- `Deprecated`: Content marked for removal
- `Removed`: Deleted content
- `Fixed`: Bug fixes, corrections
- `Security`: Security-related updates

### Example Entry

```markdown
### Added

- **RiskEngine Contract Documentation**: Added comprehensive RiskEngine contract specification with all functions, parameters, and test scenarios
- **Reason**: Critical contract documentation was missing, needed for developers to understand risk validation system
- **Issue**: [#123](https://github.com/toss/docs/issues/123)
- **Date**: 2024-01-15
- **Author**: @technical-writer
```

### Versioning

Follow semantic versioning:
- **MAJOR**: Breaking changes, major reorganization
- **MINOR**: New features, significant additions
- **PATCH**: Bug fixes, minor updates

### Deployment Process

1. **Before Deploy**: Update CHANGELOG.md with all changes in current release
2. **Commit**: Include CHANGELOG.md update in release commit
3. **Tag**: Create git tag with version number
4. **Deploy**: Documentation deploys automatically
5. **Verify**: Check deployed documentation includes changelog

---

**Related**: [Development Workflow](/mcp-integration/development-workflow), [Git Best Practices](/.cursor/rules/git.mdc)

