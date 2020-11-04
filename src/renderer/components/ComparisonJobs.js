import {
  Button,
  ButtonGroup,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@material-ui/core'
import AssignmentIcon from '@material-ui/icons/Assignment'
import PageviewOutlinedIcon from '@material-ui/icons/PageviewOutlined'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import FolderOpenOutlinedIcon from '@material-ui/icons/FolderOpenOutlined'
import { useSnackbar } from 'notistack'
import open from 'open'
import * as path from 'path'
import React, { useEffect, useState } from 'react'
import { Link, useHistory, useParams } from 'react-router-dom'
import { getUserDataDir } from '../../common/appConfig'
import { getJobs } from '../../common/ComparisonResultStore'
import { getProject, updateProjectStats } from '../../common/ConfigurationStore'
import { convertBytes } from '../../common/FileSizeUtils'
import { formatDate, formatDuration } from '../../common/FormatingUtils'
import deleteComparisonJob from '../ipc/deleteComparisonJob'
import Footer from './Footer'
import Header from './Header'

const useStyles = makeStyles({
  main: {
    display: 'grid',
    gridTemplateColumns: '75px repeat(5, 1fr) 75px',
    gridTemplateRows: '2em min-content min-content 5em'
  },
  jobTable: {
    gridRow: '2',
    gridColumn: '2 / 7'
  },
  pathNote: {
    gridRow: '3',
    gridColumn: '2 / 7',
    fontSize: '.9em',
    marginTop: '5px'
  }
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
        <AssignmentIcon />
        {project.name}
      </Link>
    )
  }
}

const JobTableRow = ({ job, setJobs, toDelete, setToDelete }) => {
  const handleCheck = (e) => {
    if (e.target.checked) {
      setToDelete([...toDelete, job.jobId])
    } else {
      setToDelete(toDelete.filter((jobId) => jobId != job.jobId))
    }
  }

  const matchSummary = Math.round(job.matchSummary * 10000) / 100

  return (
    <TableRow>
      <TableCell component="th" scope="row">
        {job.name}
      </TableCell>
      <TableCell>{job.type}</TableCell>
      <TableCell>{job.startDate ? formatDate(job.startDate) : '-'}</TableCell>
      <TableCell>{job.jobSize ? convertBytes(job.jobSize) : '-'}</TableCell>
      <TableCell>{job.leftUrls ? job.leftUrls.length : '-'}</TableCell>
      <TableCell>{job.duration ? formatDuration(job.duration) : '-'}</TableCell>
      <TableCell>
        {matchSummary ? Math.min(Math.round((matchSummary / job.matchThreshold) * 100), 100) + '%' : '-'}
      </TableCell>
      <TableCell width="1" align="right">
        <JobActionButtons job={job} setJobs={setJobs} />
      </TableCell>
      <TableCell width="1">
        <Checkbox onChange={handleCheck} checked={toDelete.includes(job.jobId)} />
      </TableCell>
    </TableRow>
  )
}

const JobActionButtons = ({ job, setJobs }) => {
  const history = useHistory()
  const projectId = job.projectId || '_'
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const dataDir = path.join(getUserDataDir(), 'jobs', projectId, job.jobId)

  const handleDelete = () => {
    setConfirmDeleteOpen(true)
  }

  const handlePermanentlyDelete = () => {
    setConfirmDeleteOpen(false)
    deleteComparisonJob(enqueueSnackbar, projectId, job.jobId).then(async () => {
      const jobs = await getJobs(job.projectId)
      setJobs(jobs)
      updateProjectStats(job.projectId)
    })
  }

  const handleOpenDirectory = () => {
    open(dataDir)
  }

  const copyJob = () => {
    if (projectId == '_') {
      history.push(`/manual-comparison/${job.jobId}`)
    } else {
      history.push(`/${job.typeCode}-comparison-copy/${projectId}/${job.jobId}`)
    }
  }

  const showView = job.completionStatus == 'complete'
  const showContinue = job.completionStatus == 'leftSideComplete'
  const showCompare = job.completionStatus == 'baselineCaptured'

  return (
    <ButtonGroup disableElevation size="small" color="primary" aria-label="outlined primary button group">
      {showView && <Button onClick={() => history.push(`/comparison-job/${projectId}/${job.jobId}`)}>View</Button>}
      {showContinue && (
        <Button onClick={() => history.push(`/continue-before-and-after-comparison/${projectId}/${job.jobId}`)}>
          Continue
        </Button>
      )}

      {showCompare && (
        <Button onClick={() => history.push(`/baseline-comparison/${projectId}/${job.jobId}`)}>Compare</Button>
      )}

      {!showContinue && !showCompare && <Button onClick={copyJob}>Copy</Button>}
      <Button onClick={handleDelete} color="secondary">
        Delete
      </Button>
      <Dialog open={confirmDeleteOpen}>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogActions>
          <Button color="secondary" onClick={handlePermanentlyDelete}>
            Permanently Delete
          </Button>
          <Button color="default" onClick={() => setConfirmDeleteOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Button onClick={handleOpenDirectory} textSecondary="Open">
        <FolderOpenOutlinedIcon />
      </Button>
    </ButtonGroup>
  )
}

export default () => {
  const classes = useStyles()
  const { projectId } = useParams()

  const [jobs, setJobs] = useState(null)
  const [toDelete, setToDelete] = useState(() => [])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const dataDir = path.join(getUserDataDir(), 'jobs', projectId)

  useEffect(() => {
    // TODO: lazy load these for performance
    setTimeout(async () => getJobs(projectId).then((jobs) => setJobs(jobs)), 1)
  }, [projectId])

  const handleOpenDirectory = () => {
    open(dataDir)
  }

  const handleDeleteChecked = () => {
    setConfirmDeleteOpen(true)
  }

  const handlePermanentlyDelete = async () => {
    setConfirmDeleteOpen(false)
    for (let jobId of toDelete) {
      await deleteComparisonJob(enqueueSnackbar, projectId, jobId)
    }
    updateProjectStats(projectId)

    const jobs = await getJobs(projectId)
    setJobs(jobs)
    setToDelete([])
  }

  const checkAllChecked = () => {
    return jobs.every((job) => toDelete.includes(job.jobId))
  }

  const handleCheckAll = (e) => {
    if (e.target.checked) {
      setToDelete(jobs.map((j) => j.jobId))
    } else {
      setToDelete([])
    }
  }

  return (
    <>
      <Header>
        <BackLink projectId={projectId} />
        <a>
          <PageviewOutlinedIcon />
          Browse
        </a>
      </Header>
      <main className={classes.main}>
        {(jobs && (
          <TableContainer className={classes.jobTable} component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell># URLs</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>% OK</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={toDelete.length > 0}
                      onChange={handleCheckAll}
                      indeterminate={toDelete.length > 0 && !checkAllChecked()}
                    />
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {jobs.map((job, i) => (
                  <JobTableRow key={i} job={job} setJobs={setJobs} toDelete={toDelete} setToDelete={setToDelete} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )) || <CircularProgress style={{ position: 'absolute', left: '50%', top: '50%' }} />}
      </main>
      <Footer>
        <Button disableElevation color="default" variant="contained" onClick={handleOpenDirectory}>
          Browse Directory
        </Button>
        <Button
          disableElevation
          disabled={toDelete.length == 0}
          color="secondary"
          variant="contained"
          onClick={handleDeleteChecked}
        >
          Delete Checked
        </Button>
        <Dialog open={confirmDeleteOpen}>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogActions>
            <Button disableElevation color="secondary" onClick={handlePermanentlyDelete}>
              Permanently Delete
            </Button>
            <Button disableElevation color="default" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Footer>
    </>
  )
}
