import { Function_deleteContentFileFromR2, Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1 } from "../function_global"


type Type_DeleteAdminConteudoFileBody = {
	content_uuid: string;
	file_role: 'preview' | 'full';
}

type Type_DeleteAdminConteudoFileResponse = {
	success: true;
	content: Type_objectAdminContentResponse;
	fileRole: Type_DeleteAdminConteudoFileBody['file_role'];
	removedFileUuidContent: string | null;
}


export class Class_DeleteAdminConteudoFile {
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

			const Const_body = Const_bodyUnknown as Partial<Type_DeleteAdminConteudoFileBody>
			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_body.content_uuid)
			const Const_fileRole = Function_getTrimmedStringOrUndefined(Const_body.file_role) as Type_DeleteAdminConteudoFileBody['file_role'] | undefined
			if (typeof Const_contentUuid !== 'string' || (Const_fileRole !== 'preview' && Const_fileRole !== 'full')) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid and file_role (preview/full) are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required body fields')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Garante que o conteudo existe
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
			// /\ Garante que o conteudo existe

			// \/ Remove referencia do arquivo no D1
			const Const_oldFileUuidContent = Const_fileRole === 'preview' ? Const_content.preview_file_uuid_content : Const_content.full_file_uuid_content
			const Const_contentUpdated = await Function_patchD1(Parameter_env, 'content', {
				...(Const_fileRole === 'preview' ? { preview_file_uuid_content: null } : { full_file_uuid_content: null })
			}, {
				content_uuid: Const_contentUuid
			}, ['*'])
			if (Function_isError(Const_contentUpdated)) {
				return Function_getResponseError(Const_contentUpdated, 457, 'Error updating content file UUID to null')
			}
			// /\ Remove referencia do arquivo no D1

			// \/ Deleta arquivo antigo no R2
			if (typeof Const_oldFileUuidContent === 'string' && Const_oldFileUuidContent.length > 1) {
				const Const_deletedFromR2 = await Function_deleteContentFileFromR2(Parameter_env, Const_oldFileUuidContent)
				if (Function_isError(Const_deletedFromR2)) {
					return Function_getResponseError(Const_deletedFromR2, 458, 'Error deleting content file from R2')
				}
			}
			// /\ Deleta arquivo antigo no R2

			const Const_responseBody: Type_DeleteAdminConteudoFileResponse = {
				success: true,
				content: Const_contentUpdated,
				fileRole: Const_fileRole,
				removedFileUuidContent: typeof Const_oldFileUuidContent === 'string' ? Const_oldFileUuidContent : null
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error deleting admin content file', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}

