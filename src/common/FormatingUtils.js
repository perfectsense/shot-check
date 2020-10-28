function formatDate(date) {
  if (!date) {
    return '-'
  }
  return new Date(date).toLocaleString()
}

function formatDuration(milliseconds) {
  var seconds = (milliseconds / 1000).toFixed(1)
  var minutes = (milliseconds / (1000 * 60)).toFixed(1)
  var hours = (milliseconds / (1000 * 60 * 60)).toFixed(1)
  var days = (milliseconds / (1000 * 60 * 60 * 24)).toFixed(1)

  if (seconds < 60) {
    return seconds + ' Seconds'
  } else if (minutes < 60) {
    return minutes + ' Minutes'
  } else if (hours < 24) {
    return hours + ' Hours'
  } else {
    return days + ' Days'
  }
}

export { formatDate, formatDuration }
