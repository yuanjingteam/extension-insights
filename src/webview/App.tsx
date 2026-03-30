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
    const [activeId, setActiveId] = React.useState('tab-1');

    useEffect(() => {
        console.log('[App] useEffect 初始化，activeId:', activeId);

        // Listen for messages from the extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'updateData':
                    console.log('[App] 收到 updateData 消息');
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

    useEffect(() => {
        console.log('[App] activeId 变化:', activeId);
    }, [activeId]);

    useEffect(() => {
        console.log('[App] conflicts 数据:', conflicts);
    }, [conflicts]);

    const handleRefresh = () => {
        setLoading(true);
        vscode.postMessage({ command: 'refresh' });
    };

    const handleExport = () => {
        vscode.postMessage({ command: 'export' });
    };

    const handleTabClick = (tabId: string) => {
        console.log('[App] 点击 tab:', tabId);
        setActiveId(tabId);
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

            {/* 自定义 Tab 栏 */}
            <div role="tablist" aria-label="插件洞察标签" style={{ display: 'flex', borderBottom: '1px solid var(--vscode-widget-border)', backgroundColor: 'var(--vscode-editor-background)' }}>
                {['tab-1', 'tab-2', 'tab-3', 'tab-4'].map((tabId) => (
                    <button
                        key={tabId}
                        role="tab"
                        id={tabId}
                        aria-selected={activeId === tabId}
                        aria-controls={`panel-${tabId}`}
                        onClick={() => handleTabClick(tabId)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderBottom: activeId === tabId ? '2px solid var(--vscode-focusBorder)' : '2px solid transparent',
                            backgroundColor: 'transparent',
                            color: activeId === tabId ? 'var(--vscode-editor-foreground)' : 'var(--vscode-descriptionForeground)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: activeId === tabId ? 600 : 400,
                        }}
                    >
                        {tabId === 'tab-1' && '仪表盘'}
                        {tabId === 'tab-2' && '插件列表'}
                        {tabId === 'tab-3' && '内置插件'}
                        {tabId === 'tab-4' && '冲突检测'}
                    </button>
                ))}
            </div>

            {/* Tab 内容 */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeId === 'tab-1' && <Dashboard extensions={extensions} />}
                {activeId === 'tab-2' && <ExtensionList extensions={extensions} />}
                {activeId === 'tab-3' && <BuiltInList extensions={extensions} />}
                {activeId === 'tab-4' && <Conflicts conflicts={conflicts} />}
            </div>
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
