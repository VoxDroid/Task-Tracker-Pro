# Pull Request

## Description

<!-- Provide a clear and concise description of your changes. What problem does this solve, or what feature does it add? -->

## Related Issue

<!-- Link to the issue this PR addresses. Use keywords like "Fixes", "Closes", or "Resolves" for automatic issue closing. -->

Fixes #

## Type of Change

<!-- Mark the relevant option(s) with an "x" -->

- [ ] **Bug fix** - Non-breaking change that fixes an issue
- [ ] **New feature** - Non-breaking change that adds functionality
- [ ] **Breaking change** - Fix or feature that would cause existing functionality to change
- [ ] **Documentation** - Updates to documentation only
- [ ] **Style/UI** - Changes to styling, UI components, or visual elements
- [ ] **Refactor** - Code changes that neither fix a bug nor add a feature
- [ ] **Performance** - Changes that improve performance
- [ ] **Tests** - Adding or updating tests
- [ ] **Configuration** - Changes to build process, dependencies, or tooling
- [ ] **Security** - Security-related changes

## Affected Areas

<!-- Mark all areas of the application affected by this change -->

- [ ] Dashboard
- [ ] Tasks Management
- [ ] Projects Management
- [ ] Time Tracking
- [ ] Archive
- [ ] Settings
- [ ] Search Functionality
- [ ] Database Operations
- [ ] Activity Logs
- [ ] API Routes
- [ ] UI Components
- [ ] Electron (Desktop App)
- [ ] Other: <!-- specify -->

## Testing

### How Has This Been Tested?

<!-- Describe the tests you ran to verify your changes. Provide instructions so reviewers can reproduce. -->

- [ ] **Desktop App (Electron)** - Tested on:
  - [ ] Windows
  - [ ] macOS
  - [ ] Linux

- [ ] **Web Browser** - Tested on:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

### Test Scenarios

<!-- List the specific scenarios you tested -->

1.
2.
3.

### Node.js Version

<!-- What version of Node.js did you use for testing? -->

- Node.js version:

## Screenshots / Recordings

<!-- If your changes affect the UI, include before/after screenshots or recordings -->

### Before

<!-- Add screenshots of the previous behavior (if applicable) -->

### After

<!-- Add screenshots of the new behavior -->

## Checklist

<!-- Mark completed items with an "x" -->

### Code Quality

- [ ] My code follows the project's coding style and conventions
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have removed any console.log statements or debugging code

### Documentation

- [ ] I have updated the documentation (README, comments, etc.) if necessary
- [ ] I have updated the TODO.txt if this addresses a planned item

### Dependencies

- [ ] My changes do not introduce new dependencies
- [ ] If new dependencies are added, they are necessary and properly justified
- [ ] I have updated package.json appropriately

### Database

- [ ] My changes do not affect the database schema
- [ ] If schema changes are made, migration steps are documented
- [ ] I have tested with both fresh databases and existing data

### Compatibility

- [ ] My changes are backward compatible
- [ ] If breaking changes exist, they are documented and justified
- [ ] I have tested both the Electron and web versions (if applicable)

## Migration / Upgrade Notes

<!-- If this PR requires users to perform any actions after updating (database migrations, config changes, etc.), document them here -->

N/A

## Additional Notes

<!-- Add any other context about the PR here. Include any challenges faced, trade-offs made, or future work needed. -->

## Reviewer Notes

<!-- Is there anything specific you'd like reviewers to focus on? Any areas of uncertainty? -->

---

### For Maintainers

- [ ] PR title follows conventional commits format
- [ ] Labels are correctly applied
- [ ] Milestone is assigned (if applicable)
- [ ] All CI checks pass
