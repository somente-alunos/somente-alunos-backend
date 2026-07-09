
type Type_tableD1StudentGet = {
	student_id: number;
	student_uuid: string;
	student_created: string;
	student_update: string;

	ra_student: string | null;
	cpf_student: string | null;

	invitation_code_student: string;

	college_uuid_student: string | null;
	course_uuid_student: string | null;
	class_student: string | null;

	cart_student: string | null; // JSON parse Type_objectStudentContentResponse

	is_suggested_information_student: 0 | 1;
}

type Type_tableD1CollegeGet = {
	college_id: number;
	college_uuid: string;
	college_created: string;
	college_update: string;

	name_college: string;
	svg_college: string | null;
}

type Type_tableD1CourseGet = {
	course_id: number;
	course_uuid: string;
	course_created: string;
	course_update: string;

	name_course: string;
	svg_course: string | null;
	college_uuid_course: string;
}

type Type_tableD1ContentGet = {
	content_id: number;
	content_uuid: string;
	content_created: string;
	content_update: string;

	name_content: string;
	student_uuid_content: string;

	old_price_content: number | null;
	current_price_content: number;

	preview_file_uuid_content: string | null;
	full_file_uuid_content: string | null;

	college_uuid_content: string;
	course_uuid_content: string;
	class_content: string | null;

	prevision_content: string | null;
	verified_content: 0 | 1;
}

type Type_tableD1SaleHistoryGet = {
	sale_history_id: number;
	sale_history_uuid: string;
	sale_history_created: string;
	sale_history_update: string;

	student_uuid_seller_sale_history: string | null;
	student_uuid_buyer_sale_history: string;
	content_uuid_sale_history: string;

	information_content_sale_history: string | null;

	status_sale_history: string;

	paid_to_seller_sale_history: string | null;
}

type Type_tableD1OrderedGet = {
	ordered_id: number;
	ordered_uuid: string;
	ordered_created: string;
	ordered_update: string;

	student_uuid_buyer_ordered: string;
	content_uuid_array_ordered: string; // JSON parse Array<content_uuid>

	total_amount_ordered: number;
	method_ordered: string; // pix | card_credit

	status_ordered: string;

	webhook_payload_ordered: string | null;
}

type Type_tableD1DenunciaGet = {
	denuncia_id: number;
	denuncia_uuid: string;
	denuncia_created: string;
	denuncia_update: string;

	student_uuid_denuncia: string;
	content_uuid_denuncia: string;

	reason_array_denuncia: string; // JSON parse Array<string>
	extra_information_denuncia: string | null;

	status_denuncia: string;
	admin_uuid_review_denuncia: string | null;
	review_note_denuncia: string | null;
	reviewed_at_denuncia: string | null;
}

type Type_tableD1AdminGet = {
	admin_id: number;
	admin_uuid: string;
	admin_created: string;
	admin_update: string;

	name_admin: string;
	email_admin: string;
	password_admin: string;
}



type Type_tableD1StudentPost = {
	student_uuid: Type_tableD1StudentGet['student_uuid'];

	invitation_code_student: Type_tableD1StudentGet['invitation_code_student'];

	ra_student?: Type_tableD1StudentGet['ra_student'];
	cpf_student?: Type_tableD1StudentGet['cpf_student'];

	college_uuid_student?: Type_tableD1StudentGet['college_uuid_student'];
	course_uuid_student?: Type_tableD1StudentGet['course_uuid_student'];
	class_student?: Type_tableD1StudentGet['class_student'];

	cart_student?: Type_tableD1StudentGet['cart_student'];
	is_suggested_information_student?: Type_tableD1StudentGet['is_suggested_information_student'];
}

type Type_tableD1CollegePost = {
	college_uuid: Type_tableD1CollegeGet['college_uuid'];

	name_college: Type_tableD1CollegeGet['name_college'];
	svg_college?: Type_tableD1CollegeGet['svg_college'];
}

type Type_tableD1CoursePost = {
	course_uuid: Type_tableD1CourseGet['course_uuid'];

	name_course: Type_tableD1CourseGet['name_course'];
	svg_course?: Type_tableD1CourseGet['svg_course'];
	college_uuid_course: Type_tableD1CourseGet['college_uuid_course'];
}

type Type_tableD1ContentPost = {
	content_uuid: Type_tableD1ContentGet['content_uuid'];

	name_content: Type_tableD1ContentGet['name_content'];
	student_uuid_content: Type_tableD1ContentGet['student_uuid_content'];

	old_price_content?: Type_tableD1ContentGet['old_price_content'];
	current_price_content: Type_tableD1ContentGet['current_price_content'];

	preview_file_uuid_content?: Type_tableD1ContentGet['preview_file_uuid_content'];
	full_file_uuid_content?: Type_tableD1ContentGet['full_file_uuid_content'];

	college_uuid_content: Type_tableD1ContentGet['college_uuid_content'];
	course_uuid_content: Type_tableD1ContentGet['course_uuid_content'];

	class_content?: Type_tableD1ContentGet['class_content'];
	prevision_content?: Type_tableD1ContentGet['prevision_content'];
	verified_content?: Type_tableD1ContentGet['verified_content'];
}

type Type_tableD1SaleHistoryPost = {
	sale_history_uuid: Type_tableD1SaleHistoryGet['sale_history_uuid'];

	student_uuid_seller_sale_history?: Type_tableD1SaleHistoryGet['student_uuid_seller_sale_history'];
	student_uuid_buyer_sale_history: Type_tableD1SaleHistoryGet['student_uuid_buyer_sale_history'];
	content_uuid_sale_history: Type_tableD1SaleHistoryGet['content_uuid_sale_history'];

	information_content_sale_history?: Type_tableD1SaleHistoryGet['information_content_sale_history'];

	status_sale_history: Type_tableD1SaleHistoryGet['status_sale_history'];

	paid_to_seller_sale_history?: Type_tableD1SaleHistoryGet['paid_to_seller_sale_history'];
}

type Type_tableD1OrderedPost = {
	ordered_uuid: Type_tableD1OrderedGet['ordered_uuid'];

	student_uuid_buyer_ordered: Type_tableD1OrderedGet['student_uuid_buyer_ordered'];
	content_uuid_array_ordered: Type_tableD1OrderedGet['content_uuid_array_ordered'];

	total_amount_ordered: Type_tableD1OrderedGet['total_amount_ordered'];
	method_ordered: Type_tableD1OrderedGet['method_ordered'];

	status_ordered: Type_tableD1OrderedGet['status_ordered'];

	webhook_payload_ordered?: Type_tableD1OrderedGet['webhook_payload_ordered'];
}

type Type_tableD1DenunciaPost = {
	denuncia_uuid: Type_tableD1DenunciaGet['denuncia_uuid'];

	student_uuid_denuncia: Type_tableD1DenunciaGet['student_uuid_denuncia'];
	content_uuid_denuncia: Type_tableD1DenunciaGet['content_uuid_denuncia'];

	reason_array_denuncia: Type_tableD1DenunciaGet['reason_array_denuncia'];
	extra_information_denuncia?: Type_tableD1DenunciaGet['extra_information_denuncia'];

	status_denuncia?: Type_tableD1DenunciaGet['status_denuncia'];
	admin_uuid_review_denuncia?: Type_tableD1DenunciaGet['admin_uuid_review_denuncia'];
	review_note_denuncia?: Type_tableD1DenunciaGet['review_note_denuncia'];
	reviewed_at_denuncia?: Type_tableD1DenunciaGet['reviewed_at_denuncia'];
}

type Type_tableD1AdminPost = {
	admin_uuid: Type_tableD1AdminGet['admin_uuid'];

	name_admin: Type_tableD1AdminGet['name_admin'];
	email_admin: Type_tableD1AdminGet['email_admin'];
	password_admin: Type_tableD1AdminGet['password_admin'];
}



type Type_tableD1StudentPatch = {
	student_uuid: Type_tableD1StudentGet['student_uuid'];
}

type Type_tableD1CollegePatch = {
	college_uuid: Type_tableD1CollegeGet['college_uuid'];
}

type Type_tableD1CoursePatch = {
	course_uuid: Type_tableD1CourseGet['course_uuid'];

}

type Type_tableD1ContentPatch = {
	content_uuid: Type_tableD1ContentGet['content_uuid'];
}

type Type_tableD1SaleHistoryPatch = {
	sale_history_uuid: Type_tableD1SaleHistoryGet['sale_history_uuid'];
}

type Type_tableD1OrderedPatch = {
	ordered_uuid?: Type_tableD1OrderedGet['ordered_uuid'];
}

type Type_tableD1DenunciaPatch = {
	denuncia_uuid: Type_tableD1DenunciaGet['denuncia_uuid'];
}

type Type_tableD1AdminPatch = {
	admin_uuid: Type_tableD1AdminGet['admin_uuid'];
}



type Type_tableD1StudentDelete = {
	student_uuid: Type_tableD1StudentGet['student_uuid'];
}

type Type_tableD1CollegeDelete = {
	college_uuid: Type_tableD1CollegeGet['college_uuid'];
}

type Type_tableD1CourseDelete = {
	course_uuid: Type_tableD1CourseGet['course_uuid'];

}

type Type_tableD1ContentDelete = {
	content_uuid: Type_tableD1ContentGet['content_uuid'];
}

type Type_tableD1SaleHistoryDelete = {
	sale_history_uuid: Type_tableD1SaleHistoryGet['sale_history_uuid'];
}

type Type_tableD1OrderedDelete = {
	ordered_uuid?: Type_tableD1OrderedGet['ordered_uuid'];
}

type Type_tableD1DenunciaDelete = {
	denuncia_uuid: Type_tableD1DenunciaGet['denuncia_uuid'];
}

type Type_tableD1AdminDelete = {
	admin_uuid: Type_tableD1AdminGet['admin_uuid'];
}



type Type_orNameTableD1 = 'student' | 'college' | 'course' | 'content' | 'sale_history' | 'ordered' | 'denuncia' | 'admin';



type Type_mapTableD1Get = {
	student: Type_tableD1StudentGet;
	college: Type_tableD1CollegeGet;
	course: Type_tableD1CourseGet;
	content: Type_tableD1ContentGet;
	sale_history: Type_tableD1SaleHistoryGet;
	ordered: Type_tableD1OrderedGet;
	denuncia: Type_tableD1DenunciaGet;
	admin: Type_tableD1AdminGet;
}

type Type_mapTableD1Post = {
	student: Type_tableD1StudentPost;
	college: Type_tableD1CollegePost;
	course: Type_tableD1CoursePost;
	content: Type_tableD1ContentPost;
	sale_history: Type_tableD1SaleHistoryPost;
	ordered: Type_tableD1OrderedPost;
	denuncia: Type_tableD1DenunciaPost;
	admin: Type_tableD1AdminPost;
}

type Type_mapTableD1Patch = {
	student: Type_tableD1StudentPatch;
	college: Type_tableD1CollegePatch;
	course: Type_tableD1CoursePatch;
	content: Type_tableD1ContentPatch;
	sale_history: Type_tableD1SaleHistoryPatch;
	ordered: Type_tableD1OrderedPatch;
	denuncia: Type_tableD1DenunciaPatch;
	admin: Type_tableD1AdminPatch;
}

type Type_mapTableD1Delete = {
	student: Type_tableD1StudentDelete;
	college: Type_tableD1CollegeDelete;
	course: Type_tableD1CourseDelete;
	content: Type_tableD1ContentDelete;
	sale_history: Type_tableD1SaleHistoryDelete;
	ordered: Type_tableD1OrderedDelete;
	denuncia: Type_tableD1DenunciaDelete;
	admin: Type_tableD1AdminDelete;
}



type Type_returnGetD1<
	ParameterType_table extends Type_orNameTableD1,
	ParameterType_column extends Array<keyof Type_mapTableD1Get[ParameterType_table] | '*'>
> = '*' extends ParameterType_column[number]
	? Type_mapTableD1Get[ParameterType_table]
	: Pick<Type_mapTableD1Get[ParameterType_table], ParameterType_column[number] & keyof Type_mapTableD1Get[ParameterType_table]>

type Type_returnPostD1<
	ParameterType_table extends Type_orNameTableD1,
	ParameterType_column extends Array<keyof Type_mapTableD1Post[ParameterType_table] | '*'>
> = '*' extends ParameterType_column[number]
	? Type_mapTableD1Post[ParameterType_table]
	: Pick<Type_mapTableD1Post[ParameterType_table], ParameterType_column[number] & keyof Type_mapTableD1Post[ParameterType_table]>
