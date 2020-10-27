'use strict'
import * as fs from 'fs'
import Jimp from 'jimp'
import * as path from 'path'
import * as pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import puppeteer from 'puppeteer'
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
  getJob
} from '../common/ComparisonResultStore'
import {
  getChromiumPath,
  getDefaultBreakpoints,
  getEnvironmentOrProjectAuth,
  getScrollSpeed,
  isChromiumHeadless
} from '../common/ConfigurationStore'

const jobDataDir = path.join(getUserDataDir(), 'jobs')
fs.mkdir(jobDataDir, { recursive: true }, (err) => {
  if (err) throw err
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// scroll speed is a percentage of maximum
const defaultScrollSpeed = 80
const maxScrollSpeed = 1000
const defaultAutoScrollDistance = 100
const timeout = 30000
const maximumScrollDistance = 75000

async function autoScroll(page, turbo) {
  let scrollSpeed = getScrollSpeed()
  if (!scrollSpeed || scrollSpeed < 1) {
    scrollSpeed = defaultScrollSpeed
  }
  scrollSpeed = scrollSpeed * 0.01 * maxScrollSpeed
  const autoScrollTimeout = (turbo && 0) || maxScrollSpeed - Math.min(Math.max(scrollSpeed, 1), maxScrollSpeed - 1)
  const autoScrollDistance = (turbo && 1024) || defaultAutoScrollDistance

  console.log(`${turbo ? 'Turbo ' : ''}Auto-scrolling...`)

  await page.evaluate(
    async (autoScrollTimeout, autoScrollDistance, maximumScrollDistance) => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0
        var timer = setInterval(async () => {
          var scrollHeight = document.body.scrollHeight
          if (totalHeight < scrollHeight) {
            window.scrollBy(0, autoScrollDistance)
            totalHeight += autoScrollDistance
          }
          if (totalHeight >= scrollHeight || totalHeight > maximumScrollDistance) {
            window.scrollTo(0, 0)
            await new Promise((r) => setTimeout(r, 1000)) // Sleep for 1 second after scrolling to the top
            clearInterval(timer)
            resolve()
          }
        }, autoScrollTimeout)
      })
    },
    autoScrollTimeout,
    autoScrollDistance,
    maximumScrollDistance
  )
}

function getChromiumExecPath() {
  const customPath = getChromiumPath()
  if (customPath) {
    return customPath
  }
  return puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked')
}

async function openBrowser() {
  const chromiumPath = getChromiumExecPath()
  const chromiumPathOptions = { executablePath: chromiumPath }

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
    // args: chromeArgs,
    ...chromiumPathOptions
  })
}

async function capture(page, jobDir, filename, afterAutoscrollCallback, turboAutoscroll) {
  /*
  const session = await page.target().createCDPSession()
  await session.send('Page.enable')
  await session.send('Page.setWebLifecycleState', { state: 'active' })
  */

  // const autoscrolling = (turboAutoscroll && 'Turbo Autoscrolling') || 'Autoscrolling'
  // messageCallback(`${autoscrolling} to lazy load all content`)
  await autoScroll(page, turboAutoscroll)

  await afterAutoscrollCallback()

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
    console.log('Executing ', scriptText)
    await page.evaluate((scriptText) => {
      eval(scriptText)
    }, scriptText)
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

  if (spoofUrl) {
    const spoofPieces = spoofUrl.split('/')
    if (spoofPieces.length == 3) {
      const spoofHost = spoofPieces[2]
      const protocol = spoofPieces[0]
      const headers = { 'X-Forwarded-Host': spoofHost, 'X-Forwarded-Proto': protocol }
      page.setExtraHTTPHeaders(headers)
    } else {
      throw 'Invalid Spoof URL! [' + spoofUrl + ']'
    }
  }

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
    page.close()
  }
}

function trimList(list) {
  if (!list) {
    return []
  }
  return list.map((s) => s.replace(/[\n\r\s]/gm, '')).filter((s) => s != null && s.length > 0)
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
  const leftUrls = trimList(job.leftUrls)
  const rightUrls = trimList(job.rightUrls)
  const jobId = job.jobId
  const projectId = job.projectId
  const typeCode = job.typeCode
  const leftEnvironmentId = job.leftEnvironmentId
  const rightEnvironmentId = job.rightEnvironmentId

  let type
  let configurationError

  if (!leftUrls.length && !rightUrls.length) {
    configurationError = 'Invalid comparison - both lists of URLs are empty!'
    type = 'Invalid'
  } else if (leftUrls.length != rightUrls.length) {
    if (rightUrls.length == 0) {
      type = 'Before And After (Continuing)'
    } else {
      type = 'Invalid'
      configurationError = 'Invalid comparison - left and right URL lists are different!'
    }
  } else if (job.beforeAfter) {
    type = 'Before And After'
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

  console.log('Starting job: ', job)

  saveJob(job)

  if (configurationError) {
    callback({
      error: true,
      message: configurationError,
      status: 'ready',
      options: { variant: 'error' }
    })
    return
  }

  const startDate = new Date()

  const urlSets = [
    {
      side: 'left',
      urls: job.beforeAfter && rightUrls && rightUrls.length > 0 ? [] : leftUrls,
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
    progressTotal: progressTotal
  })

  let progressIndex = 0

  let browser
  try {
    browser = await openBrowser()
    for (let urlSet of urlSets) {
      for (let i = 0; i < urlSet.urls.length; i++) {
        const startTime = new Date().getTime()
        await takeShot(
          browser,
          (msg) => callback({ job: job, status: 'running', progressDetail: msg }),
          job.breakpoints,
          projectId,
          jobId,
          i,
          urlSet.side,
          urlSet.urls[i],
          urlSet.auth,
          urlSet.spoofUrl,
          job,
          () => callback({ progressIndex: ++progressIndex })
        )
        const duration = new Date().getTime() - startTime
        saveJobUrlDuration(projectId, jobId, urlSet.side, i, duration)
        saveJobUrlComplete(projectId, jobId, urlSet.side, i, true)
        callback({ job: job, status: 'running', progressDetail: `Captured ${urlSet.side} #${i} in ${duration}ms` })
      }
    }
  } catch (error) {
    console.log(error)
    callback({ message: 'Error: ' + error.message, status: 'ready' })
    return
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  progressIndex = 0
  progressTotal = urlSets[0].urls.length * job.breakpoints.length
  callback({
    job: job,
    status: 'running',
    progressDetail: 'Comparing Screenshots',
    progressIndex: progressIndex,
    progressTotal: progressTotal
  })

  let completionStatus
  if (rightUrls.length > 0) {
    for (let i = 0; i < rightUrls.length; i++) {
      for (let breakpoint of job.breakpoints) {
        await compareShots(projectId, jobId, breakpoint.width, i)
        callback({ progressIndex: ++progressIndex })
      }
    }
    completionStatus = 'complete'
  } else {
    completionStatus = 'leftSideComplete'
  }
  saveJobCompletionStatus(projectId, jobId, completionStatus)

  callback({
    job: job,
    status: completionStatus
  })

  const totalDuration = job.duration + (new Date().getTime() - startDate.getTime())
  saveJobDuration(projectId, jobId, totalDuration)
  finalizeJob(projectId, jobId)
  callback({
    job: job,
    status: 'ready',
    message: `${job.name} Complete!`,
    options: { variant: 'success' }
  })
}

export { compareShots, comparisonJob }
