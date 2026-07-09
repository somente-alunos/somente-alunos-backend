
import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_GetStudentOrAdminFaculdadeTodasResponse = {
	collegeArray: Array<Type_objectStudentCollegeResponse>;
}


export class Class_GetStudentOrAdminFaculdadeTodas {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticatedStudent = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, false)
			const Const_studentAuthenticatedAdmin = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_studentAuthenticatedStudent) && Function_isError(Const_studentAuthenticatedAdmin)) {
				return Function_getResponseError(Const_studentAuthenticatedStudent, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Busca todas as faculdades
			const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 999999, 1, ['college_uuid', 'name_college', 'svg_college'])
			if (Function_isError(Const_collegeArray)) {
				return Function_getResponseError(Const_collegeArray, 452, 'Error fetching all colleges')
			}
			// /\ Busca todas as faculdades

			const Const_responseBody: Type_GetStudentOrAdminFaculdadeTodasResponse = {
				collegeArray: Const_collegeArray
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting all colleges', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
