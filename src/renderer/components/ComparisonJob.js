import {
  Button,
  Chip,
  Collapse,
  FormControlLabel,
  makeStyles,
  Paper,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import AssessmentOutlinedIcon from '@material-ui/icons/AssessmentOutlined'
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline'
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp'
import PageviewOutlinedIcon from '@material-ui/icons/PageviewOutlined'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import open from 'open'
import * as path from 'path'
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserDataDir } from '../../common/appConfig'
import {
  getJob,
  getJobImages,
  getJobMatchThreshold,
  getJobZoom,
  getJobZoomToFit,
  saveJobMatchThreshold,
  saveJobZoom,
  saveJobZoomToFit
} from '../../common/ComparisonResultStore'
import { getProject } from '../../common/ConfigurationStore'
import { convertBytes } from '../../common/FileSizeUtils'
import { formatDate, formatDuration } from '../../common/FormatingUtils'
import Footer from './Footer'
import Header from './Header'

const useStyles = makeStyles({
  main: {
    display: 'grid',
    gridTemplateColumns: '75px repeat(2, 1fr) repeat(4, .75fr) 75px',
    gridTemplateRows: '2em min-content 1fr'
  },
  jobTable: {
    gridRow: '3',
    gridColumn: '2 / 8',
    overflowY: 'scroll'
  },
  errorChip: {
    marginRight: '.5em',
    marginBottom: '.5em',
    backgroundColor: '#F50057',
    '&:active, &:hover, &:focus': {
      backgroundColor: '#F50057'
    }
  },
  errorChipActive: {
    marginRight: '.5em',
    marginBottom: '.5em',
    borderColor: '#F50057',
    color: '#F50057',
    '&:active, &:hover, &:focus': {
      color: '#F50057'
    }
  },
  okChip: {
    marginRight: '.5em',
    marginBottom: '.5em',
    backgroundColor: 'green',
    '&:active, &:hover, &:focus': {
      backgroundColor: 'green'
    }
  },
  okChipActive: {
    marginRight: '.5em',
    marginBottom: '.5em',
    borderColor: 'green',
    color: 'green',
    '&:active, &:hover, &:focus': {
      color: 'green'
    }
  },
  reportDetails: {
    gridRow: '2',
    gridColumn: '2 / 5'
  },
  reportName: {
    fontSize: '1.4em',
    fontWeight: 'bold'
  },
  reportDate: {
    color: '#888888'
  },
  hideSuccessSwitch: {
    gridRow: '2',
    gridColumn: '4 / 5',
    paddingBottom: '1em',
    marginRight: '1em'
  },
  zoomToFitSwitch: {
    gridRow: '2',
    gridColumn: '5 / 6',
    paddingBottom: '1em',
    marginRight: '1em'
  },
  zoomSlider: {
    gridRow: '2',
    gridColumn: '6 / 7',
    paddingBottom: '1em',
    marginRight: '1em'
  },
  thresholdSlider: {
    gridRow: '2',
    gridColumn: '7 / 8',
    paddingBottom: '1em',
    marginLeft: '1em'
  },
  urlLink: {
    color: '-webkit-link',
    cursor: 'pointer'
  },
  matchCell: {},
  screenshotTable: {}
})

const BackLink = ({ projectId }) => {
  if (projectId == '_') {
    return (
      <Link to="/manual-comparison">
        <PlaylistAddCheckIcon />
        Manual Check
      </Link>
    )
  } else if (projectId) {
    const project = getProject(projectId)
    return (
      <Link to={`/project/${projectId}`}>
        <PlaylistAddCheckIcon />
        {project.name}
      </Link>
    )
  }
}

const BackLink2 = ({ projectId }) => {
  return (
    <Link to={`/comparison-jobs/${projectId}`}>
      <PageviewOutlinedIcon />
      Browse
    </Link>
  )
}

const ScreenshotTable = ({ activeBreakpoint, job, index, matches, leftUrl, rightUrl, zoom, zoomToFit }) => {
  const classes = useStyles()

  const { left, right, diff } = getJobImages(job.projectId, job.jobId, activeBreakpoint, index)

  const match = matches && matches[activeBreakpoint]
  const percentageSame = (match && Math.floor(match.percentageSame * 1000) / 10) || 0

  const leftUrlUrl = leftUrl && leftUrl.url
  const rightUrlUrl = rightUrl && rightUrl.url

  const leftUrlStatus = leftUrl && leftUrl.status
  const rightUrlStatus = rightUrl && rightUrl.status

  const tableWidth = zoomToFit ? '100%' : activeBreakpoint * 3 * zoom + 'px'

  const imageWidth = zoomToFit ? '100%' : activeBreakpoint * zoom

  const tableStyle = {
    width: tableWidth
  }

  const tableCellStyle = {
    maxWidth: `${activeBreakpoint}px`
  }

  return (
    <Table className={classes.screenshotTable} style={tableStyle}>
      <TableBody>
        <TableRow>
          <TableCell style={tableCellStyle}>
            <Typography>
              URL: {leftUrlUrl}
              <br />
              Status: {leftUrlStatus}
              <br />
            </Typography>
          </TableCell>
          <TableCell style={tableCellStyle} className={classes.matchCell}>
            <Typography>Match: {percentageSame}%</Typography>
          </TableCell>
          <TableCell style={tableCellStyle}>
            <Typography>
              URL: {rightUrlUrl}
              <br />
              Status: {rightUrlStatus}
              <br />
            </Typography>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={tableCellStyle}>
            {(left.exists && (
              <img
                style={{ cursor: 'pointer' }}
                onClick={() => open(left.path)}
                width={imageWidth}
                src={`file://${left.path}`}
              />
            )) ||
              left.path}
          </TableCell>
          <TableCell style={tableCellStyle}>
            {diff.exists && (
              <img
                style={{ cursor: 'pointer' }}
                onClick={() => open(diff.path)}
                width={imageWidth}
                src={`file://${diff.path}`}
              />
            )}
          </TableCell>
          <TableCell style={tableCellStyle}>
            {right.exists && (
              <img
                style={{ cursor: 'pointer' }}
                onClick={() => open(right.path)}
                width={imageWidth}
                src={`file://${right.path}`}
              />
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

const MatchChip = ({ breakpoint, threshold, match, active, onClick }) => {
  const classes = useStyles()

  const defaultProps = {
    size: 'small',
    color: 'primary',
    label: breakpoint,
    variant: active ? 'outlined' : 'default',
    clickable: true,
    onClick: onClick
  }

  const toolTip = match && `Breakpoint ${breakpoint} matches ${Math.floor(match.percentageSame * 1000) / 10}%`

  if (!match) {
    return (
      <Chip
        {...defaultProps}
        className={active ? classes.errorChipActive : classes.errorChip}
        icon={<ErrorOutlineIcon />}
      />
    )
  } else if (match.percentageSame >= threshold) {
    return (
      <Tooltip title={toolTip}>
        <Chip
          {...defaultProps}
          className={active ? classes.okChipActive : classes.okChip}
          icon={<CheckCircleOutlineIcon />}
        />
      </Tooltip>
    )
  } else {
    return (
      <Tooltip title={toolTip}>
        <Chip
          {...defaultProps}
          className={active ? classes.errorChipActive : classes.errorChip}
          icon={<ErrorOutlineIcon />}
        />
      </Tooltip>
    )
  }
}

const UrlPairTableRow = ({
  job,
  index,
  leftUrl,
  rightUrl,
  matches,
  threshold,
  error,
  zoom,
  zoomToFit,
  openIndex,
  setOpenIndex,
  hideSuccessful
}) => {
  const isOpen = index == openIndex
  const breakpoints = job.breakpoints
  const [activeBreakpoint, setActiveBreakpoint] = useState(() => breakpoints.length > 0 && 0)
  const classes = useStyles()

  const leftUrlUrl = leftUrl && leftUrl.url
  const rightUrlUrl = rightUrl && rightUrl.url

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ('l' == e.key) {
        if (activeBreakpoint < breakpoints.length - 1) {
          setActiveBreakpoint(activeBreakpoint + 1)
        }
      } else if ('h' == e.key) {
        if (activeBreakpoint > 0) {
          setActiveBreakpoint(activeBreakpoint - 1)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [breakpoints, activeBreakpoint])

  const setOpen = (value) => {
    if (value) {
      setOpenIndex(index)
    } else {
      setOpenIndex(-1)
    }
  }

  let matchSummary = 0
  if (job.matches && job.matches[index]) {
    let total = 0
    let count = 0
    for (let n of Object.values(job.matches[index])) {
      total += n.percentageSame
      count += 1
    }
    matchSummary = Math.round((total / count) * 10000) / 100
  }

  if (hideSuccessful && matchSummary / 100 >= threshold) {
    return null
  }

  return (
    <>
      <TableRow selected={isOpen} id={`urlPair-${index}`}>
        <TableCell width={20}>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell width={20} component="th" scope="row" onClick={() => setOpen(true)}>
          {index}
        </TableCell>
        <TableCell width={600} onClick={() => setOpen(true)}>
          <Typography>{leftUrlUrl}</Typography>
          <br />
          <Typography>{rightUrlUrl}</Typography>
        </TableCell>
        <TableCell onClick={() => setOpen(true)}>
          {matches &&
            Object.keys(matches).map((w, i) => (
              <MatchChip
                key={i}
                threshold={threshold}
                breakpoint={w}
                active={activeBreakpoint == i}
                match={matches[w]}
                onClick={() => {
                  setOpen(true)
                  setActiveBreakpoint(i)
                }}
              />
            ))}
          {!matches &&
            breakpoints.map((b, i) => (
              <MatchChip
                key={i}
                threshold={threshold}
                breakpoint={b.width}
                active={activeBreakpoint == i}
                onClick={() => {
                  setOpen(true)
                  setActiveBreakpoint(i)
                }}
              />
            ))}
          {error && (
            <div>
              <Typography>{error}</Typography>
            </div>
          )}
        </TableCell>
        <TableCell>
          <Typography>{matchSummary}%</Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <ScreenshotTable
              activeBreakpoint={breakpoints && breakpoints[activeBreakpoint] && breakpoints[activeBreakpoint].width}
              zoom={zoom}
              zoomToFit={zoomToFit}
              job={job}
              index={index}
              matches={matches}
              leftUrl={leftUrl}
              rightUrl={rightUrl}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

function generateUrlPairs(job) {
  const urlPairs = []
  for (let i = 0; i < job.leftUrls.length; i++) {
    let error
    if (!job.rightUrls || !job.rightUrls[i]) {
      error = `Right URL ${i} does not exist!`
    } else {
      if (job.leftUrls[i].index != job.rightUrls[i].index) {
        error = `Unexpected Error! Left URL Index [${job.leftUrls[i].index}] is not equal to Right URL Index [${job.rightUrls[i].index}]!`
      }
    }
    let urlPair = {
      left: job.leftUrls[i],
      right: job.rightUrls && job.rightUrls[i],
      index: job.leftUrls[i].index,
      error: error
    }
    urlPairs.push(urlPair)
  }
  return urlPairs
}

export default () => {
  const classes = useStyles()
  const { projectId, jobId } = useParams()

  const [job] = useState(() => getJob(projectId, jobId))
  const [openIndex, setOpenIndex] = useState(() => -1)
  const [urlPairs] = useState(() => generateUrlPairs(job))
  const [threshold, setThreshold] = useState(() => getJobMatchThreshold(projectId, jobId))
  const [zoom, setZoom] = useState(() => getJobZoom(projectId, jobId))
  const [zoomToFit, setZoomToFit] = useState(() => getJobZoomToFit(projectId, jobId))
  const [hideSuccessful, setHideSuccessful] = useState(() => false)
  const dataDir = path.join(getUserDataDir(), 'jobs', projectId, jobId)

  const handleOpenDirectory = () => {
    open(dataDir)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ('j' == e.key) {
        if (openIndex < urlPairs.length - 1) {
          setOpenIndex(openIndex + 1)
          const el = document.getElementById('urlPair-' + openIndex)
          el && el.scrollIntoView(true)
        }
      } else if ('k' == e.key) {
        if (openIndex > 0) {
          setOpenIndex(openIndex - 1)
          const el = document.getElementById('urlPair-' + openIndex)
          el && el.scrollIntoView(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openIndex, urlPairs])

  return (
    <>
      <Header>
        <BackLink projectId={projectId} />
        <BackLink2 projectId={projectId} />
        <a>
          <AssessmentOutlinedIcon />
          View
        </a>
      </Header>
      <main className={classes.main}>
        <div className={classes.reportDetails}>
          <Typography className={classes.reportName}>{job.name}</Typography>
          <Typography className={classes.reportDate}>
            {job.type} at {formatDate(job.startDate)}
          </Typography>
          <Typography className={classes.reportDate}>
            {(urlPairs && urlPairs.length) || 0} URL pair{urlPairs && urlPairs.length == 1 ? '' : 's'} compared in{' '}
            {formatDuration(job.duration)}
          </Typography>
          <Typography className={classes.reportDate}>{convertBytes(job.jobSize)}</Typography>
        </div>
        <div className={classes.thresholdSlider}>
          <Typography>{threshold}% Match Threshold</Typography>
          <Slider
            step={0.1}
            min={75}
            max={100}
            value={threshold}
            onChange={(_, val) => setThreshold(val)}
            onChangeCommitted={(_, val) => saveJobMatchThreshold(projectId, jobId, val)}
            valueLabelDisplay="auto"
          />
        </div>
        <FormControlLabel
          className={classes.zoomToFitSwitch}
          control={
            <Switch
              name="zoomToFit"
              checked={zoomToFit}
              onChange={(_, val) => {
                setZoomToFit(val)
                saveJobZoomToFit(projectId, jobId, val)
              }}
            />
          }
          label="Zoom to Fit?"
        />

        <FormControlLabel
          className={classes.hideSuccessSwitch}
          control={
            <Switch
              name="hideSuccess"
              checked={hideSuccessful}
              onChange={(_, val) => {
                setHideSuccessful(val)
              }}
            />
          }
          label="Hide Successful Matches?"
        />
        <div className={classes.zoomSlider}>
          <Typography>Zoom</Typography>
          <Slider
            disabled={zoomToFit}
            step={1}
            min={0}
            max={200}
            value={zoom}
            onChange={(_, val) => setZoom(val)}
            onChangeCommitted={(_, val) => saveJobZoom(projectId, jobId, val)}
            valueLabelDisplay="auto"
          />
        </div>
        <TableContainer className={classes.jobTable} component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell component="th"></TableCell>
                <TableCell component="th">#</TableCell>
                <TableCell component="th">URLs</TableCell>
                <TableCell component="th">Breakpoint Status</TableCell>
                <TableCell component="th">Overall Match %</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {urlPairs.map((urlPair, i) => (
                <UrlPairTableRow
                  key={i}
                  job={job}
                  hideSuccessful={hideSuccessful}
                  error={urlPair.error}
                  index={urlPair.index}
                  leftUrl={urlPair.left}
                  rightUrl={urlPair.right}
                  matches={job.matches[urlPair.index]}
                  threshold={threshold / 100}
                  zoom={zoom / 100}
                  zoomToFit={zoomToFit}
                  openIndex={openIndex}
                  setOpenIndex={setOpenIndex}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </main>
      <Footer>
        <Button disableElevation color="default" variant="contained" onClick={handleOpenDirectory}>
          Browse Directory
        </Button>
      </Footer>
    </>
  )
}
