import cron from 'node-cron'
import { download, extrair, dbfToArray } from './utils'
import { conectar, desconectar, criaTabelasBanco, insereProcessos, deletaAntigos } from './db'

const iniciaProcessoArquivo = async () => {
  try {
    cron.schedule('0 */24 * * *', async () => {
      await download()
      await extrair()
      const processos = await dbfToArray()
      const conexao = await conectar()
      try {
        await deletaAntigos(conexao)
        await insereProcessos(conexao, processos)
      } catch (error) {
        console.log(error)
      } finally {
        desconectar(conexao)
      }
    })
  } catch (error) {
    console.error(error)
  }
}

export {
  iniciaProcessoArquivo
}