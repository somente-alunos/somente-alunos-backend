
import { Function_generateCookieClearArray, Function_getFuncionName, Function_getResponseError, Function_isError } from "../function_global"


type Type_PostStudentOrAdminSairResponse = {
	isCookieCleared: boolean;
}


// Os cookies de sessao sao HttpOnly: o navegador nao consegue apaga-los por document.cookie.
// Este endpoint (aberto, nao exige JWT) devolve os Set-Cookie de expiracao que os removem.
export class Class_PostStudentOrAdminSair {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			const Const_cookieClearArray = Function_generateCookieClearArray(Parameter_env)
			if (Function_isError(Const_cookieClearArray)) {
				return Function_getResponseError(Const_cookieClearArray, 463, 'Error building cookie cleanup headers')
			}

			const Const_headers = new Headers({ 'content-type': 'application/json; charset=utf-8' })
			for (const Const_cookieClear of Const_cookieClearArray) {
				Const_headers.append('set-cookie', Const_cookieClear)
			}

			const Const_responseBody: Type_PostStudentOrAdminSairResponse = {
				isCookieCleared: true
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: Const_headers
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error clearing session cookies', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
