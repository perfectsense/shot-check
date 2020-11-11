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
  getEnvironmentVerifyUrl,
  getProject,
  getSite
} from '../../common/ConfigurationStore'
import Comparison from './Comparison'
import Header from './Header'

export default () => {
  const { jobId, projectId, siteId, environmentId } = useParams()

  const [leftUrls, setLeftUrls] = useState([])
  const [rightUrls, setRightUrls] = useState([])
  const [urlsFetched, setUrlsFetched] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  let name, ignoreSelectors, clickSelectors, pageLoadJS, afterScrollJS, realUrl, queryString, requestHeaders

  const project = getProject(projectId)

  if (!jobId) {
    const site = getSite(projectId, siteId)
    const environment = getEnvironment(projectId, environmentId)
    name = `${site.name}: ${environment.name}`
    realUrl = getEnvironmentSiteUrl(projectId, environmentId, siteId).split('/').slice(0, 3).join('/')
    const verifyUrl = getEnvironmentVerifyUrl(projectId, environmentId).split('/').slice(0, 3).join('/')
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
          setRightUrls(urls.map((u) => u.replace(realUrl, verifyUrl)))
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
          Blue/Green Verify: {name}
        </a>
      </Header>

      {(urlsFetched && (
        <Comparison
          typeCode="verify"
          name={name}
          jobId={jobId}
          siteId={siteId}
          projectId={projectId}
          leftEnvironmentId={environmentId}
          rightEnvironmentId={environmentId}
          leftUrls={leftUrls}
          rightUrls={rightUrls}
          ignoreSelectors={ignoreSelectors}
          clickSelectors={clickSelectors}
          pageLoadJS={pageLoadJS}
          afterScrollJS={afterScrollJS}
          verifySpoofUrl={realUrl}
          queryString={queryString}
          requestHeaders={requestHeaders}
        />
      )) || <CircularProgress style={{ position: 'absolute', left: '50%', top: '50%' }} />}
    </>
  )
}
