import { Pool, PoolClient } from 'pg'
import { criaLoadBar } from './utils'
import { Processo } from './model/Processo'

const conectar = async () => {
  try {
    const pool = new Pool({
      connectionString: 'postgresql://clayton:251088@localhost:5432/dbExtracaoProcessoBrasil'
    })
    return pool.connect()
  } catch (error) {
    throw error
  }
}
const desconectar = async (conexao: PoolClient) => {
  conexao.release()
}

const criaTabelasBanco = async (conexao: PoolClient) => {
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
}
const insereProcessos = async (conexao: PoolClient, processos: Processo[]) => {
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
}
const listar = async (conexao: PoolClient) => {
  const processos = await conexao.query<Processo[]>(`
    select *
    from processo
    fetch first 1000 rows only
  `)
  return processos.rows
}
const buscar = async (conexao: PoolClient, processo: string) => {
  console.log(processo)
  const processos = await conexao.query<Processo[]>(`
    select *
    from processo
    where processo = '${processo}'
  `)
  return processos.rows[0]
}

export {
  conectar,
  desconectar,
  criaTabelasBanco,
  insereProcessos,
  listar,
  buscar
}