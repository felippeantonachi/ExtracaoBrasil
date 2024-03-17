import cron from 'node-cron'
import { download, extrair, dbfToArray, distinctByProperty } from './utils'
import { conectar, desconectar, insereBulk } from './db'

const iniciaProcessoArquivo = async () => {
  try {
    cron.schedule('0 3 * * *', async () => {
      // await download()
      // await extrair()
      let processos = await dbfToArray()
      const conexao = await conectar()
      try {
        // processos = distinctByProperty(processos, 'PROCESSO')
        await insereBulk(processos)
        // await insereProcessos(conexao, processos)
        // await insereEvento(conexao, processos)
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