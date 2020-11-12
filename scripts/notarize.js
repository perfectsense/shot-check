const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`Notarizing ${appOutDir}/${appName}.app . . .`)

  const keepAlive = setInterval(function() {
    console.log('Waiting for notarization . . . ' + new Date())
  }, 30000)

  return notarize({
    appBundleId: 'com.psddev.shot-check',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  }).then(() => {
    console.log('Notarization Success')
    clearInterval(keepAlive)
  })
  .catch((err) => {
    console.log('Notarization Error: ' + err)
    clearInterval(keepAlive)
  })
}
