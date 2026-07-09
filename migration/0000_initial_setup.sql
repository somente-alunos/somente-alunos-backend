
CREATE TABLE student
(
    student_id												integer primary key autoincrement,
    student_uuid											text not null unique,
    student_created											timestamp default current_timestamp not null,
    student_update											timestamp default current_timestamp not null,

	ra_student												text, -- (Não obrigatorio) - Registro Acadêmico do aluno
	cpf_student												text, -- (Não obrigatorio) - CPF do aluno

	invitation_code_student									text not null unique, -- (Obrigatorio) - Código de convite do aluno para acessar

	college_uuid_student									text, -- (Não obrigatorio) - Faculdade do aluno
	course_uuid_student										text, -- (Não obrigatorio) - Curso do aluno
	class_student											text, -- (Não obrigatorio) - Turma do aluno

	cart_student											text default '[]', -- Array de object (object de conteúdo) do carrinho do aluno

	is_suggested_information_student						boolean default true -- Vira false após o aluno realmente selecionar a faculdade e curso dele
);

CREATE TRIGGER trigger_update_student AFTER UPDATE ON student
BEGIN
    UPDATE student SET student_update = CURRENT_TIMESTAMP WHERE student_id = NEW.student_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise:
A busca principal é por student_uuid ou por uma combinação de ra_student/cpf_student com invitation_code_student.
Atenção: Como você definiu student_uuid e invitation_code_student como UNIQUE, o SQLite já criou índices únicos automaticamente para essas colunas. Quando você faz WHERE ra_student = ? AND invitation_code_student = ?, o banco vai usar o índice do invitation_code para achar a única linha possível e depois só conferir se o RA bate.
 */


CREATE TABLE college
(
	college_id												integer primary key autoincrement,
	college_uuid											text not null unique,
	college_created											timestamp default current_timestamp not null,
	college_update											timestamp default current_timestamp not null,

	name_college											text not null, -- Nome da faculdade
	svg_college												text -- SVG da faculdade
);

CREATE TRIGGER trigger_update_college AFTER UPDATE ON college
BEGIN
    UPDATE college SET college_update = CURRENT_TIMESTAMP WHERE college_id = NEW.college_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise: Você disse que pega todos (SELECT *).
Veredito: Operações que buscam a tabela inteira (Full Table Scan) não utilizam índices. O índice UNIQUE do UUID já é suficiente para buscas unitárias. Nenhuma ação necessária. */


CREATE TABLE course
(
	course_id												integer primary key autoincrement,
	course_uuid												text not null unique,
	course_created											timestamp default current_timestamp not null,
	course_update											timestamp default current_timestamp not null,

	name_course												text not null, -- Nome do curso
	svg_course												text, -- SVG do curso
	college_uuid_course										text not null -- UUID da faculdade que o curso pertence
);

CREATE TRIGGER trigger_update_course AFTER UPDATE ON course
BEGIN
	UPDATE course SET course_update = CURRENT_TIMESTAMP WHERE course_id = NEW.course_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise: Você busca course_uuid, name_course, svg_course, college_uuid_course baseando-se em college_uuid_course.
Veredito: Este é o cenário perfeito para um Covering Index (Índice de Cobertura). Se colocarmos todas as colunas que o SELECT pede dentro do próprio índice, o banco de dados não precisará ler a tabela original, ele retornará os dados lendo apenas o índice. Isso deixa a query absurdamente rápida. */
CREATE INDEX idx_course_college_search ON course (
    college_uuid_course,
    course_uuid,
    name_course,
    svg_course
);


CREATE TABLE content
(
	content_id												integer primary key autoincrement,
	content_uuid											text not null unique,
	content_created											timestamp default current_timestamp not null,
	content_update											timestamp default current_timestamp not null,

	name_content											text not null, -- Nome do conteúdo
	student_uuid_content									text not null, -- Autor do conteúdo

	old_price_content										real, -- Preço antigo do conteúdo
	current_price_content									real not null, -- Preço atual do conteúdo

	preview_file_uuid_content								text, -- UUID do arquivo de preview armazenado no R2
	full_file_uuid_content									text, -- UUID do arquivo completo armazenado no R2

	college_uuid_content									text not null, -- UUID da faculdade que o conteúdo pertence, ou "all" para todas
	course_uuid_content										text not null, -- UUID do curso que o conteúdo pertence, ou "all" para todos os cursos da faculdade
	class_content											text, -- Turma do conteúdo

	prevision_content										timestamp, -- Previsão de quando será postado o conteúdo caso ainda não tenha postado

	verified_content										boolean default false -- Se o conteúdo já foi verificado por um admin
);

-- DROP TRIGGER IF EXISTS trigger_update_content;
CREATE TRIGGER trigger_update_content AFTER UPDATE ON content
WHEN NEW.content_update = OLD.content_update
	AND NEW.college_uuid_content != 'all' AND NEW.course_uuid_content != 'all'
BEGIN
    UPDATE content SET content_update = CURRENT_TIMESTAMP WHERE content_id = NEW.content_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise: Essa é a query mais complexa e pesada que você tem. Você filtra por faculdade, curso, status de verificação, turma (podendo ser NULL) e no final ordena por data de atualização (content_update DESC).
Veredito: Precisamos de um índice composto que siga a exata ordem do seu WHERE e termine com a coluna do seu ORDER BY. Isso evita que o banco faça o sort em tempo de execução (o que consome muita CPU). */
CREATE INDEX idx_content_feed_search ON content (
    college_uuid_content,
    course_uuid_content,
    verified_content,
    class_content,
    content_update DESC
);


CREATE TABLE sale_history
(
	sale_history_id											integer primary key autoincrement,
	sale_history_uuid										text not null unique,
	sale_history_created									timestamp default current_timestamp not null,
	sale_history_update										timestamp default current_timestamp not null,

	student_uuid_seller_sale_history						text, -- UUID do aluno que vendeu o conteúdo
	student_uuid_buyer_sale_history							text not null, -- UUID do aluno que comprou o conteúdo
	content_uuid_sale_history								text not null, -- UUID do conteúdo comercializado

	information_content_sale_history						text, -- JSON string com informações do conteúdo no momento da compra (ex: name_content, current_price_content, etc)

	status_sale_history										text not null, -- Por enquanto apenas 'completed'

	paid_to_seller_sale_history								timestamp -- Data que o valor da venda foi repassado para o vendedor, null caso ainda não tenha sido repassado
);

CREATE TRIGGER trigger_update_sale_history AFTER UPDATE ON sale_history
BEGIN
	UPDATE sale_history SET sale_history_update = CURRENT_TIMESTAMP WHERE sale_history_id = NEW.sale_history_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise: Você busca apenas a coluna content_uuid_sale_history filtrando por student_uuid_buyer_sale_history e status_sale_history.
Veredito: Outro caso maravilhoso para um Covering Index. Buscamos as chaves do WHERE e incluímos a resposta do SELECT. */
CREATE INDEX idx_sale_history_buyer_status ON sale_history (
    student_uuid_buyer_sale_history,
    status_sale_history,
    content_uuid_sale_history
);


CREATE TABLE ordered
(
	ordered_id											integer primary key autoincrement,
	ordered_uuid											text not null unique,
	ordered_created										timestamp default current_timestamp not null,
	ordered_update										timestamp default current_timestamp not null,

	student_uuid_buyer_ordered							text not null, -- UUID do aluno comprador
	content_uuid_array_ordered							text not null, -- JSON string com array de content_uuid com intenção de compra

	total_amount_ordered									real not null, -- valor total da cobranca
	method_ordered										text not null, -- pix | card_credit

	status_ordered										text, -- waiting | completed

	webhook_payload_ordered								text -- JSON bruto recebido no webhook
);

CREATE TRIGGER trigger_update_ordered AFTER UPDATE ON ordered
BEGIN
	UPDATE ordered SET ordered_update = CURRENT_TIMESTAMP WHERE ordered_id = NEW.ordered_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÃO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise: Você valida a existência de um pedido filtrando por comprador, array de itens, valor, método e status waiting.
Veredito: Não precisamos indexar todos esses campos (como o array de itens ou valor). O que filtra a tabela mais rápido aqui é o Comprador + o Status de estar "aguardando". O banco acha essas poucas linhas instantaneamente pelo índice e valida o resto na memória.*/
CREATE INDEX idx_ordered_buyer_waiting ON "ordered" (
    student_uuid_buyer_ordered,
    status_ordered
);


CREATE TABLE denuncia
(
	denuncia_id												integer primary key autoincrement,
	denuncia_uuid											text not null unique,
	denuncia_created										timestamp default current_timestamp not null,
	denuncia_update											timestamp default current_timestamp not null,

	student_uuid_denuncia									text not null, -- UUID do aluno que denunciou
	content_uuid_denuncia									text not null, -- UUID do conteudo denunciado

	reason_array_denuncia									text not null, -- JSON string com array de motivos selecionados
	extra_information_denuncia								text, -- Informações adicionais opcionais

	status_denuncia											text not null default 'pending', -- pending | reviewed | accepted | rejected
	admin_uuid_review_denuncia								text, -- UUID do admin que revisou a denuncia
	review_note_denuncia									text, -- Observacao interna da revisao
	reviewed_at_denuncia									timestamp -- Data da revisao da denuncia
);

CREATE TRIGGER trigger_update_denuncia AFTER UPDATE ON denuncia
BEGIN
	UPDATE denuncia SET denuncia_update = CURRENT_TIMESTAMP WHERE denuncia_id = NEW.denuncia_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÃO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise: Nenhuma query relevante citada.
Veredito: O denuncia_uuid já possui índice por ser único. Para o futuro, pensando no painel do administrador, você inevitavelmente vai buscar por denúncias pendentes. Sugiro um índice parcial. */


CREATE TABLE admin
(
	admin_id												integer primary key autoincrement,
	admin_uuid												text not null unique,
	admin_created											timestamp default current_timestamp not null,
	admin_update											timestamp default current_timestamp not null,

	name_admin												text not null, -- Nome do admin
	email_admin												text not null unique, -- Email do admin
	password_admin											text not null -- Hash da senha do admin
);

CREATE TRIGGER trigger_update_admin AFTER UPDATE ON admin
BEGIN
	UPDATE admin SET admin_update = CURRENT_TIMESTAMP WHERE admin_id = NEW.admin_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
/* Análise: A busca é feita por admin_uuid.
Veredito: Como está marcado como UNIQUE, o banco já possui o índice. O mesmo vale para o email_admin. Não crie nada aqui para não gerar redundância. */

-- Cria conta admin inicial
INSERT INTO admin (admin_uuid, name_admin, email_admin, password_admin) VALUES ('11111111-2222-3333-4444-555555555555', 'Admin Inicial', 'admin@admin.com', 'admin');
