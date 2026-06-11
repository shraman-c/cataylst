import fs from 'fs/promises';
import path from 'path';

export type AccountRegistryEntry = {
  id?: string;
  profileId?: string;
  authUserId?: string;
  username?: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'teacher' | 'student';
};

const registryFilePath = path.join(process.cwd(), 'src', 'lib', 'users.json');

async function readRegistryFile() {
  try {
    const data = await fs.readFile(registryFilePath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function readAccountRegistry(): Promise<AccountRegistryEntry[]> {
  return readRegistryFile();
}

export async function writeAccountRegistry(entries: AccountRegistryEntry[]) {
  await fs.writeFile(registryFilePath, JSON.stringify(entries, null, 2), 'utf-8');
}

export function hasRegistryAccount(
  entries: AccountRegistryEntry[],
  options: { profileId?: string; username?: string; email?: string }
) {
  const { profileId, username, email } = options;

  return entries.some((entry) => {
    if (profileId && [entry.id, entry.profileId].some((value) => value === profileId)) {
      return true;
    }

    if (username && entry.username === username) {
      return true;
    }

    if (email && entry.email === email) {
      return true;
    }

    return false;
  });
}