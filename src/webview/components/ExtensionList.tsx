import React from 'react';
import { ExtensionData } from '../types';

interface Props {
    extensions: ExtensionData[];
}

export const ExtensionList: React.FC<Props> = ({ extensions }) => {
    // 过滤只显示用户安装的插件（排除内置插件）
    const userExtensions = extensions.filter(ext => !ext.isBuiltin);

    // 计算统计信息
    const totalCount = userExtensions.length;
    const activeCount = userExtensions.filter(ext => ext.isActive).length;

    // 排序
    const sortedExtensions = [...userExtensions].sort((a, b) => {
        // Sort by isEager first
        if (a.isEager && !b.isEager) return -1;
        if (!a.isEager && b.isEager) return 1;
        // Then by contributions count
        const aContrib = a.contributions.commands + a.contributions.menus + a.contributions.views;
        const bContrib = b.contributions.commands + b.contributions.menus + b.contributions.views;
        return bContrib - aContrib;
    });

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--vscode-descriptionForeground)' }}>
                        插件总数：<span style={{ color: 'var(--vscode-foreground)', fontWeight: 600 }}>{totalCount}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--vscode-descriptionForeground)' }}>
                        已激活：<span style={{ color: 'var(--vscode-testing-iconPassed)', fontWeight: 600 }}>{activeCount}</span>
                    </div>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px 20px 20px' }}>
                <vscode-data-grid aria-label="插件统计" grid-template-columns="2fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr">
                    <vscode-data-grid-row row-type="header" style={{ position: 'sticky', top: 0, background: 'var(--vscode-editor-background)', zIndex: 1, borderBottom: '1px solid var(--vscode-widget-border)' }}>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="1">名称</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="2">状态</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="3">启动方式</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="4">命令数</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="5">菜单项</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="6">视图数</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="7">安装时间</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="8">更新时间</vscode-data-grid-cell>
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
                            <vscode-data-grid-cell grid-column="7">
                                {ext.installDate ? new Date(ext.installDate).toLocaleDateString() : '-'}
                            </vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="8">
                                {ext.updateDate ? new Date(ext.updateDate).toLocaleDateString() : '-'}
                            </vscode-data-grid-cell>
                        </vscode-data-grid-row>
                    ))}
                </vscode-data-grid>
            </div>
        </div>
    );
};

// Declare custom elements for TypeScript
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'vscode-data-grid': any;
            'vscode-data-grid-row': any;
            'vscode-data-grid-cell': any;
        }
    }
}
