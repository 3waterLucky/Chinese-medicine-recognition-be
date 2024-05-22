const express = require('express')
const router = express.Router()
const { exec } = require('child_process')
const { formidable } = require('formidable')
const path = require('path')
const fs = require('fs')
const dict = require('../public/javascripts/dict')
const pool = require('../config/db')

// 图像识别
router.post('/', (req, res) => {
  const form = formidable({
    multiples: true,
    uploadDir: path.join(__dirname, '../public/images/recog'),
    keepExtensions: true,
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send({
        code: 500,
        message: '识别失败！'
      })
      return
    }
    const imagePath = files.image[0].filepath
    exec(`activate pytorch-py36 && cd D:/Desktop/AI/PyTorch-Classification-Trainer/PyTorch-Classification-Trainer && python demo.py --image_dir="${imagePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(error)
        res.status(500).send({
          code: 500,
          message: '识别失败！'
        })
        fs.rm(imagePath, (err) => {
          console.log(err)
        })
        return
      }
      const ret = {
        code: 200,
        message: 'success'
      }
      const recogResult = stdout.split('============================================================')[2].split(',')
      ret.name = dict[recogResult[0].split(':')[1]]
      ret.score = recogResult[1].split(':')[1].slice(1, -3)
      // 在数据库record表中插入一条记录，字段recog_result的值为ret.name
      pool.execute(
        'INSERT INTO record(recog_result) VALUES(?)',
        [ret.name]
      ).then(([results]) => {
        const id = results.insertId
        ret.recog_id = id
        // 将图片重命名为id.jpg
        fs.rename(imagePath, path.join(__dirname, `../public/images/recog/${id}.jpg`), (err) => {
          console.log(err)
        })  
        // TODO: 将中草药数据录入数据库，否则以下无法执行
      }).then(() => pool.execute('SELECT m_id FROM medicine WHERE m_name = ?', [ret.name])
        // 从数据库的medicine表中查询ret.name的m_id
      ).then(([result]) => {
        // 将m_id放入ret中
        if (result.length === 0) {
          ret.m_id = -1
        } else {
          ret.m_id = result[0].m_id
        }
        res.send({
          code: 200,
          message: 'success',
          ...ret
        })
      }).catch(err => {
        console.error(err)
        res.status(500).send({
          code: 500,
          message: '识别失败！'
        })
      })
    })
  })
})

// 用户评价
router.post('/evaluate', (req, res) => {
  const { id, score } = req.body
  pool.execute(
    'UPDATE record SET score = ? WHERE id = ?',
    [score, id]
  ).then(([results]) => {
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '评价失败！'
    })
  })
})

// 获取识别记录
router.get('/record', (req, res) => {
  // 验证用户权限
  if (req.user.auth === 0) {
    res.status(403).send({
      code: 403,
      message: '权限不足！'
    })
    return
  }
  pool.execute(
    'SELECT * FROM record'
  ).then(([results]) => {
    res.send(
      {
        code: 200,
        message: 'success',
        records: results
      }
    )
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取识别记录失败！'
    })
  })
})

// 获取识别准确率，从record表中找到所有score不为2的记录，计算其中score为1的比例
router.get('/accuracy', (req, res) => {
  pool.execute(
    'SELECT * FROM record WHERE score != 2'
  ).then(([results]) => {
    const total = results.length
    const correct = results.filter(item => item.score === 1).length
    res.send({
      code: 200,
      message: 'success',
      accuracy: correct / total
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取准确率失败！'
    })
  })
})

// record表中有recog_date字段，类型为DATETIME，存储识别日期。从record表中统计近七日每日识别次数。
router.get('/sevenDayData', (req, res) => {
  pool.execute(
    'SELECT recog_date FROM record WHERE recog_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
  ).then(([results]) => {
    const daily = new Array(7).fill(0)
    const today = new Date()
    results.forEach(item => {
      const date = new Date(item.recog_date)
      const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24))
      daily[6- diff]++
    })
    res.send({
      code: 200,
      message: 'success',
      daily
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取数据失败！'
    })
  })
})

module.exports = router