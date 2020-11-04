import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  FormControl,
  FormHelperText,
  InputLabel,
  makeStyles,
  MenuItem,
  Popover,
  Select,
  Typography
} from '@material-ui/core'
import AssignmentIcon from '@material-ui/icons/Assignment'
import HelpIcon from '@material-ui/icons/Help'
import SwapVertIcon from '@material-ui/icons/SwapVert'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { Link, useHistory, useParams } from 'react-router-dom'
import { getJob, getJobIds } from '../../common/ComparisonResultStore'
import { getEnvironments, getEnvironmentSiteUrl, getProject, getSites } from '../../common/ConfigurationStore'
import { formatDate } from '../../common/FormatingUtils'
import Footer from './Footer'
import Header from './Header'

const useStyles = makeStyles({
  main: {
    display: 'grid',
    gridTemplateColumns: '1fr min-content min-content min-content 1fr',
    gridTemplateRows: 'min-content min-content'
  },
  card: {
    display: 'grid',
    gridTemplateRows: 'min-content 1fr min-content',
    margin: '2em',
    minWidth: '250px'
  },
  cardHeader: {
    gridRow: 1
  },
  cardContent: {
    gridRow: 2
  },
  cardActions: {
    gridRow: 3,
    justifyContent: 'center' // or flex-end
  },
  first: {
    gridColumn: '2',
    gridRow: '1'
  },
  second: {
    gridColumn: '3',
    gridRow: '1'
  },
  third: {
    gridColumn: '4',
    gridRow: '1'
  },
  fourth: {
    gridColumn: '2',
    gridRow: '2'
  },
  fifth: {
    gridColumn: '3',
    gridRow: '2'
  },
  titleWithToolTip: {
    display: 'grid',
    gridTemplateColumns: '1fr 35px'
  },
  disabledText: {
    color: '#999'
  },
  helpIcon: {
    marginLeft: '20px',
    cursor: 'pointer'
  },
  toolTip: {
    padding: '.5em',
    backgroundColor: '#FFFFDD',
    width: '400px'
  },
  picker: {
    marginTop: '1em'
  },
  swapIcon: {
    cursor: 'pointer'
  },
  swapIconWrapper: {
    position: 'relative',
    textAlign: 'right',
    top: '-1em',
    height: 0
  }
})

const Picker = ({ name, disabled, helperText, values, value, setValue, idFn, labelFn }) => {
  const classes = useStyles()

  return (
    <FormControl variant="outlined" className={classes.picker} fullWidth>
      <InputLabel>{name}</InputLabel>
      <Select disabled={disabled} value={value || ''} onChange={(e) => setValue(e.target.value)} label={name}>
        {values &&
          values.map((s, i) => (
            <MenuItem key={i} value={idFn(s)}>
              <Typography>{labelFn(s)}</Typography>
            </MenuItem>
          ))}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}

const SitePicker = ({ disabled, sites, siteId, setSiteId }) => {
  const classes = useStyles()

  return (
    <Picker
      disabled={disabled}
      name="Site"
      values={sites}
      value={siteId}
      setValue={setSiteId}
      idFn={(s) => s.siteId}
      labelFn={(s) => s.name}
    />
  )
}

const EnvironmentPicker = ({ disabled, environments, environmentId, setEnvironmentId, selectedSite }) => {
  const classes = useStyles()

  const selectedEnvironmentId = environments.find((e) => e.environmentId == environmentId) ? environmentId : ''

  const helperText =
    selectedSite && environmentId
      ? getEnvironmentSiteUrl(selectedSite.projectId, environmentId, selectedSite.siteId)
      : ''

  return (
    <Picker
      disabled={disabled}
      name="Environment"
      value={selectedEnvironmentId}
      values={environments}
      setValue={setEnvironmentId}
      idFn={(e) => e.environmentId}
      labelFn={(e) => e.name}
      helperText={helperText || 'No URL for selected site'}
    />
  )
}

const JobPicker = ({ name, disabled, jobs, jobId, setJobId }) => {
  const classes = useStyles()

  const selectedJobId = jobs.find((j) => j.jobId == jobId) ? jobId : ''

  const helperText = selectedJobId && formatDate(jobs.find((j) => j.jobId == selectedJobId).startDate)

  return (
    <Picker
      disabled={disabled}
      name={name}
      value={selectedJobId}
      values={jobs}
      setValue={setJobId}
      idFn={(e) => e.jobId}
      labelFn={(e) => e.name}
      helperText={helperText}
    />
  )
}

const TitleWithHelpToolTip = ({ title, toolTip, disabled }) => {
  const classes = useStyles()

  const [anchor, setAnchor] = useState(() => null)

  const open = Boolean(anchor)

  return (
    <>
      <Typography className={clsx({ [classes.titleWithToolTip]: true, [classes.disabledText]: disabled })}>
        <span>{title}</span>
        <HelpIcon className={classes.helpIcon} onClick={(e) => setAnchor(e.currentTarget)} fontSize="small" />
      </Typography>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={(e) => setAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Typography className={classes.toolTip}>{toolTip}</Typography>
      </Popover>
    </>
  )
}

const BeforeAndAfterCard = ({ project, className, sites, environments }) => {
  const availableSites = sites.filter((s) => environmentsWithSiteUrl(environments, s).length > 0)
  const classes = useStyles()
  const history = useHistory()
  const [siteId, setSiteId] = useState(() => sites && sites.length > 0 && sites[0].siteId)

  const site = siteId && sites.find((s) => s.siteId == siteId)

  const availableEnvironments = site
    ? environments.filter((e) => getEnvironmentSiteUrl(project.projectId, e.environmentId, site.siteId))
    : environments

  const [environmentId, setEnvironmentId] = useState(
    availableEnvironments && availableEnvironments.length > 0 && availableEnvironments[0].environmentId
  )
  if (environmentId && !availableEnvironments.find((e) => e.environmentId == environmentId)) {
    setEnvironmentId(null)
  }

  const disabled = availableSites.length < 1 || environments.length < 1
  const valid = environmentId && siteId

  return (
    <Card className={clsx(classes.card, className)}>
      <CardHeader
        className={classes.cardHeader}
        title={
          <TitleWithHelpToolTip
            title="Before and After"
            toolTip="Before and After. Select an environment and site and provide one list of paths. The tool will capture screenshots and then pause. Deploy a new build of the site or make other changes, then come back to the tool and resume. The tool will capture screenshots again and compare the before and after screenshots."
          />
        }
      />
      <CardContent className={classes.cardContent}>
        <Typography></Typography>
        <SitePicker disabled={disabled} siteId={siteId} setSiteId={setSiteId} sites={availableSites} />
        <EnvironmentPicker
          disabled={disabled}
          selectedSite={site}
          environmentId={environmentId}
          setEnvironmentId={setEnvironmentId}
          environments={availableEnvironments}
        />
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Button
          disableElevation
          disabled={disabled || !valid}
          size="small"
          variant="contained"
          color="primary"
          onClick={() => history.push(`/before-and-after-comparison/${project.projectId}/${siteId}/${environmentId}`)}
        >
          Next
        </Button>
      </CardActions>
    </Card>
  )
}

function environmentsWithSiteUrl(environments, site) {
  return environments.filter((e) => getEnvironmentSiteUrl(site.projectId, e.environmentId, site.siteId))
}

const EnvironmentToEnvironmentCard = ({ project, className, sites, environments }) => {
  const availableSites = sites.filter((s) => environmentsWithSiteUrl(environments, s).length > 1)
  const classes = useStyles()
  const history = useHistory()
  const [siteId, setSiteId] = useState(() => availableSites && availableSites.length > 0 && availableSites[0].siteId)

  const [leftEnvironmentId, setLeftEnvironmentId] = useState(
    environments && environments.length > 0 && environments[0].environmentId
  )
  const [rightEnvironmentId, setRightEnvironmentId] = useState(
    environments && environments.length > 1 && environments[1].environmentId
  )
  const site = siteId && sites.find((s) => s.siteId == siteId)

  const availableLeftEnvironments = site
    ? environments.filter(
        (e) =>
          e.environmentId != rightEnvironmentId &&
          getEnvironmentSiteUrl(project.projectId, e.environmentId, site.siteId)
      )
    : environments
  const availableRightEnvironments = site
    ? environments.filter(
        (e) =>
          e.environmentId != leftEnvironmentId && getEnvironmentSiteUrl(project.projectId, e.environmentId, site.siteId)
      )
    : environments

  if (leftEnvironmentId && !availableLeftEnvironments.find((e) => e.environmentId == leftEnvironmentId)) {
    setLeftEnvironmentId(null)
  }

  if (rightEnvironmentId && !availableRightEnvironments.find((e) => e.environmentId == rightEnvironmentId)) {
    setRightEnvironmentId(null)
  }

  const disabled = availableSites.length < 1 || environments.length < 2

  const valid = siteId && leftEnvironmentId && rightEnvironmentId

  const swapEnvironments = () => {
    const tmp = leftEnvironmentId
    setLeftEnvironmentId(rightEnvironmentId)
    setRightEnvironmentId(tmp)
  }

  return (
    <Card className={clsx(classes.card, className)}>
      <CardHeader
        className={classes.cardHeader}
        title={
          <TitleWithHelpToolTip
            disabled={disabled}
            title="Environment to Environment"
            toolTip="Environment to Environment. Select a site and two environments and provide one list of paths. The tool will capture screenshots for each path on both environments and compare. At least two environments are required to run this check."
          />
        }
      />
      <CardContent className={classes.cardContent}>
        <Typography></Typography>
        <SitePicker disabled={disabled} siteId={siteId} setSiteId={setSiteId} sites={availableSites} />
        <EnvironmentPicker
          disabled={disabled}
          selectedSite={site}
          environmentId={leftEnvironmentId}
          setEnvironmentId={setLeftEnvironmentId}
          environments={availableLeftEnvironments}
        />
        <div className={classes.swapIconWrapper}>
          <SwapVertIcon className={classes.swapIcon} onClick={swapEnvironments} />
        </div>
        <EnvironmentPicker
          disabled={disabled}
          selectedSite={site}
          environmentId={rightEnvironmentId}
          setEnvironmentId={setRightEnvironmentId}
          environments={availableRightEnvironments}
        />
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Button
          disableElevation
          disabled={disabled || !valid}
          size="small"
          variant="contained"
          color="primary"
          onClick={() =>
            history.push(
              `/environment-to-environment-comparison/${project.projectId}/${siteId}/${leftEnvironmentId}/${rightEnvironmentId}`
            )
          }
        >
          Next
        </Button>
      </CardActions>
    </Card>
  )
}

const VerifyCard = ({ project, className, sites, environments }) => {
  const availableEnvironments = environments.filter((e) => e.verifyUrl)
  const availableSites = sites.filter((s) => environmentsWithSiteUrl(availableEnvironments, s).length > 0)
  const classes = useStyles()
  const history = useHistory()
  const [siteId, setSiteId] = useState(() => availableSites && availableSites.length > 0 && availableSites[0].siteId)
  const [environmentId, setEnvironmentId] = useState(
    (availableEnvironments && availableEnvironments.length > 0 && availableEnvironments[0].environmentId) || ''
  )
  const site = siteId && sites.find((s) => s.siteId == siteId)

  const disabled = availableEnvironments.length < 1 || availableEnvironments.length < 1
  const valid = siteId && environmentId

  return (
    <Card className={clsx(classes.card, className)}>
      <CardHeader
        className={classes.cardHeader}
        title={
          <TitleWithHelpToolTip
            disabled={disabled}
            title="Blue/Green Verify"
            toolTip="Blue/Green Verify. Select a site and production environment with a verify URL. Provide one list of paths. During a blue/green deployment when both production instances are running, the tool will capture screenshots for each path on the primary URL and the verify URL and compare."
          />
        }
      />
      <CardContent className={classes.cardContent}>
        <Typography></Typography>
        <SitePicker disabled={disabled} siteId={siteId} setSiteId={setSiteId} sites={availableSites} />
        <EnvironmentPicker
          disabled={disabled}
          selectedSite={site}
          environmentId={environmentId}
          setEnvironmentId={setEnvironmentId}
          environments={availableEnvironments}
        />
        <Box>
          <Typography></Typography>
        </Box>
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Button
          disableElevation
          disabled={disabled || !valid}
          size="small"
          variant="contained"
          color="primary"
          onClick={() => history.push(`/verify-comparison/${project.projectId}/${siteId}/${environmentId}`)}
        >
          Next
        </Button>
      </CardActions>
    </Card>
  )
}

function findBaselineCaptureJobsForSite(projectId, siteId) {
  const jobIds = getJobIds(projectId)
  const jobs = []
  for (let jobId of jobIds) {
    const job = getJob(projectId, jobId)
    if (job.baselineCapture && job.siteId == siteId) {
      jobs.push(job)
    }
  }

  jobs.sort((l, r) => (l.startDate < r.startDate ? 1 : -1))

  return jobs
}

const BaselineCaptureCard = ({ project, className, sites, environments }) => {
  const availableSites = sites.filter((s) => environmentsWithSiteUrl(environments, s).length > 0)
  const classes = useStyles()
  const history = useHistory()
  const [siteId, setSiteId] = useState(() => sites && sites.length > 0 && sites[0].siteId)

  const site = siteId && sites.find((s) => s.siteId == siteId)

  const availableEnvironments = site
    ? environments.filter((e) => getEnvironmentSiteUrl(project.projectId, e.environmentId, site.siteId))
    : environments

  const [environmentId, setEnvironmentId] = useState(
    availableEnvironments && availableEnvironments.length > 0 && availableEnvironments[0].environmentId
  )
  if (environmentId && !availableEnvironments.find((e) => e.environmentId == environmentId)) {
    setEnvironmentId(null)
  }

  const disabled = availableSites.length < 1 || environments.length < 1
  const valid = environmentId && siteId

  return (
    <Card className={clsx(classes.card, className)}>
      <CardHeader
        className={classes.cardHeader}
        title={
          <TitleWithHelpToolTip
            title="Baseline Capture"
            toolTip="Baseline Capture. Select an environment and site and provide one list of paths. The tool will capture screenshots and then finish. Deploy a new build of the site or make other changes, then come back to the tool and capture again to compare with the results as many times as you need."
          />
        }
      />
      <CardContent className={classes.cardContent}>
        <Typography></Typography>
        <SitePicker disabled={disabled} siteId={siteId} setSiteId={setSiteId} sites={availableSites} />
        <EnvironmentPicker
          disabled={disabled}
          selectedSite={site}
          environmentId={environmentId}
          setEnvironmentId={setEnvironmentId}
          environments={availableEnvironments}
        />
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Button
          disableElevation
          disabled={disabled || !valid}
          size="small"
          variant="contained"
          color="primary"
          onClick={() => history.push(`/baseline-capture/${project.projectId}/${siteId}/${environmentId}`)}
        >
          Next
        </Button>
      </CardActions>
    </Card>
  )
}

const BaselineCompareCard = ({ project, className, sites, environments }) => {
  const availableSites = sites.filter((s) => environmentsWithSiteUrl(environments, s).length > 0)
  const classes = useStyles()
  const history = useHistory()
  const [siteId, setSiteId] = useState(() => sites && sites.length > 0 && sites[0].siteId)
  const [jobs, setJobs] = useState(() => [])
  const [jobId, setJobId] = useState(() => null)

  const site = siteId && sites.find((s) => s.siteId == siteId)

  const availableEnvironments = site
    ? environments.filter((e) => getEnvironmentSiteUrl(project.projectId, e.environmentId, site.siteId))
    : environments

  const [environmentId, setEnvironmentId] = useState(
    availableEnvironments && availableEnvironments.length > 0 && availableEnvironments[0].environmentId
  )
  if (environmentId && !availableEnvironments.find((e) => e.environmentId == environmentId)) {
    setEnvironmentId(null)
  }

  useEffect(() => {
    console.log('Selected a site: ', siteId)
    const jobs = findBaselineCaptureJobsForSite(project.projectId, siteId)
    setJobs(jobs)
    if (jobs.length > 0) {
      setJobId(jobs[0].jobId)
    } else {
      setJobId(null)
    }
  }, [siteId, setSiteId])

  const disabled = availableSites.length < 1 || environments.length < 1 || jobs.length < 1
  const valid = environmentId && siteId && jobId

  return (
    <Card className={clsx(classes.card, className)}>
      <CardHeader
        className={classes.cardHeader}
        title={
          <TitleWithHelpToolTip
            title="Baseline Comparison"
            toolTip="Baseline Comparison. Select an environment, site, and previous baseline capture. The tool will capture screenshots and compare them to the baseline."
          />
        }
      />
      <CardContent className={classes.cardContent}>
        <Typography></Typography>
        <SitePicker disabled={disabled} siteId={siteId} setSiteId={setSiteId} sites={availableSites} />
        <EnvironmentPicker
          disabled={disabled}
          selectedSite={site}
          environmentId={environmentId}
          setEnvironmentId={setEnvironmentId}
          environments={availableEnvironments}
        />
        <JobPicker name="Baseline" disabled={disabled} jobId={jobId} setJobId={setJobId} jobs={jobs} />
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Button
          disableElevation
          disabled={disabled || !valid}
          size="small"
          variant="contained"
          color="primary"
          onClick={() => history.push(`/baseline-comparison/${project.projectId}/${jobId}/${siteId}/${environmentId}`)}
        >
          Next
        </Button>
      </CardActions>
    </Card>
  )
}

export default () => {
  const { projectId } = useParams()
  const classes = useStyles()

  const [project] = useState(() => getProject(projectId))
  const [environments] = useState(() => getEnvironments(projectId))
  const [sites] = useState(() => getSites(projectId))

  return (
    <>
      <Header>
        <a>
          <AssignmentIcon /> {project.name}
        </a>
      </Header>
      <main className={classes.main}>
        <BeforeAndAfterCard project={project} className={classes.first} sites={sites} environments={environments} />

        <EnvironmentToEnvironmentCard
          project={project}
          className={classes.second}
          sites={sites}
          environments={environments}
        />

        <VerifyCard project={project} className={classes.third} sites={sites} environments={environments} />

        <BaselineCaptureCard project={project} className={classes.fourth} sites={sites} environments={environments} />

        <BaselineCompareCard project={project} className={classes.fifth} sites={sites} environments={environments} />
      </main>
      <Footer>
        <Link to={`/comparison-jobs/${projectId}`}>
          <Button disableElevation variant="contained">
            View Past Checks
          </Button>
        </Link>
        <Link to={`/edit-project/${projectId}`}>
          <Button disableElevation variant="contained" color="primary">
            Edit Project
          </Button>
        </Link>
      </Footer>
    </>
  )
}
