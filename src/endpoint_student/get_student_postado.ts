
import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_GetStudentPostadoResponse = {
	contentArray: Array<Type_objectStudentContentResponse>;
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


export class Class_GetStudentPostado {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Busca conteudos postados pelo aluno autenticado
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 999999, 1, ['*'], {
				student_uuid_content: Const_studentAuthenticated.student_uuid
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 452, 'Error fetching posted content from student')
			}
			// /\ Busca conteudos postados pelo aluno autenticado

			const Const_contentResponseArray: Array<Type_objectStudentContentResponse> = []
			for (const Const_contentSingle of Const_contentArray) {
				Const_contentResponseArray.push(Function_mapContentGetToObjectStudentContentResponse(Const_contentSingle))
			}

			const Const_responseBody: Type_GetStudentPostadoResponse = {
				contentArray: Const_contentResponseArray
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting posted content from student', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
