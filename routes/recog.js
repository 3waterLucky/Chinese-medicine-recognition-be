const express = require('express')
const router = express.Router()
const { exec } = require('child_process')
const { formidable } = require('formidable')
const path = require('path')
const fs = require('fs')
const dict = require('../public/javascripts/dict')

router.post('/', (req, res) => {
  const form = formidable({
    multiples: true,
    uploadDir: path.join(__dirname, '../public/images'),
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
          message: error
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
      fs.rm(imagePath, (err) => {
        if (err) {
          res.status(500).send({
            code: 500,
            message: err
          })
          return
        }
        res.send(ret)
      })
    })
  })
})

module.exports = router