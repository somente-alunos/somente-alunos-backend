import { Function_deleteContentFileFromR2, Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_getValidatedStudentContentFile, Function_isError, Function_patchD1, Function_postContentFileToR2 } from "../function_global"


type Type_PostAdminConteudoFileBody = {
	content_uuid: string;
	file_role: 'preview' | 'full';
	file: File;
}

type Type_PostAdminConteudoFileResponse = {
	content: Type_objectAdminContentResponse;
	fileRole: Type_PostAdminConteudoFileBody['file_role'];
	fileUuidContent: string;
}


export class Class_PostAdminConteudoFile {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Le body FormData e valida entrada obrigatoria
			let Const_formData: FormData
			try {
				Const_formData = await Parameter_request.formData()
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid form-data body', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 452, 'Invalid form-data body')
			}

			const Const_body: Partial<Type_PostAdminConteudoFileBody> = {
				content_uuid: Function_getTrimmedStringOrUndefined(Const_formData.get('content_uuid')),
				file_role: Function_getTrimmedStringOrUndefined(Const_formData.get('file_role')) as Type_PostAdminConteudoFileBody['file_role'] | undefined,
				file: Const_formData.get('file') instanceof File ? Const_formData.get('file') as File : undefined
			}
			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_body.content_uuid)
			const Const_fileRole = Const_body.file_role
			if (typeof Const_contentUuid !== 'string' || (Const_fileRole !== 'preview' && Const_fileRole !== 'full') || !(Const_body.file instanceof File)) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid, file_role (preview/full) and file are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 453, 'Missing required form-data fields')
			}

			const Const_fileValidated = Function_getValidatedStudentContentFile(Const_body.file)
			if (Function_isError(Const_fileValidated)) {
				return Function_getResponseError(Const_fileValidated, 454, 'Invalid file upload')
			}
			// /\ Le body FormData e valida entrada obrigatoria

			// \/ Garante que o conteudo existe
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
				content_uuid: Const_contentUuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 455, 'Error fetching content to upload file')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'Content to upload file was not found', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 456, 'Content not found')
			}
			// /\ Garante que o conteudo existe

			// \/ Faz upload de novo arquivo no R2
			const Const_newFileUuidContent = crypto.randomUUID()
			const Const_uploadResult = await Function_postContentFileToR2(Parameter_env, Const_newFileUuidContent, Const_fileValidated.file, Const_fileValidated.contentType, {
				content_uuid: Const_contentUuid,
				file_role: Const_fileRole,
				student_uuid: Const_content.student_uuid_content,
				admin_uuid: Const_adminAuthenticated.admin_uuid
			})
			if (Function_isError(Const_uploadResult)) {
				return Function_getResponseError(Const_uploadResult, 457, 'Error uploading content file to R2')
			}
			// /\ Faz upload de novo arquivo no R2

			// \/ Atualiza UUID do arquivo no D1
			const Const_contentUpdated = await Function_patchD1(Parameter_env, 'content', {
				...(Const_fileRole === 'preview' ? { preview_file_uuid_content: Const_newFileUuidContent } : { full_file_uuid_content: Const_newFileUuidContent })
			}, {
				content_uuid: Const_contentUuid
			}, ['*'])
			if (Function_isError(Const_contentUpdated)) {
				const Const_deleteUploadedFileResult = await Function_deleteContentFileFromR2(Parameter_env, Const_newFileUuidContent)
				if (Function_isError(Const_deleteUploadedFileResult)) {
					console.log(`> ERROR [${Const_deleteUploadedFileResult.typ}] loc: [${Const_deleteUploadedFileResult.loc}] msg: [${Const_deleteUploadedFileResult.msg}] inf: ${JSON.stringify(Const_deleteUploadedFileResult.inf)}`)
				}

				return Function_getResponseError(Const_contentUpdated, 458, 'Error updating content file UUID on D1')
			}
			// /\ Atualiza UUID do arquivo no D1

			// \/ Remove arquivo antigo do R2 (melhor esforco)
			const Const_oldFileUuidContent = Const_fileRole === 'preview' ? Const_content.preview_file_uuid_content : Const_content.full_file_uuid_content
			if (typeof Const_oldFileUuidContent === 'string' && Const_oldFileUuidContent.length > 1 && Const_oldFileUuidContent !== Const_newFileUuidContent) {
				const Const_deleteOldFileResult = await Function_deleteContentFileFromR2(Parameter_env, Const_oldFileUuidContent)
				if (Function_isError(Const_deleteOldFileResult)) {
					console.log(`> ERROR [${Const_deleteOldFileResult.typ}] loc: [${Const_deleteOldFileResult.loc}] msg: [${Const_deleteOldFileResult.msg}] inf: ${JSON.stringify(Const_deleteOldFileResult.inf)}`)
				}
			}
			// /\ Remove arquivo antigo do R2 (melhor esforco)

			const Const_responseBody: Type_PostAdminConteudoFileResponse = {
				content: Const_contentUpdated,
				fileRole: Const_fileRole,
				fileUuidContent: Const_newFileUuidContent
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error posting admin content file', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}

