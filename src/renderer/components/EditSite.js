import { FormControlLabel, makeStyles, Switch } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import AddBoxIcon from '@material-ui/icons/AddBox'
import AssignmentIcon from '@material-ui/icons/Assignment'
import EditIcon from '@material-ui/icons/Edit'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { Link, Redirect, useParams } from 'react-router-dom'
import { getProject, getSite, saveSite } from '../../common/ConfigurationStore'
import generateUUID from '../../common/generateUUID'
import Footer from './Footer'
import Header from './Header'
import WizardSteps from './WizardSteps'

const useStyles = makeStyles({
  selectorsAndJS: {
    display: 'grid',
    gridTemplateColumns: '0 1fr 1fr 75px 1fr 1fr 0',
    gridTemplateRows: '2em min-content 2em min-content 2em min-content 2em min-content 2em min-content 5em'
  },
  ignoreSelectors: {
    gridRow: '2',
    gridColumn: '2 / 4'
  },
  clickSelectors: {
    gridRow: '2',
    gridColumn: '5 / 7'
  },
  pageLoadJavaScript: {
    gridRow: '4',
    gridColumn: '2 / 4'
  },
  afterScrollJavaScript: {
    gridRow: '4',
    gridColumn: '5 / 7'
  },
  queryString: {
    gridRow: '6',
    gridColumn: '2 / 4'
  },
  requestHeaders: {
    gridRow: '6',
    gridColumn: '5 / 7'
  },
})

export default ({ wizard }) => {
  const { projectId, siteId } = useParams()
  const classes = useStyles()

  const [site] = useState(
    () =>
      (siteId && getSite(projectId, siteId)) || {
        name: '',
        autoPaths: false,
        autoPathsPath: '/spot-check-urls.txt',
        paths: [],
        ignoreSelectors: [],
        clickSelectors: [],
        pageLoadJavaScript: '',
        afterScrollJavaScript: '',
        queryString: '',
        requestHeaders: []
      }
  )

  const [project] = useState(() => getProject(projectId))
  const [id, setId] = useState(() => siteId || generateUUID())
  const [name, setName] = useState(() => site.name)
  const [autoPaths, setAutoPaths] = useState(() => site.autoPaths)
  const [autoPathsPath, setAutoPathsPath] = useState(() => site.autoPathsPath)
  const [paths, setPaths] = useState(() => site.paths)
  const [pathsError, setPathsError] = useState(() => false)

  const [ignoreSelectors, setIgnoreSelectors] = useState(() => site.ignoreSelectors)
  const [clickSelectors, setClickSelectors] = useState(() => site.clickSelectors)
  const [pageLoadJavaScript, setPageLoadJavaScript] = useState(() => site.pageLoadJavaScript)
  const [afterScrollJavaScript, setAfterScrollJavaScript] = useState(() => site.afterScrollJavaScript)
  const [queryString, setQueryString] = useState(() => site.queryString)
  const [requestHeaders, setRequestHeaders] = useState(() => site.requestHeaders)

  const [redirect, setRedirect] = useState()
  const [nameError, setNameError] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

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
    setPathsError(Boolean(!autoPaths && paths && paths.length && paths.find((p) => p && !p.startsWith('/')) != null))
  }

  const handleSave = (event) => {
    validate()
    if (nameError) {
      return
    }
    if (pathsError) {
      return
    }
    saveSite(
      projectId,
      id,
      name,
      autoPaths,
      autoPathsPath,
      paths,
      ignoreSelectors,
      clickSelectors,
      pageLoadJavaScript,
      afterScrollJavaScript,
      queryString,
      requestHeaders
    )
    if (wizard) {
      setRedirect(`/wizard-environment/${projectId}`)
    } else {
      setRedirect(`/edit-project/${projectId}`)
    }
    enqueueSnackbar(`Site ${name} Saved!`, { variant: 'success' })
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
          {(site && <EditIcon />) || <AddBoxIcon />}
          {name || 'New Site'}
        </a>
      </Header>
      <main className="EditPage">
        <div className="Form">
          {wizard && <WizardSteps activeStep={1} />}

          <TextField
            label="Site Name"
            required={true}
            error={nameError}
            variant="outlined"
            fullWidth={true}
            autoFocus={true}
            value={name}
            onKeyPress={handleEnter}
            onChange={handleChangeName}
            onBlur={validate}
            helperText={nameError && 'Name is required'}
          />

          <div className={classes.pathGrid}>
            <FormControlLabel
              className={classes.autoPaths}
              control={<Switch name="chromiumHeadless" checked={autoPaths} onChange={(_, val) => setAutoPaths(val)} />}
              label="Automatic Site Paths?"
            />

            {autoPaths && (
              <TextField
                label="Automatic Site Paths Path"
                helperText="Paths will be collected from this path on the first environment"
                fullWidth={true}
                className={classes.autoPathsPath}
                variant="outlined"
                placeholder="/spot-check-urls.txt"
                value={autoPathsPath}
                onChange={(e) => setAutoPathsPath(e.target.value)}
                onBlur={validate}
              />
            )}

            {!autoPaths && (
              <TextField
                label="Site Paths"
                helperText="These paths will be combined with each environment's URL Prefix to build test URLs"
                fullWidth={true}
                error={pathsError}
                className={classes.paths}
                variant="outlined"
                placeholder={`/\n/story-page\n/secton-page\n/search\n/terms-and-conditions\n/404`}
                multiline
                rows={10}
                value={paths.join('\n')}
                onChange={(e) => setPaths(e.target.value.split('\n'))}
                onBlur={validate}
                helperText={pathsError ? 'Paths must begin with /' : ''}
              />
            )}
          </div>

          <div className={classes.selectorsAndJS}>
            <TextField
              className={classes.ignoreSelectors}
              label="Ignore CSS Selectors (one per line)"
              variant="outlined"
              multiline
              rows={4}
              value={ignoreSelectors.join('\n')}
              onChange={(e) => {
                setIgnoreSelectors(e.target.value.split('\n'))
              }}
              onBlur={validate}
              placeholder={`.google-dfp-ad-wrapper\n.animated-slideshow`}
              helperText="Matching elements will be blanked on each page after auto-scroll and before comparison"
            />

            <TextField
              className={classes.clickSelectors}
              label="Click CSS Selectors (one per line)"
              variant="outlined"
              multiline
              rows={4}
              value={clickSelectors.join('\n')}
              onChange={(e) => {
                setClickSelectors(e.target.value.split('\n'))
              }}
              onBlur={validate}
              placeholder={`#close-dialog-button\n.ad-flyout`}
              helperText="Matching elements will be clicked on each page after auto-scroll and before comparison"
            />

            <TextField
              className={classes.pageLoadJavaScript}
              label="Execute Javascript on Page Load"
              variant="outlined"
              multiline
              rows={8}
              value={pageLoadJavaScript}
              onChange={(e) => {
                setPageLoadJavaScript(e.target.value)
              }}
              onBlur={validate}
              placeholder={``}
              helperText="This JavaScript will run on page load on every breakpoint"
            />

            <TextField
              className={classes.afterScrollJavaScript}
              label="Execute Javascript after Auto-Scroll"
              variant="outlined"
              multiline
              rows={8}
              value={afterScrollJavaScript}
              onChange={(e) => {
                setAfterScrollJavaScript(e.target.value)
              }}
              onBlur={validate}
              placeholder={``}
              helperText="This JavaScript will run after the browser has auto-scrolled on every breakpoint"
            />

            <TextField
              className={classes.queryString}
              label="Query String"
              variant="outlined"
              value={queryString}
              onChange={(e) => {
                setQueryString(e.target.value)
              }}
              onBlur={validate}
              placeholder={`key1=value1&key2=value2`}
              helperText="This query string will be appended to every URL. The string {timestamp} will be replaced dynamically with the current timestamp in milliseconds."
            />

            <TextField
              className={classes.requestHeaders}
              label="Extra Request Headers"
              variant="outlined"
              multiline
              rows={8}
              value={requestHeaders.join('\n')}
              onChange={(e) => {
                setRequestHeaders(e.target.value.split('\n'))
              }}
              onBlur={validate}
              placeholder={`Cookie: authenticated=true\nX-Disable-Ads: true`}
              helperText="These request headers will be sent with every request."
            />

          </div>
        </div>
      </main>
      <Footer>
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
          {renderRedirect()}
          {(wizard && 'Next') || 'Save'}
        </Button>
      </Footer>
    </>
  )
}
