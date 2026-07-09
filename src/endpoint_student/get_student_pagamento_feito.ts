import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_isError } from "../function_global"


type Type_GetStudentPagamentoFeitoResponse = {
	isPaid: boolean;
}


export class Class_GetStudentPagamentoFeito {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_txid = Const_newUrl.searchParams.get('txid') || ''

			if (!Const_txid) {
				const Const_responseBody: Type_GetStudentPagamentoFeitoResponse = { isPaid: false }
				return new Response(JSON.stringify(Const_responseBody), {
					status: 400,
					headers: { 'content-type': 'application/json; charset=utf-8' }
				})
			}

			const Const_isPaidGetD1 = await Function_getD1(Parameter_env, 'ordered', 1, 1, ['status_ordered'], {
				ordered_uuid: Const_txid
			})
			if (Function_isError(Const_isPaidGetD1)) {
				return Function_getResponseError(Const_isPaidGetD1, 460, 'Error fetching order by txid')
			}

			const Const_isPaid = Const_isPaidGetD1?.[0]?.status_ordered === 'completed'

			const Const_responseBody: Type_GetStudentPagamentoFeitoResponse = {
				isPaid: Const_isPaid
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error checking payment status', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
