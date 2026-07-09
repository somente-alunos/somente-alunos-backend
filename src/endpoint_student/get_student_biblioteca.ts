
import { Function_getContentByCollegeCourseClass, Function_getFuncionName, Function_getResponseError, Function_getStudentAcquiredContentUuidArray, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_objectStudentContentBibliotecaResponse = Type_objectStudentContentResponse & {
	isAcquiredContent: boolean;
}

type Type_GetStudentBibliotecaResponse = {
	contentArray: Array<Type_objectStudentContentBibliotecaResponse>;
	buyer?: true; // ausente quando o aluno nunca comprou nenhum conteudo
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


export class Class_GetStudentBiblioteca {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Le query params obrigatorios
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_collegeUuidContent = Const_newUrl.searchParams.get('college_uuid_content')?.trim()
			const Const_courseUuidContent = Const_newUrl.searchParams.get('course_uuid_content')?.trim()
			if (typeof Const_collegeUuidContent !== 'string' || Const_collegeUuidContent.length <= 1 || typeof Const_courseUuidContent !== 'string' || Const_courseUuidContent.length <= 1) {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_content and course_uuid_content query parameters are required', inf: { url: Parameter_request.url, searchParams: [...Const_newUrl.searchParams.entries()] }, loc: Function_getFuncionName(), err: true }, 452, 'Missing required query params')
			}
			// /\ Le query params obrigatorios

			// \/ Busca conteudos da biblioteca por faculdade/curso/turma
			const Const_contentArray = await Function_getContentByCollegeCourseClass(
				Parameter_env,
				Const_collegeUuidContent,
				Const_courseUuidContent,
				Const_studentAuthenticated.class_student
			)
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 456, 'Error fetching content library')
			}
			// /\ Busca conteudos da biblioteca por faculdade/curso/turma

			// \/ Marca conteudos adquiridos pelo aluno
			const Const_acquiredContentUuidArray = await Function_getStudentAcquiredContentUuidArray(Parameter_env, Const_studentAuthenticated.student_uuid)
			if (Function_isError(Const_acquiredContentUuidArray)) {
				return Function_getResponseError(Const_acquiredContentUuidArray, 457, 'Error fetching acquired content')
			}

			const Const_setAcquiredContentUuid = new Set<string>(Const_acquiredContentUuidArray)
			const Const_contentResponseArray: Array<Type_objectStudentContentBibliotecaResponse> = []
			for (const Const_contentSingle of Const_contentArray) {
				const Const_contentMapped = Function_mapContentGetToObjectStudentContentResponse(Const_contentSingle)
				Const_contentResponseArray.push({
					...Const_contentMapped,
					isAcquiredContent: Const_studentAuthenticated.isAllContentUnlocked || Const_setAcquiredContentUuid.has(Const_contentSingle.content_uuid)
				})
			}
			// /\ Marca conteudos adquiridos pelo aluno

			const Const_responseBody: Type_GetStudentBibliotecaResponse = {
				contentArray: Const_contentResponseArray
			}

			// \/ Sinaliza se o aluno ja comprou pelo menos 1 conteudo alguma vez (chave ausente caso nunca tenha comprado)
			if (Const_acquiredContentUuidArray.length > 0) {
				Const_responseBody.buyer = true
			}
			// /\ Sinaliza se o aluno ja comprou pelo menos 1 conteudo alguma vez

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting student library', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
