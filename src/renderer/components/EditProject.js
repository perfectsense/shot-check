import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  FormControlLabel,
  makeStyles,
  Switch,
  TextField
} from '@material-ui/core'
import AddBoxIcon from '@material-ui/icons/AddBox'
import EditIcon from '@material-ui/icons/Edit'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { Link, Redirect, useHistory, useParams } from 'react-router-dom'
import {
  saveProject,
  deleteProject,
  getProject,
  getProjectAuth,
  saveProjectAuth,
  migrateProjectConfigToExternal,
  migrateProjectConfigToInternal
} from '../../common/ConfigurationStore'
import generateUUID from '../../common/generateUUID'
import Footer from './Footer'
import Header from './Header'
import ListSitesAndEnvironments from './ListSitesAndEnvironments'
import WizardSteps from './WizardSteps'

const useStyles = makeStyles({
  authWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1em 1fr'
  },
  authUsername: {
    gridColumn: 1
  },
  authPassword: {
    gridColumn: 3
  }
})

export default ({ wizard }) => {
  const { projectId } = useParams()
  const [project] = useState(
    () =>
      (projectId && getProject(projectId)) || {
        name: null,
        configPath: null
      }
  )
  const classes = useStyles()

  const [name, setName] = useState(() => project.name || '')
  const [id, setId] = useState(() => projectId || generateUUID())
  const [externalConfig, setExternalConfig] = useState(() => project.configPath != null)
  const [externalConfigFile, setExternalConfigFile] = useState(() => project.configPath || '')
  const [authUsername, setAuthUsername] = useState(() => {
    const projectAuth = getProjectAuth(projectId)
    return (projectAuth && projectAuth.username) || ''
  })
  const [authPassword, setAuthPassword] = useState(() => {
    const projectAuth = getProjectAuth(projectId)
    return (projectAuth && projectAuth.password) || ''
  })
  const [redirect, setRedirect] = useState()
  const [nameError, setNameError] = useState(false)
  const [externalConfigFileError, setExternalConfigFileError] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const history = useHistory()

  const handleChangeName = (event) => {
    setName(event.target.value)
  }

  const handleEnter = (event) => {
    if (event.charCode == 13) {
      handleSave(event)
    }
  }

  const validate = () => {
    setNameError(!name)
    setExternalConfigFileError(externalConfig && (!externalConfigFile || !externalConfigFile.endsWith('.yml')))
  }

  const handleSave = (event) => {
    validate()
    if (nameError || externalConfigFileError) {
      return
    }
    if (projectId) {
      const existingProject = getProject(projectId)
      if (!existingProject.configPath && externalConfig) {
        migrateProjectConfigToExternal(projectId, externalConfigFile)
      } else if (existingProject.configPath && !externalConfig) {
        migrateProjectConfigToInternal(projectId)
      }
    }
    saveProject(id, name, externalConfig ? externalConfigFile : null)
    if (wizard) {
      setRedirect(`/wizard-site/${id}`)
    } else {
      setRedirect(`/project/${id}`)
    }
    enqueueSnackbar(`Project ${name} Saved!`, { variant: 'success' })
    saveProjectAuth(id, authUsername, authPassword)
  }

  const renderRedirect = () => {
    if (redirect) {
      return <Redirect to={redirect} />
    }
  }

  const handleDelete = () => {
    setConfirmDeleteOpen(true)
  }

  const handlePermanentlyDelete = () => {
    deleteProject(projectId)
    setConfirmDeleteOpen(false)
    history.push('/')
  }

  return (
    <>
      <Header>
        {(project && (
          <Link to={`/project/${projectId}`}>
            <EditIcon />
            {name || 'New Project'}
          </Link>
        )) || (
          <a>
            <AddBoxIcon />
            {name || 'New Project'}
          </a>
        )}
      </Header>
      <main className="EditPage">
        <div className="Form">
          {wizard && <WizardSteps activeStep={0} />}

          <TextField
            error={nameError}
            label="Project Name"
            required={true}
            variant="outlined"
            autoFocus={true}
            fullWidth={true}
            value={name}
            onKeyPress={handleEnter}
            onChange={handleChangeName}
            onBlur={validate}
          />

          <FormControlLabel
            control={<Switch checked={externalConfig} onChange={(_, val) => setExternalConfig(val)} />}
            label="Custom Configuration File Location?"
          />

          {externalConfig && (
            <TextField
              label="Configuration File Path"
              helperText=""
              fullWidth={true}
              variant="outlined"
              placeholder="/path/to/project/shot-check.yml"
              required={true}
              value={externalConfigFile}
              error={externalConfigFileError}
              helperText={
                externalConfigFileError && 'External Configuration File Path is required. Filename must end with .yml'
              }
              onChange={(e) => setExternalConfigFile(e.target.value)}
              onBlur={validate}
            />
          )}

          <div className={classes.authWrapper}>
            <TextField
              label="HTTP Basic Auth Username"
              variant="outlined"
              className={classes.authUsername}
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
            />

            <TextField
              label="HTTP Basic Auth Password"
              variant="outlined"
              className={classes.authPassword}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
          </div>

          {!wizard && <ListSitesAndEnvironments projectId={projectId} />}
        </div>
      </main>
      <Footer>
        {!wizard && (
          <>
            <Link to={`/new-site/${projectId}`}>
              <Button disableElevation variant="contained" color="default">
                New Site
              </Button>
            </Link>
            <Link to={`/new-environment/${projectId}`}>
              <Button disableElevation variant="contained" color="default">
                New Environment
              </Button>
            </Link>
            <Link to={`/project/${projectId}`}>
              <Button disableElevation variant="contained" color="default">
                Back
              </Button>
            </Link>
            <Button disableElevation variant="contained" color="secondary" onClick={handleDelete}>
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
          </>
        )}
        <Button disableElevation variant="contained" color="primary" onClick={handleSave}>
          {renderRedirect()}
          {(wizard && 'Next') || 'Save'}
        </Button>
      </Footer>
    </>
  )
}
