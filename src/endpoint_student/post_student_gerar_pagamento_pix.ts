import { Function_createEfiBankCobByTxid, Function_generateEfiBankAccessToken, Function_generateEfiBankTxid, Function_getD1, Function_getEfiBankAliasOrUndefined, Function_getFuncionName, Function_getResponseError, Function_getStudentAcquiredContentUuidArray, Function_getStudentAuthenticated, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1, Function_postD1 } from "../function_global"


type Type_PostStudentGerarPagamentoPixBody = {
	contentUuidArray?: Array<Type_tableD1ContentGet['content_uuid']>;
	content_uuid_array?: Array<Type_tableD1ContentGet['content_uuid']>;
	efiBankAlias?: Type_efiBankAlias;
}

type Type_PostStudentGerarPagamentoPixResponse = {
	payment: {
		pixPaymentUuid: Type_tableD1PixPaymentGet['pix_payment_uuid'];
		txid: Type_tableD1PixPaymentGet['txid_pix_payment'];
		efiBankAlias: Type_efiBankAlias;
		totalAmountPixPayment: Type_tableD1PixPaymentGet['total_amount_pix_payment'];
		statusPixPayment: Type_tableD1PixPaymentGet['status_pix_payment'];
		expiresInSeconds: number;
		chargeStatus: string | null;
		location: string | null;
		copyAndPaste: string;
	};
	contentArray: Array<Type_objectStudentContentResponse>;
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

function Function_getContentUuidArrayFromBody(Parameter_body: Type_PostStudentGerarPagamentoPixBody): Array<Type_tableD1ContentGet['content_uuid']> {
	const Const_contentUuidArrayRaw = Array.isArray(Parameter_body.contentUuidArray)
		? Parameter_body.contentUuidArray
		: Array.isArray(Parameter_body.content_uuid_array)
			? Parameter_body.content_uuid_array
			: []

	const Const_contentUuidArrayFormatted: Array<Type_tableD1ContentGet['content_uuid']> = []
	for (const Const_contentUuidRaw of Const_contentUuidArrayRaw) {
		const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_contentUuidRaw)
		if (typeof Const_contentUuid === 'string' && !Const_contentUuidArrayFormatted.includes(Const_contentUuid)) {
			Const_contentUuidArrayFormatted.push(Const_contentUuid)
		}
	}

	return Const_contentUuidArrayFormatted
}

async function Function_patchPixPaymentStatusFailedByBestEffort(Parameter_env: Env, Parameter_pixPaymentUuid: Type_tableD1PixPaymentGet['pix_payment_uuid'], Parameter_failureReason: unknown): Promise<void> {
	const Const_pixPaymentUpdated = await Function_patchD1(Parameter_env, 'pix_payment', {
		status_pix_payment: 'failed',
		webhook_payload_pix_payment: JSON.stringify({ reason: Parameter_failureReason })
	}, {
		pix_payment_uuid: Parameter_pixPaymentUuid
	}, ['pix_payment_uuid'])
	if (Function_isError(Const_pixPaymentUpdated)) {
		console.log(`> ERROR [${Const_pixPaymentUpdated.typ}] loc: [${Const_pixPaymentUpdated.loc}] msg: [${Const_pixPaymentUpdated.msg}] inf: ${JSON.stringify(Const_pixPaymentUpdated.inf)}`)
	}
}


export class Class_PostStudentGerarPagamentoPix {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Le body e valida entrada obrigatoria
			let Const_bodyUnknown: unknown
			try {
				Const_bodyUnknown = await Parameter_request.json()
			}

			catch (Parameter_error) {
				return Function_getResponseError({ typ: 'catch', msg: 'Invalid JSON body', inf: Parameter_error, loc: Function_getFuncionName(), err: true }, 452, 'Invalid JSON body')
			}

			if (typeof Const_bodyUnknown !== 'object' || Const_bodyUnknown === null) {
				return Function_getResponseError({ typ: 'logical', msg: 'Body must be a valid object', inf: { Const_bodyUnknown }, loc: Function_getFuncionName(), err: true }, 453, 'Body must be object')
			}

			const Const_body = Const_bodyUnknown as Type_PostStudentGerarPagamentoPixBody
			const Const_contentUuidArray = Function_getContentUuidArrayFromBody(Const_body)
			const Const_efiBankAlias = Function_getEfiBankAliasOrUndefined(Const_body.efiBankAlias)
			if (Object.prototype.hasOwnProperty.call(Const_body, 'efiBankAlias') && !Const_efiBankAlias) {
				return Function_getResponseError({ typ: 'logical', msg: 'efiBankAlias must be gp, rp or rc when provided', inf: { efiBankAlias: Const_body.efiBankAlias }, loc: Function_getFuncionName(), err: true }, 454, 'Invalid efiBankAlias')
			}
			if (Const_contentUuidArray.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'contentUuidArray or content_uuid_array must contain at least one content UUID', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 455, 'Missing required body fields')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Impede gerar pagamento para conteudo ja adquirido
			const Const_acquiredContentUuidArray = await Function_getStudentAcquiredContentUuidArray(Parameter_env, Const_studentAuthenticated.student_uuid)
			if (Function_isError(Const_acquiredContentUuidArray)) {
				return Function_getResponseError(Const_acquiredContentUuidArray, 456, 'Error fetching acquired content')
			}

			for (const Const_contentUuid of Const_contentUuidArray) {
				if (Const_acquiredContentUuidArray.includes(Const_contentUuid)) {
					return Function_getResponseError({ typ: 'logical', msg: 'Content already acquired cannot be purchased again', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 457, 'Content already acquired')
				}
			}
			// /\ Impede gerar pagamento para conteudo ja adquirido

			// \/ Carrega conteudos e calcula valor total
			const Const_contentArraySelected: Array<Type_tableD1ContentGet> = []
			let Let_totalAmount = 0
			for (const Const_contentUuid of Const_contentUuidArray) {
				const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
					content_uuid: Const_contentUuid,
					verified_content: 1
				})
				if (Function_isError(Const_contentArray)) {
					return Function_getResponseError(Const_contentArray, 458, 'Error fetching content to generate PIX payment')
				}

				const Const_content = Const_contentArray?.[0]
				if (!Const_content) {
					return Function_getResponseError({ typ: 'logical', msg: 'Content from informed UUID list was not found or not approved', inf: { Const_contentUuid }, loc: Function_getFuncionName(), err: true }, 459, 'Content not found')
				}

				if (Const_content.student_uuid_content === Const_studentAuthenticated.student_uuid) {
					return Function_getResponseError({ typ: 'logical', msg: 'Student cannot buy own content', inf: { Const_contentUuid, studentUuid: Const_studentAuthenticated.student_uuid }, loc: Function_getFuncionName(), err: true }, 460, 'Content cannot be purchased')
				}

				Const_contentArraySelected.push(Const_content)
				Let_totalAmount += Const_content.current_price_content
			}
			if (!(Let_totalAmount > 0)) {
				return Function_getResponseError({ typ: 'logical', msg: 'Total payment amount must be greater than zero', inf: { Let_totalAmount, Const_contentUuidArray }, loc: Function_getFuncionName(), err: true }, 461, 'Invalid total payment amount')
			}
			// /\ Carrega conteudos e calcula valor total

			// \/ Gera access token da Efi e cria registro local da cobranca
			const Const_efiAccess = await Function_generateEfiBankAccessToken(Parameter_env, Const_efiBankAlias)
			if (Function_isError(Const_efiAccess)) {
				return Function_getResponseError(Const_efiAccess, 462, 'Error generating Efi access token')
			}

			const Const_contentUuidArrayJson = JSON.stringify(Const_contentUuidArray)
			const Const_pixPaymentUuid = crypto.randomUUID()
			let Let_txid = ''
			let Let_pixPaymentCreated: Type_tableD1PixPaymentGet | undefined
			let Let_attempt = 0
			while (!Let_pixPaymentCreated && Let_attempt < 10) {
				Let_attempt += 1
				Let_txid = Function_generateEfiBankTxid(`${Const_studentAuthenticated.student_uuid}${Let_attempt}`)
				const Const_pixPaymentCreatedTry = await Function_postD1(Parameter_env, 'pix_payment', {
					pix_payment_uuid: Const_pixPaymentUuid,
					txid_pix_payment: Let_txid,
					student_uuid_buyer_pix_payment: Const_studentAuthenticated.student_uuid,
					content_uuid_array_pix_payment: Const_contentUuidArrayJson,
					total_amount_pix_payment: Number(Let_totalAmount.toFixed(2)),
					status_pix_payment: 'waiting_payment',
					efi_bank_alias_pix_payment: Const_efiAccess.efiBankAlias
				}, ['*'])
				if (Function_isError(Const_pixPaymentCreatedTry)) {
					const Const_errorString = JSON.stringify(Const_pixPaymentCreatedTry.inf || '').toLowerCase()
					const Const_isDuplicatedTxid = Const_errorString.includes('txid_pix_payment') && Const_errorString.includes('unique')
					if (Const_isDuplicatedTxid) {
						continue
					}

					return Function_getResponseError(Const_pixPaymentCreatedTry, 463, 'Error creating pix_payment row')
				}

				Let_pixPaymentCreated = Const_pixPaymentCreatedTry
			}
			if (!Let_pixPaymentCreated || !Function_getTrimmedStringOrUndefined(Let_txid)) {
				return Function_getResponseError({ typ: 'logical', msg: 'Could not create unique txid for pix_payment after 10 attempts', inf: { Const_studentUuid: Const_studentAuthenticated.student_uuid, Let_attempt }, loc: Function_getFuncionName(), err: true }, 464, 'Payment txid generation limit reached')
			}
			// /\ Gera access token da Efi e cria registro local da cobranca

			// \/ Cria cobranca na Efi
			const Const_amountOriginal = Number(Let_totalAmount.toFixed(2)).toFixed(2)
			const Const_contentNameSample = Const_contentArraySelected[0]?.name_content || 'conteudo'
			const Const_solicitacaoPagador = Const_contentArraySelected.length > 1
				? `Compra de ${Const_contentArraySelected.length} conteudos - ${Const_contentNameSample}`
				: `Compra de conteudo - ${Const_contentNameSample}`
			const Const_efiCob = await Function_createEfiBankCobByTxid(Const_efiAccess, Let_txid, Const_amountOriginal, Const_solicitacaoPagador, 48 * 60 * 60)
			if (Function_isError(Const_efiCob)) {
				await Function_patchPixPaymentStatusFailedByBestEffort(Parameter_env, Const_pixPaymentUuid, { source: 'create_cob', error: Const_efiCob })
				return Function_getResponseError(Const_efiCob, 465, 'Error creating PIX charge on Efi')
			}

			const Const_copyAndPaste = Function_getTrimmedStringOrUndefined(Const_efiCob.pixCopiaECola)
			if (typeof Const_copyAndPaste !== 'string') {
				await Function_patchPixPaymentStatusFailedByBestEffort(Parameter_env, Const_pixPaymentUuid, { source: 'create_cob_response', error: 'pixCopiaECola_not_returned', response: Const_efiCob })
				return Function_getResponseError({ typ: 'logical', msg: 'Efi charge did not return pixCopiaECola', inf: { Let_txid, Const_efiCob }, loc: Function_getFuncionName(), err: true }, 466, 'Invalid Efi charge response')
			}
			// /\ Cria cobranca na Efi

			const Const_contentArrayResponse: Array<Type_objectStudentContentResponse> = []
			for (const Const_content of Const_contentArraySelected) {
				Const_contentArrayResponse.push(Function_mapContentGetToObjectStudentContentResponse(Const_content))
			}

			const Const_expirationRaw = Const_efiCob.calendario?.expiracao
			const Const_expirationSeconds = typeof Const_expirationRaw === 'number'
				? Const_expirationRaw
				: typeof Const_expirationRaw === 'string'
					? Number(Const_expirationRaw)
					: 48 * 60 * 60

			const Const_responseBody: Type_PostStudentGerarPagamentoPixResponse = {
				payment: {
					pixPaymentUuid: Const_pixPaymentUuid,
					txid: Let_txid,
					efiBankAlias: Const_efiAccess.efiBankAlias,
					totalAmountPixPayment: Number(Let_totalAmount.toFixed(2)),
					statusPixPayment: 'waiting_payment',
					expiresInSeconds: Number.isFinite(Const_expirationSeconds) ? Const_expirationSeconds : 48 * 60 * 60,
					chargeStatus: Function_getTrimmedStringOrUndefined(Const_efiCob.status) || null,
					location: Function_getTrimmedStringOrUndefined(Const_efiCob.location) || null,
					copyAndPaste: Const_copyAndPaste
				},
				contentArray: Const_contentArrayResponse
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error generating student PIX payment', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
