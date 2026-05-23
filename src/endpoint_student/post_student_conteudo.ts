import { Function_deleteContentFileFromR2, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_getTrimmedStringOrUndefined, Function_getValidatedStudentContentFile, Function_isError, Function_postContentFileToR2, Function_postD1 } from "../function_global"


type Type_PostStudentConteudoBody = {
	name_content: string;
	current_price_content: number | string;
	college_uuid_content: string;
	course_uuid_content: string;
	class_content?: string;
	prevision_content?: string;
	preview_file_content?: File;
	full_file_content?: File;
}

type Type_PostStudentConteudoResponse = {
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

async function Function_deleteUploadedFileUuidArrayByBestEffort(Parameter_env: Env, Parameter_fileUuidArray: Array<string>): Promise<void> {
	for (const Const_fileUuid of Parameter_fileUuidArray) {
		const Const_deleteResult = await Function_deleteContentFileFromR2(Parameter_env, Const_fileUuid)
		if (Function_isError(Const_deleteResult)) {
			console.log(`> ERROR [${Const_deleteResult.typ}] loc: [${Const_deleteResult.loc}] msg: [${Const_deleteResult.msg}] inf: ${JSON.stringify(Const_deleteResult.inf)}`)
		}
	}
}


export class Class_PostStudentConteudo {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Le body FormData com informacoes e arquivos
			let Const_formData: FormData
			try {
				Const_formData = await Parameter_request.formData()
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid form-data body', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 452, 'Invalid form-data body')
			}

			const Const_body: Partial<Type_PostStudentConteudoBody> = {
				name_content: Function_getTrimmedStringOrUndefined(Const_formData.get('name_content')),
				current_price_content: Function_getTrimmedStringOrUndefined(Const_formData.get('current_price_content')),
				college_uuid_content: Function_getTrimmedStringOrUndefined(Const_formData.get('college_uuid_content')),
				course_uuid_content: Function_getTrimmedStringOrUndefined(Const_formData.get('course_uuid_content')),
				class_content: Function_getTrimmedStringOrUndefined(Const_formData.get('class_content')),
				prevision_content: Function_getTrimmedStringOrUndefined(Const_formData.get('prevision_content')),
				preview_file_content: Const_formData.get('preview_file_content') instanceof File ? Const_formData.get('preview_file_content') as File : undefined,
				full_file_content: Const_formData.get('full_file_content') instanceof File ? Const_formData.get('full_file_content') as File : undefined
			}

			const Const_nameContent = Function_getTrimmedStringOrUndefined(Const_body.name_content)
			const Const_currentPriceContent = Function_getNumberOrUndefined(Const_body.current_price_content)
			const Const_collegeUuidContent = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_content)
			const Const_courseUuidContent = Function_getTrimmedStringOrUndefined(Const_body.course_uuid_content)
			const Const_classContent = Function_getTrimmedStringOrUndefined(Const_body.class_content)
			const Const_previsionContent = Function_getTrimmedStringOrUndefined(Const_body.prevision_content)
			if (typeof Const_nameContent !== 'string' || typeof Const_currentPriceContent !== 'number' || typeof Const_collegeUuidContent !== 'string' || typeof Const_courseUuidContent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_content, current_price_content, college_uuid_content and course_uuid_content are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 453, 'Missing required body fields')
			}

			if (!(Const_currentPriceContent > 0)) {
				return Function_getResponseError({ typ: 'logical', msg: 'current_price_content must be greater than zero', inf: { Const_currentPriceContent }, loc: Function_getFuncionName(), err: true }, 454, 'Invalid current_price_content')
			}

			let Let_previsionContentFormatted: string | undefined
			if (typeof Const_previsionContent === 'string') {
				const Const_previsionDate = new Date(Const_previsionContent)
				if (Number.isNaN(Const_previsionDate.getTime())) {
					return Function_getResponseError({ typ: 'logical', msg: 'prevision_content must be a valid date', inf: { Const_previsionContent }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid prevision_content')
				}

				Let_previsionContentFormatted = Const_previsionDate.toISOString()
			}
			// /\ Le body FormData com informacoes e arquivos

			// \/ Valida college_uuid_content e course_uuid_content no D1
			const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['college_uuid'], {
				college_uuid: Const_collegeUuidContent
			})
			if (Function_isError(Const_collegeArray)) {
				return Function_getResponseError(Const_collegeArray, 456, 'Error validating college UUID')
			}
			if (Const_collegeArray.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_content was not found', inf: { Const_collegeUuidContent }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid college_uuid_content')
			}

			const Const_courseArray = await Function_getD1(Parameter_env, 'course', 1, 1, ['course_uuid'], {
				course_uuid: Const_courseUuidContent
			})
			if (Function_isError(Const_courseArray)) {
				return Function_getResponseError(Const_courseArray, 458, 'Error validating course UUID')
			}
			if (Const_courseArray.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid_content was not found', inf: { Const_courseUuidContent }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid course_uuid_content')
			}
			// /\ Valida college_uuid_content e course_uuid_content no D1

			// \/ Valida arquivos opcionais de preview e completo
			let Let_previewFileValidated: { file: File; contentType: 'application/pdf' | 'text/html'; fileExtension: 'pdf' | 'html'; } | undefined
			let Let_fullFileValidated: { file: File; contentType: 'application/pdf' | 'text/html'; fileExtension: 'pdf' | 'html'; } | undefined
			if (Const_body.preview_file_content instanceof File) {
				const Const_previewFileValidated = Function_getValidatedStudentContentFile(Const_body.preview_file_content)
				if (Function_isError(Const_previewFileValidated)) {
					return Function_getResponseError(Const_previewFileValidated, 460, 'Invalid preview file upload')
				}

				Let_previewFileValidated = Const_previewFileValidated
			}
			if (Const_body.full_file_content instanceof File) {
				const Const_fullFileValidated = Function_getValidatedStudentContentFile(Const_body.full_file_content)
				if (Function_isError(Const_fullFileValidated)) {
					return Function_getResponseError(Const_fullFileValidated, 461, 'Invalid full file upload')
				}

				Let_fullFileValidated = Const_fullFileValidated
			}
			// /\ Valida arquivos opcionais de preview e completo

			// \/ Faz upload opcional dos arquivos para o R2
			const Const_contentUuid = crypto.randomUUID()
			const Const_uploadedFileUuidArray: Array<string> = []
			let Let_previewFileUuidContent: string | undefined
			let Let_fullFileUuidContent: string | undefined
			if (Let_previewFileValidated) {
				Let_previewFileUuidContent = crypto.randomUUID()
				const Const_previewUploadResult = await Function_postContentFileToR2(Parameter_env, Let_previewFileUuidContent, Let_previewFileValidated.file, Let_previewFileValidated.contentType, {
					content_uuid: Const_contentUuid,
					file_role: 'preview',
					student_uuid: Const_studentAuthenticated.student_uuid
				})
				if (Function_isError(Const_previewUploadResult)) {
					return Function_getResponseError(Const_previewUploadResult, 462, 'Error uploading preview file to R2')
				}

				Const_uploadedFileUuidArray.push(Let_previewFileUuidContent)
			}

			if (Let_fullFileValidated) {
				Let_fullFileUuidContent = crypto.randomUUID()
				const Const_fullUploadResult = await Function_postContentFileToR2(Parameter_env, Let_fullFileUuidContent, Let_fullFileValidated.file, Let_fullFileValidated.contentType, {
					content_uuid: Const_contentUuid,
					file_role: 'full',
					student_uuid: Const_studentAuthenticated.student_uuid
				})
				if (Function_isError(Const_fullUploadResult)) {
					await Function_deleteUploadedFileUuidArrayByBestEffort(Parameter_env, Const_uploadedFileUuidArray)
					return Function_getResponseError(Const_fullUploadResult, 463, 'Error uploading full file to R2')
				}

				Const_uploadedFileUuidArray.push(Let_fullFileUuidContent)
			}
			// /\ Faz upload opcional dos arquivos para o R2

			// \/ Cria conteudo do aluno no D1
			const Const_contentCreated = await Function_postD1(Parameter_env, 'content', {
				content_uuid: Const_contentUuid,
				name_content: Const_nameContent,
				student_uuid_content: Const_studentAuthenticated.student_uuid,
				current_price_content: Const_currentPriceContent,
				preview_file_uuid_content: Let_previewFileUuidContent,
				full_file_uuid_content: Let_fullFileUuidContent,
				college_uuid_content: Const_collegeUuidContent,
				course_uuid_content: Const_courseUuidContent,
				class_content: Const_classContent,
				prevision_content: Let_previsionContentFormatted,
				verified_content: 0
			}, ['*'])
			if (Function_isError(Const_contentCreated)) {
				await Function_deleteUploadedFileUuidArrayByBestEffort(Parameter_env, Const_uploadedFileUuidArray)
				return Function_getResponseError(Const_contentCreated, 464, 'Error creating student content')
			}
			// /\ Cria conteudo do aluno no D1

			const Const_responseBody: Type_PostStudentConteudoResponse = {
				content: Function_mapContentGetToObjectStudentContentResponse(Const_contentCreated)
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error creating student content', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
