import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1 } from "../function_global"


type Type_PatchStudentConteudoBody = {
	content_uuid: string;
	name_content?: string;
	current_price_content?: number | string;
	college_uuid_content?: string;
	course_uuid_content?: string;
	class_content?: string;
	prevision_content?: string;
}

type Type_PatchStudentConteudoResponse = {
	content: Type_objectStudentContentResponse;
}

function Function_mapContentGetToObjectStudentContentResponse(Parameter_contentGet: Type_tableD1ContentGet): Type_objectStudentContentResponse {
	return {
		content_uuid: Parameter_contentGet.content_uuid,
		content_update: Parameter_contentGet.content_update,
		name_content: Parameter_contentGet.name_content,
		student_uuid_content: Parameter_contentGet.student_uuid_content,
		old_price_content: Parameter_contentGet.old_price_content,
		current_price_content: Parameter_contentGet.current_price_content,
		preview_file_uuid_content: Parameter_contentGet.preview_file_uuid_content,
		full_file_uuid_content: Parameter_contentGet.full_file_uuid_content,
		college_uuid_content: Parameter_contentGet.college_uuid_content,
		course_uuid_content: Parameter_contentGet.course_uuid_content,
		prevision_content: Parameter_contentGet.prevision_content,
		verified_content: Parameter_contentGet.verified_content ? 1 : 0
	}
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


export class Class_PatchStudentConteudo {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

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

			const Const_body = Const_bodyUnknown as Partial<Type_PatchStudentConteudoBody>
			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_body.content_uuid)
			if (typeof Const_contentUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required content_uuid')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Garante que o conteudo existe e pertence ao aluno autenticado
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 455, 'Error fetching content to patch')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content to patch was not found', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 456, 'Content not found')
			}

			if (Const_content.student_uuid_content !== Const_studentAuthenticated.student_uuid) {
				return Function_getResponseError({ typ: 'logical', msg: 'Student cannot patch content from another owner', inf: { Const_contentUuid, contentOwnerUuid: Const_content.student_uuid_content, studentUuid: Const_studentAuthenticated.student_uuid }, loc: Function_getFuncionName(), err: true }, 457, 'Forbidden content patch')
			}
			// /\ Garante que o conteudo existe e pertence ao aluno autenticado

			// \/ Valida campos opcionais e monta update parcial
			const Const_hasNameContent = Object.prototype.hasOwnProperty.call(Const_body, 'name_content')
			const Const_hasCurrentPriceContent = Object.prototype.hasOwnProperty.call(Const_body, 'current_price_content')
			const Const_hasCollegeUuidContent = Object.prototype.hasOwnProperty.call(Const_body, 'college_uuid_content')
			const Const_hasCourseUuidContent = Object.prototype.hasOwnProperty.call(Const_body, 'course_uuid_content')
			const Const_hasClassContent = Object.prototype.hasOwnProperty.call(Const_body, 'class_content')
			const Const_hasPrevisionContent = Object.prototype.hasOwnProperty.call(Const_body, 'prevision_content')
			if (!Const_hasNameContent && !Const_hasCurrentPriceContent && !Const_hasCollegeUuidContent && !Const_hasCourseUuidContent && !Const_hasClassContent && !Const_hasPrevisionContent) {
				return Function_getResponseError({ typ: 'logical', msg: 'At least one optional field must be provided to patch content', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 458, 'No fields to patch')
			}

			const Const_nameContent = Function_getTrimmedStringOrUndefined(Const_body.name_content)
			if (Const_hasNameContent && typeof Const_nameContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_content must be a non-empty string when provided', inf: { name_content: Const_body.name_content }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid name_content')
			}

			const Const_currentPriceContent = Function_getNumberOrUndefined(Const_body.current_price_content)
			if (Const_hasCurrentPriceContent && typeof Const_currentPriceContent !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'current_price_content must be a valid number when provided', inf: { current_price_content: Const_body.current_price_content }, loc: Function_getFuncionName(), err: true }, 460, 'Invalid current_price_content')
			}
			if (typeof Const_currentPriceContent === 'number' && !(Const_currentPriceContent > 0)) {
				return Function_getResponseError({ typ: 'logical', msg: 'current_price_content must be greater than zero', inf: { Const_currentPriceContent }, loc: Function_getFuncionName(), err: true }, 461, 'Invalid current_price_content')
			}

			const Const_collegeUuidContent = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_content)
			if (Const_hasCollegeUuidContent && typeof Const_collegeUuidContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_content must be a non-empty string when provided', inf: { college_uuid_content: Const_body.college_uuid_content }, loc: Function_getFuncionName(), err: true }, 462, 'Invalid college_uuid_content')
			}

			const Const_courseUuidContent = Function_getTrimmedStringOrUndefined(Const_body.course_uuid_content)
			if (Const_hasCourseUuidContent && typeof Const_courseUuidContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid_content must be a non-empty string when provided', inf: { course_uuid_content: Const_body.course_uuid_content }, loc: Function_getFuncionName(), err: true }, 463, 'Invalid course_uuid_content')
			}

			const Const_classContent = Function_getTrimmedStringOrUndefined(Const_body.class_content)
			if (Const_hasClassContent && typeof Const_classContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'class_content must be a non-empty string when provided', inf: { class_content: Const_body.class_content }, loc: Function_getFuncionName(), err: true }, 464, 'Invalid class_content')
			}

			const Const_previsionContent = Function_getTrimmedStringOrUndefined(Const_body.prevision_content)
			if (Const_hasPrevisionContent && typeof Const_previsionContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'prevision_content must be a non-empty string when provided', inf: { prevision_content: Const_body.prevision_content }, loc: Function_getFuncionName(), err: true }, 465, 'Invalid prevision_content')
			}

			let Let_previsionContentFormatted: string | undefined
			if (typeof Const_previsionContent === 'string') {
				const Const_previsionDate = new Date(Const_previsionContent)
				if (Number.isNaN(Const_previsionDate.getTime())) {
					return Function_getResponseError({ typ: 'logical', msg: 'prevision_content must be a valid date when provided', inf: { Const_previsionContent }, loc: Function_getFuncionName(), err: true }, 466, 'Invalid prevision_content')
				}

				Let_previsionContentFormatted = Const_previsionDate.toISOString()
			}
			// /\ Valida campos opcionais e monta update parcial

			// \/ Valida college_uuid_content e course_uuid_content quando enviados
			if (typeof Const_collegeUuidContent === 'string') {
				const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['college_uuid'], {
					college_uuid: Const_collegeUuidContent
				})
				if (Function_isError(Const_collegeArray)) {
					return Function_getResponseError(Const_collegeArray, 467, 'Error validating college UUID before patch')
				}
				if (Const_collegeArray.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_content was not found', inf: { Const_collegeUuidContent }, loc: Function_getFuncionName(), err: true }, 468, 'Invalid college_uuid_content')
				}
			}

			if (typeof Const_courseUuidContent === 'string') {
				const Const_courseArray = await Function_getD1(Parameter_env, 'course', 1, 1, ['course_uuid'], {
					course_uuid: Const_courseUuidContent
				})
				if (Function_isError(Const_courseArray)) {
					return Function_getResponseError(Const_courseArray, 469, 'Error validating course UUID before patch')
				}
				if (Const_courseArray.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'course_uuid_content was not found', inf: { Const_courseUuidContent }, loc: Function_getFuncionName(), err: true }, 470, 'Invalid course_uuid_content')
				}
			}
			// /\ Valida college_uuid_content e course_uuid_content quando enviados

			// \/ Executa patch do conteudo no D1
			const Const_dataUpdate: Partial<Type_tableD1ContentGet> = {}
			if (typeof Const_nameContent === 'string') {
				Const_dataUpdate.name_content = Const_nameContent
			}
			if (typeof Const_currentPriceContent === 'number') {
				Const_dataUpdate.old_price_content = Const_content.current_price_content
				Const_dataUpdate.current_price_content = Const_currentPriceContent
			}
			if (typeof Const_collegeUuidContent === 'string') {
				Const_dataUpdate.college_uuid_content = Const_collegeUuidContent
			}
			if (typeof Const_courseUuidContent === 'string') {
				Const_dataUpdate.course_uuid_content = Const_courseUuidContent
			}
			if (typeof Const_classContent === 'string') {
				Const_dataUpdate.class_content = Const_classContent
			}
			if (typeof Let_previsionContentFormatted === 'string') {
				Const_dataUpdate.prevision_content = Let_previsionContentFormatted
			}

			const Const_contentUpdated = await Function_patchD1(Parameter_env, 'content', Const_dataUpdate, {
				content_uuid: Const_contentUuid
			}, ['*'])
			if (Function_isError(Const_contentUpdated)) {
				return Function_getResponseError(Const_contentUpdated, 471, 'Error patching student content')
			}
			// /\ Executa patch do conteudo no D1

			const Const_responseBody: Type_PatchStudentConteudoResponse = {
				content: Function_mapContentGetToObjectStudentContentResponse(Const_contentUpdated)
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error patching student content', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
