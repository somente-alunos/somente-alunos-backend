import { Function_deleteD1, Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError } from "../function_global"


type Type_DeleteAdminFaculdadeBody = {
	college_uuid: string;
}

type Type_DeleteAdminFaculdadeResponse = {
	success: true;
	collegeUuidDeleted: string;
}


export class Class_DeleteAdminFaculdade {
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

			const Const_body = Const_bodyUnknown as Partial<Type_DeleteAdminFaculdadeBody>
			const Const_collegeUuid = Function_getTrimmedStringOrUndefined(Const_body.college_uuid)
			if (typeof Const_collegeUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing college_uuid')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Garante que faculdade existe
			const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['college_uuid'], { college_uuid: Const_collegeUuid })
			if (Function_isError(Const_collegeArray)) {
				return Function_getResponseError(Const_collegeArray, 455, 'Error validating college before delete')
			}

			if (Const_collegeArray.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid was not found', inf: { Const_collegeUuid }, loc: Function_getFuncionName(), err: true }, 456, 'College not found')
			}
			// /\ Garante que faculdade existe

			// \/ Bloqueia exclusao quando houver vinculos
			const Const_courseLinkedArray = await Function_getD1(Parameter_env, 'course', 1, 1, ['course_uuid'], { college_uuid_course: Const_collegeUuid })
			if (Function_isError(Const_courseLinkedArray)) {
				return Function_getResponseError(Const_courseLinkedArray, 457, 'Error checking linked course on delete college')
			}
			if (Const_courseLinkedArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot delete college with linked course', inf: { Const_collegeUuid, linkedCourseUuid: Const_courseLinkedArray[0].course_uuid }, loc: Function_getFuncionName(), err: true }, 458, 'College has linked course')
			}

			const Const_contentLinkedArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['content_uuid'], { college_uuid_content: Const_collegeUuid })
			if (Function_isError(Const_contentLinkedArray)) {
				return Function_getResponseError(Const_contentLinkedArray, 459, 'Error checking linked content on delete college')
			}
			if (Const_contentLinkedArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot delete college with linked content', inf: { Const_collegeUuid, linkedContentUuid: Const_contentLinkedArray[0].content_uuid }, loc: Function_getFuncionName(), err: true }, 460, 'College has linked content')
			}

			const Const_studentLinkedArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], { college_uuid_student: Const_collegeUuid })
			if (Function_isError(Const_studentLinkedArray)) {
				return Function_getResponseError(Const_studentLinkedArray, 461, 'Error checking linked student on delete college')
			}
			if (Const_studentLinkedArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot delete college with linked student', inf: { Const_collegeUuid, linkedStudentUuid: Const_studentLinkedArray[0].student_uuid }, loc: Function_getFuncionName(), err: true }, 462, 'College has linked student')
			}
			// /\ Bloqueia exclusao quando houver vinculos

			// \/ Deleta faculdade
			const Const_collegeDeleted = await Function_deleteD1(Parameter_env, 'college', { college_uuid: Const_collegeUuid })
			if (Function_isError(Const_collegeDeleted)) {
				return Function_getResponseError(Const_collegeDeleted, 463, 'Error deleting college')
			}
			// /\ Deleta faculdade

			const Const_responseBody: Type_DeleteAdminFaculdadeResponse = {
				success: true,
				collegeUuidDeleted: Const_collegeUuid
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}
		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error deleting admin college', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
