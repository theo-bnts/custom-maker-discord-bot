const { spawn } = require('child_process')
const { isAbsolute, join } = require('path')

const readReplay = async (filePath, parseFull = false) => {
  const [eliminations, gameData, header, killFeed, mapData, playerData, stats, teamData, teamStats] = await new Promise((res) => {
    const startArgs = [isAbsolute(filePath) ? filePath : join(process.cwd(), filePath), parseFull ? 'Full' : 'Normal']
    const replayProc = spawn(process.platform === 'linux' ? './NodeReplayBindings-linux' : 'NodeReplayBindings-win.exe', startArgs, { cwd: join(__dirname, 'bin') })
    const dataChunks = []
    replayProc.stdout.on('data', (d) => {
      dataChunks.push(d)
    })
    replayProc.stdout.once('end', () => {
      const output = Buffer.concat(dataChunks)
        .toString()
        .split(process.platform === 'linux' ? /(?<=(\]|\}))\n(?=(\[|\{))/g : /(?<=(\]|\}))\r\n(?=(\[|\{))/g)
        .filter((s) => s && !['{', '}', '[', ']'].includes(s))
        .map((s) => JSON.parse(s))
      res(output)
    })
  })
  return { eliminations, gameData, header, killFeed, mapData, playerData, stats, teamData, teamStats }
}

module.exports = readReplay
