const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const path = require('path')
const session = require('express-session')
const livereload = require('connect-livereload')
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cookieParser())
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 60000
  }
}))

app.use(livereload())

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const usersDb = require('./usersDb')
app.get('/signup', async (req, res) => {
  if (isLoggedIn(req)) {
    return res.redirect('/polls')
  }

  res.render('signup')
})

app.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body
  const usersStorage = await usersDb()

  if (password !== confirmPassword) {
    throw new Error('Passwords should be equal')
  }

  try {
    if (await usersStorage.getItem(username)) {
      throw new Error('user already exists.')
    }
    await usersStorage.setItem(username, {
      password,
      poll: null
    })
    res.send('success!')
  } catch (e) {
    console.error(e)
    res.json(e.message)
  }
})

app.get('/logout', async (req, res) => {
  await req.session.destroy()
  return res.redirect('/')
})

app.get('/', async (req, res) => {
  if (isLoggedIn(req)) {
    return res.redirect('/polls')
  }

  res.render('index')
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const usersStorage = await usersDb()

  try {
    const savedPassword = (await usersStorage.getItem(username)).password
    if (savedPassword !== password) {
      throw new Error('username or password is wrong')
    }

    req.session.username = username
    await req.session.save()
    return res.redirect('/polls')
  } catch (e) {
    console.error(e)
    return res.json(e.message)
  }
})

const pollsDb = require('./pollsDb')
app.get('/polls', async (req, res) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/')
  }

  try {
    const pollsStorage = await pollsDb()
    const polls = await pollsStorage.keys()
    return res.render('polls', {
      polls
    })
  } catch (e) {
    console.error(e)
    return res.json(e)
  }
})

app.post('/poll', async (req, res) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/')
  }

  const { poll } = req.body
  try {
    const pollsStorage = await pollsDb()
    const usersStorage = await usersDb()
    const { username } = req.session

    const user = await usersStorage.getItem(username)
    await usersStorage.setItem(username, Object.assign({}, user, {
      poll
    }))

    const pollCount = Number(await pollsStorage.getItem(poll)) + 1
    await pollsStorage.setItem(poll, pollCount)

    return res.send('success')
  } catch (e) {
    console.error(e)
    return res.json(e)
  }
})

const isLoggedIn = req => !!req.session.username

app.listen(3000)
