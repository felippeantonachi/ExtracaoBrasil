import { Client, Pool } from 'pg'
import { capitalizarTodasAsPalavras, adicionarZerosEsquerda } from './utils'
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
const insereBulk = async (processos: Processo[]) => {
  console.log('insereBulk')
  const pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'postgres',
    port: 54322,
  });

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
    
    await pool.query('call atualiza_processos_da_brasil()');
    await pool.query('call atualiza_eventos_da_brasil()');
    await pool.query('delete from brasil');

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
  insereBulk
}