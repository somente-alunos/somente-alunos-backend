import { Function_configWebhookEfi, Function_generateAcessTokenEfi, Function_generateCreatePaymentPixEfi, Function_getAdminAuthenticated, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError } from "../function_global"


type Type_PostAdminConfigWebhookEfiBankBody = {
	webhookUrlBase: string;
}

type Type_PostAdminConfigWebhookEfiBankResponse = {
	success: true;
    pixCopiaECola: string;
}


export class Class_PostAdminConfigWebhookEfiBank {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Le body JSON opcional
			const Const_body = await Parameter_request.json() as Type_PostAdminConfigWebhookEfiBankBody
			const Const_webhookUrlBaseBody = Const_body.webhookUrlBase
			if (typeof Const_webhookUrlBaseBody !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'webhookUrlBase must be a string', inf: { webhookUrlBase: Const_body.webhookUrlBase }, loc: Function_getFuncionName(), err: true }, 452, 'Invalid webhookUrlBase')
			}
			// /\ Le body JSON opcional

			// \/ Gera token efi
			const Const_generateAcessTokenEfi = await Function_generateAcessTokenEfi(Parameter_env)
			if (Function_isError(Const_generateAcessTokenEfi)) {
				return Function_getResponseError(Const_generateAcessTokenEfi, 453, 'Error generating Efi access token for webhook configuration')
			}
			// /\ Gera token efi

			// \/ Configura webhook na Efi
			const Const_configWebhookEfi = await Function_configWebhookEfi(Parameter_env, Const_generateAcessTokenEfi, Const_webhookUrlBaseBody)
			if (Function_isError(Const_configWebhookEfi)) {
				return Function_getResponseError(Const_configWebhookEfi, 454, 'Error configuring Efi webhook')
			}
			// /\ Configura webhook na Efi

			// \/ Testa gerando cobraça de PIX
			const Const_generateCreatePaymentPixEfi = await Function_generateCreatePaymentPixEfi(Parameter_env, Const_generateAcessTokenEfi, '1.00', crypto.randomUUID().replaceAll('-', ''), 'Teste de configuração de webhook - Somente Alunos')
			if (Function_isError(Const_generateCreatePaymentPixEfi)) {
				return Function_getResponseError(Const_generateCreatePaymentPixEfi, 455, 'Error generating Efi PIX charge to test webhook configuration')
			}

			const Const_pixCopiaECola = Const_generateCreatePaymentPixEfi.pixCopiaECola
			if (typeof Const_pixCopiaECola !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid pixCopiaECola returned from Efi when testing webhook configuration', inf: { pixCopiaECola: Const_pixCopiaECola }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid pixCopiaECola returned from Efi when testing webhook configuration')
			}
			// /\ Testa gerando cobraça de PIX

			const Const_responseBody: Type_PostAdminConfigWebhookEfiBankResponse = {
				success: true,
				pixCopiaECola: Const_pixCopiaECola
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error configuring Efi webhook', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
