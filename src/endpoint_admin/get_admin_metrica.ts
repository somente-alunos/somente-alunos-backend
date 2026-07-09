
import { Function_getAdminAuthenticated, Function_getD1, Function_getFuncionName, Function_getResponseError, Function_isError } from "../function_global"


type Type_GetAdminMetricaResponse = {
	metric: {
		studentCount: number;
		collegeCount: number;
		courseCount: number;
		contentCount: number;
		denunciaCount: number;
		saleHistoryCount: number;
		saleHistoryCompletedCount: number;
		pendingToSellerAmount: number;
		paidToSellerAmount: number;
	};
	studentArray: Array<Type_objectAdminStudentResponse>;
	collegeArray: Array<Type_objectAdminCollegeResponse>;
	courseArray: Array<Type_objectAdminCourseResponse>;
	contentArray: Array<Type_objectAdminContentResponse>;
	denunciaArray: Array<Type_objectAdminDenunciaResponse>;
	saleHistoryArray: Array<Type_objectAdminSaleHistoryResponse>;
	adminArray: Array<Type_objectAdminAdminResponse>;
}

function Function_getSaleHistoryAmountByInformationContent(Parameter_informationContentSaleHistory: Type_tableD1SaleHistoryGet['information_content_sale_history']): number {
	try {
		if (typeof Parameter_informationContentSaleHistory !== 'string' || Parameter_informationContentSaleHistory.trim().length <= 0) {
			return 0
		}

		const Const_informationContentUnknown = JSON.parse(Parameter_informationContentSaleHistory)
		if (typeof Const_informationContentUnknown !== 'object' || Const_informationContentUnknown === null) {
			return 0
		}

		const Const_informationContent = Const_informationContentUnknown as Partial<Type_objectStudentContentResponse>
		if (typeof Const_informationContent.current_price_content !== 'number' || !Number.isFinite(Const_informationContent.current_price_content)) {
			return 0
		}

		return Const_informationContent.current_price_content
	}

	catch {
		return 0
	}
}


export class Class_GetAdminMetrica {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Busca listas principais para dashboard admin
			const Const_studentPromise = Function_getD1(Parameter_env, 'student', 999999, 1, ['*'])
			const Const_collegePromise = Function_getD1(Parameter_env, 'college', 999999, 1, ['*'])
			const Const_coursePromise = Function_getD1(Parameter_env, 'course', 999999, 1, ['*'])
			const Const_contentPromise = Function_getD1(Parameter_env, 'content', 999999, 1, ['*'])
			const Const_denunciaPromise = Function_getD1(Parameter_env, 'denuncia', 999999, 1, ['*'])
			const Const_saleHistoryPromise = Function_getD1(Parameter_env, 'sale_history', 999999, 1, ['*'])
			const Const_adminPromise = Function_getD1(Parameter_env, 'admin', 999999, 1, ['*'])

			const [
				Const_studentArray,
				Const_collegeArray,
				Const_courseArray,
				Const_contentArray,
				Const_denunciaArray,
				Const_saleHistoryArray,
				Const_adminArray
			] = await Promise.all([
				Const_studentPromise,
				Const_collegePromise,
				Const_coursePromise,
				Const_contentPromise,
				Const_denunciaPromise,
				Const_saleHistoryPromise,
				Const_adminPromise
			])
			if (Function_isError(Const_studentArray)) {
				return Function_getResponseError(Const_studentArray, 452, 'Error fetching student list for metric')
			}
			if (Function_isError(Const_collegeArray)) {
				return Function_getResponseError(Const_collegeArray, 453, 'Error fetching college list for metric')
			}
			if (Function_isError(Const_courseArray)) {
				return Function_getResponseError(Const_courseArray, 454, 'Error fetching course list for metric')
			}
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 455, 'Error fetching content list for metric')
			}
			if (Function_isError(Const_denunciaArray)) {
				return Function_getResponseError(Const_denunciaArray, 456, 'Error fetching denuncia list for metric')
			}
			if (Function_isError(Const_saleHistoryArray)) {
				return Function_getResponseError(Const_saleHistoryArray, 457, 'Error fetching sale_history list for metric')
			}
			if (Function_isError(Const_adminArray)) {
				return Function_getResponseError(Const_adminArray, 458, 'Error fetching admin list for metric')
			}
			// /\ Busca listas principais para dashboard admin

			// \/ Agrega metricas simples de venda
			let Let_saleHistoryCompletedCount = 0
			let Let_pendingToSellerAmount = 0
			let Let_paidToSellerAmount = 0
			for (const Const_saleHistorySingle of Const_saleHistoryArray) {
				if (Const_saleHistorySingle.status_sale_history === 'completed') {
					Let_saleHistoryCompletedCount++

					const Const_saleHistoryAmount = Function_getSaleHistoryAmountByInformationContent(Const_saleHistorySingle.information_content_sale_history)
					if (Const_saleHistorySingle.paid_to_seller_sale_history === null) {
						Let_pendingToSellerAmount += Const_saleHistoryAmount
					}

					else {
						Let_paidToSellerAmount += Const_saleHistoryAmount
					}
				}
			}
			// /\ Agrega metricas simples de venda

			const Const_responseBody: Type_GetAdminMetricaResponse = {
				metric: {
					studentCount: Const_studentArray.length,
					collegeCount: Const_collegeArray.length,
					courseCount: Const_courseArray.length,
					contentCount: Const_contentArray.length,
					denunciaCount: Const_denunciaArray.length,
					saleHistoryCount: Const_saleHistoryArray.length,
					saleHistoryCompletedCount: Let_saleHistoryCompletedCount,
					pendingToSellerAmount: Number(Let_pendingToSellerAmount.toFixed(2)),
					paidToSellerAmount: Number(Let_paidToSellerAmount.toFixed(2))
				},
				studentArray: Const_studentArray,
				collegeArray: Const_collegeArray,
				courseArray: Const_courseArray,
				contentArray: Const_contentArray,
				denunciaArray: Const_denunciaArray,
				saleHistoryArray: Const_saleHistoryArray,
				adminArray: Const_adminArray
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting admin metric', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
