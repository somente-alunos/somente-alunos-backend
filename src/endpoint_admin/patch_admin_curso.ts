import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1 } from "../function_global"


type Type_PatchAdminCursoBody = {
	course_uuid: string;
	name_course?: string;
	svg_course?: string | null;
	college_uuid_course?: string;
}

type Type_PatchAdminCursoResponse = {
	course: Type_objectAdminCourseResponse;
}


export class Class_PatchAdminCurso {
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

			const Const_body = Const_bodyUnknown as Partial<Type_PatchAdminCursoBody>
			const Const_courseUuid = Function_getTrimmedStringOrUndefined(Const_body.course_uuid)
			if (typeof Const_courseUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing course_uuid')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Valida campos opcionais
			const Const_hasNameCourse = Object.prototype.hasOwnProperty.call(Const_body, 'name_course')
			const Const_hasSvgCourse = Object.prototype.hasOwnProperty.call(Const_body, 'svg_course')
			const Const_hasCollegeUuidCourse = Object.prototype.hasOwnProperty.call(Const_body, 'college_uuid_course')
			if (!Const_hasNameCourse && !Const_hasSvgCourse && !Const_hasCollegeUuidCourse) {
				return Function_getResponseError({ typ: 'logical', msg: 'At least one optional field must be provided to patch course', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 455, 'No fields to patch')
			}

			const Const_nameCourse = Function_getTrimmedStringOrUndefined(Const_body.name_course)
			if (Const_hasNameCourse && typeof Const_nameCourse !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_course must be non-empty string when provided', inf: { name_course: Const_body.name_course }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid name_course')
			}

			const Const_collegeUuidCourse = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_course)
			if (Const_hasCollegeUuidCourse && typeof Const_collegeUuidCourse !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_course must be non-empty string when provided', inf: { college_uuid_course: Const_body.college_uuid_course }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid college_uuid_course')
			}

			let Let_svgCourse: string | null | undefined
			if (Const_hasSvgCourse) {
				if (Const_body.svg_course === null) {
					Let_svgCourse = null
				}
				else {
					const Const_svgCourse = Function_getTrimmedStringOrUndefined(Const_body.svg_course)
					if (typeof Const_svgCourse !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'svg_course must be non-empty string or null when provided', inf: { svg_course: Const_body.svg_course }, loc: Function_getFuncionName(), err: true }, 458, 'Invalid svg_course')
					}

					Let_svgCourse = Const_svgCourse
				}
			}
			// /\ Valida campos opcionais

			// \/ Garante que curso existe
			const Const_courseArray = await Function_getD1(Parameter_env, 'course', 1, 1, ['*'], { course_uuid: Const_courseUuid })
			if (Function_isError(Const_courseArray)) {
				return Function_getResponseError(Const_courseArray, 459, 'Error fetching course to patch')
			}

			const Const_course = Const_courseArray?.[0]
			if (!Const_course) {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid was not found', inf: { Const_courseUuid }, loc: Function_getFuncionName(), err: true }, 460, 'Course not found')
			}
			// /\ Garante que curso existe

			// \/ Valida faculdade destino quando informada
			if (typeof Const_collegeUuidCourse === 'string') {
				const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['college_uuid'], { college_uuid: Const_collegeUuidCourse })
				if (Function_isError(Const_collegeArray)) {
					return Function_getResponseError(Const_collegeArray, 461, 'Error validating college_uuid_course')
				}

				if (Const_collegeArray.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_course was not found', inf: { Const_collegeUuidCourse }, loc: Function_getFuncionName(), err: true }, 462, 'College not found')
				}
			}
			// /\ Valida faculdade destino quando informada

			// \/ Bloqueia duplicidade por nome no mesmo college
			const Const_nameCourseFinal = typeof Const_nameCourse === 'string' ? Const_nameCourse : Const_course.name_course
			const Const_collegeUuidCourseFinal = typeof Const_collegeUuidCourse === 'string' ? Const_collegeUuidCourse : Const_course.college_uuid_course
			const Const_courseSameNameArray = await Function_getD1(Parameter_env, 'course', 50, 1, ['course_uuid'], { name_course: Const_nameCourseFinal, college_uuid_course: Const_collegeUuidCourseFinal })
			if (Function_isError(Const_courseSameNameArray)) {
				return Function_getResponseError(Const_courseSameNameArray, 463, 'Error validating duplicated course name')
			}

			for (const Const_courseSingle of Const_courseSameNameArray) {
				if (Const_courseSingle.course_uuid !== Const_courseUuid) {
					return Function_getResponseError({ typ: 'logical', msg: 'Course name already exists for this college', inf: { Const_nameCourseFinal, Const_collegeUuidCourseFinal, Const_courseUuid }, loc: Function_getFuncionName(), err: true }, 464, 'Duplicated course name')
				}
			}
			// /\ Bloqueia duplicidade por nome no mesmo college

			// \/ Atualiza curso no D1
			const Const_dataUpdate: Partial<Type_tableD1CourseGet> = {}
			if (typeof Const_nameCourse === 'string') {
				Const_dataUpdate.name_course = Const_nameCourse
			}
			if (typeof Const_collegeUuidCourse === 'string') {
				Const_dataUpdate.college_uuid_course = Const_collegeUuidCourse
			}
			if (Const_hasSvgCourse) {
				Const_dataUpdate.svg_course = Let_svgCourse === undefined ? null : Let_svgCourse
			}

			const Const_courseUpdated = await Function_patchD1(Parameter_env, 'course', Const_dataUpdate, { course_uuid: Const_courseUuid }, ['*'])
			if (Function_isError(Const_courseUpdated)) {
				return Function_getResponseError(Const_courseUpdated, 465, 'Error patching course')
			}
			// /\ Atualiza curso no D1

			const Const_responseBody: Type_PatchAdminCursoResponse = {
				course: Const_courseUpdated
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}
		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error patching admin course', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
