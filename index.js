'use strict'

const EventEmitter = require('events')
const path = require('path')

const WebSocket = require('ws')
const express = require('express')
const expressWs = require('express-ws')
const morgan = require('morgan')
const serveStatic = require('serve-static')

const app = express()

expressWs(app)
app.use(morgan('dev'))
app.use(serveStatic(path.join(__dirname, 'public')))

var event = new EventEmitter

const fixAccelValue = (v) => {
  return (parseFloat(v, 0.0) || 0.0) / 120.0
}

app.get('/shake/:id/:type', (req, res) => {
    event.emit('shake', {
      id: parseInt(req.params.id, 10) || 0,
      type: req.params.type
    })

  res.status(200).end('ok')
})

app.get('/shake/:id/:type/:x/:y/:z', (req, res) => {
    event.emit('shake', {
      id: parseInt(req.params.id, 10) || 0,
      direction: {
        x: fixAccelValue(req.params.x),
        y: fixAccelValue(req.params.y),
        z: fixAccelValue(req.params.z)
      },
      type: req.params.type
    })

  res.status(200).end('ok')
})

// for mobile
app.ws('/mobile', (ws, req) => {
  let beforeA = 0

  ws.on('message', message => {
    const data = JSON.parse(message)
    const a = data.ax * data.ax + data.ay * data.ay + data.az * data.az

    const d = beforeA - a
    if (d >= 100) {
      event.emit('shake', {id: 1,
                           direction_x: data.ax / 500.0,
                           direction_y: data.ay / 500.0,
                           direction_z: data.az / 500.0
                          })
    }
    beforeA = a
  })
})

// for halake-kit
app.ws('/kit', (ws, req) => {
  // TODO: below is dummy implementation.
  let beforeA = 0

  ws.on('message', message => {
    const data = JSON.parse(message.data)
    const a = data.ax * data.ax + data.ay * data.ay + data.az * data.az

    const d = a - beforeA
    if (d >= 0.5) {
      event.emit('shake', {id: 1})
    }

    a = beforeA
  })
})

// for browser
app.ws('/browser', (ws, req) => {
  const handler = (data) => {
    console.log("shake event")
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'shake',
        payload: {
          id: data.id,
          direction: data.direction,
          type: data.type,
	  // soundUrl: 'http://nyanpass.com/nyanpass.mp3'
        }
      }))
    }
  }

  event.on('shake', handler)

  ws.on('close', () => {
    event.removeListener('shake', handler)
  })
})

app.listen(process.env.PORT || 8080)
