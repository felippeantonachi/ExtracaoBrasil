import axios from 'axios'
import decompress from 'decompress'
import fs from 'fs'
import Parser from 'node-dbf'
import { criaLoadBar } from './LoadingBar'
import { Processo } from './model/Processo'
import cliProgress, { SingleBar } from 'cli-progress'

const download = async () => {
  return new Promise((resolve, reject) => {
    const bar = criaLoadBar('Download Arquivo Brasil.zip', 100)
    axios({
      url: 'https://app.anm.gov.br/dadosabertos/SIGMINE/PROCESSOS_MINERARIOS/BRASIL.zip',
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (a) => {
        const porcentagem = a.progress * 100
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
  return decompress('BRASIL.zip', 'extracao').finally(() => {
    fs.unlinkSync('Brasil.zip')
  })
}
const dbfToArray = (): Promise<Processo[]> => {
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