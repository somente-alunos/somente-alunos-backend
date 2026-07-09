
import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_patchD1 } from "../function_global"


type Type_PatchAdminHistoricoPagamentoBody = {
	sale_history_uuid: string;
	student_uuid_seller_sale_history?: string;
	student_uuid_buyer_sale_history?: string;
	content_uuid_sale_history?: string;
	information_content_sale_history?: unknown;
	status_sale_history?: string;
	paid_to_seller_sale_history?: string | null;
}

type Type_PatchAdminHistoricoPagamentoResponse = {
	saleHistory: Type_objectAdminSaleHistoryResponse;
}


export class Class_PatchAdminHistoricoPagamento {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

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

			const Const_body = Const_bodyUnknown as Partial<Type_PatchAdminHistoricoPagamentoBody>
			const Const_saleHistoryUuid = Function_getTrimmedStringOrUndefined(Const_body.sale_history_uuid)
			if (typeof Const_saleHistoryUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'sale_history_uuid is required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing sale_history_uuid')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Garante que historico existe
			const Const_saleHistoryArray = await Function_getD1(Parameter_env, 'sale_history', 1, 1, ['*'], {
				sale_history_uuid: Const_saleHistoryUuid
			})
			if (Function_isError(Const_saleHistoryArray)) {
				return Function_getResponseError(Const_saleHistoryArray, 455, 'Error fetching sale_history to patch')
			}

			const Const_saleHistory = Const_saleHistoryArray?.[0]
			if (!Const_saleHistory) {
				return Function_getResponseError({ typ: 'logical', msg: 'sale_history_uuid was not found', inf: { Const_saleHistoryUuid }, loc: Function_getFuncionName(), err: true }, 456, 'sale_history not found')
			}
			// /\ Garante que historico existe

			// \/ Valida campos opcionais
			const Const_hasStudentUuidSellerSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'student_uuid_seller_sale_history')
			const Const_hasStudentUuidBuyerSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'student_uuid_buyer_sale_history')
			const Const_hasContentUuidSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'content_uuid_sale_history')
			const Const_hasInformationContentSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'information_content_sale_history')
			const Const_hasStatusSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'status_sale_history')
			const Const_hasPaidToSellerSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'paid_to_seller_sale_history')

			if (!Const_hasStudentUuidSellerSaleHistory && !Const_hasStudentUuidBuyerSaleHistory && !Const_hasContentUuidSaleHistory && !Const_hasInformationContentSaleHistory && !Const_hasStatusSaleHistory && !Const_hasPaidToSellerSaleHistory) {
				return Function_getResponseError({ typ: 'logical', msg: 'At least one optional field must be provided to patch sale_history', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 457, 'No fields to patch')
			}

			const Const_studentUuidSellerSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.student_uuid_seller_sale_history)
			if (Const_hasStudentUuidSellerSaleHistory && typeof Const_studentUuidSellerSaleHistory !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_seller_sale_history must be a non-empty string when provided', inf: { student_uuid_seller_sale_history: Const_body.student_uuid_seller_sale_history }, loc: Function_getFuncionName(), err: true }, 458, 'Invalid student_uuid_seller_sale_history')
			}

			const Const_studentUuidBuyerSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.student_uuid_buyer_sale_history)
			if (Const_hasStudentUuidBuyerSaleHistory && typeof Const_studentUuidBuyerSaleHistory !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_buyer_sale_history must be a non-empty string when provided', inf: { student_uuid_buyer_sale_history: Const_body.student_uuid_buyer_sale_history }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid student_uuid_buyer_sale_history')
			}

			const Const_contentUuidSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.content_uuid_sale_history)
			if (Const_hasContentUuidSaleHistory && typeof Const_contentUuidSaleHistory !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid_sale_history must be a non-empty string when provided', inf: { content_uuid_sale_history: Const_body.content_uuid_sale_history }, loc: Function_getFuncionName(), err: true }, 460, 'Invalid content_uuid_sale_history')
			}

			const Const_statusSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.status_sale_history)
			if (Const_hasStatusSaleHistory && typeof Const_statusSaleHistory !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'status_sale_history must be a non-empty string when provided', inf: { status_sale_history: Const_body.status_sale_history }, loc: Function_getFuncionName(), err: true }, 461, 'Invalid status_sale_history')
			}

			let Let_informationContentSaleHistory: string | null | undefined
			if (Const_hasInformationContentSaleHistory) {
				if (Const_body.information_content_sale_history === null) {
					Let_informationContentSaleHistory = null
				}

				else if (typeof Const_body.information_content_sale_history === 'string') {
					const Const_informationContentSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.information_content_sale_history)
					if (typeof Const_informationContentSaleHistory !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'information_content_sale_history must be non-empty string/object/null when provided', inf: { information_content_sale_history: Const_body.information_content_sale_history }, loc: Function_getFuncionName(), err: true }, 462, 'Invalid information_content_sale_history')
					}

					Let_informationContentSaleHistory = Const_informationContentSaleHistory
				}

				else if (typeof Const_body.information_content_sale_history === 'object') {
					try {
						Let_informationContentSaleHistory = JSON.stringify(Const_body.information_content_sale_history)
					}

					catch (Parameter_error) {
						return Function_getResponseError({ typ: 'catch', msg: 'Error serializing information_content_sale_history object', inf: { Parameter_error, information_content_sale_history: Const_body.information_content_sale_history }, loc: Function_getFuncionName(), err: true }, 463, 'Invalid information_content_sale_history')
					}
				}

				else {
					return Function_getResponseError({ typ: 'logical', msg: 'information_content_sale_history must be string/object/null when provided', inf: { information_content_sale_history: Const_body.information_content_sale_history }, loc: Function_getFuncionName(), err: true }, 464, 'Invalid information_content_sale_history')
				}
			}

			let Let_paidToSellerSaleHistory: string | null | undefined
			if (Const_hasPaidToSellerSaleHistory) {
				if (Const_body.paid_to_seller_sale_history === null) {
					Let_paidToSellerSaleHistory = null
				}

				else {
					const Const_paidToSellerSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.paid_to_seller_sale_history)
					if (typeof Const_paidToSellerSaleHistory !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'paid_to_seller_sale_history must be valid ISO date string or null', inf: { paid_to_seller_sale_history: Const_body.paid_to_seller_sale_history }, loc: Function_getFuncionName(), err: true }, 465, 'Invalid paid_to_seller_sale_history')
					}

					const Const_paidToSellerDate = new Date(Const_paidToSellerSaleHistory)
					if (Number.isNaN(Const_paidToSellerDate.getTime())) {
						return Function_getResponseError({ typ: 'logical', msg: 'paid_to_seller_sale_history must be valid ISO date string or null', inf: { paid_to_seller_sale_history: Const_body.paid_to_seller_sale_history }, loc: Function_getFuncionName(), err: true }, 466, 'Invalid paid_to_seller_sale_history')
					}

					Let_paidToSellerSaleHistory = Const_paidToSellerDate.toISOString()
				}
			}
			// /\ Valida campos opcionais

			// \/ Valida referencias opcionais no D1
			if (typeof Const_studentUuidSellerSaleHistory === 'string') {
				const Const_studentSellerArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], {
					student_uuid: Const_studentUuidSellerSaleHistory
				})
				if (Function_isError(Const_studentSellerArray)) {
					return Function_getResponseError(Const_studentSellerArray, 467, 'Error validating student_uuid_seller_sale_history')
				}
				if (Const_studentSellerArray.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_seller_sale_history was not found', inf: { Const_studentUuidSellerSaleHistory }, loc: Function_getFuncionName(), err: true }, 468, 'Invalid student_uuid_seller_sale_history')
				}
			}

			if (typeof Const_studentUuidBuyerSaleHistory === 'string') {
				const Const_studentBuyerArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], {
					student_uuid: Const_studentUuidBuyerSaleHistory
				})
				if (Function_isError(Const_studentBuyerArray)) {
					return Function_getResponseError(Const_studentBuyerArray, 469, 'Error validating student_uuid_buyer_sale_history')
				}
				if (Const_studentBuyerArray.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_buyer_sale_history was not found', inf: { Const_studentUuidBuyerSaleHistory }, loc: Function_getFuncionName(), err: true }, 470, 'Invalid student_uuid_buyer_sale_history')
				}
			}

			if (typeof Const_contentUuidSaleHistory === 'string') {
				const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['content_uuid'], {
					content_uuid: Const_contentUuidSaleHistory
				})
				if (Function_isError(Const_contentArray)) {
					return Function_getResponseError(Const_contentArray, 471, 'Error validating content_uuid_sale_history')
				}
				if (Const_contentArray.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'content_uuid_sale_history was not found', inf: { Const_contentUuidSaleHistory }, loc: Function_getFuncionName(), err: true }, 472, 'Invalid content_uuid_sale_history')
				}
			}
			// /\ Valida referencias opcionais no D1

			// \/ Atualiza sale_history no D1
			const Const_dataUpdate: Partial<Type_tableD1SaleHistoryGet> = {}
			if (typeof Const_studentUuidSellerSaleHistory === 'string') {
				Const_dataUpdate.student_uuid_seller_sale_history = Const_studentUuidSellerSaleHistory
			}
			if (typeof Const_studentUuidBuyerSaleHistory === 'string') {
				Const_dataUpdate.student_uuid_buyer_sale_history = Const_studentUuidBuyerSaleHistory
			}
			if (typeof Const_contentUuidSaleHistory === 'string') {
				Const_dataUpdate.content_uuid_sale_history = Const_contentUuidSaleHistory
			}
			if (typeof Const_statusSaleHistory === 'string') {
				Const_dataUpdate.status_sale_history = Const_statusSaleHistory
			}
			if (Const_hasInformationContentSaleHistory) {
				Const_dataUpdate.information_content_sale_history = Let_informationContentSaleHistory === undefined ? null : Let_informationContentSaleHistory
			}
			if (Const_hasPaidToSellerSaleHistory) {
				Const_dataUpdate.paid_to_seller_sale_history = Let_paidToSellerSaleHistory === undefined ? null : Let_paidToSellerSaleHistory
			}

			const Const_saleHistoryUpdated = await Function_patchD1(Parameter_env, 'sale_history', Const_dataUpdate, {
				sale_history_uuid: Const_saleHistoryUuid
			}, ['*'])
			if (Function_isError(Const_saleHistoryUpdated)) {
				return Function_getResponseError(Const_saleHistoryUpdated, 473, 'Error patching sale_history')
			}
			// /\ Atualiza sale_history no D1

			const Const_responseBody: Type_PatchAdminHistoricoPagamentoResponse = {
				saleHistory: Const_saleHistoryUpdated
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error patching admin sale history', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
