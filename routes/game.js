const express = require('express')
const router = express.Router()
const fsPromise = require('fs/promises')
const path = require('path')

router.get('/question', (req, res) => {
  const ret = {
    message: 'success',
    code: 200
  }
  fsPromise.readdir(path.join(__dirname, '../public/images/medicine'))
    .then(files => {
      let options = []
      while (new Set(options).size !== 4) {
        for (let i = 0; i < 4; i++) {
          options[i] = files[Math.floor(Math.random() * files.length)]
        }
      }
      return options
    })
    .then(options => {
      ret.answer = options[Math.floor(Math.random() * 4)]
      ret.options = options
      return ret.answer
    })
    .then(name => 
      fsPromise.readdir(path.join(__dirname, `../public/images/medicine/${name}`))
    ).then(files => {
      ret.imgSrc = `http://127.0.0.1:8080/images/medicine/${ret.answer}/${files[0]}`
      res.send(ret)
    })
})

module.exports = router