const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    let loaded = false;
    let title = '';
    win.webContents.on('did-finish-load', () => { loaded = true; });
    win.webContents.on('console-message', (e, level, message) => {
        if (level >= 2) console.log('RENDERER ERROR:', message);
    });
    await win.loadFile(path.join(__dirname, '..', 'main.html'));
    title = await win.webContents.executeJavaScript('document.title');
    const hasMenuBtn = await win.webContents.executeJavaScript(
        `!!document.querySelector('.menu-btn')`
    );
    console.log('SMOKETEST_RESULT', JSON.stringify({ loaded, title, hasMenuBtn }));

    // dno.html도 직접 로드해 탭 바/시뮬레이션이 정상 동작하는지 확인
    await win.loadFile(path.join(__dirname, '..', 'dno.html'));
    await new Promise(r => setTimeout(r, 500));
    const dnoOk = await win.webContents.executeJavaScript(
        `typeof simulate === 'function' && typeof loadSaveSlots === 'function'`
    );
    console.log('SMOKETEST_RESULT_DNO', JSON.stringify({ dnoOk }));

    app.quit();
});
