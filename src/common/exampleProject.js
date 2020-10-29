import {
  createEnvironment,
  createProject,
  getProjects,
  saveSite,
  setEnvironmentSiteUrl,
  setEnvironmentVerifyUrl
} from './ConfigurationStore'

function initializeExampleProject() {
  console.log('Initializing example project...')

  const projectId = '00000000-0000-0000-0000-000000000000'
  const site1Id = '00000000-0000-0000-0001-000000000000'
  const site2Id = '00000000-0000-0000-0001-000000000001'
  const site3Id = '00000000-0000-0000-0001-000000000002'
  const site4Id = '00000000-0000-0000-0001-000000000003'
  const qaEnvironmentId = '00000000-0000-0000-0002-000000000000'
  const uatEnvironmentId = '00000000-0000-0000-0002-000000000001'
  const prodEnvironmentId = '00000000-0000-0000-0002-000000000002'

  createProject(projectId, 'My Example Project', null)
  saveSite(projectId, site1Id, 'Example', false, null, ['/'], [], [], '', '')
  saveSite(projectId, site2Id, 'Time.gov', false, null, ['/', '/?t=24'], [], [], '', '')
  saveSite(projectId, site3Id, 'Brightspot', false, null, ['/', '/products', '/solutions', '/about-us'], [], [], '', '')
  saveSite(
    projectId,
    site4Id,
    'Inspire Confidence',
    false,
    null,
    ['/', '/environment', '/hope', '/innovation/the-new-york-public-library-is-rewriting-the-way-stories-are-told'],
    [],
    [],
    '',
    ''
  )
  createEnvironment(projectId, qaEnvironmentId, 'QA')
  createEnvironment(projectId, uatEnvironmentId, 'UAT')
  createEnvironment(projectId, prodEnvironmentId, 'Production')
  setEnvironmentSiteUrl(projectId, qaEnvironmentId, site1Id, 'https://www.example.net')
  setEnvironmentSiteUrl(projectId, uatEnvironmentId, site1Id, 'https://www.example.org')
  setEnvironmentSiteUrl(projectId, prodEnvironmentId, site1Id, 'https://www.example.com')
  setEnvironmentSiteUrl(projectId, prodEnvironmentId, site2Id, 'https://www.time.gov')
  setEnvironmentSiteUrl(projectId, prodEnvironmentId, site3Id, 'https://www.brightspot.com')
  setEnvironmentSiteUrl(projectId, prodEnvironmentId, site4Id, 'https://www.inspire-confidence.com')

  console.log('Initialized example project.')
}

function initializeExampleProjectIfNecessary() {
  if ((getProjects().length = 0)) {
    initializeExampleProject()
  }
}

export { initializeExampleProject, initializeExampleProjectIfNecessary }
