import { download, extrair, dbfToArray } from './utils'
import { conectar, desconectar, criaTabelasBanco, insereProcessos } from './db'

const iniciaProcessoArquivo = async () => {
  try {
    await download()
    await extrair()
    const processos = await dbfToArray()
    const conexao = await conectar()
    try {
      await criaTabelasBanco(conexao)
      await insereProcessos(conexao, processos)
    } catch (error) {
      
    } finally {
      desconectar(conexao)
    }
  } catch (error) {
    console.error(error)
  }
}

export {
  iniciaProcessoArquivo
}