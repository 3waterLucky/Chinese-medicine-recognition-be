const { pinyin } = require('pinyin')
const path = require('path')
const fsPromises = require('fs/promises')

fsPromises.readdir('D:/Desktop/AI/中草药(中药材)数据集/test/test')
  .then(files => {
    const wordToPinyin = {}
    const pinyinToWord = {}
    for (const name of files) {
      const toPinyin = pinyin(name, { style: 'normal' }).join('')
      wordToPinyin[name] = toPinyin
      pinyinToWord[toPinyin] = name
    }
    return [wordToPinyin, pinyinToWord]
  }).then(data => {
    const [wordToPinyin, pinyinToWord] = data
    let wordToPinyinStr = JSON.stringify(wordToPinyin).split('')
    let pinyinToWordStr = JSON.stringify(pinyinToWord).split('')
    for (let i = 0; i < wordToPinyinStr.length; i++) {
      if (wordToPinyinStr[i] === ':') {
        wordToPinyinStr.splice(i + 1, 0, ' ')
      }
      if (wordToPinyinStr[i] === ',') {
        wordToPinyinStr.splice(i + 1, 0, '\n')
      }
    }
    for (let i = 0; i < pinyinToWordStr.length; i++) {
      if (pinyinToWordStr[i] === ':') {
        pinyinToWordStr.splice(i + 1, 0, ' ')
      }
      if (pinyinToWordStr[i] === ',') {
        pinyinToWordStr.splice(i + 1, 0, '\n')
      }
    }
    fsPromises.writeFile('D:/Desktop/wordToPinyin.txt', wordToPinyinStr.join(''))
    fsPromises.writeFile('D:/Desktop/pinyinToWord.txt', pinyinToWordStr.join(''))
  })

  module.exports = fsPromises