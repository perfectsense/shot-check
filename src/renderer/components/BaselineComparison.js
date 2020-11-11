'use strict'
import { CircularProgress } from '@material-ui/core'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { getJob } from '../../common/ComparisonResultStore'
import { getEnvironment, getEnvironmentSiteUrl, getSite } from '../../common/ConfigurationStore'
import Comparison from './Comparison'
import Header from './Header'

export default () => {
  const { projectId, jobId, siteId, environmentId } = useParams()
  const [urlsFetched, setUrlsFetched] = useState(false)
  const [rightUrls, setRightUrls] = useState(() => [])
  const [job, setJob] = useState(() => getJob(projectId, jobId))
  const [name, setName] = useState(null)
  const [site, setSite] = useState(() => (siteId && getSite(projectId, siteId)) || {})

  useEffect(() => {
    if (siteId && environmentId) {
      const s = getSite(projectId, siteId)
      const environment = getEnvironment(projectId, environmentId)
      setSite(s)
      setName(`${s.name}: ${environment.name}`)
    } else {
      setName(job.name + ' Comparison')
    }
  }, [projectId, siteId, environmentId])

  if (siteId && environmentId) {
    useEffect(() => {
      const leftUrlPrefix = getEnvironmentSiteUrl(projectId, job.leftEnvironmentId, job.siteId)
      const rightUrlPrefix = getEnvironmentSiteUrl(projectId, environmentId, siteId)
      setRightUrls(job.leftUrls.map((u) => u.url.replace(leftUrlPrefix, rightUrlPrefix)))

      setUrlsFetched(true)
    }, [siteId, environmentId])
  } else {
    useEffect(() => {
      setRightUrls(job.leftUrls.map((u) => u.url))
      setUrlsFetched(true)
    }, [job])
  }

  return (
    <>
      <Header>
        <a>
          <PlaylistAddCheckIcon />
          {name}
        </a>
      </Header>

      {(urlsFetched && (
        <Comparison
          name={name}
          typeCode="baseline"
          baselineJobId={jobId}
          projectId={projectId}
          siteId={siteId}
          rightEnvironmentId={environmentId}
          leftUrls={job.leftUrls}
          rightUrls={rightUrls}
          ignoreSelectors={(site && site.ignoreSelectors) || job.ignoreSelectors}
          clickSelectors={(site && site.clickSelectors) || job.clickSelectors}
          pageLoadJS={(site && site.pageLoadJavaScript) || job.pageLoadJavaScript}
          afterScrollJS={(site && site.afterScrollJavaScript) || job.afterScrollJavaScript}
          queryString={(site && site.queryString) || job.queryString}
          requestHeaders={(site && site.requestHeaders) || job.requestHeaders}
        />
      )) || <CircularProgress style={{ position: 'absolute', left: '50%', top: '50%' }} />}
    </>
  )
}
