import React from 'react';
import { ConflictData } from '../types';

interface Props {
    conflicts: ConflictData[];
}

export const Conflicts: React.FC<Props> = ({ conflicts }) => {
    console.log('[Conflicts] 渲染，conflicts 数量:', conflicts.length, 'conflicts:', conflicts);

    return (
        <div style={{ padding: '10px' }}>
            <h3>快捷键冲突</h3>
            {conflicts.length === 0 ? (
                <p>未发现冲突。</p>
            ) : (
                <vscode-data-grid aria-label="冲突" grid-template-columns="1fr 2fr 2fr">
                     <vscode-data-grid-row row-type="header">
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="1">按键</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="2">命令</vscode-data-grid-cell>
                        <vscode-data-grid-cell cell-type="columnheader" grid-column="3">来源</vscode-data-grid-cell>
                    </vscode-data-grid-row>
                    {conflicts.map((c, i) => (
                        <vscode-data-grid-row key={i}>
                            <vscode-data-grid-cell grid-column="1">{c.key}</vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="2">
                                {c.commands.map(cmd => <div key={cmd}>{cmd}</div>)}
                            </vscode-data-grid-cell>
                            <vscode-data-grid-cell grid-column="3">
                                {c.sources.map(s => <div key={s}>{s}</div>)}
                            </vscode-data-grid-cell>
                        </vscode-data-grid-row>
                    ))}
                </vscode-data-grid>
            )}
        </div>
    );
};
