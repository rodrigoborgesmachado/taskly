import { Link } from 'react-router-dom';

export default function Help() {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '2rem',
        lineHeight: 1.6,
        color: '#ddd',
      }}
    >
      <h1 style={{ marginBottom: '1rem', fontSize: '2rem', fontWeight: 700 }}>
        Ajuda
      </h1>

      <p style={{ marginBottom: '1rem' }}>
        Esta aplicação transforma uma pasta do seu computador em um <em>board</em> visual
        de tarefas. Cada subpasta dentro da pasta raiz representa uma lista, e cada
        subpasta dentro de uma lista se torna um card.
      </p>

      <ul style={{ marginBottom: '1rem', paddingLeft: '1.25rem' }}>
        <li>
          Clique em <strong>Escolher pasta</strong> para selecionar a pasta raiz do board.
        </li>
        <li>
          Arraste os cards entre as listas para mover tarefas de uma etapa para outra.
        </li>
        <li>
          Use <strong>Nova lista</strong> ou <strong>Novo card</strong> para criar novos itens
          rapidamente.
        </li>
        <li>
          Edite a descrição, adicione anexos ou insira comentários diretamente em cada card.
        </li>
      </ul>

      <div
        style={{
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          padding: '1rem',
          background: '#111',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '.5rem' }}>💡 Dica extra</h2>
        <p style={{ margin: 0 }}>
          Como os dados ficam dentro das pastas locais, nada é salvo em um servidor.
          Se você usar uma pasta que esteja dentro do <strong>OneDrive</strong> (ou outro serviço de nuvem como
          Google Drive/Dropbox), poderá abrir o mesmo board em diferentes computadores,
          desde que todos tenham acesso à pasta sincronizada.
        </p>
      </div>

      <p>
        <Link to="/" style={{ color: '#2CDEBF', fontWeight: 600 }}>
          ← Voltar para o board
        </Link>
      </p>
    </div>
  );
}
