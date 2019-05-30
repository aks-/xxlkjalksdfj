const storage = require('node-persist')
const path = require('path')
const storagePath = path.resolve(__dirname, 'storage', 'pollsDb')

module.exports = async () => {
  await storage.init({
    dir: storagePath
  })

  return storage
}
