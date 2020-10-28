import { Button, FormControlLabel, makeStyles, Popover, Slider, Switch, TextField, Typography } from '@material-ui/core'
import HelpIcon from '@material-ui/icons/Help'
import SettingsIcon from '@material-ui/icons/Settings'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import {
  deleteDefaultBreakpoints,
  getChromiumPath,
  getDefaultBreakpoints,
  getScrollSpeed,
  isChromiumHeadless,
  saveChromiumHeadless,
  saveChromiumPath,
  saveDefaultBreakpoints,
  saveScrollSpeed
} from '../../common/ConfigurationStore'
import Footer from './Footer'
import Header from './Header'

const useStyles = makeStyles({
  main: {
    display: 'grid',
    gridTemplateColumns: '75px repeat(5, 1fr) 75px',
    gridTemplateRows: '2em min-content 5em'
  },
  form: {
    gridRow: '2',
    gridColumn: '2 / 7'
  },
  sliderLabel: {
    marginTop: '1em'
  },
  breakpointLabelWrapper: {
    display: 'grid',
    gridTemplateColumns: '420px 200px',
    marginTop: '1em',
    marginBottom: '1em'
  },
  numBreakpointsLabel: {
    gridColumn: 1
  },
  turboToolTipIcon: {
    gridColumn: 2,
    cursor: 'pointer'
  },
  turboNote: {
    padding: '.5em',
    backgroundColor: '#FFFFDD',
    width: '400px'
  },
  numBreakpoints: {
    width: '300px'
  },
  breakpointGroup: {
    display: 'grid',
    gridTemplateColumns: '400px 300px',
    marginBottom: '1em'
  },
  breakpointTurbo: {
    marginLeft: '1em'
  }
})

export default () => {
  const classes = useStyles()

  const [chromiumPath, setChromiumPath] = useState(() => getChromiumPath())
  const [scrollSpeed, setScrollSpeed] = useState(() => getScrollSpeed())
  const [defaultBreakpoints, setDefaultBreakpoints] = useState(() => getDefaultBreakpoints())
  const [numBreakpoints, setNumBreakpoints] = useState(() => defaultBreakpoints.length)
  const [autoscrollTipAnchorEl, setAutoscrollTipAnchorEl] = useState(null)
  const [chromiumHeadless, setChromiumHeadless] = useState(() => isChromiumHeadless())
  const { enqueueSnackbar } = useSnackbar()

  const handleSave = () => {
    saveChromiumPath(chromiumPath)
    saveScrollSpeed(scrollSpeed)
    saveDefaultBreakpoints(defaultBreakpoints)
    saveChromiumHeadless(chromiumHeadless)
    enqueueSnackbar('Preferences Saved!', { variant: 'success' })
  }

  const handleResetBreakpoints = () => {
    deleteDefaultBreakpoints()
    const breakpoints = getDefaultBreakpoints()
    setDefaultBreakpoints(breakpoints)
    setNumBreakpoints(breakpoints.length)
  }

  const initBreakpoints = (num) => {
    const newBreakpoints = []
    let lastBreakpointWidth = 0
    for (let i = 0; i < num; i++) {
      if (defaultBreakpoints[i]) {
        newBreakpoints[i] = defaultBreakpoints[i]
        lastBreakpointWidth = newBreakpoints[i].width
      } else {
        lastBreakpointWidth = parseInt(lastBreakpointWidth * 1.618)
        newBreakpoints[i] = {
          width: lastBreakpointWidth,
          turboAutoscroll: i > 0
        }
      }
    }
    setDefaultBreakpoints(newBreakpoints)
  }

  const handleChangeNumBreakpoints = (num) => {
    setNumBreakpoints(num)
    initBreakpoints(num)
  }

  const handleChangeBreakpointTurbo = (i, val) => {
    const newBreakpoints = [...defaultBreakpoints]
    newBreakpoints[i].turboAutoscroll = val
    setDefaultBreakpoints(newBreakpoints)
  }

  const handleChangeBreakpointWidth = (i, val) => {
    const newBreakpoints = [...defaultBreakpoints]
    newBreakpoints[i].width = val
    setDefaultBreakpoints(newBreakpoints)
  }

  const autoscrollTipOpen = Boolean(autoscrollTipAnchorEl)

  return (
    <>
      <Header>
        <a>
          <SettingsIcon /> Preferences
        </a>
      </Header>
      <main className={classes.main}>
        <div className={classes.form}>
          <TextField
            label="Chrome Browser Executable Path"
            variant="outlined"
            fullWidth={true}
            autoFocus={true}
            value={chromiumPath}
            helperText="Leave blank to use the built-in Chromium. Load chrome://version in Chrome and look for the Executable Path."
            onChange={(e) => setChromiumPath(e.target.value)}
          />

          <FormControlLabel
            className={classes.chromiumHeadless}
            control={
              <Switch
                name="chromiumHeadless"
                checked={chromiumHeadless}
                onChange={(_, val) => setChromiumHeadless(val)}
              />
            }
            label="Run Chrome in Headless mode?"
            helperText="Uncheck this to troubleshoot unexpected problems"
          />

          <Typography className={classes.sliderLabel} gutterBottom>
            Auto-Scroll Speed
          </Typography>
          <Slider
            step={1}
            min={0}
            max={100}
            value={scrollSpeed}
            onChange={(_, val) => setScrollSpeed(val)}
            valueLabelDisplay="auto"
          />

          <div className={classes.breakpointLabelWrapper}>
            <Typography className={classes.numBreakpointsLabel} gutterBottom>
              Number of Breakpoints
              <Slider
                step={1}
                min={1}
                max={10}
                className={classes.numBreakpoints}
                value={numBreakpoints}
                onChange={(_, val) => setNumBreakpoints(val)}
                onChangeCommitted={(_, val) => handleChangeNumBreakpoints(val)}
                valueLabelDisplay="auto"
              />
            </Typography>
            <Typography className={classes.turboToolTipIcon} onClick={(e) => setAutoscrollTipAnchorEl(e.currentTarget)}>
              <HelpIcon fontSize="small" /> Turbo Autoscroll?
            </Typography>
            <Popover
              open={autoscrollTipOpen}
              anchorEl={autoscrollTipAnchorEl}
              onClose={(e) => setAutoscrollTipAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center'
              }}
            >
              <Typography className={classes.turboNote}>
                The purpose of Autoscroll is to slowly scroll down the entire page to download lazy-loaded images or
                other assets before capturing a screenshot. Turbo Autoscroll can improve performance by speeding through
                the "autoscroll" step on breakpoints for which the content has already been loaded.
                <br />
                If different content is lazy-loaded on large breakpoints, disable Turbo Autoscroll on each breakpoint
                that loads new content.
              </Typography>
            </Popover>
          </div>
          {defaultBreakpoints.map((breakpoint, i) => (
            <div key={i} className={classes.breakpointGroup}>
              <TextField
                className={classes.breakpointWidth}
                label={`Breakpoint ${i + 1}`}
                variant="outlined"
                helperText="Width in pixels"
                value={breakpoint.width}
                onChange={(e) => handleChangeBreakpointWidth(i, parseInt(e.target.value))}
              />
              <FormControlLabel
                className={classes.breakpointTurbo}
                control={
                  <Switch
                    name="turboAutoscroll"
                    checked={breakpoint.turboAutoscroll}
                    onChange={(_, val) => handleChangeBreakpointTurbo(i, val)}
                  />
                }
                label="Turbo Autoscroll?"
              />
            </div>
          ))}
        </div>
      </main>
      <Footer>
        <Button disableElevation variant="contained" color="default" onClick={handleResetBreakpoints}>
          Reset Breakpoints
        </Button>
        <Button disableElevation variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      </Footer>
    </>
  )
}
