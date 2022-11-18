const _ = require('lodash');
const Axios = require('axios');
const fs = require('fs');
const Fse = require('fs-extra');
const consola = require('consola');

const FileConvertSize = require('./fileConvertSize.js')


const ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36';

function getRandomIP() {
  return _.range(4)
    .map(() => _.random(0, 255))
    .join('.');
}

function saveStream2File(stream, filePath) {
  return new Promise((reslove, reject) => {
    stream.pipe(Fse.createWriteStream(filePath));
    stream.on('end', () => {
      reslove();
    });
    stream.on('error', e => {
      reject(e);
    });
  });
}

async function getTinied(sourcePath, outputPath, retry = 10) {
  return await Axios.post(
    'https://tinypng.com/web/shrink',
    Fse.readFileSync(sourcePath),
    {
      headers:
        {
          'Content-Type': 'image/png',
          'User-Agent': ua,
          'X-Forwarded-For': getRandomIP(),
        },
    })
    .then(({ data }) => {
      return Axios.get(data.output.url, {
          responseType: 'stream',
          headers: { 'User-Agent': ua },
      })
    })
    .then(({ data }) => {
      return saveStream2File(data, outputPath)
    })
    .catch(e => {
      if (retry <= 0) {
        consola.error(`ERROR ${sourcePath}`);
        throw e;
          }
      }
  );
}

async function downloadTinied(sourcePath, outputPath, fileName, index) {
  const inputSize = Fse.statSync(sourcePath).size
  await getTinied(sourcePath, outputPath);
  const outputSize = Fse.statSync(outputPath).size
  return {
    fileName,
    inputSize,
    outputSize,
    inputFormatSize: FileConvertSize(inputSize),
    outputFormatSize: FileConvertSize(outputSize),
    percentage: `${parseInt(100 - (outputSize * 100 /inputSize))}%` }
}

module.exports = { downloadTinied };