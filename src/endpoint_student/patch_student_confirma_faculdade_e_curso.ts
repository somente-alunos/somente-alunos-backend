
import { Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_getStudentAuthenticated, Function_isError, Function_patchD1 } from "../function_global"


type Type_PatchStudentConfirmaFaculdadeECursoBody = {
	college_uuid_student: string;
	course_uuid_student: string;
}

type Type_PatchStudentConfirmaFaculdadeECursoResponse = { success: true; }


export class Class_PatchStudentConfirmaFaculdadeECurso {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

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

			const Const_body = Const_bodyUnknown as Partial<Type_PatchStudentConfirmaFaculdadeECursoBody>
			const Const_collegeUuidStudent = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_student)
			const Const_courseUuidStudent = Function_getTrimmedStringOrUndefined(Const_body.course_uuid_student)

			if (typeof Const_collegeUuidStudent !== 'string' || typeof Const_courseUuidStudent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_student and course_uuid_student are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required body fields')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Atualiza aluno com confirmacao da faculdade/curso
			const Const_studentUpdated = await Function_patchD1(Parameter_env, 'student', {
				college_uuid_student: Const_collegeUuidStudent,
				course_uuid_student: Const_courseUuidStudent,
				is_suggested_information_student: 0
			}, {
				student_uuid: Const_studentAuthenticated.student_uuid
			}, ['student_uuid'])
			if (Function_isError(Const_studentUpdated)) {
				return Function_getResponseError(Const_studentUpdated, 455, 'Error updating student college and course')
			}
			// /\ Atualiza aluno com confirmacao da faculdade/curso

			const Const_responseBody: Type_PatchStudentConfirmaFaculdadeECursoResponse = {
				success: true
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error updating student college and course', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
