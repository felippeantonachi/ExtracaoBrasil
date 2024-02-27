import { Client } from 'pg'
import { capitalizarTodasAsPalavras, adicionarZerosEsquerda, distinctByProperty } from './utils'
import { Processo } from './model/Processo'
import { v4 } from 'uuid'

const conectar = async (): Promise<Client> => {
  const client = new Client(process.env.DATABASE_URL)
  await client.connect()
  return client
}
const desconectar = async (client: Client): Promise<void> => {
  await client.end()
}
const insereProcessos = async (client: Client, processos: Processo[]) => {
  console.log('insereProcessos')
  let sqlSelect = ''
  const sqlInsert = 'insert into "Processo" ("Id", "NumeroProcesso", "Area", "FaseAtual", "UF", "NomeCliente") '
  let count = 0
  try {
    processos = distinctByProperty(processos, 'PROCESSO')
    for (const [index, processo] of processos.entries()) {
      const numeroProcesso =  adicionarZerosEsquerda(processo.PROCESSO.replace('/', ''), 10)
      const fase = capitalizarTodasAsPalavras(processo.FASE)
      const nomeCliente = processo.NOME.includes(`'`) ? processo.NOME.replace(/'/g, "''") : processo.NOME
      if (count === 0) {
        sqlSelect = `
          select '${v4()}', '${numeroProcesso}', '${processo.AREA_HA}', '${fase}', '${processo.UF}', '${nomeCliente}'
          where not exists (
            select 1
            from "Processo"
            where "NumeroProcesso" = '${numeroProcesso}'
          )
        `
      } else {
        sqlSelect += `
          union
          select '${v4()}', '${numeroProcesso}', '${processo.AREA_HA}', '${fase}', '${processo.UF}', '${nomeCliente}'
          where not exists (
            select 1
            from "Processo"
            where "NumeroProcesso" = '${numeroProcesso}'
          )
        `
      }
      count++
      console.log('Linhas processadas', index)
      if (count === 10) {
        console.log('Inserindo na tabela de Processos em lote...')
        await client.query(sqlInsert + sqlSelect)
        count = 0
      }
    }
    console.log('Inserindo na tabela de Processos o que sobrou...')
    await client.query(sqlInsert + sqlSelect)
    console.log('fim insereProcessos')
  } catch (error) {
    console.log(sqlSelect)
    throw error
  }
}

export {
  conectar,
  desconectar,
  insereProcessos
}