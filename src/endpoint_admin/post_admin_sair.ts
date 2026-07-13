
import { Function_generateCookieClearAdminArray, Function_getFuncionName, Function_getResponseError, Function_isError } from "../function_global"


type Type_PostAdminSairResponse = {
	isCookieCleared: boolean;
}


// Espelho de Class_PostStudentSair para o perfil admin: expira APENAS os cookies de admin, entao
// sair do painel admin nao derruba a sessao de aluno aberta no mesmo navegador.
export class Class_PostAdminSair {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			const Const_cookieClearArray = Function_generateCookieClearAdminArray(Parameter_env)
			if (Function_isError(Const_cookieClearArray)) {
				return Function_getResponseError(Const_cookieClearArray, 463, 'Error building admin cookie cleanup headers')
			}

			const Const_headers = new Headers({ 'content-type': 'application/json; charset=utf-8' })
			for (const Const_cookieClear of Const_cookieClearArray) {
				Const_headers.append('set-cookie', Const_cookieClear)
			}

			const Const_responseBody: Type_PostAdminSairResponse = {
				isCookieCleared: true
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: Const_headers
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error clearing admin session cookies', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
