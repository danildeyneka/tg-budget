import { createServer } from 'node:http'

const PORT = process.env.PORT || 3000
const NINE_MINUTES = 9 * 60 * 10_000

export const initHealthServer = () => {
  const isDev = !!process.env.DEV_MODE
  const serverUrl = process.env.PING_HOSTING_URL

  if (isDev) return console.log('DEVELOPMENT MODE')

  const healthServer = createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Server is running')
  })

  healthServer.listen(PORT, () => {
    console.log('Server is listening on port ' + PORT)
  })

  if (!serverUrl && !isDev) return
  setInterval(() => ping(serverUrl!), NINE_MINUTES)
}

async function ping(server: string) {
  try {
    const res = await fetch(server).then(res => res.ok)
    if (res) console.log(`Pinged successfully at ${new Date().toLocaleString()}`)
  }
  catch (err) {
    console.log('Error in ping', err)
  }
}
