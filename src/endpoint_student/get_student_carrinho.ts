
import { Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_isError } from "../function_global"


type Type_GetStudentCarrinhoResponse = {
	cartArray: Array<Type_objectStudentCartResponse>;
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

async function Function_getStudentCartContentArray(Parameter_env: Env, Parameter_studentUuid: Type_tableD1StudentGet['student_uuid']): Type_errorOr<Promise<Array<Type_objectStudentCartResponse>>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		const Const_d1Result = await Const_D1Database.prepare(`
			SELECT
				content.*
			FROM
				student
			JOIN
				json_each(CASE WHEN json_valid(student.cart_student) THEN student.cart_student ELSE '[]' END) AS cart_item
			JOIN
				content ON content.content_uuid = CASE
					WHEN cart_item.type = 'object' THEN json_extract(cart_item.value, '$.content_uuid')
					ELSE cart_item.value
				END
			WHERE
				student.student_uuid = ?1
				AND content.verified_content = 1
			ORDER BY
				CAST(cart_item.key AS INTEGER) ASC
		`).bind(Parameter_studentUuid).all<Type_tableD1ContentGet>()
		if (Const_d1Result.error || !Const_d1Result.success) {
			return { typ: 'logical', msg: 'Error querying student cart content with D1 JSON', inf: { Const_d1Result, Parameter_studentUuid }, loc: Function_getFuncionName(), err: true }
		}

		const Const_cartArray: Array<Type_objectStudentCartResponse> = []
		for (const Const_content of Const_d1Result.results) {
			Const_cartArray.push(Function_mapContentGetToObjectStudentContentResponse(Const_content))
		}

		return Const_cartArray
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting student cart content array', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}


export class Class_GetStudentCarrinho {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Busca carrinho com query JSON do D1
			const Const_cartArray = await Function_getStudentCartContentArray(Parameter_env, Const_studentAuthenticated.student_uuid)
			if (Function_isError(Const_cartArray)) {
				return Function_getResponseError(Const_cartArray, 452, 'Error getting student cart')
			}
			// /\ Busca carrinho com query JSON do D1

			const Const_responseBody: Type_GetStudentCarrinhoResponse = {
				cartArray: Const_cartArray
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting student cart', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
