import { promises as fs } from 'fs';
import path from 'path';

export async function saveProgramsToFile(programs: any[]) {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'programs.json');
  await fs.writeFile(filePath, JSON.stringify(programs, null, 2), 'utf-8');
}
