import cron from 'node-cron'
import { downloadAtivo, downloadInativo, extrairAtivos, dbfToArrayInativos, dbfToArrayAtivos, extrairInativos } from './utils'
import { conectar, desconectar, insereBulk, atualizaBulk } from './db'

const iniciaProcessoArquivo = async () => {
  cron.schedule('0 3 * * *', async () => {
    try {
      const inicio = new Date()
      await downloadAtivo()
      await downloadInativo()
      await extrairAtivos()
      await extrairInativos()
      let processosAtivos = await dbfToArrayAtivos()
      let processosInativos = await dbfToArrayInativos()
      const conexao = await conectar()
      try {
        await insereBulk(processosAtivos)
        await atualizaBulk(processosInativos)
        console.log('Inicio', inicio)
        console.log('Fim', new Date())
      } catch (error) {
        console.log(error)
      } finally {
        desconectar(conexao)
      }
    } catch (error) {
      console.error(error)
    }
  }, {
    runOnInit: true
  })
}

export {
  iniciaProcessoArquivo
}