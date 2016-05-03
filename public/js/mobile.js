(function () {
  'use strict'

  var ws = new WebSocket('ws://' + location.host + '/mobile')

  window.addEventListener('devicemotion', function (event) {
    var acc = event.accelerationIncludingGravity

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ax: acc.x, ay: acc.y, az: acc.z,
      }))
    }
  })
})()
