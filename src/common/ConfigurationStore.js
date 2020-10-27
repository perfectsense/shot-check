import Store from 'electron-store'
import * as yaml from 'js-yaml'
import * as path from 'path'

const yamlOptions = {
  fileExtension: 'yml',
  serialize: yaml.safeDump,
  deserialize: yaml.safeLoad
}

const projectsStore = new Store({
  name: 'projects',
  ...yamlOptions
})

const preferencesStore = new Store({
  name: 'preferences',
  ...yamlOptions
})

const authStore = new Store({
  name: 'auth',
  ...yamlOptions
})

function valuesOrEmpty(obj) {
  if (obj) {
    return Object.values(obj)
  } else {
    return []
  }
}

function keysOrEmpty(obj) {
  if (obj) {
    return Object.keys(obj)
  } else {
    return []
  }
}

function projectStore(projectId) {
  const project = getProject(projectId)
  if (!project) {
    return
  }
  const configPath = project.configPath
  if (configPath) {
    const configPathPath = path.parse(configPath)
    const configPathName = configPathPath.name
    const configPathDir = configPathPath.dir
    return new Store({
      cwd: configPathDir,
      name: configPathName,
      ...yamlOptions
    })
  } else {
    return new Store({
      name: 'project.' + projectId,
      ...yamlOptions
    })
  }
}

// Projects
function getProject(projectId) {
  const project = projectsStore.get('projects.' + projectId)
  if (!project) {
    return null
  }
  return {
    projectId: projectId,
    name: project.name,
    configPath: project.configPath || null
  }
}

function createProject(projectId, name, configPath) {
  projectsStore.set('projects.' + projectId, {
    projectId: projectId,
    name: name,
    configPath: configPath
  })
}

function getProjects() {
  return valuesOrEmpty(projectsStore.get('projects'))
}

function deleteProject(projectId) {
  const project = getProject(projectId)
  if (!project.configPath) {
    projectStore(projectId).clear()
  }
  projectsStore.delete('projects.' + projectId)
}

// Environments
function createEnvironment(projectId, environmentId, name) {
  projectStore(projectId).set('environments.' + environmentId, {
    name: name
  })
}

function getEnvironment(projectId, environmentId) {
  const environment = projectStore(projectId).get('environments.' + environmentId)
  if (!environment) {
    return null
  }
  return {
    projectId: projectId,
    environmentId: environmentId,
    name: environment.name,
    verifyUrl: environment.verifyUrl,
    siteUrls: environment.siteUrls
  }
}

function deleteEnvironment(projectId, environmentId) {
  projectStore(projectId).delete('environments.' + environmentId)
}

function getEnvironments(projectId) {
  return keysOrEmpty(projectStore(projectId).get('environments')).map((environmentId, i) =>
    getEnvironment(projectId, environmentId)
  )
}

function setEnvironmentSiteUrl(projectId, environmentId, siteId, url) {
  projectStore(projectId).set('environments.' + environmentId + '.siteUrls.' + siteId, url)
}

function deleteEnvironmentSiteUrl(projectId, environmentId, siteId) {
  projectStore(projectId).delete('environments.' + environmentId + '.siteUrls.' + siteId)
}

const trailingSlashRegex = /\/+$/g

function getEnvironmentSiteUrl(projectId, environmentId, siteId) {
  const url = projectStore(projectId).get('environments.' + environmentId + '.siteUrls.' + siteId)
  if (url) {
    return url.replaceAll(trailingSlashRegex, '')
  } else {
    return url
  }
}

function getEnvironmentVerifyUrl(projectId, environmentId) {
  const url = projectStore(projectId).get('environments.' + environmentId + '.verifyUrl')
  if (url) {
    return url.replaceAll(trailingSlashRegex, '')
  } else {
    return url
  }
}

function setEnvironmentVerifyUrl(projectId, environmentId, url) {
  projectStore(projectId).set('environments.' + environmentId + '.verifyUrl', url)
}

// Sites
function saveSite(
  projectId,
  siteId,
  name,
  autoPaths,
  autoPathsPath,
  paths,
  ignoreSelectors,
  clickSelectors,
  pageLoadJavaScript,
  afterScrollJavaScript
) {
  projectStore(projectId).set('sites.' + siteId, {
    name: name,
    autoPaths: autoPaths,
    autoPathsPath: autoPathsPath,
    paths: paths,
    ignoreSelectors: ignoreSelectors,
    clickSelectors: clickSelectors,
    pageLoadJavaScript: pageLoadJavaScript,
    afterScrollJavaScript: afterScrollJavaScript
  })
}

function getSite(projectId, siteId) {
  const site = projectStore(projectId).get('sites.' + siteId)
  if (!site) {
    return null
  }
  return {
    siteId: siteId,
    projectId: projectId,
    name: site.name,
    autoPaths: site.autoPaths || false,
    autoPathsPath: site.autoPathsPath || '',
    paths: site.paths || [],
    ignoreSelectors: site.ignoreSelectors || [],
    clickSelectors: site.clickSelectors || [],
    pageLoadJavaScript: site.pageLoadJavaScript || '',
    afterScrollJavaScript: site.afterScrollJavaScript || ''
  }
}

function getSites(projectId) {
  return keysOrEmpty(projectStore(projectId).get('sites')).map((siteId, i) => getSite(projectId, siteId))
}

function deleteSite(projectId, siteId) {
  projectStore(projectId).delete('sites.' + siteId)
  Object.keys(projectStore(projectId).get('environments')).forEach((environmentId) => {
    deleteEnvironmentSiteUrl(projectId, environmentId, siteId)
  })
}

async function fetchAutoPaths(auth, url) {
  let options = {}
  if (auth) {
    options.headers = {
      Authorization: 'Basic ' + btoa(auth.username + ':' + auth.password)
    }
  }
  return fetch(url, options)
    .then((response) => {
      const contentType = response.headers.get('Content-Type')
      if (response.status != 200) {
        throw 'Auto-Path URL returned ' + response.status
      }
      if (!contentType.startsWith('text/plain')) {
        throw 'Auto-Path URL Content Type must be text/plain!'
      }
      return response.text()
    })
    .then((text) => text.split('\n'))
}

async function generateEnvironmentSiteUrls(projectId, environmentId, siteId, callback, errorCallback) {
  let urlPrefix = getEnvironmentSiteUrl(projectId, environmentId, siteId)
  if (urlPrefix) {
    urlPrefix = urlPrefix.replace(/\/+$/, '')
  } else {
    return []
  }
  const site = getSite(projectId, siteId)
  if (!site) {
    return []
  }
  let paths
  if (site.autoPaths && site.autoPathsPath) {
    const auth = getEnvironmentOrProjectAuth(projectId, environmentId)
    paths = fetchAutoPaths(auth, urlPrefix + site.autoPathsPath)
      .then(callback)
      .catch(errorCallback)
  } else {
    paths = site.paths || []
    const urls = paths.map((path, i) => urlPrefix + path)
    callback(urls)
  }
}

// General configuration
function getScrollSpeed() {
  return preferencesStore.get('scrollSpeed', 65)
}

function getChromiumPath() {
  return preferencesStore.get('chromiumPath', '')
}

function saveChromiumPath(chromiumPath) {
  preferencesStore.set('chromiumPath', chromiumPath)
}

function saveScrollSpeed(scrollSpeed) {
  preferencesStore.set('scrollSpeed', scrollSpeed)
}

function getDefaultBreakpoints() {
  return preferencesStore.get('breakpoints', [
    {
      width: 375,
      turboAutoscroll: false
    },
    {
      width: 768,
      turboAutoscroll: true
    },
    {
      width: 1024,
      turboAutoscroll: true
    },
    {
      width: 1440,
      turboAutoscroll: false
    }
  ])
}

function saveDefaultBreakpoints(breakpoints) {
  preferencesStore.set('breakpoints', breakpoints)
}

function deleteDefaultBreakpoints(breakpoints) {
  preferencesStore.delete('breakpoints')
}

function isChromiumHeadless() {
  return preferencesStore.get('headless', true)
}

function saveChromiumHeadless(headless) {
  preferencesStore.set('headless', headless)
}

// Auth
function saveProjectAuth(projectId, username, password) {
  if (username) {
    authStore.set(projectId + '.username', username)
  } else {
    authStore.delete(projectId + '.username')
  }
  if (password) {
    authStore.set(projectId + '.password', password)
  } else {
    authStore.delete(projectId + '.password')
  }
}

function saveEnvironmentAuth(projectId, environmentId, username, password) {
  if (username) {
    authStore.set(projectId + '.' + environmentId + '.username', username)
  } else {
    authStore.delete(projectId + '.' + environmentId + '.username')
  }
  if (password) {
    authStore.set(projectId + '.' + environmentId + '.password', password)
  } else {
    authStore.delete(projectId + '.' + environmentId + '.password')
  }
  if (!username && !password) {
    authStore.delete(projectId + '.' + environmentId)
  }
}

function getProjectAuth(projectId) {
  if (!projectId || projectId == '_') {
    return null
  }
  const username = authStore.get(projectId + '.username')
  const password = authStore.get(projectId + '.password')
  if (username || password) {
    return {
      username: username,
      password: password
    }
  } else {
    return null
  }
}

function getEnvironmentAuth(projectId, environmentId) {
  if (!projectId || !environmentId) {
    return null
  }
  const username = authStore.get(projectId + '.' + environmentId + '.username')
  const password = authStore.get(projectId + '.' + environmentId + '.password')
  if (username || password) {
    return {
      username: username,
      password: password
    }
  } else {
    return null
  }
}

function getEnvironmentOrProjectAuth(projectId, environmentId) {
  const env = getEnvironmentAuth(projectId, environmentId)
  const proj = getProjectAuth(projectId)
  return env || proj
}

export {
  getProject,
  createProject,
  getProjects,
  deleteProject,
  getEnvironment,
  createEnvironment,
  getEnvironments,
  deleteEnvironment,
  setEnvironmentSiteUrl,
  getEnvironmentSiteUrl,
  setEnvironmentVerifyUrl,
  getEnvironmentVerifyUrl,
  getSite,
  saveSite,
  getSites,
  deleteSite,
  generateEnvironmentSiteUrls,
  getScrollSpeed,
  getChromiumPath,
  saveChromiumPath,
  saveScrollSpeed,
  getDefaultBreakpoints,
  saveDefaultBreakpoints,
  deleteDefaultBreakpoints,
  isChromiumHeadless,
  saveChromiumHeadless,
  saveProjectAuth,
  saveEnvironmentAuth,
  getProjectAuth,
  getEnvironmentAuth,
  getEnvironmentOrProjectAuth
}
