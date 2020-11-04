'use strict'
import { CircularProgress } from '@material-ui/core'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getJob } from '../../common/ComparisonResultStore'
import { getEnvironment, getEnvironmentSiteUrl, getSite } from '../../common/ConfigurationStore'
import Comparison from './Comparison'
import Header from './Header'

export default () => {
  const { projectId, jobId, siteId, environmentId } = useParams()
  const [urlsFetched, setUrlsFetched] = useState(false)
  const [rightUrls, setRightUrls] = useState(() => [])
  const [job, setJob] = useState(null)
  const [name, setName] = useState(null)

  useEffect(() => {
    const job = getJob(projectId, jobId)
    if (siteId && environmentId) {
      const site = getSite(projectId, siteId)
      const environment = getEnvironment(projectId, environmentId)
      setName(`${site.name}: ${environment.name}`)
    } else {
      setName(job.name)
    }
    const site = getSite(projectId, siteId)
  }, [projectId, siteId, environmentId])

  if (siteId && environmentId) {
    useEffect(() => {
      const job = getJob(projectId, jobId)
      setJob(job)

      const leftUrlPrefix = getEnvironmentSiteUrl(projectId, job.leftEnvironmentId, job.siteId)
      const rightUrlPrefix = getEnvironmentSiteUrl(projectId, environmentId, siteId)
      setRightUrls(job.leftUrls.map((u) => u.url.replace(leftUrlPrefix, rightUrlPrefix)))

      setUrlsFetched(true)
    }, [siteId, environmentId])
  } else {
    setRightUrls(job.leftUrls.map((u) => u.url))
    setUrlsFetched(true)
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
        />
      )) || <CircularProgress style={{ position: 'absolute', left: '50%', top: '50%' }} />}
    </>
  )
}
