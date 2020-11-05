import Store from 'electron-store'
import { getUserDataDir } from './appConfig'
import * as yaml from 'js-yaml'
import * as path from 'path'
import * as fs from 'fs'
import { getTotalSize } from './FileSizeUtils'

const yamlOptions = {
  fileExtension: 'yml',
  serialize: yaml.safeDump,
  deserialize: yaml.safeLoad
}

function jobStore(projectId, jobId) {
  if (!projectId) {
    projectId = '_'
  }
  return new Store({
    name: path.join('jobs', projectId, jobId, 'details'),
    ...yamlOptions
  })
}

const dataDir = getUserDataDir()

const jobDataDir = (projectId) => {
  return path.join(dataDir, 'jobs', projectId || '_')
}

const getJobIds = (projectId) => {
  const jobs = []

  const dir = jobDataDir(projectId)

  try {
    fs.accessSync(dir, fs.constants.R_OK)
  } catch (error) {
    return jobs
  }

  const files = fs.readdirSync(dir)
  for (let filename of files) {
    let file = fs.statSync(path.join(dir, filename))
    if (file.isDirectory()) {
      try {
        fs.accessSync(path.join(dir, filename, 'details.yml'), fs.constants.R_OK)
        jobs.push(filename)
      } catch (error) {}
    }
  }
  return jobs
}

const getJobs = async (projectId) => {
  const jobs = []

  try {
    for (let jobId of getJobIds(projectId)) {
      const job = getJob(projectId, jobId)
      if (job) {
        jobs.push(job)
      }
    }
  } catch (error) {
    console.log('Error getting jobs:', error)
  }

  jobs.sort((l, r) => (l.startDate < r.startDate ? 1 : -1))

  return jobs
}

function urlObj(url, index) {
  if (typeof url == 'object') {
    return url
  }
  return {
    url: url.trim().replace(/[\r\n\s]/gm, ''),
    status: null,
    duration: null,
    complete: false,
    index: index
  }
}

// Job Results
function saveJob(job) {
  if (!job.jobId) {
    throw 'Job ID Required!'
  }
  const store = jobStore(job.projectId, job.jobId)
  store.set('name', job.name)
  store.set('startDate', job.startDate)
  store.set('type', job.type)
  store.set('typeCode', job.typeCode)
  store.set('beforeAfter', job.beforeAfter)
  store.set('baselineCapture', job.baselineCapture)
  store.set('baselineJobId', job.baselineJobId)
  store.set('siteId', job.siteId)
  store.set('leftEnvironmentId', job.leftEnvironmentId)
  store.set('rightEnvironmentId', job.rightEnvironmentId)
  store.set('leftUrls', job.leftUrls.map(urlObj))
  store.set('rightUrls', job.rightUrls.map(urlObj))
  store.set('ignoreSelectors', job.ignoreSelectors)
  store.set('clickSelectors', job.clickSelectors)
  store.set('pageLoadJavaScript', job.pageLoadJavaScript)
  store.set('afterScrollJavaScript', job.afterScrollJavaScript)
  store.set('breakpoints', job.breakpoints)
  store.set('rightSpoofUrl', job.rightSpoofUrl)
}

function getJobMatchThreshold(projectId, jobId) {
  return jobStore(projectId, jobId).get('matchThreshold', 100)
}

function saveJobMatchThreshold(projectId, jobId, threshold) {
  jobStore(projectId, jobId).set('matchThreshold', threshold)
}

function saveJobZoom(projectId, jobId, zoom) {
  jobStore(projectId, jobId).set('zoom', zoom)
}

function getJobZoom(projectId, jobId) {
  return jobStore(projectId, jobId).get('zoom', 100)
}

function saveJobZoomToFit(projectId, jobId, zoom) {
  jobStore(projectId, jobId).set('zoomToFit', zoom)
}

function getJobZoomToFit(projectId, jobId) {
  return jobStore(projectId, jobId).get('zoomToFit', true)
}

function saveJobUrlField(projectId, jobId, side, index, fieldName, value) {
  const store = jobStore(projectId, jobId)
  const urls = store.get(`${side}Urls`)
  urls[index][fieldName] = value
  store.set(`${side}Urls`, urls)
}

function saveJobUrlStatus(projectId, jobId, side, index, status) {
  saveJobUrlField(projectId, jobId, side, index, 'status', status)
}

function getJobBreakpointMatches(projectId, jobId) {
  return jobStore(projectId, jobId).get('matches')
}

function saveJobUrlIndexBreakpointMatch(projectId, jobId, index, breakpoint, percentage) {
  const store = jobStore(projectId, jobId)
  const matches = store.get('matches') || {}
  const breakpoints = matches[index] || {}
  breakpoints[breakpoint] = percentage
  matches[index] = breakpoints
  store.set('matches', matches)
}

function saveJobUrlDuration(projectId, jobId, side, index, duration) {
  saveJobUrlField(projectId, jobId, side, index, 'duration', duration)
}

function saveJobDuration(projectId, jobId, duration) {
  jobStore(projectId, jobId).set('duration', duration)
}

function saveJobUrlComplete(projectId, jobId, side, index, complete) {
  saveJobUrlField(projectId, jobId, side, index, 'complete', complete)
}

function saveJobCompletionStatus(projectId, jobId, completionStatus) {
  jobStore(projectId, jobId).set('completionStatus', completionStatus)
}

function finalizeJob(projectId, jobId) {
  const store = jobStore(projectId, jobId)
  const size = getTotalSize(path.join(jobDataDir(projectId), jobId))
  store.set('jobSize', size)
  const job = getJob(projectId, jobId)
  if (job.matches) {
    let total = 0
    let count = 0
    for (let m of Object.values(job.matches)) {
      for (let n of Object.values(m)) {
        count++
        total += n.percentageSame
      }
    }
    const average = total / count
    store.set('matchSummary', average)
  } else {
    store.delete('matchSummary')
  }
}

function getJob(projectId, jobId) {
  const store = jobStore(projectId, jobId)
  if (!store.get('name')) {
    return
  }

  const job = {
    jobId: jobId,
    projectId: projectId,
    leftUrls: store.get('leftUrls') || [],
    rightUrls: store.get('rightUrls') || [],
    name: store.get('name'),
    typeCode: store.get('typeCode'),
    siteId: store.get('siteId') || null,
    leftEnvironmentId: store.get('leftEnvironmentId') || null,
    rightEnvironmentId: store.get('rightEnvironmentId') || null,
    startDate: store.get('startDate'),
    beforeAfter: store.get('beforeAfter') || false,
    baselineCapture: store.get('baselineCapture') || false,
    baselineJobId: store.get('baselineJobId') || null,
    type: store.get('type'),
    status: store.get('status'),
    jobSize: store.get('jobSize') || 0,
    duration: store.get('duration') || 0,
    ignoreSelectors: store.get('ignoreSelectors') || [],
    clickSelectors: store.get('clickSelectors') || [],
    pageLoadJavaScript: store.get('pageLoadJavaScript') || '',
    afterScrollJavaScript: store.get('afterScrollJavaScript') || '',
    breakpoints: store.get('breakpoints') || [],
    matches: store.get('matches') || [],
    completionStatus: store.get('completionStatus') || '',
    matchThreshold: store.get('matchThreshold') || 100,
    matchSummary: store.get('matchSummary') || 0
  }

  return job
}

function getJobImage(projectId, jobId, width, index, side) {
  const p = path.join(jobDataDir(projectId), jobId, `${side}-${index}-${width}.png`)
  let exists
  try {
    exists = fs.accessSync(p, fs.constants.R_OK)
    exists = true
  } catch (error) {
    exists = false
  }
  return {
    path: p,
    exists: exists
  }
}

function getJobImages(projectId, jobId, width, index) {
  return {
    left: getJobImage(projectId, jobId, width, index, 'left'),
    right: getJobImage(projectId, jobId, width, index, 'right'),
    diff: getJobImage(projectId, jobId, width, index, 'diff')
  }
}

function copyJobImage(projectId, fromJobId, toJobId, width, index, side) {
  const fromImage = getJobImage(projectId, fromJobId, width, index, side)
  if (fromImage.exists) {
    fs.copyFileSync(fromImage.path, fromImage.path.replace(fromJobId, toJobId))
  }
}

function deleteJob(projectId, jobId) {
  const jobPath = path.join(jobDataDir(projectId), jobId)
  const files = fs.readdirSync(jobPath)
  for (let filename of files) {
    if (filename.endsWith('.png') || filename.endsWith('.yml')) {
      const file = path.join(jobPath, filename)
      fs.unlinkSync(file)
    }
  }
  fs.rmdirSync(jobPath)
}

export {
  getJobs,
  getJobIds,
  saveJob,
  saveJobUrlStatus,
  saveJobUrlDuration,
  saveJobUrlComplete,
  getJob,
  finalizeJob,
  saveJobDuration,
  saveJobUrlIndexBreakpointMatch,
  saveJobCompletionStatus,
  getJobBreakpointMatches,
  getJobMatchThreshold,
  saveJobMatchThreshold,
  getJobZoom,
  saveJobZoom,
  getJobZoomToFit,
  saveJobZoomToFit,
  getJobImages,
  getJobImage,
  copyJobImage,
  deleteJob,
  urlObj
}
