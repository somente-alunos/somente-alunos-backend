
import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_GetStudentOrAdminCursoEspecificoResponse = {
	courseArray: Array<Type_objectStudentCourseResponse>;
}


export class Class_GetStudentCursoSpecific {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Valida query param obrigatorio
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_collegeUuidCourse = Const_newUrl.searchParams.get('college_uuid_course')?.trim()
			if (typeof Const_collegeUuidCourse !== 'string' || Const_collegeUuidCourse.length <= 1) {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_course query parameter is required', inf: { url: Parameter_request.url, searchParams: [...Const_newUrl.searchParams.entries()] }, loc: Function_getFuncionName(), err: true }, 452, 'Missing college_uuid_course')
			}
			// /\ Valida query param obrigatorio

			// \/ Busca cursos da faculdade informada
			const Const_courseArray = await Function_getD1(Parameter_env, 'course', 999999, 1, ['course_uuid', 'name_course', 'svg_course', 'college_uuid_course'], {
				college_uuid_course: Const_collegeUuidCourse
			})
			if (Function_isError(Const_courseArray)) {
				return Function_getResponseError(Const_courseArray, 453, 'Error fetching courses by college')
			}
			// /\ Busca cursos da faculdade informada

			const Const_responseBody: Type_GetStudentOrAdminCursoEspecificoResponse = {
				courseArray: Const_courseArray
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting specific courses', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
