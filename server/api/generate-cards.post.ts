// server/api/generate-cards.post.ts
import { spawnSync } from 'child_process'
import { join } from 'path'
import { existsSync, readFileSync, unlinkSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'

function detectPython(): string {
  if (process.env.DOCX_PYTHON) return process.env.DOCX_PYTHON
  for (const cmd of ['py', 'python', 'python3']) {
    const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' })
    if (r.status === 0 && !r.error) return cmd
  }
  return 'python'
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const selections = body?.selections

  if (!Array.isArray(selections) || selections.length === 0) {
    throw createError({ statusCode: 400, message: '沒有選擇任何桌牌' })
  }

  const assetsDir = join(process.cwd(), 'server', 'assets', 'cards')
  const scriptPath = join(assetsDir, 'generate_cards.py')

  if (!existsSync(scriptPath)) {
    throw createError({ statusCode: 500, message: `找不到 generate_cards.py（${scriptPath}）` })
  }

  const tmpDir = mkdtempSync(join(tmpdir(), 'cards-'))
  const outPath = join(tmpDir, `cards_${Date.now()}.docx`)
  const env = { ...process.env, DOCX_DIR: assetsDir }
  const pythonCmd = detectPython()

  const result = spawnSync(
      pythonCmd,
      [scriptPath, JSON.stringify(selections), outPath],
      { encoding: 'utf8', timeout: 60000, env }
  )

  // 全部 log 出來
  console.log('[generate-cards] pythonCmd:', pythonCmd)
  console.log('[generate-cards] status:', result.status)
  console.log('[generate-cards] error:', result.error)
  console.log('[generate-cards] stdout:', JSON.stringify(result.stdout))
  console.log('[generate-cards] stderr:', JSON.stringify(result.stderr))
  console.log('[generate-cards] outPath exists:', existsSync(outPath))

  if (result.error) {
    throw createError({ statusCode: 500, message: '無法執行 Python：' + result.error.message })
  }
  if (result.status !== 0) {
    throw createError({
      statusCode: 500,
      message: `Python exit ${result.status} | stderr: ${result.stderr} | stdout: ${result.stdout}`
    })
  }
  if (!existsSync(outPath)) {
    throw createError({ statusCode: 500, message: '找不到輸出檔案' })
  }

  const fileData = readFileSync(outPath)
  try { unlinkSync(outPath) } catch {}

  const filename = encodeURIComponent('桌牌_' + new Date().toISOString().slice(0, 10)) + '.docx'
  setResponseHeaders(event, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
    'Content-Length': String(fileData.length),
  })

  return send(event, fileData, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
})