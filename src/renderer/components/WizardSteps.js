import { Step, StepLabel, Stepper } from '@material-ui/core'
import React from 'react'

export default ({ activeStep }) => {
  const steps = ['Create a Project', 'Create a Site', 'Create an Environment']

  return (
    <Stepper activeStep={activeStep}>
      {steps.map((label, i) => {
        return (
          <Step key={i}>
            <StepLabel>{label}</StepLabel>
          </Step>
        )
      })}
    </Stepper>
  )
}
