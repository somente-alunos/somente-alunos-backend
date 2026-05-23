
import { Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_getTrimmedStringOrUndefined, Function_isError } from "../function_global"


type Type_PatchStudentCarrinhoBody = {
	content: {
		content_uuid: Type_tableD1ContentGet['content_uuid'];
	};
	action: 'add' | 'remove';
}

type Type_PatchStudentCarrinhoResponse = {
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

async function Function_patchStudentCartAtomic(Parameter_env: Env, Parameter_studentUuid: Type_tableD1StudentGet['student_uuid'], Parameter_contentUuid: Type_tableD1ContentGet['content_uuid'], Parameter_action: Type_PatchStudentCarrinhoBody['action']): Type_errorOr<Promise<true>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		if (Parameter_action === 'add') {
			const Const_contentResult = await Const_D1Database.prepare(`
				SELECT
					content_uuid
				FROM
					content
				WHERE
					content_uuid = ?1
					AND verified_content = 1
				LIMIT 1
			`).bind(Parameter_contentUuid).all<{ content_uuid: Type_tableD1ContentGet['content_uuid']; }>()
			if (Const_contentResult.error || !Const_contentResult.success) {
				return { typ: 'logical', msg: 'Error checking content existence before cart add', inf: { Const_contentResult, Parameter_contentUuid }, loc: Function_getFuncionName(), err: true }
			}

			if (Const_contentResult.results.length <= 0) {
				return { typ: 'logical', msg: 'Content to add into cart was not found', inf: { Parameter_contentUuid }, loc: Function_getFuncionName(), err: true }
			}

			const Const_patchAddResult = await Const_D1Database.prepare(`
				UPDATE
					student
				SET
					cart_student = json_insert(
						CASE WHEN json_valid(student.cart_student) THEN student.cart_student ELSE '[]' END,
						'$[#]',
						json_object('content_uuid', ?1)
					)
				WHERE
					student_uuid = ?2
					AND NOT EXISTS (
						SELECT
							1
						FROM
							json_each(CASE WHEN json_valid(student.cart_student) THEN student.cart_student ELSE '[]' END) AS cart_item
						WHERE
							CASE
								WHEN cart_item.type = 'object' THEN json_extract(cart_item.value, '$.content_uuid')
								ELSE cart_item.value
							END = ?1
					)
			`).bind(Parameter_contentUuid, Parameter_studentUuid).run()
			if (Const_patchAddResult.error || !Const_patchAddResult.success) {
				return { typ: 'logical', msg: 'Error atomically adding content into student cart JSON', inf: { Const_patchAddResult, Parameter_studentUuid, Parameter_contentUuid }, loc: Function_getFuncionName(), err: true }
			}
		}

		if (Parameter_action === 'remove') {
			const Const_patchRemoveResult = await Const_D1Database.prepare(`
				UPDATE
					student
				SET
					cart_student = COALESCE((
						SELECT
							COALESCE('[' || group_concat(item_json, ',') || ']', '[]')
						FROM (
							SELECT
								CASE
									WHEN cart_item.type IN ('object', 'array') THEN json(cart_item.value)
									ELSE json_quote(cart_item.value)
								END AS item_json
							FROM
								json_each(CASE WHEN json_valid(student.cart_student) THEN student.cart_student ELSE '[]' END) AS cart_item
							WHERE
								CASE
									WHEN cart_item.type = 'object' THEN json_extract(cart_item.value, '$.content_uuid')
									ELSE cart_item.value
								END <> ?1
							ORDER BY
								CAST(cart_item.key AS INTEGER) ASC
						)
					), '[]')
				WHERE
					student_uuid = ?2
			`).bind(Parameter_contentUuid, Parameter_studentUuid).run()
			if (Const_patchRemoveResult.error || !Const_patchRemoveResult.success) {
				return { typ: 'logical', msg: 'Error atomically removing content from student cart JSON', inf: { Const_patchRemoveResult, Parameter_studentUuid, Parameter_contentUuid }, loc: Function_getFuncionName(), err: true }
			}
		}

		return true
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error patching student cart atomically', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}


export class Class_PatchStudentCarrinho {
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

			const Const_body = Const_bodyUnknown as Partial<Type_PatchStudentCarrinhoBody>
			const Const_action = Const_body.action
			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_body.content?.content_uuid)
			if ((Const_action !== 'add' && Const_action !== 'remove') || typeof Const_contentUuid !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content.content_uuid and action add/remove are required', inf: { Const_body }, loc: Function_getFuncionName(), err: true }, 454, 'Missing required body fields')
			}
			// /\ Le body e valida entrada obrigatoria

			// \/ Atualiza cart_student com operacao JSON atomica no D1
			const Const_cartPatched = await Function_patchStudentCartAtomic(Parameter_env, Const_studentAuthenticated.student_uuid, Const_contentUuid, Const_action)
			if (Function_isError(Const_cartPatched)) {
				return Function_getResponseError(Const_cartPatched, 455, 'Error patching student cart atomically')
			}
			// /\ Atualiza cart_student com operacao JSON atomica no D1

			// \/ Busca carrinho atualizado no D1 com query JSON
			const Const_cartArray = await Function_getStudentCartContentArray(Parameter_env, Const_studentAuthenticated.student_uuid)
			if (Function_isError(Const_cartArray)) {
				return Function_getResponseError(Const_cartArray, 456, 'Error getting updated student cart')
			}
			// /\ Busca carrinho atualizado no D1 com query JSON

			const Const_responseBody: Type_PatchStudentCarrinhoResponse = {
				cartArray: Const_cartArray
			}

			return new Response(JSON.stringify(Const_responseBody), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } })
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error patching student cart', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
