
import { Function_generateCookieStudentJwt, Function_generateJwt, Function_getContentByCollegeCourseClass, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAcquiredContentUuidArray, Function_getTrimmedStringOrUndefined, Function_isError, Function_verifyStudentCpfOrRaExternalApi } from "../function_global"


type Type_PostStudentEntrarBody = {
	raOrCpf: string;
	invitationCodeStudent: string;
}

type Type_objectStudentContentEntrarResponse = Type_objectStudentContentResponse & {
	isAcquiredContent: boolean;
}

type Type_PostStudentEntrarResponse = {
	student: {
		student_uuid: Type_tableD1StudentGet['student_uuid'];
		college_uuid_student: Type_tableD1StudentGet['college_uuid_student'];
		course_uuid_student: Type_tableD1StudentGet['course_uuid_student'];
		is_suggested_information_student: Type_tableD1StudentGet['is_suggested_information_student'];
		isAllContentUnlocked: boolean;
	};
	collegeArray: Array<Type_objectStudentCollegeResponse>;
	courseArray: Array<Type_objectStudentCourseResponse>;
	contentArray: Array<Type_objectStudentContentEntrarResponse>;
	cartArray: Array<Type_objectStudentCartResponse>;
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

async function Function_getStudentCartContentArray(Parameter_env: Env, Parameter_studentUuid: Type_tableD1StudentGet['student_uuid']): Type_errorOr<Promise<Array<Type_objectStudentCartResponse>>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		const Const_d1Result = await Const_D1Database.prepare(`
			SELECT
				content.*
			FROM
				student
			JOIN
				json_each(CASE WHEN json_valid(student.cart_student) THEN student.cart_student ELSE '[]' END) AS cart_item
			JOIN
				content ON content.content_uuid = CASE
					WHEN cart_item.type = 'object' THEN json_extract(cart_item.value, '$.content_uuid')
					ELSE cart_item.value
				END
			WHERE
				student.student_uuid = ?1
				AND content.verified_content = 1
			ORDER BY
				CAST(cart_item.key AS INTEGER) ASC
		`).bind(Parameter_studentUuid).all<Type_tableD1ContentGet>()
		if (Const_d1Result.error || !Const_d1Result.success) {
			return { typ: 'logical', msg: 'Error querying student cart content with D1 JSON', inf: { Const_d1Result, Parameter_studentUuid }, loc: Function_getFuncionName(), err: true }
		}

		const Const_cartArray: Array<Type_objectStudentCartResponse> = []
		for (const Const_content of Const_d1Result.results) {
			Const_cartArray.push(Function_mapContentGetToObjectStudentContentResponse(Const_content))
		}

		return Const_cartArray
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting student cart content array', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

function Function_checkIfSupportCode(Parameter_env: Env, Parameter_code: string): 'none' | 'support' | 'support-special' {
	if (Parameter_code === Parameter_env.EnvSecret_passwordAccessSupportSpecial) {
		return 'support-special'
	}
	if (Parameter_code === Parameter_env.EnvSecret_passwordAccessSupport) {
		return 'support'
	}
	return 'none'
}

async function Function_getStudentByRaOrCpfInvitation(
	Parameter_env: Env,
	Parameter_raOrCpf: string,
	Parameter_invitationCodeStudent: string,
	Parameter_isSupportCode: boolean = false
): Type_errorOr<Promise<Type_tableD1StudentGet | null>> {
	try {
		const Const_onlyDigit = Parameter_raOrCpf.replace(/\D/g, '')
		if (Const_onlyDigit.length === 11) {
			Parameter_raOrCpf = Const_onlyDigit
		}
		else {
			Parameter_raOrCpf = Const_onlyDigit.slice(0, -1) + '-' + Const_onlyDigit.slice(-1)
		}

		const Const_whereClause: Record<string, string> = Parameter_isSupportCode
			? {}
			: { invitation_code_student: Parameter_invitationCodeStudent }

		const Const_studentByRaArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['*'], {
			ra_student: Parameter_raOrCpf,
			...Const_whereClause
		})
		if (Function_isError(Const_studentByRaArray)) {
			return Const_studentByRaArray
		}

		const Const_studentByRa = Const_studentByRaArray?.[0]
		if (Const_studentByRa) {
			return Const_studentByRa
		}

		const Const_studentByCpfArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['*'], {
			cpf_student: Parameter_raOrCpf,
			...Const_whereClause
		})
		if (Function_isError(Const_studentByCpfArray)) {
			return Const_studentByCpfArray
		}

		return Const_studentByCpfArray?.[0] || null
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error finding student by RA/CPF and invitation code', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}


export class Class_PostStudentEntrar {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Le body e valida entrada
			let Const_bodyUnknown: unknown
			try {
				Const_bodyUnknown = await Parameter_request.json()
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid JSON body', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 451, 'Invalid JSON body')
			}

			if (typeof Const_bodyUnknown !== 'object' || Const_bodyUnknown === null) {
				return Function_getResponseError({ typ: 'logical', msg: 'Body must be a valid object', inf: { Const_bodyUnknown }, loc: Function_getFuncionName(), err: true }, 452, 'Body must be object')
			}

			const Const_body = Const_bodyUnknown as Partial<Type_PostStudentEntrarBody>
			const Const_raOrCpf = Function_getTrimmedStringOrUndefined(Const_body.raOrCpf)
			const Const_invitationCodeStudent = Function_getTrimmedStringOrUndefined(Const_body.invitationCodeStudent)
			if (typeof Const_raOrCpf !== 'string' || typeof Const_invitationCodeStudent !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'raOrCpf and invitationCodeStudent are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 453, 'Missing required body fields')
			}
			// /\ Le body e valida entrada

			// \/ Valida RA/CPF em API externa quando habilitado por env
			if (!!Parameter_env.EnvSecret_verifyStudentCpfOrRa) {
				const Const_isValidStudentDocument = await Function_verifyStudentCpfOrRaExternalApi(Const_raOrCpf, Parameter_env)
				if (Function_isError(Const_isValidStudentDocument)) {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid RA/CPF or invitation code', inf: { Const_raOrCpf, Const_invitationCodeStudent, source: 'external_api_error', sourceError: Const_isValidStudentDocument }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid student credentials')
				}

				if (!Const_isValidStudentDocument) {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid RA/CPF or invitation code', inf: { Const_raOrCpf, Const_invitationCodeStudent, source: 'external_api_invalid_document' }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid student credentials')
				}
			}
			// /\ Valida RA/CPF em API externa quando habilitado por env

			// \/ Valida aluno pelo RA/CPF + convite no D1
			const Const_supportCodeType = Function_checkIfSupportCode(Parameter_env, Const_invitationCodeStudent)
			const Const_isSupportCode = Const_supportCodeType !== 'none'
			const Const_student = await Function_getStudentByRaOrCpfInvitation(Parameter_env, Const_raOrCpf, Const_invitationCodeStudent, Const_isSupportCode)
			if (Function_isError(Const_student)) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid RA/CPF or invitation code', inf: { Const_raOrCpf, Const_invitationCodeStudent, source: 'd1_error', sourceError: Const_student }, loc: Function_getFuncionName(), err: true }, 455, 'Error validating student login')
			}

			if (!Const_student) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid RA/CPF or invitation code', inf: { Const_raOrCpf, Const_invitationCodeStudent, source: 'd1_not_found' }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid student credentials')
			}
			// /\ Valida aluno pelo RA/CPF + convite no D1

			// \/ Busca dados principais de login
			const Const_collegePromise = Function_getD1(Parameter_env, 'college', 999999, 1, ['college_uuid', 'name_college', 'svg_college'])
			const Const_coursePromise: Promise<Array<Type_objectStudentCourseResponse> | Type_isError> = typeof Const_student.college_uuid_student === 'string' && Const_student.college_uuid_student.length > 1
				? Function_getD1(Parameter_env, 'course', 999999, 1, ['course_uuid', 'name_course', 'svg_course', 'college_uuid_course'], {
					college_uuid_course: Const_student.college_uuid_student
				})
				: Promise.resolve([])
			const Const_contentPromise: Promise<Array<Type_tableD1ContentGet> | Type_isError> = (typeof Const_student.college_uuid_student === 'string' && Const_student.college_uuid_student.length > 1 && typeof Const_student.course_uuid_student === 'string' && Const_student.course_uuid_student.length > 1)
				? Function_getContentByCollegeCourseClass(
					Parameter_env,
					Const_student.college_uuid_student,
					Const_student.course_uuid_student,
					Const_student.class_student
				)
				: Promise.resolve([])
			const Const_acquiredContentPromise = Function_getStudentAcquiredContentUuidArray(Parameter_env, Const_student.student_uuid)
			const Const_cartPromise = Function_getStudentCartContentArray(Parameter_env, Const_student.student_uuid)

			const [
				Const_collegeArray,
				Const_courseArray,
				Const_contentArray,
				Const_acquiredContentUuidArray,
				Const_cartArray
			] = await Promise.all([
				Const_collegePromise,
				Const_coursePromise,
				Const_contentPromise,
				Const_acquiredContentPromise,
				Const_cartPromise
			])
			if (Function_isError(Const_collegeArray)) {
				return Function_getResponseError(Const_collegeArray, 456, 'Error fetching colleges')
			}
			if (Function_isError(Const_courseArray)) {
				return Function_getResponseError(Const_courseArray, 457, 'Error fetching suggested courses')
			}
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 458, 'Error fetching suggested content')
			}
			if (Function_isError(Const_acquiredContentUuidArray)) {
				return Function_getResponseError(Const_acquiredContentUuidArray, 459, 'Error fetching acquired content')
			}
			if (Function_isError(Const_cartArray)) {
				return Function_getResponseError(Const_cartArray, 460, 'Error fetching student cart content')
			}
			// /\ Busca dados principais de login

			// \/ Marca conteudos adquiridos e le carrinho
			const Const_setAcquiredContentUuid = new Set<string>(Const_acquiredContentUuidArray)
			const Const_contentResponseArray: Array<Type_objectStudentContentEntrarResponse> = []
			for (const Const_contentSingle of Const_contentArray) {
				const Const_contentMapped = Function_mapContentGetToObjectStudentContentResponse(Const_contentSingle)
				Const_contentResponseArray.push({
					...Const_contentMapped,
					isAcquiredContent: Const_setAcquiredContentUuid.has(Const_contentSingle.content_uuid)
				})
			}

			// /\ Marca conteudos adquiridos e le carrinho

			// \/ Gera JWT de aluno e escreve cookie
			const Const_isAllContentUnlocked = Const_supportCodeType === 'support-special'
			const Const_expirationJwtSeconds = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10)
			const Const_stringJwt = await Function_generateJwt<Type_payloadJwtStudent>(Parameter_env.EnvSecret_keyPrivateJwtStudent, {
				tar: {
					student_uuid: Const_student.student_uuid,
					isAllContentUnlocked: Const_isAllContentUnlocked
				},
				exp: Const_expirationJwtSeconds
			})
			if (Function_isError(Const_stringJwt)) {
				return Function_getResponseError(Const_stringJwt, 461, 'Error generating student JWT')
			}

			const Const_cookieJwt = Function_generateCookieStudentJwt(Parameter_env, Const_stringJwt, 60 * 60 * 24 * 365 * 10)
			if (Function_isError(Const_cookieJwt)) {
				return Function_getResponseError(Const_cookieJwt, 462, 'Error building student JWT cookie')
			}
			// /\ Gera JWT de aluno e escreve cookie

			const Const_responseBody: Type_PostStudentEntrarResponse = {
				student: {
					student_uuid: Const_student.student_uuid,
					college_uuid_student: Const_student.college_uuid_student,
					course_uuid_student: Const_student.course_uuid_student,
					is_suggested_information_student: Const_student.is_suggested_information_student,
					isAllContentUnlocked: Const_isAllContentUnlocked
				},
				collegeArray: Const_collegeArray,
				courseArray: Const_courseArray,
				contentArray: Const_contentResponseArray,
				cartArray: Const_cartArray
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'set-cookie': Const_cookieJwt
				}
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error posting student login', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
