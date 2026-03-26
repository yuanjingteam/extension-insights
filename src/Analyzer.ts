import * as vscode from 'vscode';
import * as fs from 'fs';

export interface ExtensionData {
    id: string;
    name: string;
    version: string;
    description?: string;
    publisher?: string;
    isBuiltin: boolean;
    activationEvents: string[];
    isEager: boolean;
    isActive: boolean;
    installDate?: number;
    updateDate?: number;
    dependencies: string[];
    contributions: {
        commands: number;
        menus: number;
        views: number;
        keybindings: Keybinding[];
    };
    category: string;
}

export interface Keybinding {
    command: string;
    key: string;
    when?: string;
}

export interface Stats {
    total: number;
    categories: Record<string, number>;
    eagerCount: number;
}

export class Analyzer {
    public static async getExtensions(): Promise<ExtensionData[]> {
        const extensions = vscode.extensions.all;
        const data: ExtensionData[] = [];

        for (const ext of extensions) {
            const packageJSON = ext.packageJSON;
            
            // Skip if no packageJSON (shouldn't happen for valid exts)
            if (!packageJSON) { continue; }

            const activationEvents = packageJSON.activationEvents || [];
            const contributes = packageJSON.contributes || {};
            
            const commands = contributes.commands || [];
            const menus = contributes.menus ? Object.keys(contributes.menus).reduce((acc, key) => acc + contributes.menus[key].length, 0) : 0;
            const views = contributes.views ? Object.keys(contributes.views).reduce((acc, key) => acc + contributes.views[key].length, 0) : 0;
            
            const keybindingsRaw = contributes.keybindings || [];
            const keybindings: Keybinding[] = Array.isArray(keybindingsRaw) 
                ? keybindingsRaw.map((k: any) => ({ command: k.command, key: k.key, when: k.when }))
                : [];

            const dependencies = packageJSON.extensionDependencies || [];
            const isEager = activationEvents.includes('*');

            let category = 'Other';
            if (packageJSON.categories && packageJSON.categories.length > 0) {
                category = packageJSON.categories[0];
            }

            let installDate: number | undefined;
            let updateDate: number | undefined;

            try {
                const stats = fs.statSync(ext.extensionPath);
                installDate = stats.birthtimeMs; // Creation time as approximation of install time
                updateDate = stats.mtimeMs;      // Modification time as approximation of update time
            } catch (e) {
                // Ignore error if stats cannot be read
            }

            data.push({
                id: ext.id,
                name: packageJSON.displayName || ext.id,
                version: packageJSON.version,
                description: packageJSON.description,
                publisher: packageJSON.publisher,
                isBuiltin: packageJSON.isBuiltin || (!ext.extensionPath.includes('.vscode/extensions') && !ext.extensionPath.includes('.vscode-insiders/extensions')), // Heuristic for builtin
                activationEvents,
                isEager,
                isActive: ext.isActive,
                installDate,
                updateDate,
                dependencies,
                contributions: {
                    commands: commands.length,
                    menus,
                    views,
                    keybindings
                },
                category
            });
        }

        return data;
    }

    public static getConflicts(extensions: ExtensionData[]): { key: string, commands: string[], sources: string[] }[] {
        const keyMap = new Map<string, { command: string, source: string }[]>();

        for (const ext of extensions) {
            for (const kb of ext.contributions.keybindings) {
                // Normalize key (simple normalization, can be improved)
                const key = kb.key.toLowerCase().replace(/\s+/g, '');
                if (!keyMap.has(key)) {
                    keyMap.set(key, []);
                }
                keyMap.get(key)!.push({ command: kb.command, source: ext.name });
            }
        }

        const conflicts: { key: string, commands: string[], sources: string[] }[] = [];
        for (const [key, usages] of keyMap.entries()) {
            if (usages.length > 1) {
                // Check if they are actually conflicting (ignoring 'when' clause for now for simplicity, or we could include it)
                // For a strict conflict check, we'd need to evaluate 'when', but listing potential conflicts is useful.
                // Let's group by source to see if different extensions define the same key.
                const uniqueSources = new Set(usages.map(u => u.source));
                if (uniqueSources.size > 1) {
                     conflicts.push({
                         key,
                         commands: usages.map(u => u.command),
                         sources: Array.from(uniqueSources)
                     });
                }
            }
        }
        return conflicts;
    }
}
