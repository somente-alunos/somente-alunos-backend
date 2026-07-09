import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1, Function_postD1, Function_generateAcessTokenEfi, Function_getNotificationPaymentEfi, Function_generateAcessTokenEfiLinkPayment } from "../function_global"


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
	evento?: string;
}

export class Class_PostEfiBankWebhook {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Valida token de autenticacao do webhook
			const Const_newUrl = new URL(Parameter_request.url)
			// /\ Valida token de autenticacao do webhook

			// \/ Le payload JSON do webhook
			let Let_body: string | Type_PostEfiBankWebhookBody = await Parameter_request.text()
			let Const_orderedUuidWithDashe: string;

			// tenta fazer parse JSON se nao consegui entao é cartao de credito notification=2055ce94-383c-4f74-b77d-65610adc3e0c
			try {
				Let_body = JSON.parse(Let_body) as Type_PostEfiBankWebhookBody
			}
			catch (Parameter_error) {
				console.log(`[INF] [Efi Bank Webhook] [Class_PostEfiBankWebhook] Webhook payload is not valid JSON, treating as credit card notification. Payload: ${Let_body}`)
			}

			if (typeof Let_body === 'object' && Let_body.pix && Array.isArray(Let_body.pix) && Let_body.pix.length > 0) {
				// PIX
				const Const_hmacQuery = Const_newUrl.searchParams.get('hmac')
				if (Const_hmacQuery !== Parameter_env.EnvSecret_tokenWebhookEfiBank) {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid or missing webhook authentication token in query parameter', inf: { hmacQuery: Const_hmacQuery, url: Parameter_request.url }, loc: Function_getFuncionName(), err: true }, 453, 'Unauthorized webhook request')
				}

				const Const_txidBody = Let_body.pix[0].txid // ordered_uuid Without Dashe "2f45800d86564b07997e892598e775ba"
				if (typeof Const_txidBody !== 'string') {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook payload: missing txid in pix array', inf: { body: Let_body }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid webhook payload')
				}

				Const_orderedUuidWithDashe = Const_txidBody.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5') // ordered_uuid With Dashe "2f45800d-8656-4b07-997e-892598e775ba"
				if (typeof Const_orderedUuidWithDashe !== 'string' || Const_orderedUuidWithDashe.length !== 36) {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook payload: txid format is invalid for ordered UUID', inf: { txid: Const_txidBody }, loc: Function_getFuncionName(), err: true }, 458, 'Invalid webhook payload')
				}
			}

			else if (typeof Let_body === 'string' && Let_body.includes('notification=')) {
				const Const_notificationUuid = Let_body.split('notification=')[1].trim()
				if (!Const_notificationUuid) {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook payload: missing notification UUID in body string', inf: { body: Let_body }, loc: Function_getFuncionName(), err: true }, 454, 'Invalid webhook payload')
				}

				// Cartao de credito
				const Const_generateAcessTokenEfi = await Function_generateAcessTokenEfiLinkPayment(Parameter_env);
				if (Function_isError(Const_generateAcessTokenEfi)) {
					return Function_getResponseError(Const_generateAcessTokenEfi, 454, 'Error generating Efi access token to process notification')
				}

				const Const_notificationData = await Function_getNotificationPaymentEfi(Parameter_env, Const_generateAcessTokenEfi, Const_notificationUuid);
				if (Function_isError(Const_notificationData)) {
					return Function_getResponseError(Const_notificationData, 455, 'Error getting Efi payment notification detail')
				}

				if (Const_notificationData.currentStatus !== 'paid') {
					console.log(`[INF] [Efi Bank Webhook] [Class_PostEfiBankWebhook] Ignorando notificacao pois status não é paid. Status atual: ${Const_notificationData.currentStatus}`)
					return new Response('Notificação recebida, mas ignorada (status != paid).', { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
				}

				Const_orderedUuidWithDashe = Const_notificationData.customId
				if (typeof Const_orderedUuidWithDashe !== 'string') {
					return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook notification: missing custom_id', inf: { notificationData: Const_notificationData }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid webhook notification data')
				}
			}

			else if (typeof Let_body === 'object' && Let_body.evento === 'teste_webhook') {
				console.log(`[INF] [Efi Bank Webhook] [Class_PostEfiBankWebhook] Webhook de teste recebido com sucesso.`)
				return new Response('Webhook de teste recebido com sucesso.', { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
			}

			else {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid webhook payload: missing pix or notification fields', inf: { body: Let_body }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid webhook payload')
			}
			// /\ Le payload JSON do webhook

			// \/ Aparti de txid, busca no ordered um uuid_ordered equivalente e pega o content_uuid_array_ordered
			const Const_orderedArray = await Function_getD1(Parameter_env, 'ordered', 1, 1, ['*'], {
				ordered_uuid: Const_orderedUuidWithDashe
			})
			if (Function_isError(Const_orderedArray)) {
				return Function_getResponseError(Const_orderedArray, 455, 'Error fetching ordered by txid from webhook payload')
			}

			const Const_ordered = Const_orderedArray?.[0]
			if (!Const_ordered) {
				return Function_getResponseError({ typ: 'logical', msg: 'Ordered not found for txid from webhook payload', inf: { txid: Const_orderedUuidWithDashe }, loc: Function_getFuncionName(), err: true }, 456, 'Ordered not found for webhook payload')
			}

			const Const_contentUuidArrayParsed = JSON.parse(Const_ordered.content_uuid_array_ordered || '[]') as string[]
			if (!Array.isArray(Const_contentUuidArrayParsed) || Const_contentUuidArrayParsed.some(Parameter_item => typeof Parameter_item !== 'string')) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid content_uuid_array_ordered format in ordered fetched by txid from webhook payload', inf: { content_uuid_array_ordered: Const_ordered.content_uuid_array_ordered }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid ordered content array format for webhook payload')
			}
			// /\ Aparti de txid, busca no ordered um uuid_ordered equivalente e pega o content_uuid_array_ordered

			// \/ Carrega conteudos
			const Const_contentArraySelected: Array<Type_tableD1ContentGet> = []
			for (const Const_contentUuid of Const_contentUuidArrayParsed) {
				const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
					content_uuid: Const_contentUuid
				})
				if (Function_isError(Const_contentArray)) {
					return Function_getResponseError(Const_contentArray, 457, 'Error fetching content by UUID from ordered content array')
				}

				const Const_content = Const_contentArray?.[0]
				if (!Const_content) {
					return Function_getResponseError({ typ: 'logical', msg: 'Content not found for UUID from ordered content array', inf: { contentUuid: Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 458, 'Content not found for ordered content array')
				}

				Const_contentArraySelected.push(Const_content)
			}

			if (Const_contentArraySelected.length === 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'No valid content found for any UUID from ordered content array', inf: { contentUuidArray: Const_contentUuidArrayParsed }, loc: Function_getFuncionName(), err: true }, 459, 'No valid content found for ordered content array')
			}
			// /\ Carrega conteudos

			// \/ Para cada conteudo, você deve criar um sale_history
			for (const Const_content of Const_contentArraySelected) {
				const Const_saleHistoryCreated = await Function_postD1(Parameter_env, 'sale_history', {
					sale_history_uuid: crypto.randomUUID(),

					student_uuid_seller_sale_history: Const_content.student_uuid_content,
					student_uuid_buyer_sale_history: Const_ordered.student_uuid_buyer_ordered,
					content_uuid_sale_history: Const_content.content_uuid,

					information_content_sale_history: JSON.stringify(Const_content),

					status_sale_history: 'completed'
				}, ['*'])
				if (Function_isError(Const_saleHistoryCreated)) {
					return Function_getResponseError(Const_saleHistoryCreated, 458, 'Error creating sale history for content from ordered after payment webhook')
				}
			}
			// /\ Para cada conteudo, você deve criar um sale_history

			// \/ Atualiza o ordered para status 'completed' e seta webhook_payload_ordered
			const Const_orderedUpdated = await Function_patchD1(Parameter_env, 'ordered', {
				status_ordered: 'completed',
				webhook_payload_ordered: JSON.stringify(Let_body)
			}, {
				ordered_uuid: Const_ordered.ordered_uuid
			}, ['*'])
			if (Function_isError(Const_orderedUpdated)) {
				return Function_getResponseError(Const_orderedUpdated, 459, 'Error updating ordered status to completed with webhook payload')
			}
			// /\ Atualiza o ordered para status 'completed' e seta webhook_payload_ordered

			return new Response(`Pagamento do ${Const_orderedUuidWithDashe} processado com sucesso!`, { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			console.log('Parameter_error', Parameter_error)
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error in Efi Bank webhook endpoint', inf: { Parameter_error, Parameter_context, Parameter_request }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
