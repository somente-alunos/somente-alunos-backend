import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError, Function_postD1, Function_generateAcessTokenEfi, Function_generateCreatePaymentPixEfi } from "../function_global"


type Type_PostStudentGerarPagamentoPixBody = {
	contentUuidArray: Array<Type_tableD1ContentGet['content_uuid']>;
}

type Type_PostStudentGerarPagamentoPixResponse = {
    pixCopiaECola: string;
	contentUuidArray: Array<Type_tableD1ContentGet['content_uuid']>;
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
			const Const_body = await Parameter_request.json() as Type_PostStudentGerarPagamentoPixBody

			const Const_contentUuidArrayBody = Const_body.contentUuidArray
			if (!Array.isArray(Const_contentUuidArrayBody) || Const_contentUuidArrayBody.some(Parameter_item => typeof Parameter_item !== 'string')) {
				return Function_getResponseError({ typ: 'logical', msg: 'contentUuidArray must be an array of strings', inf: { contentUuidArray: Const_body.contentUuidArray }, loc: Function_getFuncionName(), err: true }, 452, 'Invalid contentUuidArray')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Carrega conteudos e calcula valor total
			const Const_contentArraySelected: Array<Type_tableD1ContentGet> = []
			let Let_totalAmount = 0
			for (const Const_contentUuid of Const_contentUuidArrayBody) {
				const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
					content_uuid: Const_contentUuid
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
				Let_totalAmount += Math.max(0, Const_content.current_price_content)
			}
			if (!(Let_totalAmount > 0)) {
				return Function_getResponseError({ typ: 'logical', msg: 'Total payment amount must be greater than zero', inf: { Let_totalAmount, Const_contentUuidArrayBody }, loc: Function_getFuncionName(), err: true }, 461, 'Invalid total payment amount')
			}
			// /\ Carrega conteudos e calcula valor total

			// \/ Cria order para a cobranca
			const Const_contentUuidArrayBodyString = JSON.stringify(Const_contentUuidArrayBody)
			const Const_orderUuid = crypto.randomUUID()

			const Const_orderCreated = await Function_postD1(Parameter_env, 'order', {
				order_uuid: Const_orderUuid,

				student_uuid_buyer_order: Const_studentAuthenticated.student_uuid,
				content_uuid_array_order: Const_contentUuidArrayBodyString,

				total_amount_order: Number(Let_totalAmount.toFixed(2)),

				status_order: 'waiting'
			}, ['*'])
			if (Function_isError(Const_orderCreated)) {
				return Function_getResponseError(Const_orderCreated, 464, 'Error creating order for PIX charge')
			}
			// /\ Cria order para a cobranca

			// \/ Cria cobranca na Efi
			const Const_generateAcessTokenEfi = await Function_generateAcessTokenEfi(Parameter_env)
			if (Function_isError(Const_generateAcessTokenEfi)) {
				return Function_getResponseError(Const_generateAcessTokenEfi, 465, 'Error generating Efi access token for PIX charge')
			}

			const Const_price = Let_totalAmount.toFixed(2)
			const Const_orderUuidWithoutDashe = Const_orderUuid.replaceAll('-', '')
			const Const_name = `Conteúdo de estudo - Somente Alunos`
			const Const_generateCreatePaymentPixEfi = await Function_generateCreatePaymentPixEfi(Parameter_env, Const_generateAcessTokenEfi, Const_price, Const_orderUuidWithoutDashe, Const_name)
			if (Function_isError(Const_generateCreatePaymentPixEfi)) {
				return Function_getResponseError(Const_generateCreatePaymentPixEfi, 466, 'Error generating Efi PIX charge')
			}
			// /\ Cria cobranca na Efi

			const Const_responseBody: Type_PostStudentGerarPagamentoPixResponse = {
				pixCopiaECola: Const_generateCreatePaymentPixEfi.pixCopiaECola,
				contentUuidArray: Const_contentUuidArrayBody
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error generating student PIX payment', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
