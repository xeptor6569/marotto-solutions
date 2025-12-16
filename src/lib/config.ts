import fs from 'fs/promises';
import path from 'path';
import { AppConfig } from './types';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'settings.json');

// Ensure config dir exists
async function ensureConfigDir() {
    const dir = path.dirname(CONFIG_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

export async function getAppConfig(): Promise<Partial<AppConfig>> {
    try {
        await ensureConfigDir();
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

export async function saveAppConfig(config: Partial<AppConfig>) {
    await ensureConfigDir();
    const current = await getAppConfig();
    const newConfig = { ...current, ...config };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    return newConfig;
}
