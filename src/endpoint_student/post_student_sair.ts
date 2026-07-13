
import { Function_generateCookieClearStudentArray, Function_getFuncionName, Function_getResponseError, Function_isError } from "../function_global"


type Type_PostStudentSairResponse = {
	isCookieCleared: boolean;
}


// Os cookies de sessao sao HttpOnly: o navegador nao consegue apaga-los por document.cookie, so o
// backend que os criou. Este endpoint (aberto, nao exige JWT valido, senao quem tem token expirado
// nunca conseguiria sair) expira APENAS os cookies do aluno: uma sessao de admin aberta no mesmo
// navegador continua intacta.
export class Class_PostStudentSair {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			const Const_cookieClearArray = Function_generateCookieClearStudentArray(Parameter_env)
			if (Function_isError(Const_cookieClearArray)) {
				return Function_getResponseError(Const_cookieClearArray, 463, 'Error building student cookie cleanup headers')
			}

			const Const_headers = new Headers({ 'content-type': 'application/json; charset=utf-8' })
			for (const Const_cookieClear of Const_cookieClearArray) {
				Const_headers.append('set-cookie', Const_cookieClear)
			}

			const Const_responseBody: Type_PostStudentSairResponse = {
				isCookieCleared: true
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: Const_headers
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error clearing student session cookies', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
