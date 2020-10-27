'use strict'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import React from 'react'
import { useParams } from 'react-router-dom'
import { getJob } from '../../common/ComparisonResultStore'
import Comparison from './Comparison'
import Header from './Header'

export default () => {
  const { jobId, projectId } = useParams()

  const job = getJob(projectId, jobId)

  const rightUrls = job.leftUrls.map((u) => u.url)

  return (
    <>
      <Header>
        <a>
          <PlaylistAddCheckIcon />
          {job.name}
        </a>
      </Header>

      <Comparison
        typeCode="before-and-after"
        beforeAfter={true}
        continuing={true}
        jobId={jobId}
        projectId={projectId}
        rightUrls={rightUrls}
      />
    </>
  )
}
