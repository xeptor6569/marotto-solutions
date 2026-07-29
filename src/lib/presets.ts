import fs from 'fs/promises';
import path from 'path';
import type { DocumentPreset, DocumentPresetInput, PresetDocumentType } from './types';
import {
    isPresetDocumentType,
    normalizePreset,
    normalizePresetsFile,
    presetMatchesDocumentType,
} from './preset-utils';

export {
    PRESET_DOCUMENT_TYPES,
    applyPresetLineItems,
    buildPresetFromDocument,
    isPresetDocumentType,
    normalizePreset,
    normalizePresetsFile,
    presetMatchesDocumentType,
} from './preset-utils';

const PRESETS_PATH = path.join(process.cwd(), 'data', 'config', 'presets.json');

async function ensureConfigDir() {
    const dir = path.dirname(PRESETS_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function readPresetsFromDisk(): Promise<unknown> {
    try {
        const data = await fs.readFile(PRESETS_PATH, 'utf-8');
        return JSON.parse(data) as unknown;
    } catch {
        return null;
    }
}

async function writePresets(presets: DocumentPreset[]): Promise<void> {
    await ensureConfigDir();
    const payload = {
        presets: presets.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    };
    await fs.writeFile(PRESETS_PATH, JSON.stringify(payload, null, 2));
}

export async function listPresets(): Promise<DocumentPreset[]> {
    return normalizePresetsFile(await readPresetsFromDisk());
}

export async function getPresetById(id: string): Promise<DocumentPreset | null> {
    const presets = await listPresets();
    return presets.find((p) => p.id === id) || null;
}

export async function listPresetsForDocumentType(type: PresetDocumentType): Promise<DocumentPreset[]> {
    const presets = await listPresets();
    return presets.filter((p) => presetMatchesDocumentType(p, type));
}

export async function createPreset(input: DocumentPresetInput): Promise<DocumentPreset> {
    const name = input.name?.trim();
    if (!name) throw new Error('Preset name is required.');
    if (!input.lineItems?.length) throw new Error('Add at least one line item.');

    const now = new Date().toISOString();
    const preset = normalizePreset({
        id: crypto.randomUUID(),
        name,
        documentTypes: (input.documentTypes || []).filter(isPresetDocumentType),
        title: input.title,
        notes: input.notes,
        lineItems: input.lineItems,
        createdAt: now,
        updatedAt: now,
    });
    if (!preset) throw new Error('Invalid preset.');

    const presets = await listPresets();
    presets.push(preset);
    await writePresets(presets);
    return preset;
}

export async function updatePreset(id: string, input: DocumentPresetInput): Promise<DocumentPreset> {
    const name = input.name?.trim();
    if (!name) throw new Error('Preset name is required.');
    if (!input.lineItems?.length) throw new Error('Add at least one line item.');

    const presets = await listPresets();
    const index = presets.findIndex((p) => p.id === id);
    if (index < 0) throw new Error('Preset not found.');

    const existing = presets[index];
    const updated = normalizePreset({
        id: existing.id,
        name,
        documentTypes: (input.documentTypes || []).filter(isPresetDocumentType),
        title: input.title,
        notes: input.notes,
        lineItems: input.lineItems,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new Error('Invalid preset.');

    presets[index] = updated;
    await writePresets(presets);
    return updated;
}

export async function deletePreset(id: string): Promise<void> {
    const presets = await listPresets();
    const next = presets.filter((p) => p.id !== id);
    if (next.length === presets.length) throw new Error('Preset not found.');
    await writePresets(next);
}

/** Replace all presets (used by backup restore). */
export async function replaceAllPresets(raw: unknown): Promise<number> {
    const presets = normalizePresetsFile(raw);
    await writePresets(presets);
    return presets.length;
}

export function getPresetsFilePath(): string {
    return PRESETS_PATH;
}
