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

// for mobile
app.ws('/mobile', (ws, req) => {
  let beforeA = 0

  ws.on('message', message => {
    const data = JSON.parse(message)
    const a = data.ax * data.ax + data.ay * data.ay + data.az * data.az

    const d = beforeA - a
    if (d >= 100) {
      event.emit('shake')
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
      event.emit('shake')
    }

    a = beforeA
  })
})

// for browser
app.ws('/browser', (ws, req) => {
  const handler = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'shake',
        payload: {},
      }))
    }
  }

  event.on('shake', handler)

  ws.on('close', () => {
    event.removeListener('shake', handler)
  })
})

app.listen(process.env.PORT || 8080)
