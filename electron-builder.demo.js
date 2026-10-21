// Steam 데모 빌드 설정 — 먼저 node tools/build-demo.js로 build/demo/를 만든 뒤
//   npx electron-builder --config electron-builder.demo.js --win dir
// 결과: dist-demo/win-unpacked/ (설치 프로그램 없이 실행 파일 폴더 — Steam(SteamPipe)에 이 폴더를 올린다)
module.exports = {
    appId: 'com.pilcrow1926.hemicycle.demo',
    productName: 'Hemicycle Demo',
    executableName: 'Hemicycle',
    asar: true,
    asarUnpack: ['node_modules/steamworks.js/**/*'],
    directories: { output: 'dist-demo' },
    // 앱 파일은 build/demo/에서만 (원본 js · 미리보기 화면은 들어가지 않음), package.json · node_modules는 electron-builder가 붙임
    files: [{ from: 'build/demo', to: '.', filter: ['**/*'] }, 'package.json'],
    extraMetadata: { main: 'electron/main.js', productName: 'Hemicycle Demo' },
    win: { target: [{ target: 'dir', arch: ['x64'] }], icon: 'icons/icon.ico' },
    linux: { target: [{ target: 'dir', arch: ['x64'] }], icon: 'icons/icon.png', category: 'Game' },
    publish: null,
};
