'use strict'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import React, { useEffect, useState } from 'react'
import AssignmentIcon from '@material-ui/icons/Assignment'
import { useParams, Link } from 'react-router-dom'
import { getJob } from '../../common/ComparisonResultStore'
import { getProject, generateEnvironmentSiteUrls, getEnvironment, getSite } from '../../common/ConfigurationStore'
import Comparison from './Comparison'
import Header from './Header'
import { CircularProgress } from '@material-ui/core'
import { useSnackbar } from 'notistack'

export default () => {
  const { jobId, projectId, siteId, environmentId } = useParams()

  const [leftUrls, setLeftUrls] = useState([])
  const [urlsFetched, setUrlsFetched] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  let name, rightUrls, ignoreSelectors, clickSelectors, pageLoadJS, afterScrollJS, queryString, requestHeaders

  const project = getProject(projectId)

  if (!jobId) {
    const site = getSite(projectId, siteId)
    const environment = getEnvironment(projectId, environmentId)
    name = `${site.name}: ${environment.name}`
    rightUrls = []
    ignoreSelectors = site.ignoreSelectors
    clickSelectors = site.clickSelectors
    pageLoadJS = site.pageLoadJavaScript
    afterScrollJS = site.afterScrollJavaScript
    queryString = site.queryString
    requestHeaders = site.requestHeaders

    useEffect(() => {
      generateEnvironmentSiteUrls(
        projectId,
        environmentId,
        siteId,
        (urls) => {
          setLeftUrls(urls)
          setUrlsFetched(true)
        },
        (error) => {
          enqueueSnackbar(error, { variant: 'error', autoHideDuration: 10000 })
          setUrlsFetched(true)
        }
      )
    }, [])
  } else {
    name = getJob(projectId, jobId).name
    useEffect(() => setUrlsFetched(true), [])
  }

  return (
    <>
      <Header>
        <Link to={`/project/${projectId}`}>
          <AssignmentIcon /> {project.name}
        </Link>
        <a>
          <PlaylistAddCheckIcon />
          Before and After: {name}
        </a>
      </Header>

      {(urlsFetched && (
        <Comparison
          typeCode="before-and-after"
          beforeAfter={true}
          name={name}
          jobId={jobId}
          siteId={siteId}
          projectId={projectId}
          rightEnvironmentId={environmentId}
          leftEnvironmentId={environmentId}
          leftUrls={leftUrls}
          rightUrls={rightUrls}
          ignoreSelectors={ignoreSelectors}
          clickSelectors={clickSelectors}
          pageLoadJS={pageLoadJS}
          afterScrollJS={afterScrollJS}
          queryString={queryString}
          requestHeaders={requestHeaders}
        />
      )) || <CircularProgress style={{ position: 'absolute', left: '50%', top: '50%' }} />}
    </>
  )
}
