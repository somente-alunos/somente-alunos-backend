
type Type_env = Required<Env>;

type Type_errorOr<ParameterType_origin> = ParameterType_origin extends Promise<infer ParameterType_originInfer>
	? Promise<ParameterType_originInfer | Type_isError>
	: (ParameterType_origin | Type_isError);

type Type_isError = {
    typ: 'catch' | 'logical';
    msg: string;
    inf?: unknown;
    loc: string;
    err: true;
};

type Type_payloadJwtStudent = {
	tar: {
		student_uuid: string;
		isAllContentUnlocked: boolean;
	};
	exp: number;
};

type Type_payloadJwtAdmin = {
	tar: {
		admin_uuid: string;
	};
	exp: number;
};

type Type_efiBankAlias = 'gp' | 'rp' | 'rc';

type Type_efiBankOauthTokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
};

type Type_efiBankCobResponse = {
	status?: string;
	txid?: string;
	location?: string;
	pixCopiaECola?: string;
	calendario?: {
		criacao?: string;
		expiracao?: number | string;
	};
	valor?: {
		original?: string;
	};
	nome?: string;
	mensagem?: string;
};

type Type_efiBankWebhookPixItem = {
	endToEndId?: string;
	txid?: string;
	chave?: string;
	valor?: string;
	horario?: string;
	infoPagador?: string;
	gnExtras?: unknown;
	devolucoes?: Array<unknown>;
};

type Type_efiBankWebhookPayload = {
	pix?: Array<Type_efiBankWebhookPixItem>;
};



// Type Object Student [...] Response
type Type_objectStudentCollegeResponse = {
	college_uuid: Type_tableD1CollegeGet['college_uuid'];

	name_college: Type_tableD1CollegeGet['name_college'];
	svg_college: Type_tableD1CollegeGet['svg_college'];
};

type Type_objectStudentCourseResponse = {
	course_uuid: Type_tableD1CourseGet['course_uuid'];

	name_course: Type_tableD1CourseGet['name_course'];
	svg_course: Type_tableD1CourseGet['svg_course'];
	college_uuid_course: Type_tableD1CourseGet['college_uuid_course'];
};

type Type_objectStudentContentResponse = {
	content_uuid: Type_tableD1ContentGet['content_uuid'];
	content_update: Type_tableD1ContentGet['content_update'];

	name_content: Type_tableD1ContentGet['name_content'];
	student_uuid_content: Type_tableD1ContentGet['student_uuid_content'];

	old_price_content: Type_tableD1ContentGet['old_price_content'];
	current_price_content: Type_tableD1ContentGet['current_price_content'];

	preview_file_uuid_content: Type_tableD1ContentGet['preview_file_uuid_content'];
	full_file_uuid_content: Type_tableD1ContentGet['full_file_uuid_content'];

	college_uuid_content: Type_tableD1ContentGet['college_uuid_content'];
	course_uuid_content: Type_tableD1ContentGet['course_uuid_content'];

	prevision_content: Type_tableD1ContentGet['prevision_content'];
	verified_content: Type_tableD1ContentGet['verified_content'];
};

type Type_objectStudentAcquiredResponse = {
	sale_history_uuid: Type_tableD1SaleHistoryGet['sale_history_uuid'];

	student_uuid_seller_sale_history: Type_tableD1SaleHistoryGet['student_uuid_seller_sale_history'];
	student_uuid_buyer_sale_history: Type_tableD1SaleHistoryGet['student_uuid_buyer_sale_history'];
	content_uuid_sale_history: Type_tableD1SaleHistoryGet['content_uuid_sale_history'];

	information_content_sale_history: Type_objectStudentContentResponse;

	status_sale_history: Type_tableD1SaleHistoryGet['status_sale_history'];
};

type Type_objectStudentCartResponse = Type_objectStudentContentResponse;



// Type Object Admin [...] Response
type Type_objectAdminStudentResponse = Type_tableD1StudentGet;

type Type_objectAdminCollegeResponse = Type_tableD1CollegeGet;

type Type_objectAdminCourseResponse = Type_tableD1CourseGet;

type Type_objectAdminContentResponse = Type_tableD1ContentGet;

type Type_objectAdminSaleHistoryResponse = Type_tableD1SaleHistoryGet;

type Type_objectAdminDenunciaResponse = Type_tableD1DenunciaGet;

type Type_objectAdminAdminResponse = Type_tableD1AdminGet;
