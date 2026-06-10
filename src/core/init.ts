import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Note: In production, templates will be in the package folder
const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");

export async function initializeProject(targetDir: string) {
  console.error(`Initializing Themis PARA structure in: ${targetDir}`);
  
  const folders = [
    "docs/_para/00_inbox",
    "docs/_para/10_projects",
    "docs/_para/20_areas",
    "docs/_para/30_resources",
    "docs/_para/40_archive",
  ];

  try {
    // 1. Create directory structure
    for (const folder of folders) {
      await fs.mkdir(path.join(targetDir, folder), { recursive: true });
    }

    // 2. Copy templates if they exist
    const templateFolders = ["10_projects", "20_areas", "30_resources"];
    for (const folder of templateFolders) {
      const srcDir = path.join(TEMPLATES_DIR, folder);
      const destDir = path.join(targetDir, "docs/_para", folder);
      
      try {
        const files = await fs.readdir(srcDir);
        for (const file of files) {
          await fs.copyFile(
            path.join(srcDir, file),
            path.join(destDir, file)
          );
        }
      } catch (e) {
        // Template source might be missing in some environments, skip
      }
    }

    // 3. Create a basic .gitignore if it doesn't exist
    const gitignorePath = path.join(targetDir, ".gitignore");
    const themisIgnore = "\n# Themis AI\n.themis/\nbuild/\nnode_modules/\n.env\n";
    
    try {
      await fs.access(gitignorePath);
      await fs.appendFile(gitignorePath, themisIgnore);
    } catch (e) {
      await fs.writeFile(gitignorePath, themisIgnore);
    }

    return true;
  } catch (error) {
    console.error(`Initialization failed: ${error}`);
    return false;
  }
}
