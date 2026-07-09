
import { Function_deleteContentFileFromR2, Function_deleteD1, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_DeleteStudentConteudoResponse = {
	success: true;
}


export class Class_DeleteStudentConteudo {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Valida query param obrigatorio
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_contentUuid = Const_newUrl.searchParams.get('content_uuid')?.trim()
			if (typeof Const_contentUuid !== 'string' || Const_contentUuid.length <= 1) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid query parameter is required', inf: { url: Parameter_request.url, searchParams: [...Const_newUrl.searchParams.entries()] }, loc: Function_getFuncionName(), err: true }, 452, 'Missing content_uuid')
			}
			// /\ Valida query param obrigatorio

			// \/ Garante que o conteudo existe e pertence ao aluno autenticado
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['content_uuid', 'student_uuid_content', 'preview_file_uuid_content', 'full_file_uuid_content'], {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 453, 'Error fetching content to delete')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content to delete was not found', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 454, 'Content not found')
			}

			if (Const_content.student_uuid_content !== Const_studentAuthenticated.student_uuid) {
				return Function_getResponseError({ typ: 'logical', msg: 'Student cannot delete content from another owner', inf: { Const_contentUuid, contentOwnerUuid: Const_content.student_uuid_content, studentUuid: Const_studentAuthenticated.student_uuid }, loc: Function_getFuncionName(), err: true }, 455, 'Forbidden content delete')
			}
			// /\ Garante que o conteudo existe e pertence ao aluno autenticado

			// \/ Deleta conteudo do D1
			const Const_contentDeleted = await Function_deleteD1(Parameter_env, 'content', {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentDeleted)) {
				return Function_getResponseError(Const_contentDeleted, 456, 'Error deleting student content')
			}
			// /\ Deleta conteudo do D1

			// \/ Remove arquivos de preview/completo no R2 (melhor esforco)
			const Const_fileUuidArray = [Const_content.preview_file_uuid_content, Const_content.full_file_uuid_content]
			for (const Const_fileUuid of Const_fileUuidArray) {
				if (typeof Const_fileUuid === 'string' && Const_fileUuid.length > 1) {
					const Const_deleteFileResult = await Function_deleteContentFileFromR2(Parameter_env, Const_fileUuid)
					if (Function_isError(Const_deleteFileResult)) {
						console.log(`> ERROR [${Const_deleteFileResult.typ}] loc: [${Const_deleteFileResult.loc}] msg: [${Const_deleteFileResult.msg}] inf: ${JSON.stringify(Const_deleteFileResult.inf)}`)
					}
				}
			}
			// /\ Remove arquivos de preview/completo no R2 (melhor esforco)

			const Const_responseBody: Type_DeleteStudentConteudoResponse = {
				success: true
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error deleting student content', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
