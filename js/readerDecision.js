/* Determines whether a page should redirect to reader view based on visit history */

const readerDecision = {
  shouldRedirect: function (url) {
    /*
    returns:
        -1: never redirect, even if the page is confirmed to be readerable
        0: redirect once the page is confirmed to be readerable
        1: redirect even before the page is confirmed to be readerable
    */

    try {
      if (readerDecision.info.domainStatus[new URL(url).hostname] === true) {
        if (readerDecision.info.URLStatus[url]) {
          if (readerDecision.info.URLStatus[url].isReaderable === true) {
            return 1
          } else if (readerDecision.info.URLStatus[url].isReaderable === false) {
            return -1
          }
        } else {
          return 0
        }
      }
    } catch (e) {
      console.warn('failed to parse URL', url, e)
    }

    return -1
  },
  setDomainStatus: function (url, autoRedirect) {
    readerDecision.info.domainStatus[new URL(url).hostname] = autoRedirect
    saveData()
  },
  getDomainStatus: function (url) {
    return readerDecision.info.domainStatus[new URL(url).hostname]
  },
  setURLStatus(url, isReaderable) {
    readerDecision.info.URLStatus[url] = {lastVisit: Date.now(), isReaderable}
    saveData()
  },
  getURLStatus: function (url) {
    return readerDecision.info.URLStatus[url].isReaderable
  },
  getSameDomainStatuses: function (url) {
    var results = []
    for (var itemURL in readerDecision.info.URLStatus) {
      try {
        if (new URL(itemURL).hostname === new URL(url).hostname && itemURL !== url) {
          results.push(readerDecision.info.URLStatus[itemURL])
        }
      } catch (e) {}
    }

    return results
  }
}

function loadData () {
  try {
    readerDecision.info = JSON.parse(localStorage.getItem('readerData')).data
  } catch (e) {}

  if (!readerDecision.info) {
    readerDecision.info = {
      domainStatus: {},
      URLStatus: {}
    }
  }
}

function saveData () {
  localStorage.setItem('readerData', JSON.stringify({version: 1, data: readerDecision.info}))
}

function cleanupData () {
  var removedEntries = false
  for (var url in readerDecision.info.URLStatus) {
    if (Date.now() - readerDecision.info.URLStatus[url].lastVisit > 6 * 7 * 24 * 60 * 60 * 1000) {
      delete readerDecision.info.URLStatus[url]
      removedEntries = true
    }
  }
  return removedEntries
}

loadData()
if (cleanupData()) {
  saveData()
}

window.addEventListener('storage', function (e) {
  if (e.key === 'readerData') {
    loadData()
  }
})

if (typeof module !== 'undefined') {
  module.exports = readerDecision
}
