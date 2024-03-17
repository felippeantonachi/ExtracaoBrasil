import cron from 'node-cron'
import { download, extrair, dbfToArray, distinctByProperty } from './utils'
import { conectar, desconectar, insereBulk } from './db'

const iniciaProcessoArquivo = async () => {
  try {
    cron.schedule('0 3 * * *', async () => {
      await download()
      await extrair()
      let processos = await dbfToArray()
      const conexao = await conectar()
      try {
        console.log(processos.length)
        await insereBulk(processos)
      } catch (error) {
        console.log(error)
      } finally {
        desconectar(conexao)
      }
    }, {
      runOnInit: true
    })
  } catch (error) {
    console.error(error)
  }
}

export {
  iniciaProcessoArquivo
}