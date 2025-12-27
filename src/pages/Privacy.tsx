import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="page-container">
      <h2 className="page-title">Política de Privacidade</h2>

      <p className="page-paragraph page-paragraph--justified">
        Esta Política de Privacidade descreve como a SunSale System coleta, utiliza e protege
        informações relacionadas ao uso do Taskly. Ao utilizar este aplicativo, você concorda
        com as práticas descritas abaixo.
      </p>

      <h3 className="page-section-title">1. Informações que coletamos</h3>
      <p className="page-paragraph page-paragraph--justified">
        O Taskly funciona localmente e utiliza as pastas selecionadas no seu computador para
        organizar boards e cartões. Não coletamos o conteúdo dos seus arquivos nem transferimos
        seus dados para servidores da SunSale System. Podemos coletar apenas informações técnicas
        básicas, como tipo de navegador e erros de aplicação, para melhorar a estabilidade do
        produto.
      </p>

      <h3 className="page-section-title">2. Como utilizamos as informações</h3>
      <p className="page-paragraph page-paragraph--justified">
        As informações técnicas são utilizadas para manutenção, suporte e aprimoramento do
        aplicativo. Seus dados de boards permanecem no seu dispositivo e são controlados por você.
      </p>

      <h3 className="page-section-title">3. Compartilhamento de dados</h3>
      <p className="page-paragraph page-paragraph--justified">
        Não compartilhamos seus dados com terceiros. Caso você utilize serviços de nuvem
        (como OneDrive, Google Drive ou Dropbox) para armazenar suas pastas, o tratamento desses
        dados segue as políticas do respectivo provedor.
      </p>

      <h3 className="page-section-title">4. Segurança</h3>
      <p className="page-paragraph page-paragraph--justified">
        Adotamos boas práticas para proteger o aplicativo. Ainda assim, a segurança dos seus
        arquivos depende também das configurações e proteções do seu próprio dispositivo.
      </p>

      <h3 className="page-section-title">5. Seus direitos</h3>
      <p className="page-paragraph page-paragraph--justified">
        Você pode interromper o uso do aplicativo a qualquer momento e remover o acesso às pastas
        selecionadas. Como não armazenamos seus dados em servidores, não retemos informações pessoais.
      </p>

      <h3 className="page-section-title">6. Contato</h3>
      <p className="page-paragraph page-paragraph--justified">
        Para dúvidas sobre esta política, visite a página de contato da SunSale System.
      </p>
      <p className="page-paragraph page-paragraph--justified">
        <Link to="/contato" className="page-link">Ir para Contato</Link>
      </p>

      <p className="page-paragraph page-paragraph--justified">
        Esta política pode ser atualizada periodicamente. Recomendamos revisar este conteúdo
        sempre que houver mudanças relevantes.
      </p>

      <p className="page-paragraph">
        <Link to="/" className="page-link">Voltar para o board</Link>
      </p>
    </div>
  );
}
