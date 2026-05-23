import { Function_getContentFileFromR2, Function_getD1, Function_getFuncionName, Function_getResponseByR2ObjectBody, Function_getResponseError, Function_getStudentAcquiredContentUuidArray, Function_getStudentAuthenticated, Function_isError } from "../function_global"


export class Class_GetStudentConteudoFile {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Le query param obrigatorio
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_contentUuid = Const_newUrl.searchParams.get('content_uuid')?.trim()
			if (typeof Const_contentUuid !== 'string' || Const_contentUuid.length <= 1) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid query parameter is required', inf: { url: Parameter_request.url, searchParams: [...Const_newUrl.searchParams.entries()] }, loc: Function_getFuncionName(), err: true }, 452, 'Missing content_uuid')
			}
			// /\ Le query param obrigatorio

			// \/ Busca conteudo pelo UUID informado
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['content_uuid', 'student_uuid_content', 'preview_file_uuid_content', 'full_file_uuid_content', 'verified_content'], {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 453, 'Error fetching content by UUID')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content not found', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 454, 'Content not found')
			}

			if (!Const_content.verified_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content is not approved by admin', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 455, 'Content not available')
			}
			// /\ Busca conteudo pelo UUID informado

			// \/ Decide se aluno recebe arquivo completo ou preview
			const Const_acquiredContentUuidArray = await Function_getStudentAcquiredContentUuidArray(Parameter_env, Const_studentAuthenticated.student_uuid)
			if (Function_isError(Const_acquiredContentUuidArray)) {
				return Function_getResponseError(Const_acquiredContentUuidArray, 456, 'Error fetching acquired content')
			}

			const Const_isAcquiredContent = Const_acquiredContentUuidArray.includes(Const_content.content_uuid)
			const Const_isContentOwner = Const_content.student_uuid_content === Const_studentAuthenticated.student_uuid
			const Const_useFullContent = Const_isAcquiredContent || Const_isContentOwner
			const Const_fileUuid = Const_useFullContent ? Const_content.full_file_uuid_content : Const_content.preview_file_uuid_content
			if (typeof Const_fileUuid !== 'string' || Const_fileUuid.length <= 1) {
				return Function_getResponseError({ typ: 'logical', msg: 'Requested content file UUID is empty', inf: { Const_contentUuid, Const_useFullContent, Const_isAcquiredContent, Const_isContentOwner }, loc: Function_getFuncionName(), err: true }, 457, 'Content file not available')
			}
			// /\ Decide se aluno recebe arquivo completo ou preview

			// \/ Busca arquivo no R2
			const Const_r2ObjectBody = await Function_getContentFileFromR2(Parameter_env, Const_fileUuid)
			if (Function_isError(Const_r2ObjectBody)) {
				return Function_getResponseError(Const_r2ObjectBody, 458, 'Error fetching content file from R2')
			}

			if (Const_r2ObjectBody === null) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content file UUID was not found in R2', inf: { Const_contentUuid, Const_fileUuid }, loc: Function_getFuncionName(), err: true }, 459, 'Content file not found')
			}
			// /\ Busca arquivo no R2

			// \/ Retorna arquivo final
			const Const_response = Function_getResponseByR2ObjectBody(Const_r2ObjectBody)
			Const_response.headers.set('x-content-file-mode', Const_useFullContent ? 'full' : 'preview')
			return Const_response
			// /\ Retorna arquivo final
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting student content file', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
