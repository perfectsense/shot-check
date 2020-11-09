import { saveEnvironment, saveProject, getProjects, saveSite, setEnvironmentSiteUrl } from './ConfigurationStore'

function initializeExampleProject() {
  console.log('Initializing example project...')

  const projectId = '00000000-0000-0000-0000-000000000000'
  const site1Id = '00000000-0000-0000-0001-000000000000'
  const prodEnvironmentId = '00000000-0000-0000-0002-000000000000'
  const qaEnvironmentId = '00000000-0000-0000-0002-000000000001'

  saveProject(projectId, 'Shot Check Example Project', null)
  saveSite(projectId, site1Id, 'Shot Check Examples', true, '/spot-check-urls.txt', [], [], [], '', '')
  saveEnvironment(projectId, qaEnvironmentId, 'QA')
  saveEnvironment(projectId, prodEnvironmentId, 'Production')
  setEnvironmentSiteUrl(
    projectId,
    prodEnvironmentId,
    site1Id,
    'https://perfectsense.github.io/shot-check/example/production'
  )
  setEnvironmentSiteUrl(projectId, qaEnvironmentId, site1Id, 'https://perfectsense.github.io/shot-check/example/qa')
}

function initializeExampleProjectIfNecessary() {
  if (getProjects().length == 0) {
    initializeExampleProject()
  }
}

export { initializeExampleProject, initializeExampleProjectIfNecessary }
