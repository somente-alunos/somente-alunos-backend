
import { Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_GetStudentCelularOuComputadorResponse = {
	ok: boolean;
}


export class Class_GetStudentCelularOuComputador {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Lê o dispositivo do query (celular | computador)
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_dispositivo = Const_newUrl.searchParams.get('dispositivo') || ''
			if (Const_dispositivo !== 'celular' && Const_dispositivo !== 'computador') {
				const Const_responseBody: Type_GetStudentCelularOuComputadorResponse = { ok: false }
				return new Response(JSON.stringify(Const_responseBody), {
					status: 400,
					headers: { 'content-type': 'application/json; charset=utf-8' }
				})
			}
			// /\ Lê o dispositivo do query (celular | computador)

			// \/ Envia o student_uuid para a API de métrica
			const Const_deviceUsedEndpoint = Parameter_env.EnvSecret_deviceUsedEndpoint
			const Const_deviceUsedToken = Parameter_env.EnvSecret_deviceUsedToken
			if (Const_deviceUsedEndpoint && Const_deviceUsedToken) {
				const Const_deviceUsedUrl = new URL(Const_deviceUsedEndpoint)
				Const_deviceUsedUrl.searchParams.set('student_uuid', Const_studentAuthenticated.student_uuid)
				Const_deviceUsedUrl.searchParams.set('dispositivo', Const_dispositivo)

				await fetch(Const_deviceUsedUrl.toString(), {
					method: 'GET',
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${Const_deviceUsedToken}`
					}
				})
			}
			// /\ Envia o student_uuid para a API de métrica

			const Const_responseBody: Type_GetStudentCelularOuComputadorResponse = { ok: true }
			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error reporting student device', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
