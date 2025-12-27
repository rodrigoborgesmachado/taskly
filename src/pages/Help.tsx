import { Link } from 'react-router-dom';

export default function Help() {
  return (
    <div className="page-container">
      <h2 className="page-title">Ajuda</h2>

      <p className="page-paragraph">
        Esta aplicação transforma uma pasta do seu computador em um <em>board</em> visual
        de tarefas. Cada subpasta dentro da pasta raiz representa uma lista, e cada
        subpasta dentro de uma lista se torna um card.
      </p>

      <ul className="page-list">
        <li>
          Use o botão <strong>+</strong> na barra de abas para selecionar a pasta raiz do board.
        </li>
        <li>
          Arraste os cards entre as listas para mover tarefas de uma etapa para outra.
        </li>
        <li>
          Use <strong>Nova lista</strong> ou <strong>Novo card</strong> para criar novos itens rapidamente.
        </li>
        <li>
          Edite a descrição, adicione anexos ou insira comentários diretamente em cada card.
        </li>
      </ul>

      <div className="page-card">
        <h3 className="page-section-title">Dica extra</h3>
        <p className="page-paragraph page-paragraph--tight">
          Como os dados ficam dentro das pastas locais, nada é salvo em um servidor.
          Se você usar uma pasta que esteja dentro do <strong>OneDrive</strong> (ou outro serviço de nuvem como
          Google Drive/Dropbox), poderá abrir o mesmo board em diferentes computadores,
          desde que todos tenham acesso à pasta sincronizada.
        </p>
      </div>

      <p className="page-paragraph">
        <Link to="/" className="page-link">Voltar para o board</Link>
      </p>
    </div>
  );
}
