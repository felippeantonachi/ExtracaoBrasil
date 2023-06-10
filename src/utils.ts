import axios from 'axios'
import decompress from 'decompress'
import fs from 'fs'
import { Processo } from './model/Processo'
import cliProgress, { SingleBar } from 'cli-progress'
import { DBFFile } from 'dbffile'

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
const dbfToArray = async () => {
  console.log('dbfToArray')
  try {
    const processos: Processo[] = []
    let dbf = await DBFFile.open('./extracao/BRASIL.dbf')
    let records = (await dbf.readRecords()) as Processo[]
    for (let processo of records) {
      processos.push(processo)
    }
    return processos
  } catch (error) {
    throw error
  }
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