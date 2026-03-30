import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
    isDisabled?: boolean; // 标记被禁用的插件
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

// 获取 extensions.json 文件路径
function getExtensionsJsonPath(): string {
    const homeDir = os.homedir();
    const platform = process.platform;

    if (platform === 'darwin') {
        return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'extensions.json');
    } else if (platform === 'win32') {
        return path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'extensions.json');
    } else {
        return path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', 'extensions.json');
    }
}

// 从 extensions.json 读取所有已安装的扩展（包括禁用的）
function readDisabledExtensions(): Map<string, { version: string; installDate?: number }> {
    const extensionsMap = new Map<string, { version: string; installDate?: number }>();

    try {
        const extensionsPath = getExtensionsJsonPath();
        const content = fs.readFileSync(extensionsPath, 'utf-8');
        const extensionsData = JSON.parse(content);

        if (Array.isArray(extensionsData)) {
            for (const ext of extensionsData) {
                if (ext.identifier && ext.identifier.id) {
                    extensionsMap.set(ext.identifier.id, {
                        version: ext.version,
                        installDate: ext.metadata?.installedTimestamp
                    });
                }
            }
        }
    } catch (e) {
        console.warn('无法读取 extensions.json:', e);
    }

    return extensionsMap;
}

export class Analyzer {
    public static async getExtensions(): Promise<ExtensionData[]> {
        const enabledExtensions = vscode.extensions.all;
        const allInstalledExtensions = readDisabledExtensions();
        const data: ExtensionData[] = [];
        const processedIds = new Set<string>();

        // 先处理已启用的扩展
        for (const ext of enabledExtensions) {
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
                installDate = stats.birthtimeMs;
                updateDate = stats.mtimeMs;
            } catch (e) {
                // Ignore error if stats cannot be read
            }

            data.push({
                id: ext.id,
                name: packageJSON.displayName || ext.id,
                version: packageJSON.version,
                description: packageJSON.description,
                publisher: packageJSON.publisher,
                isBuiltin: packageJSON.isBuiltin || (!ext.extensionPath.includes('.vscode/extensions') && !ext.extensionPath.includes('.vscode-insiders/extensions')),
                activationEvents,
                isEager,
                isActive: ext.isActive,
                isDisabled: false,
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

            processedIds.add(ext.id);
        }

        // 添加被禁用的扩展（在 extensions.json 中但不在 vscode.extensions.all 中）
        for (const [extId, extInfo] of allInstalledExtensions.entries()) {
            if (!processedIds.has(extId)) {
                // 被禁用的扩展，尝试读取其 package.json
                try {
                    const extPath = path.join(os.homedir(), '.vscode', 'extensions', extId.split('@')[0] + '-' + extInfo.version);
                    const packageJsonPath = path.join(extPath, 'package.json');

                    if (fs.existsSync(packageJsonPath)) {
                        const packageJSON = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

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

                        data.push({
                            id: extId,
                            name: packageJSON.displayName || extId,
                            version: extInfo.version,
                            description: packageJSON.description,
                            publisher: packageJSON.publisher,
                            isBuiltin: false, // 禁用的扩展都是用户安装的
                            activationEvents,
                            isEager,
                            isActive: false,
                            isDisabled: true,
                            installDate: extInfo.installDate,
                            updateDate: undefined,
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
                } catch (e) {
                    console.warn(`无法读取禁用扩展 ${extId} 的 package.json:`, e);
                }
            }
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
