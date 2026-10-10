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
    openGuide: '▶ Me mostre como funciona',
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
        say: 'O Pop Search guarda vídeos do X para você achar depois, só descrevendo o que acontece neles. Eu te mostro como em dois minutos. Isto é só um treino: nada do que a gente fizer aqui vai para o app de verdade.',
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
            sem a palavra. Foi assim que uma girafa veio parar aqui.
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
};
