const router = require('express').Router()
const Auth = require('./auth-model')
const bcrypt = require('bcryptjs')
const buildToken = require('./token-builder')
const { checkCreateAccount, checkEmailUnique, checkDecodedEmailExits } = require('../middleware/checkInput')
const restricted = require('../middleware/restricted')

router.post('/register', checkCreateAccount, checkEmailUnique, (req, res, next) => {
  let user = req.body
  user.email = user.email.toLowerCase()
  const hash = bcrypt.hashSync(user.password, 8)
  user.password = hash
  Auth.Add(user)
    .then(data => {
      const token = buildToken(data[0])
      res.status(200).json({
        user_id: data.user_id,
        username: data.username,
        token
      })
    })
    .catch(next)
});

router.get('/getall', (req, res) => {
  Auth.getAll()
    .then(data => {
      res.json(data)
    })
})

router.post('/login', (req, res, next) => {
  req.body.email = req.body.email.toLowerCase()
  const { email, password } = req.body
  Auth.findBy({ email })
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = buildToken(user)
        res.status(200).json({
          user_id: user.user_id,
          email: user.email,
          token
        })
      } else {
        next({
          status: 401,
          message: 'invalid credentials'
        })
      }
    })
    .catch(next)
});

router.put('/update', restricted, checkEmailUnique, checkDecodedEmailExits, (req, res, next) => {
  const email = req.decodedJwt.email
  Auth.update(email, req.body)
    .then(user => {
      const token = buildToken(user)
      res.status(200).json({
        user_id: user.user_id,
        email: user.email,
        token
      })
    })
    .catch(next)
})

module.exports = router;
