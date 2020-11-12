'use strict'
import * as fs from 'fs'
import Jimp from 'jimp'
import * as path from 'path'
import * as pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import puppeteer from 'puppeteer-core'
import { getUserDataDir } from '../common/appConfig'
import {
  finalizeJob,
  saveJob,
  saveJobDuration,
  saveJobCompletionStatus,
  saveJobUrlComplete,
  saveJobUrlDuration,
  saveJobUrlIndexBreakpointMatch,
  saveJobUrlStatus,
  getJob,
  copyJobImage
} from '../common/ComparisonResultStore'
import {
  getChromiumPath,
  getDefaultBreakpoints,
  getEnvironmentOrProjectAuth,
  getScrollSpeed,
  isChromiumHeadless,
  updateProjectStats
} from '../common/ConfigurationStore'

const jobDataDir = path.join(getUserDataDir(), 'jobs')
fs.mkdir(jobDataDir, { recursive: true }, (err) => {
  if (err) throw err
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// scroll speed is a percentage of maximum
const defaultScrollSpeed = 65
const maxScrollSpeed = 500 // 0% will give each $distance pixels this number of milliseconds
const defaultAutoScrollDistance = 256
const timeout = 30000
const maximumScrollDistance = 75000

async function autoScroll(page, turbo, description) {
  let scrollSpeed = getScrollSpeed()
  if (!scrollSpeed || scrollSpeed < 1) {
    scrollSpeed = defaultScrollSpeed
  }
  scrollSpeed = scrollSpeed * 0.01 * maxScrollSpeed
  const autoScrollTimeout = (turbo && 0) || maxScrollSpeed - Math.min(Math.max(scrollSpeed, 1), maxScrollSpeed - 1)
  const autoScrollDistance = (turbo && 1024) || defaultAutoScrollDistance

  console.log(`${turbo ? 'Turbo ' : ''}Auto-scrolling...`)

  await page.evaluate(
    async (autoScrollTimeout, autoScrollDistance, maximumScrollDistance, description) => {
      shotCheckMessageCallback(`Starting Auto-scroll of ${description}`)
      await new Promise((resolve, reject) => {
        try {
          var totalHeight = 0
          var timer = setInterval(async () => {
            let scrollHeight = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.offsetHeight,
              document.body.clientHeight,
              document.documentElement.clientHeight
            )
            if (totalHeight < scrollHeight) {
              if (totalHeight % (autoScrollDistance * 7) == 0) {
                shotCheckMessageCallback(
                  `Scrolling ${description} (${Math.round(
                    (totalHeight / Math.min(scrollHeight, maximumScrollDistance)) * 100
                  )}%)`
                )
              }
              window.scrollBy(0, autoScrollDistance)
              totalHeight += autoScrollDistance
            }
            if (totalHeight >= scrollHeight || totalHeight > maximumScrollDistance) {
              window.scrollTo(0, 0)
              shotCheckMessageCallback(`Scrolled ${description} (100%), resting. . .`)
              await new Promise((r) => setTimeout(r, 500)) // Sleep for .5 seconds after scrolling to the top
              clearInterval(timer)
              resolve()
            }
          }, autoScrollTimeout)
        } catch (error) {
          reject(error)
        }
      })
    },
    autoScrollTimeout,
    autoScrollDistance,
    maximumScrollDistance,
    description
  )
}

async function getChromiumExecPath(messageCallback) {
  const customPath = getChromiumPath()
  if (customPath) {
    return customPath
  }
  const browserFetcher = puppeteer.createBrowserFetcher({ path: path.join(getUserDataDir(), 'browsers') })

  const preferredRevision = require('puppeteer-core/lib/cjs/puppeteer/revisions.js').PUPPETEER_REVISIONS.chromium

  const localRevisions = await browserFetcher.localRevisions()

  if (localRevisions.includes(preferredRevision)) {
    const revisionInfo = browserFetcher.revisionInfo(preferredRevision)
    return revisionInfo.executablePath
  } else if (browserFetcher.canDownload(preferredRevision)) {
    let lastRun = new Date().getTime()
    await browserFetcher.download(preferredRevision, async (downloadBytes, totalBytes) => {
      const now = new Date().getTime()
      if (now > lastRun + 250) {
        lastRun = now

        await messageCallback({
          status: 'running',
          progressDetail: `Downloading Chromium version ${preferredRevision}`,
          progressIndex: Math.round((downloadBytes / totalBytes) * 100),
          progressTotal: 100
        })
      }
    })
    messageCallback({
      status: 'running',
      progressDetail: `Downloading Chromium version ${preferredRevision}`,
      progressIndex: 100,
      progressTotal: 100
    })
    const revisionInfo = browserFetcher.revisionInfo(preferredRevision)
    return revisionInfo.executablePath
  } else {
    throw `Cannot download Chrome version ${preferredRevision}! Update the Chrome Path in Preferences (gear icon)`
  }
}

async function openBrowser(messageCallback) {
  const chromiumPath = await getChromiumExecPath(messageCallback)
  const chromiumPathOptions = { executablePath: chromiumPath }

  try {
    fs.accessSync(chromiumPath, fs.constants.R_OK)
  } catch (error) {
    throw 'Chrome executable not found! Update the Chrome Path in Preferences (gear icon)'
  }

  messageCallback({
    status: 'running',
    progressDetail: 'Launching Browser . . .',
    progressIndex: null,
    progressTotal: null
  })

  /*
  const chromeArgs = [
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
  */

  return await puppeteer.launch({
    headless: isChromiumHeadless(),
    slowMo: false,
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    // args: chromeArgs,
    ...chromiumPathOptions
  })
}

async function capture(page, jobDir, filename, messageCallback, description, afterAutoscrollCallback, turboAutoscroll) {
  /*
  const session = await page.target().createCDPSession()
  await session.send('Page.enable')
  await session.send('Page.setWebLifecycleState', { state: 'active' })
  */

  messageCallback(`${turboAutoscroll ? 'Turbo ' : ''} Auto-scrolling ${description}`)
  await autoScroll(page, turboAutoscroll, description)

  await afterAutoscrollCallback()

  messageCallback(`Capturing screenshot of ${description}`)
  await page.screenshot({
    path: path.join(jobDir, filename),
    fullPage: true
  })
}

async function pageDeleteSelectors(page, selectors) {
  if (selectors && selectors.length) {
    console.log('deleting ', selectors.join(','))
    await page.evaluate(async (selectors) => {
      await document.querySelectorAll(selectors.join(',')).forEach(async (item) => {
        await item.remove()
      })
    }, selectors)
  }
}

async function pageClickSelectors(page, selectors) {
  if (selectors && selectors.length) {
    console.log('clicking ', selectors.join(','))
    await page.evaluate(async (selectors) => {
      await document.querySelectorAll(selectors.join(',')).forEach(async (item) => {
        await item.click()
      })
    }, selectors)
  }
}

async function pageExecuteJavaScript(page, scriptText) {
  if (scriptText) {
    console.log('Executing ', scriptText, new Date().toLocaleTimeString())
    await page.evaluate(async (scriptText) => {
      await eval(scriptText)
    }, scriptText)
    console.log('Executed ', scriptText, new Date().toLocaleTimeString())
  }
}

async function takeShot(
  browser,
  messageCallback,
  breakpoints,
  projectId,
  jobId,
  index,
  side,
  url,
  auth,
  spoofUrl,
  job,
  progressCallback
) {
  const thisJobDir = path.join(jobDataDir, projectId || '_', jobId)
  fs.mkdir(thisJobDir, { recursive: true }, (err) => {
    if (err) throw err
  })

  const page = await browser.newPage()

  await page.exposeFunction('shotCheckMessageCallback', messageCallback)
  await page.exposeFunction('shotCheckSleep', sleep)

  let headers = {}

  if (job.requestHeaders) {
    for (let header of job.requestHeaders) {
      const pieces = header.split(':')
      if (pieces.length > 1) {
        const key = pieces[0].trim()
        const value = pieces.slice(1).join(':').trim()
        headers[key] = value
      }
    }
  }

  if (job.queryString) {
    let q = job.queryString.replace(/^\?/, '')
    q = q.replace('{timestamp}', new Date().getTime())
    if (url.includes('?')) {
      url = url + '&' + q
    } else {
      url = url + '?' + q
    }
  }

  if (spoofUrl) {
    const spoofPieces = spoofUrl.split('/')
    if (spoofPieces.length == 3) {
      const spoofHost = spoofPieces[2]
      const protocol = spoofPieces[0]
      headers = { ...headers, 'X-Forwarded-Host': spoofHost, 'X-Forwarded-Proto': protocol }
    } else {
      throw 'Invalid Spoof URL! [' + spoofUrl + ']'
    }
  }

  console.log('Setting extra request headers: ', headers)
  page.setExtraHTTPHeaders(headers)

  if (auth) {
    console.log(`Authenticating with username ${auth.username}`)
    await page.authenticate({ username: auth.username, password: auth.password })
  }

  let status
  try {
    console.log('navigating to ', url)
    const response = await page.goto(url, { timeout: timeout, waitUntil: 'domcontentloaded' })
    if (response) {
      console.log('response status:', response.status())
      status = response.status()
      saveJobUrlStatus(projectId, jobId, side, index, status)
    } else {
      console.log('NO RESPONSE!')
      saveJobUrlStatus(projectId, jobId, side, index, 'no response')
      return
    }

    for (let breakpoint of breakpoints) {
      try {
        await page.setViewport({
          height: 1024,
          width: breakpoint.width
        })
        messageCallback(`Loading ${side} #${index} at ${breakpoint.width}`)
        const startTime = new Date().getTime()
        await page.reload({ timeout: timeout, waitUntil: 'domcontentloaded' })
        try {
          await page.waitForSelector('html', { timeout: 2000 })
        } catch (error) {
          console.log('Error waiting for navigation: ', error)
        }
        await pageExecuteJavaScript(page, job.pageLoadJavaScript)
        await capture(
          page,
          thisJobDir,
          `${side}-${index}-${breakpoint.width}.png`,
          messageCallback,
          `${side} #${index} at ${breakpoint.width}`,
          async () => {
            await pageDeleteSelectors(page, job.ignoreSelectors)
            await pageClickSelectors(page, job.clickSelectors)
            await pageExecuteJavaScript(page, job.afterScrollJavaScript)
            await sleep(1000) // to allow any transitions to complete
          },
          breakpoint.turboAutoscroll
        )
        const duration = new Date().getTime() - startTime
      } finally {
        progressCallback()
      }
    }
  } catch (error) {
    console.log('Error: ', error)
    if (!status) {
      saveJobUrlStatus(projectId, jobId, side, index, error.message)
    }
    throw error
  } finally {
    await page.close()
  }
}

function trimUrlOrObj(s) {
  if (typeof s == 'object') {
    return s
  } else {
    return s.replace(/[\n\r\s]/gm, '')
  }
}

function trimList(list) {
  if (!list) {
    return []
  }
  return list.map((s) => trimUrlOrObj(s)).filter((s) => s != null && (typeof s == 'object' || s.length > 0))
}

async function cropIfNecessary(firstImage, secondImage, firstImagePath) {
  const firstWidth = firstImage.width
  const firstHeight = firstImage.height
  const secondWidth = secondImage.width
  const secondHeight = secondImage.height
  if (firstWidth * firstHeight < secondWidth * secondHeight) {
    const result = await Jimp.read(firstImagePath)
      .then(async (firstImageEdit) => {
        return await firstImageEdit
          .contain(secondWidth, secondHeight, Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.VERTICAL_ALIGN_TOP)
          .writeAsync(firstImagePath)
      })
      .catch((err) => {
        throw err
      })

    return PNG.sync.read(fs.readFileSync(firstImagePath))
  } else {
    return firstImage
  }
}

async function compareShots(projectId, jobId, breakpointWidth, index) {
  let match = {
    percentageSame: 0,
    sameSize: 0,
    error: null
  }
  const thisJobDir = path.join(jobDataDir, projectId || '_', jobId)
  const leftImagePath = path.join(thisJobDir, `left-${index}-${breakpointWidth}.png`)
  const rightImagePath = path.join(thisJobDir, `right-${index}-${breakpointWidth}.png`)
  try {
    let leftImage = PNG.sync.read(fs.readFileSync(leftImagePath))
    let rightImage = PNG.sync.read(fs.readFileSync(rightImagePath))
    match.sameSize = leftImage.width * leftImage.height == rightImage.width * rightImage.height

    leftImage = await cropIfNecessary(leftImage, rightImage, leftImagePath)
    rightImage = await cropIfNecessary(rightImage, leftImage, rightImagePath)

    const { width, height } = leftImage
    const diff = new PNG({ width, height })

    const numDiffPixels = pixelmatch(leftImage.data, rightImage.data, diff.data, width, height, { threshold: 0.1 })

    const numTotalPixels = width * height

    fs.writeFileSync(path.join(thisJobDir, `diff-${index}-${breakpointWidth}.png`), PNG.sync.write(diff))

    match.percentageSame = 1 - numDiffPixels / numTotalPixels
  } catch (error) {
    console.log(`ERROR COMPARING ${leftImagePath} and ${rightImagePath}: `, error)
    match.error = error.message
  } finally {
    saveJobUrlIndexBreakpointMatch(projectId, jobId, index, breakpointWidth, match)
  }
}

const comparisonJob = async (job, callback) => {
  const jobId = job.jobId
  const projectId = job.projectId
  const typeCode = job.typeCode
  const leftEnvironmentId = job.leftEnvironmentId
  const rightEnvironmentId = job.rightEnvironmentId

  let configurationError
  if (job.baselineJobId) {
    const baselineJob = getJob(projectId, job.baselineJobId)
    if (!baselineJob) {
      configurationError = 'Invalid Baseline Comparison Job ID!'
    } else {
      job.breakpoints = baselineJob.breakpoints
      job.leftUrls = baselineJob.leftUrls
    }
  }

  const leftUrls = trimList(job.leftUrls)
  const rightUrls = trimList(job.rightUrls)

  let type

  if (!leftUrls.length && !rightUrls.length) {
    configurationError = 'Invalid comparison - both lists of URLs are empty!'
    type = 'Invalid'
  } else if (leftUrls.length != rightUrls.length) {
    if (rightUrls.length == 0) {
      if (job.beforeAfter) {
        type = 'Before And After (Continuing)'
      } else if (job.baselineCapture) {
        type = 'Baseline Capture'
      } else {
        type = 'Invalid'
        configurationError = 'Invalid comparison - right URL list is empty and type is not specified!'
      }
    } else {
      type = 'Invalid'
      configurationError = 'Invalid comparison - left and right URL lists are different!'
    }
  } else if (job.baselineCapture) {
    type = 'Baseline'
  } else if (job.beforeAfter) {
    type = 'Before And After'
  } else if (job.baselineJobId) {
    type = 'Baseline Comparison'
  } else {
    type = 'Side By Side'
  }

  const breakpoints = job.breakpoints || getDefaultBreakpoints()

  job.type = type
  job.typeCode = typeCode
  job.startDate = job.startDate || new Date().getTime()
  job.breakpoints = breakpoints
  job.duration = 0

  const existingJob = getJob(projectId, jobId)

  if (existingJob) {
    job.duration = existingJob.duration
    job.startDate = existingJob.startDate
    job.breakpoints = existingJob.breakpoints
  }

  if (configurationError) {
    callback({
      error: true,
      message: configurationError,
      status: 'ready',
      options: { variant: 'error' }
    })
    return
  }

  console.log('Starting job: ', job)
  saveJob(job)

  const startDate = new Date()

  const urlSets = [
    {
      side: 'left',
      urls: (job.beforeAfter || job.baselineJobId) && rightUrls && rightUrls.length > 0 ? [] : leftUrls,
      auth: getEnvironmentOrProjectAuth(projectId, leftEnvironmentId),
      spoofUrl: ''
    },
    {
      side: 'right',
      urls: rightUrls,
      auth: getEnvironmentOrProjectAuth(projectId, rightEnvironmentId),
      spoofUrl: job.rightSpoofUrl
    }
  ]

  let progressTotal = (urlSets[0].urls.length + urlSets[1].urls.length) * job.breakpoints.length

  callback({
    job: job,
    status: 'running',
    startDate: startDate.getTime(),
    progressIndex: 0,
    progressTotal: progressTotal
  })

  let progressIndex = 0

  let browser
  try {
    browser = await openBrowser(callback)
    for (let urlSet of urlSets) {
      for (let i = 0; i < urlSet.urls.length; i++) {
        const startTime = new Date().getTime()
        await takeShot(
          browser,
          (msg) =>
            callback({
              job: job,
              status: 'running',
              progressDetail: msg,
              progressIndex: progressIndex,
              progressTotal: progressTotal
            }),
          job.breakpoints,
          projectId,
          jobId,
          i,
          urlSet.side,
          urlSet.urls[i],
          urlSet.auth,
          urlSet.spoofUrl,
          job,
          () => callback({ progressIndex: ++progressIndex, progressTotal: progressTotal })
        )
        const duration = new Date().getTime() - startTime
        saveJobUrlDuration(projectId, jobId, urlSet.side, i, duration)
        saveJobUrlComplete(projectId, jobId, urlSet.side, i, true)
        callback({ job: job, status: 'running', progressDetail: `Captured ${urlSet.side} #${i} in ${duration}ms` })
      }
    }
  } catch (error) {
    console.log(error)
    const message = typeof error == 'string' ? error : error.message
    callback({ message: 'Error: ' + message, status: 'ready' })
    return
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  let completionStatus
  if (rightUrls.length > 0) {
    progressIndex = 0
    progressTotal = urlSets[1].urls.length * job.breakpoints.length
    console.log(`Comparing Screenshots ${progressIndex} / ${progressTotal}`)
    callback({
      job: job,
      status: 'running',
      progressDetail: 'Comparing Screenshots',
      progressIndex: progressIndex,
      progressTotal: progressTotal
    })
    for (let i = 0; i < rightUrls.length; i++) {
      for (let breakpoint of job.breakpoints) {
        if (job.baselineJobId) {
          copyJobImage(projectId, job.baselineJobId, jobId, breakpoint.width, i, 'left')
        }
        await compareShots(projectId, jobId, breakpoint.width, i)
        callback({
          progressDetail: 'Comparing Screenshots',
          progressIndex: ++progressIndex,
          progressTotal: progressTotal
        })
      }
    }
    completionStatus = 'complete'
  } else if (job.beforeAfter) {
    completionStatus = 'leftSideComplete'
  } else if (job.baselineCapture) {
    completionStatus = 'baselineCaptured'
  } else {
    completionStatus = 'unknown'
    callback({ message: 'Unknown completion status...' })
  }
  saveJobCompletionStatus(projectId, jobId, completionStatus)

  console.log(`Job ${job.jobId} Done.`)

  callback({
    job: job,
    status: completionStatus
  })

  const totalDuration = job.duration + (new Date().getTime() - startDate.getTime())
  saveJobDuration(projectId, jobId, totalDuration)
  finalizeJob(projectId, jobId)
  if (projectId && projectId != '_') {
    updateProjectStats(projectId)
  }
  callback({
    job: job,
    status: 'ready',
    message: `${job.name} Complete!`,
    options: { variant: 'success' }
  })
}

export { compareShots, comparisonJob }
