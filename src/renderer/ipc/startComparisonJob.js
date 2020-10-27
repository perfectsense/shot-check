import { ipcRenderer } from 'electron'
import generateUUID from '../../common/generateUUID'

export default (runningJobContext, enqueueSnackbar, job, continuingJobId) => {
  const newJobId = continuingJobId || generateUUID()
  runningJobContext.dispatch({
    type: 'INITIALIZE_JOB',
    payload: { jobId: newJobId, projectId: job.projectId, jobName: job.name }
  })

  const { port1, port2 } = new MessageChannel()

  job.jobId = newJobId

  ipcRenderer.postMessage('startComparison', job, [port2])

  port1.onmessage = (response) => {
    if (response.data.status) {
      if (response.data.status == 'ready') {
        runningJobContext.dispatch({ type: 'CLEAR' })
      }
      runningJobContext.dispatch({
        type: 'SET_STATUS',
        payload: { status: response.data.status }
      })
    }
    if (response.data.message) {
      enqueueSnackbar(response.data.message, response.data.options)
      runningJobContext.dispatch({
        type: 'SET_MESSAGE',
        payload: { message: response.data }
      })
    }
    if (response.data.progressDetail) {
      runningJobContext.dispatch({
        type: 'SET_PROGRESS_DETAIL',
        payload: { progressDetail: response.data.progressDetail }
      })
    }
    if (response.data.progressTotal) {
      runningJobContext.dispatch({
        type: 'SET_PROGRESS_TOTAL',
        payload: { progressTotal: response.data.progressTotal }
      })
    }
    if (response.data.progressIndex) {
      runningJobContext.dispatch({
        type: 'SET_PROGRESS_INDEX',
        payload: { progressIndex: response.data.progressIndex }
      })
    }
  }
}
