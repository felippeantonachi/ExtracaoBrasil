import axios from 'axios'
import AdmZip  from 'adm-zip'
import fs from 'fs'
import { Processo } from './model/Processo'
import { DBFFile } from 'dbffile'
import path from 'path'

const download = async () => {
  console.log('download')
  return new Promise((resolve, reject) => {
    axios({
      url: 'https://app.anm.gov.br/dadosabertos/SIGMINE/PROCESSOS_MINERARIOS/BRASIL.zip',
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (a) => {
        const porcentagem = (a.progress || 0) * 100
        console.log(porcentagem)
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
  console.log('inicio extrair')
  deleteDirR('./extracao', () => {
    try {
      const filePath = path.resolve(__dirname, '..')
      const file = fs.readFileSync(`${filePath}/Brasil.zip`)
      const zip = new AdmZip(file)
      zip.extractAllTo('extracao')
      fs.unlinkSync('Brasil.zip')
    } catch (error) {
      console.log(error)
    }
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
    let records = await dbf.readRecords() as unknown as Processo[]
    for (let processo of records) {
      processos.push(processo)
    }
    return processos
  } catch (error) {
    throw error
  }
}
const capitalizarTodasAsPalavras = (frase: string) => {
  if (typeof frase !== 'string' || frase.length === 0) return "Fase Inválida"
  frase = frase.toLowerCase()
  const palavras = frase.split(' ')
  const palavrasExcecoes = ['de', 'da', 'em', 'na', 'no', 'e', 'do', 'dos', 'das', 'ao', 'aos', 'à', 'às', 'por', 'para']
  const fraseCapitalizada = palavras.map((palavra, index) => {
    if (index === 0 || !palavrasExcecoes.includes(palavra.toLowerCase())) return capitalizarPrimeiraLetra(palavra)
    else return palavra.toLowerCase()
  }).join(' ')
  return fraseCapitalizada
}
const capitalizarPrimeiraLetra = (string: string) => {
  if (string.length > 0) {
    return string[0].toUpperCase() + string.slice(1)
  } else {
    return string
  }
}

export {
  download,
  extrair,
  dbfToArray,
  capitalizarTodasAsPalavras
}