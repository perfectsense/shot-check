import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItemText
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  deleteEnvironment,
  deleteSite,
  getEnvironments,
  getEnvironmentSiteUrl,
  getSites
} from '../../common/ConfigurationStore'

const useStyles = makeStyles({
  card: {
    marginBottom: '1em'
  },
  cardHeader: {
    paddingBottom: '0'
  },
  cardContent: {
    marginTop: '0',
    paddingTop: '0',
    paddingBottom: '0'
  }
})

const SiteCard = ({ projectId, site, setSites }) => {
  const classes = useStyles()
  const history = useHistory()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const handleDelete = () => {
    setConfirmDeleteOpen(true)
  }

  const handlePermanentlyDelete = () => {
    deleteSite(projectId, site.siteId)
    setSites(getSites(projectId))
    setConfirmDeleteOpen(false)
  }

  return (
    <Card className={classes.card}>
      <CardHeader className={classes.cardHeader} subheader="Site" title={site.name} />
      <CardActions disableSpacing>
        <Button disableElevation onClick={() => history.push(`/edit-site/${projectId}/${site.siteId}`)}>
          Edit
        </Button>
        <Button disableElevation onClick={handleDelete}>
          Delete
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
      </CardActions>
    </Card>
  )
}

const EnvironmentCard = ({ projectId, environment, setEnvironments, sites }) => {
  const classes = useStyles()
  const history = useHistory()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const handleDelete = () => {
    setConfirmDeleteOpen(true)
  }

  const handlePermanentlyDelete = () => {
    deleteEnvironment(projectId, environment.environmentId)
    setEnvironments(getEnvironments(projectId))
    setConfirmDeleteOpen(false)
  }

  return (
    <Card className={classes.card}>
      <CardHeader className={classes.cardHeader} subheader="Environment" title={environment.name} />
      <CardContent className={classes.cardContent}>
        <List>
          {sites.map((site, i) => {
            let url = getEnvironmentSiteUrl(projectId, environment.environmentId, site.siteId)
            const secondaryTypographyProps = {}
            if (!url) {
              secondaryTypographyProps.color = 'secondary'
              url = 'N/A'
            }
            return (
              <ListItemText
                key={i}
                primary={site.name}
                secondary={url}
                secondaryTypographyProps={secondaryTypographyProps}
              />
            )
          })}
        </List>
      </CardContent>
      <CardActions>
        <Button
          disableElevation
          onClick={() => history.push(`/edit-environment/${projectId}/${environment.environmentId}`)}
        >
          Edit
        </Button>
        <Button disableElevation onClick={handleDelete}>
          Delete
        </Button>
        <Dialog open={confirmDeleteOpen}>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogContent>
            <DialogContentText>The {environment.name} environment will be permanently deleted!</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button disableElevation onClick={handlePermanentlyDelete}>
              Permanently Delete
            </Button>
            <Button disableElevation onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </CardActions>
    </Card>
  )
}

export default ({ projectId }) => {
  const [sites, setSites] = useState(getSites(projectId))
  const [environments, setEnvironments] = useState(getEnvironments(projectId))

  return (
    <div className="SitesAndEnvironments">
      <div className="Sites">
        {sites.map((site, i) => (
          <SiteCard setSites={setSites} site={site} key={i} projectId={projectId} />
        ))}
      </div>
      <div className="Environments">
        {environments.map((environment, i) => (
          <EnvironmentCard
            sites={sites}
            setEnvironments={setEnvironments}
            environment={environment}
            key={i}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  )
}
