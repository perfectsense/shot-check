import { Box, Button, LinearProgress, makeStyles, Typography } from '@material-ui/core'
import AssessmentOutlinedIcon from '@material-ui/icons/AssessmentOutlined'
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord'
import clsx from 'clsx'
import React, { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { getJob } from '../../common/ComparisonResultStore'
import { RunningJobContext } from './RunningJobContext'

const useStyles = makeStyles({
  details: {
    display: 'grid',
    gridTemplateColumns: 'min-content 1fr'
  },
  status: {
    gridColumn: 1,
    display: 'grid',
    gridTemplateColumns: 'min-content',
    alignSelf: 'center',
    paddingRight: '1em',
    paddingLeft: '1em'
  },
  details2: {
    gridRow: '4',
    gridColumn: '5 / 7'
  },
  statusIcon: {
    width: '25px',
    gridColumn: 1
  },
  readyIcon: {
    color: '#66dd00'
  },
  runningIcon: {
    color: '#ee0000'
  },
  statusText: {
    fontSize: '.9em',
    gridColumn: 2
  },
  previousJob: {
    gridColumn: 2,
    alignSelf: 'center'
  },
  previousJobLink: {
    color: 'black',
    textDecoration: 'none'
  },
  progressBar: {
    gridColumn: 2,
    alignSelf: 'center'
  },
  progressBarLabel: {
    whiteSpace: 'nowrap'
  },
  progressBarDetails: {
    fontSize: '.9em'
  }
})

const StatusIcon = ({ status }) => {
  const classes = useStyles()

  if (status == 'ready') {
    return (
      <div className={classes.status}>
        <FiberManualRecordIcon className={clsx(classes.statusIcon, classes.readyIcon)} />
        <Typography className={classes.statusText}>Ready</Typography>
      </div>
    )
  } else if (status == 'running') {
    return (
      <div className={classes.status}>
        <FiberManualRecordIcon className={clsx(classes.statusIcon, classes.runningIcon)} />
        <Typography className={classes.statusText}>Running</Typography>
      </div>
    )
  } else if (status == 'initialized') {
    return (
      <div className={classes.status}>
        <FiberManualRecordIcon className={clsx(classes.statusIcon, classes.runningIcon)} />
        <Typography className={classes.statusText}>Initialized</Typography>
      </div>
    )
  } else {
    return (
      <div className={classes.status}>
        <FiberManualRecordIcon className={clsx(classes.statusIcon, classes.runningIcon)} />
        <Typography className={classes.statusText}>{status}</Typography>
      </div>
    )
  }
}

const PreviousJob = ({ jobId, projectId }) => {
  const classes = useStyles()
  const history = useHistory()

  const job = getJob(projectId, jobId)
  if (!job) {
    return null
  }
  if (job.completionStatus == 'complete') {
    return (
      <Box className={classes.previousJob} width="100%">
        <Button
          disableElevation
          color="primary"
          className={classes.previousJobButton}
          onClick={() => history.push(`/comparison-job/${projectId || '_'}/${jobId}`)}
        >
          <AssessmentOutlinedIcon fontSize="small" /> View Latest Results
        </Button>
      </Box>
    )
  } else if (job.completionStatus == 'leftSideComplete') {
    return (
      <Box className={classes.previousJob} width="100%">
        <Button
          disableElevation
          color="primary"
          className={classes.previousJobButton}
          onClick={() => history.push(`/continue-before-and-after-comparison/${projectId || '_'}/${jobId}`)}
        >
          Continue Before/After Check
        </Button>
      </Box>
    )
  } else {
    return <Box></Box>
  }
}

const ProgressBar = ({ index, total, detail }) => {
  const classes = useStyles()

  const progress = Math.round((index / total) * 100)
  const label = `${index} / ${total}`

  return (
    <Box
      width="100%"
      className={classes.progressBar}
      display="grid"
      gridTemplateRows="max-content"
      gridTemplateColumns="1fr"
    >
      <Box display="flex" alignItems="center" gridRow="1 / 2" gridColumn="1 / 2">
        <Box width="100%" mr={1}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Box minWidth={35}>
          <Typography className={classes.progressBarLabel} variant="body2" color="textSecondary">
            {label}
          </Typography>
        </Box>
      </Box>
      <Box alignSelf="center" gridRow="2" gridColumn="1 / 2">
        <Typography className={classes.progressBarDetails}>{detail}&nbsp;</Typography>
      </Box>
    </Box>
  )
}

export default ({ children }) => {
  const classes = useStyles()

  const runningJobContext = useContext(RunningJobContext)

  const previousJobId = runningJobContext.state.previousJobId
  const previousProjectId = runningJobContext.state.previousProjectId
  const status = runningJobContext.state.status
  const progressIndex = runningJobContext.state.progressIndex || 0
  const progressTotal = runningJobContext.state.progressTotal
  const progressDetail = runningJobContext.state.progressDetail
  const showProgress = progressTotal && progressTotal > 0
  const showPreviousJob = previousJobId && !showProgress

  return (
    <footer>
      <div className={classes.details}>
        <StatusIcon status={status} />
        {showProgress && <ProgressBar index={progressIndex} total={progressTotal} detail={progressDetail} />}
        {showPreviousJob && <PreviousJob jobId={previousJobId} projectId={previousProjectId} />}
      </div>
      <nav>{children}</nav>
    </footer>
  )
}
