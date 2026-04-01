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

export interface ConflictData {
    key: string;
    commands: string[];
    sources: string[];
}
