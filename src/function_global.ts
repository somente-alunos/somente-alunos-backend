
import jwt, { JwtPayload } from '@tsndr/cloudflare-worker-jwt'


export function Function_isError(Parameter_result: unknown): Parameter_result is Type_isError {
	return typeof Parameter_result === 'object' && Parameter_result !== null && 'err' in Parameter_result
}

export async function Function_generateJwt<ParameterType_informationJwt>(Parameter_keyPrivateJwt: string | undefined, Parameter_payloadJwt: JwtPayload & ParameterType_informationJwt): Type_errorOr<Promise<string>> {
	try {
		if (typeof Parameter_keyPrivateJwt !== 'string' || Parameter_keyPrivateJwt.length <= 1) {
			return { typ: 'logical', msg: 'Invalid private key for JWT', inf: { Parameter_keyPrivateJwt }, loc: Function_getFuncionName(), err: true }
		}

		const Const_stringJwt = await jwt.sign(Parameter_payloadJwt, Parameter_keyPrivateJwt)
		return Const_stringJwt
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error generating JWT', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_verifyJwt<ParameterType_informationJwt>(Parameter_keyPrivateJwt: string | undefined, Parameter_stringJwt: string): Type_errorOr<Promise<JwtPayload & ParameterType_informationJwt>> {
	try {
		if (typeof Parameter_keyPrivateJwt !== 'string' || Parameter_keyPrivateJwt.length <= 1) {
			return { typ: 'logical', msg: 'Invalid private key for JWT', inf: { Parameter_keyPrivateJwt }, loc: Function_getFuncionName(), err: true }
		}

		const Const_isValidJwt = await jwt.verify<ParameterType_informationJwt>(Parameter_stringJwt, Parameter_keyPrivateJwt, {})
		if (Const_isValidJwt?.payload) {
			return Const_isValidJwt.payload
		}

		return { typ: 'logical', msg: 'Invalid JWT', inf: { Parameter_stringJwt }, loc: Function_getFuncionName(), err: true }
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error verifying JWT', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}


function Function_extractCookieByName(Parameter_request: Request, Parameter_cookieName: string): Type_errorOr<string> {
	try {
		const Const_cookie = Parameter_request.headers.get('cookie')
		if (typeof Const_cookie !== 'string' || Const_cookie?.length <= 1) {
			return { typ: 'logical', msg: 'No cookie found in request', inf: { Const_cookie, Parameter_cookieName }, loc: Function_getFuncionName(), err: true }
		}

		const Const_cookieArray = Const_cookie?.split(';')?.map((Parameter_single) => Parameter_single?.trim())
		const Const_cookieJwt = Const_cookieArray?.find((Parameter_single) => Parameter_single?.startsWith(`${Parameter_cookieName}=`))
		if (typeof Const_cookieJwt !== 'string' || Const_cookieJwt?.length <= 1) {
			return { typ: 'logical', msg: 'JWT cookie not found in request', inf: { Const_cookie, Const_cookieArray, Const_cookieJwt, Parameter_cookieName }, loc: Function_getFuncionName(), err: true }
		}

		const Const_cookieJwtValue = Const_cookieJwt.slice(`${Parameter_cookieName}=`.length)
		if (typeof Const_cookieJwtValue !== 'string' || Const_cookieJwtValue?.length <= 1) {
			return { typ: 'logical', msg: 'JWT cookie value is empty', inf: { Const_cookie, Const_cookieArray, Const_cookieJwt, Const_cookieJwtValue, Parameter_cookieName }, loc: Function_getFuncionName(), err: true }
		}

		return Const_cookieJwtValue
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error extracting JWT from cookie', inf: { Parameter_error, Parameter_cookieName }, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_extractCookieJwt(Parameter_request: Request, Parameter_env: Env): Type_errorOr<string> {
	try {
		const Const_cookieNameLegacy = `${Parameter_env.Env_cookiePrefix}_jwt`
		return Function_extractCookieByName(Parameter_request, Const_cookieNameLegacy)
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error extracting legacy JWT cookie', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_extractCookieStudentJwt(Parameter_request: Request, Parameter_env: Env): Type_errorOr<string> {
	try {
		const Const_cookieNameStudent = `${Parameter_env.Env_cookiePrefix}_student_jwt`
		const Const_cookieStudentJwt = Function_extractCookieByName(Parameter_request, Const_cookieNameStudent)
		if (!Function_isError(Const_cookieStudentJwt)) {
			return Const_cookieStudentJwt
		}

		return Function_extractCookieJwt(Parameter_request, Parameter_env)
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error extracting student JWT cookie', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_extractCookieAdminJwt(Parameter_request: Request, Parameter_env: Env): Type_errorOr<string> {
	try {
		const Const_cookieNameAdmin = `${Parameter_env.Env_cookiePrefix}_admin_jwt`
		const Const_cookieAdminJwt = Function_extractCookieByName(Parameter_request, Const_cookieNameAdmin)
		if (!Function_isError(Const_cookieAdminJwt)) {
			return Const_cookieAdminJwt
		}

		return Function_extractCookieJwt(Parameter_request, Parameter_env)
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error extracting admin JWT cookie', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}


export function Function_getFuncionName() {
	try {
		const Const_nameWithlocation = new Error()?.stack?.split('\n')[2]?.trim()?.replace('at ', '')
		const Const_name = Const_nameWithlocation?.split(' ')?.[0]
		return Const_name || 'Unknown'
	}

	catch {
		return 'Catch Unknown'
	}
}

export function Function_getTrimmedStringOrUndefined(Parameter_value: unknown): string | undefined {
	if (typeof Parameter_value !== 'string') {
		return undefined
	}

	const Const_valueTrimmed = Parameter_value.trim()
	return Const_valueTrimmed.length > 0 ? Const_valueTrimmed : undefined
}

export function Function_getResponseError(Parameter_isError: Type_isError, Parameter_status: number, Parameter_statusText: string): Response {
	console.log(`> ERROR [${Parameter_isError.typ}] loc: [${Parameter_isError.loc}] msg: [${Parameter_isError.msg}] inf: `, Parameter_isError.inf)
	return new Response(JSON.stringify({ success: false, error: Parameter_isError.msg }), { status: Parameter_status, statusText: Parameter_statusText, headers: { 'content-type': 'application/json; charset=utf-8' } })
}

export function Function_getContentFileR2ObjectKey(Parameter_fileUuid: string): Type_errorOr<string> {
	try {
		const Const_fileUuid = Function_getTrimmedStringOrUndefined(Parameter_fileUuid)
		if (typeof Const_fileUuid !== 'string') {
			return { typ: 'logical', msg: 'Invalid file UUID to build R2 object key', inf: { Parameter_fileUuid }, loc: Function_getFuncionName(), err: true }
		}

		return `content-file/${Const_fileUuid}`
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error building content file R2 object key', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_getValidatedStudentContentFile(Parameter_fileUnknown: unknown): Type_errorOr<{ file: File; contentType: 'application/pdf' | 'text/html'; fileExtension: 'pdf' | 'html'; }> {
	try {
		const Const_maxBytes = 5 * 1024 * 1024
		if (!(Parameter_fileUnknown instanceof File)) {
			return { typ: 'logical', msg: 'Invalid file payload type, expected File', inf: { Parameter_fileUnknownType: typeof Parameter_fileUnknown }, loc: Function_getFuncionName(), err: true }
		}

		if (!(Parameter_fileUnknown.size > 0)) {
			return { typ: 'logical', msg: 'File is empty', inf: { fileName: Parameter_fileUnknown.name, size: Parameter_fileUnknown.size }, loc: Function_getFuncionName(), err: true }
		}

		if (Parameter_fileUnknown.size > Const_maxBytes) {
			return { typ: 'logical', msg: 'File exceeds maximum size of 5MB', inf: { fileName: Parameter_fileUnknown.name, size: Parameter_fileUnknown.size, maxBytes: Const_maxBytes }, loc: Function_getFuncionName(), err: true }
		}

		const Const_fileName = Parameter_fileUnknown.name.trim().toLowerCase()
		const Const_fileMimeType = Parameter_fileUnknown.type.trim().toLowerCase()
		const Const_fileNameArray = Const_fileName.split('.')
		const Const_fileExtension = Const_fileNameArray.length > 1 ? Const_fileNameArray[Const_fileNameArray.length - 1] : ''

		const Const_isPdf = Const_fileMimeType === 'application/pdf' || Const_fileExtension === 'pdf'
		const Const_isHtml = Const_fileMimeType === 'text/html' || Const_fileMimeType.startsWith('text/html;') || Const_fileExtension === 'html' || Const_fileExtension === 'htm'
		if (!Const_isPdf && !Const_isHtml) {
			return { typ: 'logical', msg: 'File type must be PDF or HTML', inf: { fileName: Parameter_fileUnknown.name, mimeType: Parameter_fileUnknown.type }, loc: Function_getFuncionName(), err: true }
		}

		const Const_contentType: 'application/pdf' | 'text/html' = Const_isPdf ? 'application/pdf' : 'text/html'
		const Const_extension: 'pdf' | 'html' = Const_isPdf ? 'pdf' : 'html'
		return {
			file: Parameter_fileUnknown,
			contentType: Const_contentType,
			fileExtension: Const_extension
		}
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error validating student content file', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_postContentFileToR2(
	Parameter_env: Env,
	Parameter_fileUuid: string,
	Parameter_file: File,
	Parameter_contentType: 'application/pdf' | 'text/html',
	Parameter_customMetadata?: Record<string, string>
): Type_errorOr<Promise<{ objectKey: string; }>> {
	try {
		const Const_r2Bucket = Parameter_env?.R2_somenteAlunosAll2
		if (!Const_r2Bucket) {
			return { typ: 'logical', msg: 'R2 bucket not configured', inf: { Const_r2Bucket }, loc: Function_getFuncionName(), err: true }
		}

		const Const_objectKey = Function_getContentFileR2ObjectKey(Parameter_fileUuid)
		if (Function_isError(Const_objectKey)) {
			return Const_objectKey
		}

		const Const_safeFileName = Parameter_file.name.replace(/[^\w.\-]+/g, '_')
		const Const_customMetadata: Record<string, string> = {}
		if (Parameter_customMetadata && typeof Parameter_customMetadata === 'object') {
			for (const [Const_key, Const_value] of Object.entries(Parameter_customMetadata)) {
				if (typeof Const_value === 'string') {
					Const_customMetadata[Const_key] = Const_value
				}
			}
		}

		Const_customMetadata.original_file_name = Parameter_file.name
		Const_customMetadata.stored_content_type = Parameter_contentType

		const Const_r2Result = await Const_r2Bucket.put(Const_objectKey, Parameter_file, {
			httpMetadata: {
				contentType: Parameter_contentType,
				contentDisposition: `inline; filename="${Const_safeFileName}"`
			},
			customMetadata: Const_customMetadata
		})
		if (!Const_r2Result) {
			return { typ: 'logical', msg: 'Error storing file in R2 bucket', inf: { objectKey: Const_objectKey, fileUuid: Parameter_fileUuid }, loc: Function_getFuncionName(), err: true }
		}

		return { objectKey: Const_objectKey }
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error uploading content file to R2', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_getContentFileFromR2(Parameter_env: Env, Parameter_fileUuid: string): Type_errorOr<Promise<R2ObjectBody | null>> {
	try {
		const Const_r2Bucket = Parameter_env?.R2_somenteAlunosAll2
		if (!Const_r2Bucket) {
			return { typ: 'logical', msg: 'R2 bucket not configured', inf: { Const_r2Bucket }, loc: Function_getFuncionName(), err: true }
		}

		const Const_objectKey = Function_getContentFileR2ObjectKey(Parameter_fileUuid)
		if (Function_isError(Const_objectKey)) {
			return Const_objectKey
		}

		const Const_r2Object = await Const_r2Bucket.get(Const_objectKey)
		if (Const_r2Object === null) {
			return null
		}

		if (!('body' in Const_r2Object)) {
			return { typ: 'logical', msg: 'R2 object body was not returned', inf: { objectKey: Const_objectKey, fileUuid: Parameter_fileUuid }, loc: Function_getFuncionName(), err: true }
		}

		return Const_r2Object
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting content file from R2', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_deleteContentFileFromR2(Parameter_env: Env, Parameter_fileUuid: string): Type_errorOr<Promise<true>> {
	try {
		const Const_r2Bucket = Parameter_env?.R2_somenteAlunosAll2
		if (!Const_r2Bucket) {
			return { typ: 'logical', msg: 'R2 bucket not configured', inf: { Const_r2Bucket }, loc: Function_getFuncionName(), err: true }
		}

		const Const_objectKey = Function_getContentFileR2ObjectKey(Parameter_fileUuid)
		if (Function_isError(Const_objectKey)) {
			return Const_objectKey
		}

		await Const_r2Bucket.delete(Const_objectKey)
		return true
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error deleting content file from R2', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_getResponseByR2ObjectBody(Parameter_r2ObjectBody: R2ObjectBody): Response {
	const Const_headers = new Headers()
	Parameter_r2ObjectBody.writeHttpMetadata(Const_headers)
	Const_headers.set('etag', Parameter_r2ObjectBody.httpEtag)
	if (!Const_headers.has('content-type')) {
		Const_headers.set('content-type', 'application/octet-stream')
	}
	if (!Const_headers.has('content-disposition')) {
		Const_headers.set('content-disposition', `inline; filename="${Parameter_r2ObjectBody.key}"`)
	}

	return new Response(Parameter_r2ObjectBody.body, { status: 200, headers: Const_headers })
}

function Function_generateCookieJwtByName(Parameter_env: Env, Parameter_cookieName: string, Parameter_stringJwt: string, Parameter_maxAgeSeconds: number): Type_errorOr<string> {
	try {
		if (typeof Parameter_env.Env_cookiePrefix !== 'string' || Parameter_env.Env_cookiePrefix.length <= 0) {
			return { typ: 'logical', msg: 'Invalid cookie prefix in environment', inf: { Env_cookiePrefix: Parameter_env.Env_cookiePrefix }, loc: Function_getFuncionName(), err: true }
		}

		if (typeof Parameter_cookieName !== 'string' || Parameter_cookieName.length <= 0) {
			return { typ: 'logical', msg: 'Invalid cookie name to generate JWT cookie', inf: { Parameter_cookieName }, loc: Function_getFuncionName(), err: true }
		}

		if (typeof Parameter_stringJwt !== 'string' || Parameter_stringJwt.length <= 0) {
			return { typ: 'logical', msg: 'Invalid JWT string to generate cookie', inf: { Parameter_stringJwt }, loc: Function_getFuncionName(), err: true }
		}

		const Const_domainCookieSegment = typeof Parameter_env.Env_hostnameFrontend === 'string' && Parameter_env.Env_hostnameFrontend.length > 1 ? `; Domain=${Parameter_env.Env_hostnameFrontend}` : ''
		return `${Parameter_cookieName}=${Parameter_stringJwt}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${Parameter_maxAgeSeconds}${Const_domainCookieSegment}`
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error generating JWT cookie by name', inf: { Parameter_error, Parameter_cookieName }, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_generateCookieStudentJwt(Parameter_env: Env, Parameter_stringJwt: string, Parameter_maxAgeSeconds: number = 60 * 60 * 24 * 365 * 10): Type_errorOr<string> {
	try {
		const Const_cookieName = `${Parameter_env.Env_cookiePrefix}_student_jwt`
		return Function_generateCookieJwtByName(Parameter_env, Const_cookieName, Parameter_stringJwt, Parameter_maxAgeSeconds)
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error generating student JWT cookie', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_generateCookieAdminJwt(Parameter_env: Env, Parameter_stringJwt: string, Parameter_maxAgeSeconds: number = 60 * 60 * 24 * 365 * 10): Type_errorOr<string> {
	try {
		const Const_cookieName = `${Parameter_env.Env_cookiePrefix}_admin_jwt`
		return Function_generateCookieJwtByName(Parameter_env, Const_cookieName, Parameter_stringJwt, Parameter_maxAgeSeconds)
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error generating admin JWT cookie', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_verifyStudentCpfOrRaExternalApi(Parameter_raOrCpf: string, Parameter_env: Env): Promise<Type_errorOr<boolean>> {
	try {
		const Const_raOrCpf = Function_getTrimmedStringOrUndefined(Parameter_raOrCpf)

		if (typeof Const_raOrCpf !== 'string') {
			return { typ: 'logical', msg: 'Invalid RA/CPF to verify in external API', inf: { Parameter_raOrCpf }, loc: Function_getFuncionName(), err: true }
		}

		try {
			const Const_endpoint = Parameter_env.EnvSecret_verifyStudentEndpoint1
			const Const_token = Parameter_env.EnvSecret_verifyStudentToken1

			if (Const_endpoint && Const_token) {
				const Const_url = `${Const_endpoint}?id=${encodeURIComponent(Const_raOrCpf)}`

				const Const_response = await fetch(Const_url, {
					method: 'GET',
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${Const_token}`
					},
				})

				if (Const_response.ok) {
					const Const_json = await Const_response.json() as { isStudent?: boolean }

					if (Const_json?.isStudent === true) {
						return true
					}
				}
			}
		} catch { }

		try {
			const Const_endpoint = Parameter_env.EnvSecret_verifyStudentEndpoint2
			const Const_token = Parameter_env.EnvSecret_verifyStudentToken2

			if (Const_endpoint && Const_token) {
				const Const_response = await fetch(Const_endpoint, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Token ${Const_token}`,
						'X-Client-Name': 'student-platform',
					},
					body: JSON.stringify({
						studentRegistration: Const_raOrCpf,
						requestedFields: [ 'active' ],
						validationContext: 'student-access'
					}),
				})

				if (Const_response.ok) {
					const Const_json = await Const_response.json() as { user?: Array<{ active?: boolean }> }

					if (Const_json?.user?.[0]?.active === true) {
						return true
					}
				}
			}
		} catch { }

		try {
			const Const_endpoint = Parameter_env.EnvSecret_verifyStudentEndpoint3
			const Const_token = Parameter_env.EnvSecret_verifyStudentToken3

			if (Const_endpoint && Const_token) {
				const Const_response = await fetch(Const_endpoint, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						'X-Student-Verification-Token': Const_token,
					},
					body: JSON.stringify({
						input: Const_raOrCpf,
						documentType: Const_raOrCpf.length > 9 ? 'cpf' : 'ra',
						includeInstitution: true
					}),
				})

				if (Const_response.ok) {
					const Const_json = await Const_response.json() as { institution_name?: string }

					if (typeof Const_json?.institution_name === 'string' && Const_json.institution_name.trim().length > 0) {
						return true
					}
				}
			}
		} catch { }

		return false
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error verifying RA/CPF in external API', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

type Type_efiBankCredentialResolved = {
	efiBankAlias: Type_efiBankAlias;
	pixKey: string;
	clientId: string;
	clientSecret: string;
	mtlsFetcher: Fetcher;
	baseUrl: string;
}

type Type_efiBankAccessResolved = {
	efiBankAlias: Type_efiBankAlias;
	pixKey: string;
	mtlsFetcher: Fetcher;
	baseUrl: string;
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	scope: string;
}

async function Function_getResponseTextAndJson(Parameter_response: Response): Promise<{ text: string; json: unknown | undefined; }> {
	const Const_text = await Parameter_response.text()
	try {
		return { text: Const_text, json: JSON.parse(Const_text) as unknown }
	}
	catch {
		return { text: Const_text, json: undefined }
	}
}

export function Function_isValidEfiBankTxid(Parameter_txid: string): boolean {
	return typeof Parameter_txid === 'string' && /^[a-zA-Z0-9]{26,35}$/.test(Parameter_txid)
}

export function Function_generateEfiBankTxid(Parameter_entropySeed: string = ''): string {
	let Let_txid = ''
	let Let_attempt = 0
	while (!Function_isValidEfiBankTxid(Let_txid) && Let_attempt < 10) {
		Let_attempt += 1
		const Const_entropy = `${Parameter_entropySeed}${Date.now().toString(36)}${crypto.randomUUID().replace(/-/g, '')}${Math.random().toString(36).replace('.', '')}${Let_attempt.toString(36)}`
		Let_txid = Const_entropy.replace(/[^a-zA-Z0-9]/g, '').slice(0, 35)
		if (Let_txid.length < 26) {
			const Const_fill = crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '')
			Let_txid = `${Let_txid}${Const_fill}`.slice(0, 35)
		}
	}

	if (!Function_isValidEfiBankTxid(Let_txid)) {
		const Const_fallback = `${Date.now().toString(36)}${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`.replace(/[^a-zA-Z0-9]/g, '')
		Let_txid = Const_fallback.slice(0, 35)
		if (Let_txid.length < 26) {
			Let_txid = `${Let_txid}ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`.slice(0, 26)
		}
	}

	return Let_txid
}

function Function_getEfiBankBaseUrl(Parameter_env: Env): string {
	return Parameter_env.Env_environment === 'production' ? 'https://pix.api.efipay.com.br' : 'https://pix-h.api.efipay.com.br'
}

function Function_getEfiBankAliasArray(Parameter_efiBankAliasPreferred?: Type_efiBankAlias): Array<Type_efiBankAlias> {
	const Const_aliasArray: Array<Type_efiBankAlias> = []
	if (Parameter_efiBankAliasPreferred === 'gp' || Parameter_efiBankAliasPreferred === 'rp' || Parameter_efiBankAliasPreferred === 'rc') {
		Const_aliasArray.push(Parameter_efiBankAliasPreferred)
	}

	for (const Const_alias of ['gp', 'rp', 'rc'] as Array<Type_efiBankAlias>) {
		if (!Const_aliasArray.includes(Const_alias)) {
			Const_aliasArray.push(Const_alias)
		}
	}

	return Const_aliasArray
}

export function Function_getEfiBankAliasOrUndefined(Parameter_value: unknown): Type_efiBankAlias | undefined {
	const Const_alias = Function_getTrimmedStringOrUndefined(Parameter_value)?.toLowerCase()
	if (Const_alias === 'gp' || Const_alias === 'rp' || Const_alias === 'rc') {
		return Const_alias
	}

	return undefined
}

export function Function_getEfiWebhookToken(Parameter_env: Env): Type_errorOr<string> {
	try {
		const Const_webhookToken = Function_getTrimmedStringOrUndefined(Parameter_env.EnvSecret_tokenWebhookEfiBank)
		if (typeof Const_webhookToken !== 'string') {
			return { typ: 'logical', msg: 'Invalid Efi webhook token in environment', inf: { EnvSecret_tokenWebhookEfiBank: Parameter_env.EnvSecret_tokenWebhookEfiBank }, loc: Function_getFuncionName(), err: true }
		}

		return Const_webhookToken
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting Efi webhook token', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_getEfiBankCredentialResolved(Parameter_env: Env, Parameter_efiBankAliasPreferred?: Type_efiBankAlias): Type_errorOr<Type_efiBankCredentialResolved> {
	try {
		const Const_efiBankAliasArray = Function_getEfiBankAliasArray(Parameter_efiBankAliasPreferred)
		for (const Const_efiBankAlias of Const_efiBankAliasArray) {
			const Const_pixKey = Function_getTrimmedStringOrUndefined(Const_efiBankAlias === 'gp' ? Parameter_env.EnvSecret_keyPixGP : Const_efiBankAlias === 'rp' ? Parameter_env.EnvSecret_keyPixRP : Parameter_env.EnvSecret_keyPixRC)
			const Const_clientId = Function_getTrimmedStringOrUndefined(Const_efiBankAlias === 'gp' ? Parameter_env.EnvSecret_keyClientIdEfiBankGP : Const_efiBankAlias === 'rp' ? Parameter_env.EnvSecret_keyClientIdEfiBankRP : Parameter_env.EnvSecret_keyClientIdEfiBankRC)
			const Const_clientSecret = Function_getTrimmedStringOrUndefined(Const_efiBankAlias === 'gp' ? Parameter_env.EnvSecret_keyClientSecretEfiBankGP : Const_efiBankAlias === 'rp' ? Parameter_env.EnvSecret_keyClientSecretEfiBankRP : Parameter_env.EnvSecret_keyClientSecretEfiBankRC)
			const Const_mtlsFetcher = Const_efiBankAlias === 'gp' ? Parameter_env.MtlsCertificates_efiBankGP : Const_efiBankAlias === 'rp' ? Parameter_env.MtlsCertificates_efiBankRP : Parameter_env.MtlsCertificates_efiBankRC
			const Const_isValidCredential = typeof Const_pixKey === 'string' && typeof Const_clientId === 'string' && typeof Const_clientSecret === 'string' && !!Const_mtlsFetcher
			if (Const_isValidCredential) {
				return { efiBankAlias: Const_efiBankAlias, pixKey: Const_pixKey, clientId: Const_clientId, clientSecret: Const_clientSecret, mtlsFetcher: Const_mtlsFetcher as Fetcher, baseUrl: Function_getEfiBankBaseUrl(Parameter_env) }
			}

			if (Parameter_efiBankAliasPreferred === Const_efiBankAlias) {
				return { typ: 'logical', msg: 'Selected Efi alias is not fully configured', inf: { efiBankAlias: Const_efiBankAlias, hasPixKey: typeof Const_pixKey === 'string', hasClientId: typeof Const_clientId === 'string', hasClientSecret: typeof Const_clientSecret === 'string', hasMtlsFetcher: !!Const_mtlsFetcher }, loc: Function_getFuncionName(), err: true }
			}
		}

		return { typ: 'logical', msg: 'No Efi account credentials are fully configured', inf: { Parameter_efiBankAliasPreferred }, loc: Function_getFuncionName(), err: true }
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error resolving Efi account credentials', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_generateEfiBankAccessToken(Parameter_env: Env, Parameter_efiBankAliasPreferred?: Type_efiBankAlias): Type_errorOr<Promise<Type_efiBankAccessResolved>> {
	try {
		const Const_efiCredential = Function_getEfiBankCredentialResolved(Parameter_env, Parameter_efiBankAliasPreferred)
		if (Function_isError(Const_efiCredential)) {
			return Const_efiCredential
		}

		const Const_authBase64 = btoa(`${Const_efiCredential.clientId}:${Const_efiCredential.clientSecret}`)
		const Const_response = await Const_efiCredential.mtlsFetcher.fetch(`${Const_efiCredential.baseUrl}/oauth/token`, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${Const_authBase64}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({ grant_type: 'client_credentials' }),
		})
		const Const_responseRaw = await Function_getResponseTextAndJson(Const_response)
		if (!Const_response.ok) {
			return { typ: 'logical', msg: 'Error generating Efi access token', inf: { efiBankAlias: Const_efiCredential.efiBankAlias, status: Const_response.status, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
		}

		const Const_responseJson = Const_responseRaw.json as Type_efiBankOauthTokenResponse | undefined
		const Const_accessToken = Function_getTrimmedStringOrUndefined(Const_responseJson?.access_token)
		if (typeof Const_accessToken !== 'string') {
			return { typ: 'logical', msg: 'Efi access token was not returned', inf: { efiBankAlias: Const_efiCredential.efiBankAlias, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
		}

		return {
			efiBankAlias: Const_efiCredential.efiBankAlias,
			pixKey: Const_efiCredential.pixKey,
			mtlsFetcher: Const_efiCredential.mtlsFetcher,
			baseUrl: Const_efiCredential.baseUrl,
			accessToken: Const_accessToken,
			tokenType: Function_getTrimmedStringOrUndefined(Const_responseJson?.token_type) || 'Bearer',
			expiresIn: typeof Const_responseJson?.expires_in === 'number' ? Const_responseJson.expires_in : 3600,
			scope: Function_getTrimmedStringOrUndefined(Const_responseJson?.scope) || ''
		}
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error generating Efi access token', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export function Function_getEfiWebhookUrlWithToken(Parameter_webhookUrlBase: string, Parameter_webhookToken: string): Type_errorOr<string> {
	try {
		const Const_webhookUrlBase = Function_getTrimmedStringOrUndefined(Parameter_webhookUrlBase)
		const Const_webhookToken = Function_getTrimmedStringOrUndefined(Parameter_webhookToken)
		if (typeof Const_webhookUrlBase !== 'string' || typeof Const_webhookToken !== 'string') {
			return { typ: 'logical', msg: 'Invalid webhook URL base or token', inf: { Parameter_webhookUrlBase, hasWebhookToken: typeof Parameter_webhookToken === 'string' }, loc: Function_getFuncionName(), err: true }
		}

		const Const_webhookUrl = new URL(Const_webhookUrlBase)
		Const_webhookUrl.searchParams.set('token', Const_webhookToken)
		Const_webhookUrl.searchParams.set('ignorar', '')
		return Const_webhookUrl.toString()
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error building Efi webhook URL with token', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_putEfiBankWebhook(Parameter_efiAccess: Type_efiBankAccessResolved, Parameter_webhookUrl: string, Parameter_skipMtlsChecking: boolean = true): Type_errorOr<Promise<{ status: number; responseBody: string; }>> {
	try {
		const Const_webhookUrl = Function_getTrimmedStringOrUndefined(Parameter_webhookUrl)
		if (typeof Const_webhookUrl !== 'string') {
			return { typ: 'logical', msg: 'Invalid webhook URL to configure on Efi', inf: { Parameter_webhookUrl }, loc: Function_getFuncionName(), err: true }
		}

		const Const_header: Record<string, string> = {
			Authorization: `${Parameter_efiAccess.tokenType} ${Parameter_efiAccess.accessToken}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		}
		if (Parameter_skipMtlsChecking) {
			Const_header['x-skip-mtls-checking'] = 'true'
		}

		const Const_response = await Parameter_efiAccess.mtlsFetcher.fetch(`${Parameter_efiAccess.baseUrl}/v2/webhook/${Parameter_efiAccess.pixKey}`, {
			method: 'PUT',
			headers: Const_header,
			body: JSON.stringify({ webhookUrl: Const_webhookUrl })
		})
		const Const_responseRaw = await Function_getResponseTextAndJson(Const_response)
		if (!Const_response.ok) {
			return { typ: 'logical', msg: 'Error configuring Efi webhook', inf: { efiBankAlias: Parameter_efiAccess.efiBankAlias, status: Const_response.status, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
		}

		return { status: Const_response.status, responseBody: Const_responseRaw.text }
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error configuring Efi webhook', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_getEfiBankWebhook(Parameter_efiAccess: Type_efiBankAccessResolved): Type_errorOr<Promise<{ status: number; responseBody: string; responseBodyJson?: unknown; }>> {
	try {
		const Const_response = await Parameter_efiAccess.mtlsFetcher.fetch(`${Parameter_efiAccess.baseUrl}/v2/webhook/${Parameter_efiAccess.pixKey}`, {
			method: 'GET',
			headers: {
				Authorization: `${Parameter_efiAccess.tokenType} ${Parameter_efiAccess.accessToken}`,
				Accept: 'application/json'
			}
		})
		const Const_responseRaw = await Function_getResponseTextAndJson(Const_response)
		if (!Const_response.ok) {
			return { typ: 'logical', msg: 'Error fetching Efi webhook configuration', inf: { efiBankAlias: Parameter_efiAccess.efiBankAlias, status: Const_response.status, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
		}

		return { status: Const_response.status, responseBody: Const_responseRaw.text, responseBodyJson: Const_responseRaw.json }
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error fetching Efi webhook configuration', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_getEfiBankCobByTxid(Parameter_efiAccess: Type_efiBankAccessResolved, Parameter_txid: string): Type_errorOr<Promise<Type_efiBankCobResponse>> {
	try {
		const Const_txid = Function_getTrimmedStringOrUndefined(Parameter_txid)
		if (typeof Const_txid !== 'string' || !Function_isValidEfiBankTxid(Const_txid)) {
			return { typ: 'logical', msg: 'Invalid txid to get Efi cob', inf: { Parameter_txid }, loc: Function_getFuncionName(), err: true }
		}

		const Const_response = await Parameter_efiAccess.mtlsFetcher.fetch(`${Parameter_efiAccess.baseUrl}/v2/cob/${Const_txid}`, {
			method: 'GET',
			headers: {
				Authorization: `${Parameter_efiAccess.tokenType} ${Parameter_efiAccess.accessToken}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			}
		})
		const Const_responseRaw = await Function_getResponseTextAndJson(Const_response)
		if (!Const_response.ok) {
			return { typ: 'logical', msg: 'Error getting Efi cob by txid', inf: { efiBankAlias: Parameter_efiAccess.efiBankAlias, txid: Const_txid, status: Const_response.status, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
		}

		const Const_responseJson = Const_responseRaw.json as Type_efiBankCobResponse | undefined
		if (!Const_responseJson || typeof Const_responseJson !== 'object') {
			return { typ: 'logical', msg: 'Invalid Efi cob response body', inf: { efiBankAlias: Parameter_efiAccess.efiBankAlias, txid: Const_txid, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
		}

		return Const_responseJson
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting Efi cob by txid', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_createEfiBankCobByTxid(
	Parameter_efiAccess: Type_efiBankAccessResolved,
	Parameter_txid: string,
	Parameter_amountOriginal: string,
	Parameter_solicitacaoPagador: string,
	Parameter_expirationSeconds: number = 48 * 60 * 60
): Type_errorOr<Promise<Type_efiBankCobResponse>> {
	try {
		const Const_txid = Function_getTrimmedStringOrUndefined(Parameter_txid)
		const Const_amountOriginal = Function_getTrimmedStringOrUndefined(Parameter_amountOriginal)
		const Const_solicitacaoPagador = Function_getTrimmedStringOrUndefined(Parameter_solicitacaoPagador)
		if (typeof Const_txid !== 'string' || !Function_isValidEfiBankTxid(Const_txid)) {
			return { typ: 'logical', msg: 'Invalid txid to create Efi cob', inf: { Parameter_txid }, loc: Function_getFuncionName(), err: true }
		}
		if (typeof Const_amountOriginal !== 'string') {
			return { typ: 'logical', msg: 'Invalid amount to create Efi cob', inf: { Parameter_amountOriginal }, loc: Function_getFuncionName(), err: true }
		}
		if (typeof Const_solicitacaoPagador !== 'string') {
			return { typ: 'logical', msg: 'Invalid description to create Efi cob', inf: { Parameter_solicitacaoPagador }, loc: Function_getFuncionName(), err: true }
		}

		const Const_response = await Parameter_efiAccess.mtlsFetcher.fetch(`${Parameter_efiAccess.baseUrl}/v2/cob/${Const_txid}`, {
			method: 'PUT',
			headers: {
				Authorization: `${Parameter_efiAccess.tokenType} ${Parameter_efiAccess.accessToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				calendario: {
					expiracao: Parameter_expirationSeconds
				},
				valor: {
					original: Const_amountOriginal
				},
				chave: Parameter_efiAccess.pixKey,
				solicitacaoPagador: Const_solicitacaoPagador.slice(0, 140),
			})
		})
		const Const_responseRaw = await Function_getResponseTextAndJson(Const_response)
		if (Const_response.ok) {
			const Const_responseJson = Const_responseRaw.json as Type_efiBankCobResponse | undefined
			if (!Const_responseJson || typeof Const_responseJson !== 'object') {
				return { typ: 'logical', msg: 'Invalid Efi cob create success response body', inf: { efiBankAlias: Parameter_efiAccess.efiBankAlias, txid: Const_txid, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
			}

			return Const_responseJson
		}

		const Const_errorJson = Const_responseRaw.json as Type_efiBankCobResponse | undefined
		const Const_isDuplicatedTxid = Const_response.status === 409 && Const_errorJson?.nome === 'txid_duplicado'
		if (Const_isDuplicatedTxid) {
			const Const_existingCob = await Function_getEfiBankCobByTxid(Parameter_efiAccess, Const_txid)
			if (Function_isError(Const_existingCob)) {
				return Const_existingCob
			}

			return Const_existingCob
		}

		return { typ: 'logical', msg: 'Error creating Efi cob by txid', inf: { efiBankAlias: Parameter_efiAccess.efiBankAlias, txid: Const_txid, status: Const_response.status, responseBody: Const_responseRaw.text }, loc: Function_getFuncionName(), err: true }
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error creating Efi cob by txid', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}


export async function Function_getD1<
	ParameterType_table extends Type_orNameTableD1,
	ParameterType_column extends Array<keyof Type_mapTableD1Get[ParameterType_table] | '*'>
>(
	Parameter_env: Env,
	Parameter_table: ParameterType_table,
	Parameter_limit: number,
	Parameter_page: number,
	Parameter_column: ParameterType_column,
	Parameter_dataWhere?: Partial<Type_mapTableD1Get[ParameterType_table]>,
): Type_errorOr<Promise<Array<Type_returnGetD1<ParameterType_table, ParameterType_column>>>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		const Const_offset = (Parameter_page - 1) * Parameter_limit

		const Const_columnString = Parameter_column?.includes('*') ? '*' : Parameter_column?.join(', ')

		const Const_keyArrayValueArrayWhere = Parameter_dataWhere
			? Object.entries(Parameter_dataWhere)?.filter(([, Parameter_value]) => Parameter_value !== undefined)
			: []

		const Const_keyWhereArray = Const_keyArrayValueArrayWhere?.map(([Parameter_key]) => Parameter_key)
		const Const_valueWhereArray = Const_keyArrayValueArrayWhere?.map(([, Parameter_value]) => Parameter_value)

		const Const_whereString = Const_keyWhereArray?.length
			? Const_keyWhereArray?.map((Parameter_single, Parameter_index) => `${Parameter_single} = ?${Parameter_index + 1}`)?.join(' AND ')
			: ''

		const Const_limitIndex = Const_valueWhereArray.length + 1
		const Const_offsetIndex = Const_valueWhereArray.length + 2

		const Const_d1Result = await Const_D1Database.prepare(`
			SELECT
				${Const_columnString}
			FROM
				${Parameter_table}
			${Const_whereString
				? `WHERE ${Const_whereString}`
				: ''}
			LIMIT ?${Const_limitIndex} OFFSET ?${Const_offsetIndex}
		`).bind(...Const_valueWhereArray, Parameter_limit, Const_offset).all<Type_mapTableD1Get[ParameterType_table]>()

		if (Const_d1Result.error || !Const_d1Result.success) {
			return { typ: 'logical', msg: 'Error executing D1 query', inf: { Const_d1Result }, loc: Function_getFuncionName(), err: true }
		}

		return Const_d1Result.results
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting D1 rows', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_postD1<
	ParameterType_table extends Type_orNameTableD1,
	ParameterType_column extends Array<keyof Type_mapTableD1Get[ParameterType_table] | '*'>
>(
	Parameter_env: Env,
	Parameter_table: ParameterType_table,
	Parameter_dataInsert: Type_mapTableD1Post[ParameterType_table],
	Parameter_columnReturning: ParameterType_column
): Type_errorOr<Promise<Type_returnGetD1<ParameterType_table, ParameterType_column>>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		const Const_keyArrayValueArray = Object.entries(Parameter_dataInsert)?.filter(([, Parameter_value]) => Parameter_value !== undefined)
		if (Const_keyArrayValueArray.length === 0) {
			return { typ: 'logical', msg: 'Insert data is empty', inf: { Parameter_dataInsert }, loc: Function_getFuncionName(), err: true }
		}

		const Const_keyArray = Const_keyArrayValueArray?.map(([Parameter_key]) => Parameter_key)
		const Const_valueArray = Const_keyArrayValueArray?.map(([, Parameter_value]) => Parameter_value)

		const Const_questionMarkFormatted = Const_keyArray?.map((Parameter_single, Parameter_index) => `?${Parameter_index + 1}`)?.join(', ')

		const Const_columnReturnString = Parameter_columnReturning?.includes('*') ? '*' : Parameter_columnReturning?.join(', ')

		const Const_d1Result = await Const_D1Database.prepare(`
			INSERT INTO
				${Parameter_table} (${Const_keyArray?.join(', ')})
			VALUES
				(${Const_questionMarkFormatted})
			RETURNING
				${Const_columnReturnString}
		`).bind(...Const_valueArray).all<Type_mapTableD1Get[ParameterType_table]>()

		if (Const_d1Result.error || !Const_d1Result.success) {
			return { typ: 'logical', msg: 'Error executing D1 insert', inf: { Const_d1Result }, loc: Function_getFuncionName(), err: true }
		}

		return Const_d1Result.results?.[0]
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error inserting D1 rows', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_patchD1<
	ParameterType_table extends Type_orNameTableD1,
	ParameterType_column extends Array<keyof Type_mapTableD1Get[ParameterType_table] | '*'>
>(
	Parameter_env: Env,
	Parameter_table: ParameterType_table,
	Parameter_dataUpdate: Partial<Type_mapTableD1Get[ParameterType_table]>,
	Parameter_dataWhere: Partial<Type_mapTableD1Patch[ParameterType_table]>,
	Parameter_columnReturning: ParameterType_column
): Type_errorOr<Promise<Type_returnGetD1<ParameterType_table, ParameterType_column>>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		const Const_keyArrayValueArrayUpdate = Object.entries(Parameter_dataUpdate)?.filter(([, Parameter_value]) => Parameter_value !== undefined)
		if (Const_keyArrayValueArrayUpdate.length === 0) {
			return { typ: 'logical', msg: 'Update data is empty', inf: { Parameter_dataUpdate }, loc: Function_getFuncionName(), err: true }
		}

		const Const_keyArrayValueArrayWhere = Object.entries(Parameter_dataWhere)?.filter(([, Parameter_value]) => Parameter_value !== undefined)
		if (Const_keyArrayValueArrayWhere.length === 0) {
			return { typ: 'logical', msg: 'Update filter is empty', inf: { Parameter_dataWhere }, loc: Function_getFuncionName(), err: true }
		}

		const Const_keyUpdateArray = Const_keyArrayValueArrayUpdate?.map(([Parameter_key]) => Parameter_key)
		const Const_valueUpdateArray = Const_keyArrayValueArrayUpdate?.map(([, Parameter_value]) => Parameter_value)

		const Const_keyWhereArray = Const_keyArrayValueArrayWhere?.map(([Parameter_key]) => Parameter_key)
		const Const_valueWhereArray = Const_keyArrayValueArrayWhere?.map(([, Parameter_value]) => Parameter_value)

		const Const_setString = Const_keyUpdateArray?.map((Parameter_single, Parameter_index) => `${Parameter_single} = ?${Parameter_index + 1}`)?.join(', ')
		const Const_whereString = Const_keyWhereArray?.map((Parameter_single, Parameter_index) => `${Parameter_single} = ?${Parameter_index + 1 + Const_keyUpdateArray.length}`)?.join(' AND ')

		const Const_columnReturnString = Parameter_columnReturning?.includes('*') ? '*' : Parameter_columnReturning?.join(', ')

		const Const_d1Result = await Const_D1Database.prepare(`
			UPDATE
				${Parameter_table}
			SET
				${Const_setString}
			WHERE
				rowid IN (
					SELECT
						rowid
					FROM
						${Parameter_table}
					WHERE
						${Const_whereString}
					LIMIT 1
				)
			RETURNING
				${Const_columnReturnString}
		`).bind(...Const_valueUpdateArray, ...Const_valueWhereArray).all<Type_returnGetD1<ParameterType_table, ParameterType_column>>()

		if (Const_d1Result.error || !Const_d1Result.success) {
			return { typ: 'logical', msg: 'Error executing D1 update', inf: { Const_d1Result }, loc: Function_getFuncionName(), err: true }
		}

		return Const_d1Result.results?.[0]
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error updating D1 rows', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_deleteD1<
	ParameterType_table extends Type_orNameTableD1
>(
	Parameter_env: Env,
	Parameter_table: ParameterType_table,
	Parameter_dataWhere: Partial<Type_mapTableD1Get[ParameterType_table]>
): Type_errorOr<Promise<true>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		const Const_keyArrayValueArrayWhere = Object.entries(Parameter_dataWhere)?.filter(([, Parameter_value]) => Parameter_value !== undefined)
		if (Const_keyArrayValueArrayWhere.length === 0) {
			return { typ: 'logical', msg: 'Delete filter is empty', inf: { Parameter_dataWhere }, loc: Function_getFuncionName(), err: true }
		}

		const Const_keyWhereArray = Const_keyArrayValueArrayWhere?.map(([Parameter_key]) => Parameter_key)
		const Const_valueWhereArray = Const_keyArrayValueArrayWhere?.map(([, Parameter_value]) => Parameter_value)

		const Const_whereString = Const_keyWhereArray?.map((Parameter_single, Parameter_index) => `${Parameter_single} = ?${Parameter_index + 1}`)?.join(' AND ')

		const Const_d1Result = await Const_D1Database.prepare(`
			DELETE FROM
				${Parameter_table}
			WHERE
				rowid IN (
					SELECT
						rowid
					FROM
						${Parameter_table}
					WHERE
						${Const_whereString}
					LIMIT 1
				)
		`).bind(...Const_valueWhereArray).run()

		if (Const_d1Result.error || !Const_d1Result.success) {
			return { typ: 'logical', msg: 'Error executing D1 delete', inf: { Const_d1Result }, loc: Function_getFuncionName(), err: true }
		}

		return true
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error deleting D1 rows', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_getAdminAuthenticated<TypeParameter extends boolean>(Parameter_request: Request, Parameter_env: Env, Parameter_returnData: TypeParameter): Type_errorOr<Promise<TypeParameter extends true ? Type_tableD1AdminGet : true>> {
	try {
		let Let_adminUuidJwt: string | undefined

		const Const_url = new URL(Parameter_request.url)
		const Const_tokenBetweenServerReceived = Const_url.searchParams.get('tokenBetweenServer')

		if (Parameter_env.EnvSecret_tokenBetweenServer === Const_tokenBetweenServerReceived) {
			if (!Parameter_returnData) {
				return true as TypeParameter extends true ? Type_tableD1AdminGet : true
			}

			const Const_studentUuidBetweenServer = Const_url.searchParams.get('adminUuid')
			if (typeof Const_studentUuidBetweenServer === 'string' && Const_studentUuidBetweenServer.length > 1) {
				Let_adminUuidJwt = Const_studentUuidBetweenServer
			}
			else {
				return {
					typ: 'logical',
					msg: 'Invalid admin UUID received between servers',
					inf: { Const_tokenBetweenServerReceived, Const_studentUuidBetweenServer },
					loc: Function_getFuncionName(),
					err: true
				}
			}
		}

		if (!Let_adminUuidJwt) {
			const Const_cookieJwt = Function_extractCookieAdminJwt(Parameter_request, Parameter_env)
			if (Function_isError(Const_cookieJwt)) {
				return Const_cookieJwt
			}

			const Const_payloadJwtAdmin = await Function_verifyJwt<Type_payloadJwtAdmin>(Parameter_env.EnvSecret_keyPrivateJwtAdmin, Const_cookieJwt)
			if (Function_isError(Const_payloadJwtAdmin)) {
				return Const_payloadJwtAdmin
			}

			if (!Parameter_returnData && Const_payloadJwtAdmin?.tar?.admin_uuid) {
				return true as TypeParameter extends true ? Type_tableD1AdminGet : true
			}

			Let_adminUuidJwt = Const_payloadJwtAdmin?.tar?.admin_uuid
			if (typeof Let_adminUuidJwt !== 'string' || Let_adminUuidJwt.length <= 1) {
				return {
					typ: 'logical',
					msg: 'Invalid admin UUID inside JWT payload',
					inf: { Const_payloadJwtAdmin },
					loc: Function_getFuncionName(),
					err: true
				}
			}

			const Const_expJwt = Const_payloadJwtAdmin?.exp
			const Const_nowSeconds = Math.floor(Date.now() / 1000)
			if (typeof Const_expJwt !== 'number' || Const_expJwt <= Const_nowSeconds) {
				return {
					typ: 'logical',
					msg: 'Expired admin JWT',
					inf: { Const_payloadJwtAdmin, Const_nowSeconds },
					loc: Function_getFuncionName(),
					err: true
				}
			}
		}

		const Const_adminArray = await Function_getD1(Parameter_env, 'admin', 1, 1, ['*'], {
			admin_uuid: Let_adminUuidJwt
		})
		if (Function_isError(Const_adminArray)) {
			return Const_adminArray
		}

		const Const_admin = Const_adminArray?.[0]
		if (!Const_admin) {
			return {
				typ: 'logical',
				msg: 'Admin not found',
				inf: { Let_adminUuidJwt, Const_adminArray },
				loc: Function_getFuncionName(),
				err: true
			}
		}

		return Const_admin as TypeParameter extends true ? Type_tableD1AdminGet : true
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error authenticating admin', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_getStudentAuthenticated<TypeParameter extends boolean>(Parameter_request: Request, Parameter_env: Env, Parameter_returnData: TypeParameter): Type_errorOr<Promise<TypeParameter extends true ? Type_tableD1StudentGet : true>> {
	try {
		let Let_studentUuidJwt: string | undefined

		const Const_url = new URL(Parameter_request.url)
		const Const_tokenBetweenServerReceived = Const_url.searchParams.get('tokenBetweenServer')

		if (Parameter_env.EnvSecret_tokenBetweenServer === Const_tokenBetweenServerReceived) {
			if (!Parameter_returnData) {
				return true as TypeParameter extends true ? Type_tableD1StudentGet : true
			}

			const Const_studentUuidBetweenServer = Const_url.searchParams.get('studentUuid')
			if (typeof Const_studentUuidBetweenServer === 'string' && Const_studentUuidBetweenServer.length > 1) {
				Let_studentUuidJwt = Const_studentUuidBetweenServer
			}
			else {
				return {
					typ: 'logical',
					msg: 'Invalid student UUID received between servers',
					inf: { Const_tokenBetweenServerReceived, Const_studentUuidBetweenServer },
					loc: Function_getFuncionName(),
					err: true
				}
			}
		}

		if (!Let_studentUuidJwt) {
			const Const_cookieJwt = Function_extractCookieStudentJwt(Parameter_request, Parameter_env)
			if (Function_isError(Const_cookieJwt)) {
				return Const_cookieJwt
			}

			const Const_payloadJwtStudent = await Function_verifyJwt<Type_payloadJwtStudent>(Parameter_env.EnvSecret_keyPrivateJwtStudent, Const_cookieJwt)
			if (Function_isError(Const_payloadJwtStudent)) {
				return Const_payloadJwtStudent
			}

			if (!Parameter_returnData && Const_payloadJwtStudent?.tar?.student_uuid) {
				return true as TypeParameter extends true ? Type_tableD1StudentGet : true
			}

			Let_studentUuidJwt = Const_payloadJwtStudent?.tar?.student_uuid
			if (typeof Let_studentUuidJwt !== 'string' || Let_studentUuidJwt.length <= 1) {
				return {
					typ: 'logical',
					msg: 'Invalid student UUID inside JWT payload',
					inf: { Const_payloadJwtStudent },
					loc: Function_getFuncionName(),
					err: true
				}
			}

			const Const_expJwt = Const_payloadJwtStudent?.exp
			const Const_nowSeconds = Math.floor(Date.now() / 1000)
			if (typeof Const_expJwt !== 'number' || Const_expJwt <= Const_nowSeconds) {
				return {
					typ: 'logical',
					msg: 'Expired student JWT',
					inf: { Const_payloadJwtStudent, Const_nowSeconds },
					loc: Function_getFuncionName(),
					err: true
				}
			}
		}

		const Const_studentArray = await Function_getD1(Parameter_env, 'student', 1, 1, ['*'], {
			student_uuid: Let_studentUuidJwt
		})
		if (Function_isError(Const_studentArray)) {
			return Const_studentArray
		}

		const Const_student = Const_studentArray?.[0]
		if (!Const_student) {
			return {
				typ: 'logical',
				msg: 'Student not found',
				inf: { Const_studentUuidJwt: Let_studentUuidJwt, Const_studentArray },
				loc: Function_getFuncionName(),
				err: true
			}
		}

		return Const_student as TypeParameter extends true ? Type_tableD1StudentGet : true
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error authenticating student', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_getStudentAcquiredContentUuidArray(
	Parameter_env: Env,
	Parameter_studentUuidBuyer: Type_tableD1SaleHistoryGet['student_uuid_buyer_sale_history']
): Type_errorOr<Promise<Array<Type_tableD1SaleHistoryGet['content_uuid_sale_history']>>> {
	try {
		if (typeof Parameter_studentUuidBuyer !== 'string' || Parameter_studentUuidBuyer.length <= 1) {
			return {
				typ: 'logical',
				msg: 'Invalid student UUID buyer',
				inf: { Parameter_studentUuidBuyer },
				loc: Function_getFuncionName(),
				err: true
			}
		}

		const Const_saleHistoryArray = await Function_getD1(Parameter_env, 'sale_history', 999999, 1, ['content_uuid_sale_history'], {
			student_uuid_buyer_sale_history: Parameter_studentUuidBuyer,
			status_sale_history: 'completed'
		})
		if (Function_isError(Const_saleHistoryArray)) {
			return Const_saleHistoryArray
		}

		const Const_contentUuidArray: Array<Type_tableD1SaleHistoryGet['content_uuid_sale_history']> = []
		for (const Const_saleHistorySingle of Const_saleHistoryArray) {
			if (typeof Const_saleHistorySingle.content_uuid_sale_history === 'string' && Const_saleHistorySingle.content_uuid_sale_history.length > 1) {
				Const_contentUuidArray.push(Const_saleHistorySingle.content_uuid_sale_history)
			}
		}

		return Const_contentUuidArray
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting acquired content UUID array', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}

export async function Function_getContentByCollegeCourseClass(
	Parameter_env: Env,
	Parameter_collegeUuidContent: Type_tableD1ContentGet['college_uuid_content'],
	Parameter_courseUuidContent: Type_tableD1ContentGet['course_uuid_content'],
	Parameter_classContent: Type_tableD1ContentGet['class_content']
): Type_errorOr<Promise<Array<Type_tableD1ContentGet>>> {
	try {
		const Const_D1Database = Parameter_env?.D1_somenteAlunosAll2
		if (!Const_D1Database) {
			return { typ: 'logical', msg: 'D1 database not configured', inf: { Const_D1Database }, loc: Function_getFuncionName(), err: true }
		}

		const Const_isValidClass = typeof Parameter_classContent === 'string' && Parameter_classContent.trim().length > 0
		const Const_classContent = Const_isValidClass ? Parameter_classContent.trim() : null

		const Const_d1Result = Const_isValidClass
			? await Const_D1Database.prepare(`
				SELECT
					*
				FROM
					content
				WHERE
					college_uuid_content = ?1
					AND course_uuid_content = ?2
					AND verified_content = 1
					AND (class_content IS NULL OR class_content = ?3)
				ORDER BY
					content_update DESC
			`).bind(Parameter_collegeUuidContent, Parameter_courseUuidContent, Const_classContent).all<Type_tableD1ContentGet>()
			: await Const_D1Database.prepare(`
				SELECT
					*
				FROM
					content
				WHERE
					college_uuid_content = ?1
					AND course_uuid_content = ?2
					AND verified_content = 1
					AND class_content IS NULL
				ORDER BY
					content_update DESC
			`).bind(Parameter_collegeUuidContent, Parameter_courseUuidContent).all<Type_tableD1ContentGet>()

		if (Const_d1Result.error || !Const_d1Result.success) {
			return { typ: 'logical', msg: 'Error executing D1 content query by college/course/class', inf: { Const_d1Result }, loc: Function_getFuncionName(), err: true }
		}

		return Const_d1Result.results
	}

	catch (Parameter_error) {
		return { typ: 'catch', msg: 'Error getting content by college/course/class', inf: Parameter_error, loc: Function_getFuncionName(), err: true }
	}
}
