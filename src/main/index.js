'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import * as os from 'os'
import ipcListeners from './ipc/ipcListeners'
import { isDevelopment } from '../common/appConfig'
import { initializeExampleProjectIfNecessary } from '../common/exampleProject'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1294,
    height: 1024,
    minWidth: 1024,
    minHeight: 960,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: !isDevelopment,
      worldSafeExecuteJavaScript: true
    }
  })

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    window.webContents.session.loadExtension(
      path.join(
        os.homedir(),
        '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.8.2_0'
      )
    )
    window.webContents.openDevTools()
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
      })
    )
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  initializeExampleProjectIfNecessary()
  mainWindow = createMainWindow()
  ipcListeners()
})

// handle file:// URLs
app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''))
    callback(pathname)
  })
})
