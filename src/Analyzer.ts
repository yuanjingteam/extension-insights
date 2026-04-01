// 分析器：负责读取扩展数据并进行分析
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';

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
    marketReleaseDate?: string; // 市场首发时间
    marketUpdateDate?: string;  // 市场发布时间
    size?: number;             // 磁盘大小（字节）
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

// 获取目录大小（递归）
function getDirectorySize(dirPath: string): number {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getDirectorySize(filePath);
            } else {
                size += stats.size;
            }
        }
    } catch (e) {
        // Ignore error
    }
    return size;
}

// 从市场获取元数据
async function fetchMarketplaceData(extensionIds: string[]): Promise<Record<string, { releaseDate: string, lastUpdated: string }>> {
    const data: Record<string, { releaseDate: string, lastUpdated: string }> = {};
    if (extensionIds.length === 0) { return data; }

    const body = JSON.stringify({
        filters: [{
            criteria: extensionIds.map(id => ({ filterType: 7, value: id }))
        }],
        flags: 0x1 | 0x10 | 0x80 // Include versions, metadata, and statistics
    });

    const options = {
        hostname: 'marketplace.visualstudio.com',
        path: '/_apis/public/gallery/extensionquery',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json;api-version=3.0-preview.1',
            'Content-Length': body.length
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => resData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(resData);
                    const results = json.results?.[0]?.extensions || [];
                    for (const ext of results) {
                        const publisher = ext.publisher.publisherName;
                        const name = ext.extensionName;
                        const id = `${publisher}.${name}`;
                        data[id] = {
                            releaseDate: ext.publishedDate,
                            lastUpdated: ext.lastUpdated
                        };
                    }
                } catch (e) {
                    console.error('解析市场数据失败:', e);
                }
                resolve(data);
            });
        });

        req.on('error', (e) => {
            console.error('获取市场数据请求失败:', e);
            resolve(data);
        });

        req.write(body);
        req.end();
    });
}

export class Analyzer {
    public static async getExtensions(): Promise<ExtensionData[]> {
        const enabledExtensions = vscode.extensions.all;
        const allInstalledExtensions = readDisabledExtensions();
        const data: ExtensionData[] = [];
        const processedIds = new Set<string>();
        const userExtensionIds: string[] = [];

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

            try {
                const stats = fs.statSync(ext.extensionPath);
                installDate = stats.birthtimeMs;
            } catch (e) {
                // Ignore error if stats cannot be read
            }

            const isBuiltin = packageJSON.isBuiltin || 
                ext.extensionPath.includes('resources/app/extensions') || 
                ext.extensionPath.includes('resources\\app\\extensions');

            if (!isBuiltin) {
                userExtensionIds.push(ext.id);
            }

            // 获取大小：优先从 __metadata 获取，否则递归计算
            let size = packageJSON.__metadata?.size;
            if (!size && !isBuiltin && ext.extensionPath) {
                size = getDirectorySize(ext.extensionPath);
            }

            data.push({
                id: ext.id,
                name: packageJSON.displayName || ext.id,
                version: packageJSON.version,
                description: packageJSON.description,
                publisher: packageJSON.publisher,
                isBuiltin,
                activationEvents,
                isEager,
                isActive: ext.isActive,
                isDisabled: false,
                installDate,
                size,
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

                        userExtensionIds.push(extId);

                        // 获取大小
                        let size = packageJSON.__metadata?.size;
                        if (!size) {
                            size = getDirectorySize(extPath);
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
                            size,
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

        // 批量获取市场数据
        try {
            const marketData = await fetchMarketplaceData(userExtensionIds);
            for (const ext of data) {
                if (marketData[ext.id]) {
                    ext.marketReleaseDate = marketData[ext.id].releaseDate;
                    ext.marketUpdateDate = marketData[ext.id].lastUpdated;
                }
            }
        } catch (e) {
            console.error('获取批量市场数据失败:', e);
        }

        return data;
    }

    public static getConflicts(extensions: ExtensionData[]): { key: string, commands: string[], sources: string[] }[] {
        const keyMap = new Map<string, { command: string, source: string }[]>();

        for (const ext of extensions) {
            for (const kb of ext.contributions.keybindings) {
                // Normalize key (simple normalization, can be improved)
                if (!kb.key) {
                    continue;
                }
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
