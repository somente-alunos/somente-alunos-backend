import { Function_getD1, Function_getEfiWebhookToken, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1, Function_postD1 } from "../function_global"


type Type_PostEfiBankWebhookResponse = {
	success: true;
	processedTxidArray: Array<string>;
	ignoredTxidArray: Array<string>;
	failedTxidArray: Array<string>;
	createdSaleHistoryCount: number;
}

function Function_mapContentGetToObjectStudentContentResponse(Parameter_contentGet: Type_tableD1ContentGet): Type_objectStudentContentResponse {
	return {
		content_uuid: Parameter_contentGet.content_uuid,
		content_update: Parameter_contentGet.content_update,
		name_content: Parameter_contentGet.name_content,
		student_uuid_content: Parameter_contentGet.student_uuid_content,
		old_price_content: Parameter_contentGet.old_price_content,
		current_price_content: Parameter_contentGet.current_price_content,
		preview_file_uuid_content: Parameter_contentGet.preview_file_uuid_content,
		full_file_uuid_content: Parameter_contentGet.full_file_uuid_content,
		college_uuid_content: Parameter_contentGet.college_uuid_content,
		course_uuid_content: Parameter_contentGet.course_uuid_content,
		prevision_content: Parameter_contentGet.prevision_content,
		verified_content: Parameter_contentGet.verified_content ? 1 : 0
	}
}

async function Function_patchPixPaymentByBestEffort(Parameter_env: Env, Parameter_pixPaymentUuid: Type_tableD1PixPaymentGet['pix_payment_uuid'], Parameter_dataUpdate: Partial<Type_tableD1PixPaymentGet>): Promise<void> {
	const Const_pixPaymentUpdated = await Function_patchD1(Parameter_env, 'pix_payment', Parameter_dataUpdate, { pix_payment_uuid: Parameter_pixPaymentUuid }, ['pix_payment_uuid'])
	if (Function_isError(Const_pixPaymentUpdated)) {
		console.log(`> ERROR [${Const_pixPaymentUpdated.typ}] loc: [${Const_pixPaymentUpdated.loc}] msg: [${Const_pixPaymentUpdated.msg}] inf: ${JSON.stringify(Const_pixPaymentUpdated.inf)}`)
	}
}


export class Class_PostEfiBankWebhook {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Valida token de autenticacao do webhook
			const Const_webhookTokenExpected = Function_getEfiWebhookToken(Parameter_env)
			if (Function_isError(Const_webhookTokenExpected)) {
				return Function_getResponseError(Const_webhookTokenExpected, 451, 'Invalid Efi webhook token on environment')
			}

			const Const_newUrl = new URL(Parameter_request.url)
			const Const_webhookTokenReceived = Function_getTrimmedStringOrUndefined(Const_newUrl.searchParams.get('token'))
			if (typeof Const_webhookTokenReceived !== 'string' || Const_webhookTokenReceived !== Const_webhookTokenExpected) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid token for Efi webhook callback', inf: { searchParams: [...Const_newUrl.searchParams.entries()] }, loc: Function_getFuncionName(), err: true }, 452, 'Unauthorized webhook token')
			}
			// /\ Valida token de autenticacao do webhook

			// \/ Le payload JSON do webhook
			let Const_bodyUnknown: unknown
			try {
				Const_bodyUnknown = await Parameter_request.json()
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid JSON body from Efi webhook', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 453, 'Invalid JSON body')
			}

			if (typeof Const_bodyUnknown !== 'object' || Const_bodyUnknown === null) {
				return Function_getResponseError({ typ: 'logical', msg: 'Webhook body must be a valid object', inf: { Const_bodyUnknown }, loc: Function_getFuncionName(), err: true }, 454, 'Body must be object')
			}

			const Const_body = Const_bodyUnknown as Type_efiBankWebhookPayload
			const Const_pixArray = Array.isArray(Const_body.pix) ? Const_body.pix : []
			// /\ Le payload JSON do webhook

			// \/ Processa pix[] e conclui pagamentos pendentes
			const Const_processedTxidArray: Array<string> = []
			const Const_ignoredTxidArray: Array<string> = []
			const Const_failedTxidArray: Array<string> = []
			let Let_createdSaleHistoryCount = 0
			for (const Const_pixSingle of Const_pixArray) {
				const Const_txid = Function_getTrimmedStringOrUndefined(Const_pixSingle?.txid)
				if (typeof Const_txid !== 'string') {
					Const_ignoredTxidArray.push('txid_empty')
					continue
				}

				const Const_pixPaymentArray = await Function_getD1(Parameter_env, 'pix_payment', 1, 1, ['*'], { txid_pix_payment: Const_txid })
				if (Function_isError(Const_pixPaymentArray)) {
					return Function_getResponseError(Const_pixPaymentArray, 455, 'Error fetching pix_payment by txid')
				}

				const Const_pixPayment = Const_pixPaymentArray?.[0]
				if (!Const_pixPayment) {
					Const_ignoredTxidArray.push(Const_txid)
					continue
				}

				if (Const_pixPayment.status_pix_payment === 'completed') {
					Const_ignoredTxidArray.push(Const_txid)
					continue
				}

				let Let_contentUuidArray: Array<string> = []
				try {
					const Const_contentUuidArrayUnknown = JSON.parse(Const_pixPayment.content_uuid_array_pix_payment)
					if (Array.isArray(Const_contentUuidArrayUnknown)) {
						for (const Const_contentUuidRaw of Const_contentUuidArrayUnknown) {
							const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_contentUuidRaw)
							if (typeof Const_contentUuid === 'string' && !Let_contentUuidArray.includes(Const_contentUuid)) {
								Let_contentUuidArray.push(Const_contentUuid)
							}
						}
					}
				}
				catch { }
				if (Let_contentUuidArray.length <= 0) {
					Const_failedTxidArray.push(Const_txid)
					await Function_patchPixPaymentByBestEffort(Parameter_env, Const_pixPayment.pix_payment_uuid, { status_pix_payment: 'failed', webhook_payload_pix_payment: JSON.stringify({ reason: 'invalid_content_uuid_array_json', body: Const_body }) })
					continue
				}

				const Const_studentBuyerArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], { student_uuid: Const_pixPayment.student_uuid_buyer_pix_payment })
				if (Function_isError(Const_studentBuyerArray)) {
					return Function_getResponseError(Const_studentBuyerArray, 456, 'Error validating buyer from pix_payment')
				}
				if (Const_studentBuyerArray.length <= 0) {
					Const_failedTxidArray.push(Const_txid)
					await Function_patchPixPaymentByBestEffort(Parameter_env, Const_pixPayment.pix_payment_uuid, { status_pix_payment: 'failed', webhook_payload_pix_payment: JSON.stringify({ reason: 'buyer_not_found', body: Const_body }) })
					continue
				}

				let Let_isValidPayment = true
				for (const Const_contentUuid of Let_contentUuidArray) {
					const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
						content_uuid: Const_contentUuid,
						verified_content: 1
					})
					if (Function_isError(Const_contentArray)) {
						return Function_getResponseError(Const_contentArray, 457, 'Error fetching content to create sale_history')
					}

					const Const_content = Const_contentArray?.[0]
					if (!Const_content) {
						Let_isValidPayment = false
						continue
					}

					const Const_saleHistoryAlreadyCompletedArray = await Function_getD1(Parameter_env, 'sale_history', 1, 1, ['sale_history_uuid'], {
						student_uuid_buyer_sale_history: Const_pixPayment.student_uuid_buyer_pix_payment,
						content_uuid_sale_history: Const_contentUuid,
						status_sale_history: 'completed'
					})
					if (Function_isError(Const_saleHistoryAlreadyCompletedArray)) {
						return Function_getResponseError(Const_saleHistoryAlreadyCompletedArray, 458, 'Error checking duplicated sale_history by buyer/content')
					}
					if (Const_saleHistoryAlreadyCompletedArray.length > 0) {
						continue
					}

					const Const_saleHistoryCreated = await Function_postD1(Parameter_env, 'sale_history', {
						sale_history_uuid: crypto.randomUUID(),
						student_uuid_seller_sale_history: Const_content.student_uuid_content,
						student_uuid_buyer_sale_history: Const_pixPayment.student_uuid_buyer_pix_payment,
						content_uuid_sale_history: Const_contentUuid,
						information_content_sale_history: JSON.stringify(Function_mapContentGetToObjectStudentContentResponse(Const_content)),
						status_sale_history: 'completed',
						paid_to_seller_sale_history: null
					}, ['sale_history_uuid'])
					if (Function_isError(Const_saleHistoryCreated)) {
						return Function_getResponseError(Const_saleHistoryCreated, 459, 'Error creating sale_history from Efi webhook')
					}

					Let_createdSaleHistoryCount += 1
				}

				if (!Let_isValidPayment) {
					Const_failedTxidArray.push(Const_txid)
					await Function_patchPixPaymentByBestEffort(Parameter_env, Const_pixPayment.pix_payment_uuid, { status_pix_payment: 'failed', webhook_payload_pix_payment: JSON.stringify({ reason: 'content_not_found', body: Const_body }) })
					continue
				}

				await Function_patchPixPaymentByBestEffort(Parameter_env, Const_pixPayment.pix_payment_uuid, {
					status_pix_payment: 'completed',
					e2e_id_pix_payment: Function_getTrimmedStringOrUndefined(Const_pixSingle?.endToEndId) || null,
					webhook_payload_pix_payment: JSON.stringify(Const_body)
				})
				Const_processedTxidArray.push(Const_txid)
			}
			// /\ Processa pix[] e conclui pagamentos pendentes

			const Const_responseBody: Type_PostEfiBankWebhookResponse = {
				success: true,
				processedTxidArray: Const_processedTxidArray,
				ignoredTxidArray: Const_ignoredTxidArray,
				failedTxidArray: Const_failedTxidArray,
				createdSaleHistoryCount: Let_createdSaleHistoryCount
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error in Efi Bank webhook endpoint', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
