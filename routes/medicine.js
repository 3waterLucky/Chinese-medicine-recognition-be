const express = require('express')
const router = express.Router()
const pool = require('../config/db.js')
const jwt = require('jsonwebtoken')
const { formidable } = require('formidable')
const fs = require('fs')
const path = require('path')

// 获取中草药列表，并设置强缓存时间为一天
router.get('/list', (req, res) => {
  pool.execute(
    'SELECT m_id, m_name FROM medicine'
  ).then(([results]) => {
    res.set('Cache-Control', 'public, max-age=86400')
    res.send({
      code: 200,
      message: 'success',
      list: results
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取中草药列表失败！'
    })
  })
})

// 获取中草药详情，并设置强缓存时间为一天
router.get('/detail', (req, res) => {
  const { m_id } = req.query
  if (m_id === -1 || m_id === undefined) {
    res.status(404).send({
      code: 404,
      message: '系统中暂无该中草药详细信息！'
    })
    return
  }
  pool.execute(
    'SELECT * FROM medicine WHERE m_id = ?',
    [m_id]
  ).then(([results]) => {
    res.set('Cache-Control', 'public, max-age=86400')
    res.send({
      code: 200,
      message: 'success',
      data: results[0]
    })
  }).catch(err => {
    console.error(err)
    // 如果在数据库中找不到这个id对应的中草药，返回404
    if (err.code === 'ER_EMPTY_QUERY') {
      res.status(404).send({
        code: 404,
        message: '该中草药不存在！'
      })
    } else {
      res.status(500).send({
        code: 500,
        message: '获取中草药详情失败！'
      })
    }
  })
})

// 收藏中草药，向数据库的collection表中插入一条记录，字段user_id为用户id，m_id为中草药id
router.post('/collect', (req, res) => {
  const { m_id } = req.body
  const { userId } = req.user 
  pool.execute(
    'INSERT INTO collection(user_id, m_id) VALUES(?, ?)',
    [userId, m_id]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '收藏失败！'
    })
  })
})

// 取消收藏
router.post('/cancelCollect', (req, res) => {
  const { m_id } = req.body
  const { userId } = req.user
  pool.execute(
    'DELETE FROM collection WHERE user_id = ? AND m_id = ?',
    [userId, m_id]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '取消收藏失败！'
    })
  })
})

// 添加中草药信息，并向数据库的medicine表中插入一条记录，字段有m_name,pinyin,other_name,origin,env,form,flavor,functions,usages
router.post('/add', (req, res) => {
  // 验证用户权限
  if (req.user.auth === 0) {
    res.status(403).send({
      code: 403,
      message: '权限不足！'
    })
    return
  }
  const formData = formidable({
    multiples: true,
    uploadDir: path.join(__dirname, '../public/images/medicine/'),
    keepExtensions: true
  })
  formData.parse(req, (err, fields, files) => {
    if (err) {
      console.error(err)
      res.status(500).send({
        code: 500,
        message: '添加中草药信息失败！'
      })
      return
    }
    fs.rename(files.image[0].filepath, path.join(__dirname, `../public/images/medicine/${fields.m_name}/example.jpg`), (err) => {
      if (err) {
        console.error(err)
        res.status(500).send({
          code: 500,
          message: '添加中草药信息失败！'
        })
        return
      }
      pool.execute(
        'INSERT INTO medicine(m_name, pinyin, other_name, origin, env, form, flavor, functions, usages) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [fields.m_name, fields.pinyin, fields.other_name, fields.origin, fields.env, fields.form, fields.flavor, fields.functions, fields.usages]
      ).then(([results]) => {
        res.send({
          code: 200,
          message: 'success',
          m_id: results.insertId
        })
      }).catch(err => {
        console.error(err)
        res.status(500).send({
          code: 500,
          message: '添加中草药信息失败！'
        })
      })
    })
  })
})

// 获取用户收藏夹信息，从collection表中获取用户收藏的中草药m_id，再从medicine表中获取中草药名称m_name，返回一个数组，数组中每个元素是一个对象，包含m_id和m_name两个字段
router.get('/collection', (req, res) => {
  const { userId } = req.user
  pool.execute(
    'SELECT medicine.m_id, m_name FROM collection, medicine WHERE collection.m_id = medicine.m_id AND user_id = ?',
    [userId]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success',
      list: results
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取收藏夹信息失败！'
    })
  })
})

// 获取中草药详情列表
router.get('/detailList', (req, res) => {
  pool.execute(
    'SELECT * FROM medicine'
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success',
      list: results
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取中草药详情列表失败！'
    })
  })
})

module.exports = router