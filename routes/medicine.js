const express = require('express')
const router = express.Router()
const pool = require('../config/db.js')
const jwt = require('jsonwebtoken')

// 获取中草药列表，并设置强缓存时间为一天
router.get('/list', (req, res) => {
  pool.execute(
    'SELECT * FROM medicine'
  ).then(([results]) => {
    res.set('Cache-Control', 'public, max-age=86400')
    res.send({
      code: 200,
      message: 'success',
      data: results
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send(err)
  })
})

// 获取中草药详情，并设置强缓存时间为一天
router.get('/detail', (req, res) => {
  const { id } = req.query
  pool.execute(
    'SELECT * FROM medicine WHERE id = ?',
    [id]
  ).then(([results]) => {
    res.set('Cache-Control', 'public, max-age=86400')
    res.send({
      code: 200,
      message: 'success',
      data: results[0]
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send(err)
  })
})

// 收藏中草药，向数据库的collection表中插入一条记录，字段user_id为用户id，m_id为中草药id
router.post('/collect', (req, res) => {
  const { m_id } = req.body
  const { user_id } = req.user 
  pool.execute(
    'INSERT INTO collection(user_id, m_id) VALUES(?, ?)',
    [user_id, m_id]
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

// 添加中草药信息，并向数据库的medicine表中插入一条记录，字段有m_name,pinyin,other_name,origin,env,form,flavor,functions,usages
router.post('/add', (req, res) => {
  const { m_name, pinyin, other_name, origin, env, form, flavor, functions, usages } = req.body
  // 验证用户权限
  if (req.user.auth !== 1) {
    res.status(403).send({
      code: 403,
      message: '权限不足！'
    })
    return
  }
  pool.execute(
    'INSERT INTO medicine(m_name, pinyin, other_name, origin, env, form, flavor, functions, usages) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [m_name, pinyin, other_name, origin, env, form, flavor, functions, usages]
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

// 获取用户收藏夹信息
router.get('/collectionList', (req, res) => {
  const { user_id } = req.user
  pool.execute(
    'SELECT * FROM collection WHERE user_id = ?',
    [user_id]
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
})

module.exports = router