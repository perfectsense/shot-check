'use strict'

import { Button, FormControlLabel, makeStyles, Switch, TextField } from '@material-ui/core'
import { useSnackbar } from 'notistack'
import React, { useContext, useState } from 'react'
import { Link, Redirect } from 'react-router-dom'
import { getJob, urlObj } from '../../common/ComparisonResultStore'
import startComparisonJob from '../ipc/startComparisonJob'
import Footer from './Footer'
import { RunningJobContext } from './RunningJobContext'

const useStyles = makeStyles({
  main: {
    display: 'grid',
    gridTemplateColumns: '75px 1fr 1fr 75px 1fr 1fr 75px',
    gridTemplateRows: '2em 75px min-content 2em min-content 2em min-content 2em min-content 2em min-content 5em'
  },
  top: {
    gridRow: '2',
    gridColumn: '2 / 7'
  },
  leftSide: {
    gridRow: '3',
    gridColumn: '2 / 4'
  },
  rightSide: {
    gridRow: '3',
    gridColumn: '5 / 7'
  },
  bothSides: {
    gridRow: '3',
    gridColumn: '2 / 7'
  },
  beforeAfterSwitch: {
    gridRow: '5',
    gridColumn: '2 / 4'
  },
  spoofUrlField: {
    gridRow: '5',
    gridColumn: '5 / 7'
  },
  ignoreSelectors: {
    gridRow: '7',
    gridColumn: '2 / 4'
  },
  clickSelectors: {
    gridRow: '7',
    gridColumn: '5 / 7'
  },
  pageLoadJavaScript: {
    gridRow: '9',
    gridColumn: '2 / 4'
  },
  afterScrollJavaScript: {
    gridRow: '9',
    gridColumn: '5 / 7'
  },
  urlTextArea: {
    whiteSpace: 'nowrap'
  },
  ['urlTextArea::-webkit-input-placeholder']: {
    whiteSpace: 'normal'
  }
})

const RedirectToContinue = ({ beforeAfter, continuing, runningJobContext }) => {
  const { jobId, projectId, status } = runningJobContext.state

  if (beforeAfter && !continuing && jobId) {
    return <Redirect to={`/continue-before-and-after-comparison/${projectId || '_'}/${jobId}`} />
  } else if (status == 'complete' && jobId) {
    return <Redirect to={`/comparison-job/${projectId || '_'}/${jobId}`} />
  } else {
    return null
  }
}

export default ({
  name,
  jobId,
  projectId,
  siteId,
  leftEnvironmentId,
  rightEnvironmentId,
  typeCode,
  leftUrls,
  rightUrls,
  ignoreSelectors,
  clickSelectors,
  pageLoadJS,
  afterScrollJS,
  verifySpoofUrl,
  beforeAfter,
  continuing
}) => {
  const runningJobContext = useContext(RunningJobContext)
  const { enqueueSnackbar } = useSnackbar()
  const classes = useStyles()

  const job = jobId
    ? getJob(projectId, jobId)
    : {
        name: name,
        typeCode: typeCode,
        projectId: projectId,
        siteId: siteId,
        leftEnvironmentId: leftEnvironmentId,
        rightEnvironmentId: rightEnvironmentId,
        rightUrls: (rightUrls && rightUrls.map(urlObj)) || [],
        leftUrls: (leftUrls && leftUrls.map(urlObj)) || [],
        ignoreSelectors: ignoreSelectors || [],
        clickSelectors: clickSelectors || [],
        pageLoadJavaScript: pageLoadJS || '',
        afterScrollJavaScript: afterScrollJS || '',
        beforeAfter: beforeAfter || false,
        rightSpoofUrl: verifySpoofUrl || ''
      }

  if (continuing && rightUrls && rightUrls.length > 0) {
    job.rightUrls = rightUrls.map(urlObj)
  }

  if (job.beforeAfter && !continuing && job.rightUrls.length > 0) {
    job.rightUrls = []
  }

  const [jobName, setJobName] = useState(() => job.name)
  const [leftSideUrlsList, setLeftSideUrlsList] = useState(() => job.leftUrls.map((u) => u.url))
  const [rightSideUrlsList, setRightSideUrlsList] = useState(() => job.rightUrls.map((u) => u.url))
  const [ignoreSelectorsList, setIgnoreSelectorsList] = useState(() => job.ignoreSelectors)
  const [clickSelectorsList, setClickSelectorsList] = useState(() => job.clickSelectors)
  const [pageLoadJavaScript, setPageLoadJavaScript] = useState(() => job.pageLoadJavaScript)
  const [afterScrollJavaScript, setAfterScrollJavaScript] = useState(() => job.afterScrollJavaScript)
  const [isBeforeAfter, setIsBeforeAfter] = useState(() => job.beforeAfter)
  const [rightSpoofUrl, setRightSpoofUrl] = useState(() => job.rightSpoofUrl)

  const [leftSideError, setLeftSideError] = useState(false)
  const [rightSideError, setRightSideError] = useState(false)
  const [leftSideHelperText, setLeftSideHelperText] = useState(() => '')
  const [rightSideHelperText, setRightSideHelperText] = useState(() => '')

  const validateUrl = (url) => {
    return !url || url.startsWith('https://') || url.startsWith('http://')
  }

  const validate = () => {
    let localLeftSideError
    if (isBeforeAfter && !continuing) {
      setRightSideError(false)
    } else {
      localLeftSideError = leftSideUrlsList.filter((s) => s).length != rightSideUrlsList.filter((s) => s).length
      setLeftSideError(localLeftSideError)
      if (localLeftSideError) {
        setLeftSideHelperText('Number of URLs must be equal')
      } else {
        setLeftSideHelperText(null)
      }

      let localRightSideError = rightSideUrlsList.filter((s) => s).length != leftSideUrlsList.filter((s) => s).length
      setRightSideError(localRightSideError)
      if (localRightSideError) {
        setRightSideHelperText('Number of URLs must be equal')
      } else {
        setRightSideHelperText(null)
      }

      if (rightSideUrlsList.filter((s) => !validateUrl(s)).length) {
        setRightSideError(true)
        setRightSideHelperText('URLs must start with http:// or https://')
      } else {
        if (!localRightSideError) {
          setRightSideError(false)
          setRightSideHelperText(null)
        }
      }
    }

    if (leftSideUrlsList.filter((s) => !validateUrl(s)).length) {
      setLeftSideError(true)
      setLeftSideHelperText('URLs must start with http:// or https://')
    } else {
      if (!localLeftSideError) {
        setLeftSideError(localLeftSideError || false)
        setLeftSideHelperText(null)
      }
    }

    if (rightSpoofUrl) {
      const verifyPieces = rightSpoofUrl.split('/')
      if (verifyPieces.length > 3) {
        setRightSpoofUrl(verifyPieces.slice(0, 3).join('/'))
      }
    }
  }

  const handleStartJob = (event) => {
    if (leftSideError || rightSideError) {
      return
    }
    const startJob = {
      name: jobName,
      projectId: job.projectId || null,
      siteId: job.siteId || null,
      leftEnvironmentId: job.leftEnvironmentId || null,
      rightEnvironmentId: job.rightEnvironmentId || null,
      typeCode: job.typeCode,
      leftUrls: leftSideUrlsList.filter((s) => s),
      rightUrls: rightSideUrlsList.filter((s) => s),
      ignoreSelectors: ignoreSelectorsList.filter((s) => s),
      clickSelectors: clickSelectorsList.filter((s) => s),
      pageLoadJavaScript: pageLoadJavaScript,
      afterScrollJavaScript: afterScrollJavaScript,
      rightSpoofUrl: rightSpoofUrl || null,
      beforeAfter: isBeforeAfter
    }
    startComparisonJob(runningJobContext, enqueueSnackbar, startJob, continuing && jobId)
  }

  const urlTextAreaStyle = {
    whiteSpace: 'nowrap'
  }

  return (
    <>
      <main className={classes.main}>
        <TextField
          className={classes.top}
          disabled={continuing}
          label="Name"
          variant="outlined"
          value={jobName + (continuing ? ' (Continuing)' : '')}
          onChange={(e) => {
            setJobName(e.target.value)
          }}
          onBlur={validate}
        />

        <TextField
          disabled={continuing}
          className={isBeforeAfter && !continuing ? classes.bothSides : classes.leftSide}
          inputProps={{ className: classes.urlTextArea }}
          label="URLs (one per line)"
          variant="outlined"
          multiline
          rows={16}
          value={leftSideUrlsList.join('\n')}
          onChange={(e) => {
            setLeftSideUrlsList(e.target.value.split('\n'))
          }}
          onBlur={validate}
          placeholder={`https://...\nhttps://...`}
          error={leftSideError}
          helperText={leftSideHelperText}
        />

        {(!isBeforeAfter || continuing) && (
          <TextField
            className={classes.rightSide}
            inputProps={{ className: classes.urlTextArea }}
            label="URLs (one per line)"
            variant="outlined"
            multiline
            rows={16}
            value={rightSideUrlsList.join('\n')}
            onChange={(e) => {
              setRightSideUrlsList(e.target.value.split('\n'))
            }}
            onBlur={validate}
            placeholder={`https://...\nhttps://...`}
            error={rightSideError}
            helperText={rightSideHelperText}
          />
        )}

        <FormControlLabel
          className={classes.beforeAfterSwitch}
          disabled={typeCode != 'manual'}
          control={<Switch name="beforeAfter" checked={isBeforeAfter} onChange={(_, val) => {
            setIsBeforeAfter(val)
            validate()
          }} />}
          label="Before / After?"
        />

        <TextField
          className={classes.spoofUrlField}
          disabled={typeCode != 'manual' && typeCode != 'verify'}
          variant="outlined"
          label="Right Spoof URL"
          placeholder="https://www.example.com/"
          helperText="Used by Blue/Green Verify to set the X-Forwarded-Host and X-Forwarded-Proto headers on right-side URLs"
          value={rightSpoofUrl}
          onChange={(e) => setRightSpoofUrl(e.target.value)}
          onBlur={validate}
        />

        <TextField
          className={classes.ignoreSelectors}
          disabled={continuing}
          label="Ignore CSS Selectors (one per line)"
          variant="outlined"
          multiline
          rows={4}
          value={ignoreSelectorsList.join('\n')}
          onChange={(e) => {
            setIgnoreSelectorsList(e.target.value.split('\n'))
          }}
          onBlur={validate}
          placeholder={`.google-dfp-ad-wrapper\n.animated-slideshow`}
          helperText="Matching elements will be blanked on each page after auto-scroll and before comparison"
        />

        <TextField
          className={classes.clickSelectors}
          disabled={continuing}
          label="Click CSS Selectors (one per line)"
          variant="outlined"
          multiline
          rows={4}
          value={clickSelectorsList.join('\n')}
          onChange={(e) => {
            setClickSelectorsList(e.target.value.split('\n'))
          }}
          onBlur={validate}
          placeholder={`#close-dialog-button\n.ad-flyout`}
          helperText="Matching elements will be clicked on each page after auto-scroll and before comparison"
        />

        <TextField
          className={classes.pageLoadJavaScript}
          disabled={continuing}
          label="Execute Javascript on Page Load"
          variant="outlined"
          multiline
          rows={8}
          value={pageLoadJavaScript}
          onChange={(e) => {
            setPageLoadJavaScript(e.target.value)
          }}
          onBlur={validate}
          placeholder={``}
          helperText="This JavaScript will run on page load on every breakpoint"
        />

        <TextField
          className={classes.afterScrollJavaScript}
          disabled={continuing}
          label="Execute Javascript after Auto-Scroll"
          variant="outlined"
          multiline
          rows={8}
          value={afterScrollJavaScript}
          onChange={(e) => {
            setAfterScrollJavaScript(e.target.value)
          }}
          onBlur={validate}
          placeholder={``}
          helperText="This JavaScript will run after the browser has auto-scrolled on every breakpoint"
        />
      </main>

      <Footer>
        <Link to={`/comparison-jobs/${projectId || '_'}`}>
          <Button disableElevation variant="contained">View Past Checks</Button>
        </Link>
        <Button
          disableElevation
          variant="contained"
          color="primary"
          onClick={handleStartJob}
          disabled={runningJobContext.state.status != 'ready'}
        >
          {continuing ? 'Continue' : 'Start'} Check
        </Button>
        <RedirectToContinue beforeAfter={isBeforeAfter} continuing={continuing} runningJobContext={runningJobContext} />
      </Footer>
    </>
  )
}
