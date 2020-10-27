import React, { createContext, useReducer } from 'react'

const reducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE_JOB':
      return {
        jobId: action.payload.jobId,
        jobName: action.payload.jobName,
        projectId: action.payload.projectId,
        status: 'initialized'
      }
    case 'SET_MESSAGE':
      return {
        ...state,
        message: action.payload.message
      }
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload.status
      }
    case 'SET_PROGRESS_DETAIL':
      return {
        ...state,
        progressDetail: action.payload.progressDetail
      }
    case 'SET_PROGRESS_INDEX':
      return {
        ...state,
        progressIndex: action.payload.progressIndex
      }
    case 'SET_PROGRESS_TOTAL':
      return {
        ...state,
        progressTotal: action.payload.progressTotal
      }
    case 'CLEAR':
      if (state.jobId) {
        return {
          previousJobId: state.jobId,
          previousProjectId: state.projectId
        }
      }
      return {}
    default:
      return
  }
}

const initialState = { jobId: null, status: 'ready' }

const RunningJobContext = createContext(initialState)

const RunningJobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return <RunningJobContext.Provider value={{ state, dispatch }}>{children}</RunningJobContext.Provider>
}

export { RunningJobContext, RunningJobProvider }
