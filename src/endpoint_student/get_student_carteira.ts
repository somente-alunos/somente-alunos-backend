
import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_objectStudentCarteiraSaleResponse = {
	saleHistoryUuid: Type_tableD1SaleHistoryGet['sale_history_uuid'];
	saleHistoryCreated: Type_tableD1SaleHistoryGet['sale_history_created'];
	saleHistoryUpdate: Type_tableD1SaleHistoryGet['sale_history_update'];
	studentUuidBuyerSaleHistory: Type_tableD1SaleHistoryGet['student_uuid_buyer_sale_history'];
	contentUuidSaleHistory: Type_tableD1SaleHistoryGet['content_uuid_sale_history'];
	statusSaleHistory: Type_tableD1SaleHistoryGet['status_sale_history'];
	paidToSellerSaleHistory: Type_tableD1SaleHistoryGet['paid_to_seller_sale_history'];
	informationContentSaleHistory: Type_objectStudentContentResponse | null;
	amountSaleHistory: number;
}

type Type_GetStudentCarteiraResponse = {
	soldArray: Array<Type_objectStudentCarteiraSaleResponse>;
	pendingAmount: number;
	receivedAmount: number;
}

function Function_getInformationContentSaleHistory(Parameter_informationContentSaleHistory: Type_tableD1SaleHistoryGet['information_content_sale_history']): Type_objectStudentContentResponse | undefined {
	try {
		if (typeof Parameter_informationContentSaleHistory !== 'string' || Parameter_informationContentSaleHistory.trim().length <= 0) {
			return undefined
		}

		const Const_informationContentUnknown = JSON.parse(Parameter_informationContentSaleHistory)
		if (typeof Const_informationContentUnknown !== 'object' || Const_informationContentUnknown === null) {
			return undefined
		}

		return Const_informationContentUnknown as Type_objectStudentContentResponse
	}

	catch {
		return undefined
	}
}

function Function_getAmountSaleHistory(Parameter_informationContentSaleHistory: Type_objectStudentContentResponse | undefined): number {
	if (typeof Parameter_informationContentSaleHistory?.current_price_content === 'number' && Number.isFinite(Parameter_informationContentSaleHistory.current_price_content)) {
		return Parameter_informationContentSaleHistory.current_price_content
	}

	return 0
}


export class Class_GetStudentCarteira {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Busca vendas do aluno vendedor na tabela sale_history
			const Const_saleHistoryArray = await Function_getD1(Parameter_env, 'sale_history', 999999, 1, ['*'], {
				student_uuid_seller_sale_history: Const_studentAuthenticated.student_uuid
			})
			if (Function_isError(Const_saleHistoryArray)) {
				return Function_getResponseError(Const_saleHistoryArray, 452, 'Error fetching student wallet sale history')
			}
			// /\ Busca vendas do aluno vendedor na tabela sale_history

			// \/ Formata lista de vendidos e agrega valores pendente/recebido
			const Const_saleHistoryArraySorted = [...Const_saleHistoryArray]
			Const_saleHistoryArraySorted.sort((Parameter_a, Parameter_b) => new Date(Parameter_b.sale_history_created).getTime() - new Date(Parameter_a.sale_history_created).getTime())

			const Const_soldArray: Array<Type_objectStudentCarteiraSaleResponse> = []
			let Let_pendingAmount = 0
			let Let_receivedAmount = 0
			for (const Const_saleHistorySingle of Const_saleHistoryArraySorted) {
				const Const_informationContentSaleHistory = Function_getInformationContentSaleHistory(Const_saleHistorySingle.information_content_sale_history)
				const Const_amountSaleHistory = Function_getAmountSaleHistory(Const_informationContentSaleHistory)

				if (Const_saleHistorySingle.status_sale_history === 'completed') {
					if (Const_saleHistorySingle.paid_to_seller_sale_history === null) {
						Let_pendingAmount += Const_amountSaleHistory
					}

					else {
						Let_receivedAmount += Const_amountSaleHistory
					}
				}

				Const_soldArray.push({
					saleHistoryUuid: Const_saleHistorySingle.sale_history_uuid,
					saleHistoryCreated: Const_saleHistorySingle.sale_history_created,
					saleHistoryUpdate: Const_saleHistorySingle.sale_history_update,
					studentUuidBuyerSaleHistory: Const_saleHistorySingle.student_uuid_buyer_sale_history,
					contentUuidSaleHistory: Const_saleHistorySingle.content_uuid_sale_history,
					statusSaleHistory: Const_saleHistorySingle.status_sale_history,
					paidToSellerSaleHistory: Const_saleHistorySingle.paid_to_seller_sale_history,
					informationContentSaleHistory: Const_informationContentSaleHistory || null,
					amountSaleHistory: Number(Const_amountSaleHistory.toFixed(2))
				})
			}
			// /\ Formata lista de vendidos e agrega valores pendente/recebido

			const Const_responseBody: Type_GetStudentCarteiraResponse = {
				soldArray: Const_soldArray,
				pendingAmount: Number(Let_pendingAmount.toFixed(2)),
				receivedAmount: Number(Let_receivedAmount.toFixed(2))
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting student wallet', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
