import { Function_getD1, Function_getFuncionName, Function_getResponseError, Function_getStudentAuthenticated, Function_getTrimmedStringOrUndefined, Function_isError, Function_postD1 } from "../function_global"


type Type_PostStudentDenunciaBody = {
	content_uuid_denuncia: string;
	reason_array_denuncia: Array<string>;
	extra_information_denuncia?: string | null;
}

type Type_PostStudentDenunciaResponse = {
	denuncia: {
		denuncia_uuid: Type_tableD1DenunciaGet['denuncia_uuid'];
		denuncia_created: Type_tableD1DenunciaGet['denuncia_created'];
		student_uuid_denuncia: Type_tableD1DenunciaGet['student_uuid_denuncia'];
		content_uuid_denuncia: Type_tableD1DenunciaGet['content_uuid_denuncia'];
		reason_array_denuncia: Array<string>;
		extra_information_denuncia: Type_tableD1DenunciaGet['extra_information_denuncia'];
		status_denuncia: Type_tableD1DenunciaGet['status_denuncia'];
	};
}

function Function_getReasonArrayFromUnknown(Parameter_reasonArrayUnknown: unknown): Array<string> | undefined {
	if (!Array.isArray(Parameter_reasonArrayUnknown)) {
		return undefined
	}

	const Const_reasonArraySanitized: Array<string> = []
	const Const_reasonSet = new Set<string>()
	for (const Const_reasonUnknown of Parameter_reasonArrayUnknown) {
		if (typeof Const_reasonUnknown !== 'string') {
			continue
		}

		const Const_reason = Const_reasonUnknown.trim()
		if (Const_reason.length <= 0) {
			continue
		}
		if (Const_reason.length > 120) {
			continue
		}
		if (Const_reasonSet.has(Const_reason)) {
			continue
		}

		Const_reasonSet.add(Const_reason)
		Const_reasonArraySanitized.push(Const_reason)
	}

	if (Const_reasonArraySanitized.length <= 0) {
		return undefined
	}
	if (Const_reasonArraySanitized.length > 20) {
		return undefined
	}

	return Const_reasonArraySanitized
}


export class Class_PostStudentDenuncia {
	public static async main(Parameter_request: Request, Parameter_env: Env, Parameter_context: ExecutionContext): Promise<Response> {
		try {
			// \/ Autentica aluno pelo JWT
			const Const_studentAuthenticated = await Function_getStudentAuthenticated(Parameter_request, Parameter_env, true)
			if (Function_isError(Const_studentAuthenticated)) {
				return Function_getResponseError(Const_studentAuthenticated, 451, 'Unauthorized student JWT')
			}
			// /\ Autentica aluno pelo JWT

			// \/ Le body e valida entrada
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

			const Const_body = Const_bodyUnknown as Partial<Type_PostStudentDenunciaBody>
			const Const_contentUuidDenuncia = Function_getTrimmedStringOrUndefined(Const_body.content_uuid_denuncia)
			const Const_reasonArrayDenuncia = Function_getReasonArrayFromUnknown(Const_body.reason_array_denuncia)
			if (typeof Const_contentUuidDenuncia !== 'string' || !Const_reasonArrayDenuncia) {
				return Function_getResponseError({
					typ: 'logical',
					msg: 'content_uuid_denuncia and reason_array_denuncia are required',
					inf: { Const_body },
					loc: Function_getFuncionName(),
					err: true
				}, 454, 'Missing required body fields')
			}

			const Const_hasExtraInformationField = Object.prototype.hasOwnProperty.call(Const_body, 'extra_information_denuncia')
			let Let_extraInformationDenuncia: string | null | undefined
			if (Const_hasExtraInformationField) {
				if (Const_body.extra_information_denuncia === null) {
					Let_extraInformationDenuncia = null
				}
				else {
					const Const_extraInformationDenuncia = Function_getTrimmedStringOrUndefined(Const_body.extra_information_denuncia)
					if (typeof Const_extraInformationDenuncia !== 'string') {
						return Function_getResponseError({
							typ: 'logical',
							msg: 'extra_information_denuncia must be string or null when provided',
							inf: { extra_information_denuncia: Const_body.extra_information_denuncia },
							loc: Function_getFuncionName(),
							err: true
						}, 455, 'Invalid extra_information_denuncia')
					}
					if (Const_extraInformationDenuncia.length > 4000) {
						return Function_getResponseError({
							typ: 'logical',
							msg: 'extra_information_denuncia exceeds 4000 characters',
							inf: { length: Const_extraInformationDenuncia.length },
							loc: Function_getFuncionName(),
							err: true
						}, 456, 'Invalid extra_information_denuncia length')
					}

					Let_extraInformationDenuncia = Const_extraInformationDenuncia
				}
			}
			// /\ Le body e valida entrada

			// \/ Valida conteudo no D1
			const Const_contentArray = await Function_getD1(Parameter_env, 'content', 1, 1, ['content_uuid'], {
				content_uuid: Const_contentUuidDenuncia
			})
			if (Function_isError(Const_contentArray)) {
				return Function_getResponseError(Const_contentArray, 457, 'Error validating content_uuid_denuncia')
			}
			if (Const_contentArray.length <= 0) {
				return Function_getResponseError({
					typ: 'logical',
					msg: 'content_uuid_denuncia was not found',
					inf: { Const_contentUuidDenuncia },
					loc: Function_getFuncionName(),
					err: true
				}, 458, 'Invalid content_uuid_denuncia')
			}
			// /\ Valida conteudo no D1

			// \/ Cria denuncia no D1
			const Const_reasonArrayDenunciaString = JSON.stringify(Const_reasonArrayDenuncia)
			const Const_denunciaCreated = await Function_postD1(Parameter_env, 'denuncia', {
				denuncia_uuid: crypto.randomUUID(),
				student_uuid_denuncia: Const_studentAuthenticated.student_uuid,
				content_uuid_denuncia: Const_contentUuidDenuncia,
				reason_array_denuncia: Const_reasonArrayDenunciaString,
				extra_information_denuncia: Let_extraInformationDenuncia,
				status_denuncia: 'pending'
			}, ['*'])
			if (Function_isError(Const_denunciaCreated)) {
				return Function_getResponseError(Const_denunciaCreated, 459, 'Error creating denuncia')
			}
			// /\ Cria denuncia no D1

			const Const_responseBody: Type_PostStudentDenunciaResponse = {
				denuncia: {
					denuncia_uuid: Const_denunciaCreated.denuncia_uuid,
					denuncia_created: Const_denunciaCreated.denuncia_created,
					student_uuid_denuncia: Const_denunciaCreated.student_uuid_denuncia,
					content_uuid_denuncia: Const_denunciaCreated.content_uuid_denuncia,
					reason_array_denuncia: Const_reasonArrayDenuncia,
					extra_information_denuncia: Const_denunciaCreated.extra_information_denuncia,
					status_denuncia: Const_denunciaCreated.status_denuncia
				}
			}

			return new Response(JSON.stringify(Const_responseBody), {
				status: 201,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			})
		}

		catch (Parameter_error) {
			return Function_getResponseError({ typ: 'catch', msg: 'Unhandled error posting student denuncia', inf: { Parameter_error, Parameter_context, Parameter_request, Parameter_env }, loc: Function_getFuncionName(), err: true }, 499, 'Unhandled endpoint error')
		}
	}
}
