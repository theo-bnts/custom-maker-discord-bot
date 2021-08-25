const { writeFile } = require('fs').promises
const readReplay = require('..')

(async () => {
  const start = new Date()
  const replay = await readReplay('./test.replay', false)
  await writeFile('./replay.json', JSON.stringify(replay, null, 2))
  console.log(`Took ${Date.now() - start}ms`)
})()
