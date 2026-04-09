// 内置插件列表组件：负责展示VS Code内置的插件信息
import React from 'react';
import { ExtensionData } from '../types';

interface Props {
    extensions: ExtensionData[];
}

export const BuiltInList: React.FC<Props> = ({ extensions }) => {
    // 只显示内置插件
    const builtInExtensions = extensions.filter(ext => ext.isBuiltin);

    // 计算统计信息
    const totalCount = builtInExtensions.length;
    const activeCount = builtInExtensions.filter(ext => ext.isActive).length;

    // 排序
    const sortedExtensions = [...builtInExtensions].sort((a, b) => {
        // 先按是否激活排序
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        // 再按贡献数排序
        const aContrib = a.contributions.commands + a.contributions.menus + a.contributions.views;
        const bContrib = b.contributions.commands + b.contributions.menus + b.contributions.views;
        return bContrib - aContrib;
    });

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--vscode-descriptionForeground)' }}>
                        内置插件总数：<span style={{ color: 'var(--vscode-foreground)', fontWeight: 600 }}>{totalCount}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--vscode-descriptionForeground)' }}>
                        已激活：<span style={{ color: 'var(--vscode-testing-iconPassed)', fontWeight: 600 }}>{activeCount}</span>
                    </div>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 20px 20px' }}>
                <vscode-data-grid aria-label="内置插件" grid-template-columns="2fr 1fr 1fr 1fr 1fr 1fr">
                    <vscode-data-grid-row row-type="header" style={{ position: 'sticky', top: 0, background: 'var(--vscode-editor-background)', zIndex: 1, borderBottom: '1px solid var(--vscode-widget-border)' }}>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="1">名称</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="2">状态</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="3">启动方式</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="4">命令数</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="5">菜单项</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="6">视图数</vscode-data-grid-cell>
                    </vscode-data-grid-row>
                    {sortedExtensions.map(ext => (
                        <vscode-data-grid-row key={ext.id}>
                            <vscode-data-grid-cell grid-column="1">
                                {ext.name} <span style={{opacity: 0.7, fontSize: '0.8em'}}>({ext.version})</span>
                            </vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="2">
                                {ext.isActive ?
                                    <span style={{color: 'var(--vscode-testing-iconPassed)'}}>● 已激活</span> :
                                    <span style={{color: 'var(--vscode-descriptionForeground)'}}>○ 未激活</span>
                                }
                            </vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="3">
                                {ext.isEager ? <span style={{color: 'var(--vscode-charts-red)'}}>立即加载 (*)</span> : '按需加载'}
                            </vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="4">{ext.contributions.commands}</vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="5">{ext.contributions.menus}</vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="6">{ext.contributions.views}</vscode-data-grid-cell>
                        </vscode-data-grid-row>
                    ))}
                </vscode-data-grid>
            </div>
        </div>
    );
};
