import { Pool, PoolClient } from 'pg'
import { criaLoadBar } from './utils'
import { Processo } from './model/Processo'

const conectar = async () => {
  console.log('conectar')
  try {
    const pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '') || 5432
    })
    return pool.connect()
  } catch (error) {
    throw error
  }
}
const desconectar = async (conexao: PoolClient) => {
  console.log('desconectar')
  try {
    conexao.release()
  } catch (error) {
    throw error
  }
}

const criaTabelasBanco = async (conexao: PoolClient) => {
  console.log('criaTabelasBanco')
  try {
    conexao.query(`
    create table if not exists Processo (
      PROCESSO varchar,
      NUMERO varchar,
      ANO varchar,
      AREA_HA varchar,
      ID varchar,
      FASE varchar,
      ULT_EVENTO varchar,
      NOME varchar,
      SUBS varchar,
      USO varchar,
      UF varchar,
      DSProcesso varchar
    )
  `); 
  } catch (error) {
    throw error
  }
}
const insereProcessos = async (conexao: PoolClient, processos: Processo[]) => {
  console.log('insereProcessos')
  try {
    const bar = criaLoadBar('Inserindo processos na tabela Processo', (processos.length - 1))
    for (const [index, processo] of processos.entries()) {
      bar.update(index)
      const values = [
        processo.PROCESSO,
        processo.NUMERO,
        processo.ANO,
        processo.AREA_HA,
        processo.ID,
        processo.FASE,
        processo.ULT_EVENTO,
        processo.NOME,
        processo.SUBS,
        processo.USO,
        processo.UF,
        processo.DSProcesso
      ]
      await conexao.query(`
      insert into processo (processo, numero, ano, area_ha, id, fase, ult_evento, nome, subs, uso, uf, dsprocesso)
      values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, values);
    }
  } catch (error) {
    throw error
  }

}
const listar = async (conexao: PoolClient) => {
  console.log('listar')
  try {
    const processos = await conexao.query<Processo[]>(`
      select processo, nome, ult_evento
      from processo
    `)
    return processos.rows
  } catch (error) {
    throw error
  }

}
const buscar = async (conexao: PoolClient, numeroProcesso: string) => {
  console.log(`buscar => ${numeroProcesso}`)
  try {
    const processos = await conexao.query<Processo[]>(`
      select *
      from processo
      where REGEXP_REPLACE(processo, '[^0-9]+', '', 'g') = $1
    `, [numeroProcesso])
    return processos.rows
  } catch (error) {
    throw error
  }
}
const filtrar = async (conexao: PoolClient, filtro: string) => {
  console.log(`filtrar => ${filtro}`)
  try {
    const processos = await conexao.query<Processo[]>(`
      select processo, nome, ult_evento
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
const deletaAntigos = async (conexao: PoolClient) => {
  console.log('deletaAntigos')
  try {
    await conexao.query(`delete from processo`)
  } catch (error) {
    throw error
  }
}

export {
  conectar,
  desconectar,
  criaTabelasBanco,
  insereProcessos,
  listar,
  buscar,
  filtrar,
  deletaAntigos
}