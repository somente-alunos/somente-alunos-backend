
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
-- CREATE INDEX index_invitation_code_student ON student (invitation_code_student);


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
-- CREATE INDEX index_college_uuid ON college (college_uuid);


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
-- CREATE INDEX index_college_uuid_course ON course (college_uuid_course);


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

	college_uuid_content									text not null, -- UUID da faculdade que o conteúdo pertence
	course_uuid_content										text not null, -- UUID do curso que o conteúdo pertence
	class_content											text, -- Turma do conteúdo

	prevision_content										timestamp, -- Previsão de quando será postado o conteúdo caso ainda não tenha postado

	verified_content										boolean default false, -- Se o conteúdo já foi verificado por um admin
);

-- DROP TRIGGER IF EXISTS trigger_update_content;
CREATE TRIGGER trigger_update_content AFTER UPDATE ON content
WHEN NEW.content_update = OLD.content_update BEGIN
    UPDATE content SET content_update = CURRENT_TIMESTAMP WHERE content_id = NEW.content_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
-- CREATE INDEX index_college_course_class ON content (college_uuid_content, course_uuid_content, class_content);


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
-- CREATE INDEX index_student_uuid_buyer_sale_history ON sale_history (student_uuid_buyer_sale_history);
-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÇÂO DE QUAIS SERÃO AS CONSULTAS ]
-- CREATE INDEX index_student_uuid_seller_sale_history ON sale_history (student_uuid_seller_sale_history);


CREATE TABLE pix_payment
(
	pix_payment_id											integer primary key autoincrement,
	pix_payment_uuid										text not null unique,
	pix_payment_created										timestamp default current_timestamp not null,
	pix_payment_update										timestamp default current_timestamp not null,

	txid_pix_payment										text not null unique, -- txid da cobranca na Efi (regex: ^[a-zA-Z0-9]{26,35}$)

	student_uuid_buyer_pix_payment							text not null, -- UUID do aluno comprador
	content_uuid_array_pix_payment							text not null, -- JSON string com array de content_uuid comprados

	total_amount_pix_payment								real not null, -- valor total da cobranca

	status_pix_payment										text not null, -- waiting_payment | completed | failed
	efi_bank_alias_pix_payment								text not null, -- gp | rp | rc

	e2e_id_pix_payment										text, -- EndToEndId recebido no webhook
	webhook_payload_pix_payment								text -- JSON bruto recebido no webhook
);

CREATE TRIGGER trigger_update_pix_payment AFTER UPDATE ON pix_payment
BEGIN
	UPDATE pix_payment SET pix_payment_update = CURRENT_TIMESTAMP WHERE pix_payment_id = NEW.pix_payment_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÃ‡Ã‚O DE QUAIS SERÃƒO AS CONSULTAS ]
-- CREATE INDEX index_txid_pix_payment ON pix_payment (txid_pix_payment);
-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÃ‡Ã‚O DE QUAIS SERÃƒO AS CONSULTAS ]
-- CREATE INDEX index_student_uuid_buyer_pix_payment ON pix_payment (student_uuid_buyer_pix_payment);


CREATE TABLE denuncia
(
	denuncia_id												integer primary key autoincrement,
	denuncia_uuid											text not null unique,
	denuncia_created										timestamp default current_timestamp not null,
	denuncia_update											timestamp default current_timestamp not null,

	student_uuid_denuncia									text not null, -- UUID do aluno que denunciou
	content_uuid_denuncia									text not null, -- UUID do conteudo denunciado

	reason_array_denuncia									text not null, -- JSON string com array de motivos selecionados
	extra_information_denuncia								text, -- Informacoes adicionais opcionais

	status_denuncia											text not null default 'pending', -- pending | reviewed | accepted | rejected
	admin_uuid_review_denuncia								text, -- UUID do admin que revisou a denuncia
	review_note_denuncia									text, -- Observacao interna da revisao
	reviewed_at_denuncia									timestamp -- Data da revisao da denuncia
);

CREATE TRIGGER trigger_update_denuncia AFTER UPDATE ON denuncia
BEGIN
	UPDATE denuncia SET denuncia_update = CURRENT_TIMESTAMP WHERE denuncia_id = NEW.denuncia_id;
END;

-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÃ‡Ã‚O DE QUAIS SERÃƒO AS CONSULTAS ]
-- CREATE INDEX index_content_uuid_denuncia ON denuncia (content_uuid_denuncia);
-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÃ‡Ã‚O DE QUAIS SERÃƒO AS CONSULTAS ]
-- CREATE INDEX index_student_uuid_denuncia ON denuncia (student_uuid_denuncia);
-- [ EDITE PARA O MAIS OTIMIZADO POSSIVEL EM FUNÃ‡Ã‚O DE QUAIS SERÃƒO AS CONSULTAS ]
-- CREATE INDEX index_status_denuncia ON denuncia (status_denuncia);


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
-- CREATE INDEX index_email_admin ON admin (email_admin);

-- Cria conta admin inicial
INSERT INTO admin (admin_uuid, name_admin, email_admin, password_admin) VALUES ('11111111-2222-3333-4444-555555555555', 'Admin Inicial', 'admin@admin.com', 'admin');
