import { Function_generateEfiBankAccessToken, Function_getAdminAuthenticated, Function_getEfiBankAliasOrUndefined, Function_getEfiBankWebhook, Function_getEfiWebhookToken, Function_getEfiWebhookUrlWithToken, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_putEfiBankWebhook } from "../function_global"


type Type_PostAdminConfigWebhookEfiBankBody = {
	efiBankAlias?: Type_efiBankAlias;
	webhookUrlBase?: string;
	skipMtlsChecking?: boolean;
}

type Type_PostAdminConfigWebhookEfiBankResponse = {
	success: true;
	efiBankAlias: Type_efiBankAlias;
	pixKey: string;
	webhookUrlRegistered: string;
	skipMtlsChecking: boolean;
	setWebhookStatus: number;
	setWebhookResponseBody: string;
	getWebhookStatus: number;
	getWebhookResponseBody: string;
	getWebhookResponseBodyJson?: unknown;
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
			let Const_bodyUnknown: unknown = {}
			try {
				const Const_bodyText = await Parameter_request.text()
				if (Const_bodyText.trim().length > 0) {
					Const_bodyUnknown = JSON.parse(Const_bodyText)
				}
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid JSON body', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 452, 'Invalid JSON body')
			}

			if (typeof Const_bodyUnknown !== 'object' || Const_bodyUnknown === null) {
				return Function_getResponseError({ typ: 'logical', msg: 'Body must be a valid object', inf: { Const_bodyUnknown }, loc: Function_getFuncionName(), err: true }, 453, 'Body must be object')
			}

			const Const_body = Const_bodyUnknown as Partial<Type_PostAdminConfigWebhookEfiBankBody>
			const Const_efiBankAlias = Function_getEfiBankAliasOrUndefined(Const_body.efiBankAlias)
			const Const_skipMtlsChecking = typeof Const_body.skipMtlsChecking === 'boolean' ? Const_body.skipMtlsChecking : true
			if (Object.prototype.hasOwnProperty.call(Const_body, 'efiBankAlias') && !Const_efiBankAlias) {
				return Function_getResponseError({ typ: 'logical', msg: 'efiBankAlias must be gp, rp or rc when provided', inf: { efiBankAlias: Const_body.efiBankAlias }, loc: Function_getFuncionName(), err: true }, 454, 'Invalid efiBankAlias')
			}
			// /\ Le body JSON opcional

			// \/ Resolve URL final do webhook
			const Const_webhookToken = Function_getEfiWebhookToken(Parameter_env)
			if (Function_isError(Const_webhookToken)) {
				return Function_getResponseError(Const_webhookToken, 455, 'Invalid Efi webhook token')
			}

			let Let_webhookUrlBase = Function_getTrimmedStringOrUndefined(Const_body.webhookUrlBase)
			if (typeof Let_webhookUrlBase !== 'string') {
				const Const_requestUrl = new URL(Parameter_request.url)
				Let_webhookUrlBase = `${Const_requestUrl.origin}/post/efi-bank/webhook`
			}

			const Const_webhookUrlRegistered = Function_getEfiWebhookUrlWithToken(Let_webhookUrlBase, Const_webhookToken)
			if (Function_isError(Const_webhookUrlRegistered)) {
				return Function_getResponseError(Const_webhookUrlRegistered, 456, 'Invalid webhook URL')
			}
			// /\ Resolve URL final do webhook

			// \/ Gera access token da Efi e configura webhook
			const Const_efiAccess = await Function_generateEfiBankAccessToken(Parameter_env, Const_efiBankAlias)
			if (Function_isError(Const_efiAccess)) {
				return Function_getResponseError(Const_efiAccess, 457, 'Error generating Efi access token')
			}

			const Const_setWebhookResult = await Function_putEfiBankWebhook(Const_efiAccess, Const_webhookUrlRegistered, Const_skipMtlsChecking)
			if (Function_isError(Const_setWebhookResult)) {
				return Function_getResponseError(Const_setWebhookResult, 458, 'Error setting Efi webhook')
			}

			const Const_getWebhookResult = await Function_getEfiBankWebhook(Const_efiAccess)
			if (Function_isError(Const_getWebhookResult)) {
				return Function_getResponseError(Const_getWebhookResult, 459, 'Error fetching configured Efi webhook')
			}
			// /\ Gera access token da Efi e configura webhook

			const Const_responseBody: Type_PostAdminConfigWebhookEfiBankResponse = {
				success: true,
				efiBankAlias: Const_efiAccess.efiBankAlias,
				pixKey: Const_efiAccess.pixKey,
				webhookUrlRegistered: Const_webhookUrlRegistered,
				skipMtlsChecking: Const_skipMtlsChecking,
				setWebhookStatus: Const_setWebhookResult.status,
				setWebhookResponseBody: Const_setWebhookResult.responseBody,
				getWebhookStatus: Const_getWebhookResult.status,
				getWebhookResponseBody: Const_getWebhookResult.responseBody,
				getWebhookResponseBodyJson: Const_getWebhookResult.responseBodyJson
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error configuring Efi webhook', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
