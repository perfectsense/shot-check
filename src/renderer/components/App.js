import 'fontsource-roboto'
import { SnackbarProvider } from 'notistack'
import React from 'react'
import { HashRouter, Route } from 'react-router-dom'
import '../style.less'
import BaselineComparison from './BaselineComparison'
import BaselineCapture from './BaselineCapture'
import BeforeAndAfterComparison from './BeforeAndAfterComparison'
import ComparisonJob from './ComparisonJob'
import ComparisonJobs from './ComparisonJobs'
import ContinueBeforeAndAfterComparison from './ContinueBeforeAndAfterComparison'
import EditEnvironment from './EditEnvironment'
import EditProject from './EditProject'
import EditSite from './EditSite'
import EnvironmentToEnvironmentComparison from './EnvironmentToEnvironmentComparison'
import Home from './Home'
import ManualComparison from './ManualComparison'
import Preferences from './Preferences'
import Project from './Project'
import { RunningJobProvider } from './RunningJobContext'
import VerifyComparison from './VerifyComparison'

export default () => {
  return (
    <RunningJobProvider>
      <SnackbarProvider classes={{ containerRoot: { snackbarContainer: true } }} maxSnack={6}>
        <HashRouter>
          <Route path="/" exact>
            <Home />
          </Route>

          {/* Preferences */}
          <Route exact path="/preferences">
            <Preferences />
          </Route>

          {/* Edit project / site / env wizard*/}
          <Route exact path="/wizard-project">
            <EditProject wizard={true} />
          </Route>
          <Route exact path="/wizard-site/:projectId">
            <EditSite wizard={true} />
          </Route>
          <Route exact path="/wizard-environment/:projectId">
            <EditEnvironment wizard={true} />
          </Route>

          {/* Edit site / env, not wizard */}
          <Route exact path="/new-site/:projectId">
            <EditSite wizard={false} />
          </Route>
          <Route exact path="/new-environment/:projectId">
            <EditEnvironment wizard={false} />
          </Route>

          {/* Edit existing project / site / env */}
          <Route exact path="/edit-project/:projectId">
            <EditProject wizard={false} />
          </Route>
          <Route exact path="/edit-site/:projectId/:siteId">
            <EditSite wizard={false} />
          </Route>
          <Route exact path="/edit-environment/:projectId/:environmentId">
            <EditEnvironment wizard={false} />
          </Route>

          {/* Project */}
          <Route exact path="/project/:projectId">
            <Project />
          </Route>

          {/* Manual Comparison */}
          <Route exact path="/manual-comparison">
            <ManualComparison />
          </Route>

          <Route exact path="/manual-comparison/:jobId">
            <ManualComparison />
          </Route>

          {/* Project Comparisons */}
          <Route exact path="/before-and-after-comparison/:projectId/:siteId/:environmentId">
            <BeforeAndAfterComparison />
          </Route>

          <Route exact path="/before-and-after-comparison-copy/:projectId/:jobId">
            <BeforeAndAfterComparison />
          </Route>

          <Route exact path="/continue-before-and-after-comparison/:projectId/:jobId">
            <ContinueBeforeAndAfterComparison />
          </Route>

          <Route
            exact
            path="/environment-to-environment-comparison/:projectId/:siteId/:leftEnvironmentId/:rightEnvironmentId"
          >
            <EnvironmentToEnvironmentComparison />
          </Route>

          <Route exact path="/environment-to-environment-comparison-copy/:projectId/:jobId">
            <EnvironmentToEnvironmentComparison />
          </Route>

          <Route exact path="/verify-comparison/:projectId/:siteId/:environmentId">
            <VerifyComparison />
          </Route>

          <Route exact path="/verify-comparison-copy/:projectId/:jobId">
            <VerifyComparison />
          </Route>

          <Route exact path="/baseline-capture/:projectId/:siteId/:environmentId">
            <BaselineCapture />
          </Route>

          <Route exact path="/baseline-comparison/:projectId/:jobId">
            <BaselineComparison />
          </Route>

          <Route exact path="/baseline-site-environment-comparison/:projectId/:jobId/:siteId/:environmentId">
            <BaselineComparison />
          </Route>

          <Route exact path="/comparison-jobs/:projectId">
            <ComparisonJobs />
          </Route>

          <Route exact path="/comparison-job/:projectId/:jobId">
            <ComparisonJob />
          </Route>
        </HashRouter>
      </SnackbarProvider>
    </RunningJobProvider>
  )
}
