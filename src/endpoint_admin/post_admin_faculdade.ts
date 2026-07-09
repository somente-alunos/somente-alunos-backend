import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_postD1 } from "../function_global"


type Type_PostAdminFaculdadeBody = {
	college_uuid?: string;
	name_college: string;
	svg_college?: string | null;
}

type Type_PostAdminFaculdadeResponse = {
	college: Type_objectAdminCollegeResponse;
}


export class Class_PostAdminFaculdade {
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

			const Const_body = Const_bodyUnknown as Partial<Type_PostAdminFaculdadeBody>
			const Const_collegeUuid = Function_getTrimmedStringOrUndefined(Const_body.college_uuid)
			const Const_nameCollege = Function_getTrimmedStringOrUndefined(Const_body.name_college)
			if (typeof Const_nameCollege !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_college is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing name_college')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Resolve svg opcional
			const Const_hasSvgCollege = Object.prototype.hasOwnProperty.call(Const_body, 'svg_college')
			let Let_svgCollege: string | null | undefined
			if (Const_hasSvgCollege) {
				if (Const_body.svg_college === null) {
					Let_svgCollege = null
				}
				else {
					const Const_svgCollege = Function_getTrimmedStringOrUndefined(Const_body.svg_college)
					if (typeof Const_svgCollege !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'svg_college must be non-empty string or null when provided', inf: { svg_college: Const_body.svg_college }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid svg_college')
					}

					Let_svgCollege = Const_svgCollege
				}
			}
			// /\ Resolve svg opcional

			// \/ Bloqueia duplicidade por nome exato
			const Const_collegeSameNameArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['college_uuid'], { name_college: Const_nameCollege })
			if (Function_isError(Const_collegeSameNameArray)) {
				return Function_getResponseError(Const_collegeSameNameArray, 456, 'Error validating duplicated college name')
			}

			if (Const_collegeSameNameArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'College name already exists', inf: { Const_nameCollege }, loc: Function_getFuncionName(), err: true }, 457, 'Duplicated college name')
			}
			// /\ Bloqueia duplicidade por nome exato

			// \/ Cria faculdade no D1
			const Const_collegeCreated = await Function_postD1(Parameter_env, 'college', {
				college_uuid: Const_collegeUuid || crypto.randomUUID(),
				name_college: Const_nameCollege,
				svg_college: Let_svgCollege
			}, ['*'])
			if (Function_isError(Const_collegeCreated)) {
				return Function_getResponseError(Const_collegeCreated, 458, 'Error creating college')
			}
			// /\ Cria faculdade no D1

			const Const_responseBody: Type_PostAdminFaculdadeResponse = {
				college: Const_collegeCreated
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}
		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error creating admin college', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
