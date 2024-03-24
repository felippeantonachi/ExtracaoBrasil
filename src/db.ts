import { Client, Pool } from 'pg'
import { Processo } from './model/Processo'

const conectar = async (): Promise<Client> => {
  const client = new Client(process.env.DATABASE_URL)
  await client.connect()
  return client
}
const desconectar = async (client: Client): Promise<void> => {
  await client.end()
}
const insereBulk = async (processos: Processo[]) => {
  console.log('insereBulk')
  const pool = new Pool({
    user: process.env.USER_PG,
    host: process.env.HOST_PG,
    database: process.env.DATABASE_PG,
    password: process.env.PASSWORD_PG,
    port: parseInt(process.env.PORT_PG!),
  });
  
  await pool.query(`
  CREATE TABLE IF NOT EXISTS Brasil (
    PROCESSO varchar(255),
    NUMERO varchar(255),
    ANO varchar(255),
    AREA_HA varchar(255),
    ID varchar(255),
    FASE varchar(255),
    ULT_EVENTO varchar(255),
    DATA_ULT_EVENTO varchar(255),
    NOME varchar(255),
    SUBS varchar(255),
    USO varchar(255),
    UF varchar(255),
    DSProcesso varchar(255)
  );
  
  CREATE OR REPLACE PROCEDURE public.atualiza_processos_da_brasil()
  LANGUAGE plpgsql
  AS $$
  BEGIN
      INSERT INTO "Processo" ("Id", "Ativo", "NumeroProcesso", "Area", "FaseAtual", "UF", "NomeCliente")
      SELECT uuid_generate_v4(), true, brasil.PROCESSO, brasil.AREA_HA, brasil.FASE, brasil.UF, brasil.NOME
      FROM brasil
      WHERE NOT EXISTS (
          SELECT 1
          FROM "Processo"
          WHERE "NumeroProcesso" = brasil.PROCESSO
      );
  END;
  $$;
  
  CREATE OR REPLACE PROCEDURE public.atualiza_eventos_da_brasil()
  LANGUAGE plpgsql
  AS $$
  BEGIN
      INSERT INTO "Evento" ("Id", "Descricao", "Data", "ProcessoId", "DataCriacao", "DataAtualizacao")
      SELECT uuid_generate_v4(), brasil.ULT_EVENTO, brasil.DATA_ULT_EVENTO, proc."Id", NOW(), NOW()
      FROM brasil
      JOIN "Processo" proc ON proc."NumeroProcesso" = brasil.PROCESSO
      WHERE NOT EXISTS (
          SELECT 1
          FROM "Evento" evt
          WHERE evt."Descricao" = brasil.ULT_EVENTO
          AND evt."Data" = brasil.DATA_ULT_EVENTO
          AND evt."ProcessoId" = proc."Id"
      );
  END;
  $$;
  `);

  const tamanhoDoLote = 5000; // Define o tamanho de cada lote
  try {
    await pool.query('BEGIN');

    for (let i = 0; i < processos.length; i += tamanhoDoLote) {
      const loteAtual = processos.slice(i, i + tamanhoDoLote);
      const parametros: (string | number)[] = [];
      const queryBase = 'INSERT INTO brasil(PROCESSO, NUMERO, ANO, AREA_HA, ID, FASE, DATA_ULT_EVENTO, ULT_EVENTO, NOME, SUBS, USO, UF, DSProcesso) VALUES ';
      const valores: string[] = [];
      
      loteAtual.forEach((processo, index) => {
        const baseIndex = index * 13 + 1;        
        valores.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12})`);
        parametros.push(processo.PROCESSO, processo.NUMERO, processo.ANO, processo.AREA_HA, processo.ID, processo.FASE, processo.DATA_ULT_EVENTO, processo.ULT_EVENTO, processo.NOME, processo.SUBS, processo.USO, processo.UF, processo.DSProcesso);
      });

      const queryFinal = queryBase + valores.join(', ');
      console.log('Inserindo, aguarde...');
      
      await pool.query(queryFinal, parametros);
      console.log('Lote inserido com sucesso!');
    }
    console.log('inicio call atualiza_processos_da_brasil()')
    await pool.query('call atualiza_processos_da_brasil()');
    console.log('fim call atualiza_processos_da_brasil()')
    console.log('inicio call atualiza_eventos_da_brasil()')
    await pool.query('call atualiza_eventos_da_brasil()');
    console.log('fim call atualiza_eventos_da_brasil()')
    console.log('inicio delete from brasil')
    await pool.query('delete from brasil');
    console.log('fim delete from brasil')
    
    console.log('inicio commit')
    await pool.query('COMMIT');
    console.log('fim commit')
    console.log('Finalizado!')
  } catch (error) {
    console.log('Erro ao inserir:', error);
    await pool.query('ROLLBACK');
    throw error;
  }
}
const atualizaBulk = async (processos: Processo[]) => {
  console.log('atualizaBulk')
  const pool = new Pool({
    user: process.env.USER_PG,
    host: process.env.HOST_PG,
    database: process.env.DATABASE_PG,
    password: process.env.PASSWORD_PG,
    port: parseInt(process.env.PORT_PG!),
  });
  
  await pool.query(`
  CREATE TABLE IF NOT EXISTS brasilInativo (
    PROCESSO varchar(255),
    NUMERO varchar(255),
    ANO varchar(255),
    AREA_HA varchar(255),
    ID varchar(255),
    DSProcesso varchar(255)
  );
  
  CREATE OR REPLACE PROCEDURE public.atualiza_inativos()
  LANGUAGE plpgsql
  AS $$
  BEGIN
    update "brasilinativo"
    set "processo" = apenas_numeros("processo");

    update "Processo"
    set "Ativo" = false
    WHERE EXISTS (
      SELECT 1
      FROM "brasilinativo"
      WHERE "NumeroProcesso" = "processo"
    );
  END;
  $$;
  `);

  const tamanhoDoLote = 5000; // Define o tamanho de cada lote
  try {
    await pool.query('BEGIN');

    for (let i = 0; i < processos.length; i += tamanhoDoLote) {
      const loteAtual = processos.slice(i, i + tamanhoDoLote);
      const parametros: (string | number)[] = [];
      const queryBase = 'INSERT INTO brasilInativo(PROCESSO, NUMERO, ANO, AREA_HA, ID, DSProcesso) VALUES ';
      const valores: string[] = [];
      
      loteAtual.forEach((processo, index) => {
        const baseIndex = index * 6 + 1;        
        valores.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`);
        parametros.push(processo.PROCESSO, processo.NUMERO, processo.ANO, processo.AREA_HA, processo.ID, processo.DSProcesso);
      });

      const queryFinal = queryBase + valores.join(', ');
      console.log('Inserindo, aguarde...');
      
      await pool.query(queryFinal, parametros);
      console.log('Lote inserido com sucesso!');
    }
    
    await pool.query('call atualiza_inativos()');
    await pool.query('delete from brasilInativo');

    await pool.query('COMMIT');
    console.log('Finalizado!')
  } catch (error) {
    console.log('Erro ao inserir:', error);
    await pool.query('ROLLBACK');
    throw error;
  }
}
export {
  conectar,
  desconectar,
  insereBulk,
  atualizaBulk
}