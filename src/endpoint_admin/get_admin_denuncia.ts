import { Function_getAdminAuthenticated, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError } from "../function_global"


type Type_GetAdminDenunciaResponse = {
	denunciaArray: Array<{
		denuncia_uuid: Type_tableD1DenunciaGet['denuncia_uuid'];
		denuncia_created: Type_tableD1DenunciaGet['denuncia_created'];
		denuncia_update: Type_tableD1DenunciaGet['denuncia_update'];
		student_uuid_denuncia: Type_tableD1DenunciaGet['student_uuid_denuncia'];
		content_uuid_denuncia: Type_tableD1DenunciaGet['content_uuid_denuncia'];
		reason_array_denuncia: Array<string>;
		extra_information_denuncia: Type_tableD1DenunciaGet['extra_information_denuncia'];
		status_denuncia: Type_tableD1DenunciaGet['status_denuncia'];
		admin_uuid_review_denuncia: Type_tableD1DenunciaGet['admin_uuid_review_denuncia'];
		review_note_denuncia: Type_tableD1DenunciaGet['review_note_denuncia'];
		reviewed_at_denuncia: Type_tableD1DenunciaGet['reviewed_at_denuncia'];
		content_name_denuncia: string | null;
		content_owner_student_uuid_denuncia: string | null;
		reporter_ra_student_denuncia: string | null;
		reporter_cpf_student_denuncia: string | null;
	}>;
	pagination: {
		limit: number;
		page: number;
		totalCount: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
	filter: {
		orderBy: 'denuncia_created' | 'denuncia_update';
		orderDirection: 'asc' | 'desc';
	};
}

type Type_databaseDenunciaListRow = Type_tableD1DenunciaGet & {
	content_name_denuncia: string | null;
	content_owner_student_uuid_denuncia: string | null;
	reporter_ra_student_denuncia: string | null;
	reporter_cpf_student_denuncia: string | null;
}

function Function_getNumberOrUndefined(Parameter_value: unknown): number | undefined {
	if (typeof Parameter_value === 'number' && Number.isFinite(Parameter_value)) {
		return Parameter_value
	}

	if (typeof Parameter_value !== 'string') {
		return undefined
	}

	const Const_trimmedValue = Parameter_value.trim()
	if (Const_trimmedValue.length <= 0) {
		return undefined
	}

	const Const_numberValue = Number(Const_trimmedValue)
	if (!Number.isFinite(Const_numberValue)) {
		return undefined
	}

	return Const_numberValue
}

function Function_getPositiveIntegerOrUndefined(Parameter_value: unknown): number | undefined {
	const Const_number = Function_getNumberOrUndefined(Parameter_value)
	if (typeof Const_number !== 'number' || !Number.isInteger(Const_number) || Const_number <= 0) {
		return undefined
	}

	return Const_number
}

function Function_getReasonArrayFromString(Parameter_reasonArrayDenuncia: Type_tableD1DenunciaGet['reason_array_denuncia']): Array<string> {
	try {
		if (typeof Parameter_reasonArrayDenuncia !== 'string' || Parameter_reasonArrayDenuncia.trim().length <= 0) {
			return []
		}

		const Const_reasonUnknown = JSON.parse(Parameter_reasonArrayDenuncia) as unknown
		if (!Array.isArray(Const_reasonUnknown)) {
			return []
		}

		const Const_reasonArray = Const_reasonUnknown
			.filter((Parameter_single) => typeof Parameter_single === 'string')
			.map((Parameter_single) => Parameter_single.trim())
			.filter((Parameter_single) => Parameter_single.length > 0)

		return Array.from(new Set(Const_reasonArray))
	}

	catch {
		return []
	}
}


export class Class_GetAdminDenuncia {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica admin pelo JWT
			const Const_adminAuthenticated = await Function_getAdminAuthenticated(Parameter_request, Parameter_env, false)
			if (Function_isError(Const_adminAuthenticated)) {
				return Function_getResponseError(Const_adminAuthenticated, 451, 'Unauthorized admin JWT')
			}
			// /\ Autentica admin pelo JWT

			// \/ Valida query params e prepara filtros
			const Const_database = Parameter_env?.D1_somenteAlunosAll2
			if (!Const_database) {
				return Function_getResponseError({ typ: 'logical', msg: 'D1 database not configured', inf: { Const_database }, loc: Function_getFuncionName(), err: true }, 452, 'D1 not configured')
			}

			const Const_newUrl = new URL(Parameter_request.url)
			const Const_query = Const_newUrl.searchParams

			const Const_limitRaw = Const_query.get('limit')
			const Const_pageRaw = Const_query.get('page')

			const Const_limitParsed = Function_getPositiveIntegerOrUndefined(Const_limitRaw)
			const Const_pageParsed = Function_getPositiveIntegerOrUndefined(Const_pageRaw)
			if (Const_limitRaw !== null && typeof Const_limitParsed !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'limit must be a positive integer', inf: { Const_limitRaw }, loc: Function_getFuncionName(), err: true }, 453, 'Invalid limit')
			}
			if (Const_pageRaw !== null && typeof Const_pageParsed !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'page must be a positive integer', inf: { Const_pageRaw }, loc: Function_getFuncionName(), err: true }, 454, 'Invalid page')
			}

			const Const_limit = Const_limitParsed || 50
			const Const_page = Const_pageParsed || 1
			if (Const_limit > 500) {
				return Function_getResponseError({ typ: 'logical', msg: 'limit must be less than or equal to 500', inf: { Const_limit }, loc: Function_getFuncionName(), err: true }, 455, 'Invalid limit range')
			}

			const Const_contentUuidDenuncia = Function_getTrimmedStringOrUndefined(Const_query.get('content_uuid_denuncia'))
			const Const_studentUuidDenuncia = Function_getTrimmedStringOrUndefined(Const_query.get('student_uuid_denuncia'))
			const Const_statusDenuncia = Function_getTrimmedStringOrUndefined(Const_query.get('status_denuncia'))

			const Const_orderByRaw = Function_getTrimmedStringOrUndefined(Const_query.get('order_by'))
			const Const_orderDirectionRaw = Function_getTrimmedStringOrUndefined(Const_query.get('order_direction'))?.toLowerCase()
			const Const_orderByMap = {
				denuncia_created: 'denuncia.denuncia_created',
				denuncia_update: 'denuncia.denuncia_update'
			} as const
			const Const_orderByFinal = (Const_orderByRaw || 'denuncia_created') as keyof typeof Const_orderByMap
			if (!(Const_orderByFinal in Const_orderByMap)) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid order_by', inf: { Const_orderByRaw, allowed: Object.keys(Const_orderByMap) }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid order_by')
			}

			let Let_orderDirectionFinal: 'asc' | 'desc' = 'desc'
			if (typeof Const_orderDirectionRaw === 'string') {
				if (Const_orderDirectionRaw !== 'asc' && Const_orderDirectionRaw !== 'desc') {
					return Function_getResponseError({ typ: 'logical', msg: 'order_direction must be asc or desc', inf: { Const_orderDirectionRaw }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid order_direction')
				}
				Let_orderDirectionFinal = Const_orderDirectionRaw
			}
			// /\ Valida query params e prepara filtros

			// \/ Monta SQL dinamico com filtros
			const Const_whereClauseArray: Array<string> = []
			const Const_bindValueArray: Array<string | number> = []
			const Function_bind = (Parameter_value: string | number): string => {
				Const_bindValueArray.push(Parameter_value)
				return `?${Const_bindValueArray.length}`
			}

			if (typeof Const_contentUuidDenuncia === 'string') {
				Const_whereClauseArray.push(`denuncia.content_uuid_denuncia = ${Function_bind(Const_contentUuidDenuncia)}`)
			}
			if (typeof Const_studentUuidDenuncia === 'string') {
				Const_whereClauseArray.push(`denuncia.student_uuid_denuncia = ${Function_bind(Const_studentUuidDenuncia)}`)
			}
			if (typeof Const_statusDenuncia === 'string') {
				Const_whereClauseArray.push(`denuncia.status_denuncia = ${Function_bind(Const_statusDenuncia)}`)
			}

			const Const_whereClause = Const_whereClauseArray.length > 0 ? `WHERE ${Const_whereClauseArray.join(' AND ')}` : ''
			const Const_orderBySql = Const_orderByMap[Const_orderByFinal]
			const Const_offset = (Const_page - 1) * Const_limit
			// /\ Monta SQL dinamico com filtros

			// \/ Executa query de total e lista paginada
			const Const_countQueryResult = await Const_database.prepare(`
				SELECT
					COUNT(*) as totalCount
				FROM
					denuncia
				${Const_whereClause}
			`).bind(...Const_bindValueArray).all<{ totalCount: number }>()
			if (Const_countQueryResult.error || !Const_countQueryResult.success) {
				return Function_getResponseError({ typ: 'logical', msg: 'Error executing count query for admin denuncia', inf: { Const_countQueryResult }, loc: Function_getFuncionName(), err: true }, 458, 'Error counting admin denuncia')
			}

			const Const_totalCount = Number(Const_countQueryResult.results?.[0]?.totalCount || 0)
			const Const_totalPages = Const_totalCount > 0 ? Math.ceil(Const_totalCount / Const_limit) : 0

			const Const_limitPlaceholder = `?${Const_bindValueArray.length + 1}`
			const Const_offsetPlaceholder = `?${Const_bindValueArray.length + 2}`
			const Const_denunciaQueryResult = await Const_database.prepare(`
				SELECT
					denuncia.*,
					content.name_content as content_name_denuncia,
					content.student_uuid_content as content_owner_student_uuid_denuncia,
					student.ra_student as reporter_ra_student_denuncia,
					student.cpf_student as reporter_cpf_student_denuncia
				FROM
					denuncia
				LEFT JOIN
					content ON content.content_uuid = denuncia.content_uuid_denuncia
				LEFT JOIN
					student ON student.student_uuid = denuncia.student_uuid_denuncia
				${Const_whereClause}
				ORDER BY
					${Const_orderBySql} ${Let_orderDirectionFinal.toUpperCase()}
				LIMIT ${Const_limitPlaceholder} OFFSET ${Const_offsetPlaceholder}
			`).bind(...Const_bindValueArray, Const_limit, Const_offset).all<Type_databaseDenunciaListRow>()
			if (Const_denunciaQueryResult.error || !Const_denunciaQueryResult.success) {
				return Function_getResponseError({ typ: 'logical', msg: 'Error executing list query for admin denuncia', inf: { Const_denunciaQueryResult }, loc: Function_getFuncionName(), err: true }, 459, 'Error listing admin denuncia')
			}
			// /\ Executa query de total e lista paginada

			const Const_responseBody: Type_GetAdminDenunciaResponse = {
				denunciaArray: Const_denunciaQueryResult.results.map((Parameter_denunciaSingle) => ({
					denuncia_uuid: Parameter_denunciaSingle.denuncia_uuid,
					denuncia_created: Parameter_denunciaSingle.denuncia_created,
					denuncia_update: Parameter_denunciaSingle.denuncia_update,
					student_uuid_denuncia: Parameter_denunciaSingle.student_uuid_denuncia,
					content_uuid_denuncia: Parameter_denunciaSingle.content_uuid_denuncia,
					reason_array_denuncia: Function_getReasonArrayFromString(Parameter_denunciaSingle.reason_array_denuncia),
					extra_information_denuncia: Parameter_denunciaSingle.extra_information_denuncia,
					status_denuncia: Parameter_denunciaSingle.status_denuncia,
					admin_uuid_review_denuncia: Parameter_denunciaSingle.admin_uuid_review_denuncia,
					review_note_denuncia: Parameter_denunciaSingle.review_note_denuncia,
					reviewed_at_denuncia: Parameter_denunciaSingle.reviewed_at_denuncia,
					content_name_denuncia: Parameter_denunciaSingle.content_name_denuncia,
					content_owner_student_uuid_denuncia: Parameter_denunciaSingle.content_owner_student_uuid_denuncia,
					reporter_ra_student_denuncia: Parameter_denunciaSingle.reporter_ra_student_denuncia,
					reporter_cpf_student_denuncia: Parameter_denunciaSingle.reporter_cpf_student_denuncia
				})),
				pagination: {
					limit: Const_limit,
					page: Const_page,
					totalCount: Const_totalCount,
					totalPages: Const_totalPages,
					hasNextPage: (Const_page * Const_limit) < Const_totalCount,
					hasPreviousPage: Const_page > 1
				},
				filter: {
					orderBy: Const_orderByFinal,
					orderDirection: Let_orderDirectionFinal
				}
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting admin denuncia', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
