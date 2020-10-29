import {
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  List,
  ListItemText,
  makeStyles
} from '@material-ui/core'
import React from 'react'
import { Link, useHistory } from 'react-router-dom'
import { getProjects } from '../../common/ConfigurationStore'
import { convertBytes } from '../../common/FileSizeUtils'
import { formatDate } from '../../common/FormatingUtils'
import Footer from './Footer'
import Header from './Header'

const useStyles = makeStyles({
  main: {
    gridTemplateColumns: '75px 1fr 75px',
    gridTemplateRows: '2em 0px 1fr 100px'
  },
  projects: {
    gridColumn: '2 / 3',
    gridRow: '3',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start'
  },
  projectCard: {
    width: '270px',
    margin: '8px',
    display: 'grid',
    gridTemplateColumns: 'auto',
    gridTemplateRows: 'min-content 1fr 60px'
  },
  cardHeader: {
    cursor: 'pointer',
    gridRow: '1',
    gridColumn: '1'
  },
  cardContent: {
    gridRow: '2',
    gridColumn: '1'
  },
  cardActions: {
    gridRow: '3',
    gridColumn: '1',
    justifyContent: 'center'
  }
})

const ProjectCard = ({ project }) => {
  const classes = useStyles()
  const history = useHistory()
  const handleClick = (event) => {
    history.push(`/project/${project.projectId}`)
  }

  return (
    <Card className={classes.projectCard}>
      <CardHeader className={classes.cardHeader} subheader="Project" title={project.name} onClick={handleClick} />
      <CardContent className={classes.cardContent}>
        <List>
          <ListItemText
            primary="Checks"
            secondary={
              project.numJobs ? <Link to={`/comparison-jobs/${project.projectId}`}>{project.numJobs || '-'}</Link> : '-'
            }
          />
          <ListItemText
            primary="Last Check"
            secondary={
              project.lastJobId ? (
                <Link to={`/comparison-job/${project.projectId}/${project.lastJobId}`}>
                  {formatDate(project.lastJobDate)}
                </Link>
              ) : (
                '-'
              )
            }
          />
          <ListItemText primary="Total Size" secondary={convertBytes(project.totalSize)} />
        </List>
      </CardContent>
      <CardActions className={classes.cardActions}>
        <ButtonGroup disableElevation size="small" color="primary" aria-label="outlined primary button group">
          <Button
            variant="contained"
            color="default"
            onClick={() => history.push(`/comparison-jobs/${project.projectId}`)}
          >
            Review
          </Button>
          <Button
            variant="contained"
            color="default"
            onClick={() => history.push(`/edit-project/${project.projectId}`)}
          >
            Edit
          </Button>
          <Button variant="contained" color="primary" onClick={() => history.push(`/project/${project.projectId}`)}>
            Check
          </Button>
        </ButtonGroup>
      </CardActions>
    </Card>
  )
}

export default () => {
  const classes = useStyles()
  const projects = getProjects()

  projects.sort((l, r) => ((l.lastJobDate || 0) < (r.lastJobDate || 0) ? 1 : -1))

  return (
    <>
      <Header />
      <main className={classes.main}>
        {/* <div className={classes.intro}> </div> */}
        <div className={classes.projects}>
          {projects && projects.map((p, i) => <ProjectCard key={i} project={p} />)}
        </div>
      </main>
      <Footer>
        <Link to="/manual-comparison">
          <Button disableElevation variant="contained" color="default">
            Manual Check
          </Button>
        </Link>
        <Link to="/wizard-project">
          <Button disableElevation variant="contained" color="primary">
            New Project
          </Button>
        </Link>
      </Footer>
    </>
  )
}
