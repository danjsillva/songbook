-- 1. Create workspace
INSERT INTO workspaces (id, name, slug, created_at) VALUES ('fCwhrdVRex', 'Daniels Workspace', 'daniels-workspace', 1768680000000);

-- 2. Update user to belong to workspace as admin
UPDATE users SET workspace_id = 'fCwhrdVRex', role = 'admin' WHERE id = 'rnDkww3eQYe4VeFlfrpyQ5EfJkU2';

-- 3. Insert songs
INSERT INTO songs (id, title, artist, original_key, content, plain_text, created_at, last_viewed_at, youtube_url, bpm, created_by, workspace_id) VALUES
('NkJfkcc9hm', 'Tudo é Perda + O Que Seria de Mim (Medley)', 'Brasa Church', 'E', '[{"lyrics":"","chords":[{"chord":"E","position":0},{"chord":"A","position":3},{"chord":"B","position":6},{"chord":"A","position":9}],"section":"Intro"},{"lyrics":"  Tudo é perda se não tenho a ti","chords":[{"chord":"E","position":0},{"chord":"A/C#","position":21}]},{"lyrics":"  A tua graça é o que me basta","chords":[{"chord":"B","position":0},{"chord":"A","position":25}]},{"lyrics":"  Sem você não sei pra onde ir","chords":[{"chord":"E","position":0},{"chord":"A/C#","position":23}]},{"lyrics":"  Sem tua presença nada importa","chords":[{"chord":"B","position":0},{"chord":"A","position":26}]},{"lyrics":"Do que adianta eu juntar os meus tesouros","chords":[{"chord":"A","position":7},{"chord":"B","position":29}],"section":"Pré-refrão"},{"lyrics":"E me esquecer daquele que me amou?","chords":[{"chord":"E/G#","position":0},{"chord":"A","position":24}]},{"lyrics":"Se eu não tenho a ti, não tenho nada","chords":[{"chord":"F#m","position":17},{"chord":"E","position":26},{"chord":"B","position":32}],"section":"Refrão"},{"lyrics":"Nada eu serei sem ti, Senhor","chords":[{"chord":"G#m","position":11},{"chord":"E","position":18},{"chord":"A","position":26}]},{"lyrics":"Só tua presença é o que me basta","chords":[{"chord":"F#m","position":10},{"chord":"E","position":21},{"chord":"B","position":27}]},{"lyrics":"Eu te levarei por onde eu for","chords":[{"chord":"G#m","position":10},{"chord":"E","position":18},{"chord":"A","position":27}]},{"lyrics":"Do que adianta eu juntar os meus tesouros","chords":[{"chord":"A","position":7},{"chord":"B","position":29}],"section":"Pré-refrão"},{"lyrics":"E me esquecer daquele que me amou?","chords":[{"chord":"E","position":0},{"chord":"A","position":23}]},{"lyrics":"Se eu não tenho a ti, não tenho nada","chords":[{"chord":"F#m","position":18},{"chord":"E","position":26},{"chord":"B","position":32}],"section":"Refrão"},{"lyrics":"Nada eu serei sem ti, Senhor","chords":[{"chord":"G#m","position":10},{"chord":"E","position":18},{"chord":"A","position":26}]},{"lyrics":"Só tua presença é o que me basta","chords":[{"chord":"F#m","position":10},{"chord":"E","position":21},{"chord":"B","position":27}]},{"lyrics":"Eu te levarei por onde eu for","chords":[{"chord":"G#m","position":10},{"chord":"E","position":18},{"chord":"A","position":27}]},{"lyrics":"","chords":[{"chord":"F#m","position":0},{"chord":"B","position":5},{"chord":"E","position":8},{"chord":"A","position":11}],"section":"Ponte"},{"lyrics":"","chords":[{"chord":"F#m","position":8},{"chord":"B","position":13},{"chord":"E","position":16},{"chord":"A","position":19}]},{"lyrics":"Tua presença é o que me basta","chords":[{"chord":"F#m","position":7},{"chord":"B","position":24}]},{"lyrics":"Quem sou eu sem teu amor, Senhor","chords":[{"chord":"E/G#","position":0},{"chord":"A","position":27}]},{"lyrics":"Tua presença é o que me basta","chords":[{"chord":"F#m","position":6},{"chord":"B","position":24}]},{"lyrics":"Quem sou eu sem teu amor, Senhor","chords":[{"chord":"E/G#","position":0},{"chord":"A","position":27}]},{"lyrics":"Se eu não tenho a ti, não tenho nada","chords":[{"chord":"F#m","position":18},{"chord":"E","position":26},{"chord":"B","position":32}],"section":"Refrão"},{"lyrics":"Nada eu serei sem ti, Senhor","chords":[{"chord":"G#m","position":10},{"chord":"E","position":18},{"chord":"A","position":26}]},{"lyrics":"Só tua presença é o que me basta","chords":[{"chord":"F#m","position":10},{"chord":"E","position":21},{"chord":"B","position":27}]},{"lyrics":"Eu te levarei por onde eu for","chords":[{"chord":"G#m","position":10},{"chord":"E","position":18},{"chord":"A","position":27}]},{"lyrics":"","chords":[{"chord":"F#m","position":0},{"chord":"E/G#","position":5},{"chord":"A","position":11},{"chord":"E","position":14},{"chord":"B","position":17}],"section":"Ponte"},{"lyrics":"","chords":[{"chord":"F#m","position":8},{"chord":"E/G#","position":13},{"chord":"A","position":19},{"chord":"E","position":22},{"chord":"B","position":25}]},{"lyrics":"O que seria de mim sem Ti","chords":[{"chord":"F#m","position":15},{"chord":"E","position":20},{"chord":"A","position":24}]},{"lyrics":"Sem Ti, sem ti?","chords":[{"chord":"E","position":5},{"chord":"B","position":13}]},{"lyrics":"O que seria de mim sem Ti","chords":[{"chord":"F#m","position":15},{"chord":"E","position":20},{"chord":"A","position":24}]},{"lyrics":"Sem Ti, sem ti?","chords":[{"chord":"E","position":5},{"chord":"B","position":13}]},{"lyrics":"O que seria de mim sem Ti","chords":[{"chord":"F#m","position":15},{"chord":"E","position":20},{"chord":"A","position":24}]},{"lyrics":"Sem Ti, sem ti?","chords":[{"chord":"E","position":5},{"chord":"B","position":13}]},{"lyrics":"O que seria de mim sem Ti","chords":[{"chord":"F#m","position":15},{"chord":"E","position":20},{"chord":"A","position":24}]},{"lyrics":"Sem Ti, sem ti?","chords":[{"chord":"C#m","position":5},{"chord":"B","position":15}]},{"lyrics":"O que seria de mim sem Ti","chords":[{"chord":"F#m","position":15},{"chord":"E","position":20},{"chord":"A","position":24}]},{"lyrics":"Sem Ti, sem ti?","chords":[{"chord":"E","position":5},{"chord":"B","position":13}]},{"lyrics":"Se eu não tenho a ti, não tenho nada","chords":[{"chord":"F#m","position":18},{"chord":"E","position":26},{"chord":"B","position":32}],"section":"Refrão"},{"lyrics":"Nada eu serei sem ti, Senhor","chords":[{"chord":"G#m","position":10},{"chord":"E","position":18},{"chord":"A","position":26}]},{"lyrics":"Só tua presença é o que me basta","chords":[{"chord":"F#m","position":10},{"chord":"E","position":21},{"chord":"B","position":27}]},{"lyrics":"Eu te levarei por onde eu for","chords":[{"chord":"G#m","position":10},{"chord":"E","position":18},{"chord":"A","position":27}]},{"lyrics":"Tua presença é o que me basta","chords":[{"chord":"F#m","position":7},{"chord":"B","position":24}],"section":"Ponte"},{"lyrics":"Quem sou eu sem teu amor, Senhor","chords":[{"chord":"E/G#","position":0},{"chord":"A","position":27}]},{"lyrics":"Tua presença é o que me basta","chords":[{"chord":"F#m","position":7},{"chord":"B","position":25}]},{"lyrics":"Quem sou eu sem teu amor, Senhor","chords":[{"chord":"E/G#","position":0},{"chord":"A","position":27}]}]', '  Tudo é perda se não tenho a ti
  A tua graça é o que me basta
  Sem você não sei pra onde ir
  Sem tua presença nada importa
Do que adianta eu juntar os meus tesouros
E me esquecer daquele que me amou?
Se eu não tenho a ti, não tenho nada
Nada eu serei sem ti, Senhor
Só tua presença é o que me basta
Eu te levarei por onde eu for
Do que adianta eu juntar os meus tesouros
E me esquecer daquele que me amou?
Se eu não tenho a ti, não tenho nada
Nada eu serei sem ti, Senhor
Só tua presença é o que me basta
Eu te levarei por onde eu for
Tua presença é o que me basta
Quem sou eu sem teu amor, Senhor
Tua presença é o que me basta
Quem sou eu sem teu amor, Senhor
Se eu não tenho a ti, não tenho nada
Nada eu serei sem ti, Senhor
Só tua presença é o que me basta
Eu te levarei por onde eu for
O que seria de mim sem Ti
Sem Ti, sem ti?
O que seria de mim sem Ti
Sem Ti, sem ti?
O que seria de mim sem Ti
Sem Ti, sem ti?
O que seria de mim sem Ti
Sem Ti, sem ti?
O que seria de mim sem Ti
Sem Ti, sem ti?
Se eu não tenho a ti, não tenho nada
Nada eu serei sem ti, Senhor
Só tua presença é o que me basta
Eu te levarei por onde eu for
Tua presença é o que me basta
Quem sou eu sem teu amor, Senhor
Tua presença é o que me basta
Quem sou eu sem teu amor, Senhor', 1768680374516, 1768680374548, NULL, NULL, 'rnDkww3eQYe4VeFlfrpyQ5EfJkU2', 'fCwhrdVRex');

INSERT INTO songs (id, title, artist, original_key, content, plain_text, created_at, last_viewed_at, youtube_url, bpm, created_by, workspace_id) VALUES
('svHHxKXDLa', 'Ousado Amor', 'Isaías Saad', 'E', '[{"lyrics":"","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":5},{"chord":"A9","position":9},{"chord":"E","position":13}],"section":"Intro"},{"lyrics":"","chords":[{"chord":"C#m","position":8},{"chord":"B4","position":13},{"chord":"A9","position":17},{"chord":"E","position":21}]},{"lyrics":"    Antes de eu falar","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":19}],"section":"Primeira Parte"},{"lyrics":"Tu cantavas sobre mim","chords":[{"chord":"A9","position":13}]},{"lyrics":"    Tu tens sido tão","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":18}]},{"lyrics":"Tão bom     pra mim","chords":[{"chord":"A9","position":9}]},{"lyrics":"    Antes de eu respirar","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":22}]},{"lyrics":"Sopraste Tua vida em mim","chords":[{"chord":"A9","position":14}]},{"lyrics":"    Tu tens sido tão","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":18}]},{"lyrics":"Tão bom    pra mim","chords":[{"chord":"A9","position":8}]},{"lyrics":"Oh, impressionante, infinito","chords":[{"chord":"C#m","position":8},{"chord":"B4","position":20}],"section":"Refrão"},{"lyrics":"E ousado amor de Deus","chords":[{"chord":"A9","position":5},{"chord":"E","position":18}]},{"lyrics":"Oh, que deixa as noventa e nove","chords":[{"chord":"C#m","position":9},{"chord":"B4","position":20}]},{"lyrics":"Só pra me encontrar","chords":[{"chord":"A9","position":1},{"chord":"E","position":17}]},{"lyrics":"Não posso comprá-lo,  nem merecê-lo","chords":[{"chord":"C#m","position":15},{"chord":"B4","position":31}]},{"lyrics":"Mesmo assim se entregou","chords":[{"chord":"A9","position":9},{"chord":"E","position":21}]},{"lyrics":"Oh, impressionante, infinito","chords":[{"chord":"C#m","position":8},{"chord":"B4","position":20}]},{"lyrics":"E ousado amor de Deus","chords":[{"chord":"A9","position":5},{"chord":"E","position":18}]},{"lyrics":"    Inimigo eu fui","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":16}],"section":"Segunda Parte"},{"lyrics":"Mas Teu amor lutou por mim","chords":[{"chord":"A9","position":14}]},{"lyrics":"    Tu tens sido tão","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":18}]},{"lyrics":"Tão bom    pra mim","chords":[{"chord":"A9","position":8}]},{"lyrics":"    Não tinha valor","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":17}]},{"lyrics":"Mas tudo pagou por mim","chords":[{"chord":"A9","position":10}]},{"lyrics":"    Tu tens sido tão","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":18}]},{"lyrics":"Tão bom    pra mim","chords":[{"chord":"A9","position":8}]},{"lyrics":"Oh, impressionante, infinito","chords":[{"chord":"C#m","position":8},{"chord":"B4","position":20}],"section":"Refrão"},{"lyrics":"E ousado amor de Deus","chords":[{"chord":"A9","position":5},{"chord":"E","position":18}]},{"lyrics":"Oh, que deixa as noventa e nove","chords":[{"chord":"C#m","position":9},{"chord":"B4","position":20}]},{"lyrics":"Só pra me encontrar","chords":[{"chord":"A9","position":1},{"chord":"E","position":17}]},{"lyrics":"Não posso comprá-lo,  nem merecê-lo","chords":[{"chord":"C#m","position":15},{"chord":"B4","position":31}]},{"lyrics":"Mesmo assim se entregou","chords":[{"chord":"A9","position":9},{"chord":"E","position":21}]},{"lyrics":"Oh, impressionante, infinito","chords":[{"chord":"C#m","position":8},{"chord":"B4","position":20}]},{"lyrics":"E ousado amor de Deus","chords":[{"chord":"A9","position":5},{"chord":"E","position":18}]},{"lyrics":"    Traz luz para as sombras","chords":[{"chord":"C#m","position":0}],"section":"Terceira Parte"},{"lyrics":"Escala montanhas, pra me encontrar","chords":[]},{"lyrics":"Derruba muralhas","chords":[]},{"lyrics":"Destrói as mentiras, pra me encontrar","chords":[]},{"lyrics":"Traz luz para as sombras","chords":[{"chord":"B4","position":18}]},{"lyrics":"Escala montanhas  pra me encontrar","chords":[{"chord":"A9","position":11},{"chord":"E","position":32}]},{"lyrics":"    Derruba muralhas","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":15}]},{"lyrics":"Destrói as mentiras, pra me encontrar","chords":[{"chord":"A9","position":15},{"chord":"E","position":35}]},{"lyrics":"    Traz luz para as sombras","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":22}]},{"lyrics":"Escala montanhas, pra me encontrar","chords":[{"chord":"A9","position":11},{"chord":"E","position":32}]},{"lyrics":"    Derruba muralhas","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":15}]},{"lyrics":"Destrói as mentiras, pra me encontrar","chords":[{"chord":"A9","position":15},{"chord":"E","position":35}]},{"lyrics":"    Traz luz para as sombras","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":22}]},{"lyrics":"Escala montanhas, pra me encontrar","chords":[{"chord":"A9","position":11},{"chord":"E","position":32}]},{"lyrics":"    Derruba muralhas","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":15}]},{"lyrics":"Destrói as mentiras, pra me encontrar","chords":[{"chord":"A9","position":15},{"chord":"E","position":35}]},{"lyrics":"    Traz luz para as sombras","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":22}]},{"lyrics":"Escala montanhas, pra me encontrar","chords":[{"chord":"A9","position":11},{"chord":"E","position":32}]},{"lyrics":"    Derruba muralhas","chords":[{"chord":"C#m","position":0},{"chord":"B4","position":15}]},{"lyrics":"Destrói as mentiras, pra me encontrar","chords":[{"chord":"A9","position":15},{"chord":"E","position":35}]},{"lyrics":"Oh, impressionante, infinito","chords":[{"chord":"C#m","position":8},{"chord":"B4","position":20}],"section":"Refrão"},{"lyrics":"E ousado amor de Deus","chords":[{"chord":"A9","position":5},{"chord":"E","position":18}]},{"lyrics":"Oh, que deixa as noventa e nove","chords":[{"chord":"C#m","position":9},{"chord":"B4","position":20}]},{"lyrics":"Só pra me encontrar","chords":[{"chord":"A9","position":1},{"chord":"E","position":17}]},{"lyrics":"Não posso comprá-lo,  nem merecê-lo","chords":[{"chord":"C#m","position":15},{"chord":"B4","position":31}]},{"lyrics":"Mesmo assim se entregou","chords":[{"chord":"A9","position":9},{"chord":"E","position":21}]},{"lyrics":"Oh, impressionante, infinito","chords":[{"chord":"C#m","position":8},{"chord":"B4","position":20}]},{"lyrics":"E ousado amor de Deus","chords":[{"chord":"A9","position":5},{"chord":"E","position":18}]}]', '    Antes de eu falar
Tu cantavas sobre mim
    Tu tens sido tão
Tão bom     pra mim
    Antes de eu respirar
Sopraste Tua vida em mim
    Tu tens sido tão
Tão bom    pra mim
Oh, impressionante, infinito
E ousado amor de Deus
Oh, que deixa as noventa e nove
Só pra me encontrar
Não posso comprá-lo,  nem merecê-lo
Mesmo assim se entregou
Oh, impressionante, infinito
E ousado amor de Deus
    Inimigo eu fui
Mas Teu amor lutou por mim
    Tu tens sido tão
Tão bom    pra mim
    Não tinha valor
Mas tudo pagou por mim
    Tu tens sido tão
Tão bom    pra mim
Oh, impressionante, infinito
E ousado amor de Deus
Oh, que deixa as noventa e nove
Só pra me encontrar
Não posso comprá-lo,  nem merecê-lo
Mesmo assim se entregou
Oh, impressionante, infinito
E ousado amor de Deus
    Traz luz para as sombras
Escala montanhas, pra me encontrar
Derruba muralhas
Destrói as mentiras, pra me encontrar
Traz luz para as sombras
Escala montanhas  pra me encontrar
    Derruba muralhas
Destrói as mentiras, pra me encontrar
    Traz luz para as sombras
Escala montanhas, pra me encontrar
    Derruba muralhas
Destrói as mentiras, pra me encontrar
    Traz luz para as sombras
Escala montanhas, pra me encontrar
    Derruba muralhas
Destrói as mentiras, pra me encontrar
    Traz luz para as sombras
Escala montanhas, pra me encontrar
    Derruba muralhas
Destrói as mentiras, pra me encontrar
Oh, impressionante, infinito
E ousado amor de Deus
Oh, que deixa as noventa e nove
Só pra me encontrar
Não posso comprá-lo,  nem merecê-lo
Mesmo assim se entregou
Oh, impressionante, infinito
E ousado amor de Deus', 1768680497730, 1768681535799, NULL, NULL, 'rnDkww3eQYe4VeFlfrpyQ5EfJkU2', 'fCwhrdVRex');

INSERT INTO songs (id, title, artist, original_key, content, plain_text, created_at, last_viewed_at, youtube_url, bpm, created_by, workspace_id) VALUES
('zA4xKeJfTF', 'Me Ama', 'Diante do Trono', 'A', '[{"lyrics":"","chords":[{"chord":"A","position":0},{"chord":"D/F#","position":3},{"chord":"E","position":9},{"chord":"D2","position":12}],"section":"Intro"},{"lyrics":"Tem ciúmes de mim","chords":[{"chord":"A","position":3}],"section":"Primeira Parte"},{"lyrics":"O Seu amor é como um furacão","chords":[{"chord":"D/F#","position":0}]},{"lyrics":"E eu me rendo ","chords":[{"chord":"E","position":2}]},{"lyrics":"Ao vento de Sua misericórdia","chords":[{"chord":"D2","position":23}]},{"lyrics":"Então, de repente ","chords":[{"chord":"A","position":3}]},{"lyrics":"Não vejo mais minhas aflições","chords":[{"chord":"D/F#","position":26}]},{"lyrics":"Eu só vejo á glória","chords":[]},{"lyrics":"E percebo quão maravilhoso Ele é","chords":[{"chord":"E","position":6}]},{"lyrics":"E o tanto que Ele me quer","chords":[{"chord":"D2","position":5}]},{"lyrics":"Ô, Ele me amou","chords":[{"chord":"A","position":0},{"chord":"D/F#","position":12}],"section":"Pré-refrão"},{"lyrics":"Ô, Ele me ama","chords":[{"chord":"E","position":10}]},{"lyrics":"Ele me amou","chords":[{"chord":"D2","position":9}]},{"lyrics":"Tem ciúmes de mim","chords":[{"chord":"A","position":1}],"section":"Primeira Parte"},{"lyrics":"O Seu amor é como um furacão","chords":[{"chord":"D/F#","position":0}]},{"lyrics":"E eu me rendo ","chords":[{"chord":"E","position":2}]},{"lyrics":"Ao vento de Sua misericórdia","chords":[{"chord":"D2","position":23}]},{"lyrics":"Então, de repente ","chords":[{"chord":"A","position":3}]},{"lyrics":"Não vejo mais minhas aflições","chords":[{"chord":"D/F#","position":26}]},{"lyrics":"Eu só vejo a glória","chords":[]},{"lyrics":"E percebo quão maravilhoso Ele é","chords":[{"chord":"E","position":6}]},{"lyrics":"E o tanto que Ele me quer","chords":[{"chord":"D2","position":5}]},{"lyrics":"Ô, Ele me amou","chords":[{"chord":"A","position":0},{"chord":"D/F#","position":12}],"section":"Pré-refrão"},{"lyrics":"Ô, Ele me ama","chords":[{"chord":"E","position":10}]},{"lyrics":"Ele me amou","chords":[{"chord":"D2","position":9}]},{"lyrics":"Me ama, Ele me ama","chords":[{"chord":"A","position":3},{"chord":"D/F#","position":15}],"section":"Refrão"},{"lyrics":"Ele me ama, Ele me ama","chords":[{"chord":"E","position":7},{"chord":"D2","position":19}]},{"lyrics":"Me ama, Ele me ama","chords":[{"chord":"A","position":3},{"chord":"D/F#","position":15}]},{"lyrics":"Ele me ama, Ele me ama","chords":[{"chord":"E","position":7},{"chord":"D2","position":19}]},{"lyrics":"Somos sua herança ","chords":[{"chord":"A","position":1}],"section":"Segunda Parte"},{"lyrics":"E Ele é o nosso galardão","chords":[]},{"lyrics":"Seu olhar de graça ","chords":[{"chord":"D/F#","position":1}]},{"lyrics":"Nos atrai à redenção","chords":[]},{"lyrics":"Se a graça é um oceano ","chords":[{"chord":"E","position":7}]},{"lyrics":"Estamos afogando","chords":[{"chord":"D2","position":12}]},{"lyrics":"O céu se une à terra ","chords":[{"chord":"A","position":3}]},{"lyrics":"Como um beijo apaixonado","chords":[]},{"lyrics":"Meu coração dispara ","chords":[{"chord":"D/F#","position":5}]},{"lyrics":"Em meu peito, acelerado","chords":[]},{"lyrics":"Não tenho tempo pra perder ","chords":[{"chord":"E","position":5}]},{"lyrics":"","chords":[{"chord":"Com","position":0}]},{"lyrics":"Quando penso que Ele","chords":[{"chord":"D2","position":8}]},{"lyrics":"Me ama, Ele me ama","chords":[{"chord":"A","position":3},{"chord":"D/F#","position":15}],"section":"Refrão Final"},{"lyrics":"Ele me ama, Ele me ama","chords":[{"chord":"E","position":7},{"chord":"D2","position":19}]},{"lyrics":"Me ama, Ele me ama","chords":[{"chord":"A","position":3},{"chord":"D/F#","position":15}]},{"lyrics":"Ele me ama, Ele me ama","chords":[{"chord":"E","position":7},{"chord":"D2","position":19}]},{"lyrics":"Oh, Ele me amou","chords":[{"chord":"A","position":0},{"chord":"D/F#","position":13}],"section":"Pré-refrão"},{"lyrics":"Oh, Ele me ama, Ele me amou","chords":[{"chord":"E","position":11},{"chord":"D2","position":25}]},{"lyrics":"Oh, Ele me amou","chords":[{"chord":"A","position":0},{"chord":"D/F#","position":13}]},{"lyrics":"Oh, Ele me ama","chords":[{"chord":"E","position":11}]},{"lyrics":"Ele me amou","chords":[{"chord":"D2","position":9}]}]', 'Tem ciúmes de mim
O Seu amor é como um furacão
E eu me rendo
Ao vento de Sua misericórdia
Então, de repente
Não vejo mais minhas aflições
Eu só vejo á glória
E percebo quão maravilhoso Ele é
E o tanto que Ele me quer
Ô, Ele me amou
Ô, Ele me ama
Ele me amou
Tem ciúmes de mim
O Seu amor é como um furacão
E eu me rendo
Ao vento de Sua misericórdia
Então, de repente
Não vejo mais minhas aflições
Eu só vejo a glória
E percebo quão maravilhoso Ele é
E o tanto que Ele me quer
Ô, Ele me amou
Ô, Ele me ama
Ele me amou
Me ama, Ele me ama
Ele me ama, Ele me ama
Me ama, Ele me ama
Ele me ama, Ele me ama
Somos sua herança
E Ele é o nosso galardão
Seu olhar de graça
Nos atrai à redenção
Se a graça é um oceano
Estamos afogando
O céu se une à terra
Como um beijo apaixonado
Meu coração dispara
Em meu peito, acelerado
Não tenho tempo pra perder
Quando penso que Ele
Me ama, Ele me ama
Ele me ama, Ele me ama
Me ama, Ele me ama
Ele me ama, Ele me ama
Oh, Ele me amou
Oh, Ele me ama, Ele me amou
Oh, Ele me amou
Oh, Ele me ama
Ele me amou', 1768680658302, 1768681651106, NULL, NULL, 'rnDkww3eQYe4VeFlfrpyQ5EfJkU2', 'fCwhrdVRex');

INSERT INTO songs (id, title, artist, original_key, content, plain_text, created_at, last_viewed_at, youtube_url, bpm, created_by, workspace_id) VALUES
('Fp0bqGoaA4', 'O Nosso General É Cristo / Vem Com Josué Lutar Em Jericó (Pot-Pourri)', 'Ministério Reviver', 'C', '[{"lyrics":"","chords":[{"chord":"C","position":0},{"chord":"Am","position":5},{"chord":"F","position":10},{"chord":"G","position":14}],"section":"Intro"},{"lyrics":"Pelo Senhor, marchamos sim","chords":[{"chord":"C","position":1}],"section":"Primeira Parte"},{"lyrics":"O Seu exército, poderoso é","chords":[{"chord":"Am","position":5}]},{"lyrics":"E Sua glória será vista em toda terra","chords":[{"chord":"F","position":20},{\"chord\":\"G\",\"position\":29}]},{"lyrics":"Vamos cantar o canto da vitória","chords":[{"chord":"C","position":6},{\"chord\":\"Am\",\"position\":26}],"section":"Pré-refrão"},{"lyrics":"Glória Deus, vencemos a batalha","chords":[{"chord":"F","position":10},{\"chord\":\"G\",\"position\":28}]},{"lyrics":"Toda arma contra nós perecerá","chords":[{"chord":"C","position":8},{\"chord\":\"Am\",\"position\":27}]},{"lyrics":"O nosso general é Cristo","chords":[{"chord":"F","position":3}],"section":"Refrão"},{"lyrics":"Seguimos os Seus passos","chords":[{"chord":"C","position":2}]},{"lyrics":"Nenhum inimigo nos resistirá","chords":[{"chord":"G","position":21}]},{"lyrics":"Pelo Messias, marchamos sim","chords":[{"chord":"C","position":1}],"section":"Segunda Parte"},{"lyrics":"Em Suas mãos, a chave da vitória","chords":[{"chord":"Am","position":20}]},{"lyrics":"Que nos leva a possuir a terra prometida","chords":[{"chord":"F","position":9},{\"chord\":\"G\",\"position\":34}]},{"lyrics":"Pelo Messias, marchamos sim","chords":[{"chord":"C","position":1}]},{"lyrics":"Em Suas mãos, a chave da vitória","chords":[{"chord":"Am","position":20}]},{"lyrics":"Que nos leva a possuir a terra prometida","chords":[{"chord":"F","position":9},{\"chord\":\"G\",\"position\":34}]},{"lyrics":"O nosso general é Cristo","chords":[{"chord":"F","position":3}],"section":"Refrão"},{"lyrics":"Seguimos os seus passos","chords":[{"chord":"C","position":2}]},{"lyrics":"Nenhum inimigo nos resistirá","chords":[{"chord":"G","position":21}]},{"lyrics":"O nosso general é Cristo","chords":[{"chord":"F","position":3}]},{"lyrics":"Seguimos os seus passos","chords":[{"chord":"C","position":2}]},{"lyrics":"Nenhum inimigo nos resistirá","chords":[{"chord":"G","position":21}]},{"lyrics":"Nenhum inimigo nos resistirá","chords":[{"chord":"C","position":4}]},{"lyrics":"Vem com Josué lutar em Jericó, Jericó, Jericó","chords":[{"chord":"C","position":0},{\"chord\":\"Am\",\"position\":38}],"section":"Ponte"},{"lyrics":"Vem com Josué lutar em Jericó","chords":[{"chord":"F","position":0}]},{"lyrics":"E as muralhas ruirão","chords":[{"chord":"G","position":15}]},{"lyrics":"Vem com Josué lutar em Jericó, Jericó, Jericó","chords":[{"chord":"C","position":0},{\"chord\":\"Am\",\"position\":38}]},{"lyrics":"Vem com Josué lutar em Jericó","chords":[{"chord":"F","position":0}]},{"lyrics":"E as muralhas ruirão","chords":[{"chord":"G","position":15}]},{"lyrics":"Subam os montes devagar","chords":[{"chord":"C","position":5}],"section":"Terceira Parte"},{"lyrics":"Que o Senhor vai guerrear","chords":[{"chord":"Am","position":3}]},{"lyrics":"Cerquem os muros para mim","chords":[{"chord":"F","position":6}]},{"lyrics":"Pois Jericó chegou ao fim","chords":[{"chord":"G","position":10}]},{"lyrics":"Vem com Josué lutar em Jericó, Jericó, Jericó","chords":[{"chord":"C","position":0},{\"chord\":\"Am\",\"position\":38}],"section":"Ponte"},{"lyrics":"Vem com Josué lutar em Jericó","chords":[{"chord":"F","position":0}]},{"lyrics":"E as muralhas ruirão","chords":[{"chord":"G","position":15}]},{"lyrics":"As trombetas soarão","chords":[{"chord":"C","position":5}],"section":"Final"},{"lyrics":"Abalando o céu e o chão","chords":[{"chord":"Am","position":3}]},{"lyrics":"Cerquem os muros para mim","chords":[{"chord":"F","position":6}]},{"lyrics":"Pois Jericó chegou ao fim","chords":[{"chord":"G","position":10}]}]', 'Pelo Senhor, marchamos sim
O Seu exército, poderoso é
E Sua glória será vista em toda terra
Vamos cantar o canto da vitória
Glória Deus, vencemos a batalha
Toda arma contra nós perecerá
O nosso general é Cristo
Seguimos os Seus passos
Nenhum inimigo nos resistirá
Pelo Messias, marchamos sim
Em Suas mãos, a chave da vitória
Que nos leva a possuir a terra prometida
Pelo Messias, marchamos sim
Em Suas mãos, a chave da vitória
Que nos leva a possuir a terra prometida
O nosso general é Cristo
Seguimos os seus passos
Nenhum inimigo nos resistirá
O nosso general é Cristo
Seguimos os seus passos
Nenhum inimigo nos resistirá
Nenhum inimigo nos resistirá
Vem com Josué lutar em Jericó, Jericó, Jericó
Vem com Josué lutar em Jericó
E as muralhas ruirão
Vem com Josué lutar em Jericó, Jericó, Jericó
Vem com Josué lutar em Jericó
E as muralhas ruirão
Subam os montes devagar
Que o Senhor vai guerrear
Cerquem os muros para mim
Pois Jericó chegou ao fim
Vem com Josué lutar em Jericó, Jericó, Jericó
Vem com Josué lutar em Jericó
E as muralhas ruirão
As trombetas soarão
Abalando o céu e o chão
Cerquem os muros para mim
Pois Jericó chegou ao fim', 1768681354556, 1768681354660, NULL, NULL, 'rnDkww3eQYe4VeFlfrpyQ5EfJkU2', 'fCwhrdVRex');

-- 4. Insert setlist
INSERT INTO setlists (id, name, date, created_at, last_viewed_at, created_by, workspace_id) VALUES
('iCGTPATDId', 'Vilma Lacerda', '2026-01-18', 1768681000000, 1768681000000, 'rnDkww3eQYe4VeFlfrpyQ5EfJkU2', 'fCwhrdVRex');

-- 5. Insert setlist_songs
INSERT INTO setlist_songs (id, setlist_id, song_id, position, key, bpm, notes) VALUES
('1NcrTkuUcG', 'iCGTPATDId', 'NkJfkcc9hm', 0, 'E', NULL, NULL),
('iUnMhpW73a', 'iCGTPATDId', 'svHHxKXDLa', 1, 'G', NULL, NULL),
('3n_-V97H3F', 'iCGTPATDId', 'zA4xKeJfTF', 2, 'G', NULL, NULL),
('m23VWMpPyq', 'iCGTPATDId', 'Fp0bqGoaA4', 3, 'C', NULL, NULL);
