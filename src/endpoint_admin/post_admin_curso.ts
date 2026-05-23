import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_postD1 } from "../function_global"


type Type_PostAdminCursoBody = {
	course_uuid?: string;
	name_course: string;
	svg_course?: string | null;
	college_uuid_course: string;
}

type Type_PostAdminCursoResponse = {
	course: Type_objectAdminCourseResponse;
}


export class Class_PostAdminCurso {
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

			const Const_body = Const_bodyUnknown as Partial<Type_PostAdminCursoBody>
			const Const_courseUuid = Function_getTrimmedStringOrUndefined(Const_body.course_uuid)
			const Const_nameCourse = Function_getTrimmedStringOrUndefined(Const_body.name_course)
			const Const_collegeUuidCourse = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_course)
			if (typeof Const_nameCourse !== 'string' || typeof Const_collegeUuidCourse !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_course and college_uuid_course are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required body fields')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Resolve svg opcional
			const Const_hasSvgCourse = Object.prototype.hasOwnProperty.call(Const_body, 'svg_course')
			let Let_svgCourse: string | null | undefined
			if (Const_hasSvgCourse) {
				if (Const_body.svg_course === null) {
					Let_svgCourse = null
				}
				else {
					const Const_svgCourse = Function_getTrimmedStringOrUndefined(Const_body.svg_course)
					if (typeof Const_svgCourse !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'svg_course must be non-empty string or null when provided', inf: { svg_course: Const_body.svg_course }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid svg_course')
					}

					Let_svgCourse = Const_svgCourse
				}
			}
			// /\ Resolve svg opcional

			// \/ Valida faculdade relacionada
			const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['college_uuid'], { college_uuid: Const_collegeUuidCourse })
			if (Function_isError(Const_collegeArray)) {
				return Function_getResponseError(Const_collegeArray, 456, 'Error validating college_uuid_course')
			}

			if (Const_collegeArray.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_course was not found', inf: { Const_collegeUuidCourse }, loc: Function_getFuncionName(), err: true }, 457, 'College not found')
			}
			// /\ Valida faculdade relacionada

			// \/ Bloqueia duplicidade por nome no mesmo college
			const Const_courseSameNameArray = await Function_getD1(Parameter_env, 'course', 1, 1, ['course_uuid'], { name_course: Const_nameCourse, college_uuid_course: Const_collegeUuidCourse })
			if (Function_isError(Const_courseSameNameArray)) {
				return Function_getResponseError(Const_courseSameNameArray, 458, 'Error validating duplicated course name')
			}

			if (Const_courseSameNameArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'Course name already exists for this college', inf: { Const_nameCourse, Const_collegeUuidCourse }, loc: Function_getFuncionName(), err: true }, 459, 'Duplicated course name')
			}
			// /\ Bloqueia duplicidade por nome no mesmo college

			// \/ Cria curso no D1
			const Const_courseCreated = await Function_postD1(Parameter_env, 'course', {
				course_uuid: Const_courseUuid || crypto.randomUUID(),
				name_course: Const_nameCourse,
				svg_course: Let_svgCourse,
				college_uuid_course: Const_collegeUuidCourse
			}, ['*'])
			if (Function_isError(Const_courseCreated)) {
				return Function_getResponseError(Const_courseCreated, 460, 'Error creating course')
			}
			// /\ Cria curso no D1

			const Const_responseBody: Type_PostAdminCursoResponse = {
				course: Const_courseCreated
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}
		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error creating admin course', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
