import { Client } from 'pg'
import { capitalizarTodasAsPalavras } from './utils'
import { Processo } from './model/Processo'
import {v4} from 'uuid'
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
  try {
    for (const processo of processos) {
      const dadosProcesso = [
        v4(),
        processo.PROCESSO.replace('/', ''),
        processo.AREA_HA,
        capitalizarTodasAsPalavras(processo.FASE),
        processo.UF
      ]
      const resultadoInsercaoProcesso = await client.query(`
        insert into "Processo" ("Id", "NumeroProcesso", "Area", "FaseAtual", "UF")
        select $1, $2, $3, $4, $5
        where not exists (
          select 1
          from "Processo"
          where "NumeroProcesso" = $2
        ) returning "Id"
      `, dadosProcesso)
      let idInserido = resultadoInsercaoProcesso.rows[0]?.Id

      if (!idInserido) {
        const resultadoSelect = await client.query(`
          select Id
          from "Processo"
          where "NumeroProcesso" = $2
        `, [processo.PROCESSO.replace('/', '')])

        idInserido = resultadoSelect.rows[0].Id
      }

      const eventoId = processo.ULT_EVENTO.substring(0, processo.ULT_EVENTO.indexOf(' -'))
      const evento = eventos.find(e => e.value === parseInt(eventoId))
      const dadosEvento = [
        v4(),
        evento?.label,
        processo.ULT_EVENTO.substring(processo.ULT_EVENTO.length-10, 100),
        idInserido,
        new Date()
      ]
      await client.query(`
        insert into "Evento" ("Id", "Descricao", "Data", "ProcessoId", "DataCriacao")
        select $1, $2, $3, $4, $5
        where not exists (
          select 1
          from "Evento"
          where "Descricao" = $2
          and "Data" = $3
          and "ProcessoId" = $4
        )
      `, dadosEvento)
    }
  } catch (error) {
    throw error
  }
}
const listar = async (client: Client) => {
  console.log('listar')
  try {
    const processos = await client.query<Processo[]>(`
      select processo, nome, ult_evento
      from processo
    `)
    return processos.rows
  } catch (error) {
    throw error
  }

}
const buscar = async (client: Client, numeroProcesso: string) => {
  console.log(`buscar => ${numeroProcesso}`)
  try {
    const processos = await client.query<Processo[]>(`
      select *
      from processo
      where REGEXP_REPLACE(processo, '[^0-9]+', '', 'g') = $1
    `, [numeroProcesso])
    return processos.rows
  } catch (error) {
    throw error
  }
}
const filtrar = async (client: Client, filtro: string) => {
  console.log(`filtrar => ${filtro}`)
  try {
    const processos = await client.query<Processo[]>(`
      select *
      from processo
      where REGEXP_REPLACE(replace(LOWER(processo), ' ', ''), '[^0-9]+', '', 'g') like replace(LOWER($1), ' ', '')
      or replace(LOWER(nome), ' ', '') like replace(LOWER($1), ' ', '')
      order by length (processo) desc
      fetch first 100 rows only
    `, [`%${filtro}%`])
    return processos.rows
  } catch (error) {
    throw error
  }
}
const deletaAntigos = async (client: Client) => {
  console.log('deletaAntigos')
  try {
    await client.query(`delete from processo`)
  } catch (error) {
    throw error
  }
}

export {
  conectar,
  desconectar,
  insereProcessos,
  listar,
  buscar,
  filtrar,
  deletaAntigos
}