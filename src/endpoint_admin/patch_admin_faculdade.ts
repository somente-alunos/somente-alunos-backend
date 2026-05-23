import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1 } from "../function_global"


type Type_PatchAdminFaculdadeBody = {
	college_uuid: string;
	name_college?: string;
	svg_college?: string | null;
}

type Type_PatchAdminFaculdadeResponse = {
	college: Type_objectAdminCollegeResponse;
}


export class Class_PatchAdminFaculdade {
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

			const Const_body = Const_bodyUnknown as Partial<Type_PatchAdminFaculdadeBody>
			const Const_collegeUuid = Function_getTrimmedStringOrUndefined(Const_body.college_uuid)
			if (typeof Const_collegeUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing college_uuid')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Valida campos opcionais
			const Const_hasNameCollege = Object.prototype.hasOwnProperty.call(Const_body, 'name_college')
			const Const_hasSvgCollege = Object.prototype.hasOwnProperty.call(Const_body, 'svg_college')
			if (!Const_hasNameCollege && !Const_hasSvgCollege) {
				return Function_getResponseError({ typ: 'logical', msg: 'At least one optional field must be provided to patch college', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 455, 'No fields to patch')
			}

			const Const_nameCollege = Function_getTrimmedStringOrUndefined(Const_body.name_college)
			if (Const_hasNameCollege && typeof Const_nameCollege !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'name_college must be non-empty string when provided', inf: { name_college: Const_body.name_college }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid name_college')
			}

			let Let_svgCollege: string | null | undefined
			if (Const_hasSvgCollege) {
				if (Const_body.svg_college === null) {
					Let_svgCollege = null
				}
				else {
					const Const_svgCollege = Function_getTrimmedStringOrUndefined(Const_body.svg_college)
					if (typeof Const_svgCollege !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'svg_college must be non-empty string or null when provided', inf: { svg_college: Const_body.svg_college }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid svg_college')
					}

					Let_svgCollege = Const_svgCollege
				}
			}
			// /\ Valida campos opcionais

			// \/ Garante que faculdade existe
			const Const_collegeArray = await Function_getD1(Parameter_env, 'college', 1, 1, ['*'], { college_uuid: Const_collegeUuid })
			if (Function_isError(Const_collegeArray)) {
				return Function_getResponseError(Const_collegeArray, 458, 'Error fetching college to patch')
			}

			const Const_college = Const_collegeArray?.[0]
			if (!Const_college) {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid was not found', inf: { Const_collegeUuid }, loc: Function_getFuncionName(), err: true }, 459, 'College not found')
			}
			// /\ Garante que faculdade existe

			// \/ Bloqueia duplicidade por nome exato
			if (typeof Const_nameCollege === 'string') {
				const Const_collegeSameNameArray = await Function_getD1(Parameter_env, 'college', 50, 1, ['college_uuid'], { name_college: Const_nameCollege })
				if (Function_isError(Const_collegeSameNameArray)) {
					return Function_getResponseError(Const_collegeSameNameArray, 460, 'Error validating duplicated college name')
				}

				for (const Const_collegeSingle of Const_collegeSameNameArray) {
					if (Const_collegeSingle.college_uuid !== Const_collegeUuid) {
						return Function_getResponseError({ typ: 'logical', msg: 'College name already exists', inf: { Const_nameCollege, Const_collegeUuid }, loc: Function_getFuncionName(), err: true }, 461, 'Duplicated college name')
					}
				}
			}
			// /\ Bloqueia duplicidade por nome exato

			// \/ Atualiza faculdade no D1
			const Const_dataUpdate: Partial<Type_tableD1CollegeGet> = {}
			if (typeof Const_nameCollege === 'string') {
				Const_dataUpdate.name_college = Const_nameCollege
			}
			if (Const_hasSvgCollege) {
				Const_dataUpdate.svg_college = Let_svgCollege === undefined ? null : Let_svgCollege
			}

			const Const_collegeUpdated = await Function_patchD1(Parameter_env, 'college', Const_dataUpdate, { college_uuid: Const_collegeUuid }, ['*'])
			if (Function_isError(Const_collegeUpdated)) {
				return Function_getResponseError(Const_collegeUpdated, 462, 'Error patching college')
			}
			// /\ Atualiza faculdade no D1

			const Const_responseBody: Type_PatchAdminFaculdadeResponse = {
				college: Const_collegeUpdated
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}
		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error patching admin college', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
