import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <div className="page-container">
      <h2 className="page-title">Contato</h2>

      <p className="page-paragraph">
        Fale com a SunSale System pelos canais oficiais abaixo. Respondemos o mais rápido possível
        em dias úteis.
      </p>

      <div className="page-card">
        <ul className="page-list page-list--tight">
          <li>Site: <a href="https://www.sunsalesystem.com.br/" target="_blank" rel="noreferrer">sunsalesystem.com.br</a></li>
          <li>LinkedIn: <a href="https://www.linkedin.com/company/sunsale-system/" target="_blank" rel="noreferrer">/company/sunsale-system</a></li>
          <li>GitHub: <a href="https://github.com/rodrigoborgesmachado" target="_blank" rel="noreferrer">github.com/rodrigoborgesmachado</a></li>
          <li>WhatsApp: <a href="https://wa.me/553499798100" target="_blank" rel="noreferrer">+55 34 99798-8100</a></li>
        </ul>
      </div>

      <p className="page-paragraph">
        Se preferir, envie uma mensagem descrevendo sua dúvida e o contexto do uso do Taskly.
        Isso ajuda nossa equipe a responder com mais precisão.
      </p>

      <p className="page-paragraph">
        <Link to="/" className="page-link">Voltar para o board</Link>
      </p>
    </div>
  );
}
