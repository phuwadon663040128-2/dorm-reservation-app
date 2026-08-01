import { spawnSync } from 'node:child_process'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { createBrotliCompress, createGzip } from 'node:zlib'

function option(name, fallback) {
  const exact = process.argv.indexOf(`--${name}`)
  if (exact >= 0) return process.argv[exact + 1] ?? fallback
  return process.argv.find(value => value.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || fallback
}

const host = option('host', process.env.HOST || '127.0.0.1')
const port = Number(option('port', process.env.PORT || '4173'))
const customRoot = option('root', '')
const outputRoot = resolve(customRoot || '.output/public')
const outputEntry = join(outputRoot, 'index.html')

if (!existsSync(outputEntry)) {
  if (customRoot) {
    console.error(`ไม่พบไฟล์ static entry ที่ระบุ: ${outputEntry}`)
    process.exit(1)
  }

  console.log('ยังไม่มี production build — กำลังรัน npm run build ให้อัตโนมัติ...')
  const npmCli = process.env.npm_execpath
  const build = npmCli
    ? spawnSync(process.execPath, [npmCli, 'run', 'build'], { stdio: 'inherit' })
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' })

  if (build.error) {
    console.error(`ไม่สามารถเริ่ม production build ได้: ${build.error.message}`)
    process.exit(1)
  }
  if (build.status !== 0) process.exit(build.status ?? 1)
  if (!existsSync(outputEntry)) {
    console.error(`build สำเร็จแต่ไม่พบไฟล์ static entry: ${outputEntry}`)
    process.exit(1)
  }
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function resolveRequest(pathname) {
  const decoded = decodeURIComponent(pathname).replaceAll('/', sep)
  const candidate = normalize(join(outputRoot, decoded))
  if (candidate !== outputRoot && !candidate.startsWith(`${outputRoot}${sep}`)) return null

  const attempts = [candidate]
  if (!extname(candidate)) attempts.push(`${candidate}.html`, join(candidate, 'index.html'))

  return attempts.find(path => existsSync(path) && statSync(path).isFile()) ?? null
}

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`)
  let filePath
  try {
    filePath = resolveRequest(url.pathname)
  } catch {
    response.writeHead(400).end('Bad request')
    return
  }

  if (!filePath) {
    const notFound = join(outputRoot, '404.html')
    if (!existsSync(notFound)) {
      response.writeHead(404).end('Not found')
      return
    }
    filePath = notFound
    response.statusCode = 404
  }

  const extension = extname(filePath).toLowerCase()
  const pathname = url.pathname
  const immutable = pathname.startsWith('/_nuxt/')
    || pathname.startsWith('/fonts/')
    || pathname.startsWith('/personnel-images/')
    || pathname.startsWith('/plans/')

  response.setHeader('Content-Type', contentTypes[extension] || 'application/octet-stream')
  response.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache')
  response.setHeader('Vary', 'Accept-Encoding')

  const accepts = request.headers['accept-encoding'] || ''
  const compressible = ['.css', '.html', '.js', '.json', '.svg'].includes(extension)
  const stream = createReadStream(filePath)

  if (compressible && accepts.includes('br')) {
    response.setHeader('Content-Encoding', 'br')
    stream.pipe(createBrotliCompress()).pipe(response)
  } else if (compressible && accepts.includes('gzip')) {
    response.setHeader('Content-Encoding', 'gzip')
    stream.pipe(createGzip()).pipe(response)
  } else {
    stream.pipe(response)
  }
})

server.listen(port, host, () => {
  console.log(`Nuxt production preview: http://${host}:${port}`)
})
