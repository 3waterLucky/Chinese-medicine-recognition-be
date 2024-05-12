const express = require('express')
const router = express.Router()
const fsPromise = require('fs/promises')
const path = require('path')
const pool = require('../config/db.js')

// 获取题目
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
    res.status(500).send(err)
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
    res.status(500).send(err)
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
    res.status(500).send(err)
  })
})

module.exports = router