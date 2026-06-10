import { promises as fs } from 'fs';
import path from 'path';

const DOCS_BASE_PATH = path.resolve(process.cwd(), 'docs/_para');

async function runIntegrityCheck() {
  console.log('\x1b[1m\x1b[36m🔍 Running PARA System Integrity Health Check...\x1b[0m\n');

  const issues: { type: 'error' | 'warning' | 'info'; message: string }[] = [];
  let projectsCount = 0;
  let cleanProjects = 0;

  try {
    // 1. Validate active projects
    const projectsPath = path.join(DOCS_BASE_PATH, '10_projects');
    const projectDirs = await fs.readdir(projectsPath);

    for (const dir of projectDirs) {
      const projectPath = path.join(projectsPath, dir);
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) continue;
      projectsCount++;

      let hasReadme = false;
      let hasDevPlan = false;
      let hasHandoff = false;

      try {
        await fs.access(path.join(projectPath, 'README.md'));
        hasReadme = true;
      } catch (e) {}

      try {
        await fs.access(path.join(projectPath, 'DEVELOPMENT_PLAN.md'));
        hasDevPlan = true;
      } catch (e) {}

      try {
        await fs.access(path.join(projectPath, 'AGENT_HANDOFF.md'));
        hasHandoff = true;
      } catch (e) {}

      if (!hasReadme) {
        issues.push({
          type: 'error',
          message: `Project \`${dir}\` is missing its \`README.md\` (required under PARA workflow).`
        });
      }

      if (!hasDevPlan) {
        issues.push({
          type: 'warning',
          message: `Project \`${dir}\` is missing its \`DEVELOPMENT_PLAN.md\`.`
        });
      }

      if (!hasHandoff) {
        issues.push({
          type: 'info',
          message: `Project \`${dir}\` has no \`AGENT_HANDOFF.md\`.`
        });
      }

      if (hasReadme && hasDevPlan && hasHandoff) {
        cleanProjects++;
      }
    }

    // 2. Check 00_inbox
    try {
      const inboxPath = path.join(DOCS_BASE_PATH, '00_inbox');
      const inboxFiles = await fs.readdir(inboxPath);
      // Filter out hidden files like .gitkeep
      const actualFiles = inboxFiles.filter(f => !f.startsWith('.'));
      if (actualFiles.length > 0) {
        issues.push({
          type: 'info',
          message: `There are ${actualFiles.length} unsorted files in \`00_inbox/\`. Please organize them into Projects, Areas, or Resources.`
        });
      }
    } catch (e) {}

    // 3. Check docs/ root (outside _para)
    try {
      const docsRootPath = path.resolve(DOCS_BASE_PATH, '..');
      const docsRootContents = await fs.readdir(docsRootPath);
      const legacyFolders = ['design-samples', 'methodology', 'plans', 'pptx', 'regulatory', 'strategic_review'];

      for (const item of docsRootContents) {
        if (item === '_para' || item === 'expert_specs' || item === 'patent_working' || item.startsWith('.')) {
          continue;
        }
        const fullItemPath = path.join(docsRootPath, item);
        const stat = await fs.stat(fullItemPath);
        if (stat.isDirectory() && legacyFolders.includes(item)) {
          issues.push({
            type: 'warning',
            message: `Legacy folder \`docs/${item}\` found outside PARA structure. Consider migrating it to \`_para/30_resources/\` or \`_para/40_archive/\`.`
          });
        } else if (stat.isFile() && item.endsWith('.pdf')) {
          issues.push({
            type: 'warning',
            message: `PDF file \`docs/${item}\` found in root. Consider moving it to \`_para/30_resources/\`.`
          });
        }
      }
    } catch (e) {}

    // Print Report
    console.log('\x1b[1m==================================================\x1b[0m');
    console.log('\x1b[1m📋 PARA System Integrity Report\x1b[0m\n');

    if (issues.length === 0) {
      console.log('\x1b[32m\x1b[1m✅ Excellent! PARA directory structure is perfectly clean and compliant.\x1b[0m\n');
    } else {
      console.log(`\x1b[33m⚠️ Found ${issues.length} compliance recommendation(s):\x1b[0m\n`);
      for (const issue of issues) {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        const color = issue.type === 'error' ? '\x1b[31m' : issue.type === 'warning' ? '\x1b[33m' : '\x1b[36m';
        console.log(`  ${icon} [${color}${issue.type.toUpperCase()}\x1b[0m] ${issue.message}`);
      }
      console.log();
    }

    console.log('\x1b[1mStatistics:\x1b[0m');
    console.log(`  - Total Active Projects: ${projectsCount}`);
    console.log(`  - Compliant Projects:   \x1b[32m${cleanProjects} / ${projectsCount}\x1b[0m`);
    console.log('\x1b[1m==================================================\x1b[0m\n');

  } catch (error) {
    console.error('Error running integrity check:', error);
    process.exit(1);
  }
}

runIntegrityCheck();
