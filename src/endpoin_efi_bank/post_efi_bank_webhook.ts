import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1, Function_postD1, Function_generateAcessTokenEfi, Function_getNotificationPaymentEfi } from "../function_global"


type Type_PostEfiBankWebhookBody = {
	pix?: {
		endToEndId: string;
		txid: string;
		chave: string;
		valor: string;
		horario: string;
		gnExtras?: {
			pagador: {
				nome: string;
				cpf: string;
				codigoBanco: string;
			}
		}
	}[];
	notification?: string;
}

export class Class_PostEfiBankWebhook {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Valida token de autenticacao do webhook
			const Const_newUrl = new URL(Parameter_request.url)
			const Const_hmacQuery = Const_newUrl.searchParams.get('hmac')
			if (Const_hmacQuery !== Parameter_env.EnvSecret_tokenWebhookEfiBank) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid or missing webhook authentication token in query parameter', inf: { hmacQuery: Const_hmacQuery, url: Parameter_request.url, body: await Parameter_request.json() }, loc: Function_getFuncionName(), err: true }, 453, 'Unauthorized webhook request')
			}
			// /\ Valida token de autenticacao do webhook

			// \/ Le payload JSON do webhook
			const Const_body = await Parameter_request.json() as Type_PostEfiBankWebhookBody
			let Const_orderUuidWithDashe: string;

			if (Const_body.pix && Array.isArray(Const_body.pix) && Const_body.pix.length > 0) {
				// PIX
				const Const_txidBody = Const_body.pix[0].txid // order_uuid Without Dashe "2f45800d86564b07997e892598e775ba"
				if (typeof Const_txidBody !== 'string') {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook payload: missing txid in pix array', inf: { body: Const_body }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid webhook payload')
				}

				Const_orderUuidWithDashe = Const_txidBody.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5') // order_uuid With Dashe "2f45800d-8656-4b07-997e-892598e775ba"
				if (typeof Const_orderUuidWithDashe !== 'string' || Const_orderUuidWithDashe.length !== 36) {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook payload: txid format is invalid for order UUID', inf: { txid: Const_txidBody }, loc: Function_getFuncionName(), err: true }, 458, 'Invalid webhook payload')
				}
			}

			else if (Const_body.notification) {
				// Cartao de credito
				const Const_generateAcessTokenEfi = await Function_generateAcessTokenEfi(Parameter_env);
				if (Function_isError(Const_generateAcessTokenEfi)) {
					return Function_getResponseError(Const_generateAcessTokenEfi, 454, 'Error generating Efi access token to process notification')
				}

				const Const_notificationData = await Function_getNotificationPaymentEfi(Parameter_env, Const_generateAcessTokenEfi, Const_body.notification);
				if (Function_isError(Const_notificationData)) {
					return Function_getResponseError(Const_notificationData, 455, 'Error getting Efi payment notification detail')
				}

				if (Const_notificationData.currentStatus !== 'paid') {
					console.log(`[INF] [Efi Bank Webhook] [Class_PostEfiBankWebhook] Ignorando notificacao pois status não é paid. Status atual: ${Const_notificationData.currentStatus}`)
					return new Response('Notificação recebida, mas ignorada (status != paid).', { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
				}

				Const_orderUuidWithDashe = Const_notificationData.customId
				if (typeof Const_orderUuidWithDashe !== 'string') {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook notification: missing custom_id', inf: { notificationData: Const_notificationData }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid webhook notification data')
				}
			}

			else {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook payload: missing pix or notification fields', inf: { body: Const_body }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid webhook payload')
			}
			// /\ Le payload JSON do webhook

			// \/ Aparti de txid, busca no order um uuid_order equivalente e pega o content_uuid_array_order
			const Const_orderArray = await Function_getD1(Parameter_env, 'order', 1, 1, ['*'], {
				order_uuid: Const_orderUuidWithDashe
			})
			if (Function_isError(Const_orderArray)) {
				return Function_getResponseError(Const_orderArray, 455, 'Error fetching order by txid from webhook payload')
			}

			const Const_order = Const_orderArray?.[0]
			if (!Const_order) {
				return Function_getResponseError({ typ: 'logical', msg: 'Order not found for txid from webhook payload', inf: { txid: Const_orderUuidWithDashe }, loc: Function_getFuncionName(), err: true }, 456, 'Order not found for webhook payload')
			}

			const Const_contentUuidArrayParsed = JSON.parse(Const_order.content_uuid_array_order || '[]') as string[]
			if (!Array.isArray(Const_contentUuidArrayParsed) || Const_contentUuidArrayParsed.some(Parameter_item => typeof Parameter_item !== 'string')) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid content_uuid_array_order format in order fetched by txid from webhook payload', inf: { content_uuid_array_order: Const_order.content_uuid_array_order }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid order content array format for webhook payload')
			}
			// /\ Aparti de txid, busca no order um uuid_order equivalente e pega o content_uuid_array_order

			// \/ Carrega conteudos
			const Const_contentArraySelected: Array<Type_tableD1ContentGet> = []
			for (const Const_contentUuid of Const_contentUuidArrayParsed) {
				const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
					content_uuid: Const_contentUuid
				})
				if (Function_isError(Const_contentArray)) {
					return Function_getResponseError(Const_contentArray, 457, 'Error fetching content by UUID from order content array')
				}

				const Const_content = Const_contentArray?.[0]
				if (!Const_content) {
					return Function_getResponseError({ typ: 'logical', msg: 'Content not found for UUID from order content array', inf: { contentUuid: Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 458, 'Content not found for order content array')
				}

				Const_contentArraySelected.push(Const_content)
			}

			if (Const_contentArraySelected.length === 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'No valid content found for any UUID from order content array', inf: { contentUuidArray: Const_contentUuidArrayParsed }, loc: Function_getFuncionName(), err: true }, 459, 'No valid content found for order content array')
			}
			// /\ Carrega conteudos

			// \/ Para cada conteudo, voce deve criar um sale_history
			for (const Const_content of Const_contentArraySelected) {
				const Const_saleHistoryCreated = await Function_postD1(Parameter_env, 'sale_history', {
					sale_history_uuid: crypto.randomUUID(),

					student_uuid_seller_sale_history: Const_content.student_uuid_content,
					student_uuid_buyer_sale_history: Const_order.student_uuid_buyer_order,
					content_uuid_sale_history: Const_content.content_uuid,

					information_content_sale_history: JSON.stringify(Const_content),

					status_sale_history: 'completed'
				}, ['*'])
				if (Function_isError(Const_saleHistoryCreated)) {
					return Function_getResponseError(Const_saleHistoryCreated, 458, 'Error creating sale history for content from order after payment webhook')
				}
			}
			// /\ Para cada conteudo, voce deve criar um sale_history

			// \/ Atualiza o order para status 'completed' e seta webhook_payload_order
			const Const_orderUpdated = await Function_patchD1(Parameter_env, 'order', {
				status_order: 'completed',
				webhook_payload_order: JSON.stringify(Const_body)
			}, {
				order_uuid: Const_order.order_uuid
			}, ['*'])
			if (Function_isError(Const_orderUpdated)) {
				return Function_getResponseError(Const_orderUpdated, 459, 'Error updating order status to completed with webhook payload')
			}
			// /\ Atualiza o order para status 'completed' e seta webhook_payload_order

			return new Response(`Pagamento do ${Const_orderUuidWithDashe} processado com sucesso!`, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error in Efi Bank webhook endpoint', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
