const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'Cheiron_256x256.png'), // アプリアイコンを設定
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`
    );

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// カスタムアラートダイアログの実装
ipcMain.handle('show-error-dialog', async (event, title, message) => {
    const result = await dialog.showMessageBox(mainWindow, {
        type: 'none', // システムアイコンを使わず、カスタムアイコンのみ
        title: title || 'Cheiron',
        message: title || 'Cheiron',  // タイトル行
        detail: message || 'エラーが発生しました', // 詳細メッセージ
        icon: path.join(__dirname, 'Cheiron_512x512.png'), // 超高解像度アイコン
        buttons: ['OK'],
        defaultId: 0,
        noLink: true,
        normalizeAccessKeys: false // アクセスキーの自動変換を無効化
    });
    return result;
});

// 汎用的なアラートダイアログ
ipcMain.handle('show-alert-dialog', async (event, title, message, type = 'info') => {
    const result = await dialog.showMessageBox(mainWindow, {
        type: 'none', // カスタムアイコンを優先
        title: 'Cheiron',
        message: title || 'お知らせ',
        detail: message || '',
        icon: path.join(__dirname, 'Cheiron_512x512.png'), // 超高解像度アイコン
        buttons: ['OK'],
        defaultId: 0,
        noLink: true,
        normalizeAccessKeys: false
    });
    return result;
});