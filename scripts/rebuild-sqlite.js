/**
 * Rebuild better-sqlite3 for Electron in all locations within the Next.js standalone output
 * 
 * Next.js standalone creates TWO copies of native modules:
 * 1. standalone/node_modules/better-sqlite3/ - standard location
 * 2. standalone/.next/node_modules/better-sqlite3-<hash>/ - hashed copy used at runtime
 * 
 * Both need to be rebuilt for Electron's Node.js version
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const standaloneDir = path.join(process.cwd(), '.next', 'standalone')
const electronVersion = require('../node_modules/electron/package.json').version

console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion}...`)

// 1. Rebuild in standalone/node_modules/
const standardNodeModules = path.join(standaloneDir, 'node_modules')
if (fs.existsSync(path.join(standardNodeModules, 'better-sqlite3'))) {
  console.log('\n[1/2] Rebuilding in standalone/node_modules/better-sqlite3...')
  try {
    execSync('npx electron-rebuild -f -w better-sqlite3', {
      cwd: standaloneDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_runtime: 'electron',
        npm_config_target: electronVersion
      }
    })
    console.log('✓ Rebuilt standalone/node_modules/better-sqlite3')
  } catch (error) {
    console.error('✗ Failed to rebuild standalone/node_modules/better-sqlite3:', error.message)
  }
}

// 2. Find and rebuild hashed copies in standalone/.next/node_modules/
const nextNodeModules = path.join(standaloneDir, '.next', 'node_modules')
if (fs.existsSync(nextNodeModules)) {
  const hashedDirs = fs.readdirSync(nextNodeModules).filter(name => name.startsWith('better-sqlite3-'))
  
  if (hashedDirs.length > 0) {
    console.log(`\n[2/2] Found ${hashedDirs.length} hashed better-sqlite3 folder(s) in .next/node_modules/`)
    
    for (const hashedDir of hashedDirs) {
      const hashedPath = path.join(nextNodeModules, hashedDir)
      const buildRelease = path.join(hashedPath, 'build', 'Release')
      const nodeFile = path.join(buildRelease, 'better_sqlite3.node')
      
      console.log(`\nProcessing ${hashedDir}...`)
      
      // Copy the rebuilt .node file from the standard location
      const sourceNodeFile = path.join(standardNodeModules, 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
      
      if (fs.existsSync(sourceNodeFile) && fs.existsSync(buildRelease)) {
        try {
          fs.copyFileSync(sourceNodeFile, nodeFile)
          console.log(`✓ Copied rebuilt better_sqlite3.node to ${hashedDir}`)
        } catch (error) {
          console.error(`✗ Failed to copy to ${hashedDir}:`, error.message)
        }
      } else {
        // If source doesn't exist, try to rebuild directly
        console.log(`Attempting direct rebuild for ${hashedDir}...`)
        try {
          // Create a temporary package.json to make electron-rebuild work
          const tempPkgPath = path.join(hashedPath, 'package.json')
          const hadPkg = fs.existsSync(tempPkgPath)
          
          if (!hadPkg) {
            fs.writeFileSync(tempPkgPath, JSON.stringify({
              name: 'temp-rebuild',
              version: '1.0.0'
            }))
          }
          
          execSync(`npx electron-rebuild -f -w better-sqlite3 -m "${hashedPath}"`, {
            cwd: hashedPath,
            stdio: 'inherit',
            env: {
              ...process.env,
              npm_config_runtime: 'electron',
              npm_config_target: electronVersion
            }
          })
          
          if (!hadPkg) {
            fs.unlinkSync(tempPkgPath)
          }
          
          console.log(`✓ Rebuilt ${hashedDir}`)
        } catch (error) {
          console.error(`✗ Failed to rebuild ${hashedDir}:`, error.message)
        }
      }
    }
  } else {
    console.log('\n[2/2] No hashed better-sqlite3 folders found in .next/node_modules/')
  }
} else {
  console.log('\n[2/2] No .next/node_modules/ directory found')
}

console.log('\n✓ Rebuild complete!')
