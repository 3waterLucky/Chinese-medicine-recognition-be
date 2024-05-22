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
      res.send({
        code: 200,
        message: 'success',
        ...ret
      })
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
  const { userId } = req.user
  pool.execute(
    // 更新用户分数，并使playtimes字段加1
    'UPDATE game SET score = score + ?, playtimes = playtimes + 1 WHERE id = ?',
    [score, userId]
  ).then(([results]) => 
    // 查询该用户的分数
    pool.execute(
      'SELECT * FROM game WHERE id = ?',
      [userId]
    ),
    (err) => {
      res.status(500).send({
        code: 500,
        message: '提交分数失败！'
      })
    }
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success',
      totalScore: results[0].score
    }),
    (err) => {
      res.status(500).send({
        code: 500,
        message: '获取总分失败！'
      })
    }
  })
})

// 获取排行榜前10名，从game表中只能得到用户id和游戏积分score，需要从users表中获取用户名user_name（用户id在users表中的字段名为user_id）。需要返回一个数组，数组中每个元素是一个对象，包含user_name和score两个字段。
router.get('/rank', (req, res) => {
  pool.execute(
    'SELECT user_name, score FROM game, users WHERE game.id = users.user_id ORDER BY score DESC LIMIT 10'
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success',
      rankList: results
    })
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
    'SELECT * FROM game WHERE id = ?', [req.user.userId]
  ).then(([results]) => {
    const { score, playtimes } = results[0]
    res.send({
      code: 200,
      message: 'success',
      score,
      playtimes
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取游戏记录失败！'
    })
  })
})

module.exports = router