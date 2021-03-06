import Store from 'electron-store'
import * as yaml from 'js-yaml'
import * as path from 'path'
import * as fs from 'fs'
import { deleteJob, getJobIds, getJobs } from './ComparisonResultStore'

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
    configPath: project.configPath || null,
    totalSize: project.totalSize || 0,
    numJobs: project.numJobs || 0,
    lastJobDate: project.lastJobDate || null,
    lastJobId: project.lastJobId || null
  }
}

function saveProject(projectId, name, configPath) {
  const project = getProject(projectId) || {}
  projectsStore.set('projects.' + projectId, {
    ...project,
    projectId: projectId,
    name: name,
    configPath: configPath
  })
}

function getProjects() {
  return valuesOrEmpty(projectsStore.get('projects'))
}

function migrateProjectConfigToExternal(projectId, externalConfigFile) {
  const store = projectStore(projectId)
  const project = getProject(projectId)
  saveProject(projectId, project.name, externalConfigFile)
  const newStore = projectStore(projectId)
  let exists
  try {
    fs.accessSync(externalConfigFile, fs.constants.R_OK)
    exists = true
  } catch (error) {
    exists = false
  }
  if (!exists) {
    newStore.store = store.store
  }
}

function migrateProjectConfigToInternal(projectId) {
  const store = projectStore(projectId)
  const project = getProject(projectId)
  saveProject(projectId, project.name, null)
  const newStore = projectStore(projectId)
  let exists
  try {
    fs.accessSync(newStore.path, fs.constants.R_OK)
    exists = true
  } catch (error) {
    exists = false
  }
  if (!exists) {
    newStore.store = store.store
  }
}

function deleteProject(projectId) {
  const project = getProject(projectId)
  for (let jobId of getJobIds(projectId)) {
    deleteJob(projectId, jobId)
  }
  if (!project.configPath) {
    projectStore(projectId).clear()
  }
  projectsStore.delete('projects.' + projectId)
}

// Environments
function saveEnvironment(projectId, environmentId, name) {
  const environment = getEnvironment(projectId, environmentId) || {}
  projectStore(projectId).set('environments.' + environmentId, {
    ...environment,
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
    verifyUrl: environment.verifyUrl || null,
    siteUrls: environment.siteUrls || []
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
  afterScrollJavaScript,
  queryString,
  requestHeaders
) {
  projectStore(projectId).set('sites.' + siteId, {
    name: name,
    autoPaths: autoPaths,
    autoPathsPath: autoPathsPath,
    paths: paths,
    ignoreSelectors: ignoreSelectors,
    clickSelectors: clickSelectors,
    pageLoadJavaScript: pageLoadJavaScript,
    afterScrollJavaScript: afterScrollJavaScript,
    queryString: queryString,
    requestHeaders: requestHeaders
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
    afterScrollJavaScript: site.afterScrollJavaScript || '',
    queryString: site.queryString || '',
    requestHeaders: site.requestHeaders || []
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

function isPrerelease() {
  return preferencesStore.get('prerelease', false)
}

function savePrerelease(headless) {
  preferencesStore.set('prerelease', headless)
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

async function updateProjectStats(projectId) {
  const project = getProject(projectId)
  if (!project) {
    return
  }

  const jobs = await getJobs(projectId)
  if (!jobs || !jobs.length) {
    return
  }

  let totalSize = 0
  let latestJobDate = 0
  let latestJobId
  for (let job of jobs) {
    if (isFinite(job.jobSize)) {
      totalSize += job.jobSize
    }
    if (job.startDate > latestJobDate && job.completionStatus == 'complete') {
      latestJobDate = job.startDate
      latestJobId = job.jobId
    }
  }
  projectsStore.set('projects.' + projectId + '.totalSize', totalSize)
  projectsStore.set('projects.' + projectId + '.numJobs', jobs.length)
  projectsStore.set('projects.' + projectId + '.lastJobDate', latestJobDate)
  projectsStore.set('projects.' + projectId + '.lastJobId', latestJobId)
}

export {
  getProject,
  saveProject,
  getProjects,
  deleteProject,
  getEnvironment,
  saveEnvironment,
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
  isPrerelease,
  savePrerelease,
  saveProjectAuth,
  saveEnvironmentAuth,
  getProjectAuth,
  getEnvironmentAuth,
  getEnvironmentOrProjectAuth,
  updateProjectStats,
  migrateProjectConfigToExternal,
  migrateProjectConfigToInternal
}
