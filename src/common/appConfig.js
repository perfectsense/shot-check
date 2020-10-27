import { app, remote } from 'electron'
import * as path from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'
const APP_NAME = 'Shot Check'

const appOrRemote = app || remote.app
// Override userData path in development: https://github.com/electron-userland/electron-webpack/issues/239
if (isDevelopment) {
  ;(function () {
    appOrRemote.setName(APP_NAME)
    appOrRemote.setPath('userData', path.join(appOrRemote.getPath('appData'), APP_NAME))
  })()
}

function getUserDataDir() {
  return appOrRemote.getPath('userData')
}

export { getUserDataDir, isDevelopment, APP_NAME }
