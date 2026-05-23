
import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError, Function_postD1 } from "../function_global"


type Type_PostAdminHistoricoPagamentoBody = {
	sale_history_uuid: string;
	student_uuid_seller_sale_history?: string;
	student_uuid_buyer_sale_history: string;
	content_uuid_sale_history: string;
	information_content_sale_history?: unknown;
	status_sale_history: string;
	paid_to_seller_sale_history?: string | null;
}

type Type_PostAdminHistoricoPagamentoResponse = {
	saleHistory: Type_objectAdminSaleHistoryResponse;
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
		verified_content: Parameter_contentGet.verified_content,
	}
}


export class Class_PostAdminHistoricoPagamento {
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

			const Const_body = Const_bodyUnknown as Partial<Type_PostAdminHistoricoPagamentoBody>
			const Const_saleHistoryUuid = Function_getTrimmedStringOrUndefined(Const_body.sale_history_uuid)
			const Const_studentUuidBuyerSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.student_uuid_buyer_sale_history)
			const Const_contentUuidSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.content_uuid_sale_history)
			const Const_statusSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.status_sale_history)
			const Const_studentUuidSellerSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.student_uuid_seller_sale_history)
			if (typeof Const_saleHistoryUuid !== 'string' || typeof Const_studentUuidBuyerSaleHistory !== 'string' || typeof Const_contentUuidSaleHistory !== 'string' || typeof Const_statusSaleHistory !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'sale_history_uuid, student_uuid_buyer_sale_history, content_uuid_sale_history and status_sale_history are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required body fields')
			}
			if (Object.prototype.hasOwnProperty.call(Const_body, 'student_uuid_seller_sale_history') && typeof Const_studentUuidSellerSaleHistory !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_seller_sale_history must be a non-empty string when provided', inf: { student_uuid_seller_sale_history: Const_body.student_uuid_seller_sale_history }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid student_uuid_seller_sale_history')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Valida paid_to_seller_sale_history e information_content_sale_history opcionais
			const Const_hasPaidToSellerSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'paid_to_seller_sale_history')
			const Const_hasInformationContentSaleHistory = Object.prototype.hasOwnProperty.call(Const_body, 'information_content_sale_history')

			let Let_paidToSellerSaleHistory: string | null | undefined
			if (Const_hasPaidToSellerSaleHistory) {
				if (Const_body.paid_to_seller_sale_history === null) {
					Let_paidToSellerSaleHistory = null
				}

				else {
					const Const_paidToSellerSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.paid_to_seller_sale_history)
					if (typeof Const_paidToSellerSaleHistory !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'paid_to_seller_sale_history must be valid ISO date string or null', inf: { paid_to_seller_sale_history: Const_body.paid_to_seller_sale_history }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid paid_to_seller_sale_history')
					}

					const Const_paidToSellerDate = new Date(Const_paidToSellerSaleHistory)
					if (Number.isNaN(Const_paidToSellerDate.getTime())) {
						return Function_getResponseError({ typ: 'logical', msg: 'paid_to_seller_sale_history must be valid ISO date string or null', inf: { paid_to_seller_sale_history: Const_body.paid_to_seller_sale_history }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid paid_to_seller_sale_history')
					}

					Let_paidToSellerSaleHistory = Const_paidToSellerDate.toISOString()
				}
			}

			let Let_informationContentSaleHistory: string | null | undefined
			if (Const_hasInformationContentSaleHistory) {
				if (Const_body.information_content_sale_history === null) {
					Let_informationContentSaleHistory = null
				}

				else if (typeof Const_body.information_content_sale_history === 'string') {
					const Const_informationContentSaleHistory = Function_getTrimmedStringOrUndefined(Const_body.information_content_sale_history)
					if (typeof Const_informationContentSaleHistory !== 'string') {
						return Function_getResponseError({ typ: 'logical', msg: 'information_content_sale_history must be non-empty string/object/null when provided', inf: { information_content_sale_history: Const_body.information_content_sale_history }, loc: Function_getFuncionName(), err: true }, 458, 'Invalid information_content_sale_history')
					}

					Let_informationContentSaleHistory = Const_informationContentSaleHistory
				}

				else if (typeof Const_body.information_content_sale_history === 'object') {
					try {
						Let_informationContentSaleHistory = JSON.stringify(Const_body.information_content_sale_history)
					}

					catch (Parameter_error) {
						return Function_getResponseError({ typ: 'catch', msg: 'Error serializing information_content_sale_history object', inf: { Parameter_error, information_content_sale_history: Const_body.information_content_sale_history }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid information_content_sale_history')
					}
				}

				else {
					return Function_getResponseError({ typ: 'logical', msg: 'information_content_sale_history must be string/object/null when provided', inf: { information_content_sale_history: Const_body.information_content_sale_history }, loc: Function_getFuncionName(), err: true }, 460, 'Invalid information_content_sale_history')
				}
			}
			// /\ Valida paid_to_seller_sale_history e information_content_sale_history opcionais

			// \/ Valida referencias e unicidade no D1
			const Const_saleHistoryDuplicatedArray = await Function_getD1(Parameter_env, 'sale_history', 1, 1, ['sale_history_uuid'], {
				sale_history_uuid: Const_saleHistoryUuid
			})
			if (Function_isError(Const_saleHistoryDuplicatedArray)) {
				return Function_getResponseError(Const_saleHistoryDuplicatedArray, 461, 'Error validating duplicated sale_history_uuid')
			}
			if (Const_saleHistoryDuplicatedArray.length > 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'sale_history_uuid already exists', inf: { Const_saleHistoryUuid }, loc: Function_getFuncionName(), err: true }, 462, 'Duplicated sale_history_uuid')
			}

			const Const_studentBuyerArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['student_uuid'], {
				student_uuid: Const_studentUuidBuyerSaleHistory
			})
			if (Function_isError(Const_studentBuyerArray)) {
				return Function_getResponseError(Const_studentBuyerArray, 463, 'Error validating student_uuid_buyer_sale_history')
			}
			if (Const_studentBuyerArray.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_buyer_sale_history was not found', inf: { Const_studentUuidBuyerSaleHistory }, loc: Function_getFuncionName(), err: true }, 464, 'Invalid student_uuid_buyer_sale_history')
			}

			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['*'], {
				content_uuid: Const_contentUuidSaleHistory
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 465, 'Error validating content_uuid_sale_history')
			}

			const Const_content = Const_contentArray?.[0]
			if (!Const_content) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid_sale_history was not found', inf: { Const_contentUuidSaleHistory }, loc: Function_getFuncionName(), err: true }, 466, 'Invalid content_uuid_sale_history')
			}

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
			// /\ Valida referencias e unicidade no D1

			// \/ Resolve seller/info e cria sale_history no D1
			const Const_studentUuidSellerFinal = typeof Const_studentUuidSellerSaleHistory === 'string' ? Const_studentUuidSellerSaleHistory : Const_content.student_uuid_content
			if (typeof Const_studentUuidSellerFinal !== 'string' || Const_studentUuidSellerFinal.length <= 0) {
				return Function_getResponseError({ typ: 'logical', msg: 'Unable to resolve student_uuid_seller_sale_history', inf: { Const_studentUuidSellerSaleHistory, contentStudentUuid: Const_content.student_uuid_content }, loc: Function_getFuncionName(), err: true }, 469, 'Unable to resolve student_uuid_seller_sale_history')
			}

			const Const_informationContentSaleHistoryFinal = Let_informationContentSaleHistory !== undefined
				? Let_informationContentSaleHistory
				: JSON.stringify(Function_mapContentGetToObjectStudentContentResponse(Const_content))

			const Const_saleHistoryCreated = await Function_postD1(Parameter_env, 'sale_history', {
				sale_history_uuid: Const_saleHistoryUuid,
				student_uuid_seller_sale_history: Const_studentUuidSellerFinal,
				student_uuid_buyer_sale_history: Const_studentUuidBuyerSaleHistory,
				content_uuid_sale_history: Const_contentUuidSaleHistory,
				information_content_sale_history: Const_informationContentSaleHistoryFinal,
				status_sale_history: Const_statusSaleHistory,
				paid_to_seller_sale_history: Let_paidToSellerSaleHistory
			}, ['*'])
			if (Function_isError(Const_saleHistoryCreated)) {
				return Function_getResponseError(Const_saleHistoryCreated, 470, 'Error creating sale_history')
			}
			// /\ Resolve seller/info e cria sale_history no D1

			const Const_responseBody: Type_PostAdminHistoricoPagamentoResponse = {
				saleHistory: Const_saleHistoryCreated
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error creating admin sale history', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
