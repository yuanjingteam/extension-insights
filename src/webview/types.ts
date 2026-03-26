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

export interface ConflictData {
    key: string;
    commands: string[];
    sources: string[];
}
