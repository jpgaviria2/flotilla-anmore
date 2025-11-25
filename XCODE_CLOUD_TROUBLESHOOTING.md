# Xcode Cloud Troubleshooting

## Current Issue: "workspace App.xcworkspace does not exist at ios/App.xcworkspace"

### Problem
Xcode Cloud reports: `workspace App.xcworkspace does not exist at ios/App.xcworkspace`

### Root Cause
The Xcode Cloud workflow is configured with the wrong workspace path:
- ❌ **Configured**: `ios/App.xcworkspace` (missing `App/` directory)
- ✅ **Correct**: `ios/App/App.xcworkspace` (full path)

### Solution
Update the Xcode Cloud workflow configuration:
1. Open Xcode → Product → Xcode Cloud → View Workflows
2. Edit your workflow
3. In Build Configuration, set Workspace to: `ios/App/App.xcworkspace`
4. Save and trigger a new build

See `XCODE_CLOUD_WORKSPACE_FIX.md` for detailed instructions.

---

## Previous Issue: "Post-Clone script not found"

### Problem
Xcode Cloud reports: `Post-Clone script not found at ci_scripts/ci_post_clone.sh`

### Possible Causes

1. **Workspace Path Configuration**
   - In Xcode Cloud workflow settings, verify the workspace path is set correctly
   - Should be: `ios/App/App.xcworkspace` (relative to repository root)
   - NOT: `App.xcworkspace` or absolute path

2. **Script Location**
   - Scripts MUST be at repository root: `ci_scripts/`
   - NOT in `ios/ci_scripts/` or any subdirectory
   - All scripts must be executable (`chmod +x`)

3. **Branch Configuration**
   - Ensure you're building from the correct branch (usually `master`)
   - Scripts must be committed and pushed to that branch

4. **File Encoding**
   - Scripts must use Unix line endings (LF, not CRLF)
   - Must start with `#!/bin/bash` shebang

### Verification Steps

1. **Check script location in GitHub:**
   ```
   https://github.com/your-org/flotilla-anmore/tree/master/ci_scripts
   ```
   - Verify all three scripts are visible
   - Click on `ci_post_clone.sh` and verify it shows the script content

2. **Check Xcode Cloud Workflow Settings:**
   - Open Xcode → Product → Xcode Cloud → View Workflows
   - Select your workflow
   - Check "Source Control" section:
     - Repository: Correct GitHub repo
     - Branch: `master` (or your branch)
   - Check "Build Configuration":
     - Workspace: `ios/App/App.xcworkspace`
     - Scheme: `Flotilla Chat`

3. **Check Build Logs:**
   - In Xcode Cloud dashboard, open the failed build
   - Look for "Post-Clone" section
   - Check if script executed or if there's an error message

### Alternative: Check Workspace Path

If Xcode Cloud is configured with the wrong workspace path, it might look for scripts in the wrong location.

**Correct Configuration:**
- Workspace Path: `ios/App/App.xcworkspace` (relative to repo root)
- CI Scripts: `ci_scripts/` (at repo root)

**Incorrect Configuration:**
- Workspace Path: `App.xcworkspace` (missing `ios/App/` prefix)
- CI Scripts: `ios/ci_scripts/` (wrong location)

### Next Steps

1. Verify scripts are committed and pushed to GitHub
2. Check Xcode Cloud workflow configuration
3. Review build logs for detailed error messages
4. Try creating a new workflow if configuration seems correct

