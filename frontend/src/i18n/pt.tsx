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
    thresholdLegend: 'Limiar de correspondência',
    thresholdLabel: 'Limiar de correspondência',
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

  robot: {
    dismiss: 'Fechar',
    ask: (what: string) => `O que é ${what}?`,
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
        text: 'Os ícones são decoração. O do Pop Search abre o programa de novo se você fechar a janela.',
      },
      robot: {
        title: 'BIP-98',
        text: 'Esse sou eu! Moro aqui no Pop Search e explico o que você quiser.',
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
        text: 'A IA está assistindo ao vídeo inteiro. Costuma levar por volta de um minuto, mais para vídeos longos. Dá para cancelar.',
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
        text: 'Abre os ajustes finos da busca: o modo, o limiar, os atalhos de escrita e quantos resultados vêm.',
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
        title: 'Limiar de correspondência',
        text: 'É o quanto um vídeo precisa se parecer com o que você escreveu para entrar na lista. Mais para a direita eu fico exigente e trago menos vídeos. Mais para a esquerda trago mais, alguns nem tão parecidos. Só vale para a busca por significado.',
      },
      'search.syntax': {
        title: 'Sintaxe de busca',
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
