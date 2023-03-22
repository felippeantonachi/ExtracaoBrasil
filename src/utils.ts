import axios from 'axios'
import decompress from 'decompress'
import fs from 'fs'
import Parser from 'node-dbf'
import { Processo } from './model/Processo'
import cliProgress, { SingleBar } from 'cli-progress'

const download = async () => {
  console.log('download')
  return new Promise((resolve, reject) => {
    const bar = criaLoadBar('Download Arquivo Brasil.zip', 100)
    axios({
      url: 'https://app.anm.gov.br/dadosabertos/SIGMINE/PROCESSOS_MINERARIOS/BRASIL.zip',
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (a) => {
        const porcentagem = (a.progress || 0) * 100
        bar.update(porcentagem)
      }
    }).then((response) => {
      response.data.on('error', (error: any) => {
        fs.unlinkSync('Brasil.zip')
        reject(error)
      })
      .pipe(fs.createWriteStream('Brasil.zip'))
      .on('error', (error: any) => reject(error))
      .on('finish', () => { resolve('') })
    })
  })
}
const extrair = () => {
  console.log('extrair')
  return new Promise((resolve, reject) => {
    deleteDirR('./extracao', () => {
      return decompress('BRASIL.zip', 'extracao', {
        filter(file) {
          return file.path === 'BRASIL.dbf' 
        },
      }).catch((err) => {
        reject(err)
      }).finally(() => {
        fs.unlinkSync('Brasil.zip')
        resolve('')
      })
    })
  })
}
const deleteDirR = (path: string, cb: CallableFunction) => {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)
    for (const [index, file] of files.entries()) {
      const curPath = path + '/' + file
      if (fs.lstatSync(curPath).isDirectory())
        deleteDirR(curPath, cb)
      else
        fs.unlinkSync(curPath)
    }
    fs.rmdirSync(path)
    cb(null)
  } else {
    cb(new Error('The path passed does not exist.'))
  }
}
const dbfToArray = (): Promise<Processo[]> => {
  console.log('dbfToArray')
  return new Promise((resolve, reject) => {
    try {
      const processos: Processo[] = [] 
      let parser = new Parser('./extracao/BRASIL.dbf', { encoding: 'latin1' })
      parser.on('record', (processo: Processo) => { processos.push(processo) })
      parser.on('end', () => { resolve(processos) })
      parser.parse()
    } catch (error) {
      reject(error)
    }
  })
}
const criaLoadBar = (texto: string, total: number) => {
  const bar = new cliProgress.SingleBar({stopOnComplete: true, format: `{bar} {percentage}% ${texto}`, clearOnComplete: true}, cliProgress.Presets.shades_classic)
  bar.start(total, 0)
  return bar
}

export {
  download,
  extrair,
  dbfToArray,
  criaLoadBar
}