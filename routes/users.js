var express = require('express');
var router = express.Router();
const pool = require('../config/db.js')

/* GET users listing. */
router.post('/register', (req, res) => {
  const { account, name,  psw } = req.body
  pool.execute(
    'INSERT INTO users(useraccount, username, psw) VALUES(?, ?, ?)',
    [account, name, psw]
  ).then(([results]) => {
    console.log(results)
    const id = results.insertId
    console.log(id)
    res.send({
      code: 200,
      message: 'success'
    })
  }).catch(err => {
    console.error(err)
    res.status(500).send(err)
  })
});

router.post('/login', (req, res) => {

})

module.exports = router;
