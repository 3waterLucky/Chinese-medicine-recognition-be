var express = require('express');
var router = express.Router();
const pool = require('../config/db.js')
const jwt = require('jsonwebtoken')

const genToken = (user) => {
  return jwt.sign(
    {
      userId: user.user_id,
      userAccount: user.user_account,
      userName: encodeURIComponent(user.user_name),
      auth: user.auth
    },
    'zjz-ujs',
    {
      expiresIn: '1d'
    }
  )
}

// 注册
router.post('/register', (req, res) => {
  const { account, name,  pwd } = req.body
  pool.execute(
    'INSERT INTO users(user_account, user_name, pwd) VALUES(?, ?, ?)',
    [account, name, pwd]
  ).then(([results]) => {
    const id = results.insertId
    const token = genToken({ user_id: id, user_account: account, user_name: name, auth: 0 })
    res.status(201).send({
      code: 200,
      message: 'success',
      token
    })
  }).catch(err => {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).send({
        code: 409,
        message: '账号已存在！'
      })
    } else {
      res.status(500).send({
        code: 500,
        message: '注册失败！'
      })
    }
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
    const token = genToken(user)
    res.send({
      code: 200,
      message: 'success',
      token
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '登录失败！'
    })
  })
})

// 获取所有用户信息的列表
router.get('/list', (req, res) => {
  pool.execute(
    'SELECT auth FROM users WHERE user_id = ?',
    [req.user.userId]
  ).then(([results]) => {
    // 如果用户权限不为0
    if (results[0].auth !== 0) {
      // 将users表和game表连接查询，查询所有用户的信息
      pool.execute(
        'SELECT user_id, user_account, user_name, auth, score, playtimes FROM users JOIN game ON users.user_id = game.id'
      ).then(([results]) => {
        res.send({
          code: 200,
          message: 'success',
          users: results
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
router.post('/logout', (req, res) => {
  res.send({
    code: 200,
    message: 'success'
  })
})

// 修改用户信息
router.post('/modify', (req, res) => {
  const { user_name, pwd } = req.body
  const { userId } = req.user
  pool.execute(
    'UPDATE users SET user_name = ?, pwd = ? WHERE user_id = ?',
    [user_name, pwd, userId]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '修改用户信息失败！'
    })
  })
})

// 删除用户
// 先从game表中删除用户信息，再collection表中删除用户信息，最后删除users表中的用户信息
router.delete('/delete', (req, res) => {
  const { userId } = req.body
  pool.execute(
    'SELECT auth FROM users WHERE user_id = ?',
    [userId]
  ).then(([results]) => {
    return results[0].auth
  }).then(auth => {
    if (req.user.auth === 0 || (req.user.auth === 1 && auth !== 0)) {
      return Promise.reject(403)
    }
  }).then(() => {
    return pool.execute(
      'DELETE FROM game WHERE id = ?',
      [userId]
  )}).then(() => {
    return pool.execute(
      'DELETE FROM collection WHERE user_id = ?',
      [userId]
    )
  }).then(() => {
    return pool.execute(
      'DELETE FROM users WHERE user_id = ?',
      [userId]
    )
  }).then(() => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    if (err === 403) {
      res.status(403).send({
        code: 403,
        message: '权限不足！'
      })
      return
    } else {
      res.status(500).send({
        code: 500,
        message: '删除用户失败！'
      })
    }
  })
})

// 添加用户
router.post('/add', (req, res) => {
  const { account, name, pwd, auth } = req.body
  if (req.user.auth === 0 || (req.user.auth === 1 && auth === 1)) {
    res.status(403).send({
      code: 403,
      message: '权限不足！'
    })
    return
  }
  pool.execute(
    'INSERT INTO users(user_account, user_name, pwd, auth) VALUES(?, ?, ?, ?)',
    [account, name, pwd, auth]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).send({
        code: 409,
        message: '账号已存在！'
      })
    } else {
      res.status(500).send({
        code: 500,
        message: '添加用户失败！'
      })
    }
  })
})

// 判断账号是否已存在
router.post('/checkAccount', (req, res) => {
  const { account } = req.body
  pool.execute(
    'SELECT * FROM users WHERE user_account = ?',
    [account]
  ).then(([results]) => {
    if (results.length === 0) {
      res.send({
        code: 200,
        message: 'success'
      })
    } else {
      res.send({
        code: 409,
        message: '账号已存在！'
      })
    }
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '查询失败！'
    })
  })
})

// 修改用户名、校验并修改密码
router.post('/updateInfo', (req, res) => {
  const { editName, newName, editPwd, oldPwd, newPwd } = req.body
  const { userId } = req.user
  const updateName = new Promise((resolve, reject) => {
    if (editName) {
      pool.execute(
        'UPDATE users SET user_name = ? WHERE user_id = ?',
        [newName, userId]
      ).then(() => {
        resolve()
      }).catch(err => {
        reject(err)
      })
    } else {
      resolve()
    }
  })
  const updatePwd = new Promise((resolve, reject) => {
    if (editPwd) {
      pool.execute(
        'SELECT pwd FROM users WHERE user_id = ?',
        [userId]
      ).then(([results]) => {
        if (results[0].pwd === oldPwd) {
          return pool.execute(
            'UPDATE users SET pwd = ? WHERE user_id = ?',
            [newPwd, userId]
          )
        } else {
          return Promise.reject(401)
        }
      }).then(() => {
        resolve()
      }).catch(err => {
        reject(err)
      })
    } else {
      resolve()
    }
  })
  Promise.all([updateName, updatePwd]).then(() => {
    // 生成新token
    const token = genToken({ user_id: userId, user_account: req.user.userAccount, user_name: newName, auth: req.user.auth })
    res.send({
      code: 200,
      message: 'success',
      token
    })
  }).catch(err => {
    if (err === 401) {
      res.status(401).send({
        code: 401,
        message: '密码错误！'
      })
    } else {
      res.status(500).send({
        code: 500,
        message: '修改信息失败！',
        error: err
      })
    }
  })
})

// 重置用户密码
router.post('/resetPwd', (req, res) => {
  const { userId, pwd } = req.body
  pool.execute(
    'UPDATE users SET pwd = ? WHERE user_id = ?',
    [pwd, userId]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '重置密码失败！'
    })
  })
})

module.exports = router;
