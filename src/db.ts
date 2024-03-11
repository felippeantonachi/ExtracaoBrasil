import { Client } from 'pg'
import { capitalizarTodasAsPalavras, adicionarZerosEsquerda } from './utils'
import { Processo } from './model/Processo'
import { v4 } from 'uuid'
const eventos: [{value: number, label: string}] = require('./eventos.json')

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
  let sqlSelectProcesso = ''
  const sqlInsertProcesso = 'insert into "Processo" ("Id", "NumeroProcesso", "Area", "FaseAtual", "UF", "NomeCliente") '
  let count = 0
  try {
    for (const [index, processo] of processos.entries()) {
      const numeroProcesso =  adicionarZerosEsquerda(processo.PROCESSO.replace('/', ''), 10)
      const fase = capitalizarTodasAsPalavras(processo.FASE)
      const nomeCliente = processo.NOME.includes(`'`) ? processo.NOME.replace(/'/g, "''") : processo.NOME
      if (count === 0) {
        sqlSelectProcesso = `
          select '${v4()}', '${numeroProcesso}', '${processo.AREA_HA}', '${fase}', '${processo.UF}', '${nomeCliente}'
          where not exists (
            select 1
            from "Processo"
            where "NumeroProcesso" = '${numeroProcesso}'
          )
        `
      } else {
        sqlSelectProcesso += `
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
      if (count === 1000) {
        console.log('Inserindo na tabela de Processos em lote...')
        await client.query(sqlInsertProcesso + sqlSelectProcesso)
        count = 0
      }
    }
    console.log('Inserindo na tabela de Processos o que sobrou...')
    await client.query(sqlInsertProcesso + sqlSelectProcesso)
    console.log('fim insereProcessos')
  } catch (error) {
    console.log(sqlSelectProcesso)
    throw error
  }
}
const insereEvento = async (client: Client, processos: Processo[]) => {
  console.log('insereEvento')
  let sqlSelectEvento = ''
  const sqlInsertEvento = 'insert into "Evento" ("Id", "Descricao", "Data", "ProcessoId", "DataCriacao", "DataAtualizacao") '
  let count = 0
  try {
    for (const [index, processo] of processos.entries()) {
      const numeroProcesso =  adicionarZerosEsquerda(processo.PROCESSO.replace('/', ''), 10)
      const eventoId = processo.ULT_EVENTO.substring(0, processo.ULT_EVENTO.indexOf(' -'))
      const evento = eventos.find(e => e.value === parseInt(eventoId))
      if (count === 0) {
        sqlSelectEvento = `
          select '${v4()}', '${evento?.label}', '${processo.ULT_EVENTO.substring(processo.ULT_EVENTO.length-10, 100)}', (select (select "Id" from "Processo" where "NumeroProcesso" = '${numeroProcesso}')), NOW(), NOW()
          where not exists (
            select 1
            from "Evento"
            where "Descricao" = '${evento?.label}'
            and "Data" = '${processo.ULT_EVENTO.substring(processo.ULT_EVENTO.length-10, 100)}'
            and "ProcessoId" = (select "Id" from "Processo" where "NumeroProcesso" = '${numeroProcesso}')
          )
        `
      } else {
        sqlSelectEvento += `
          union
          select '${v4()}', '${evento?.label}', '${processo.ULT_EVENTO.substring(processo.ULT_EVENTO.length-10, 100)}', (select (select "Id" from "Processo" where "NumeroProcesso" = '${numeroProcesso}')), NOW(), NOW()
          where not exists (
            select 1
            from "Evento"
            where "Descricao" = '${evento?.label}'
            and "Data" = '${processo.ULT_EVENTO.substring(processo.ULT_EVENTO.length-10, 100)}'
            and "ProcessoId" = (select "Id" from "Processo" where "NumeroProcesso" = '${numeroProcesso}')
          )
        `
      }
      count++
      console.log('Linhas processadas', index)
      if (count === 5000) {
        console.log('Inserindo na tabela de Evento em lote...')
        await client.query(sqlInsertEvento + sqlSelectEvento)
        count = 0
      }
    }
    console.log('Inserindo na tabela de Evento o que sobrou...')
    await client.query(sqlInsertEvento + sqlSelectEvento)
    console.log('fim insereEvento')
  } catch (error) {
    console.log(sqlSelectEvento)
    throw error
  }
}
export {
  conectar,
  desconectar,
  insereProcessos,
  insereEvento
}