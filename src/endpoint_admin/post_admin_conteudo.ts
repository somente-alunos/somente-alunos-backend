import { Function_deleteContentFileFromR2, Function_deleteD1, Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_getValidatedStudentContentFile, Function_isError, Function_postContentFileToR2, Function_postD1 } from "../function_global"


type Type_PostAdminConteudoBody = {
	content_uuid?: string;
	name_content: string;
	student_uuid_content: string;
	old_price_content?: number | string | null;
	current_price_content: number | string;
	preview_file_uuid_content?: string | null;
	full_file_uuid_content?: string | null;
	college_uuid_content: string;
	course_uuid_content: string;
	class_content?: string | null;
	prevision_content?: string | null;
	verified_content?: number | string | boolean;
	preview_file_content?: File;
	full_file_content?: File;
}

type Type_PostAdminConteudoResponse = {
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

function Function_getNullableStringOrUndefined(Parameter_value: unknown): string | null | undefined {
	if (Parameter_value === null) {
		return null
	}

	const Const_value = Function_getTrimmedStringOrUndefined(Parameter_value)
	if (typeof Const_value !== 'string') {
		return undefined
	}

	if (Const_value.toLowerCase() === 'null') {
		return null
	}

	return Const_value
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

async function Function_deleteUploadedFileUuidArrayByBestEffort(Parameter_env: Env, Parameter_fileUuidArray: Array<string>): Promise<void> {
	for (const Const_fileUuid of Parameter_fileUuidArray) {
		const Const_deleteResult = await Function_deleteContentFileFromR2(Parameter_env, Const_fileUuid)
		if (Function_isError(Const_deleteResult)) {
			console.log(`> ERROR [${Const_deleteResult.typ}] loc: [${Const_deleteResult.loc}] msg: [${Const_deleteResult.msg}] inf: ${JSON.stringify(Const_deleteResult.inf)}`)
		}
	}
}


export class Class_PostAdminConteudo {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Le body FormData
			let Const_formData: FormData
			try {
				Const_formData = await Parameter_request.formData()
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid form-data body', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 452, 'Invalid form-data body')
			}

			if (Const_formData.has('content_id') || Const_formData.has('content_created') || Const_formData.has('content_update')) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_id, content_created and content_update cannot be provided', inf: { has_content_id: Const_formData.has('content_id'), has_content_created: Const_formData.has('content_created'), has_content_update: Const_formData.has('content_update') }, loc: Function_getFuncionName(), err: true }, 453, 'Forbidden fields in body')
			}

			const Const_body: Partial<Type_PostAdminConteudoBody> = {
				content_uuid: Function_getTrimmedStringOrUndefined(Const_formData.get('content_uuid')),
				name_content: Function_getTrimmedStringOrUndefined(Const_formData.get('name_content')),
				student_uuid_content: Function_getTrimmedStringOrUndefined(Const_formData.get('student_uuid_content')),
				current_price_content: Function_getTrimmedStringOrUndefined(Const_formData.get('current_price_content')),
				preview_file_uuid_content: Function_getNullableStringOrUndefined(Const_formData.get('preview_file_uuid_content')),
				full_file_uuid_content: Function_getNullableStringOrUndefined(Const_formData.get('full_file_uuid_content')),
				college_uuid_content: Function_getTrimmedStringOrUndefined(Const_formData.get('college_uuid_content')),
				course_uuid_content: Function_getTrimmedStringOrUndefined(Const_formData.get('course_uuid_content')),
				class_content: Function_getNullableStringOrUndefined(Const_formData.get('class_content')),
				prevision_content: Function_getNullableStringOrUndefined(Const_formData.get('prevision_content')),
				preview_file_content: Const_formData.get('preview_file_content') instanceof File ? Const_formData.get('preview_file_content') as File : undefined,
				full_file_content: Const_formData.get('full_file_content') instanceof File ? Const_formData.get('full_file_content') as File : undefined
			}
			// /\ Le body FormData

			// \/ Valida campos obrigatorios e opcionais
			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_body.content_uuid)
			const Const_nameContent = Function_getTrimmedStringOrUndefined(Const_body.name_content)
			const Const_studentUuidContent = Function_getTrimmedStringOrUndefined(Const_body.student_uuid_content)
			const Const_currentPriceContent = Function_getNumberOrUndefined(Const_body.current_price_content)
			const Const_collegeUuidContent = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_content)
			const Const_courseUuidContent = Function_getTrimmedStringOrUndefined(Const_body.course_uuid_content)
			if (typeof Const_nameContent !== 'string' || typeof Const_studentUuidContent !== 'string' || typeof Const_currentPriceContent !== 'number' || typeof Const_collegeUuidContent !== 'string' || typeof Const_courseUuidContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_content, student_uuid_content, current_price_content, college_uuid_content and course_uuid_content are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required form-data fields')
			}

			const Const_hasOldPriceContent = Const_formData.has('old_price_content')
			let Let_oldPriceContent: number | null | undefined
			if (Const_hasOldPriceContent) {
				const Const_oldPriceRaw = Const_formData.get('old_price_content')
				if (Const_oldPriceRaw === null || (typeof Const_oldPriceRaw === 'string' && Const_oldPriceRaw.trim().toLowerCase() === 'null')) {
					Let_oldPriceContent = null
				}
				else {
					const Const_oldPriceContent = Function_getNumberOrUndefined(Const_oldPriceRaw)
					if (typeof Const_oldPriceContent !== 'number') {
						return Function_getResponseError({ typ: 'logical', msg: 'old_price_content must be valid number or null when provided', inf: { old_price_content: Const_oldPriceRaw }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid old_price_content')
					}

					Let_oldPriceContent = Const_oldPriceContent
				}
			}

			const Const_verifiedContentRaw = Const_formData.get('verified_content')
			const Const_verifiedContent = Function_getVerifiedContentOrUndefined(Const_verifiedContentRaw)
			if (Const_formData.has('verified_content') && (Const_verifiedContent !== 0 && Const_verifiedContent !== 1)) {
				return Function_getResponseError({ typ: 'logical', msg: 'verified_content must be 0/1/true/false when provided', inf: { verified_content: Const_verifiedContentRaw }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid verified_content')
			}

			if (Const_formData.has('preview_file_uuid_content') && Const_body.preview_file_uuid_content === undefined) {
				return Function_getResponseError({ typ: 'logical', msg: 'preview_file_uuid_content must be non-empty string or null when provided', inf: { preview_file_uuid_content: Const_formData.get('preview_file_uuid_content') }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid preview_file_uuid_content')
			}
			if (Const_formData.has('full_file_uuid_content') && Const_body.full_file_uuid_content === undefined) {
				return Function_getResponseError({ typ: 'logical', msg: 'full_file_uuid_content must be non-empty string or null when provided', inf: { full_file_uuid_content: Const_formData.get('full_file_uuid_content') }, loc: Function_getFuncionName(), err: true }, 458, 'Invalid full_file_uuid_content')
			}
			if (Const_formData.has('class_content') && Const_body.class_content === undefined) {
				return Function_getResponseError({ typ: 'logical', msg: 'class_content must be non-empty string or null when provided', inf: { class_content: Const_formData.get('class_content') }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid class_content')
			}
			if (Const_formData.has('prevision_content') && Const_body.prevision_content === undefined) {
				return Function_getResponseError({ typ: 'logical', msg: 'prevision_content must be non-empty string or null when provided', inf: { prevision_content: Const_formData.get('prevision_content') }, loc: Function_getFuncionName(), err: true }, 460, 'Invalid prevision_content')
			}

			if (Const_body.preview_file_content instanceof File && Const_formData.has('preview_file_uuid_content')) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot provide preview_file_content and preview_file_uuid_content together', inf: { has_preview_file_content: true, has_preview_file_uuid_content: true }, loc: Function_getFuncionName(), err: true }, 461, 'Conflicting preview file fields')
			}
			if (Const_body.full_file_content instanceof File && Const_formData.has('full_file_uuid_content')) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot provide full_file_content and full_file_uuid_content together', inf: { has_full_file_content: true, has_full_file_uuid_content: true }, loc: Function_getFuncionName(), err: true }, 462, 'Conflicting full file fields')
			}
			// /\ Valida campos obrigatorios e opcionais

			// \/ Valida arquivos opcionais
			let Let_previewFileValidated: { file: File; contentType: 'application/pdf' | 'text/html'; fileExtension: 'pdf' | 'html'; } | undefined
			let Let_fullFileValidated: { file: File; contentType: 'application/pdf' | 'text/html'; fileExtension: 'pdf' | 'html'; } | undefined
			if (Const_body.preview_file_content instanceof File) {
				const Const_previewFileValidated = Function_getValidatedStudentContentFile(Const_body.preview_file_content)
				if (Function_isError(Const_previewFileValidated)) {
					return Function_getResponseError(Const_previewFileValidated, 463, 'Invalid preview file upload')
				}

				Let_previewFileValidated = Const_previewFileValidated
			}
			if (Const_body.full_file_content instanceof File) {
				const Const_fullFileValidated = Function_getValidatedStudentContentFile(Const_body.full_file_content)
				if (Function_isError(Const_fullFileValidated)) {
					return Function_getResponseError(Const_fullFileValidated, 464, 'Invalid full file upload')
				}

				Let_fullFileValidated = Const_fullFileValidated
			}
			// /\ Valida arquivos opcionais

			// \/ Faz upload opcional dos arquivos para o R2
			const Const_contentUuidFinal = Const_contentUuid || crypto.randomUUID()
			const Const_uploadedFileUuidArray: Array<string> = []
			let Let_previewFileUuidContent = Const_body.preview_file_uuid_content
			let Let_fullFileUuidContent = Const_body.full_file_uuid_content
			if (Let_previewFileValidated) {
				Let_previewFileUuidContent = crypto.randomUUID()
				const Const_previewUploadResult = await Function_postContentFileToR2(Parameter_env, Let_previewFileUuidContent, Let_previewFileValidated.file, Let_previewFileValidated.contentType, {
					content_uuid: Const_contentUuidFinal,
					file_role: 'preview',
					student_uuid: Const_studentUuidContent
				})
				if (Function_isError(Const_previewUploadResult)) {
					return Function_getResponseError(Const_previewUploadResult, 465, 'Error uploading preview file to R2')
				}

				Const_uploadedFileUuidArray.push(Let_previewFileUuidContent)
			}

			if (Let_fullFileValidated) {
				Let_fullFileUuidContent = crypto.randomUUID()
				const Const_fullUploadResult = await Function_postContentFileToR2(Parameter_env, Let_fullFileUuidContent, Let_fullFileValidated.file, Let_fullFileValidated.contentType, {
					content_uuid: Const_contentUuidFinal,
					file_role: 'full',
					student_uuid: Const_studentUuidContent
				})
				if (Function_isError(Const_fullUploadResult)) {
					await Function_deleteUploadedFileUuidArrayByBestEffort(Parameter_env, Const_uploadedFileUuidArray)
					return Function_getResponseError(Const_fullUploadResult, 466, 'Error uploading full file to R2')
				}

				Const_uploadedFileUuidArray.push(Let_fullFileUuidContent)
			}
			// /\ Faz upload opcional dos arquivos para o R2

			// \/ Cria conteudo no D1
			let Let_contentCreated = await Function_postD1(Parameter_env, 'content', {
				content_uuid: Const_contentUuidFinal,
				name_content: Const_nameContent,
				student_uuid_content: Const_studentUuidContent,
				old_price_content: Let_oldPriceContent,
				current_price_content: Const_currentPriceContent,
				preview_file_uuid_content: Let_previewFileUuidContent,
				full_file_uuid_content: Let_fullFileUuidContent,
				college_uuid_content: Const_collegeUuidContent,
				course_uuid_content: Const_courseUuidContent,
				class_content: Const_body.class_content,
				prevision_content: Const_body.prevision_content,
				verified_content: Const_verifiedContent
			}, ['*'])

			// Se recebeu erro de UNIQUE constraint, deleta o existente e tenta novamente
			if (Function_isError(Let_contentCreated)) {
				if (Let_contentCreated.typ === 'catch') {
					// Busca o conteúdo existente
					const Const_existingContentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], { content_uuid: Const_contentUuidFinal })
					if (!Function_isError(Const_existingContentArray) && Const_existingContentArray.length > 0) {
						const Const_existingContent = Const_existingContentArray[0]

						// Deleta arquivos do R2 se existirem
						if (Const_existingContent.preview_file_uuid_content) {
							const Const_deletePreviewResult = await Function_deleteContentFileFromR2(Parameter_env, Const_existingContent.preview_file_uuid_content)
							if (Function_isError(Const_deletePreviewResult)) {
								console.log(`> WARNING [${Const_deletePreviewResult.typ}] Failed to delete preview file: ${Const_existingContent.preview_file_uuid_content}`)
							}
						}
						if (Const_existingContent.full_file_uuid_content) {
							const Const_deleteFullResult = await Function_deleteContentFileFromR2(Parameter_env, Const_existingContent.full_file_uuid_content)
							if (Function_isError(Const_deleteFullResult)) {
								console.log(`> WARNING [${Const_deleteFullResult.typ}] Failed to delete full file: ${Const_existingContent.full_file_uuid_content}`)
							}
						}

						// Deleta conteúdo do D1
						const Const_deleteContentResult = await Function_deleteD1(Parameter_env, 'content', { content_uuid: Const_contentUuidFinal })
						if (!Function_isError(Const_deleteContentResult)) {
							// Tenta inserir novamente
							Let_contentCreated = await Function_postD1(Parameter_env, 'content', {
								content_uuid: Const_contentUuidFinal,
								name_content: Const_nameContent,
								student_uuid_content: Const_studentUuidContent,
								old_price_content: Let_oldPriceContent,
								current_price_content: Const_currentPriceContent,
								preview_file_uuid_content: Let_previewFileUuidContent,
								full_file_uuid_content: Let_fullFileUuidContent,
								college_uuid_content: Const_collegeUuidContent,
								course_uuid_content: Const_courseUuidContent,
								class_content: Const_body.class_content,
								prevision_content: Const_body.prevision_content,
								verified_content: Const_verifiedContent
							}, ['*'])
						}
					}
				}
			}

			if (Function_isError(Let_contentCreated)) {
				await Function_deleteUploadedFileUuidArrayByBestEffort(Parameter_env, Const_uploadedFileUuidArray)
				return Function_getResponseError(Let_contentCreated, 467, 'Error creating admin content')
			}
			// /\ Cria conteudo no D1

			const Const_responseBody: Type_PostAdminConteudoResponse = {
				content: Let_contentCreated
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 201,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error creating admin content', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
