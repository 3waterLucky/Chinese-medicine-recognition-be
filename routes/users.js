var express = require('express');
var router = express.Router();
const pool = require('../config/db.js')
const jwt = require('jsonwebtoken')

// 注册
router.post('/register', (req, res) => {
  const { account, name,  pwd } = req.body
  pool.execute(
    'INSERT INTO users(useraccount, username, pwd) VALUES(?, ?, ?)',
    [account, name, pwd]
  ).then(([results]) => {
    console.log(results)
    const id = results.insertId
    console.log(id)
    res.status(201).send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send(err)
  })
});

// 登录
router.post('/login', (req, res) => {
  const { account, pwd } = req.body
  pool.execute(
    'SELECT * FROM users WHERE user_account = ? AND pwd = ?',
    [account, pwd]
  ).then(([results]) => {
    if (results.length === 0) {
      res.status(401).send({
        code: 401,
        message: '账号或密码错误！'
      })
      return
    }
    const user = results[0]
    const token = 'Bearer ' + jwt.sign(
      {
        _id: user.user_id,
        name: user.user_name,
        auth: user.auth
      },
      'zjz-ujs',
      {
        expiresIn: 86400
      }
    )
    res.json({
      status: 'ok',
      data: { token: token }
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send(err)
  })
})

// 获取所有用户信息的列表
router.get('/list', (req, res) => {
  pool.execute(
    'SELECRT auth from users where user_id = ?',
    [req.user.user_id]
  ).then(([results]) => {
    // 如果用户权限为1
    if (results[0].auth === 1) {
      // 将users表和game表连接查询，查询所有用户的信息
      pool.execute(
        'SELECT * FROM users JOIN game ON users.user_id = game.id'
      ).then(([results]) => {
        res.send({
          code: 200,
          message: 'success',
          data: results
        })
      }).catch(err => {
        console.error(err)
        res.status(500).send(err)
      })
    } else {
      res.status(403).send({
        code: 403,
        message: '权限不足！'
      })
    }
  }).catch(err => {
    console.error(err)
    res.status(500).send(err)
  })
})

// 退出登录
router.get('/logout', (req, res) => {
  res.send({
    code: 200,
    message: 'success'
  })
})

// 修改用户信息
router.post('/modify', (req, res) => {
  const { user_name, pwd } = req.body
  const { user_id } = req.user
  pool.execute(
    'UPDATE users SET user_name = ?, pwd = ? WHERE user_id = ?',
    [user_name, pwd, user_id]
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

module.exports = router;
