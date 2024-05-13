const express = require('express')
const router = express.Router()
const fsPromise = require('fs/promises')
const path = require('path')
const pool = require('../config/db.js')
const jwt = require('jsonwebtoken')

// 获取题目
router.get('/question', (req, res) => {
  const ret = {
    message: 'success',
    code: 200
  }
  jwt.verify(req.headers.authorization.split(' ')[1], 'zjz-ujs', (err, user) => {
    if (err) {
      console.error('error', err)
      res.status(401).send({
        code: 401,
        message: 'invalid token'
      })
    }
    console.log('user', user)
  })
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
    }).catch(err => {
      console.error(err)
      res.status(500).send({
        code: 500,
        message: '获取题目失败！'
      })
    })
})

// 提交分数
router.post('/score', (req, res) => {
  const { score } = req.body
  const { user_id } = req.user
  pool.execute(
    'UPDATE game SET score = score + ? WHERE id = ?', [score, user_id]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '提交分数失败！'
    })
  })
})

// 获取排行榜前10名
router.get('/rank', (req, res) => {
  pool.execute(
    'SELECT * FROM game ORDER BY score DESC LIMIT 10'
  ).then(([results]) => {
    res.send(results)
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取排行榜失败！'
    })
  })
})

// 获取用户游戏记录
router.get('/record', (req, res) => {
  pool.execute(
    'SELECT * FROM game WHERE id = ?', [req.user.user_id]
  ).then(([results]) => {
    res.send(results)
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取游戏记录失败！'
    })
  })
})

module.exports = router