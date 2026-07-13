
import { Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_GetStudentSessaoResponse = {
	student: {
		student_uuid: Type_tableD1StudentGet['student_uuid'];
		college_uuid_student: Type_tableD1StudentGet['college_uuid_student'];
		course_uuid_student: Type_tableD1StudentGet['course_uuid_student'];
		is_suggested_information_student: Type_tableD1StudentGet['is_suggested_information_student'];
		isAllContentUnlocked: boolean;
	};
}


export class Class_GetStudentSessao {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT e ja le a linha atual do D1
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT e ja le a linha atual do D1

			// Faculdade-e-curso do D1 e a fonte da verdade: o front usa isso para corrigir a sessao
			// que ficou em cache no localStorage quando o suporte altera o aluno pelo painel admin.
			const Const_responseBody: Type_GetStudentSessaoResponse = {
				student: {
					student_uuid: Const_studentAuthenticated.student_uuid,
					college_uuid_student: Const_studentAuthenticated.college_uuid_student,
					course_uuid_student: Const_studentAuthenticated.course_uuid_student,
					is_suggested_information_student: Const_studentAuthenticated.is_suggested_information_student,
					isAllContentUnlocked: Const_studentAuthenticated.isAllContentUnlocked === true
				}
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'cache-control': 'no-store'
				}
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting student session', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
