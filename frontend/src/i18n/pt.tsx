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

  system: {
    title: 'Propriedades do Sistema',
    tabs: {
      general: 'Geral',
      devices: 'Gerenciador de dispositivos',
      performance: 'Desempenho',
    },
    asking: 'perguntando ao servidor...',
    silent: 'o servidor não respondeu',
    general: {
      system: 'Sistema:',
      name: 'Pop Search 98',
      version: (version) => `versão ${version}`,
      registered: 'Registrado para:',
      visitor: 'Visitante',
      computer: 'Computador:',
      memory: (numbers) => `${numbers} números de memória por vídeo`,
      videos: (count, shown) => (count === 1 ? '1 vídeo no acervo' : `${shown} vídeos no acervo`),
    },
    devices: {
      root: 'Pop Search',
      list: 'Dispositivos',
      status: 'Estado do dispositivo',
      working: 'Este dispositivo está funcionando corretamente.',
      ready: 'Este dispositivo está instalado e esperando trabalho. Ele não é testado daqui.',
      waking: 'Este dispositivo ainda está acordando.',
      failing: 'Este dispositivo não está respondendo.',
      asking: 'Perguntando ao servidor como está este dispositivo...',
      unsaid: 'O servidor não disse como está este dispositivo.',
      undriven: 'Nenhum driver instalado para este dispositivo. Funciona mesmo assim.',
      refresh: 'Atualizar',
      remove: 'Remover',
      screen: {
        kind: 'Monitor',
        name: (react) => `Seu navegador, rodando React ${react}`,
        about: 'Desenha tudo o que você vê. A área de trabalho inteira é uma página só.',
        size: (width, height) => `${width} × ${height} pixels agora.`,
        refusal: 'Você está olhando por ele. Remover agora seria falta de educação.',
      },
      server: {
        kind: 'Portas',
        name: 'Servidor FastAPI, no Render',
        about: 'Recebe o que a página pede e conversa com todo o resto.',
        woke: (time) =>
          `Levou ${time} para responder nesta visita. Ele dorme quando ninguém está usando.`,
        up: (time) => `Ligado há ${time}.`,
        runtime: (python, framework) => `Python ${python}, ${framework}.`,
        refusal: 'Sem ele ninguém busca nada. Pedido negado.',
      },
      database: {
        kind: 'Unidades de disco',
        name: 'Postgres com pgvector, no Supabase',
        about:
          'Guarda cada vídeo duas vezes: em palavras, para a busca exata, e em números, para a busca por significado.',
        videos: (count, shown) => (count === 1 ? '1 vídeo guardado.' : `${shown} vídeos guardados.`),
        answered: (time) => `Respondeu em ${time}.`,
        refusal: 'Todos os vídeos moram aí. Nem pensar.',
      },
      analysis: {
        kind: 'Processador',
        name: (model) => `Gemini (${model})`,
        about: 'Assiste a cada vídeo do começo ao fim e escreve o título e a descrição.',
        idle: 'Só é chamado quando alguém guarda um vídeo. Perguntar como ele está gastaria a cota.',
        refusal: 'E quem ia assistir aos vídeos? Você?',
      },
      embedding: {
        kind: 'Coprocessador',
        name: (model) => `Gemini (${model})`,
        about: (numbers) =>
          `Transforma um texto em ${numbers} números. Textos sobre a mesma coisa ficam com números próximos, e é assim que a busca acha por significado.`,
        kept: (kept, room) =>
          `${kept} das últimas ${room} perguntas estão na memória: repetir uma delas não custa nada.`,
        refusal: 'Sem ele a busca só acharia a palavra exata.',
      },
      downloader: {
        kind: 'Modem',
        name: (version) => version,
        about: 'Busca o vídeo no X para a IA assistir, junto com o texto e a imagem do post.',
        refusal: 'Sem ele nenhum vídeo chega do X.',
      },
      robot: {
        kind: 'Outros dispositivos',
        name: 'BIP-98',
        about: 'Dispositivo desconhecido. Ninguém lembra de ter instalado.',
        refusal: 'O dispositivo se recusou a ser removido. E ainda ficou ofendido.',
      },
    },
    performance: {
      none: 'Nenhuma busca nesta visita ainda. Faça uma no Search.exe e volte: esta aba mostra quanto tempo cada etapa dela levou.',
      last: (query, mode) => `Última busca: "${query}" (${mode})`,
      found: (count) => (count === 1 ? '1 resultado' : `${count} resultados`),
      steps: {
        embed: 'Entender a pergunta (IA)',
        db: 'Procurar no acervo (banco de dados)',
        rest: 'Resto do servidor',
        network: 'O caminho de ida e volta',
      },
      skipped: 'pulada: este modo não usa a IA',
      total: 'Do clique até a resposta',
      unreported: 'Este servidor não informa quanto tempo cada etapa levou.',
      cached:
        'Uma pergunta já feita não é mandada de novo para a IA, e por isso essa etapa pode não levar tempo nenhum.',
    },
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

  boot: {
    title: 'Pop Search BIOS 1.0',
    maker: 'Copyright (C) 1998, Pop Search Corp.',
    program: 'Programa',
    language: 'Idioma',
    languageName: 'Português',
    session: 'Sessão',
    server: 'Servidor',
    ok: 'OK',
    checking: 'verificando...',
    visitor: 'visitante',
    calling: 'chamando...',
    waking: (seconds: number) => `acordando, ${seconds} s`,
    awake: (time: string) => `OK, em ${time}`,
    down: 'sem resposta',
    asleep: 'O servidor dorme quando ninguém usa. Acordar leva até um minuto.',
    goingIn: 'Entrando sem ele. O robô avisa quando o servidor acordar.',
    starting: 'Iniciando o Pop Search...',
    skip: 'Pressione qualquer tecla, ou toque na tela, para entrar agora.',
  },

  crash: {
    lead: 'Um erro fatal aconteceu e o Pop Search precisou parar:',
    reopen: 'Pressione qualquer tecla para reiniciar o Pop Search.',
    kept: 'Os vídeos já salvos continuam salvos. O que estava só na tela se perdeu.',
    again: 'O erro voltou logo depois de reiniciar.',
    reload: 'Pressione qualquer tecla para recarregar a página inteira.',
    goOn: 'Pressione qualquer tecla para continuar',
    robot: 'Xi. Isso não era para acontecer. Aperte uma tecla que eu ligo tudo de novo.',
    robotAgain: 'De novo?! Então vamos recarregar a página inteira.',
  },

  rebuild: {
    crash: {
      lead: 'Uma operação ilegal foi executada por você: o Pop Search foi jogado na Lixeira.',
      code: 'ERRO 0xL1X0: PROGRAMA_NAO_E_LIXO',
      steps: [
        'Não se joga o programa na Lixeira. É como jogar a casa no lixo da cozinha.',
        'A área de trabalho foi junto: ícones, barra de tarefas, relógio, tudo.',
      ],
      hold: 'Não pressione nenhuma tecla. O responsável já está a caminho',
    },
    setup: {
      spoken: 'Pop Search. Um robô está construindo a área de trabalho do zero. Pressione qualquer tecla para pular.',
    },
    says: {
      disbelief: 'Não. Não, não, NÃO. Eu não acredito nisso.',
      gone: 'Sumiu tudo. TUDO. Ficou só esse azul.',
      who: 'Quem foi que jogou o Pop Search na LIXEIRA?! Eu MORO aí dentro!',
      fine: 'Tá bom, tá bom. Eu monto tudo de novo. Mas você fica olhando.',
      done: 'Pronto, tudo de volta no lugar. E programa NÃO é lixo. Combinado?',
      hello: 'Não tem nada aqui ainda. Deixa comigo: eu faço tudo!',
    },
    emotes: {
      no: 'não...',
      noIcons: 'cadê os ícones?',
      noBar: 'e a barra?!',
      noClock: 'nem o relógio?!',
      one: 'uma lixeira...',
      two: 'um computador...',
      polish: 'essa aqui com carinho',
      three: 'e a minha casa!',
      bar: 'agora, a barra',
      heave: 'hnnngh!',
      slip: 'escorregou!',
      heaveAgain: 'de novo...',
      slipAgain: 'ah, é assim?!',
      barUp: 'AGORA VAI!',
      phew: 'ufa...',
      start: 'e o Iniciar, de enfeite',
      hammer: 'toc toc toc',
      unset: '12:00? não.',
      ticking: 'pronto, funcionando!',
      shoo: 'xô, azul!',
      shooMore: 'sai, sai, sai!',
      clean: 'limpinho!',
      knock: 'abre!',
      knockHard: 'ABRE!!',
      pull: 'hnnnngh!!',
      slipped: 'não, não, não!',
      pullHard: 'SÓ... MAIS... UM...',
      open: 'abriu!',
      ready: 'é todo seu!',
    },
    skip: 'pular ▸▸',
    skipTitle: 'Pular a reconstrução (Esc)',
  },

  gate: {
    title: 'É preciso ter conta para adicionar vídeos.',
    body: 'Indexar um vídeo passa ele pela IA, então isso é limitado a quem está logado. Buscar no acervo continua aberto a todo mundo.',
    signIn: 'Entrar',
    openGuide: '▶ Me mostre como funciona',
  },

  footer: '© 1998 Pop Search Corp. - Todos os direitos reservados.',

  common: {
    ready: 'Pronto',
    cancel: 'Cancelar',
    back: 'Voltar',
    save: 'Salvar',
    saving: 'Salvando...',
    ok: 'OK',
    closeOf: (what) => `Fechar ${what}`,
  },

  searchModes: {
    hybrid: {
      label: 'Híbrida',
      hint: 'Significado e termos exatos juntos. Um vídeo é encontrado pelo que ele mostra ou pelas palavras que contém.',
      operatorScope:
        'Valem para a parte da busca que procura as suas palavras. A parte que procura pelo significado lê o texto inteiro.',
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
      operatorScope: 'Aqui eles valem para a busca inteira.',
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
    precision: (percent: number) => `Precisão ${percent}%`,
    loading: 'Consultando o banco...',
    conCon: 'C:\\CON\\CON derrubava o Windows 98 de verdade. Aqui também derruba.',
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
    thresholdLegend: 'Ajuste fino da precisão',
    thresholdLabel: 'Limiar de correspondência',
    scaleLow: 'Mais vídeos',
    scaleHigh: 'Mais exigente',
    thresholdDisabled: (mode: string) => (
      <>
        Não usado no modo <strong>{mode}</strong>: a correspondência é literal, então nada é
        pontuado por similaridade.
      </>
    ),
    syntaxLegend: 'Atalhos de escrita',
    syntax: [
      {
        example: 'baleia bebê',
        meaning: 'As duas palavras são obrigatórias. Cada palavra a mais restringe a busca.',
      },
      { example: '"baleia assassina"', meaning: 'Essa frase exata, nessa ordem.' },
      { example: 'baleia -orca', meaning: 'Contém a primeira, exclui a segunda.' },
      { example: 'baleia or golfinho', meaning: 'Qualquer uma das palavras basta.' },
    ],
    resultsLegend: 'Máximo de resultados',
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
    more: 'ler mais ▾',
    less: 'ler menos ▴',
    copy: 'Copiar',
    copyTitle: 'Copiar URL',
    copied: 'URL copiada para a área de transferência!',
  },

  why: {
    open: 'Por quê?',
    title: 'Ver por que este vídeo apareceu, e nesta posição',
    heading: 'Por que este resultado?',
    final: (n) => `${n}º da lista.`,
    lead: {
      both: 'Apareceu pelo significado e pelas palavras.',
      words: 'Apareceu pelas palavras que você digitou.',
      meaning: 'Apareceu pelo significado: fala de algo parecido com o que você escreveu.',
    },
    meaning: 'Significado',
    words: 'Palavras',
    meaningPlace: (n, percent) =>
      `${n}º entre os vídeos mais parecidos: ${percent}% parecido com o que você escreveu.`,
    wordsPlace: (n) => `${n}º entre os vídeos que têm as suas palavras.`,
    belowCut: (percent) =>
      `Isso fica abaixo da precisão de ${percent}% pedida. Sozinho ele não estaria aqui: entrou pelas palavras.`,
    meaningUnlisted: 'Não ficou entre os vídeos mais parecidos.',
    wordsUnlisted: 'Não ficou entre os primeiros pelas palavras.',
    meaningOff: 'Este modo não procura por significado.',
    wordsOff: 'Este modo não procura por palavras.',
    showSum: 'Ver a conta >>',
    hideSum: '<< Esconder a conta',
    sum: {
      caption: 'Como a posição na lista foi calculada',
      list: 'Lista',
      place: 'Posição',
      points: 'Pontos',
      total: 'Soma',
      nth: (n) => `${n}º`,
      out: 'fora dela',
      formula: (k, place, points) => `1 ÷ (${k} + ${place}) = ${points}`,
    },
    how: 'São feitas duas listas, uma por significado e outra por palavras. Cada uma dá pontos pela posição do vídeo nela, e quem soma mais pontos vem primeiro.',
    howSingle: 'Neste modo só uma das duas listas é feita, então a ordem dela é a final.',
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
    edit: 'Editar',
    editOf: (title: string) => `Editar "${title}"`,
    remove: 'Excluir',
    removeOf: (title: string) => `Excluir "${title}"`,
    editing: 'Editando o vídeo',
    confirm: {
      question: 'Excluir este vídeo do acervo? Não dá para desfazer.',
      yes: 'Sim, excluir',
      removing: 'Excluindo...',
    },
    status: {
      editing: 'Mude o que precisar e salve.',
      editCancelled: 'Edição cancelada. O vídeo ficou como estava.',
      saving: 'Salvando as alterações...',
      saved: 'Alterações salvas.',
      saveFailed: 'Erro: não foi possível salvar as alterações. Tente de novo.',
      removing: 'Excluindo o vídeo...',
      removed: 'Vídeo excluído do acervo.',
      removeFailed: 'Erro: não foi possível excluir o vídeo. Tente de novo.',
    },
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
    progressLabel: 'Andamento da análise',
    stages: {
      queued: 'Preparando',
      downloading: 'Baixando o vídeo do X',
      uploading: 'Enviando o vídeo para a IA',
      watching: 'A IA está assistindo ao vídeo',
      writing: 'A IA está escrevendo a descrição',
    },
    duplicate: {
      title: 'Esse vídeo já está no acervo.',
      body: 'Nada foi descontado da sua cota.',
      added: (date: string) => `Adicionado em ${date}`,
      open: 'Abrir o post',
      dismiss: 'Fechar o aviso',
    },
    draft: {
      title: 'Você deixou uma análise sem salvar',
      body: 'A IA já descreveu este vídeo. Continue de onde parou, ou descarte: uma análise descartada não volta para a sua cota.',
      analysed: (date: string) => `Analisado em ${date}.`,
      resume: 'Continuar a revisão',
      discard: 'Descartar',
    },
    status: {
      stage: (step: string) => `${step}...`,
      draft: 'Há uma análise esperando para ser salva.',
      duplicate: 'Esse vídeo já está no acervo.',
      discarded: 'Análise descartada.',
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
      lost: 'Perdi o contato com o servidor no meio da análise. Ela pode ter continuado por lá: espere um pouco e recarregue a página antes de tentar de novo.',
    },
  },

  review: {
    generalLegend: 'Informações gerais',
    titleLabel: 'Título sugerido',
    titleHint: '(mín. 5 palavras)',
    descriptionLabel: 'Descrição completa',
    descriptionHint: '(mín. 20 palavras)',
    sourceLabel: 'URL de origem (somente leitura)',
    postLegend: 'Post original',
    postLabel: 'Texto do post',
    postHint: '(opcional, entra na busca)',
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
    guideInvite: 'Enquanto isso, deixe o assistente te mostrar o app. Não consome análise nem precisa de conta.',
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

  guide: {
    name: 'BIP-98',
    poke: 'Cutucar o BIP-98',
    beeps: ['Bip!', 'Bop.', 'Oi?', 'Ai!', 'Zzzt.'],
    emotes: {
      heavy: 'que pesado!',
      sorry: 'ops, desculpa!',
      knock: 'toc toc',
      puzzled: 'ué?',
      grabbed: ['eeei!', 'opa!', 'me solta!', 'uooou!'],
      bin: ['LIXO NÃO!!', 'EU NÃO SOU LIXO!', 'SOCORRO!!'],
      hiding: ['já passou?', 'ela já foi embora?', 'posso sair?'],
      dizzy: ['tô tonto...', 'para o mundo!', 'tá tudo girando...'],
      enough: ['chega!', 'para, faz cócegas!', 'ei, já deu!'],
      lurk: ['chega, vou me esconder!', 'tchau, fui!', 'me deixa em paz!'],
      found: ['me achou!', 'ops!', 'aqui não!'],
      flip: ['iupiii!', 'olha isso!', 'tcharam!'],
      roof: ['daqui eu vejo tudo', 'meu lugar preferido', 'que vista!'],
      yawn: ['uaaah...', 'que soninho...', 'cadê todo mundo?'],
      woke: ['ãh? acordei!', 'eu não tava dormindo!', 'opa, você voltou!'],
    },
    progress: (current: number, total: number) => `Passo ${current} de ${total}`,
    back: '◂ voltar',
    next: 'Entendi ▶',
    skip: 'pular ▸',
    skipTitle: 'Seguir sem fazer este passo',
    yourTurn: 'Sua vez:',
    close: 'Fechar o guia',
    closeTitle: 'Fechar o guia. Dá para retomar de onde você parou.',
    jumpTo: (step: number) => `Ir para o passo ${step}`,
    paused: (current: number, total: number) => `Guia pausado no passo ${current} de ${total}.`,
    resume: '▶ Retomar',
    quit: 'encerrar guia',
    offScript: (tab: string) => (
      <>
        Você saiu do roteiro. Esta parte do guia fica em <strong>{tab}</strong>.
      </>
    ),
    offScriptAction: 'Me leve de volta',
    invite: {
      fresh: {
        lead: 'Primeira vez aqui?',
        text: 'Eu te mostro o app inteiro em dois minutos.',
        start: '▶ Começar o guia',
      },
      again: {
        lead: 'Quer rever?',
        text: 'Eu te mostro o app de novo em dois minutos.',
        start: '▶ Rever o guia',
      },
      dismissTitle: 'Recolher. O guia continua lá em cima, na barra de título.',
    },
    chip: {
      label: 'Guia',
      title: 'Guia: o BIP-98 te mostra o app',
    },
    profile: {
      legend: 'Demonstração guiada',
      note: 'Um passeio guardando um vídeo e encontrando ele de novo. Nada é salvo e nenhuma IA é chamada.',
      start: '▶ Abrir o guia',
    },
    demo: {
      badge: 'DEMO',
      badgeTitle: 'Tela de treino. Nada daqui é enviado para lugar nenhum.',
      saved: (
        <>
          <strong>Salvo, de mentirinha.</strong> Como isto é um treino, nada foi guardado de
          verdade.
        </>
      ),
    },
    steps: {
      welcome: {
        title: 'Oi! Eu sou o BIP-98',
        say: (
          <>
            Sou o robô que mora aqui dentro e ajuda quem está chegando. Antes de te mostrar onde
            fica cada coisa, deixa eu te contar <strong>o que é o Pop Search</strong> e para que
            ele serve. É rapidinho.
          </>
        ),
        next: 'Me conta ▶',
      },
      about: {
        title: 'O que é o Pop Search',
        say: (
          <>
            Sabe aquele vídeo que você viu no X e depois nunca mais achou? O Pop Search é um
            arquivo de vídeos feito para isso não acontecer. Ele funciona em três tempos:
            <ol>
              <li>
                <strong>Você guarda</strong> Cola o link do post que tem o vídeo.
              </li>
              <li>
                <strong>A IA assiste</strong> Uma inteligência artificial vê o vídeo e escreve o
                que acontece nele.
              </li>
              <li>
                <strong>Você acha</strong> Depois é só escrever o que lembra, tipo{' '}
                <em>gato derrubando um copo</em>.
              </li>
            </ol>
            Agora eu te mostro cada parte funcionando, numa tela de treino: nada do que a gente
            fizer aqui vai para o app de verdade.
          </>
        ),
        next: 'Vamos lá ▶',
      },
      paste: {
        title: 'Guardar um vídeo',
        say: 'Tudo começa com o link de um post do X que tenha vídeo. No app de verdade você copia esse link e cola neste campo. Aqui eu já colei um de exemplo.',
        task: (
          <>
            clique em <strong>Avançar</strong>, ao lado do link.
          </>
        ),
      },
      options: {
        title: 'O que a IA vai olhar',
        say: 'Quem descreve o vídeo é uma inteligência artificial (IA): ela assiste e escreve o que vê. Aqui você escolhe se ela olha as cenas, ouve o áudio, ou os dois. Quanto mais ela olhar, mais fácil achar o vídeo depois.',
        task: (
          <>
            clique em <strong>Analisar</strong>.
          </>
        ),
      },
      analyzing: {
        title: 'A IA está assistindo',
        say: 'Agora a IA assiste ao vídeo inteiro e escreve um resumo dele. No app de verdade isso leva mais ou menos um minuto, e esta barra mostra o andamento. Aqui a gente não precisa esperar.',
        next: 'Pular a espera ▶',
      },
      review: {
        title: 'Confira o que a IA escreveu',
        say: 'Pronto: a IA sugeriu um título e uma descrição. Ela erra de vez em quando, então nada é guardado antes de você conferir. Clique em qualquer campo para corrigir. É esse texto que a busca vai ler depois.',
      },
      save: {
        title: 'Guardar',
        say: 'Quando o texto estiver bom, é só salvar. É nesse momento que o vídeo entra no arquivo.',
        task: (
          <>
            clique em <strong>Salvar</strong>, no fim do formulário.
          </>
        ),
      },
      saved: {
        title: 'Vídeo guardado',
        say: 'É isso! No app de verdade, a partir de agora qualquer pessoa conseguiria achar esse vídeo. Cada vídeo que a IA analisa gasta uma das suas análises do mês: toda conta tem um limite.',
      },
      manual: {
        title: 'E sem a IA?',
        say: (
          <>
            Reparou nesta caixinha? Com <strong>Entrada manual</strong> marcada a IA não é usada:
            você mesmo escreve o título e a descrição. Serve para quando as suas análises do mês
            acabarem, ou quando você explica o vídeo melhor do que a IA explicaria.
          </>
        ),
      },
      searchIntro: {
        title: 'Agora, encontrar',
        say: (
          <>
            Esta é a outra metade, e ela não pede conta: qualquer pessoa pode buscar. Você escreve
            o que lembra do vídeo, do seu jeito. Eu já escrevi <strong>gato</strong> para a gente
            testar.
          </>
        ),
        task: (
          <>
            clique em <strong>Buscar</strong>.
          </>
        ),
      },
      results: {
        title: 'O que apareceu',
        say: (
          <>
            Três vídeos. Olhe a etiqueta ao lado de cada um: ela conta por que aquele vídeo
            apareceu. <strong>palavras</strong> quer dizer que o texto dele tem a palavra que você
            digitou. <strong>significado</strong> quer dizer que ele fala de algo parecido, mesmo
            sem a palavra. Foi assim que uma girafa veio parar aqui. O botão{' '}
            <strong>Por quê?</strong> de cada um abre a explicação inteira.
          </>
        ),
      },
      modes: {
        title: 'Para afinar a busca',
        say: (
          <>
            O botão <strong>Avançado</strong> abre os ajustes: buscar só pelas palavras exatas, só
            pelo significado, ou pelos dois, que é o padrão. Abra e mexa à vontade: os resultados
            aqui embaixo mudam na hora.
          </>
        ),
      },
      account: {
        title: 'Para guardar vídeos, uma conta',
        say: 'Buscar é aberto para todo mundo. Para guardar vídeos você precisa de uma conta, porque cada análise da IA tem um custo. É nesta aba que você cria a sua e vê quantas análises ainda tem no mês.',
        next: 'Terminar ✓',
      },
    },
  },

  robot: {
    dismiss: 'Fechar',
    ask: (what: string) => `O que é ${what}?`,
    says: {
      tabs: {
        ingest: ['hora de guardar!', 'manda o link!', 'vídeo novo?'],
        search: ['vamos procurar?', 'o que a gente procura?', 'eu acho para você!'],
        library: ['sua coleção!', 'olha quanta coisa!', 'tudo guardado aqui'],
        account: ['sua conta', 'seus dados ficam aqui', 'tudo certo por aqui'],
        admin: ['os números!', 'hora da planilha', 'vamos ver as contas'],
      },
      searching: ['procurando...', 'deixa comigo...', 'vasculhando...'],
      found: [
        (count: number) => (count === 1 ? 'achei 1!' : `achei ${count}!`),
        (count: number) => (count === 1 ? 'tem 1 aqui!' : `tem ${count} aqui!`),
        (count: number) => (count === 1 ? 'olha, 1 vídeo!' : `olha, ${count} vídeos!`),
      ],
      searchFailed: ['ops, deu erro...', 'xi, falhou...', 'alguma coisa quebrou'],
      copied: ['copiado!', 'tá na mão!', 'link copiado!'],
      badLink: ['esse link não serve', 'isso não é um link', 'hm, link estranho'],
      analysed: ['pronto!', 'terminou!', 'a IA acabou!'],
      cancelled: ['ok, parei.', 'cancelado.', 'tudo bem, parou.'],
      duplicate: ['esse eu já tenho!', 'esse já está guardado', 'já vi, já guardei!'],
      draft: ['você deixou uma pela metade!', 'guardei a sua análise', 'essa ainda está esperando'],
      manual: ['eu confio em você!', 'capricha na descrição!', 'você escreve melhor mesmo'],
      saved: ['guardado!', 'no acervo!', 'salvo, pode buscar!'],
      saveFailed: ['não salvou...', 'xi, não gravou', 'tenta de novo?'],
      removed: ['foi embora', 'um a menos', 'tirei do acervo'],
      removeFailed: ['não consegui tirar...', 'xi, ele ficou', 'tenta de novo?'],
      hello: [
        (name: string | null) => (name ? `oi, ${name}!` : 'oi!'),
        (name: string | null) => (name ? `bem-vindo, ${name}!` : 'bem-vindo!'),
        (name: string | null) => (name ? `que bom te ver, ${name}!` : 'que bom te ver!'),
      ],
      bye: ['até mais!', 'tchau!', 'volta logo!'],
      language: ['agora em português!', 'português, então!', 'falando português!'],
      closing: ['ei!', 'não fecha!', 'sério?', 'tem um gato aí...'],
      reopened: ['ufa!', 'voltou!', 'que susto!'],
      serverAwake: ['o servidor acordou!', 'pronto, ele acordou!', 'agora vai rápido!'],
      iconDropped: ['ele sempre volta', 'ícone teimoso', 'ele gosta dali'],
      binThreat: ['NÃO!', 'aí não!!', 'nem pense nisso!'],
      appTrashed: ['O QUE VOCÊ FEZ?!', 'NÃÃÃO!', 'MINHA CASA!!'],
      bigger: ['uau, que grande!', 'tela cheia!', 'espaço de sobra!'],
      smaller: ['assim cabe melhor', 'tamanho normal', 'de volta ao cantinho'],
      echo: [
        (word: string) => `${word}?`,
        (word: string) => `hm, ${word}?`,
        (word: string) => `${word}, é?`,
      ],
      got: [
        (word: string) => `ah, ${word}!`,
        (word: string) => `${word}, entendi!`,
        (word: string) => `era ${word}!`,
      ],
      quirks: {
        cleared: ['ué, desistiu?', 'apagou tudo!', 'começar de novo, né?'],
        shouting: ['não precisa gritar!', 'ai, meus ouvidos!', 'CALMA!'],
        stuck: ['travou a tecla?', 'o teclado emperrou?', 'solta a tecla!'],
        long: ['que busca comprida!', 'isso é uma redação?', 'haja fôlego!'],
      },
      caught: ['ops, eu não li nada!', 'eu não tava olhando!', 'não vi nada, juro!'],
      hints: {
        lone: [
          (word: string) => `só "${word}"? tenta a Ampla!`,
          () => 'uma palavra só? a Ampla acha mais',
          (word: string) => `${word}... com a Ampla vem mais`,
        ],
        quoted: [
          () => 'entre aspas é a frase exata!',
          () => 'aspas? então é ao pé da letra',
          () => 'frase exata, anotado!',
        ],
        quotedIgnored: [
          () => 'no modo Semântica as aspas não valem',
          () => 'aqui as aspas são só enfeite',
          () => 'aspas não funcionam neste modo',
        ],
      },
      title: {
        good: ['gostei desse título!', 'a IA caprichou!', 'bom título, fácil de achar'],
        short: [
          'título curtinho: precisa de 5 palavras',
          'só isso? a busca quer mais',
          'hm, falta título aí',
        ],
        long: ['eita, que título comprido!', 'é título ou descrição?', 'título de respeito!'],
      },
      typed: {
        cat: ['miau?', 'gato?! cadê?', 'é o de trás da janela?'],
        robot: ['sou eu!!', 'me chamou?', 'robô? presente!'],
        dog: ['au au!', 'de cachorro eu gosto', 'cadê o doguinho?'],
        bin: ['não fala essa palavra!', 'lixo?! onde?!', 'credo...'],
        home: ['você já está nele!', 'o melhor programa que tem!', 'essa é a minha casa!'],
      },
      press: {
        next: ['boa, um link!', 'vamos ver esse vídeo', 'próximo passo!'],
        back: ['voltando...', 'sem pressa', 'de volta ao link'],
        manualOn: ['modo artesanal!', 'você escreve, eu assisto', 'sem IA desta vez'],
        manualOff: ['a IA voltou!', 'deixa com a IA', 'modo automático'],
        optionOn: ['mais detalhe!', 'boa, ela anota isso também', 'quanto mais, melhor'],
        optionOff: ['mais rapidinho assim', 'ok, sem isso', 'menos coisa para ela ler'],
        presetBroad: ['rede bem aberta!', 'vem tudo!', 'quanto mais, melhor'],
        presetBalanced: ['o meio-termo', 'equilíbrio!', 'nem muito, nem pouco'],
        presetPrecise: ['só os melhores', 'modo exigente', 'pente fino!'],
        advancedOpen: ['os ajustes finos!', 'hora de fuçar', 'o painel de controle'],
        advancedClose: ['tudo guardado', 'fechado!', 'ajustes no lugar'],
        modeHybrid: ['os dois jeitos!', 'o melhor dos dois', 'o modo de sempre'],
        modeSemantic: ['só pelo assunto', 'lendo nas entrelinhas', 'pelo sentido!'],
        modeText: ['ao pé da letra', 'palavra por palavra', 'modo literal'],
        limit: ['anotado!', 'trago essa quantidade', 'combinado'],
        stricter: ['mais exigente!', 'só os bem parecidos', 'subindo a régua'],
        looser: ['mais solto!', 'deixando entrar mais', 'baixando a régua'],
        reviewCancel: ['tudo bem, joguei fora', 'fica para a próxima', 'ok, descartado'],
        editVideo: ['vamos arrumar', 'hora do retoque', 'o que vai mudar?'],
        editCancel: ['ficou como estava', 'nada mudou', 'ok, deixei quieto'],
        removeAsk: ['tem certeza?', 'vai apagar mesmo?', 'esse não volta...'],
        removeCancel: ['ufa!', 'ele fica!', 'boa, continua guardado'],
        openVideo: ['boa escolha!', 'esse é bom', 'vai lá ver!'],
        authSwitch: ['conta nova ou antiga?', 'tanto faz, eu espero', 'escolha à vontade'],
        authSubmit: ['conferindo...', 'um instante...', 'batendo na porta...'],
        gateSignIn: ['vem, é rapidinho', 'a conta é de graça', 'por aqui!'],
        adminRange: ['outro período!', 'mudando a janela', 'recontando...'],
        why: ['deixa que eu explico!', 'raio-x!', 'os bastidores!'],
        computer: ['olha eu por dentro!', 'não repara a bagunça', 'meus bastidores!'],
        deviceRobot: ['esse sou eu!', 'sem driver, com orgulho', 'desconhecido, eu?'],
        removeDevice: ['isso fica!', 'nem pensar!', 'a gente precisa disso'],
        removeRobot: ['EU?!', 'ME remover?!', 'tenta, vai'],
      },
    },
    lines: {
      steps: {
        downloading: [
          'Vou buscar o vídeo lá no X. A análise toda normalmente leva um minuto.',
          'Primeiro eu baixo o vídeo do X. É rapidinho.',
          'Puxando o vídeo do X para cá. Fico de olho em tudo.',
        ],
        uploading: [
          'Vídeo comigo, agora mando para o outro robô.',
          'Baixei. Estou mandando o vídeo para a IA.',
          'Agora o vídeo está viajando até a IA.',
        ],
        watching: [
          'A IA tá assistindo. Ela vê o vídeo inteiro antes de escrever.',
          'Sessão de cinema: a IA está vendo o vídeo do começo ao fim.',
          'Agora é com ela. A IA assiste a tudo, cena por cena.',
        ],
        writing: [
          'Ela terminou de assistir e já está escrevendo.',
          'Falta pouco: a IA está escrevendo o título e a descrição.',
          'A IA pegou a caneta. Já, já sai a descrição.',
        ],
      },
      waiting: [
        'A IA assiste ao vídeo inteiro antes de escrever, por isso demora.',
        'Vídeo longo leva mais tempo. Ainda está andando.',
        'Quase lá, eu acho. Se cansar de esperar, dá para cancelar.',
      ],
      analysisFailed: {
        text: 'A IA não conseguiu desta vez, e o motivo está na caixa vermelha. Você pode tentar de novo, ou escrever o título e a descrição você mesmo.',
        action: 'Preencher eu mesmo',
      },
      emptyWiden: {
        text: 'Não achei nada com essa precisão. Quer que eu procure de novo, aceitando vídeos menos parecidos?',
        action: 'Tentar com Ampla',
      },
      emptyLoosen: {
        text: 'Nenhum vídeo tem exatamente essas palavras. Quer que eu procure pelo significado também?',
        action: 'Buscar por significado',
      },
      emptyStuck: {
        text: 'Nem assim eu achei. Tente outras palavras, ou descreva a cena de outro jeito.',
      },
      serverWaking: {
        text: 'O servidor ainda está acordando: ele dorme quando ninguém usa. A primeira busca pode demorar até um minuto.',
      },
      serverDown: {
        text: 'O servidor não respondeu. Buscar e guardar vídeos pode não funcionar por enquanto. Tente recarregar a página daqui a pouco.',
      },
    },
    drop: {
      computer: [
        'Meu Computador? Mas a gente já está dentro dele!',
        'Me guardar no computador? Eu já moro nele, olha.',
        'Abrir o Meu Computador de dentro do computador... deu um nó aqui.',
      ],
      app: [
        'Pop Search! Esse aqui já é meu: eu moro nele.',
        'Essa é a minha casa! Fui eu que arrumei tudo.',
        'Pop Search, o melhor programa deste computador. Sou suspeito, eu sei.',
      ],
      clock: [
        (time: string) => `São ${time}. O tempo voa quando a gente procura vídeo.`,
        (time: string) => `Deixa eu ver... ${time}. Pontual como sempre.`,
        (time: string) => `${time}! Já está na hora de guardar um vídeo novo.`,
      ],
      start: [
        'Abre! Abre! ... Nada. Esse Iniciar nunca abriu.',
        'Vou tentar de novo... não, continua sendo enfeite.',
        'Um dia esse botão ainda abre. Hoje não.',
      ],
      close: [
        'Cuidado com esse botão: dizem que tem um gato do outro lado.',
        'O X? Eu não apertaria. Tem um gato esperando ali atrás.',
        'Esse fecha a janela. E solta o gato.',
      ],
    },
    whatsThis: {
      button: 'O que é isso?',
      title: 'O que é isso? Clique aqui e depois em qualquer coisa da tela.',
      prompt: 'Clique em qualquer coisa da tela que eu explico o que é.',
      unknown: 'Hm, sobre isso eu não sei dizer nada. Clique em outra coisa.',
    },
    help: {
      'tab.ingest': {
        title: 'Add-Video.exe',
        text: 'É aqui que você guarda um vídeo: cola o link de um post do X, e a IA assiste e escreve o que acontece nele.',
      },
      'tab.search': {
        title: 'Search.exe',
        text: 'É aqui que você acha um vídeo guardado. Escreva o que lembra dele, do seu jeito, e eu procuro. Não precisa de conta.',
      },
      'tab.library': {
        title: 'My-Videos.exe',
        text: 'A lista dos vídeos que você mesmo guardou.',
      },
      'tab.account': {
        title: 'Sua conta',
        text: 'Aqui você entra ou cria a sua conta, vê quantas análises ainda tem no mês e troca o idioma.',
      },
      'tab.admin': {
        title: 'Stats.exe',
        text: 'Só administradores veem esta aba. Ela mostra quanto a IA foi usada, e por quem.',
      },
      status: {
        title: 'Barra de status',
        text: 'Conta o que o programa acabou de fazer: buscando, salvou, deu erro. Vale olhar aqui quando algo parecer parado.',
      },
      'window.buttons': {
        title: 'Botões da janela',
        text: 'Minimizar, maximizar e fechar. O de fechar é teimoso: precisa insistir. Dizem que tem um gato do outro lado.',
      },
      'taskbar.start': {
        title: 'Iniciar',
        text: 'Esse é só enfeite. Eu já pulei em cima dele várias vezes e nunca abriu nada.',
      },
      'taskbar.clock': {
        title: 'Relógio',
        text: 'A hora do seu computador. Eu passo aqui de vez em quando para conferir.',
      },
      'taskbar.task': {
        title: 'Pop Search System',
        text: 'O botão da janela. Clique para minimizar o programa, clique de novo para trazer de volta.',
      },
      'desktop.icon': {
        title: 'Área de trabalho',
        text: 'Dá para arrastar os ícones, mas eles sempre voltam para o lugar. O do Pop Search abre o programa de novo se você fechar a janela, e o Meu Computador mostra do que isto tudo é feito. Só não solte o Pop Search na Lixeira.',
      },
      system: {
        title: 'Propriedades do Sistema',
        text: 'Do que o Pop Search é feito, de verdade: cada peça, se ela está respondendo agora, quantos vídeos estão guardados e quanto tempo a sua última busca levou em cada etapa.',
      },
      robot: {
        title: 'BIP-98',
        text: 'Esse sou eu! Moro aqui no Pop Search e explico o que você quiser. Também dá para me pegar e me arrastar pela tela.',
      },
      'guide.invite': {
        title: 'O guia',
        text: 'Um passeio de dois minutos em que eu te mostro o app inteiro numa tela de treino. Nada do que você fizer lá vale de verdade.',
      },
      'ingest.url': {
        title: 'Link do vídeo',
        text: 'Cole aqui o link de um post do X que tenha vídeo. Depois clique em Avançar para escolher o que a IA vai olhar.',
      },
      'ingest.manual': {
        title: 'Entrada manual',
        text: 'Com esta caixinha marcada a IA não é usada: você mesmo escreve o título e a descrição. Não gasta nenhuma das suas análises.',
      },
      'ingest.options': {
        title: 'Opções de análise',
        text: 'A IA sempre escreve um título e uma descrição. Aqui você escolhe se ela também anota o cenário e transcreve o áudio. Quanto mais ela anotar, mais fácil achar o vídeo depois.',
      },
      'ingest.progress': {
        title: 'Análise em andamento',
        text: 'A lista mostra em que passo a análise está: baixar o vídeo, mandar para a IA, ela assistir e depois escrever. Costuma levar por volta de um minuto, mais para vídeos longos. Dá para cancelar, e dá para sair e voltar depois.',
      },
      'ingest.duplicate': {
        title: 'Vídeo repetido',
        text: 'Alguém já guardou este vídeo, então ele não é analisado de novo e nada sai da sua cota. Ele já aparece na busca.',
      },
      'ingest.draft': {
        title: 'Análise sem salvar',
        text: 'Uma análise que terminou e não foi salva fica guardada aqui. Continue a revisão para salvar, ou descarte para analisar outro vídeo.',
      },
      'ingest.error': {
        title: 'A análise falhou',
        text: 'A mensagem diz o que deu errado. Você pode tentar de novo, ou marcar Entrada manual e escrever você mesmo.',
      },
      'ingest.quota': {
        title: 'Análises do mês',
        text: 'Cada vídeo que a IA analisa gasta uma análise, e toda conta tem um limite por mês. Quando acaba, a Entrada manual continua funcionando.',
      },
      'ingest.gate': {
        title: 'Precisa de conta',
        text: 'Guardar vídeos usa a IA, que tem custo, por isso pede uma conta. Buscar continua aberto para todo mundo.',
      },
      'review.general': {
        title: 'Título e descrição',
        text: 'É este texto que a busca lê para achar o vídeo. A IA erra de vez em quando, então confira e corrija o que precisar antes de salvar.',
      },
      'review.post': {
        title: 'Texto do post',
        text: 'O que estava escrito no post lá no X. Se ficar aqui, a busca também procura neste texto. Pode corrigir ou apagar: ele não aparece nos resultados.',
      },
      'review.scenes': {
        title: 'Elementos de cenário',
        text: 'Coisas que aparecem no vídeo, separadas por vírgula. Ajudam a achar o vídeo por um detalhe, como "tigela azul".',
      },
      'review.audio': {
        title: 'Áudio',
        text: 'O que é falado ou cantado no vídeo, e a música quando a IA reconhece. Serve para achar o vídeo por uma frase dita nele.',
      },
      'review.save': {
        title: 'Salvar ou cancelar',
        text: 'Salvar guarda o vídeo no acervo com o texto acima. Cancelar joga tudo fora e volta para o começo.',
      },
      'search.query': {
        title: 'Sua busca',
        text: 'Escreva o que lembra do vídeo, do seu jeito: uma cena, uma frase, um assunto. Depois clique em Buscar.',
      },
      'search.presets': {
        title: 'Precisão',
        text: 'O quanto um vídeo precisa se parecer com o que você escreveu. Ampla traz mais vídeos, Precisa só os mais parecidos. Se não vier nada, tente Ampla.',
      },
      'search.advanced': {
        title: 'Avançado',
        text: 'Abre os ajustes finos da busca: o modo, a precisão exata, os atalhos de escrita e quantos resultados vêm.',
      },
      'search.advancedOpen': {
        title: 'Ocultar avançado',
        text: 'Guarda os ajustes finos de volta. O que você escolheu neles continua valendo.',
      },
      'search.mode': {
        title: 'Modo de busca',
        text: (
          <>
            É o jeito que eu procuro. <strong>Híbrida</strong> usa os dois jeitos ao mesmo tempo e
            é o padrão. <strong>Semântica</strong> procura pelo assunto, mesmo que as palavras do
            vídeo sejam outras. <strong>Exata</strong> só traz vídeos com as palavras que você
            digitou.
          </>
        ),
      },
      'search.threshold': {
        title: 'Ajuste fino da precisão',
        text: 'É o quanto um vídeo precisa se parecer com o que você escreveu para entrar na lista. Mais para a direita eu fico exigente e trago menos vídeos. Mais para a esquerda trago mais, alguns nem tão parecidos. Só vale para a busca por significado.',
      },
      'search.syntax': {
        title: 'Atalhos de escrita',
        text: 'Atalhos para a busca por palavras: aspas procuram a frase exata, um sinal de menos tira uma palavra, e "or" aceita qualquer uma das duas.',
      },
      'search.limit': {
        title: 'Máximo de resultados',
        text: 'Quantos vídeos eu trago de cada vez. Com menos, a lista fica curta e só com os melhores.',
      },
      'search.empty': {
        title: 'Nada encontrado',
        text: 'Nenhum vídeo passou no filtro. Tente a precisão Ampla, menos palavras, ou descreva de outro jeito.',
      },
      card: {
        title: 'Um resultado',
        text: 'Um vídeo do acervo: o título leva ao post original e o texto é o resumo guardado junto com ele.',
      },
      'card.origin': {
        title: 'Por que apareceu',
        text: 'A etiqueta conta o motivo: "palavras" quer dizer que o texto do vídeo tem o que você digitou, "significado" quer dizer que ele fala de algo parecido.',
      },
      'card.why': {
        title: 'Por quê?',
        text: 'Abre uma janela que conta, em palavras simples, por que este vídeo apareceu e nesta posição: o quanto ele se parece, onde as suas palavras foram achadas nele, e a conta por trás para quem quiser ver.',
      },
      'card.match': {
        title: 'Match',
        text: 'O quanto o assunto do vídeo se parece com a sua busca. Quanto mais perto de 100%, mais parecido.',
      },
      'card.copy': {
        title: 'Link do post',
        text: 'O endereço do post original no X. O botão Copiar deixa ele pronto para colar onde você quiser.',
      },
      library: {
        title: 'Meus vídeos',
        text: 'Tudo que você guardou com a sua conta. Clique no título de um vídeo para abrir o post original.',
      },
      'library.actions': {
        title: 'Editar ou excluir',
        text: 'Editar abre o que está guardado sobre o vídeo para você corrigir. Excluir tira o vídeo do acervo de vez, depois de você confirmar.',
      },
      'library.save': {
        title: 'Salvar ou cancelar',
        text: 'Salvar grava as mudanças, e a busca passa a achar o vídeo pelo texto novo. Cancelar deixa o vídeo como estava.',
      },
      'account.form': {
        title: 'Entrar ou criar conta',
        text: 'A conta é o que deixa você guardar vídeos. Buscar não precisa dela.',
      },
      'account.session': {
        title: 'Sua conta',
        text: 'Você está conectado. O botão Sair encerra a sessão neste navegador.',
      },
      'account.guide': {
        title: 'Demonstração guiada',
        text: 'Refaz o passeio comigo numa tela de treino. Não gasta análise e nada é salvo.',
      },
      language: {
        title: 'Idioma',
        text: 'Troca o idioma do programa inteiro, e o meu também.',
      },
      admin: {
        title: 'Estatísticas',
        text: 'O painel de quem administra o projeto: quanto a IA foi usada, quanto custou e por que as análises falharam.',
      },
    },
  },
};
