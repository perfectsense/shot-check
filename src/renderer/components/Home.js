import { Button, Card, CardActions, CardHeader, makeStyles } from '@material-ui/core'
import React from 'react'
import { Link, useHistory } from 'react-router-dom'
import { getProjects } from '../../common/ConfigurationStore'
import Footer from './Footer'
import Header from './Header'

const useStyles = makeStyles({
  main: {
    gridTemplateColumns: '75px 1fr 75px',
    gridTemplateRows: '2em 0px 1fr 100px'
  },
  /*
  intro: {
    gridColumn: '2 / 3',
    gridRow: '2'
  },
  */
  projects: {
    gridColumn: '2 / 3',
    gridRow: '3',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start'
  },
  projectCard: {
    height: '200px',
    width: '200px',
    margin: '8px',
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
    <Card onClick={handleClick} className={classes.projectCard}>
      <CardHeader className={classes.cardHeader} subheader="Project" title={project.name} />
      <CardActions disableSpacing></CardActions>
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
          <Button variant="contained" color="default">
            Manual Check
          </Button>
        </Link>
        <Link to="/wizard-project">
          <Button variant="contained" color="primary">
            New Project
          </Button>
        </Link>
      </Footer>
    </>
  )
}
