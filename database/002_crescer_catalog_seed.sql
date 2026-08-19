BEGIN;

-- Categorias
INSERT INTO public.categories (id, slug, nome, cor, icone) 
VALUES ('cat_sensorial', 'sensorial', 'Sensorial', '#F2CC8F', 'Sparkles') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  nome = EXCLUDED.nome, 
  cor = EXCLUDED.cor, 
  icone = EXCLUDED.icone;

INSERT INTO public.categories (id, slug, nome, cor, icone) 
VALUES ('cat_motor', 'motor', 'Motor', '#E87A5D', 'Activity') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  nome = EXCLUDED.nome, 
  cor = EXCLUDED.cor, 
  icone = EXCLUDED.icone;

INSERT INTO public.categories (id, slug, nome, cor, icone) 
VALUES ('cat_cognitivo', 'cognitivo', 'Cognitivo', '#84A59D', 'Brain') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  nome = EXCLUDED.nome, 
  cor = EXCLUDED.cor, 
  icone = EXCLUDED.icone;

INSERT INTO public.categories (id, slug, nome, cor, icone) 
VALUES ('cat_linguagem', 'linguagem', 'Linguagem', '#A89BCC', 'MessageCircle') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  nome = EXCLUDED.nome, 
  cor = EXCLUDED.cor, 
  icone = EXCLUDED.icone;

INSERT INTO public.categories (id, slug, nome, cor, icone) 
VALUES ('cat_social', 'social', 'Social', '#F2949C', 'Heart') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  nome = EXCLUDED.nome, 
  cor = EXCLUDED.cor, 
  icone = EXCLUDED.icone;

-- Faixas etárias (Age Stages)
INSERT INTO public.age_stages (id, slug, titulo, descricao, min_days, max_days, dados_gerais, desenvolvimento, dicas, cuidados) 
VALUES ('stage_semana', 'primeira_semana', 'Primeira Semana', 'Recém-chegado ao mundo — o foco é acolher e observar.', 0, 14, 'Nos primeiros dias, o bebê passa a maior parte do tempo dormindo (16–20h) e mama a cada 2–3h. Está se adaptando ao mundo fora do útero.', 'Enxerga a 20–30 cm, reconhece a voz da mãe, tem reflexos primitivos (sucção, preensão, Moro). Começa a diferenciar dia e noite.', 'Priorize o contato pele a pele, converse baixinho e mantenha rotinas de sono tranquilas. Aceite ajuda e descanse quando o bebê dormir.', 'Sono seguro: sempre de barriga para cima, no berço, sem travesseiros ou cobertores soltos. Higienize o umbigo conforme orientação do pediatra.') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  titulo = EXCLUDED.titulo, 
  descricao = EXCLUDED.descricao, 
  min_days = EXCLUDED.min_days, 
  max_days = EXCLUDED.max_days, 
  dados_gerais = EXCLUDED.dados_gerais, 
  desenvolvimento = EXCLUDED.desenvolvimento, 
  dicas = EXCLUDED.dicas, 
  cuidados = EXCLUDED.cuidados;

INSERT INTO public.age_stages (id, slug, titulo, descricao, min_days, max_days, dados_gerais, desenvolvimento, dicas, cuidados) 
VALUES ('stage_mes', 'um_mes', '1 Mês', 'Começam os primeiros sorrisos e reações ao som.', 15, 90, 'Fica mais desperto (períodos de 1–2h acordado), começa a criar rotina alimentar e de sono, e emite sons vocais além do choro.', 'Sustenta brevemente a cabeça de bruço, segue objetos com o olhar, responde a sons e reage ao rosto humano com sorriso social.', 'Faça tempo de bruço supervisionado várias vezes ao dia, converse muito e cante para o bebê. Ofereça estímulos visuais de alto contraste.', 'Nunca deixe o bebê sozinho em superfície alta. Evite ambientes muito barulhentos. Vacinas do 2º mês se aproximam — verifique o cartão.') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  titulo = EXCLUDED.titulo, 
  descricao = EXCLUDED.descricao, 
  min_days = EXCLUDED.min_days, 
  max_days = EXCLUDED.max_days, 
  dados_gerais = EXCLUDED.dados_gerais, 
  desenvolvimento = EXCLUDED.desenvolvimento, 
  dicas = EXCLUDED.dicas, 
  cuidados = EXCLUDED.cuidados;

INSERT INTO public.age_stages (id, slug, titulo, descricao, min_days, max_days, dados_gerais, desenvolvimento, dicas, cuidados) 
VALUES ('stage_seis', 'seis_meses', '6 Meses', 'Descobrindo o mundo pelas mãos, sons e movimentos.', 91, 365, 'Início da introdução alimentar (por volta de 6 meses). Sono noturno se organiza, e o bebê senta com apoio, rola e leva tudo à boca.', 'Balbucia ("babá", "dadá"), reconhece nome, sorri em interação, transfere objetos de uma mão à outra e brinca de esconde-esconde.', 'Ofereça brinquedos seguros para exploração oral, leia livros com figuras grandes, nomeie objetos e responda ao balbucio como conversa.', 'Introdução alimentar orientada por pediatra/nutricionista. Cuidado com peças pequenas e superfícies quentes. Prote gavetas e tomadas.') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  titulo = EXCLUDED.titulo, 
  descricao = EXCLUDED.descricao, 
  min_days = EXCLUDED.min_days, 
  max_days = EXCLUDED.max_days, 
  dados_gerais = EXCLUDED.dados_gerais, 
  desenvolvimento = EXCLUDED.desenvolvimento, 
  dicas = EXCLUDED.dicas, 
  cuidados = EXCLUDED.cuidados;

INSERT INTO public.age_stages (id, slug, titulo, descricao, min_days, max_days, dados_gerais, desenvolvimento, dicas, cuidados) 
VALUES ('stage_tres', 'tres_anos', '3 Anos', 'Curiosidade sem fim, faz-de-conta e muita linguagem.', 366, 1825, 'Corre, sobe escadas, come sozinha e desenvolve o faz-de-conta. Frases de 3–5 palavras, milhares de perguntas por dia.', 'Vocabulário de 200+ palavras, empilha 6+ blocos, começa a compartilhar, imita adultos, reconhece cores e formas básicas.', 'Estabeleça rotinas previsíveis, ofereça escolhas simples (''camisa azul ou vermelha?''), leia histórias e brinque de faz-de-conta. Ensine limites com afeto.', 'Supervisione perto de água, escadas e cozinha. Consulta odontológica a partir de 1 ano. Sono de 10–13h/dia incluindo cochilo.') 
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug, 
  titulo = EXCLUDED.titulo, 
  descricao = EXCLUDED.descricao, 
  min_days = EXCLUDED.min_days, 
  max_days = EXCLUDED.max_days, 
  dados_gerais = EXCLUDED.dados_gerais, 
  desenvolvimento = EXCLUDED.desenvolvimento, 
  dicas = EXCLUDED.dicas, 
  cuidados = EXCLUDED.cuidados;

-- Atividades
INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_ps_1', 'stage_semana', 'cat_sensorial', 'Contato pele com pele', 'Fortalecer o vínculo e regular temperatura, batimento e respiração do bebê.', '["Ambiente aquecido", "Cobertor leve"]'::jsonb, '["Deite-se em posição confortável, semi-reclinada.", "Coloque o bebê de fralda sobre o seu peito, barriga com barriga.", "Cubra as costas do bebê com um cobertor leve.", "Fique nesta posição por 20–60 minutos, respirando calmamente."]'::jsonb, 30, 'Sempre supervisione. Se sentir sono, peça para alguém acompanhar.', 'https://images.unsplash.com/photo-1620415064072-914373a92515?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxwYXJlbnQlMjBwbGF5aW5nJTIwd2l0aCUyMHRvZGRsZXIlMjB3YXJtJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_ps_2', 'stage_semana', 'cat_social', 'Olhar nos olhos durante a mamada', 'Estabelecer vínculo afetivo e estimular reconhecimento do rosto do cuidador.', '["Ambiente tranquilo"]'::jsonb, '["Sente-se confortavelmente para amamentar ou dar mamadeira.", "Aproxime o bebê a cerca de 20–30 cm do seu rosto.", "Olhe nos olhos dele com calma e sorria suavemente.", "Fale baixinho o nome dele."]'::jsonb, 15, 'Nunca deixe o bebê sozinho durante a mamada.', 'https://images.unsplash.com/photo-1620415064072-914373a92515?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxwYXJlbnQlMjBwbGF5aW5nJTIwd2l0aCUyMHRvZGRsZXIlMjB3YXJtJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_ps_3', 'stage_semana', 'cat_linguagem', 'Conversar com o bebê', 'Expor o bebê aos sons da voz humana desde cedo.', '[]'::jsonb, '["Aproxime-se do bebê acordado e calmo.", "Fale com voz suave sobre o que está fazendo.", "Use frases curtas: ''Agora vamos trocar a fralda…''.", "Pause e observe as reações dele."]'::jsonb, 10, 'Fale sempre com tom acolhedor, sem gritos ou sons bruscos.', NULL, 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_ps_4', 'stage_semana', 'cat_motor', 'Tempo de bruço supervisionado', 'Fortalecer músculos do pescoço nos primeiros dias, por curtos períodos.', '["Superfície firme (tapete no chão)"]'::jsonb, '["Deite-se de costas e coloque o bebê de bruços sobre o seu peito.", "Comece com 1–2 minutos, várias vezes ao dia.", "Chame o bebê com a voz para ele tentar levantar a cabeça."]'::jsonb, 3, 'Só faça com o bebê acordado. Nunca deixe sozinho de bruços.', 'https://images.unsplash.com/photo-1709380824789-233745078904?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwzfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_ps_5', 'stage_semana', 'cat_cognitivo', 'Observar contrastes preto e branco', 'Estimular a visão em desenvolvimento com imagens de alto contraste.', '["Cartão preto e branco ou livro de contrastes"]'::jsonb, '["Segure o cartão a cerca de 25 cm dos olhos do bebê.", "Mova lentamente para os lados.", "Observe se ele acompanha com o olhar por alguns segundos."]'::jsonb, 5, 'Não exponha à luz forte diretamente nos olhos.', NULL, 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_1m_1', 'stage_mes', 'cat_sensorial', 'Massagem shantala suave', 'Relaxar o bebê e estimular a percepção corporal.', '["Óleo vegetal (amêndoas ou coco)", "Toalha"]'::jsonb, '["Aqueça o ambiente e deite o bebê de costas.", "Aqueça o óleo nas mãos.", "Faça movimentos lentos das pernas, braços, barriga e costas.", "Converse com o bebê durante toda a massagem."]'::jsonb, 15, 'Evite pressionar a barriga logo após mamar.', 'https://images.unsplash.com/photo-1589827711524-0fb39b96e630?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_1m_2', 'stage_mes', 'cat_motor', 'Bicicletinha nas perninhas', 'Ajudar na digestão e estimular consciência corporal.', '[]'::jsonb, '["Deite o bebê de costas em superfície macia.", "Segure gentilmente os tornozelos.", "Faça movimentos como pedalar uma bicicleta, alternando as pernas.", "Faça por 1–2 minutos, com pausas."]'::jsonb, 5, 'Movimentos sempre suaves, sem forçar articulações.', 'https://images.unsplash.com/photo-1709380824789-233745078904?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwzfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_1m_3', 'stage_mes', 'cat_linguagem', 'Cantar canção de ninar', 'Estimular percepção sonora e criar rotina afetiva.', '[]'::jsonb, '["Escolha uma música calma que você goste.", "Segure o bebê no colo, próximo do seu rosto.", "Cante sempre a mesma canção antes de dormir por vários dias."]'::jsonb, 5, 'Evite volumes altos. Prefira a sua voz a gravações.', NULL, 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_1m_4', 'stage_mes', 'cat_cognitivo', 'Móbile de contrastes', 'Estimular foco visual e acompanhamento com os olhos.', '["Móbile ou objeto com padrões"]'::jsonb, '["Posicione o móbile a 30 cm acima do bebê deitado.", "Mova-o levemente para chamar atenção.", "Observe o tempo que ele consegue focar."]'::jsonb, 10, 'Não deixe o móbile ao alcance das mãos do bebê.', NULL, 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_1m_5', 'stage_mes', 'cat_social', 'Sorriso e imitação', 'Estimular o sorriso social e a troca de expressões.', '[]'::jsonb, '["Aproxime seu rosto do bebê quando ele estiver calmo.", "Sorria de forma marcada e fale com voz doce.", "Espere alguns segundos pela reação dele.", "Imite as expressões que ele fizer."]'::jsonb, 10, 'Se o bebê desviar o olhar, respeite e volte depois.', 'https://images.unsplash.com/photo-1620415064072-914373a92515?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxwYXJlbnQlMjBwbGF5aW5nJTIwd2l0aCUyMHRvZGRsZXIlMjB3YXJtJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_6m_1', 'stage_seis', 'cat_sensorial', 'Caixa de tecidos', 'Explorar diferentes texturas e desenvolver percepção tátil.', '["Caixa", "Retalhos de tecidos variados (algodão, veludo, seda)"]'::jsonb, '["Coloque tecidos diferentes dentro de uma caixa.", "Sente o bebê no colo ou apoiado.", "Deixe ele pegar e explorar cada tecido.", "Descreva a textura: ''Este é macio, este é áspero.''"]'::jsonb, 15, 'Escolha tecidos grandes que não possam ser engolidos.', 'https://images.unsplash.com/photo-1589827711524-0fb39b96e630?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_6m_2', 'stage_seis', 'cat_motor', 'Alcançar brinquedos', 'Estimular a coordenação e o movimento voluntário das mãos.', '["Brinquedos coloridos"]'::jsonb, '["Sente o bebê apoiado ou deite-o de costas.", "Coloque um brinquedo pouco além do alcance dele.", "Encoraje com a voz: ''Vem, pega!''.", "Aproxime aos poucos se ele se frustrar."]'::jsonb, 10, 'Ofereça brinquedos sem peças pequenas.', 'https://images.unsplash.com/photo-1709380824789-233745078904?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwzfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_6m_3', 'stage_seis', 'cat_cognitivo', 'Cadê? Achou!', 'Iniciar a noção de permanência do objeto.', '["Pano leve"]'::jsonb, '["Cubra seu rosto com um pano fino.", "Diga ''Cadê a mamãe/o papai?''.", "Tire o pano rapidamente e diga ''Achou!''.", "Repita algumas vezes observando a reação."]'::jsonb, 5, 'Nunca cubra o rosto do bebê sem supervisão direta.', NULL, 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_6m_4', 'stage_seis', 'cat_linguagem', 'Nomear objetos do dia a dia', 'Ampliar vocabulário passivo e associação de palavras.', '["Objetos comuns da casa"]'::jsonb, '["Durante a rotina, mostre objetos e nomeie: ''colher'', ''copo''.", "Espere alguns segundos após cada palavra.", "Repita ao longo do dia sempre que possível."]'::jsonb, 10, 'Fale devagar e com clareza, sem usar ''linguagem de bebê'' distorcida.', NULL, 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_6m_5', 'stage_seis', 'cat_social', 'Brincadeira de espelho', 'Reconhecer expressões faciais e reforçar interação.', '["Espelho grande e seguro"]'::jsonb, '["Sente com o bebê em frente ao espelho.", "Aponte e diga: ''Olha, é o bebê!''.", "Faça caretas engraçadas e observe as reações.", "Sorria bastante durante a brincadeira."]'::jsonb, 10, 'Use espelho fixo ou seguro contra quedas.', 'https://images.unsplash.com/photo-1620415064072-914373a92515?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxwYXJlbnQlMjBwbGF5aW5nJTIwd2l0aCUyMHRvZGRsZXIlMjB3YXJtJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_3a_1', 'stage_tres', 'cat_cognitivo', 'Classificar por cores', 'Trabalhar categorização e reconhecimento de cores.', '["Blocos ou objetos de cores variadas", "Recipientes"]'::jsonb, '["Espalhe os objetos no chão.", "Combine com a criança: ''Vamos colocar todos os vermelhos aqui''.", "Ajude nas primeiras cores e depois deixe ela guiar.", "Elogie o esforço, não só o acerto."]'::jsonb, 20, 'Verifique se não há peças pequenas que possam ser engolidas.', 'https://images.unsplash.com/photo-1589827711524-0fb39b96e630?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_3a_2', 'stage_tres', 'cat_motor', 'Pular como coelhinho', 'Fortalecer pernas e desenvolver equilíbrio.', '["Espaço livre"]'::jsonb, '["Mostre à criança como agachar e pular como coelhinho.", "Faça alguns pulos junto com ela.", "Crie um caminho para pular por 3–5 metros.", "Comemore junto no final."]'::jsonb, 10, 'Faça em piso não escorregadio, com espaço livre de móveis.', 'https://images.unsplash.com/photo-1709380824789-233745078904?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwzfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_3a_3', 'stage_tres', 'cat_linguagem', 'Contar história com figuras', 'Ampliar vocabulário e estimular a narrativa.', '["Livro ilustrado infantil"]'::jsonb, '["Sente-se ao lado da criança em local confortável.", "Leia com entonação, fazendo pausas.", "Pergunte: ''O que você acha que vai acontecer?''.", "Deixe a criança ''ler'' as figuras a seu modo."]'::jsonb, 15, 'Escolha histórias curtas adequadas à idade.', NULL, 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_3a_4', 'stage_tres', 'cat_social', 'Faz de conta com bonecos', 'Desenvolver empatia, linguagem e resolução de conflitos.', '["Bonecos ou bichinhos de pelúcia"]'::jsonb, '["Convide a criança para uma ''festa'' com os bonecos.", "Sirva comida imaginária e converse pelos personagens.", "Introduza pequenos problemas: ''O ursinho está triste, o que fazemos?''.", "Deixe ela criar soluções."]'::jsonb, 20, 'Respeite as pausas e mudanças de brincadeira.', 'https://images.unsplash.com/photo-1620415064072-914373a92515?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxwYXJlbnQlMjBwbGF5aW5nJTIwd2l0aCUyMHRvZGRsZXIlMjB3YXJtJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;

INSERT INTO public.activities (id, age_stage_id, category_id, titulo, objetivo, materiais, passos, duracao_min, cuidados, imagem_url, disclaimer) 
VALUES ('act_3a_5', 'stage_tres', 'cat_sensorial', 'Massinha caseira', 'Trabalhar coordenação fina e exploração sensorial.', '["Farinha de trigo", "Água", "Óleo", "Corante alimentício"]'::jsonb, '["Misture 2 xícaras de farinha, 1 de água, 1 colher de óleo e corante.", "Amasse até dar ponto de massinha.", "Faça bolinhas, cobrinhas e formas junto com a criança.", "Guarde em pote fechado após brincar."]'::jsonb, 30, 'Supervisione para que a criança não leve à boca em excesso.', 'https://images.unsplash.com/photo-1589827711524-0fb39b96e630?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwc2Vuc29yeSUyMHBsYXl8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85', 'Conteúdo educativo, não substitui avaliação profissional.') 
ON CONFLICT (id) DO UPDATE SET 
  age_stage_id = EXCLUDED.age_stage_id, 
  category_id = EXCLUDED.category_id, 
  titulo = EXCLUDED.titulo, 
  objetivo = EXCLUDED.objetivo, 
  materiais = EXCLUDED.materiais, 
  passos = EXCLUDED.passos, 
  duracao_min = EXCLUDED.duracao_min, 
  cuidados = EXCLUDED.cuidados, 
  imagem_url = EXCLUDED.imagem_url, 
  disclaimer = EXCLUDED.disclaimer;


COMMIT;
