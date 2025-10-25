import { createServer } from 'node:http'

const PORT = process.env.PORT || 10000
const FOURTEEN_MINS = 14 * 60 * 10_000

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

  console.log(!serverUrl, isDev, PORT)
  if (!serverUrl || isDev) return
  setInterval(() => ping(serverUrl!), FOURTEEN_MINS)
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
