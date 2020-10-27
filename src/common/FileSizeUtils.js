'use strict'
import * as fs from 'fs'
import * as path from 'path'

const getAllFiles = function (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function (file) {
    let thisFile = fs.statSync(path.join(dirPath, file))
    if (thisFile.isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(dirPath, file))
    }
  })

  return arrayOfFiles
}

const getTotalSize = function (directoryPath) {
  const arrayOfFiles = getAllFiles(directoryPath)

  let totalSize = 0

  arrayOfFiles.forEach(function (filePath) {
    totalSize += fs.statSync(filePath).size
  })

  return totalSize
}

const convertBytes = function (bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  if (bytes == 0) {
    return 'n/a'
  }

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

  if (i == 0) {
    return bytes + ' ' + sizes[i]
  }

  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

export { getAllFiles, getTotalSize, convertBytes }
