#! /usr/bin/env node
const Fse = require('fs-extra');
const path = require('path')
const cliProgress = require('cli-progress');
const consola = require('consola')

const tinified = require('./tinified.js')
const FileConvertSize = require('./fileConvertSize.js')

const [, ,source, output = source] = process.argv
const Promise = require('bluebird')

const total = {
  input: 0,
  output: 0
}

const getAllFiles = function(dirPath, arrayOfFiles) {
  files = Fse.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (Fse.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else if (file.match(/(\.png|\.jpg|\.JPG|\.jpeg)$/)) {
      arrayOfFiles.push(path.join(dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

function compressDir(sourceDir, outputDir) {
  const files = getAllFiles(sourceDir)
  const concurrency = 20;
  const progressBar = new cliProgress.SingleBar({format:' {bar} | {percentage}% | {filename} | {value}/{total}'}, cliProgress.Presets.shades_classic);
  progressBar.start(files.length, -1);

  try {
    Promise.map(files, (file) => {
      const filename = file.substring(file.lastIndexOf('/')+1)
      progressBar.increment({filename});
      return tinified.downloadTinied(file, file, filename)
    },
    { concurrency }
    ).then(data => {

      progressBar.increment();
      progressBar.stop();
      
      data.forEach(file => {
        total.input += file.inputSize,
        total.output += file.outputSize
      })
      consola.info(`\nTerminé: ${FileConvertSize(total.input)} | ${FileConvertSize(total.output)} | ${parseInt(100 - (total.output * 100 /total.input))}%`)
      console.table(data.map(file => {
        return {
          fileName: file.fileName, 
          inputSize: file.inputFormatSize, 
          outputSize: file.outputFormatSize, 
          percentage: file.percentage
        }
      }))

      consola.info(`\nTerminé: ${FileConvertSize(total.input)} | ${FileConvertSize(total.output)} | ${parseInt(100 - (total.output * 100 /total.input))}%`)
    });
  } catch (err) {
    console.log(err);
  }
}

if (Fse.statSync(source).isDirectory()) {
  if (!Fse.statSync(output).isDirectory()) {
    console.error('output must be a directory')
    return
  }
  compressDir(source, output)
} else if (source.match(/(\.png|\.jpg|\.jpeg)$/)) {
  compress(source, output)
}