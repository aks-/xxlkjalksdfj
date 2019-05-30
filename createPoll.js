const pollsDb = require('./pollsDb')
const pollname = process.argv[2].toUpperCase()

const createPoll = async () => {
  const storage = await pollsDb()
  try {
    if (await storage.getItem(pollname)) {
      throw new Error('poll already exits')
    }

    return storage.setItem(pollname, 0)
  } catch (e) {
    throw e
  }
}

createPoll()
  .then(() => console.log('poll is created'))
  .catch(e => console.log(e))
