import { Button, makeStyles, TextField, Typography } from '@material-ui/core'
import AddBoxIcon from '@material-ui/icons/AddBox'
import AssignmentIcon from '@material-ui/icons/Assignment'
import EditIcon from '@material-ui/icons/Edit'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { Link, Redirect, useParams } from 'react-router-dom'
import {
  createEnvironment,
  getEnvironment,
  getEnvironmentAuth,
  getEnvironmentSiteUrl,
  getEnvironmentVerifyUrl,
  getProject,
  getProjectAuth,
  getSites,
  saveEnvironmentAuth,
  setEnvironmentSiteUrl,
  setEnvironmentVerifyUrl
} from '../../common/ConfigurationStore'
import generateUUID from '../../common/generateUUID'
import Footer from './Footer'
import Header from './Header'
import WizardSteps from './WizardSteps'

const useStyles = makeStyles({
  note: {
    marginTop: '1em',
    marginBottom: '1em'
  },
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
  const classes = useStyles()

  const { projectId, environmentId } = useParams()
  const [environment] = useState(() => environmentId && getEnvironment(projectId, environmentId))
  const [sites] = useState(() => getSites(projectId))
  const [project] = useState(() => getProject(projectId))
  const [id, setId] = useState(() => environmentId || generateUUID())
  const [name, setName] = useState(() => (environment && environment.name) || '')
  const [redirect, setRedirect] = useState()
  const [nameError, setNameError] = useState(false)
  const [verifyUrl, setVerifyUrl] = useState(
    () => (environmentId && getEnvironmentVerifyUrl(projectId, environmentId)) || ''
  )
  const [verifyUrlError, setVerifyUrlError] = useState(false)
  const [authUsername, setAuthUsername] = useState(() => {
    const environmentAuth = getEnvironmentAuth(projectId, environmentId)
    return (environmentAuth && environmentAuth.username) || ''
  })
  const [authPassword, setAuthPassword] = useState(() => {
    const environmentAuth = getEnvironmentAuth(projectId, environmentId)
    return (environmentAuth && environmentAuth.password) || ''
  })

  const [projectAuthUsername] = useState(() => {
    const projectAuth = getProjectAuth(projectId)
    return (projectAuth && projectAuth.username) || ''
  })
  const [projectAuthPassword] = useState(() => {
    const projectAuth = getProjectAuth(projectId)
    return (projectAuth && projectAuth.password) || ''
  })

  const { enqueueSnackbar } = useSnackbar()

  const [urlErrors, setUrlErrors] = useState(() => {
    let errorMap = {}
    sites.forEach((s) => {
      errorMap[s.siteId] = false
    })
    return errorMap
  })

  const [envUrls, setEnvUrls] = useState(() => {
    let siteMap = {}
    sites.forEach((s) => {
      siteMap[s.siteId] = getEnvironmentSiteUrl(projectId, id, s.siteId) || ''
    })
    return siteMap
  })

  const handleChangeName = (event) => {
    setName(event.target.value)
  }

  const handleEnter = (event) => {
    if (event.charCode == 13) {
      handleSave(event)
    }
  }

  const handleChangeSiteUrl = (siteId) => {
    return (event) => {
      const envUrl = {}
      envUrl[siteId] = event.target.value
      validateEnvUrl(siteId)
      setEnvUrls({
        ...envUrls,
        ...envUrl
      })
    }
  }

  const validateEnvUrl = (siteId) => {
    let urlOk = true
    const newUrlError = {}
    newUrlError[siteId] = false
    if (!validateUrl(envUrls[siteId])) {
      urlOk = false
      newUrlError[siteId] = true
    }
    setUrlErrors({ ...urlErrors, ...newUrlError })
    return urlOk
  }

  const validateUrl = (url) => {
    return !url || url.startsWith('https://') || url.startsWith('http://')
  }

  const validateTopLevelUrl = (url) => {
    // Ensure the URL is top level only, no path allowed
    return !url || (validateUrl(url) && url.split('/').length < 4)
  }

  const handleChangeVerifyUrl = (event) => {
    setVerifyUrlError(!validateTopLevelUrl(event.target.value))
    setVerifyUrl(event.target.value)
  }

  const handleSave = (event) => {
    if (!name) {
      setNameError(true)
      return
    }
    createEnvironment(projectId, id, name)

    const auth = {
      username: authUsername,
      password: authPassword
    }
    if (auth.username && !auth.password) {
      auth.password = projectAuthPassword
    } else if (auth.password && !auth.username) {
      auth.username = projectAuthUsername
    }
    saveEnvironmentAuth(projectId, environmentId, auth.username, auth.password)

    let urlOk = true
    Object.keys(envUrls).forEach((siteId) => {
      validateEnvUrl(siteId) || (urlOk = false)
      setEnvironmentSiteUrl(projectId, id, siteId, envUrls[siteId])
    })
    urlOk = urlOk && validateTopLevelUrl(verifyUrl)
    setEnvironmentVerifyUrl(projectId, id, verifyUrl)
    if (!urlOk) {
      return
    }
    if (wizard) {
      setRedirect(`/project/${projectId}`)
    } else {
      setRedirect(`/edit-project/${projectId}`)
    }
    enqueueSnackbar(`Environment ${name} Saved!`, { variant: 'success' })
  }

  const renderRedirect = () => {
    if (redirect) {
      return <Redirect to={redirect} />
    }
  }

  return (
    <>
      <Header>
        <Link to={`/project/${projectId}`}>
          <AssignmentIcon /> {project.name}
        </Link>
        <a>
          {(environment && <EditIcon />) || <AddBoxIcon />}
          {name || 'New Environment'}
        </a>
      </Header>
      <main className="EditPage">
        <div className="Form">
          {wizard && <WizardSteps activeStep={2} />}

          <TextField
            label="Environment Name"
            required={true}
            error={nameError}
            autoFocus={true}
            variant="outlined"
            fullWidth={true}
            value={name}
            onKeyPress={handleEnter}
            onChange={handleChangeName}
          />

          <div className={classes.authWrapper}>
            <TextField
              label="HTTP Basic Auth Username"
              variant="outlined"
              className={classes.authUsername}
              placeholder={projectAuthUsername}
              onKeyPress={handleEnter}
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              helperText="Override Project authentication username"
            />

            <TextField
              label="HTTP Basic Auth Password"
              variant="outlined"
              className={classes.authPassword}
              onKeyPress={handleEnter}
              placeholder={projectAuthPassword}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              helperText="Override Project authentication password"
            />
          </div>

          <Typography className={classes.note}>Provide a URL for each site available in this environment:</Typography>

          {sites &&
            sites.map((site, i) => (
              <div key={i}>
                <TextField
                  label={`${site.name} URL`}
                  error={urlErrors[site.siteId]}
                  variant="outlined"
                  fullWidth={true}
                  value={envUrls[site.siteId]}
                  placeholder="https://..."
                  onKeyPress={handleEnter}
                  onChange={handleChangeSiteUrl(site.siteId)}
                />
              </div>
            ))}

          <TextField
            label="Verify URL"
            error={verifyUrlError}
            variant="outlined"
            fullWidth={true}
            value={verifyUrl}
            placeholder="https://..."
            onKeyPress={handleEnter}
            onChange={handleChangeVerifyUrl}
            helperText="For Blue/Green Verify support only, provide a Verify URL for this environment"
          />
        </div>
      </main>
      <Footer>
        {renderRedirect()}
        {(!wizard && (
          <Link to={`/edit-project/${projectId}`}>
            <Button disableElevation variant="contained" color="default">
              Back
            </Button>
          </Link>
        )) || (
          <Link to={`/project/${projectId}`}>
            <Button disableElevation variant="contained" color="default">
              Done
            </Button>
          </Link>
        )}
        <Button disableElevation variant="contained" color="primary" onClick={handleSave}>
          {(wizard && 'Save and Finish') || 'Save'}
        </Button>
      </Footer>
    </>
  )
}
