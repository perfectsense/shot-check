import { ipcRenderer } from 'electron'

export default async (enqueueSnackbar, projectId, jobId) => {
  await ipcRenderer
    .invoke('deleteComparisonJob', projectId, jobId)
    .then((response) => enqueueSnackbar(response.message, response.options))
}
