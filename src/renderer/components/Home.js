import { Button, ButtonGroup, Card, CardActions, CardContent, CardHeader, List, ListItemText, makeStyles } from '@material-ui/core'
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
    width: '200px',
    margin: '8px',
  },
  cardHeader: {
    cursor: 'pointer'
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
      <CardContent>
        <List>
          <ListItemText
            primary="Checks"
            secondary={project.numJobs || '-'}
            secondary={<Link to={`/comparison-jobs/${project.projectId}`}>{project.numJobs || '-'}</Link>}
          />
          <ListItemText
            primary="Last Check"
            secondary={<Link to={`/comparison-job/${project.projectId}/${project.lastJobId}`}>{formatDate(project.lastJobDate)}</Link>}
          />
          <ListItemText
            primary="Total Size"
            secondary={convertBytes(project.totalSize)}
          />
        </List>
      </CardContent>
      <CardActions alignContent="middle">
        <ButtonGroup disableElevation size="small" color="primary" aria-label="outlined primary button group">
          <Button variant="contained" color="default" onClick={() => history.push(`/comparison-jobs/${project.projectId}`)}>
            Review
          </Button>
          <Button variant="contained" color="default" onClick={() => history.push(`/edit-project/${project.projectId}`)}>
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
