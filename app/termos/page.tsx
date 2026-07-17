import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso e Política de Privacidade — Céu Daquele Dia',
  description:
    'Termos de Uso e Política de Privacidade (LGPD) do Céu Daquele Dia: regras de uso, responsabilidade sobre o conteúdo, reembolso, hospedagem e proteção de dados.',
}

// ── Campos a preencher antes de publicar ────────────────────────────────────
const ULTIMA_ATUALIZACAO = '17/07/2026'
const EMAIL_CONTATO = 'ceudaqueledia@gmail.com'
const COMARCA_FORO = 'Ribeirão Preto - SP'

// ── Componentes de apoio para manter o corpo do texto legível ────────────────

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section id={`secao-${numero}`} className="scroll-mt-24 mb-12">
      <h2 className="font-display text-2xl md:text-3xl text-star mb-5 flex items-baseline gap-3">
        <span className="text-gold-400 text-xl md:text-2xl">{numero}.</span>
        <span>{titulo}</span>
      </h2>
      <div className="space-y-4 text-stardust font-sans text-sm md:text-base leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Item({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <p className={className}>{children}</p>
}

export default function TermosPage() {
  return (
    <main className="min-h-screen px-6 py-16 md:py-24">
      <article className="max-w-3xl mx-auto">
        {/* ── Cabeçalho ── */}
        <header className="mb-14 text-center">
          <Link
            href="/"
            className="inline-block font-display text-lg text-stardust italic hover:text-star transition-colors mb-8"
          >
            ← Céu Daquele Dia
          </Link>
          <h1 className="font-display text-3xl md:text-5xl leading-tight mb-4">
            <span className="text-gradient italic">Termos de Uso</span> e Política de Privacidade
          </h1>
          <p className="text-nebula text-xs font-sans">
            Última atualização: {ULTIMA_ATUALIZACAO}
          </p>
        </header>

        {/* ── Introdução ── */}
        <p className="text-stardust font-sans text-sm md:text-base leading-relaxed mb-4">
          Seja bem-vindo(a) ao <strong className="text-star">Céu Daquele Dia </strong> (doravante
          &ldquo;Plataforma&rdquo;, &ldquo;nós&rdquo; ou &ldquo;nosso&rdquo;). Estes Termos de Uso e
          Política de Privacidade (&ldquo;Termos&rdquo;) regulam a relação entre você
          (&ldquo;Usuário&rdquo;, &ldquo;Cliente&rdquo; ou &ldquo;você&rdquo;) e o Céu Daquele Dia,
          estabelecendo as condições de uso do site e de contratação dos nossos serviços.
        </p>
        <p className="text-stardust font-sans text-sm md:text-base leading-relaxed mb-12">
          Recomendamos a leitura atenta e integral deste documento antes de utilizar a Plataforma ou
          realizar qualquer compra.
        </p>

        <hr className="border-violet-500/10 mb-12" />

        <Secao numero={1} titulo="Introdução e Aceite dos Termos">
          <Item>
            1.1. Ao acessar o site, preencher o formulário de personalização, realizar o pagamento
            e/ou utilizar qualquer funcionalidade da Plataforma, o Usuário declara ter lido,
            compreendido e concordado, de forma livre, expressa e informada, com todas as cláusulas
            destes Termos.
          </Item>
          <Item>
            1.2. O aceite se dá também pelo ato de marcar a caixa de seleção &ldquo;Li e concordo com
            os Termos de Uso e a Política de Privacidade&rdquo;, disponibilizada antes da finalização
            do pagamento. Caso não concorde com qualquer disposição aqui prevista, o Usuário não
            deverá contratar o serviço.
          </Item>
          <Item>
            1.3. O Usuário declara ser maior de 18 (dezoito) anos ou estar devidamente
            representado/assistido por seus responsáveis legais, possuindo plena capacidade civil
            para contratar.
          </Item>
          <Item>
            1.4. Estes Termos poderão ser atualizados a qualquer momento para refletir melhorias no
            serviço ou adequações legais. A versão vigente estará sempre disponível no site, valendo
            a data de &ldquo;Última atualização&rdquo; indicada no topo.
          </Item>
        </Secao>

        <Secao numero={2} titulo="Objeto do Serviço">
          <Item>
            2.1. O Céu Daquele Dia disponibiliza a <strong className="text-star">criação e a
            hospedagem de uma página digital interativa e personalizada</strong>, de caráter
            comemorativo e afetivo, gerada a partir dos dados fornecidos pelo próprio Usuário.
          </Item>
          <Item>
            2.2. A página personalizada pode conter, conforme as informações prestadas pelo Cliente:
            (a) um mapa estelar referente a uma data e localidade específicas; (b) a representação da
            fase da lua correspondente; (c) um contador de tempo de relacionamento; (d) um carrossel
            de fotografias enviadas pelo Cliente; (e) uma mensagem pessoal; e (f) uma música de fundo
            integrada.
          </Item>
          <Item>
            2.3. Após a confirmação do pagamento, o Usuário receberá, por e-mail, um{' '}
            <strong className="text-star">QR Code e/ou link de acesso</strong> à sua página
            personalizada.
          </Item>
          <Item>
            2.4. Os dados astronômicos (mapa estelar e fase da lua) são obtidos por meio de serviços
            de terceiros (APIs astronômicas) e possuem finalidade ilustrativa e afetiva, não se
            destinando a fins científicos, de navegação ou de precisão técnica. Eventuais
            divergências decorrentes desses serviços de terceiros não constituem defeito do produto.
          </Item>
          <Item>
            2.5. A funcionalidade de música de fundo pode depender de integrações com plataformas de
            terceiros (como serviços de streaming ou de vídeo). A disponibilidade contínua de tais
            integrações está sujeita às regras e à operação dessas plataformas, sobre as quais o Céu
            Daquele Dia não possui controle.
          </Item>
        </Secao>

        <Secao numero={3} titulo="Responsabilidade sobre o Conteúdo">
          <Item>
            3.1. <strong className="text-star">O Usuário é o único e exclusivo responsável</strong>{' '}
            por todo o conteúdo que enviar, inserir ou publicar na Plataforma, incluindo, sem
            limitação, fotografias, imagens, textos, nomes, datas e mensagens pessoais
            (&ldquo;Conteúdo do Usuário&rdquo;).
          </Item>
          <Item>
            3.2. Ao enviar o Conteúdo, o Usuário declara e garante que: (a) é titular ou detém todas
            as autorizações, licenças e direitos necessários sobre as imagens e materiais enviados,
            incluindo o consentimento das pessoas retratadas; (b) o Conteúdo não viola direitos
            autorais, de imagem, de personalidade ou quaisquer direitos de terceiros; e (c) o
            Conteúdo não é ilícito, ofensivo, difamatório, discriminatório, obsceno, pornográfico,
            que incite ódio ou violência, ou que de qualquer forma viole a legislação vigente.
          </Item>
          <Item>
            3.3. O Céu Daquele Dia atua como mero{' '}
            <strong className="text-star">hospedeiro do conteúdo fornecido pelo Cliente</strong>, não
            exercendo curadoria prévia, edição ou moderação sistemática. Não nos responsabilizamos
            por violações de direitos autorais, de imagem ou de personalidade decorrentes de
            materiais enviados pelo Usuário, nem por mensagens ofensivas, ilícitas ou inverídicas por
            ele inseridas.
          </Item>
          <Item>
            3.4. O Usuário concorda em isentar e indenizar o Céu Daquele Dia por quaisquer perdas,
            danos, reclamações ou despesas (inclusive honorários advocatícios) decorrentes de
            conteúdo por ele enviado em violação a estes Termos ou à legislação.
          </Item>
          <Item>
            3.5. Reservamo-nos o direito de, a qualquer tempo e mediante notificação de parte
            legítima, autoridade competente ou constatação própria de ilicitude, remover conteúdo ou
            suspender a página que viole estes Termos ou a lei, sem que isso gere direito a
            reembolso, nos termos do Marco Civil da Internet (Lei nº 12.965/2014).
          </Item>
        </Secao>

        <Secao numero={4} titulo="Propriedade Intelectual">
          <Item>
            4.1. Todo o layout, design, identidade visual, marca, nome, logotipo, código-fonte,
            funcionalidades e tecnologia da Plataforma são de titularidade exclusiva do Céu Daquele
            Dia, protegidos pela legislação de propriedade intelectual, sendo vedada sua reprodução,
            cópia, engenharia reversa ou uso não autorizado.
          </Item>
          <Item>
            4.2. O <strong className="text-star">Conteúdo do Usuário permanece de titularidade do
            Cliente</strong>. O Céu Daquele Dia não reivindica propriedade sobre as fotos, mensagens
            ou dados enviados.
          </Item>
          <Item>
            4.3. Ao contratar o serviço, o Usuário concede ao Céu Daquele Dia uma licença limitada,
            não exclusiva e gratuita, restrita à finalidade de armazenar, processar e exibir o
            Conteúdo do Usuário na página personalizada, pelo tempo de vigência do serviço. Essa
            licença não autoriza o uso do Conteúdo para fins de marketing, publicidade ou
            compartilhamento com terceiros sem consentimento específico e destacado do Usuário.
          </Item>
        </Secao>

        <Secao numero={5} titulo="Privacidade e Proteção de Dados (LGPD)">
          <Item className="italic">
            Esta seção observa a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
          </Item>
          <Item>
            5.1. <strong className="text-star">Dados coletados.</strong> Coletamos apenas os dados
            necessários à prestação do serviço, tais como: nome(s), endereço de e-mail, datas,
            localidade informada, fotografias e mensagens enviadas, além de dados de transação
            necessários ao processamento do pagamento.
          </Item>
          <Item>
            5.2. <strong className="text-star">Finalidade do tratamento.</strong> Os dados são
            utilizados exclusivamente para: (a) gerar e hospedar a página personalizada; (b) enviar o
            QR Code/link de acesso e comunicações essenciais ao serviço (como avisos de renovação ou
            expiração); e (c) cumprir obrigações legais e processar o pagamento. Não utilizamos os
            dados para outras finalidades sem o seu consentimento.
          </Item>
          <Item>
            5.3. <strong className="text-star">Base legal.</strong> O tratamento fundamenta-se na
            execução do contrato firmado com o Usuário (art. 7º, V, da LGPD) e, quando aplicável, no
            consentimento (art. 7º, I) e no cumprimento de obrigação legal (art. 7º, II).
          </Item>
          <Item>
            5.4. <strong className="text-star">Não compartilhamento.</strong> Não vendemos, alugamos
            ou compartilhamos seus dados pessoais com terceiros para fins comerciais. O
            compartilhamento ocorre apenas com operadores essenciais à prestação do serviço (por
            exemplo: provedor de hospedagem e banco de dados, serviço de envio de e-mails
            transacionais, processador de pagamentos e APIs astronômicas), estritamente na medida
            necessária e sob obrigação de confidencialidade e segurança.
          </Item>
          <Item>
            5.5. <strong className="text-star">Segurança.</strong> Adotamos medidas técnicas e
            administrativas razoáveis para proteger os dados contra acessos não autorizados, perda ou
            destruição. O Usuário reconhece que o link/QR Code de acesso à página é público para quem
            o possuir, cabendo a ele zelar pela discrição no compartilhamento.
          </Item>
          <Item>
            5.6. <strong className="text-star">Retenção e eliminação.</strong> Os dados são mantidos
            enquanto o serviço estiver vigente. Após a expiração, os dados e as fotografias
            correspondentes poderão ser definitivamente eliminados de nossos servidores decorrido o
            prazo indicado na Seção 7, ressalvadas as hipóteses de guarda legal obrigatória.
          </Item>
          <Item>
            5.7. <strong className="text-star">Direitos do titular.</strong> Nos termos do art. 18 da
            LGPD, o Usuário pode, a qualquer momento, solicitar acesso, correção, portabilidade,
            anonimização, eliminação de dados ou revogação de consentimento, mediante requisição ao
            nosso canal de contato:{' '}
            <span className="text-gold-400">{EMAIL_CONTATO}</span>. Solicitações serão atendidas
            dentro dos prazos legais.
          </Item>
          <Item>
            5.8. <strong className="text-star">Cookies.</strong> A Plataforma pode utilizar cookies e
            tecnologias similares estritamente necessários ao funcionamento e à melhoria da
            experiência de navegação. O Usuário pode gerenciá-los nas configurações do seu navegador.
          </Item>
        </Secao>

        <Secao numero={6} titulo="Política de Reembolso e Direito de Arrependimento">
          <Item>
            6.1. O serviço consiste em um{' '}
            <strong className="text-star">produto digital personalizado</strong>, produzido sob
            demanda a partir de dados exclusivos fornecidos pelo Cliente.
          </Item>
          <Item>
            6.2. <strong className="text-star">Direito de arrependimento (art. 49 do CDC).</strong> O
            Código de Defesa do Consumidor assegura o prazo de 7 (sete) dias para arrependimento em
            compras realizadas fora do estabelecimento físico. Contudo, por se tratar de bem digital
            personalizado, gerado e disponibilizado sob encomenda, o Cliente reconhece e concorda
            que, ao solicitar a geração imediata da página e receber o QR Code/link de acesso, o
            serviço é considerado plenamente executado, o que pode limitar o exercício do
            arrependimento quanto à parcela já usufruída.
          </Item>
          <Item>
            6.3. <strong className="text-star">Regras práticas de reembolso:</strong> (a){' '}
            <em>antes da geração e envio</em> da página personalizada, o Cliente poderá solicitar o
            reembolso integral dentro do prazo de 7 dias; (b) <em>após a geração e o envio</em> da
            página (produto já entregue e personalizado), não haverá reembolso do valor pago, salvo
            em caso de falha técnica comprovada e não sanada por nossa equipe que impossibilite o
            acesso à página.
          </Item>
          <Item>
            6.4. Em caso de defeito técnico de nossa responsabilidade, priorizaremos a correção ou
            reentrega da página. Persistindo a impossibilidade de fruição por falha nossa, o
            reembolso será processado pelo mesmo meio de pagamento utilizado.
          </Item>
          <Item>
            6.5. Solicitações devem ser encaminhadas para{' '}
            <span className="text-gold-400">{EMAIL_CONTATO}</span>, com os dados da compra.
          </Item>
        </Secao>

        <Secao numero={7} titulo="Prazo de Hospedagem">
          <Item>
            7.1. O serviço é comercializado no modelo de pagamento único que garante a{' '}
            <strong className="text-star">hospedagem da página personalizada pelo período de 12
            (doze) meses</strong>, contados a partir da data de confirmação do pagamento.
          </Item>
          <Item>
            7.2. Ao término do período contratado, o Cliente será previamente comunicado por e-mail e
            poderá renovar o serviço para manter a página no ar por igual período.
          </Item>
          <Item>
            7.3. Não havendo renovação, a página será desativada após a data de expiração. Decorrido
            o prazo de 30 (trinta) dias contados da expiração sem renovação, os dados e as
            fotografias associados à página poderão ser{' '}
            <strong className="text-star">excluídos de forma permanente e irreversível</strong> de
            nossos servidores, para fins de higienização e liberação de espaço de armazenamento.
          </Item>
          <Item>
            7.4. Recomendamos que o Cliente mantenha cópias de segurança (backup) de suas próprias
            fotos e mensagens, uma vez que a Plataforma não garante a recuperação de conteúdos após a
            exclusão prevista no item 7.3.
          </Item>
          <Item>
            7.5. A continuidade do serviço está condicionada à manutenção da operação da Plataforma.
            Em caso de descontinuidade definitiva do Céu Daquele Dia, os Clientes com serviço vigente
            serão comunicados com antecedência razoável.
          </Item>
        </Secao>

        <Secao numero={8} titulo="Disposições Gerais e Foro">
          <Item>
            8.1. A eventual tolerância quanto ao descumprimento de qualquer cláusula não constituirá
            novação ou renúncia de direitos.
          </Item>
          <Item>
            8.2. Caso qualquer disposição destes Termos seja considerada inválida ou inexequível, as
            demais permanecerão em pleno vigor.
          </Item>
          <Item>
            8.3. Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial o
            Código de Defesa do Consumidor (Lei nº 8.078/1990), o Marco Civil da Internet (Lei nº
            12.965/2014) e a LGPD (Lei nº 13.709/2018).
          </Item>
          <Item>
            8.4. Fica eleito o{' '}
            <strong className="text-star">
              foro da Comarca de <span className="text-gold-400">{COMARCA_FORO}</span>
            </strong>{' '}
            para dirimir quaisquer dúvidas ou controvérsias oriundas destes Termos, com renúncia a
            qualquer outro, por mais privilegiado que seja, ressalvado ao consumidor o direito de
            optar pelo foro de seu domicílio, nos termos da legislação consumerista.
          </Item>
          <Item>
            8.5. <strong className="text-star">Contato.</strong> Dúvidas, solicitações ou reclamações
            podem ser encaminhadas para{' '}
            <span className="text-gold-400">{EMAIL_CONTATO}</span>.
          </Item>
        </Secao>

        <hr className="border-violet-500/10 mb-8" />

        <p className="text-nebula text-xs md:text-sm font-sans italic text-center mb-12">
          Ao prosseguir com a compra, você declara estar ciente e de acordo com estes Termos de Uso
          e Política de Privacidade.
        </p>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-stardust hover:text-star font-sans text-sm transition-colors"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </article>
    </main>
  )
}
