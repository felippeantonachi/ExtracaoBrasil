import axios from 'axios'
import AdmZip  from 'adm-zip'
import fs from 'fs'
import { Processo } from './model/Processo'
import { DBFFile } from 'dbffile'
import path from 'path'
const eventos: [{value: number, label: string}] = require('./eventos.json')

const downloadAtivo = async () => {
  console.log('downloadAtivo')
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
const downloadInativo = async () => {
  console.log('downloadInativo')
  return new Promise((resolve, reject) => {
    axios({
      url: 'https://app.anm.gov.br/dadosabertos/SIGMINE/PROCESSOS_MINERARIOS/BRASIL_INATIVOS.zip',
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (a) => {
        const porcentagem = (a.progress || 0) * 100
        console.log(porcentagem)
      }
    }).then((response) => {
      response.data.on('error', (error: any) => {
        fs.unlinkSync('BRASIL_INATIVOS.zip')
        reject(error)
      })
      .pipe(fs.createWriteStream('BRASIL_INATIVOS.zip'))
      .on('error', (error: any) => reject(error))
      .on('finish', () => { resolve('') })
    })
  })
}
const extrairAtivos = () => {
  console.log('extrairAtivos')
  deleteDirR('./extracaoAtivos', () => {
    try {
      const filePath = path.resolve(__dirname, '..')
      const file = fs.readFileSync(`${filePath}/Brasil.zip`)
      const zip = new AdmZip(file)
      zip.extractAllTo('extracaoAtivos')
      fs.unlinkSync('Brasil.zip')
    } catch (error) {
      console.log(error)
    }
  })
}
const extrairInativos = () => {
  console.log('extrairInativos')
  deleteDirR('./extracaoInativos', () => {
    try {
      const filePath = path.resolve(__dirname, '..')
      const file = fs.readFileSync(`${filePath}/BRASIL_INATIVOS.zip`)
      const zip = new AdmZip(file)
      zip.extractAllTo('extracaoInativos')
      fs.unlinkSync('BRASIL_INATIVOS.zip')
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
const dbfToArrayAtivos = async () => {
  console.log('dbfToArrayAtivos')
  try {
    const processos: Processo[] = []
    let dbf = await DBFFile.open('./extracaoAtivos/BRASIL.dbf')
    let records = await dbf.readRecords() as unknown as Processo[]
    for (let [index, processo] of records.entries()) {
      console.log(index)
      processo.PROCESSO = adicionarZerosEsquerda(`${processo.NUMERO}${processo.ANO}`, 10)
      if (processos.some(p => p.PROCESSO === processo.PROCESSO)) continue
      processo.FASE = capitalizarTodasAsPalavras(processo.FASE)
      processo.DATA_ULT_EVENTO = processo.ULT_EVENTO.substring(processo.ULT_EVENTO.length-10)
      const eventoId = processo.ULT_EVENTO.substring(0, processo.ULT_EVENTO.indexOf(' -'))
      processo.ULT_EVENTO = eventos.find(e => e.value === parseInt(eventoId))?.label || ''
      processos.push(processo)
    }
    return processos
  } catch (error) {
    throw error
  }
}
const dbfToArrayInativos = async () => {
  console.log('dbfToArrayInativos')
  try {
    let dbf = await DBFFile.open('./extracaoInativos/BRASIL_INATIVOS.dbf')
    let records = await dbf.readRecords() as unknown as Processo[]
    return records
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
const adicionarZerosEsquerda = (numero: string, quantidadeZeros: number) => {
  const numeroString = numero.toString()
  const zerosFaltantes = quantidadeZeros - numeroString.length
  if (zerosFaltantes <= 0) {
      return numeroString
  } else {
      return '0'.repeat(zerosFaltantes) + numeroString
  }
}
const distinctByProperty = (array: any, property: string) => {
  console.log('distinctByProperty')
  return array.filter((obj: any, index: number, self: any) => {
    console.log(index)
    return index === self.findIndex((t: any) => (t[property] === obj[property]))
  })
}
export {
  downloadAtivo,
  downloadInativo,
  extrairAtivos,
  extrairInativos,
  dbfToArrayAtivos,
  dbfToArrayInativos,
  capitalizarTodasAsPalavras,
  adicionarZerosEsquerda,
  distinctByProperty
}