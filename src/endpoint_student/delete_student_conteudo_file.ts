import { Function_deleteContentFileFromR2, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1 } from "../function_global"


type Type_DeleteStudentConteudoFileBody = {
	content_uuid: string;
	file_role: 'preview' | 'full';
}

type Type_DeleteStudentConteudoFileResponse = {
	success: true;
	content: Type_objectStudentContentResponse;
	fileRole: Type_DeleteStudentConteudoFileBody['file_role'];
	removedFileUuidContent: string | null;
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


export class Class_DeleteStudentConteudoFile {
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

			const Const_body = Const_bodyUnknown as Partial<Type_DeleteStudentConteudoFileBody>
			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_body.content_uuid)
			const Const_fileRole = Function_getTrimmedStringOrUndefined(Const_body.file_role) as Type_DeleteStudentConteudoFileBody['file_role'] | undefined
			if (typeof Const_contentUuid !== 'string' || (Const_fileRole !== 'preview' && Const_fileRole !== 'full')) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid and file_role (preview/full) are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required body fields')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Garante que o conteudo existe e pertence ao aluno autenticado
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 455, 'Error fetching content to delete file')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content to delete file was not found', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 456, 'Content not found')
			}

			if (Const_content.student_uuid_content !== Const_studentAuthenticated.student_uuid) {
				return Function_getResponseError({ typ: 'logical', msg: 'Student cannot delete file from content of another owner', inf: { Const_contentUuid, contentOwnerUuid: Const_content.student_uuid_content, studentUuid: Const_studentAuthenticated.student_uuid }, loc: Function_getFuncionName(), err: true }, 457, 'Forbidden content file delete')
			}
			// /\ Garante que o conteudo existe e pertence ao aluno autenticado

			// \/ Remove referencia do arquivo no D1
			const Const_oldFileUuidContent = Const_fileRole === 'preview' ? Const_content.preview_file_uuid_content : Const_content.full_file_uuid_content
			const Const_contentUpdated = await Function_patchD1(Parameter_env, 'content', {
				...(Const_fileRole === 'preview' ? { preview_file_uuid_content: null } : { full_file_uuid_content: null })
			}, {
				content_uuid: Const_contentUuid
			}, ['*'])
			if (Function_isError(Const_contentUpdated)) {
				return Function_getResponseError(Const_contentUpdated, 458, 'Error updating content file UUID to null')
			}
			// /\ Remove referencia do arquivo no D1

			// \/ Deleta arquivo antigo no R2
			if (typeof Const_oldFileUuidContent === 'string' && Const_oldFileUuidContent.length > 1) {
				const Const_deletedFromR2 = await Function_deleteContentFileFromR2(Parameter_env, Const_oldFileUuidContent)
				if (Function_isError(Const_deletedFromR2)) {
					return Function_getResponseError(Const_deletedFromR2, 459, 'Error deleting content file from R2')
				}
			}
			// /\ Deleta arquivo antigo no R2

			const Const_responseBody: Type_DeleteStudentConteudoFileResponse = {
				success: true,
				content: Function_mapContentGetToObjectStudentContentResponse(Const_contentUpdated),
				fileRole: Const_fileRole,
				removedFileUuidContent: typeof Const_oldFileUuidContent === 'string' ? Const_oldFileUuidContent : null
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error deleting student content file', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
