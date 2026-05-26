
import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_postD1 } from "../function_global"


type Type_PostAdminStudentBody = {
	ra_student?: string;
	cpf_student?: string;

	college_uuid_student?: string;
	course_uuid_student?: string;
	class_student?: string;
}

type Type_PostAdminStudentResponse = {
	student: Type_objectAdminStudentResponse;
}

function Function_generateCode3Digit_LEGACY(Parameter_cpfOrRa: string, Parameter_env: Env): string {
    const Const_cpfOrRaClear = String(Parameter_cpfOrRa).replace(/\D/g, '')

    const Const_secretKey = Parameter_env.EnvSecret_secretKeyForGenerateCode6DigitLegacy
    const Const_dataForHash = `${Const_cpfOrRaClear}-${Const_secretKey}`

    let Let_hash = 0
    for (let Let_i = 0; Let_i < Const_dataForHash.length; Let_i++) {
        const Const_char = Const_dataForHash.charCodeAt(Let_i)
        Let_hash = (Let_hash << 5) - Let_hash + Const_char
        Let_hash |= 0
    }

    const Const_code = Math.abs(Let_hash).toString().padStart(6, '0').slice(0, 3)
    return Const_code
}

function Function_generateCode6Digit_LEGACY(Parameter_cpf: string, Parameter_ra: string, Parameter_env: Env): string {
    const Const_cpfCode = Function_generateCode3Digit_LEGACY(Parameter_cpf, Parameter_env)
    const Const_raCode = Function_generateCode3Digit_LEGACY(Parameter_ra, Parameter_env)

    return `${Const_cpfCode}${Const_raCode}`
}

function Function_generateInvitationCodeStudentSixDigits(Parameter_isLegacy?: 'legacy', Parameter_cpf?: string, Parameter_ra?: string, Parameter_env?: Env): string {
	if (Parameter_isLegacy === 'legacy' && typeof Parameter_cpf === 'string' && typeof Parameter_ra === 'string' && Parameter_env) {
		return Function_generateCode6Digit_LEGACY(Parameter_cpf, Parameter_ra, Parameter_env)
	}

	return Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
}


export class Class_PostAdminStudent {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Le body
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
			// /\ Le body

			const Const_body = Const_bodyUnknown as Type_PostAdminStudentBody
			const Const_raStudent = Function_getTrimmedStringOrUndefined(Const_body.ra_student)
			const Const_cpfStudent = Function_getTrimmedStringOrUndefined(Const_body.cpf_student)

			// \/ Verifica CPF duplicado quando informado
			if (typeof Const_cpfStudent === 'string') {
				const Const_studentSameCpfArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], { cpf_student: Const_cpfStudent })
				if (Function_isError(Const_studentSameCpfArray)) {
					return Function_getResponseError(Const_studentSameCpfArray, 454, 'Error checking duplicated CPF')
				}

				if (Const_studentSameCpfArray.length > 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'CPF already registered', inf: { Const_cpfStudent }, loc: Function_getFuncionName(), err: true }, 455, 'Duplicated CPF')
				}
			}
			// /\ Verifica CPF duplicado quando informado

			// \/ Valida faculdade/curso sugeridos quando informados
			let Let_collegeUuidStudent = Function_getTrimmedStringOrUndefined(Const_body.college_uuid_student)
			const Let_courseUuidStudent = Function_getTrimmedStringOrUndefined(Const_body.course_uuid_student)
			const Const_classStudent = Function_getTrimmedStringOrUndefined(Const_body.class_student)

			if (typeof Let_collegeUuidStudent === 'string') {
				const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['college_uuid'], {
					college_uuid: Let_collegeUuidStudent
				})
				if (Function_isError(Const_collegeArray)) {
					return Function_getResponseError(Const_collegeArray, 456, 'Error validating college')
				}

				if (Const_collegeArray.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'College not found', inf: { Let_collegeUuidStudent, Const_collegeArray }, loc: Function_getFuncionName(), err: true }, 457, 'College not found')
				}
			}

			if (typeof Let_courseUuidStudent === 'string') {
				const Const_courseArray = await Function_getD1(Parameter_env, 'course', 1, 1, ['course_uuid', 'college_uuid_course'], {
					course_uuid: Let_courseUuidStudent
				})
				if (Function_isError(Const_courseArray)) {
					return Function_getResponseError(Const_courseArray, 458, 'Error validating course')
				}

				const Const_courseSingle = Const_courseArray?.[0]
				if (!Const_courseSingle) {
					return Function_getResponseError({ typ: 'logical', msg: 'Course not found', inf: { Let_courseUuidStudent, Const_courseArray }, loc: Function_getFuncionName(), err: true }, 459, 'Course not found')
				}

				if (typeof Let_collegeUuidStudent === 'string' && Let_collegeUuidStudent !== Const_courseSingle.college_uuid_course) {
					return Function_getResponseError({ typ: 'logical', msg: 'Course does not belong to informed college', inf: { Let_collegeUuidStudent, Let_courseUuidStudent, Const_courseSingle }, loc: Function_getFuncionName(), err: true }, 460, 'College and course mismatch')
				}

				if (typeof Let_collegeUuidStudent !== 'string') {
					Let_collegeUuidStudent = Const_courseSingle.college_uuid_course
				}
			}
			// /\ Valida faculdade/curso sugeridos quando informados

			// \/ Cria aluno com codigo de convite de 6 digitos com no maximo 10 tentativas
			const Const_studentUuid = crypto.randomUUID()
			let Let_studentCreated: Type_tableD1StudentGet | null = null
			let Let_attempt = 1
			let Let_invitationCodeStudent = ''
			for (Let_attempt = 1; Let_attempt <= 10; Let_attempt++) {
				if (Let_attempt === 1) {
					Let_invitationCodeStudent = Function_generateInvitationCodeStudentSixDigits('legacy', Const_cpfStudent, Const_raStudent, Parameter_env)
				}
				else {
					Let_invitationCodeStudent = Function_generateInvitationCodeStudentSixDigits()
				}
				const Const_studentSameInvitationCodeArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], { invitation_code_student: Let_invitationCodeStudent })
				if (Function_isError(Const_studentSameInvitationCodeArray)) {
					return Function_getResponseError(Const_studentSameInvitationCodeArray, 461, 'Error checking duplicated invitation code')
				}

				if (Const_studentSameInvitationCodeArray.length > 0) {
					continue
				}

				const Const_studentCreatedAttempt = await Function_postD1(Parameter_env, 'student', {
					student_uuid: Const_studentUuid,
					invitation_code_student: Let_invitationCodeStudent,
					ra_student: Const_raStudent,
					cpf_student: Const_cpfStudent,
					college_uuid_student: Let_collegeUuidStudent,
					course_uuid_student: Let_courseUuidStudent,
					class_student: Const_classStudent
				}, ['*'])
				if (Function_isError(Const_studentCreatedAttempt)) {
					const Const_errorString = JSON.stringify(Const_studentCreatedAttempt.inf).toLowerCase()
					const Const_isDuplicatedInvitationCode = Const_errorString.includes('invitation_code_student') && Const_errorString.includes('unique')
					if (Const_isDuplicatedInvitationCode) {
						continue
					}

					return Function_getResponseError(Const_studentCreatedAttempt, 462, 'Error creating student')
				}

				Let_studentCreated = Const_studentCreatedAttempt
				break
			}

			if (!Let_studentCreated) {
				return Function_getResponseError({ typ: 'logical', msg: 'Could not generate unique invitation code after 10 attempts', inf: { Const_studentUuid, Let_attempt }, loc: Function_getFuncionName(), err: true }, 463, 'Invitation code generation limit reached')
			}
			// /\ Cria aluno com codigo de convite de 6 digitos com no maximo 10 tentativas

			const Const_responseBody: Type_PostAdminStudentResponse = {
				student: Let_studentCreated
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 201,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error posting admin student', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
