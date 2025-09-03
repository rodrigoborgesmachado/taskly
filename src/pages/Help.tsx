import { Link } from 'react-router-dom';

export default function Help() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Ajuda</h1>
      <p>
        Esta aplicação lê uma pasta do seu computador e transforma as subpastas
        em listas de tarefas. Cada subpasta dentro de uma lista vira um card.
      </p>
      <ul>
        <li>Clique em <strong>Escolher pasta</strong> para selecionar a raiz do board.</li>
        <li>Arraste os cards entre as listas para mudar de etapa.</li>
        <li>Use <strong>Nova lista</strong> ou <strong>Novo card</strong> para criar itens.</li>
      </ul>
      <p><Link to="/">Voltar</Link></p>
    </div>
  );
}
