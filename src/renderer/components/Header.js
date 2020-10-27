import { Breadcrumbs, makeStyles } from '@material-ui/core'
import HomeIcon from '@material-ui/icons/Home'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import SettingsIcon from '@material-ui/icons/Settings'
import React from 'react'
import { Link } from 'react-router-dom'

const useStyles = makeStyles({
  header: {
    display: 'grid',
    gridTemplateColumns: '1fr 35px',
    gridTemplateRows: '1fr'
  },
  breadcrumbs: {
    gridRow: 1,
    gridColumn: 1
  },
  gear: {
    gridRow: 1,
    gridColumn: 2,
    marginTop: 'auto',
    marginBottom: 'auto'
  }
})

export default ({ children }) => {
  const classes = useStyles()

  return (
    <header className={classes.header}>
      <Breadcrumbs className={classes.breadcrumbs} separator={<NavigateNextIcon fontSize="small" />}>
        <Link to="/">
          <HomeIcon /> Home
        </Link>
        {children}
      </Breadcrumbs>
      <Link className={classes.gear} to="/preferences">
        <SettingsIcon />
      </Link>
    </header>
  )
}
