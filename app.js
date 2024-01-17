const express = require('express')
const crypto = require('node:crypto')
const movies = require('./movies.json')
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')

app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com'
    ]
    if (ACCEPTED_ORIGINS.includes(origin)) {
      callback(null, true)
    }

    if (!origin) {
      callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))

app.get('/movies', (req, res) => {
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  return res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (!result.success) {
    return res.status(422).json({ error: JSON.parse(result.error.message) })
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  movies.push(newMovie)
  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(422).json({ error: JSON.parse(result.error.message) })
  }
  const { id } = req.params
  const movie = movies.findIndex(movie => movie.id === id)
  if (movie === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updatedMovie = {
    ...movies[movie],
    ...result.data
  }
  movies[movie] = updatedMovie
  return res.json(updatedMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.findIndex(movie => movie.id === id)
  if (movie === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }
  movies.splice(movie, 1)
  return res.json({ message: 'Movie deleted' })
})

const port = process.env.PORT ?? 1234

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`)
})
