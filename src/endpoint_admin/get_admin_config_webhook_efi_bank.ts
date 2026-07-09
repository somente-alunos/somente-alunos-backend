import { Function_generateAcessTokenEfi, Function_getAdminAuthenticated, Function_getResponseError, Function_getWebhooksEfi, Function_isError } from "../function_global"


type Type_GetAdminConfigWebhookEfiBankResponse = {
	webhookUrl: string;
	chave: string;
	criacao: string;
}


export class Class_GetAdminConfigWebhookEfiBank {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Gera token efi
			const Const_generateAcessTokenEfi = await Function_generateAcessTokenEfi(Parameter_env)
			if (Function_isError(Const_generateAcessTokenEfi)) {
				return Function_getResponseError(Const_generateAcessTokenEfi, 452, 'Error generating Efi access token for webhook listing')
			}
			// /\ Gera token efi

			// \/ Obtem lista de webhooks configurados
			const Const_getWebhooksEfi = await Function_getWebhooksEfi(Parameter_env, Const_generateAcessTokenEfi)
			if (Function_isError(Const_getWebhooksEfi)) {
				return Function_getResponseError(Const_getWebhooksEfi, 453, 'Error fetching configured webhooks from Efi')
			}
			// /\ Obtem lista de webhooks configurados

			return new Response(JSON.stringify(Const_getWebhooksEfi), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error fetching Efi webhooks', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: 'Class_GetAdminConfigWebhookEfiBank', err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
