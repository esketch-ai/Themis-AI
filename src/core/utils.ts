import { promises as fs } from "fs";
import path from "path";

export const DOCS_BASE_PATH = path.resolve(process.cwd(), "docs/_para");

export async function getMarkdownFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  try {
    const items = await fs.readdir(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(await getMarkdownFiles(fullPath));
      } else if (stat.isFile() && item.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}
