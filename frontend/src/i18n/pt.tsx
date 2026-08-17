import demo from '../components/DemoTour/styles.module.css';
import { TAB_LABELS } from '../constants/tabs';
import type { Dictionary } from './en';

export const pt: Dictionary = {
  language: {
    label: 'Idioma:',
    pt: 'PT-BR',
    en: 'EN',
    ptTitle: 'Mudar para português do Brasil',
    enTitle: 'Switch to English',
  },

  window: {
    title: 'Pop Search System',
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    restore: 'Restaurar',
    close: 'Fechar',
  },

  taskbar: {
    start: 'Iniciar',
  },

  desktop: {
    myComputer: 'Meu Computador',
    recycleBin: 'Lixeira',
  },

  closed: {
    phrases: [
      'Programa encerrado. Quem manda agora é o gato.',
      'Erro fatal: gato detectado.',
      'Você fechou. O gato abriu.',
      'Esta máquina foi desligada por um gato.',
      'Parabéns, você achou o gato.',
      'Agora é seguro fazer carinho no gato.',
      'Sistema offline. O gato dormiu no teclado.',
      'Acesso negado. Apenas o gato tem privilégios de administrador agora.',
      'O gato caçou o mouse. Aplicação encerrada.',
      'Erro 404: Ração não encontrada.',
      'Sessão encerrada. O gato ronronou e quer atenção.',
      'Busca interrompida. O gato derrubou o servidor.',
      'Tudo certo por aqui. Pode ir limpar a caixa de areia.',
      'O sistema caiu. Não deixem gatos fazer deploy.',
      'Asdhfjkçasldkjf... desculpe, o gato pisou no teclado.',
      'Processo finalizado. Mas tudo bem, o gato ainda tem 6 vidas.',
    ],
    hint: 'Abra o Pop Search na área de trabalho para voltar.',
    catAlt: 'Um gato',
  },

  gate: {
    title: 'É preciso ter conta para adicionar vídeos.',
    body: 'Indexar um vídeo passa ele pela IA, então isso é limitado a quem está logado. Buscar no acervo continua aberto a todo mundo.',
    signIn: 'Entrar',
    takeTour: '🎓 Fazer o tour',
  },

  footer: '© 1998 Pop Search Corp. - Todos os direitos reservados.',

  common: {
    ready: 'Pronto',
    cancel: 'Cancelar',
    back: 'Voltar',
    save: 'Salvar',
    saving: 'Salvando...',
  },

  searchModes: {
    hybrid: {
      label: 'Híbrida',
      hint: 'Significado e termos exatos juntos. Um vídeo é encontrado pelo que ele mostra ou pelas palavras que contém.',
      operatorScope:
        'Estes operadores valem para a metade da busca por termos exatos. A metade por significado sempre lê o seu texto inteiro.',
    },
    semantic: {
      label: 'Semântica',
      hint: 'Só significado. Encontra vídeos relacionados mesmo quando nenhuma das suas palavras aparece neles.',
      operatorScope:
        'Não disponível aqui. Aspas e sinais de menos são lidos como caracteres comuns e mudam a interpretação do seu texto.',
    },
    text: {
      label: 'Exata',
      hint: 'Só termos literais. O vídeo precisa conter todas as palavras que você digitou, em qualquer ordem.',
      operatorScope: 'Estes operadores controlam a busca inteira.',
    },
  },

  presets: {
    broad: {
      label: 'Ampla',
      hint: 'Mais resultados, incluindo conexões vagas. Útil quando você não lembra as palavras exatas.',
    },
    balanced: {
      label: 'Equilibrada',
      hint: 'Equilibra abrangência e relevância. Recomendada para a maioria das buscas.',
    },
    precise: {
      label: 'Precisa',
      hint: 'Só correspondências fortes. Menos resultados, todos bem próximos do que você buscou.',
    },
    caption: 'Precisão:',
    groupLabel: 'Precisão da busca',
    custom: (percent: number) => `Personalizado (${percent}%)`,
  },

  search: {
    placeholder: 'Digite para buscar...',
    submit: 'Buscar',
    loading: 'Consultando o banco...',
    emptyTitle: '0 encontrados.',
    emptyWithThreshold: (percent: number) => (
      <>
        Nenhuma correspondência semântica acima de <strong>{percent}%</strong> e nenhum termo exato
        encontrado. Tente a precisão <strong>Ampla</strong> ou outras palavras.
      </>
    ),
    emptyLiteral: (
      <>
        Nenhum vídeo contém todas as palavras que você digitou. Use menos palavras ou mude para o
        modo <strong>Híbrida</strong> para encontrar por significado também.
      </>
    ),
    status: {
      failed: (error: string) => `Falha na busca: ${error}`,
      running: (query: string) => `Buscando no banco por: "${query}"...`,
      none: 'Busca concluída. Nenhum objeto encontrado.',
      found: (count: number) => `Busca concluída. ${count} objeto(s) encontrado(s).`,
      cancelled: 'Busca cancelada.',
    },
    errors: {
      rateLimited: 'Buscas demais! Espere um minuto e tente de novo.',
      timeout: 'A busca demorou demais.',
      detail: (detail: string) => `Erro: ${detail}`,
      generic: 'Erro ao acessar o índice do banco.',
    },
  },

  advanced: {
    queryLabel: 'Termo de busca:',
    hide: '▲ Ocultar avançado',
    show: '▼ Avançado',
    modeLegend: 'Modo de busca',
    modeGroupLabel: 'Modo de busca',
    modeHelp:
      'Escolhe como um vídeo se qualifica como resultado: por significado, pelas palavras literais que você digitou, ou os dois.',
    thresholdLegend: 'Limiar de correspondência',
    thresholdLabel: 'Limiar de correspondência',
    thresholdHelp:
      'Controla o rigor da correspondência semântica (por significado). Valores mais altos devolvem menos resultados, porém mais precisos.',
    custom: ' (Personalizado)',
    scaleLow: 'Mais resultados',
    scaleHigh: 'Menos, mais rígido',
    thresholdDisabled: (mode: string) => (
      <>
        Não usado no modo <strong>{mode}</strong>: a correspondência é literal, então nada é
        pontuado por similaridade.
      </>
    ),
    syntaxLegend: 'Sintaxe de busca',
    syntax: [
      {
        example: 'baleia bebê',
        meaning: 'As duas palavras são obrigatórias. Cada palavra a mais restringe a busca.',
      },
      { example: '"baleia assassina"', meaning: 'Essa frase exata, nessa ordem.' },
      { example: 'baleia -orca', meaning: 'Contém a primeira, exclui a segunda.' },
      { example: 'baleia or golfinho', meaning: 'Qualquer uma das palavras basta.' },
    ],
    resultsLegend: 'Resultados',
    maxResults: 'Máximo de resultados por busca',
  },

  card: {
    both: {
      label: 'significado + palavras',
      title: 'Encontrado tanto por semântica quanto pelos termos exatos que você digitou.',
    },
    words: {
      label: 'palavras',
      title: 'Encontrado porque o vídeo contém os termos que você digitou.',
    },
    meaning: {
      label: 'significado',
      title: 'Encontrado por significado. Suas palavras exatas podem não aparecer neste vídeo.',
    },
    match: (percent: number) => `MATCH: ${percent}%`,
    noDescription: 'Sem descrição disponível',
    copy: 'Copiar',
    copyTitle: 'Copiar URL',
    copied: 'URL copiada para a área de transferência!',
  },

  quota: {
    loading: 'Carregando uso...',
    label: 'Análises este mês',
    barLabel: 'Análises usadas este mês',
    tokens: (amount: string) => `${amount} tokens de IA usados`,
    exhausted: (date: string) =>
      `Limite atingido. Renova em ${date}. Você ainda pode adicionar vídeos manualmente.`,
    remaining: (left: number, date: string) => `${left} restantes, renova em ${date}`,
  },

  myVideos: {
    loading: 'Carregando seus vídeos...',
    empty: (
      <>
        Você ainda não adicionou nenhum vídeo. Use <strong>Add-Video.exe</strong> para indexar o
        primeiro.
      </>
    ),
    title: 'Meus vídeos',
    count: (n: number) => `${n} indexado(s)`,
    errors: {
      expired: 'Sua sessão expirou. Entre de novo.',
      rateLimited: 'Requisições demais. Espere um minuto e tente de novo.',
      generic: 'Não foi possível carregar seus vídeos.',
    },
  },

  ingest: {
    urlLabel: 'Insira a URL:',
    urlPlaceholder: 'https://...',
    next: 'Avançar',
    openForm: 'Abrir formulário',
    manualInput: 'Entrada manual',
    optionsTitle: 'Opções de análise',
    optionsDescription:
      'Por padrão, a IA devolve um título sugerido e uma descrição do vídeo. Selecione campos adicionais abaixo se precisar.',
    scenes: 'Elementos de cenário',
    audio: 'Transcrição do áudio',
    runAnalysis: 'Analisar',
    status: {
      analysed: 'Análise concluída. Revise os dados abaixo.',
      failed: 'A análise falhou. Veja os detalhes na caixa de erro.',
      invalid: (reason: string) => `Erro: ${reason}`,
      analysing: 'Analisando o vídeo... Aguarde.',
      manual: 'Modo manual: preencha os dados do vídeo abaixo.',
      saving: 'Salvando os dados no banco...',
      saved: 'Vídeo salvo! Pronto para o próximo.',
      saveFailed: 'Erro: não foi possível salvar o vídeo. Tente de novo.',
      cancelled: 'Análise cancelada pelo usuário.',
      reset: 'Pronto para o próximo vídeo.',
    },
    errors: {
      timeout: 'Tempo esgotado no servidor (504). O vídeo pode ser longo demais.',
      rateLimited: 'Requisições demais. Espere um momento.',
      unauthorized: 'Entre na sua conta para analisar vídeos.',
      generic: 'Não foi possível analisar o vídeo.',
    },
  },

  review: {
    generalLegend: 'Informações gerais',
    titleLabel: 'Título sugerido',
    titleHint: '(mín. 5 palavras)',
    descriptionLabel: 'Descrição completa',
    descriptionHint: '(mín. 20 palavras)',
    sourceLabel: 'URL de origem (somente leitura)',
    scenesLegend: 'Elementos de cenário',
    scenesLabel: 'Elementos de cenário (separados por vírgula)',
    scenesPlaceholder: 'mesa de cozinha, tigela azul, janela',
    audioLegend: 'Análise do áudio',
    transcription: 'Transcrição / letra',
    track: 'Nome da música',
    artist: 'Artista',
  },

  validation: {
    urlRequired: 'Digite uma URL',
    urlInvalid: 'Digite uma URL válida',
    invalidUrl: 'URL inválida',
    titleRequired: 'O título é obrigatório',
    titleWords: 'O título precisa ter pelo menos 5 palavras',
    descriptionRequired: 'A descrição é obrigatória',
    descriptionWords: 'A descrição precisa ter pelo menos 20 palavras',
  },

  assistant: {
    label: 'Assistente',
    close: 'Dispensar o assistente',
    restore: 'Mostrar o assistente',
    step: (current: number, total: number) => `Passo ${current} de ${total}`,
    tips: {
      welcome:
        'Olá! Eu sou o assistente do Pop Search. Digite alguma coisa e eu te conto o que o acervo fez com a sua busca.',
      operatorsIgnored:
        'Vi aspas ou operadores no seu texto. No modo Semântica eles viram caracteres comuns e mudam o sentido da frase. Troque para Híbrida ou Exata para usá-los.',
      thresholdTooHigh: (percent: number) =>
        `Nada voltou com o limiar em ${percent}%. Ele só aperta a metade por significado, nunca a de palavras. Tente a precisão Ampla.`,
      textTooRestrictive:
        'Nada voltou. Palavras soltas são combinadas com E, então cada palavra a mais fecha o cerco. Use menos palavras, ou "a or b".',
      nothingFound:
        'Nada voltou. O acervo ainda é pequeno, então pode ser que esse assunto simplesmente não more aqui.',
      onlyText:
        'Vale reparar: todos estes chegaram pelas palavras exatas. Nenhum casou por significado.',
      onlySemantic:
        'Nenhum destes contém as suas palavras literalmente. Todos foram achados pelo que mostram.',
    },
  },

  ingestAssistant: {
    tips: {
      start:
        'Cole o link de um post do X que tenha vídeo. Aqui só funciona twitter.com e x.com, porque o download depende disso.',
      badLink:
        'Esse link não é do X nem do Twitter, e o servidor vai recusar. Use o endereço do post original, aquele que termina em /status/ e um número.',
      ready:
        'Escolha o que a IA deve observar. Cenário lê o que aparece na tela, Áudio transcreve o que se ouve. Analisar gasta uma análise da sua cota mensal.',
      manual:
        'No modo manual você escreve os campos com as próprias mãos. Nada passa pela IA e nada sai da sua cota. Serve para quando a análise falhou, ou quando você prefere descrever do seu jeito.',
      analysing:
        'Estou baixando o vídeo e entregando para o Gemini assistir. Costuma levar de trinta segundos a dois minutos, então deixe a janela aberta.',
      failed:
        'A análise não foi adiante. Falhas contam na cota assim mesmo, porque os tokens foram gastos de todo jeito. A exceção é o serviço de IA estar sem capacidade, aí nada é cobrado. Você pode tentar de novo ou ir pelo modo manual.',
      review:
        'Nada entra no acervo sem passar por você. Confira o que a IA escreveu, corrija o que estiver errado e só então salve. Salvar não gasta análise.',
    },
  },

  auth: {
    signedInAs: 'Conectado como',
    signOut: 'Sair',
    signedOut: 'Você saiu.',
    signedIn: 'Você entrou.',
    createAccount: 'Criar conta',
    signIn: 'Entrar',
    subtitle: 'Buscar é aberto a todo mundo. A conta é o que permite adicionar vídeos ao acervo.',
    displayName: 'Nome de exibição',
    email: 'E-mail',
    password: 'Senha',
    created: 'Conta criada. Se for preciso confirmar, veja sua caixa de entrada antes de entrar.',
    tourInvite: 'Enquanto isso, conheça o app pelo tour. Não consome análise nem precisa de conta.',
    working: 'Processando...',
    toSignIn: 'Já tem conta? Entre',
    toSignUp: 'Ainda não tem conta? Crie uma',
    errors: {
      invalidCredentials: 'E-mail ou senha incorretos.',
      emailTaken: 'Esse e-mail já tem uma conta. Tente entrar.',
      passwordTooShort: 'A senha é curta demais. Use pelo menos 6 caracteres.',
      emailNotConfirmed: 'Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.',
    },
  },

  admin: {
    notAdmin: 'Esta página é para administradores.',
    loading: 'Carregando estatísticas...',
    noData: 'Ainda não há dados.',
    loadFailed: 'Não foi possível carregar as estatísticas.',
    title: 'Estatísticas do projeto',
    rangeLabel: 'Período',
    range: (days: number) => `${days} dias`,
    avgLabel: 'Média por análise',
    avgHint: (median: string, measured: number) => `mediana ${median} · ${measured} medidas`,
    extremesLabel: 'Mais barata / mais cara',
    extremesHint: 'tokens, uma análise',
    analysesLabel: 'Análises',
    analysesHint: (saves: string, tokens: string) => `${saves} salvos · ${tokens} tokens no total`,
    failureLabel: 'Taxa de falha',
    failureHint: (wasted: string) => `${wasted} tokens gastos à toa`,
    todayLabel: 'Hoje',
    ceilingHit: 'teto atingido, ninguém consegue analisar',
    againstCeiling: 'em relação ao teto diário',
    projectedLabel: 'Um dia cheio custaria',
    projectedHint: 'tokens, no teto e na média atual',
    perDayLegend: 'Análises por dia',
    perDayEmpty: 'Nada neste período.',
    barTitle: (date: string, analyses: number, tokens: string) =>
      `${date}: ${analyses} análises, ${tokens} tokens`,
    perDayNote:
      'Passe o mouse numa barra para ver o dia exato. Use isso para saber se o teto está perto da demanda real.',
    failuresLegend: 'Por que as análises falharam',
    failuresEmpty: 'Nenhuma falha neste período.',
    reason: 'Motivo',
    count: 'Quantidade',
    failuresNote:
      'Toda falha aqui gastou tokens mesmo assim. Um motivo que se repete vale ser corrigido antes de aumentar o limite de alguém.',
    perUserLegend: 'Consumo por conta, este mês',
    user: 'Usuário',
    tokens: 'Tokens',
    perUserNote:
      'Os tokens são o que conta na cota do Google AI. As análises são o que limita cada conta.',
  },

  tour: {
    counter: (current: number, total: number) => `Passo ${current} de ${total}`,
    back: '◀ Voltar',
    next: 'Avançar ▶',
    restart: '↺ Começar de novo',
    steps: {
      welcome: {
        tab: 'Bem-vindo',
        title: 'O que é o Pop Search',
        body: (
          <>
            <p>
              Um acervo de vídeos do Twitter e do X que você pode buscar por significado, não só
              pelas palavras que alguém digitou.
            </p>
            <p>
              Cada vídeo é assistido por uma IA, que escreve uma descrição e lista as pessoas, os
              objetos e a fala que encontra. É esse texto que a busca consulta.
            </p>
            <p className={demo.reassure}>
              Nada aqui é salvo, e nenhuma IA é chamada. Fique à vontade.
            </p>
          </>
        ),
      },
      search: {
        tab: TAB_LABELS.search,
        title: 'Encontrando um vídeo',
        intro: <p>Aberto a todo mundo, sem precisar de conta. Três modos:</p>,
        definitions: [
          {
            term: 'Híbrida',
            definition:
              'Significado e palavras exatas juntos. Uma busca por "gato" encontra um vídeo descrito como "felino laranja" e outro cujo título diz gato literalmente.',
          },
          {
            term: 'Semântica',
            definition:
              'Só significado. Encontra vídeos relacionados que não têm nenhuma palavra em comum com a sua busca.',
          },
          {
            term: 'Exata',
            definition: 'Só palavras literais. Toda palavra que você digitar precisa aparecer.',
          },
        ],
        outro: (
          <>
            <p>
              Em <strong>Avançado</strong> você também define o rigor da correspondência, quantos
              resultados devolver, e lê os operadores aceitos: <code>"frase exata"</code>,{' '}
              <code>-excluir</code> e <code>a or b</code>.
            </p>
            <p>
              Cada resultado traz um selo dizendo se ele foi encontrado por significado, por
              palavras, ou pelos dois.
            </p>
          </>
        ),
      },
      ingest: {
        tab: TAB_LABELS.ingest,
        title: 'Adicionando um vídeo',
        body: (
          <p>
            Esta é a parte que precisa de conta, porque cada análise custa tempo de IA. Experimente
            o fluxo inteiro abaixo com um exemplo real.
          </p>
        ),
      },
      manual: {
        tab: `${TAB_LABELS.ingest} → Entrada manual`,
        title: 'Adicionando sem a IA',
        body: (
          <>
            <p>
              Marque <strong>Entrada manual</strong> na tela de adicionar e você recebe o mesmo
              formulário de revisão, vazio, para preencher você mesmo. Nenhum vídeo é baixado e
              nenhuma IA é chamada.
            </p>
            <p>Dois motivos para usar:</p>
            <ul className={demo.list}>
              <li>
                <strong>Suas análises acabaram.</strong> Entradas manuais não contam no limite
                mensal, então o acervo continua aberto para você.
              </li>
              <li>
                <strong>Você descreve melhor.</strong> Uma piada ou uma referência que a IA não
                pega é justamente o que torna um vídeo encontrável depois.
              </li>
            </ul>
            <p className={demo.hint}>
              Vídeos adicionados à mão são buscáveis como qualquer outro: a descrição que você
              escreve é o que a busca lê.
            </p>
          </>
        ),
      },
      library: {
        tab: TAB_LABELS.myVideos,
        title: 'O que você contribuiu',
        body: (
          <>
            <p>
              Tudo o que você adicionou, do mais recente ao mais antigo, com link para o post
              original. Os vídeos pertencem a quem os indexou.
            </p>
            <p>
              O acervo em si continua público: qualquer pessoa encontra seus vídeos pela busca, com
              ou sem conta.
            </p>
          </>
        ),
      },
      account: {
        tab: '👤 Conta',
        title: 'Sua conta e os limites',
        body: (
          <>
            <p>
              Cadastre-se com e-mail e senha. Cada conta recebe um número de análises por mês,
              mostrado como uma barra nesta aba e acima do formulário de adicionar.
            </p>
            <p>
              O limite existe porque assistir a um vídeo com IA é a parte cara. Duas coisas que vale
              saber:
            </p>
            <ul className={demo.list}>
              <li>Uma análise que falha conta mesmo assim, porque a IA já foi paga.</li>
              <li>Adicionar um vídeo à mão, sem a IA, não conta no limite.</li>
            </ul>
            <p>O contador zera no primeiro dia de cada mês.</p>
          </>
        ),
      },
    },
    demoSearch: {
      tryIt: (query: string) => `Experimente: busque por “${query}”`,
      inputLabel: 'Busca de exemplo',
      submit: 'Buscar',
      badgeHint:
        'Repare no selo de cada resultado. O primeiro contém a palavra e é sobre um gato, então foi encontrado das duas formas. O segundo nunca diz “gato” - uma girafa rodando apareceu porque a busca entendeu a ideia. O terceiro foi encontrado só pela palavra.',
      modeHint: (
        <>
          No modo <strong>Exata</strong> a girafa sumiria. No modo <strong>Semântica</strong>,
          sumiria o terceiro.
        </>
      ),
    },
    demoUpload: {
      step1: 'Passo 1 - cole um link',
      urlLabel: 'URL de vídeo de exemplo',
      step1Hint:
        'Só links do twitter.com e do x.com são aceitos. As análises de cenário e de áudio vêm ligadas por padrão, e são elas que preenchem os metadados buscáveis abaixo.',
      runAnalysis: 'Analisar',
      step2: 'Passo 2 - a IA assiste ao vídeo',
      step2Hint:
        'De verdade, o app baixa o vídeo, manda para o Gemini e espera uma descrição. Este tour pula isso e usa um resultado capturado antes.',
      step3: 'Passo 3 - você revisa o que a IA escreveu',
      step3Hint:
        'Todo campo é editável. Esta é a conferência humana antes de qualquer coisa ser indexada, e é o mesmo formulário que o fluxo real usa.',
      step4: 'Passo 4 - indexado',
      savedNotice: (
        <>
          <strong>Nada foi salvo.</strong> No app de verdade este vídeo já estaria no acervo e
          encontrável por qualquer pessoa, e contaria como uma das suas análises do mês.
        </>
      ),
      again: 'Rodar de novo',
    },
  },
};
