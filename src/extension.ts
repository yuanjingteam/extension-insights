//插件入口：负责注册命令和创建Webview面板
import * as vscode from 'vscode';
import * as path from 'path';
import { Analyzer} from './Analyzer';

// 插件激活时
export function activate(context: vscode.ExtensionContext) {
    console.log('Extension Insights 已激活！');

    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    // 注册命令：插件关闭的时候自动释放
    context.subscriptions.push(
        // 1.注册命令：显示扩展洞察面板
        vscode.commands.registerCommand('extensionInsights.show', () => {
            const column = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;

            if (currentPanel) {
                currentPanel.reveal(column);
                return;
            }

            // 2.创建Webview面板
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

            //加载前端页面
            currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionPath);

            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null,
                context.subscriptions
            );

            // 3.监听Webview消息（对前端页面发过来的消息进行处理）
            currentPanel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'refresh':
                            await updateData(currentPanel!);
                            break;
                        case 'export':
                            await exportConfig();
                            break;
                        case 'disable':
                            await requestDisable(message.extensionId, message.extensionName);
                            await updateData(currentPanel!);
                            break;
                        case 'uninstall':
                            await requestUninstall(message.extensionId, message.extensionName);
                            await updateData(currentPanel!);
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );
}

async function requestDisable(extensionId: string, extensionName: string) {
    const result = await vscode.window.showInformationMessage(
        `由于 VS Code 安全限制，请在打开的详情页中手动点击“禁用”按钮。`,
        { modal: true },
        '前往操作'
    );

    if (result === '前往操作') {
        try {
            await vscode.commands.executeCommand('extension.open', extensionId);
        } catch (error) {
            vscode.window.showErrorMessage(`无法打开插件详情页: ${error}`);
        }
    }
}

async function requestUninstall(extensionId: string, extensionName: string) {
    const result = await vscode.window.showInformationMessage(
        `由于 VS Code 安全限制，请在打开的详情页中手动点击“卸载”按钮。`,
        { modal: true },
        '前往操作'
    );

    if (result === '前往操作') {
        try {
            await vscode.commands.executeCommand('extension.open', extensionId);
        } catch (error) {
            vscode.window.showErrorMessage(`无法打开插件详情页: ${error}`);
        }
    }
}

async function updateData(panel: vscode.WebviewPanel) {
    try {
        // 获取所有扩展信息
        const extensions = await Analyzer.getExtensions();
        // 分析冲突
        const conflicts = Analyzer.getConflicts(extensions);

        console.log(`[Backend] 已获取 ${extensions.length} 个扩展，其中用户扩展 ${extensions.filter(e => !e.isBuiltin).length} 个`);

        // 4.发送更新数据到Webview
        panel.webview.postMessage({
            command: 'updateData',
            payload: {
                extensions,
                conflicts
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`分析扩展失败: ${error}`);
        console.error(`[Backend] 分析失败: ${error}`);
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
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src ${webview.cspSource};">
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

export function deactivate() { }
