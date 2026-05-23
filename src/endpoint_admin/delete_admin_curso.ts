import { Function_deleteD1, Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError } from "../function_global"


type Type_DeleteAdminCursoBody = {
	course_uuid: string;
}

type Type_DeleteAdminCursoResponse = {
	success: true;
	courseUuidDeleted: string;
}


export class Class_DeleteAdminCurso {
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

			const Const_body = Const_bodyUnknown as Partial<Type_DeleteAdminCursoBody>
			const Const_courseUuid = Function_getTrimmedStringOrUndefined(Const_body.course_uuid)
			if (typeof Const_courseUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing course_uuid')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Garante que curso existe
			const Const_courseArray = await Function_getD1(Parameter_env, 'course', 1, 1, ['course_uuid'], { course_uuid: Const_courseUuid })
			if (Function_isError(Const_courseArray)) {
				return Function_getResponseError(Const_courseArray, 455, 'Error validating course before delete')
			}

			if (Const_courseArray.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid was not found', inf: { Const_courseUuid }, loc: Function_getFuncionName(), err: true }, 456, 'Course not found')
			}
			// /\ Garante que curso existe

			// \/ Bloqueia exclusao quando houver vinculos
			const Const_contentLinkedArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['content_uuid'], { course_uuid_content: Const_courseUuid })
			if (Function_isError(Const_contentLinkedArray)) {
				return Function_getResponseError(Const_contentLinkedArray, 457, 'Error checking linked content on delete course')
			}
			if (Const_contentLinkedArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot delete course with linked content', inf: { Const_courseUuid, linkedContentUuid: Const_contentLinkedArray[0].content_uuid }, loc: Function_getFuncionName(), err: true }, 458, 'Course has linked content')
			}

			const Const_studentLinkedArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], { course_uuid_student: Const_courseUuid })
			if (Function_isError(Const_studentLinkedArray)) {
				return Function_getResponseError(Const_studentLinkedArray, 459, 'Error checking linked student on delete course')
			}
			if (Const_studentLinkedArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot delete course with linked student', inf: { Const_courseUuid, linkedStudentUuid: Const_studentLinkedArray[0].student_uuid }, loc: Function_getFuncionName(), err: true }, 460, 'Course has linked student')
			}
			// /\ Bloqueia exclusao quando houver vinculos

			// \/ Deleta curso
			const Const_courseDeleted = await Function_deleteD1(Parameter_env, 'course', { course_uuid: Const_courseUuid })
			if (Function_isError(Const_courseDeleted)) {
				return Function_getResponseError(Const_courseDeleted, 461, 'Error deleting course')
			}
			// /\ Deleta curso

			const Const_responseBody: Type_DeleteAdminCursoResponse = {
				success: true,
				courseUuidDeleted: Const_courseUuid
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}
		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error deleting admin course', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
