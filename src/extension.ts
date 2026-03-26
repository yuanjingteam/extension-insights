import * as vscode from 'vscode';
import * as path from 'path';
import { Analyzer, ExtensionData } from './Analyzer';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension Insights 已激活！');

    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    context.subscriptions.push(
        vscode.commands.registerCommand('extensionInsights.show', () => {
            const column = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;

            if (currentPanel) {
                currentPanel.reveal(column);
                return;
            }

            currentPanel = vscode.window.createWebviewPanel(
                'extensionInsights',
                '扩展洞察 (Extension Insights)',
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'dist'))
                    ],
                    retainContextWhenHidden: true 
                }
            );

            currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionPath);

            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null,
                context.subscriptions
            );

            currentPanel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'refresh':
                            await updateData(currentPanel!);
                            break;
                        case 'export':
                            await exportConfig();
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );
}

async function updateData(panel: vscode.WebviewPanel) {
    try {
        const extensions = await Analyzer.getExtensions();
        const conflicts = Analyzer.getConflicts(extensions);
        
        panel.webview.postMessage({
            command: 'updateData',
            payload: {
                extensions,
                conflicts
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`分析扩展失败: ${error}`);
    }
}

async function exportConfig() {
    const extensions = await Analyzer.getExtensions();
    // Generate .vscode/extensions.json format
    const recommendations = extensions
        .filter(ext => !ext.isBuiltin)
        .map(ext => ext.id); // ext.id is usually publisher.name

    const content = {
        recommendations
    };

    const doc = await vscode.workspace.openTextDocument({
        content: JSON.stringify(content, null, 4),
        language: 'json'
    });
    
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage('配置已生成。请将其保存为 .vscode/extensions.json 以分享推荐配置。');
}

function getWebviewContent(webview: vscode.Webview, extensionPath: string) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist', 'webview.js')));
    
    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Extension Insights</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate() {}
