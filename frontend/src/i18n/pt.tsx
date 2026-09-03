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
    previous: 'Dica anterior',
    next: 'Próxima dica',
    card: (current: number, total: number) => `${current}/${total}`,
    step: (current: number, total: number) => `Passo ${current} de ${total}`,
    tips: {
      welcome: [
        'Olá! Eu sou o assistente do Pop Search. Buscar é aberto a todo mundo, não precisa de conta.',
        'O modo Híbrida procura de duas formas ao mesmo tempo: pelo significado do vídeo e pelas palavras que ele contém.',
        'A precisão só aperta o lado do significado. Um vídeo que contém a palavra que você digitou aparece em qualquer precisão.',
      ],
      typing: [
        'Aperte buscar quando quiser. Buscar não custa nada e não exige conta.',
        'Aspas fazem frase exata, o menos exclui uma palavra, e "a or b" aceita qualquer uma das duas. Isso comanda o lado das palavras.',
        'Acentos não importam em nenhum dos lados. Digitar musica encontra música.',
      ],
      searching: ['Perguntando aos dois lados ao mesmo tempo...'],
      operatorsIgnored: [
        'Vi aspas ou operadores no seu texto. No modo Semântica eles viram caracteres comuns e mudam o sentido da frase.',
        'Troque para Híbrida ou Exata se quiser que eles funcionem.',
      ],
      thresholdTooHigh: (percent: number) => [
        `Nada voltou com o limiar em ${percent}%.`,
        'Ele só aperta a metade por significado, nunca a de palavras. Tente a precisão Ampla.',
      ],
      textTooRestrictive: [
        'Nada voltou. Palavras soltas são combinadas com E, então cada palavra a mais fecha o cerco.',
        'Use menos palavras, ou "a or b" para aceitar qualquer uma delas.',
      ],
      nothingFound: [
        'Nada voltou. O acervo ainda é pequeno, então pode ser que esse assunto simplesmente não more aqui.',
        'Tente uma palavra mais ampla, ou mude para Híbrida para o significado ajudar.',
      ],
      onlyText: [
        'Vale reparar: todos estes chegaram pelas palavras exatas. Nenhum casou por significado.',
        'Isso costuma querer dizer que o acervo tem as palavras, mas não o assunto que você tinha em mente.',
      ],
      onlySemantic: [
        'Nenhum destes contém as suas palavras literalmente. Todos foram achados pelo que mostram.',
        'Essa é a metade que uma busca de texto comum não faz: a IA assistiu ao vídeo e descreveu o que viu.',
      ],
      goodResults: (counts: { both: number; meaning: number; words: number }) => {
        const parts: string[] = [];
        if (counts.both) parts.push(`${counts.both} pelos dois lados`);
        if (counts.meaning) parts.push(`${counts.meaning} só por significado`);
        if (counts.words) parts.push(`${counts.words} só por palavras`);

        return [
          `A composição foi essa: ${parts.join(', ')}.`,
          'A ordem não vem da nota de nenhum dos lados. Vem da posição do vídeo em cada ranking, fundida pelo Reciprocal Rank Fusion.',
          'Aumente a precisão para cortar as conexões vagas, ou diminua para deixar entrar mais significado.',
        ];
      },
    },
  },

  ingestAssistant: {
    tips: {
      start: [
        'Cole o link de um post do X que tenha vídeo. Aqui só funciona twitter.com e x.com, porque o download depende disso.',
        'O que vem depois: a IA assiste ao vídeo e escreve título, descrição, quem aparece, o que tem no cenário e a transcrição do áudio.',
        'Tudo isso vira material de busca. É por isso que alguém consegue achar este vídeo depois pelo significado, sem saber nenhuma palavra dele.',
        'Aí você revisa tudo. Nada entra no acervo sem a sua aprovação.',
        'Prefere fazer na mão? A entrada manual deixa você escrever os campos, sem IA e sem gastar cota.',
        'Cada análise custa uma da sua cota mensal, e o projeto inteiro tem um teto diário. Buscar continua livre para todo mundo.',
      ],
      badLink: [
        'Esse link não é do X nem do Twitter, e o servidor vai recusar.',
        'Use o endereço do post original, aquele que termina em /status/ e um número.',
      ],
      ready: [
        'Escolha o que a IA deve observar. Cenário lê o que aparece na tela, Áudio transcreve o que se ouve.',
        'Desligar um dos dois deixa a análise mais rápida e mais barata, mas o vídeo fica mais difícil de achar depois.',
        'Analisar gasta uma análise da sua cota mensal. Uma que falha também conta, então confira o link antes.',
      ],
      manual: [
        'No modo manual você escreve os campos com as próprias mãos. Nada passa pela IA e nada sai da sua cota.',
        'Serve para quando a análise falhou, ou quando você prefere descrever o vídeo do seu jeito.',
        'Ele ainda ganha um embedding ao salvar, então uma entrada manual é igualmente encontrável por significado.',
      ],
      analysing: [
        'Estou baixando o vídeo e entregando para o Gemini assistir. Costuma levar de trinta segundos a dois minutos.',
        'Deixe a janela aberta. Cancelar aqui não devolve a cota se o vídeo já chegou na IA.',
      ],
      failed: [
        'A análise não foi adiante.',
        'Falhas contam na cota assim mesmo, porque os tokens foram gastos de todo jeito. A exceção é o serviço de IA estar sem capacidade, aí nada é cobrado.',
        'Você pode tentar de novo, ou ir pela entrada manual e descrever você mesmo, de graça.',
      ],
      review: [
        'Nada entra no acervo sem passar por você. Confira o que a IA escreveu e corrija o que estiver errado.',
        'A descrição é onde a maior parte da busca acontece, então vale ler com atenção.',
        'Salvar não gasta análise. Cancelar joga o resultado fora e a cota não volta.',
      ],
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

  welcome: {
    title: 'Bem-vindo ao Pop Search',
    close: 'Fechar',
    heading: 'O que voce quer fazer primeiro?',
    blurb: 'Buscar no acervo e aberto a todo mundo. Adicionar video pede uma conta. E se voce so quer entender o que este lugar faz, eu te acompanho pelo app inteiro.',
    takeTour: 'Fazer o tutorial',
    signIn: 'Entrar ou criar conta',
    explore: 'Explorar sozinho',
  },

  tour: {
    next: 'Avancar',
    finish: 'Concluir',
    open: 'Fazer o tutorial',
    running: 'Tutorial em andamento',
    script: {
      welcome: [
        'Oi! Vou te acompanhar pelo app inteiro, aba por aba. Tudo aqui roda com exemplos guardados, entao nada gasta IA e nada entra no acervo de verdade.',
        'Pode clicar, digitar e mexer a vontade. Se quiser sair, e so fechar a minha janelinha.',
      ],
      search: [
        'Esta e a busca, e ela e aberta: qualquer pessoa busca sem ter conta.',
        'Ela faz duas perguntas ao mesmo tempo. Uma procura pelo significado do video, usando o que a IA viu nele. A outra procura pelas palavras que o video contem.',
        'Digite gato no campo e clique em buscar. Eu espero aqui.',
      ],
      results: [
        'Repare na etiqueta de cada resultado. Uma diz significado mais palavras, outra so significado, outra so palavras.',
        'Um dos resultados e uma girafa. Ela apareceu numa busca por gato porque a IA assistiu ao video e descreveu a cena, e o significado aproximou os dois. Busca de texto comum nao faz isso.',
        'Outro tem a palavra gato escrita na descricao, mas nao casou por significado. Caminho oposto, mesmo destino: ele aparece.',
      ],
      precision: [
        'Ali em cima tem a precisao. Mude para Precisa e busque de novo.',
        'Um resultado sai da lista. A precisao aperta so o lado do significado, nunca o das palavras. Por isso quem tem a palavra exata continua aparecendo em qualquer precisao.',
      ],
      ingest: [
        'Agora a outra metade: como um video entra no acervo. Normalmente isto exige conta, mas no tutorial esta liberado.',
        'Cole qualquer link do X no campo. Pode ser inventado, porque aqui eu respondo com um exemplo guardado.',
      ],
      analysis: [
        'Clique em analisar e observe. A IA baixa o video, assiste e escreve titulo, descricao, quem aparece, o que tem no cenario e a transcricao do audio.',
        'Numa analise de verdade isso leva de trinta segundos a dois minutos e consome uma da sua cota mensal.',
      ],
      review: [
        'Este e o passo que mais importa: nada entra no acervo sem passar por uma pessoa.',
        'A IA erra. Voce le, corrige o que estiver torto e so entao salva. E por isso que da para confiar no acervo.',
      ],
      library: [
        'Aqui ficam os videos que voce adicionou. Estes dois sao exemplos do tutorial.',
      ],
      account: [
        'Por ultimo, a sua conta. E aqui que fica a cota mensal de analises e o botao para refazer este tutorial quando quiser.',
        'Buscar continua livre para todo mundo, sem conta. A conta serve para contribuir com o acervo. O formulario esta logo abaixo se voce quiser criar uma, e esta tudo bem se nao quiser: voce ja viu o app inteiro.',
      ],
    },
  },
};
