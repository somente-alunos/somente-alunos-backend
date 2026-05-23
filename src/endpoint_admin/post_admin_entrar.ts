import { Function_generateCookieAdminJwt, Function_generateJwt, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError } from "../function_global"


type Type_PostAdminEntrarBody = {
	emailAdmin: string;
	passwordAdmin: string;
}

type Type_PostAdminEntrarResponse = {
	admin: {
		admin_uuid: Type_tableD1AdminGet['admin_uuid'];
		name_admin: Type_tableD1AdminGet['name_admin'];
		email_admin: Type_tableD1AdminGet['email_admin'];
	};
}


export class Class_PostAdminEntrar {
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

			const Const_body = Const_bodyUnknown as Partial<Type_PostAdminEntrarBody>
			const Const_emailAdmin = Function_getTrimmedStringOrUndefined(Const_body.emailAdmin)?.toLowerCase()
			const Const_passwordAdmin = Function_getTrimmedStringOrUndefined(Const_body.passwordAdmin)
			if (typeof Const_emailAdmin !== 'string' || typeof Const_passwordAdmin !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'emailAdmin and passwordAdmin are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 453, 'Missing required body fields')
			}
			// /\ Le body e valida entrada

			// \/ Busca admin por email e valida senha
			const Const_adminArray = await Function_getD1(Parameter_env, 'admin', 1, 1, ['*'], {
				email_admin: Const_emailAdmin
			})
			if (Function_isError(Const_adminArray)) {
				return Function_getResponseError(Const_adminArray, 454, 'Error validating admin credentials')
			}

			const Const_admin = Const_adminArray?.[0]
			if (!Const_admin || Const_admin.password_admin !== Const_passwordAdmin) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid admin credentials', inf: { Const_emailAdmin }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid admin credentials')
			}
			// /\ Busca admin por email e valida senha

			// \/ Gera JWT de admin e escreve cookie
			const Const_expirationJwtSeconds = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10)
			const Const_stringJwt = await Function_generateJwt<Type_payloadJwtAdmin>(Parameter_env.EnvSecret_keyPrivateJwtAdmin, {
				tar: {
					admin_uuid: Const_admin.admin_uuid
				},
				exp: Const_expirationJwtSeconds
			})
			if (Function_isError(Const_stringJwt)) {
				return Function_getResponseError(Const_stringJwt, 456, 'Error generating admin JWT')
			}

			const Const_cookieJwt = Function_generateCookieAdminJwt(Parameter_env, Const_stringJwt, 60 * 60 * 24 * 365 * 10)
			if (Function_isError(Const_cookieJwt)) {
				return Function_getResponseError(Const_cookieJwt, 457, 'Error building admin JWT cookie')
			}
			// /\ Gera JWT de admin e escreve cookie

			const Const_responseBody: Type_PostAdminEntrarResponse = {
				admin: {
					admin_uuid: Const_admin.admin_uuid,
					name_admin: Const_admin.name_admin,
					email_admin: Const_admin.email_admin
				}
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
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error posting admin login', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}

