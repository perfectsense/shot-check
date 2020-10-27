import { ipcMain } from 'electron'
import { deleteJob, getJob } from '../../common/ComparisonResultStore'
import { comparisonJob, compareShots } from '../comparisonJob'

export default () => {
  // job starter - uses MessageChannel ports for two way communication
  ipcMain.on('startComparison', async (e, job) => {
    const [port] = e.ports
    comparisonJob(job, (response) => port.postMessage(response))
  })

  ipcMain.handle('deleteComparisonJob', async (e, projectId, jobId) => {
    const job = getJob(projectId, jobId)
    try {
      deleteJob(projectId, jobId)
    } catch (error) {
      return { message: error.message, options: { variant: 'error' } }
    }

    return { message: `Permanently Deleted Comparison ${job.name}`, options: { variant: 'success' } }
  })
}
