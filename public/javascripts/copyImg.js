const fsPromises = require('fs/promises')
const path = require('path')

// 在/public/images/medicine下创建同名文件夹
fsPromises.readdir('D:/Desktop/AI/中草药(中药材)数据集/test/test')
  .then(res => 
    Promise.all(res.map(name => fsPromises.mkdir(path.join(__dirname, `../images/medicine/${name}`))))
  ).catch(err => {
    console.error(err)
  })

// 复制每个文件夹下的第一张图片
fsPromises.readdir('D:/Desktop/AI/中草药(中药材)数据集/test/test')
  .then(async (res) => {
    const readResult = await Promise.all(res.map(dir => fsPromises.readdir(`D:/Desktop/AI/中草药(中药材)数据集/test/test/${dir}`)))
    return [res, readResult]
  })
  .then(res => 
    Promise.all(res[1].map((imgs, index) => 
      fsPromises.copyFile(`D:/Desktop/AI/中草药(中药材)数据集/test/test/${res[0][index]}/${imgs[0]}`, path.join(__dirname, `../images/medicine/${res[0][index]}/${imgs[0]}`))
    ))
  ).then(() => {
    console.log('success')
  }).catch(err => {
    console.error(err)
  })

module.exports = fsPromises