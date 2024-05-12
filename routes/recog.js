const express = require('express')
const router = express.Router()
const { exec } = require('child_process')
const { formidable } = require('formidable')
const path = require('path')
const fs = require('fs')
const dict = require('../public/javascripts/dict')
const { pool } = require('../config/db')

// 图像识别
router.post('/', (req, res) => {
  const form = formidable({
    multiples: true,
    uploadDir: path.join(__dirname, '../public/images/recog'),
    keepExtensions: true,
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send(err)
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
      }).then(() => pool.execute('SELECT m_id FROM medicine WHERE name = ?', [ret.name])
        // 从数据库的medicine表中查询ret.name的m_id
      ).then(([result]) => {
        // 将m_id放入ret中
        ret.m_id = result[0].m_id
        res.send({
          code: 200,
          message: 'success',
          data: ret
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
  pool.execute(
    'SELECT * FROM record'
  ).then(([results]) => {
    res.send(
      {
        code: 200,
        message: 'success',
        data: results
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
      data: correct / total
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send({
      code: 500,
      message: '获取准确率失败！'
    })
  })
})

module.exports = router