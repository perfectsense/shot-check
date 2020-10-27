'use strict'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import React from 'react'
import { useParams } from 'react-router-dom'
import Comparison from './Comparison'
import Header from './Header'

export default () => {
  const { jobId } = useParams()

  return (
    <>
      <Header>
        <a>
          <PlaylistAddCheckIcon />
          Manual Check
        </a>
      </Header>

      <Comparison name="Manual Check" typeCode="manual" jobId={jobId} />
    </>
  )
}
