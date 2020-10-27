'use strict'
import { CircularProgress } from '@material-ui/core'
import AssignmentIcon from '@material-ui/icons/Assignment'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import { useSnackbar } from 'notistack'
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJob } from '../../common/ComparisonResultStore'
import {
  generateEnvironmentSiteUrls,
  getEnvironment,
  getEnvironmentSiteUrl,
  getProject,
  getSite
} from '../../common/ConfigurationStore'
import Comparison from './Comparison'
import Header from './Header'

export default () => {
  const { jobId, projectId, siteId, leftEnvironmentId, rightEnvironmentId } = useParams()

  let name, ignoreSelectors, clickSelectors, pageLoadJS, afterScrollJS
  let [leftUrls, setLeftUrls] = useState([])
  let [rightUrls, setRightUrls] = useState([])
  let [urlsFetched, setUrlsFetched] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  const project = getProject(projectId)

  if (!jobId) {
    const site = getSite(projectId, siteId)
    const leftEnvironment = getEnvironment(projectId, leftEnvironmentId)
    const rightEnvironment = getEnvironment(projectId, rightEnvironmentId)
    name = `${site.name}: ${leftEnvironment.name} to ${rightEnvironment.name}`
    ignoreSelectors = site.ignoreSelectors
    clickSelectors = site.clickSelectors
    pageLoadJS = site.pageLoadJavaScript
    afterScrollJS = site.afterScrollJavaScript
    const leftUrlPrefix = getEnvironmentSiteUrl(projectId, leftEnvironmentId, siteId)
    const rightUrlPrefix = getEnvironmentSiteUrl(projectId, rightEnvironmentId, siteId)

    useEffect(() => {
      generateEnvironmentSiteUrls(
        projectId,
        leftEnvironmentId,
        siteId,
        (urls) => {
          setLeftUrls(urls)
          setRightUrls(urls.map((u) => u.replace(leftUrlPrefix, rightUrlPrefix)))
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
  }

  return (
    <>
      <Header>
        <Link to={`/project/${projectId}`}>
          <AssignmentIcon /> {project.name}
        </Link>
        <a>
          <PlaylistAddCheckIcon />
          Environment to Environment: {name}
        </a>
      </Header>

      {(urlsFetched && (
        <Comparison
          typeCode="environment-to-environment"
          name={name}
          jobId={jobId}
          siteId={siteId}
          projectId={projectId}
          leftEnvironmentId={leftEnvironmentId}
          rightEnvironmentId={rightEnvironmentId}
          leftUrls={leftUrls}
          rightUrls={rightUrls}
          ignoreSelectors={ignoreSelectors}
          clickSelectors={clickSelectors}
          pageLoadJS={pageLoadJS}
          afterScrollJS={afterScrollJS}
        />
      )) || <CircularProgress style={{ position: 'absolute', left: '50%', top: '50%' }} />}
    </>
  )
}
