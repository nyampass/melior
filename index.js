const path = require('path')

const express = require('express')
const expressWs = require('express-ws')
const serveStatic = require('serve-static')
const morgan = require('morgan')

const app = express()

expressWs(app)
app.use(morgan('dev'))
app.use(serveStatic(path.join(__dirname, 'public')))

app.ws('/kit', (ws, req) => {
})

app.ws('/browser', (ws, req) => {
  const id = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'shake',
      payload: {},
    }))
  }, 1000)

  ws.on('close', () => {
    clearInterval(id)
  })
})

app.listen(process.env.PORT || 8080)
