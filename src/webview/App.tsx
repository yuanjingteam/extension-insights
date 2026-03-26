import React, { useEffect, useState } from 'react';
import { provideVSCodeDesignSystem, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeButton, vsCodeDataGrid, vsCodeDataGridRow, vsCodeDataGridCell, vsCodeProgressRing } from "@vscode/webview-ui-toolkit";
import { Dashboard } from './components/Dashboard';
import { ExtensionList } from './components/ExtensionList';
import { BuiltInList } from './components/BuiltInList';
import { Conflicts } from './components/Conflicts';
import { vscode } from './utils/vscode';
import { ExtensionData, ConflictData } from './types';
import './App.css';

// Register web components
provideVSCodeDesignSystem().register(
    vsCodePanels(),
    vsCodePanelTab(),
    vsCodePanelView(),
    vsCodeButton(),
    vsCodeDataGrid(),
    vsCodeDataGridRow(),
    vsCodeDataGridCell(),
    vsCodeProgressRing()
);

const App = () => {
    const [extensions, setExtensions] = useState<ExtensionData[]>([]);
    const [conflicts, setConflicts] = useState<ConflictData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for messages from the extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'updateData':
                    setExtensions(message.payload.extensions);
                    setConflicts(message.payload.conflicts);
                    setLoading(false);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        // Request initial data
        vscode.postMessage({ command: 'refresh' });

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleRefresh = () => {
        setLoading(true);
        vscode.postMessage({ command: 'refresh' });
    };

    const handleExport = () => {
        vscode.postMessage({ command: 'export' });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '10px' }}>
                <vscode-progress-ring></vscode-progress-ring>
                <p>正在分析插件...</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--vscode-widget-border)' }}>
                <h2>插件洞察</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <vscode-button onClick={handleRefresh}>刷新</vscode-button>
                    <vscode-button appearance="secondary" onClick={handleExport}>导出配置</vscode-button>
                </div>
            </header>
            
            <vscode-panels>
                <vscode-panel-tab id="tab-1">仪表盘</vscode-panel-tab>
                <vscode-panel-tab id="tab-2">插件列表</vscode-panel-tab>
                <vscode-panel-tab id="tab-3">内置插件</vscode-panel-tab>
                <vscode-panel-tab id="tab-4">冲突检测</vscode-panel-tab>

                <vscode-panel-view name="tab-1">
                    <Dashboard extensions={extensions} />
                </vscode-panel-view>
                <vscode-panel-view name="tab-2">
                    <ExtensionList extensions={extensions} />
                </vscode-panel-view>
                <vscode-panel-view name="tab-3">
                    <BuiltInList extensions={extensions} />
                </vscode-panel-view>
                <vscode-panel-view name="tab-4">
                    <Conflicts conflicts={conflicts} />
                </vscode-panel-view>
            </vscode-panels>
        </div>
    );
};

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'vscode-panels': any;
            'vscode-panel-tab': any;
            'vscode-panel-view': any;
            'vscode-button': any;
            'vscode-progress-ring': any;
        }
    }
}

export default App;
