import { createServer } from 'node:http'

const PORT = process.env.PORT || 3000

const healthServer = createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Server is running')
})

healthServer.listen(PORT, () => {
  console.log('Server is listening on port ' + PORT)
})
