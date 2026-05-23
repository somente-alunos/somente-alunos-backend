import { Function_getAdminAuthenticated, Function_getFuncionName, Function_getResponseError, Function_getTrimmedStringOrUndefined, Function_isError } from "../function_global"


type Type_GetAdminConteudoResponse = {
	contentArray: Array<Type_objectAdminContentResponse>;
	pagination: {
		limit: number;
		page: number;
		totalCount: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
	filter: {
		orderBy: 'content_created' | 'content_update' | 'name_content' | 'current_price_content' | 'old_price_content' | 'prevision_content' | 'verified_content';
		orderDirection: 'asc' | 'desc';
	};
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

function Function_getBooleanOrUndefined(Parameter_value: unknown): boolean | undefined {
	if (typeof Parameter_value === 'boolean') {
		return Parameter_value
	}

	if (typeof Parameter_value !== 'string') {
		return undefined
	}

	const Const_trimmedValue = Parameter_value.trim().toLowerCase()
	if (Const_trimmedValue === '1' || Const_trimmedValue === 'true') {
		return true
	}
	if (Const_trimmedValue === '0' || Const_trimmedValue === 'false') {
		return false
	}

	return undefined
}

function Function_getVerifiedContentOrUndefined(Parameter_value: unknown): 0 | 1 | undefined {
	const Const_boolean = Function_getBooleanOrUndefined(Parameter_value)
	if (typeof Const_boolean === 'boolean') {
		return Const_boolean ? 1 : 0
	}

	if (Parameter_value === 0 || Parameter_value === 1) {
		return Parameter_value
	}

	if (typeof Parameter_value === 'string') {
		const Const_trimmedValue = Parameter_value.trim()
		if (Const_trimmedValue === '0') {
			return 0
		}
		if (Const_trimmedValue === '1') {
			return 1
		}
	}

	return undefined
}

function Function_getIsoDateOrUndefined(Parameter_value: unknown): string | undefined {
	const Const_trimmedValue = Function_getTrimmedStringOrUndefined(Parameter_value)
	if (typeof Const_trimmedValue !== 'string') {
		return undefined
	}

	const Const_date = new Date(Const_trimmedValue)
	if (Number.isNaN(Const_date.getTime())) {
		return undefined
	}

	return Const_date.toISOString()
}

function Function_getCsvStringArrayOrUndefined(Parameter_value: unknown): Array<string> | undefined {
	if (typeof Parameter_value !== 'string') {
		return undefined
	}

	const Const_valueArray = Parameter_value
		.split(',')
		.map((Parameter_single) => Parameter_single.trim())
		.filter((Parameter_single) => Parameter_single.length > 0)
	if (Const_valueArray.length <= 0) {
		return undefined
	}

	return Array.from(new Set(Const_valueArray))
}


export class Class_GetAdminConteudo {
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

			const Const_contentUuid = Function_getTrimmedStringOrUndefined(Const_query.get('content_uuid'))
			const Const_contentUuidArray = Function_getCsvStringArrayOrUndefined(Const_query.get('content_uuid_array'))
			if (Const_query.has('content_uuid_array') && !Const_contentUuidArray) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_uuid_array must be a comma-separated non-empty list', inf: { content_uuid_array: Const_query.get('content_uuid_array') }, loc: Function_getFuncionName(), err: true }, 456, 'Invalid content_uuid_array')
			}

			const Const_studentUuidContent = Function_getTrimmedStringOrUndefined(Const_query.get('student_uuid_content'))
			const Const_studentUuidContentArray = Function_getCsvStringArrayOrUndefined(Const_query.get('student_uuid_content_array'))
			if (Const_query.has('student_uuid_content_array') && !Const_studentUuidContentArray) {
				return Function_getResponseError({ typ: 'logical', msg: 'student_uuid_content_array must be a comma-separated non-empty list', inf: { student_uuid_content_array: Const_query.get('student_uuid_content_array') }, loc: Function_getFuncionName(), err: true }, 457, 'Invalid student_uuid_content_array')
			}

			const Const_collegeUuidContent = Function_getTrimmedStringOrUndefined(Const_query.get('college_uuid_content'))
			const Const_collegeUuidContentArray = Function_getCsvStringArrayOrUndefined(Const_query.get('college_uuid_content_array'))
			if (Const_query.has('college_uuid_content_array') && !Const_collegeUuidContentArray) {
				return Function_getResponseError({ typ: 'logical', msg: 'college_uuid_content_array must be a comma-separated non-empty list', inf: { college_uuid_content_array: Const_query.get('college_uuid_content_array') }, loc: Function_getFuncionName(), err: true }, 458, 'Invalid college_uuid_content_array')
			}

			const Const_courseUuidContent = Function_getTrimmedStringOrUndefined(Const_query.get('course_uuid_content'))
			const Const_courseUuidContentArray = Function_getCsvStringArrayOrUndefined(Const_query.get('course_uuid_content_array'))
			if (Const_query.has('course_uuid_content_array') && !Const_courseUuidContentArray) {
				return Function_getResponseError({ typ: 'logical', msg: 'course_uuid_content_array must be a comma-separated non-empty list', inf: { course_uuid_content_array: Const_query.get('course_uuid_content_array') }, loc: Function_getFuncionName(), err: true }, 459, 'Invalid course_uuid_content_array')
			}

			const Const_nameContent = Function_getTrimmedStringOrUndefined(Const_query.get('name_content'))
			const Const_nameContentLike = Function_getTrimmedStringOrUndefined(Const_query.get('name_content_like')) || Function_getTrimmedStringOrUndefined(Const_query.get('q'))

			const Const_classContentRaw = Const_query.get('class_content')
			let Let_classContent: string | undefined
			let Let_classContentIsNull: boolean | undefined
			if (Const_classContentRaw !== null) {
				const Const_classContentTrimmed = Const_classContentRaw.trim()
				if (Const_classContentTrimmed.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'class_content cannot be empty when provided', inf: { Const_classContentRaw }, loc: Function_getFuncionName(), err: true }, 460, 'Invalid class_content')
				}

				if (Const_classContentTrimmed.toLowerCase() === 'null') {
					Let_classContentIsNull = true
				}
				else {
					Let_classContent = Const_classContentTrimmed
				}
			}

			const Const_verifiedContentRaw = Const_query.get('verified_content')
			const Const_verifiedContent = Function_getVerifiedContentOrUndefined(Const_verifiedContentRaw)
			if (Const_verifiedContentRaw !== null && (Const_verifiedContent !== 0 && Const_verifiedContent !== 1)) {
				return Function_getResponseError({ typ: 'logical', msg: 'verified_content must be 0/1/true/false', inf: { Const_verifiedContentRaw }, loc: Function_getFuncionName(), err: true }, 461, 'Invalid verified_content')
			}

			const Const_previewFileUuidContentRaw = Const_query.get('preview_file_uuid_content')
			const Const_fullFileUuidContentRaw = Const_query.get('full_file_uuid_content')
			let Let_previewFileUuidContent: string | undefined
			let Let_fullFileUuidContent: string | undefined
			let Let_previewFileUuidContentIsNull: boolean | undefined
			let Let_fullFileUuidContentIsNull: boolean | undefined

			if (Const_previewFileUuidContentRaw !== null) {
				const Const_previewFileUuidContentTrimmed = Const_previewFileUuidContentRaw.trim()
				if (Const_previewFileUuidContentTrimmed.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'preview_file_uuid_content cannot be empty when provided', inf: { Const_previewFileUuidContentRaw }, loc: Function_getFuncionName(), err: true }, 462, 'Invalid preview_file_uuid_content')
				}

				if (Const_previewFileUuidContentTrimmed.toLowerCase() === 'null') {
					Let_previewFileUuidContentIsNull = true
				}
				else {
					Let_previewFileUuidContent = Const_previewFileUuidContentTrimmed
				}
			}

			if (Const_fullFileUuidContentRaw !== null) {
				const Const_fullFileUuidContentTrimmed = Const_fullFileUuidContentRaw.trim()
				if (Const_fullFileUuidContentTrimmed.length <= 0) {
					return Function_getResponseError({ typ: 'logical', msg: 'full_file_uuid_content cannot be empty when provided', inf: { Const_fullFileUuidContentRaw }, loc: Function_getFuncionName(), err: true }, 463, 'Invalid full_file_uuid_content')
				}

				if (Const_fullFileUuidContentTrimmed.toLowerCase() === 'null') {
					Let_fullFileUuidContentIsNull = true
				}
				else {
					Let_fullFileUuidContent = Const_fullFileUuidContentTrimmed
				}
			}

			const Const_hasPreviewFileRaw = Const_query.get('has_preview_file_content')
			const Const_hasPreviewFile = Function_getBooleanOrUndefined(Const_hasPreviewFileRaw)
			if (Const_hasPreviewFileRaw !== null && typeof Const_hasPreviewFile !== 'boolean') {
				return Function_getResponseError({ typ: 'logical', msg: 'has_preview_file_content must be 0/1/true/false', inf: { Const_hasPreviewFileRaw }, loc: Function_getFuncionName(), err: true }, 464, 'Invalid has_preview_file_content')
			}
			if (typeof Const_hasPreviewFile === 'boolean' && (Let_previewFileUuidContentIsNull || typeof Let_previewFileUuidContent === 'string')) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot combine has_preview_file_content with preview_file_uuid_content filter', inf: { Const_hasPreviewFileRaw, Const_previewFileUuidContentRaw }, loc: Function_getFuncionName(), err: true }, 465, 'Conflicting preview file filters')
			}

			const Const_hasFullFileRaw = Const_query.get('has_full_file_content')
			const Const_hasFullFile = Function_getBooleanOrUndefined(Const_hasFullFileRaw)
			if (Const_hasFullFileRaw !== null && typeof Const_hasFullFile !== 'boolean') {
				return Function_getResponseError({ typ: 'logical', msg: 'has_full_file_content must be 0/1/true/false', inf: { Const_hasFullFileRaw }, loc: Function_getFuncionName(), err: true }, 466, 'Invalid has_full_file_content')
			}
			if (typeof Const_hasFullFile === 'boolean' && (Let_fullFileUuidContentIsNull || typeof Let_fullFileUuidContent === 'string')) {
				return Function_getResponseError({ typ: 'logical', msg: 'Cannot combine has_full_file_content with full_file_uuid_content filter', inf: { Const_hasFullFileRaw, Const_fullFileUuidContentRaw }, loc: Function_getFuncionName(), err: true }, 467, 'Conflicting full file filters')
			}

			const Const_minCurrentPriceContentRaw = Const_query.get('min_current_price_content')
			const Const_maxCurrentPriceContentRaw = Const_query.get('max_current_price_content')
			const Const_minCurrentPriceContent = Function_getNumberOrUndefined(Const_minCurrentPriceContentRaw)
			const Const_maxCurrentPriceContent = Function_getNumberOrUndefined(Const_maxCurrentPriceContentRaw)
			if (Const_minCurrentPriceContentRaw !== null && typeof Const_minCurrentPriceContent !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'min_current_price_content must be a valid number', inf: { Const_minCurrentPriceContentRaw }, loc: Function_getFuncionName(), err: true }, 468, 'Invalid min_current_price_content')
			}
			if (Const_maxCurrentPriceContentRaw !== null && typeof Const_maxCurrentPriceContent !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'max_current_price_content must be a valid number', inf: { Const_maxCurrentPriceContentRaw }, loc: Function_getFuncionName(), err: true }, 469, 'Invalid max_current_price_content')
			}
			if (typeof Const_minCurrentPriceContent === 'number' && typeof Const_maxCurrentPriceContent === 'number' && Const_minCurrentPriceContent > Const_maxCurrentPriceContent) {
				return Function_getResponseError({ typ: 'logical', msg: 'min_current_price_content cannot be greater than max_current_price_content', inf: { Const_minCurrentPriceContent, Const_maxCurrentPriceContent }, loc: Function_getFuncionName(), err: true }, 470, 'Invalid current price range')
			}

			const Const_minOldPriceContentRaw = Const_query.get('min_old_price_content')
			const Const_maxOldPriceContentRaw = Const_query.get('max_old_price_content')
			const Const_minOldPriceContent = Function_getNumberOrUndefined(Const_minOldPriceContentRaw)
			const Const_maxOldPriceContent = Function_getNumberOrUndefined(Const_maxOldPriceContentRaw)
			if (Const_minOldPriceContentRaw !== null && typeof Const_minOldPriceContent !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'min_old_price_content must be a valid number', inf: { Const_minOldPriceContentRaw }, loc: Function_getFuncionName(), err: true }, 471, 'Invalid min_old_price_content')
			}
			if (Const_maxOldPriceContentRaw !== null && typeof Const_maxOldPriceContent !== 'number') {
				return Function_getResponseError({ typ: 'logical', msg: 'max_old_price_content must be a valid number', inf: { Const_maxOldPriceContentRaw }, loc: Function_getFuncionName(), err: true }, 472, 'Invalid max_old_price_content')
			}
			if (typeof Const_minOldPriceContent === 'number' && typeof Const_maxOldPriceContent === 'number' && Const_minOldPriceContent > Const_maxOldPriceContent) {
				return Function_getResponseError({ typ: 'logical', msg: 'min_old_price_content cannot be greater than max_old_price_content', inf: { Const_minOldPriceContent, Const_maxOldPriceContent }, loc: Function_getFuncionName(), err: true }, 473, 'Invalid old price range')
			}

			const Const_contentCreatedFromRaw = Const_query.get('content_created_from')
			const Const_contentCreatedToRaw = Const_query.get('content_created_to')
			const Const_contentUpdateFromRaw = Const_query.get('content_update_from')
			const Const_contentUpdateToRaw = Const_query.get('content_update_to')
			const Const_previsionContentFromRaw = Const_query.get('prevision_content_from')
			const Const_previsionContentToRaw = Const_query.get('prevision_content_to')

			const Const_contentCreatedFrom = Function_getIsoDateOrUndefined(Const_contentCreatedFromRaw)
			const Const_contentCreatedTo = Function_getIsoDateOrUndefined(Const_contentCreatedToRaw)
			const Const_contentUpdateFrom = Function_getIsoDateOrUndefined(Const_contentUpdateFromRaw)
			const Const_contentUpdateTo = Function_getIsoDateOrUndefined(Const_contentUpdateToRaw)
			const Const_previsionContentFrom = Function_getIsoDateOrUndefined(Const_previsionContentFromRaw)
			const Const_previsionContentTo = Function_getIsoDateOrUndefined(Const_previsionContentToRaw)

			if (Const_contentCreatedFromRaw !== null && typeof Const_contentCreatedFrom !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_created_from must be a valid date', inf: { Const_contentCreatedFromRaw }, loc: Function_getFuncionName(), err: true }, 474, 'Invalid content_created_from')
			}
			if (Const_contentCreatedToRaw !== null && typeof Const_contentCreatedTo !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_created_to must be a valid date', inf: { Const_contentCreatedToRaw }, loc: Function_getFuncionName(), err: true }, 475, 'Invalid content_created_to')
			}
			if (Const_contentUpdateFromRaw !== null && typeof Const_contentUpdateFrom !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_update_from must be a valid date', inf: { Const_contentUpdateFromRaw }, loc: Function_getFuncionName(), err: true }, 476, 'Invalid content_update_from')
			}
			if (Const_contentUpdateToRaw !== null && typeof Const_contentUpdateTo !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'content_update_to must be a valid date', inf: { Const_contentUpdateToRaw }, loc: Function_getFuncionName(), err: true }, 477, 'Invalid content_update_to')
			}
			if (Const_previsionContentFromRaw !== null && typeof Const_previsionContentFrom !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'prevision_content_from must be a valid date', inf: { Const_previsionContentFromRaw }, loc: Function_getFuncionName(), err: true }, 478, 'Invalid prevision_content_from')
			}
			if (Const_previsionContentToRaw !== null && typeof Const_previsionContentTo !== 'string') {
				return Function_getResponseError({ typ: 'logical', msg: 'prevision_content_to must be a valid date', inf: { Const_previsionContentToRaw }, loc: Function_getFuncionName(), err: true }, 479, 'Invalid prevision_content_to')
			}

			if (typeof Const_contentCreatedFrom === 'string' && typeof Const_contentCreatedTo === 'string' && Const_contentCreatedFrom > Const_contentCreatedTo) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_created_from cannot be greater than content_created_to', inf: { Const_contentCreatedFrom, Const_contentCreatedTo }, loc: Function_getFuncionName(), err: true }, 480, 'Invalid content_created range')
			}
			if (typeof Const_contentUpdateFrom === 'string' && typeof Const_contentUpdateTo === 'string' && Const_contentUpdateFrom > Const_contentUpdateTo) {
				return Function_getResponseError({ typ: 'logical', msg: 'content_update_from cannot be greater than content_update_to', inf: { Const_contentUpdateFrom, Const_contentUpdateTo }, loc: Function_getFuncionName(), err: true }, 481, 'Invalid content_update range')
			}
			if (typeof Const_previsionContentFrom === 'string' && typeof Const_previsionContentTo === 'string' && Const_previsionContentFrom > Const_previsionContentTo) {
				return Function_getResponseError({ typ: 'logical', msg: 'prevision_content_from cannot be greater than prevision_content_to', inf: { Const_previsionContentFrom, Const_previsionContentTo }, loc: Function_getFuncionName(), err: true }, 482, 'Invalid prevision_content range')
			}

			const Const_orderByRaw = Function_getTrimmedStringOrUndefined(Const_query.get('order_by'))
			const Const_orderDirectionRaw = Function_getTrimmedStringOrUndefined(Const_query.get('order_direction'))?.toLowerCase()
			const Const_orderByMap = {
				content_created: 'content_created',
				content_update: 'content_update',
				name_content: 'name_content',
				current_price_content: 'current_price_content',
				old_price_content: 'old_price_content',
				prevision_content: 'prevision_content',
				verified_content: 'verified_content'
			} as const
			const Const_orderByFinal = (Const_orderByRaw || 'content_update') as keyof typeof Const_orderByMap
			if (!(Const_orderByFinal in Const_orderByMap)) {
				return Function_getResponseError({ typ: 'logical', msg: 'Invalid order_by', inf: { Const_orderByRaw, allowed: Object.keys(Const_orderByMap) }, loc: Function_getFuncionName(), err: true }, 483, 'Invalid order_by')
			}

			let Let_orderDirectionFinal: 'asc' | 'desc' = 'desc'
			if (typeof Const_orderDirectionRaw === 'string') {
				if (Const_orderDirectionRaw !== 'asc' && Const_orderDirectionRaw !== 'desc') {
					return Function_getResponseError({ typ: 'logical', msg: 'order_direction must be asc or desc', inf: { Const_orderDirectionRaw }, loc: Function_getFuncionName(), err: true }, 484, 'Invalid order_direction')
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

			if (typeof Const_contentUuid === 'string') {
				Const_whereClauseArray.push(`content_uuid = ${Function_bind(Const_contentUuid)}`)
			}
			if (Const_contentUuidArray && Const_contentUuidArray.length > 0) {
				const Const_placeholderArray = Const_contentUuidArray.map((Parameter_value) => Function_bind(Parameter_value))
				Const_whereClauseArray.push(`content_uuid IN (${Const_placeholderArray.join(', ')})`)
			}
			if (typeof Const_studentUuidContent === 'string') {
				Const_whereClauseArray.push(`student_uuid_content = ${Function_bind(Const_studentUuidContent)}`)
			}
			if (Const_studentUuidContentArray && Const_studentUuidContentArray.length > 0) {
				const Const_placeholderArray = Const_studentUuidContentArray.map((Parameter_value) => Function_bind(Parameter_value))
				Const_whereClauseArray.push(`student_uuid_content IN (${Const_placeholderArray.join(', ')})`)
			}
			if (typeof Const_collegeUuidContent === 'string') {
				Const_whereClauseArray.push(`college_uuid_content = ${Function_bind(Const_collegeUuidContent)}`)
			}
			if (Const_collegeUuidContentArray && Const_collegeUuidContentArray.length > 0) {
				const Const_placeholderArray = Const_collegeUuidContentArray.map((Parameter_value) => Function_bind(Parameter_value))
				Const_whereClauseArray.push(`college_uuid_content IN (${Const_placeholderArray.join(', ')})`)
			}
			if (typeof Const_courseUuidContent === 'string') {
				Const_whereClauseArray.push(`course_uuid_content = ${Function_bind(Const_courseUuidContent)}`)
			}
			if (Const_courseUuidContentArray && Const_courseUuidContentArray.length > 0) {
				const Const_placeholderArray = Const_courseUuidContentArray.map((Parameter_value) => Function_bind(Parameter_value))
				Const_whereClauseArray.push(`course_uuid_content IN (${Const_placeholderArray.join(', ')})`)
			}
			if (typeof Const_nameContent === 'string') {
				Const_whereClauseArray.push(`name_content = ${Function_bind(Const_nameContent)}`)
			}
			if (typeof Const_nameContentLike === 'string') {
				Const_whereClauseArray.push(`LOWER(name_content) LIKE LOWER(${Function_bind(`%${Const_nameContentLike}%`)})`)
			}
			if (Let_classContentIsNull === true) {
				Const_whereClauseArray.push('class_content IS NULL')
			}
			else if (typeof Let_classContent === 'string') {
				Const_whereClauseArray.push(`class_content = ${Function_bind(Let_classContent)}`)
			}
			if (Const_verifiedContent === 0 || Const_verifiedContent === 1) {
				Const_whereClauseArray.push(`verified_content = ${Function_bind(Const_verifiedContent)}`)
			}

			if (typeof Const_hasPreviewFile === 'boolean') {
				Const_whereClauseArray.push(Const_hasPreviewFile
					? `(preview_file_uuid_content IS NOT NULL AND TRIM(preview_file_uuid_content) <> '')`
					: `(preview_file_uuid_content IS NULL OR TRIM(preview_file_uuid_content) = '')`)
			}
			else if (Let_previewFileUuidContentIsNull === true) {
				Const_whereClauseArray.push(`preview_file_uuid_content IS NULL`)
			}
			else if (typeof Let_previewFileUuidContent === 'string') {
				Const_whereClauseArray.push(`preview_file_uuid_content = ${Function_bind(Let_previewFileUuidContent)}`)
			}

			if (typeof Const_hasFullFile === 'boolean') {
				Const_whereClauseArray.push(Const_hasFullFile
					? `(full_file_uuid_content IS NOT NULL AND TRIM(full_file_uuid_content) <> '')`
					: `(full_file_uuid_content IS NULL OR TRIM(full_file_uuid_content) = '')`)
			}
			else if (Let_fullFileUuidContentIsNull === true) {
				Const_whereClauseArray.push(`full_file_uuid_content IS NULL`)
			}
			else if (typeof Let_fullFileUuidContent === 'string') {
				Const_whereClauseArray.push(`full_file_uuid_content = ${Function_bind(Let_fullFileUuidContent)}`)
			}

			if (typeof Const_minCurrentPriceContent === 'number') {
				Const_whereClauseArray.push(`current_price_content >= ${Function_bind(Const_minCurrentPriceContent)}`)
			}
			if (typeof Const_maxCurrentPriceContent === 'number') {
				Const_whereClauseArray.push(`current_price_content <= ${Function_bind(Const_maxCurrentPriceContent)}`)
			}
			if (typeof Const_minOldPriceContent === 'number') {
				Const_whereClauseArray.push(`old_price_content >= ${Function_bind(Const_minOldPriceContent)}`)
			}
			if (typeof Const_maxOldPriceContent === 'number') {
				Const_whereClauseArray.push(`old_price_content <= ${Function_bind(Const_maxOldPriceContent)}`)
			}

			if (typeof Const_contentCreatedFrom === 'string') {
				Const_whereClauseArray.push(`datetime(content_created) >= datetime(${Function_bind(Const_contentCreatedFrom)})`)
			}
			if (typeof Const_contentCreatedTo === 'string') {
				Const_whereClauseArray.push(`datetime(content_created) <= datetime(${Function_bind(Const_contentCreatedTo)})`)
			}
			if (typeof Const_contentUpdateFrom === 'string') {
				Const_whereClauseArray.push(`datetime(content_update) >= datetime(${Function_bind(Const_contentUpdateFrom)})`)
			}
			if (typeof Const_contentUpdateTo === 'string') {
				Const_whereClauseArray.push(`datetime(content_update) <= datetime(${Function_bind(Const_contentUpdateTo)})`)
			}
			if (typeof Const_previsionContentFrom === 'string') {
				Const_whereClauseArray.push(`datetime(prevision_content) >= datetime(${Function_bind(Const_previsionContentFrom)})`)
			}
			if (typeof Const_previsionContentTo === 'string') {
				Const_whereClauseArray.push(`datetime(prevision_content) <= datetime(${Function_bind(Const_previsionContentTo)})`)
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
					content
				${Const_whereClause}
			`).bind(...Const_bindValueArray).all<{ totalCount: number }>()
			if (Const_countQueryResult.error || !Const_countQueryResult.success) {
				return Function_getResponseError({ typ: 'logical', msg: 'Error executing count query for admin content', inf: { Const_countQueryResult }, loc: Function_getFuncionName(), err: true }, 485, 'Error counting admin content')
			}

			const Const_totalCount = Number(Const_countQueryResult.results?.[0]?.totalCount || 0)
			const Const_totalPages = Const_totalCount > 0 ? Math.ceil(Const_totalCount / Const_limit) : 0

			const Const_limitPlaceholder = `?${Const_bindValueArray.length + 1}`
			const Const_offsetPlaceholder = `?${Const_bindValueArray.length + 2}`
			const Const_contentQueryResult = await Const_database.prepare(`
				SELECT
					*
				FROM
					content
				${Const_whereClause}
				ORDER BY
					${Const_orderBySql} ${Let_orderDirectionFinal.toUpperCase()}
				LIMIT ${Const_limitPlaceholder} OFFSET ${Const_offsetPlaceholder}
			`).bind(...Const_bindValueArray, Const_limit, Const_offset).all<Type_tableD1ContentGet>()
			if (Const_contentQueryResult.error || !Const_contentQueryResult.success) {
				return Function_getResponseError({ typ: 'logical', msg: 'Error executing list query for admin content', inf: { Const_contentQueryResult }, loc: Function_getFuncionName(), err: true }, 486, 'Error listing admin content')
			}
			// /\ Executa query de total e lista paginada

			const Const_responseBody: Type_GetAdminConteudoResponse = {
				contentArray: Const_contentQueryResult.results,
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
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error getting admin content', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}

