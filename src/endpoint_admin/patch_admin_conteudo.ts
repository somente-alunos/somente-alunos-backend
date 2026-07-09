import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1 } from "../function_global"


type Type_PatchAdminConteudoBody = {
	content_uuid: string;
	content_uuid_new?: string;
	name_content?: string;
	student_uuid_content?: string;
	old_price_content?: number | string | null;
	current_price_content?: number | string;
	preview_file_uuid_content?: string | null;
	full_file_uuid_content?: string | null;
	college_uuid_content?: string;
	course_uuid_content?: string;
	class_content?: string | null;
	prevision_content?: string | null;
	verified_content?: number | string | boolean;
	content_id?: unknown;
	content_created?: unknown;
	content_update?: unknown;
}

type Type_PatchAdminConteudoResponse = {
	content: Type_objectAdminContentResponse;
}

function Function_getNumberOrUndefined(Parameter_value: unknown): number | undefined {
	if (typeof Parameter_value === 'number' && Number.isFinite(Parameter_value)) {
		return Parameter_value
	}

	if (typeof Parameter_value !== 'string') {
		return undefined
	}

	const Const_trimmedValue = Parameter_value.trim()
	if (Const_trimmedValue.length <= 0) {
		return undefined
	}

	const Const_numberValue = Number(Const_trimmedValue)
	if (!Number.isFinite(Const_numberValue)) {
		return undefined
	}

	return Const_numberValue
}

function Function_getVerifiedContentOrUndefined(Parameter_value: unknown): 0 | 1 | undefined {
	if (typeof Parameter_value === 'boolean') {
		return Parameter_value ? 1 : 0
	}

	if (Parameter_value === 0 || Parameter_value === 1) {
		return Parameter_value
	}

	if (typeof Parameter_value === 'string') {
		const Const_value = Parameter_value.trim().toLowerCase()
		if (Const_value === '1' || Const_value === 'true') {
			return 1
		}
		if (Const_value === '0' || Const_value === 'false') {
			return 0
		}
	}

	return undefined
}


export class Class_PatchAdminConteudo {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Le body e valida entrada obrigatoria
			let Const_bodyUnknown: unknown
			try {
				Const_bodyUnknown = await Parameter_request.json()
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid JSON body', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 452, 'Invalid JSON body')
			}

			if (typeof Const_bodyUnknown !== 'object' || Const_bodyUnknown === null) {
				return Function_getResponseError({ typ: 'logical', msg: 'Body must be a valid object', inf: { Const_bodyUnknown }, loc: Function_getFuncionName(), err: true }, 453, 'Body must be object')
			}

			const Const_body = Const_bodyUnknown as Partial<Type_PatchAdminConteudoBody>
			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_body.content_uuid)
			if (typeof Const_contentUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required content_uuid')
			}

			const Const_hasContentId = Object.prototype.hasOwnProperty.call(Const_body, 'content_id')
			const Const_hasContentCreated = Object.prototype.hasOwnProperty.call(Const_body, 'content_created')
			const Const_hasContentUpdate = Object.prototype.hasOwnProperty.call(Const_body, 'content_update')
			if (Const_hasContentId || Const_hasContentCreated || Const_hasContentUpdate) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_id, content_created and content_update cannot be patched', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 455, 'Forbidden fields in body')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Garante que o conteudo existe
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 456, 'Error fetching content to patch')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content to patch was not found', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 457, 'Content not found')
			}
			// /\ Garante que o conteudo existe

			// \/ Valida campos opcionais
			const Const_hasContentUuidNew = Object.prototype.hasOwnProperty.call(Const_body, 'content_uuid_new')
			const Const_hasNameContent = Object.prototype.hasOwnProperty.call(Const_body, 'name_content')
			const Const_hasStudentUuidContent = Object.prototype.hasOwnProperty.call(Const_body, 'student_uuid_content')
			const Const_hasOldPriceContent = Object.prototype.hasOwnProperty.call(Const_body, 'old_price_content')
			const Const_hasCurrentPriceContent = Object.prototype.hasOwnProperty.call(Const_body, 'current_price_content')
			const Const_hasPreviewFileUuidContent = Object.prototype.hasOwnProperty.call(Const_body, 'preview_file_uuid_content')
			const Const_hasFullFileUuidContent = Object.prototype.hasOwnProperty.call(Const_body, 'full_file_uuid_content')
			const Const_hasCollegeUuidContent = Object.prototype.hasOwnProperty.call(Const_body, 'college_uuid_content')
			const Const_hasCourseUuidContent = Object.prototype.hasOwnProperty.call(Const_body, 'course_uuid_content')
			const Const_hasClassContent = Object.prototype.hasOwnProperty.call(Const_body, 'class_content')
			const Const_hasPrevisionContent = Object.prototype.hasOwnProperty.call(Const_body, 'prevision_content')
			const Const_hasVerifiedContent = Object.prototype.hasOwnProperty.call(Const_body, 'verified_content')
			if (
				!Const_hasContentUuidNew &&
				!Const_hasNameContent &&
				!Const_hasStudentUuidContent &&
				!Const_hasOldPriceContent &&
				!Const_hasCurrentPriceContent &&
				!Const_hasPreviewFileUuidContent &&
				!Const_hasFullFileUuidContent &&
				!Const_hasCollegeUuidContent &&
				!Const_hasCourseUuidContent &&
				!Const_hasClassContent &&
				!Const_hasPrevisionContent &&
				!Const_hasVerifiedContent
			) {
				return Function_getResponseError({ typ: 'logical', msg: 'At least one field must be provided to patch content', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 458, 'No fields to patch')
			}

			const Const_contentUuidNew = Function_getTrimmedStringOrUndefined(Const_body.content_uuid_new)
			if (Const_hasContentUuidNew && typeof Const_contentUuidNew !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid_new must be non-empty string when provided', inf: { content_uuid_new: Const_body.content_uuid_new }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid content_uuid_new')
			}

			const Const_nameContent = Function_getTrimmedStringOrUndefined(Const_body.name_content)
			if (Const_hasNameContent && typeof Const_nameContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_content must be non-empty string when provided', inf: { name_content: Const_body.name_content }, loc: Function_getFuncionName(), err: true }, 460, 'Invalid name_content')
			}

			const Const_studentUuidContent = Function_getTrimmedStringOrUndefined(Const_body.student_uuid_content)
			if (Const_hasStudentUuidContent && typeof Const_studentUuidContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_content must be non-empty string when provided', inf: { student_uuid_content: Const_body.student_uuid_content }, loc: Function_getFuncionName(), err: true }, 461, 'Invalid student_uuid_content')
			}

			let Let_oldPriceContent: number | null | undefined
			if (Const_hasOldPriceContent) {
				if (Const_body.old_price_content === null) {
					Let_oldPriceContent = null
				}
				else {
					const Const_oldPriceContent = Function_getNumberOrUndefined(Const_body.old_price_content)
					if (typeof Const_oldPriceContent !== 'number') {
						return Function_getResponseError({ typ: 'logical', msg: 'old_price_content must be valid number or null when provided', inf: { old_price_content: Const_body.old_price_content }, loc: Function_getFuncionName(), err: true }, 462, 'Invalid old_price_content')
					}

					Let_oldPriceContent = Const_oldPriceContent
				}
			}

			const Const_currentPriceContent = Function_getNumberOrUndefined(Const_body.current_price_content)
			if (Const_hasCurrentPriceContent && typeof Const_currentPriceContent !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'current_price_content must be valid number when provided', inf: { current_price_content: Const_body.current_price_content }, loc: Function_getFuncionName(), err: true }, 463, 'Invalid current_price_content')
			}

			let Let_previewFileUuidContent: string | null | undefined
			if (Const_hasPreviewFileUuidContent) {
				if (Const_body.preview_file_uuid_content === null) {
					Let_previewFileUuidContent = null
				}
				else {
					const Const_previewFileUuidContent = Function_getTrimmedStringOrUndefined(Const_body.preview_file_uuid_content)
					if (typeof Const_previewFileUuidContent !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'preview_file_uuid_content must be non-empty string or null when provided', inf: { preview_file_uuid_content: Const_body.preview_file_uuid_content }, loc: Function_getFuncionName(), err: true }, 464, 'Invalid preview_file_uuid_content')
					}

					Let_previewFileUuidContent = Const_previewFileUuidContent
				}
			}

			let Let_fullFileUuidContent: string | null | undefined
			if (Const_hasFullFileUuidContent) {
				if (Const_body.full_file_uuid_content === null) {
					Let_fullFileUuidContent = null
				}
				else {
					const Const_fullFileUuidContent = Function_getTrimmedStringOrUndefined(Const_body.full_file_uuid_content)
					if (typeof Const_fullFileUuidContent !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'full_file_uuid_content must be non-empty string or null when provided', inf: { full_file_uuid_content: Const_body.full_file_uuid_content }, loc: Function_getFuncionName(), err: true }, 465, 'Invalid full_file_uuid_content')
					}

					Let_fullFileUuidContent = Const_fullFileUuidContent
				}
			}

			const Const_collegeUuidContent = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_content)
			if (Const_hasCollegeUuidContent && typeof Const_collegeUuidContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_content must be non-empty string when provided', inf: { college_uuid_content: Const_body.college_uuid_content }, loc: Function_getFuncionName(), err: true }, 466, 'Invalid college_uuid_content')
			}

			const Const_courseUuidContent = Function_getTrimmedStringOrUndefined(Const_body.course_uuid_content)
			if (Const_hasCourseUuidContent && typeof Const_courseUuidContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid_content must be non-empty string when provided', inf: { course_uuid_content: Const_body.course_uuid_content }, loc: Function_getFuncionName(), err: true }, 467, 'Invalid course_uuid_content')
			}

			let Let_classContent: string | null | undefined
			if (Const_hasClassContent) {
				if (Const_body.class_content === null) {
					Let_classContent = null
				}
				else {
					const Const_classContent = Function_getTrimmedStringOrUndefined(Const_body.class_content)
					if (typeof Const_classContent !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'class_content must be non-empty string or null when provided', inf: { class_content: Const_body.class_content }, loc: Function_getFuncionName(), err: true }, 468, 'Invalid class_content')
					}

					Let_classContent = Const_classContent
				}
			}

			let Let_previsionContent: string | null | undefined
			if (Const_hasPrevisionContent) {
				if (Const_body.prevision_content === null) {
					Let_previsionContent = null
				}
				else {
					const Const_previsionContent = Function_getTrimmedStringOrUndefined(Const_body.prevision_content)
					if (typeof Const_previsionContent !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'prevision_content must be non-empty string or null when provided', inf: { prevision_content: Const_body.prevision_content }, loc: Function_getFuncionName(), err: true }, 469, 'Invalid prevision_content')
					}

					Let_previsionContent = Const_previsionContent
				}
			}

			const Const_verifiedContent = Function_getVerifiedContentOrUndefined(Const_body.verified_content)
			if (Const_hasVerifiedContent && (Const_verifiedContent !== 0 && Const_verifiedContent !== 1)) {
				return Function_getResponseError({ typ: 'logical', msg: 'verified_content must be 0/1/true/false when provided', inf: { verified_content: Const_body.verified_content }, loc: Function_getFuncionName(), err: true }, 470, 'Invalid verified_content')
			}
			// /\ Valida campos opcionais

			// \/ Executa patch no D1
			const Const_dataUpdate: Partial<Type_tableD1ContentGet> = {}
			if (typeof Const_contentUuidNew === 'string') {
				Const_dataUpdate.content_uuid = Const_contentUuidNew
			}
			if (typeof Const_nameContent === 'string') {
				Const_dataUpdate.name_content = Const_nameContent
			}
			if (typeof Const_studentUuidContent === 'string') {
				Const_dataUpdate.student_uuid_content = Const_studentUuidContent
			}
			if (Const_hasOldPriceContent) {
				Const_dataUpdate.old_price_content = Let_oldPriceContent === undefined ? null : Let_oldPriceContent
			}
			if (typeof Const_currentPriceContent === 'number') {
				if (!Const_hasOldPriceContent) {
					Const_dataUpdate.old_price_content = Const_content.current_price_content
				}
				Const_dataUpdate.current_price_content = Const_currentPriceContent
			}
			if (Const_hasPreviewFileUuidContent) {
				Const_dataUpdate.preview_file_uuid_content = Let_previewFileUuidContent === undefined ? null : Let_previewFileUuidContent
			}
			if (Const_hasFullFileUuidContent) {
				Const_dataUpdate.full_file_uuid_content = Let_fullFileUuidContent === undefined ? null : Let_fullFileUuidContent
			}
			if (typeof Const_collegeUuidContent === 'string') {
				Const_dataUpdate.college_uuid_content = Const_collegeUuidContent
			}
			if (typeof Const_courseUuidContent === 'string') {
				Const_dataUpdate.course_uuid_content = Const_courseUuidContent
			}
			if (Const_hasClassContent) {
				Const_dataUpdate.class_content = Let_classContent === undefined ? null : Let_classContent
			}
			if (Const_hasPrevisionContent) {
				Const_dataUpdate.prevision_content = Let_previsionContent === undefined ? null : Let_previsionContent
			}
			if (Const_verifiedContent === 0 || Const_verifiedContent === 1) {
				Const_dataUpdate.verified_content = Const_verifiedContent
			}

			const Const_contentUpdated = await Function_patchD1(Parameter_env, 'content', Const_dataUpdate, {
				content_uuid: Const_contentUuid
			}, ['*'])
			if (Function_isError(Const_contentUpdated)) {
				return Function_getResponseError(Const_contentUpdated, 471, 'Error patching admin content')
			}
			// /\ Executa patch no D1

			const Const_responseBody: Type_PatchAdminConteudoResponse = {
				content: Const_contentUpdated
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error patching admin content', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}

